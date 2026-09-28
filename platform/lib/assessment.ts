import { businessGoals, parseGoals, type BusinessGoal } from './business-goals';

/**
 * The free assessment, run with an owner, often on a shared screen.
 *
 * The questions are the ones in Docs/Outreach-Playbook.md, asked before
 * anything is explained: how orders arrive, the last busy day, the last time
 * something went wrong, what that cost. The owner's own words are the point.
 * Docs/Owner-Conversations.md exists because there was no record anywhere of
 * what an owner said about their own problem, and this page is where that
 * record now starts.
 *
 * Everything here is pure so the route, the page and the test share it.
 */

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  /** Said aloud by the interviewer, shown only to them while presenting. */
  hint?: string;
  /** Never shown on a shared screen. */
  private?: boolean;
};

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'orders_in',
    prompt: 'How do most of your customers reach you today?',
    hint: 'Let them describe it. Tick the channels as they mention them.',
  },
  {
    id: 'busy_day',
    prompt: 'Tell me about your last really busy day. What happened?',
    hint: 'Ask about a specific day, not a typical one.',
  },
  {
    id: 'went_wrong',
    prompt: 'When did an order last go wrong, or a customer give up waiting?',
    hint: 'When something sounds painful, go one level deeper.',
  },
  {
    id: 'cost',
    prompt: 'What did that cost you, and how often does it happen?',
    hint: 'Their estimate, not ours. "I don\'t know" is a fine answer.',
  },
  {
    id: 'tried',
    prompt: 'What do you use today, and what have you already tried?',
  },
  {
    id: 'one_thing',
    prompt: 'If one thing got better this month, what would it be?',
    hint: 'Tick what they want more of as they say it.',
  },
  {
    id: 'pricing',
    prompt:
      'If two people offered you a fix, one at a bigger price once plus a monthly fee, and one at a small monthly fee with nothing to pay today, which would you pick, and why?',
    hint: 'Revenue ledger R-005. Ask it in every assessment. Kept off the shared screen so it never reads as a quote.',
    private: true,
  },
];

export const customerChannels = [
  'WhatsApp',
  'Instagram or Facebook',
  'Phone calls',
  'Walk-ins',
  'Website',
  'Referrals',
  'Marketplace (Jiji, Jumia, Tonaton)',
] as const;

export const orderVolumes = [
  'Fewer than 10 a day',
  '10 to 50 a day',
  '50 to 200 a day',
  'More than 200 a day',
  'Not sure',
] as const;

export const teamSizes = [
  'Just me',
  '2 to 5 people',
  '6 to 20 people',
  'More than 20',
] as const;

export const assessmentChannels = ['call', 'whatsapp', 'meeting'] as const;
export type AssessmentChannel = (typeof assessmentChannels)[number];

export type AssessmentInput = {
  business: string;
  person: string;
  sells: string;
  area: string;
  decides: string;
  channels: string[];
  volume: string;
  team: string;
  goals: BusinessGoal[];
  answers: Record<string, string>;
};

export type Roadmap = {
  heard: string[];
  slipping: { where: string; evidence: string }[];
  doThisWeek: string[];
  weCouldBuild: { what: string; helpsWith: string; why: string }[];
  questionsLeft: string[];
  nextStep: string;
};

const text = (value: unknown, limit: number) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, limit)
    : '';

const pick = <T extends readonly string[]>(list: T, value: unknown) =>
  list.includes(value as T[number]) ? (value as T[number]) : '';

const pickMany = <T extends readonly string[]>(list: T, value: unknown) => {
  const given = Array.isArray(value) ? value : [];
  return list.filter((item) => given.includes(item));
};

/** What the page sends, cleaned to known fields and bounded lengths. */
export function parseAssessment(body: unknown): AssessmentInput {
  const input = (body && typeof body === 'object' ? body : {}) as Record<
    string,
    unknown
  >;
  const rawAnswers =
    input.answers && typeof input.answers === 'object'
      ? (input.answers as Record<string, unknown>)
      : {};
  const answers: Record<string, string> = {};
  for (const question of assessmentQuestions) {
    const value = text(rawAnswers[question.id], 1500);
    if (value) answers[question.id] = value;
  }
  return {
    business: text(input.business, 160),
    person: text(input.person, 120),
    sells: text(input.sells, 200),
    area: text(input.area, 120),
    decides: text(input.decides, 160),
    channels: pickMany(customerChannels, input.channels),
    volume: pick(orderVolumes, input.volume),
    team: pick(teamSizes, input.team),
    goals: parseGoals(input.goals),
    answers,
  };
}

/** Enough to draft from: a business and at least two answers in their words. */
export function readyForRoadmap(input: AssessmentInput) {
  const answered = assessmentQuestions.filter(
    (q) => !q.private && input.answers[q.id],
  ).length;
  if (!input.business) return 'Add the business name first.';
  if (answered < 2)
    return 'Write down at least two of their answers before drafting.';
  return '';
}

