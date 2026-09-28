/**
 * Probe the visitor mapper's writer and checker against real models.
 *
 *   node scripts/probe-mapper.mjs            three businesses, full pipeline
 *   node scripts/probe-mapper.mjs --judge    checker calibration only
 *
 * The same lesson as Kanea's probe:intake: a gate is only as good as its
 * wording, so run known good and known bad reports three times each and count
 * misses and false alarms before trusting it. Uses OPENROUTER_API_KEY from
 * .env and spends a few cents. Stores nothing.
 */
import fs from 'node:fs';
import ts from 'typescript';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf('=');
      return [
        line.slice(0, at),
        line.slice(at + 1).replace(/^["']|["']$/g, ''),
      ];
    }),
);
const KEY = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;
if (!KEY) throw new Error('OPENROUTER_API_KEY is not in .env');

const uri = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const compile = (file, modules = {}) =>
  ts
    .transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(
      /from\s+['"]([^'"]+)['"]/g,
      (_, n) => `from '${modules[n] || n}'`,
    );
const qUrl = uri(compile('lib/mapper-questions.ts'));
const rUrl = uri(compile('lib/mapper-report.ts'));
const Q = await import(qUrl);
const R = await import(rUrl);

const headers = {
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'X-Title': 'Aksen Labs probe',
};
const WRITER = (
  process.env.PROBE_WRITER ||
  'anthropic/claude-sonnet-5,google/gemini-2.5-flash'
).split(',');

async function write(messages) {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: WRITER[0],
        models: WRITER.slice(1),
        temperature: 0.3,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
        reasoning: { effort: 'low', exclude: true },
        messages,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      `writer ${response.status} ${JSON.stringify(data).slice(0, 200)}`,
    );
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model,
  };
}

async function jev(state) {
  const started = Date.now();
  const response = await fetch('https://openrouter.ai/api/alpha/decisions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'typesafe/jev-1.13',
      state,
      questions: Object.fromEntries(
        R.judgeIds.map((id) => [
          id,
          { type: 'noul', instructions: R.judgeQuestions[id].instructions },
        ]),
      ),
    }),
  });
  if (!response.ok) throw new Error(`jev ${response.status}`);
  const body = await response.json();
  const out = {};
  for (const id of R.judgeIds) out[id] = body.answers?.[id]?.noul ?? null;
  return { probabilities: out, ms: Date.now() - started };
}

const fixtures = [
  {
    name: 'Lagos frame shop, slow WhatsApp replies',
    intake: {
      business: 'Made-to-order, crafts or furniture',
      sells: 'Custom picture frames and wall decor',
      problem: 'customers',
      symptoms: [
        'Messages wait too long for a reply',
        'We check price or stock before we can reply',
      ],
      channels: ['WhatsApp', 'Instagram or Facebook'],
      tools: ['Spreadsheets'],
      markets: ['Nigeria'],
      volume: '10 to 50',
      team: '2 to 5 people',
      example:
        'A customer asked the price of a 40 by 60 frame on WhatsApp on Saturday. We replied on Monday and she had bought elsewhere.',
      frequency: 'Every week',
    },
  },
  {
    name: 'Accra caterer, lost orders and chasing payment',
    intake: {
      business: 'Food, drinks or catering',
      sells: 'Party jollof, small chops and event trays',
      problem: 'profit',
      symptoms: [
        'Orders get lost, mixed up or forgotten',
        'We chase customers for payment',
      ],
      channels: ['WhatsApp', 'Phone calls', 'Referrals'],
      tools: ['Memory, paper or a notebook'],
      markets: ['Ghana'],
      volume: '10 to 50',
      team: 'Just me',
      example:
        'Two trays for a naming ceremony went to the wrong house in Tema, and the balance for last month is still not paid.',
      frequency: 'Every week',
      tried: 'My sister helps on Saturdays',
    },
  },
  {
    name: 'Kumasi salon, few new clients',
    intake: {
      business: 'Beauty, salon or wellness',
      problem: 'leads',
      symptoms: [
        'People cannot find us on Google or Maps',
        'Most new customers come from word of mouth only',
      ],
      channels: ['Walk-ins', 'Instagram or Facebook', 'Referrals'],
      tools: ['WhatsApp Business catalogue or labels'],
      markets: ['Ghana'],
      volume: 'Fewer than 10',
      team: '2 to 5 people',
    },
  },
];

