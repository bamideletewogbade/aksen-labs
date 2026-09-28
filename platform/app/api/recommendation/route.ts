import { withRequestLog } from '@/lib/request-log';
import { NextResponse } from 'next/server';
import { chatComplete, type ChatMessage } from '@/lib/openrouter';
import { askJev } from '@/lib/jev';
import { logAgentRun } from '@/lib/agent-runs';
import { getDb } from '@/db';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { pricingGroups } from '@/lib/pricing';
import {
  intakeTranscript,
  parseIntake,
  type MapperIntake,
} from '@/lib/mapper-questions';
import { mapperFallback } from '@/lib/mapper-fallback';
import {
  FREE_ASSESSMENT,
  checkResults,
  failedCheckFixes,
  judgeIds,
  judgeQuestions,
  judgeState,
  lintReport,
  llmJudgePrompt,
  parseReport,
  readLlmJudge,
  repairMessage,
  writerSystemPrompt,
  writerUserMessage,
  type CheckResult,
  type JudgeId,
  type MapperReport,
} from '@/lib/mapper-report';

// Each report is up to four model calls now, on a public page. One visitor
// editing and re-running needs a handful; the ceiling stops a loop or a flood
// spending the budget. Over either limit the visitor still gets a report, the
// rule-based one, so a limit never shows up as an error.
const VISITOR_LIMIT = 8;
const HOURLY_CEILING = 150;

// The rewrite only starts while there is time for it and its check to finish
// inside what the page waits for (90s), and it must be done by REWRITE_BY_MS.
// A late rewrite the page has given up on is money spent on nothing.
const REWRITE_IF_UNDER_MS = 35_000;
const REWRITE_BY_MS = 58_000;

// Pinned rather than routed. Probed 28 Sep 2026 with scripts/probe-mapper.mjs:
// the app default (deepseek-v4-pro) took 90 to 200 seconds on this prompt and
// never returned a usable report; claude-sonnet-5 wrote specific, grounded
// ones in about 14 seconds that passed every check first time.
const writerModels = () =>
  (
    process.env.MAPPER_WRITER_MODELS ||
    'anthropic/claude-sonnet-5,google/gemini-2.5-flash'
  )
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

// A different family from the writer, so the checker is not grading its own
// style. Only used when Jev cannot answer.
const judgeModels = () =>
  (
    process.env.MAPPER_JUDGE_MODELS ||
    'google/gemini-2.5-flash,openai/gpt-4o-mini'
  )
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

type Checked = {
  report: MapperReport;
  lint: string[];
  checks: CheckResult[];
  checkedBy: 'jev' | 'llm' | 'none';
};

async function judge(transcript: string, report: MapperReport) {
  const state = judgeState(transcript, report);
  try {
    const answers = await askJev({
      state,
      timeoutMs: 9000,
      questions: Object.fromEntries(
        judgeIds.map((id) => [
          id,
          { type: 'noul', instructions: judgeQuestions[id].instructions },
        ]),
      ),
    });
    const probabilities: Partial<Record<JudgeId, number>> = {};
    for (const id of judgeIds)
      if (typeof answers[id]?.noul === 'number')
        probabilities[id] = answers[id].noul;
    if (Object.keys(probabilities).length === judgeIds.length)
      return { checks: checkResults(probabilities), checkedBy: 'jev' as const };
  } catch {
    // Jev needs prepaid credit and is an alpha endpoint. The LLM checker below
    // asks the same questions.
  }
  try {
    const { content } = await chatComplete({
      models: judgeModels(),
      profile: 'structured',
      json: true,
      temperature: 0,
      timeoutMs: 15000,
      messages: [
        { role: 'system', content: llmJudgePrompt() },
        { role: 'user', content: state },
      ],
    });
    const probabilities = readLlmJudge(content);
    if (Object.keys(probabilities).length)
      return { checks: checkResults(probabilities), checkedBy: 'llm' as const };
  } catch {
    // Falls through to unchecked; the caller treats that as not good enough.
  }
  return { checks: checkResults({}), checkedBy: 'none' as const };
}

async function check(
  raw: string,
  intake: MapperIntake,
  transcript: string,
): Promise<Checked | null> {
  const report = parseReport(raw);
  if (!report) return null;
  const lint = lintReport(report, intake);
  // A draft that already breaks a rule is going to be rewritten anyway, so the
  // fit checks wait for the rewrite rather than grading something discarded.
  if (lint.length)
    return { report, lint, checks: checkResults({}), checkedBy: 'none' };
  return { report, lint, ...(await judge(transcript, report)) };
}

/** Good enough to show: no rule broken, checked, nothing failed. */
// A plain boolean, not a type guard: a guard's false branch would narrow a
// checked-but-failing draft to null, and the rewrite needs its failures.
const usable = (checked: Checked | null): boolean =>
  !!checked &&
  !checked.lint.length &&
  checked.checkedBy !== 'none' &&
  checked.checks.every((result) => result.verdict !== 'fail');