/**
 * The owner's side only, labelled, for the model. The interviewer's hints and
 * the private pricing answer are left out: the roadmap is shown to the owner,
 * and it should not argue from anything they did not say on screen.
 */
export function ownerTranscript(input: AssessmentInput) {
  const lines: (string | null)[] = [
    `Business: ${input.business}${input.area ? `, ${input.area}` : ''}`,
    input.sells ? `What they sell: ${input.sells}` : null,
    input.channels.length
      ? `Customers reach them through: ${input.channels.join(', ')}`
      : null,
    input.volume ? `Orders or enquiries: ${input.volume}` : null,
    input.team ? `Team: ${input.team}` : null,
    input.goals.length ? `They want more of: ${input.goals.join(', ')}` : null,
    '',
    ...assessmentQuestions
      .filter((q) => !q.private && input.answers[q.id])
      .map((q) => `Q: ${q.prompt}\nOwner: ${input.answers[q.id]}`),
  ];
  return lines.filter((line) => line !== null).join('\n');
}

export const roadmapSystemPrompt = `You prepare a one-page roadmap for a small business owner in Ghana or Nigeria, from notes taken while they described their business. The owner will read it on a shared screen, so write to them directly, in plain words a shop owner uses.

Rules, all of them firm:
- Use only what the notes say. Never invent a number, a cost, a percentage, a customer count or a result. If a figure would help and is missing, add it to questionsLeft instead.
- "heard": up to 4 short points in the owner's own words or close to them.
- "slipping": up to 3 places where orders, customers, money or time are being lost. "where" is a short phrase naming the place it slips, such as "Measurements lost in WhatsApp chats", never a one-word category. "evidence" is what they said that shows it. If the notes show nothing slipping, return an empty list rather than guessing.
- "doThisWeek": 1 to 3 things they can do themselves this week at no cost. Real, small, specific to what they said. At least one must need no software at all.
- "weCouldBuild": up to 3 things Aksen Labs could build that would help with what they described, such as a WhatsApp assistant that answers and takes orders, an order or booking list the team can see, reminders, a simple website, or a dashboard. Name which of these it helps: leads, customers, income or time. AI prepares and a person decides: for anything that uses AI, the "why" must say what a person still approves, for example the owner confirms the price or approves the order before it is accepted. Nothing contacts a customer on its own initiative, takes a payment or sets a price.
- "questionsLeft": up to 3 things still unknown that matter.
- "nextStep": one sentence. The assessment is free; if they want something built, Aksen writes a quote and they decide. Do not state any price.
- No guarantees or absolutes ("never miss", "guaranteed", "replaces your staff", "double your sales"). Prefer "helps".
- No em dashes. No hype.

Return JSON only, exactly this shape:
{"heard":[string],"slipping":[{"where":string,"evidence":string}],"doThisWeek":[string],"weCouldBuild":[{"what":string,"helpsWith":"leads"|"customers"|"income"|"time","why":string}],"questionsLeft":[string],"nextStep":string}`;

const list = (value: unknown, max: number, limit: number) =>
  (Array.isArray(value) ? value : [])
    .map((item) => text(item, limit))
    .filter(Boolean)
    .slice(0, max);

const HELPS = ['leads', 'customers', 'income', 'time'] as const;

/** The model's JSON, reduced to the shape the page renders, or null. */
export function parseRoadmap(raw: string): Roadmap | null {
  let data: Record<string, unknown>;
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    data = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const objects = (value: unknown) =>
    (Array.isArray(value) ? value : []).filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object',
    );
  const roadmap: Roadmap = {
    heard: list(data.heard, 4, 240),
    slipping: objects(data.slipping)
      .map((item) => ({
        where: text(item.where, 200),
        evidence: text(item.evidence, 280),
      }))
      .filter((item) => item.where)
      .slice(0, 3),
    doThisWeek: list(data.doThisWeek, 3, 240),
    weCouldBuild: objects(data.weCouldBuild)
      .map((item) => ({
        what: text(item.what, 160),
        helpsWith: pick(HELPS, item.helpsWith) || 'time',
        why: text(item.why, 280),
      }))
      .filter((item) => item.what)
      .slice(0, 3),
    questionsLeft: list(data.questionsLeft, 3, 200),
    nextStep: text(data.nextStep, 300),
  };
  if (!roadmap.heard.length && !roadmap.doThisWeek.length) return null;
  return roadmap;
}

/**
 * The one typed decision in the assessment, for Jev: is there a real problem
 * that costs them, in their own words? The playbook makes the offer to build
 * only then. Phrased to say what to ignore, because vague criteria put a clear
 * case in the hedge band (see the jev-in-everything note).
 */