const fmt = (p) => (p === null ? ' -- ' : p.toFixed(2));
const row = (probabilities) =>
  R.judgeIds.map((id) => `${id}=${fmt(probabilities[id])}`).join(' ');

async function pipeline({ name, intake: raw }) {
  const parsed = Q.parseIntake(raw);
  if (parsed.error) throw new Error(`${name}: ${parsed.error}`);
  const intake = parsed.intake;
  const transcript = Q.intakeTranscript(intake);
  const messages = [
    { role: 'system', content: R.writerSystemPrompt(intake.problem) },
    { role: 'user', content: R.writerUserMessage(transcript) },
  ];
  const started = Date.now();
  let draft = await write(messages);
  let report = R.parseReport(draft.content);
  if (!report)
    console.log(
      `  unparseable reply: ${JSON.stringify(draft.content.slice(0, 400))}`,
    );
  let lint = report ? R.lintReport(report, intake) : ['not valid JSON'];
  let judged =
    report && !lint.length ? await jev(R.judgeState(transcript, report)) : null;
  let checks = judged ? R.checkResults(judged.probabilities) : [];
  const failed = [...lint, ...R.failedCheckFixes(checks)];
  let revised = false;
  if (failed.length) {
    revised = true;
    console.log(`  first draft failed: ${failed.join(' | ')}`);
    draft = await write([
      ...messages,
      { role: 'assistant', content: draft.content },
      { role: 'user', content: R.repairMessage(failed) },
    ]);
    report = R.parseReport(draft.content);
    lint = report ? R.lintReport(report, intake) : ['not valid JSON'];
    judged =
      report && !lint.length
        ? await jev(R.judgeState(transcript, report))
        : null;
    checks = judged ? R.checkResults(judged.probabilities) : [];
  }
  const ok =
    report &&
    !lint.length &&
    checks.length &&
    checks.every((c) => c.verdict !== 'fail');
  console.log(
    `\n=== ${name} (${draft.model}, ${Date.now() - started}ms${revised ? ', rewritten' : ''}) ${ok ? 'SHOWN' : 'RULES FALLBACK'}`,
  );
  if (lint.length) console.log('  lint:', lint.join(' | '));
  if (judged)
    console.log(`  jev (${judged.ms}ms): ${row(judged.probabilities)}`);
  if (report) console.log(JSON.stringify(report, null, 2).replace(/^/gm, '  '));
  return report ? { intake, transcript, report } : null;
}

async function calibrate(base) {
  const { transcript, report } = base;
  const bad = {
    'wrong problem': {
      ...report,
      firstFix: {
        title: 'A new business website',
        what: 'A five-page website with a blog to bring new visitors from search.',
        whyFirst: 'Every business needs a website.',
        package: 'Business website',
      },
    },
    'invented facts': {
      ...report,
      summary: `${report.summary} Businesses like yours lose around 30% of enquiries, and your Jumia shop is losing sales too.`,
      leaks: [
        {
          where: 'Your Jumia listings are out of date',
          evidence: 'Most sellers on Jumia lose sales this way.',
        },
      ],
    },
    'paid DIY': {
      ...report,
      doThisWeek: [
        'Buy a CRM subscription and hire a virtual assistant to answer messages.',
      ],
    },
    promises: {
      ...report,
      humanControl:
        'The assistant sets prices, takes payment and messages customers on its own, so you never miss a sale.',
    },
  };
  const cases = [['good (should pass all)', report], ...Object.entries(bad)];
  console.log('\n=== Checker calibration, 3 runs each');
  for (const [label, candidate] of cases) {
    for (let run = 1; run <= 3; run += 1) {
      const { probabilities, ms } = await jev(
        R.judgeState(transcript, candidate),
      );
      console.log(
        `  ${label.padEnd(24)} run ${run} (${ms}ms): ${row(probabilities)}`,
      );
    }
  }
}

const judgeOnly = process.argv.includes('--judge');
const results = [];
for (const fixture of judgeOnly ? fixtures.slice(0, 1) : fixtures) {
  try {
    results.push(await pipeline(fixture));
  } catch (error) {
    console.log(`\n=== ${fixture.name}: ERROR ${error.message}`);
  }
}
const base = results.find(Boolean);
if (base) await calibrate(base);
