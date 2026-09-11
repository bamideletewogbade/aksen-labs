import { NextResponse } from 'next/server';
import { chatComplete } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';

type PilotRecommendation = {
  title: string;
  summary: string;
  firstWorkflow: string;
  steps: string[];
  firstMetric: string;
  humanControl: string;
};

function cleanText(value: unknown, limit = 320) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\*\*/g, '')
    .replace(/[—–]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function validateRecommendation(value: unknown): PilotRecommendation | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const steps = Array.isArray(input.steps)
    ? input.steps.map((step) => cleanText(step, 150)).filter(Boolean).slice(0, 3)
    : [];
  const recommendation = {
    title: cleanText(input.title, 90),
    summary: cleanText(input.summary),
    firstWorkflow: cleanText(input.firstWorkflow, 180),
    steps,
    firstMetric: cleanText(input.firstMetric, 130),
    humanControl: cleanText(input.humanControl, 180),
  };
  if (!recommendation.title || !recommendation.summary || !recommendation.firstWorkflow || !recommendation.firstMetric || !recommendation.humanControl || steps.length !== 3) return null;
  return recommendation;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON body is required.' }, { status: 400 });
  }

  const answers = body && typeof body === 'object' ? (body as Record<string, unknown>).answers : null;
  if (!Array.isArray(answers) || answers.length !== 3 || answers.some((answer) => typeof answer !== 'string' || !answer.trim())) {
    return NextResponse.json({ error: 'Three workflow answers are required.' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'The live recommendation service is not configured.' }, { status: 503 });

  const [goal, market, setup] = answers.map((answer) => String(answer).trim().slice(0, 180));
  const startedAt = Date.now();

  try {
    const { content: raw, costMicros } = await chatComplete({
      temperature: 0.35,
      maxTokens: 450,
      json: true,
      messages: [
        {
          role: 'system',
          content: [
            'You are the Aksen Labs digital transformation advisor for ambitious African businesses.',
            'Aksen Labs helps African businesses grow, serve customers better and operate more effectively across 4 capability areas: (1) Customer experience & commerce, (2) Business systems & operations, (3) Data & insight, and (4) Digital products. AI is used as a capability multiplier where it genuinely adds value, but not forced if clean web development, integrated payments, or reliable operational workflows are what is needed.',
            'Turn three short answers into one practical, scoped digital transformation starting point or project recommendation.',
            'Use plain business language. Never mention APIs, models, embeddings, vector databases, architecture, or technical buzzwords.',
            'Be specific, modest and useful. Do not invent facts about the company. Treat non-Ghanaian locations as possible markets subject to project fit and delivery arrangements.',
            'Describe a proposed project or initial sprint, not a generic pre-packaged software. Never promise instant replies, guaranteed revenues or unsupported timelines.',
            'Include human-in-the-loop governance: teams must review sensitive decisions, approve financial transactions, and inspect AI-assisted drafts.',
            'Return only valid JSON with exactly these keys: title, summary, firstWorkflow, steps, firstMetric, humanControl.',
            'steps must contain exactly three short strings representing concrete phases (e.g. Discovery & Mapping, Core Implementation, Adoption & Handover). Do not use markdown, asterisks, em dashes or decorative characters.',
          ].join(' '),
        },
        { role: 'user', content: `Goal to improve: ${goal}\nOperating market: ${market}\nCurrent setup: ${setup}` },
      ],
    });

    const content = raw.replace(/^```json\s*|\s*```$/g, '');
    const recommendation = validateRecommendation(JSON.parse(content));
    if (!recommendation) throw new Error('OpenRouter returned an invalid recommendation');
    await logAgentRun({ agentName: 'Opportunity Mapper', channel: 'web', status: 'success', outcome: recommendation.title, durationMs: Date.now() - startedAt, costMicros });
    return NextResponse.json({ recommendation, source: 'openrouter' });
  } catch {
    await logAgentRun({ agentName: 'Opportunity Mapper', channel: 'web', status: 'error', outcome: 'Could not prepare a recommendation', durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'A live recommendation could not be prepared right now.' }, { status: 502 });
  }
}