export const jevQuestions = {
  real_costly_problem: {
    type: 'noul',
    instructions:
      'Read the owner answers in the notes. Did the owner describe a specific, concrete problem in how their business runs (for example lost or mixed-up orders, customers waiting and leaving, messages missed, time lost to manual work) that is costing them money, customers or time? Answer yes only if they describe an actual incident or a loss that repeats. A general wish to grow, sell more or get more customers, with no problem described, is no. Ignore the business details at the top of the notes; judge only what the owner said.',
  },
} as const;

/** 0.35 to 0.65 means a person decides, as everywhere Jev is used. */
export function jevReading(probability: number | null) {
  if (probability === null)
    return {
      tone: 'unknown',
      label: 'Jev was not reachable. Your call.',
    } as const;
  if (probability >= 0.65)
    return {
      tone: 'yes',
      label: 'A real problem that costs them. Offering to build is fair.',
    } as const;
  if (probability <= 0.35)
    return {
      tone: 'no',
      label:
        'No costly problem described yet. Ask about cost before offering anything.',
    } as const;
  return { tone: 'hedge', label: 'Unclear. Your call.' } as const;
}

/**
 * The entry for Docs/Owner-Conversations.md, in that file's template, so the
 * Phase 1 count can be kept without retyping the call.
 */
export function ownerConversationEntry(
  // The page's draft carries goals as plain strings; nothing here needs more.
  input: Omit<AssessmentInput, 'goals'> & { goals: readonly string[] },
  extra: { date: string; foundVia: string; nextStep: string; followUp: string },
) {
  const a = input.answers;
  const quote = (value?: string) => (value ? `"${value}"` : '');
  return [
    `### ${extra.date} · ${input.business || 'Business'} · ${input.area || 'Area'}`,
    '',
    `Found via:        ${extra.foundVia}`,
    `Who:              ${[input.person, input.decides && `decides: ${input.decides}`].filter(Boolean).join(', ')}`,
    `What they sell:   ${input.sells}`,
    `How orders come in now: ${[input.channels.join(', '), a.orders_in].filter(Boolean).join('. ')}`,
    `Their words for the problem:   ${quote(a.went_wrong || a.busy_day)}`,
    `What it costs them:            ${a.cost || ''}`,
    `What they use or tried:        ${a.tried || ''}`,
    `Pricing question (R-005):      ${a.pricing || ''}`,
    `Next step and date:            ${extra.nextStep}${extra.followUp ? ` (${extra.followUp})` : ''}`,
  ].join('\n');
}

/** The line kept in the lead's contact history, which holds 500 characters. */
export function historySummary(input: AssessmentInput, jev: number | null) {
  const problem = input.answers.went_wrong || input.answers.busy_day || '';
  const parts = [
    'Free assessment.',
    input.goals.length
      ? `Wants more: ${input.goals.join(', ').toLowerCase()}.`
      : '',
    problem ? `In their words: "${problem.slice(0, 220)}"` : '',
    input.answers.cost ? `Cost: ${input.answers.cost.slice(0, 120)}.` : '',
    jev !== null ? `Jev, costly problem: ${jev.toFixed(2)}.` : '',
  ];
  return parts.filter(Boolean).join(' ').slice(0, 500);
}

const HELPS_LABEL: Record<string, string> = {
  leads: 'more leads',
  customers: 'more customers',
  income: 'more income',
  time: 'less time lost',
};

/**
 * The roadmap as a WhatsApp message: asterisks for bold, dashes for lists,
 * nothing a phone would show as raw markup. Most owners will keep it in the
 * chat they already use with us, not in an email.
 */
export function roadmapPlainText(business: string, roadmap: Roadmap) {
  const section = (title: string, lines: string[]) =>
    lines.length ? [`*${title}*`, ...lines.map((l) => `- ${l}`), ''] : [];
  return [
    `*${business}: what we found*`,
    '',
    ...section('What you told us', roadmap.heard),
    ...section(
      'Where things are slipping',
      roadmap.slipping.map((s) =>
        s.evidence ? `${s.where} (${s.evidence})` : s.where,
      ),
    ),
    ...section('You can do this week', roadmap.doThisWeek),
    ...section(
      'What we could build with you',
      roadmap.weCouldBuild.map(
        (b) =>
          `${b.what.replace(/[.\s]+$/, '')} (${HELPS_LABEL[b.helpsWith] ?? b.helpsWith}). ${b.why}`,
      ),
    ),
    ...(roadmap.nextStep ? ['*Next step*', roadmap.nextStep, ''] : []),
    'This assessment is free. AI helped prepare it; we checked it.',
  ]
    .join('\n')
    .trim();
}

export const helpsLabel = HELPS_LABEL;
export const allGoals = businessGoals;