const packageTiming = (name: string) =>
  name === FREE_ASSESSMENT
    ? 'Free, about an hour'
    : pricingGroups
        .flatMap((group) => group.packages)
        .find((item) => item.name === name)?.timing;

function respond(
  report: MapperReport,
  meta: {
    source: 'live' | 'rules';
    checks: CheckResult[];
    checkedBy: Checked['checkedBy'];
    revised: boolean;
    /** Why the rule-based report was used, for the probe and the logs. */
    reason?: 'no-key' | 'limit' | 'count-failed' | 'checks-failed';
  },
) {
  return NextResponse.json({
    report,
    packageTiming: packageTiming(report.firstFix.package),
    ...meta,
    // Anything the checker was unsure about goes to a person, the same rule
    // as every other place Jev is used. The enquiry carries this flag.
    needsReview:
      meta.source === 'rules' ||
      meta.checks.some((result) => result.verdict !== 'pass'),
  });
}

async function POSTHandler(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 6000);
  } catch {
    return NextResponse.json(
      { error: 'The answers could not be read.' },
      { status: 400 },
    );
  }
  const parsed = parseIntake(body.intake);
  if (parsed.error !== undefined)
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { intake } = parsed;
  const rules = (
    reason: 'no-key' | 'limit' | 'count-failed' | 'checks-failed',
  ) =>
    respond(mapperFallback(intake), {
      source: 'rules',
      checks: checkResults({}),
      checkedBy: 'none',
      revised: false,
      reason,
    });

  if (!process.env.OPENROUTER_API_KEY) return rules('no-key');
  try {
    const db = getDb();
    const hour = currentHour();
    const allowed =
      (await reserve(
        db,
        `mapper-${await visitorKey(request)}-${hour}`,
        VISITOR_LIMIT,
      )) && (await reserve(db, `mapper-${hour}`, HOURLY_CEILING));
    if (!allowed) return rules('limit');
  } catch {
    // No way to count means no way to cap the spend, so no model calls.
    return rules('count-failed');
  }

  const started = Date.now();
  const transcript = intakeTranscript(intake);
  const messages: ChatMessage[] = [
    { role: 'system', content: writerSystemPrompt(intake.problem) },
    { role: 'user', content: writerUserMessage(transcript) },
  ];
  let costMicros = 0;
  let model: string | undefined;
  const write = async (conversation: ChatMessage[], timeoutMs = 35000) => {
    const result = await chatComplete({
      // On the cheap structured tier the router picked a different flash model
      // each run and every report came back generic. See writerModels.
      models: writerModels(),
      profile: 'drafting',
      json: true,
      temperature: 0.3,
      maxTokens: 1800,
      timeoutMs,
      messages: conversation,
    });
    costMicros += result.costMicros ?? 0;
    model = result.model;
    return result.content;
  };

  let first: Checked | null = null;
  let second: Checked | null = null;
  let firstRaw = '';
  let failure = '';
  try {
    firstRaw = await write(messages);
    first = await check(firstRaw, intake, transcript);
    if (!usable(first) && Date.now() - started < REWRITE_IF_UNDER_MS) {
      const problems = !first
        ? [
            'The reply was not valid JSON in the required shape, or a required section was empty.',
          ]
        : first.checkedBy === 'none' && !first.lint.length
          ? []
          : [...first.lint, ...failedCheckFixes(first.checks)];
      if (problems.length) {
        const secondRaw = await write(
          [
            ...messages,
            ...(firstRaw
              ? [{ role: 'assistant' as const, content: firstRaw }]
              : []),
            { role: 'user', content: repairMessage(problems) },
          ],
          Math.max(8000, REWRITE_BY_MS - (Date.now() - started)),
        );
        second = await check(secondRaw, intake, transcript);
      }
    }
  } catch (error) {
    failure = error instanceof Error ? error.message.slice(0, 160) : 'unknown';
  }

  const chosen: Checked | null = usable(second)
    ? second
    : usable(first)
      ? first
      : null;
  const last = second ?? first;
  await logAgentRun({
    agentName: 'Opportunity Mapper',
    agentVersion: 'v2',
    channel: 'web',
    status: chosen ? 'success' : 'error',
    outcome: chosen
      ? chosen.report.headline
      : `Rule-based report shown${failure ? `: ${failure}` : ''}`,
    durationMs: Date.now() - started,
    costMicros: costMicros || undefined,
    // The problem and the verdicts, not the visitor's words: those are stored
    // with the lead if they choose to send it, and only then.
    trace: {
      model,
      problem: intake.problem,
      revised: !!second,
      checkedBy: last?.checkedBy,
      lint: last?.lint,
      checks: last?.checks.map((result) => [result.id, result.probability]),
    },
  });

  if (!chosen) return rules('checks-failed');
  return respond(chosen.report, {
    source: 'live',
    checks: chosen.checks,
    checkedBy: chosen.checkedBy,
    revised: chosen === second,
  });
}

export const POST = withRequestLog('/api/recommendation', POSTHandler);
