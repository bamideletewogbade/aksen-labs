/**
 * The visitor mapper's questions. The page, the recommendation route and the
 * enquiry route all read this file, so what a visitor can choose and what the
 * server accepts cannot drift apart.
 *
 * It is a self-serve version of the free assessment (lib/assessment.ts): what
 * kind of business, which problem hurts most, where it happens, how customers
 * arrive, what the work runs on, how big it is, and one real example. The old
 * three questions (goals, markets, tools) gave the model nothing to be precise
 * with, so every answer came back as "improve your customer experience".
 *
 * Kept free of imports: the tests load it on its own.
 */

export const OTHER = 'Something else';

export const businessTypes = [
  'Shop or retail',
  'Made-to-order, crafts or furniture',
  'Fashion or tailoring',
  'Food, drinks or catering',
  'Beauty, salon or wellness',
  'Professional or business services',
  'Health or clinic',
  'School, training or courses',
  'Property, travel or events',
  'Wholesale, distribution or manufacturing',
  OTHER,
] as const;

/**
 * The three problems every business has, found, chosen, kept (the same three
 * groups as lib/email-templates.ts), plus a new product and "not sure". One choice on
 * purpose: the report starts with the problem that costs most, and an owner
 * who ticks everything gets a plan that fixes nothing first.
 */
export const problems = [
  {
    id: 'leads',
    label: 'Not enough people find us or ask',
    sentence: 'not enough of the right people find you or get in touch',
  },
  {
    id: 'customers',
    label: 'People ask, but too few end up buying',
    sentence: 'people ask, but too few of them go on to buy',
  },
  {
    id: 'profit',
    label: 'We sell, but time or money keeps slipping away',
    sentence: 'you are selling, but time or money keeps slipping away',
  },
  {
    id: 'product',
    label: 'We want to launch a new product or service online',
    sentence: 'you want to launch a new product or service online',
  },
  {
    id: 'unsure',
    label: 'Not sure yet. Help me find it',
    sentence: 'you are not yet sure which part of the business to fix first',
  },
] as const;

export type ProblemId = (typeof problems)[number]['id'];

export const symptomsByProblem: Record<
  Exclude<ProblemId, 'unsure'>,
  readonly string[]
> = {
  leads: [
    'People cannot find us on Google or Maps',
    'We have no website, or it brings no enquiries',
    'Posts get likes but few messages',
    'Most new customers come from word of mouth only',
    'Past customers rarely come back or refer others',
  ],
  customers: [
    'Messages wait too long for a reply',
    'We answer the same questions again and again',
    'We check price or stock before we can reply',
    'People go quiet after hearing the price',
    'Taking payment or a deposit is awkward',
    'Nobody follows up after the first message',
  ],
  profit: [
    'Orders get lost, mixed up or forgotten',
    'The same details are typed into several places',
    'We chase customers for payment',
    'We cannot see which products or customers make money',
    'Stock runs out or piles up',
    'Admin takes time that should go to customers',
  ],
  product: [
    'We have an idea but have not tested it with customers',
    'Customers or staff need an app or portal',
    'We want to sell a service or course online',
    'We tried to build it before and it stalled',
  ],
};

/** "Not sure" gets the most common symptom of each problem to recognise. */
const unsureSymptoms = [
  symptomsByProblem.leads[1],
  symptomsByProblem.leads[3],
  symptomsByProblem.customers[0],
  symptomsByProblem.customers[5],
  symptomsByProblem.profit[0],
  symptomsByProblem.profit[5],
];

export function symptomsFor(problem: ProblemId | ''): readonly string[] {
  if (!problem) return [];
  const list =
    problem === 'unsure' ? unsureSymptoms : symptomsByProblem[problem];
  return [...list, OTHER];
}

export const MAX_SYMPTOMS = 4;

// The same channels the admin assessment ticks (lib/assessment.ts), repeated
// rather than imported because this file has to load on its own.
export const reachChannels = [
  'WhatsApp',
  'Instagram or Facebook',
  'TikTok',
  'Phone calls',
  'Walk-ins',
  'Website',
  'Email',
  'Referrals',
  'Marketplace (Jiji, Jumia, Tonaton)',
] as const;

export const trackingTools = [
  'Memory, paper or a notebook',
  'Spreadsheets',
  'WhatsApp Business catalogue or labels',
  'An accounting or invoicing app',
  'A till or point-of-sale system',
  'Online store or payment links',
  'Several apps that do not talk to each other',
  OTHER,
] as const;

export const ANOTHER_MARKET = 'Another African country';
export const markets = [
  'Ghana',
  'Nigeria',
  'Kenya or East Africa',
  'South Africa or Southern Africa',
  ANOTHER_MARKET,
  'Beyond Africa / International',
] as const;

export const weeklyVolumes = [
  'Fewer than 10',
  '10 to 50',
  '50 to 200',
  'More than 200',
  'Not sure',
] as const;

export const teamSizes = [
  'Just me',
  '2 to 5 people',
  '6 to 20 people',
  'More than 20',
] as const;

export const frequencies = [
  'Every day',
  'Every week',
  'Every month',
  'Now and then',
  'Not sure',
] as const;

export type MapperIntake = {
  business: string;
  businessOther: string;
  sells: string;
  problem: ProblemId;
  symptoms: string[];
  symptomOther: string;
  channels: string[];
  tools: string[];
  toolsOther: string;
  markets: string[];
  marketOther: string;
  volume: string;
  team: string;
  example: string;
  frequency: string;
  tried: string;
};

export const emptyIntake = (): Omit<MapperIntake, 'problem'> & {
  problem: ProblemId | '';
} => ({
  business: '',
  businessOther: '',
  sells: '',
  problem: '',
  symptoms: [],
  symptomOther: '',
  channels: [],
  tools: [],
  toolsOther: '',
  markets: [],
  marketOther: '',
  volume: '',
  team: '',
  example: '',
  frequency: '',
  tried: '',
});

export type DraftIntake = ReturnType<typeof emptyIntake>;

type Choice = { value: string; label: string };
const choices = (list: readonly string[]): Choice[] =>
  list.map((value) => ({ value, label: value }));

export type MapperField =
  | {
      id: keyof DraftIntake;
      kind: 'single' | 'multi';
      label: string;
      hint?: string;
      options: (draft: DraftIntake) => Choice[];
      optional?: boolean;
      max?: number;
      other?: {
        when: string;
        id: keyof DraftIntake;
        label: string;
        placeholder: string;
      };
    }
  | {
      id: keyof DraftIntake;
      kind: 'text';
      label: string;
      placeholder: string;
      limit: number;
      rows?: number;
      optional: true;
    };

export type MapperStep = {
  prompt: string;
  hint: string;
  fields: MapperField[];
};

export const TEXT_LIMITS = {
  sells: 160,
  other: 120,
  example: 600,
  tried: 300,
} as const;

export const mapperSteps: MapperStep[] = [
  {
    prompt: 'What kind of business is it?',
    hint: 'Pick the closest. It tells us what a good first step looks like for businesses like yours.',
    fields: [
      {
        id: 'business',
        kind: 'single',
        label: 'Type of business',
        options: () => choices(businessTypes),
        other: {
          when: OTHER,
          id: 'businessOther',
          label: 'What kind of business?',
          placeholder: 'For example, a printing shop',
        },
      },
      {
        id: 'sells',
        kind: 'text',
        label: 'What do you sell, in a few words?',
        placeholder: 'For example, custom picture frames and wall decor',
        limit: TEXT_LIMITS.sells,
        optional: true,
      },
    ],
  },
  {
    prompt: 'Which of these hurts most right now?',
    hint: 'Choose one. We start with the problem that costs you most, and the rest can follow.',
    fields: [
      {
        id: 'problem',
        kind: 'single',
        label: 'The problem that hurts most',
        options: () =>
          problems.map((problem) => ({
            value: problem.id,
            label: problem.label,
          })),
      },
    ],
  },
  {
    prompt: 'Where does it happen?',
    hint: `Choose up to ${MAX_SYMPTOMS} that you have actually seen. These shape the report more than anything else.`,
    fields: [
      {
        id: 'symptoms',
        kind: 'multi',
        label: 'Where it happens',
        max: MAX_SYMPTOMS,
        options: (draft) => choices(symptomsFor(draft.problem)),
        other: {
          when: OTHER,
          id: 'symptomOther',
          label: 'What happens?',
          placeholder: 'For example, delivery addresses are often wrong',
        },
      },
    ],
  },
  {
    prompt: 'How do customers reach you today?',
    hint: 'Choose all that bring you real enquiries or orders.',
    fields: [
      {
        id: 'channels',
        kind: 'multi',
        label: 'How customers reach you',
        options: () => choices(reachChannels),
      },
    ],
  },
  {
    prompt: 'How do you keep track of orders and customers?',
    hint: 'Choose what you actually use. Paper and memory are common, and a fine place to start from.',
    fields: [
      {
        id: 'tools',
        kind: 'multi',
        label: 'How you keep track',
        options: () => choices(trackingTools),
        other: {
          when: OTHER,
          id: 'toolsOther',
          label: 'What else do you use?',
          placeholder: 'For example, a booking app',
        },
      },
    ],
  },
  {
    prompt: 'How big is the work, and where?',
    hint: 'Rough answers are fine. They keep the suggestion the right size for you.',
    fields: [
      {
        id: 'volume',
        kind: 'single',
        label: 'Enquiries or orders in a normal week',
        options: () => choices(weeklyVolumes),
      },
      {
        id: 'team',
        kind: 'single',
        label: 'People who handle customers or orders',
        options: () => choices(teamSizes),
      },
      {
        id: 'markets',
        kind: 'multi',
        label: 'Where you operate',
        options: () => choices(markets),
        other: {
          when: ANOTHER_MARKET,
          id: 'marketOther',
          label: 'Which country or countries?',
          placeholder: 'For example, Côte d’Ivoire and Senegal',
        },
      },
    ],
  },
  {
    prompt: 'In your own words',
    hint: 'All optional, and the most useful part. A real example lets us be specific instead of general.',
    fields: [
      {
        id: 'example',
        kind: 'text',
        label: 'Tell us about the last time this went wrong',
        placeholder:
          'For example, a customer asked for a price on WhatsApp on Saturday, we replied on Monday, and they had bought elsewhere.',
        limit: TEXT_LIMITS.example,
        rows: 4,
        optional: true,
      },
      {
        id: 'frequency',
        kind: 'single',
        label: 'How often does it happen?',
        options: () => choices(frequencies),
        optional: true,
      },
      {
        id: 'tried',
        kind: 'text',
        label: 'What have you tried already?',
        placeholder: 'For example, we hired someone to answer messages',
        limit: TEXT_LIMITS.tried,
        rows: 2,
        optional: true,
      },
    ],
  },
];

const clean = (value: unknown, limit: number) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, limit)
    : '';

/**
 * Why this step cannot continue yet, or '' when it can. Shared by the page's
 * Continue button and the server, so the two give the same reason.
 */
export function stepProblem(step: MapperStep, draft: DraftIntake): string {
  for (const field of step.fields) {
    if (field.kind === 'text') continue;
    const value = draft[field.id];
    const picked = Array.isArray(value) ? value : value ? [value] : [];
    if (!picked.length && !field.optional)
      return `Choose an answer for "${field.label}".`;
    if (field.max && picked.length > field.max)
      return `Choose up to ${field.max} for "${field.label}".`;
    const allowed = field.options(draft).map((option) => option.value);
    if (picked.some((item) => !allowed.includes(item)))
      return `"${field.label}" has a choice that is not on the list.`;
    if (field.other && picked.includes(field.other.when)) {
      const other = draft[field.other.id];
      if (typeof other !== 'string' || !other.trim())
        return `Fill in "${field.other.label}".`;
    }
  }
  return '';
}

/**
 * The page's answers, reduced to known choices and bounded text, or the
 * reason they cannot be used. Anything off-list is refused rather than
 * dropped: a silently dropped symptom is a report about a different business.
 */
export function parseIntake(
  value: unknown,
): { intake: MapperIntake; error?: undefined } | { error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { error: 'The answers could not be read.' };
  const input = value as Record<string, unknown>;
  const list = (item: unknown) =>
    Array.isArray(item)
      ? [...new Set(item.map((entry) => clean(entry, 120)).filter(Boolean))]
      : [];
  const one = (item: unknown) => clean(item, 120);
  const draft: DraftIntake = {
    business: one(input.business),
    businessOther: clean(input.businessOther, TEXT_LIMITS.other),
    sells: clean(input.sells, TEXT_LIMITS.sells),
    problem: (problems.find((p) => p.id === input.problem)?.id ?? '') as
      | ProblemId
      | '',
    symptoms: list(input.symptoms),
    symptomOther: clean(input.symptomOther, TEXT_LIMITS.other),
    channels: list(input.channels),
    tools: list(input.tools),
    toolsOther: clean(input.toolsOther, TEXT_LIMITS.other),
    markets: list(input.markets),
    marketOther: clean(input.marketOther, TEXT_LIMITS.other),
    volume: one(input.volume),
    team: one(input.team),
    example: clean(input.example, TEXT_LIMITS.example),
    frequency: one(input.frequency),
    tried: clean(input.tried, TEXT_LIMITS.tried),
  };
  for (const step of mapperSteps) {
    const problem = stepProblem(step, draft);
    if (problem) return { error: problem };
  }
  // Text for an "other" that was not chosen is not the visitor's answer.
  if (draft.business !== OTHER) draft.businessOther = '';
  if (!draft.symptoms.includes(OTHER)) draft.symptomOther = '';
  if (!draft.tools.includes(OTHER)) draft.toolsOther = '';
  if (!draft.markets.includes(ANOTHER_MARKET)) draft.marketOther = '';
  return { intake: draft as MapperIntake };
}

export const problemById = (id: ProblemId) =>
  problems.find((problem) => problem.id === id) ?? problems[4];

const withOther = (items: string[], when: string, other: string) =>
  items.map((item) => (item === when && other ? `${item} (${other})` : item));

/** The business as one phrase, for sentences. */
export function businessPhrase(intake: MapperIntake) {
  return intake.business === OTHER
    ? intake.businessOther || 'business'
    : intake.business;
}

/**
 * The visitor's answers as labelled lines. The model and the checker both read
 * exactly this, so the checker judges the report against what the writer saw.
 */
export function intakeTranscript(intake: MapperIntake) {
  const lines = [
    `Business type: ${businessPhrase(intake)}`,
    intake.sells ? `What they sell: ${intake.sells}` : '',
    `Problem that hurts most (their one choice): ${problemById(intake.problem).label}`,
    `Where it happens: ${withOther(intake.symptoms, OTHER, intake.symptomOther).join('; ')}`,
    `How customers reach them: ${intake.channels.join('; ')}`,
    `How they keep track: ${withOther(intake.tools, OTHER, intake.toolsOther).join('; ')}`,
    `Enquiries or orders in a normal week: ${intake.volume}`,
    `People handling customers or orders: ${intake.team}`,
    `Markets: ${withOther(intake.markets, ANOTHER_MARKET, intake.marketOther).join('; ')}`,
    intake.frequency
      ? `How often the problem happens: ${intake.frequency}`
      : '',
    intake.example
      ? `Last time it went wrong, in their words: "${intake.example}"`
      : '',
    intake.tried ? `What they have tried already: "${intake.tried}"` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

/** One paragraph for the lead record the founder reads. */
export function intakeSummary(intake: MapperIntake) {
  return intakeTranscript(intake).split('\n').join('. ').replace(/\.\./g, '.');
}

/* ------------------------------------------------------------------------ */
/* The previous three-question format. Pages cached before the change still  */
/* send it to /api/opportunities, and those enquiries must not be refused.    */
/* ------------------------------------------------------------------------ */

export const legacyMapperQuestions = [
  {
    options: [
      'Get more enquiries and sales',
      'Sell online or make buying easier',
      'Serve customers better',
      'Reduce manual work and connect systems',
      'Understand business performance',
      'Develop a new digital product',
      'Help me work out where to start',
    ],
  },
  { options: [...markets] },
  {
    options: [
      'WhatsApp, phone or social media',
      'A website',
      'Online payments or ecommerce',
      'Email and basic invoicing',
      'Spreadsheets and manual handoffs',
      'Several disconnected apps',
      'Starting something new',
      'Something else',
      'Not sure what tools we use',
    ],
    exclusive: 'Not sure what tools we use',
  },
] as const;

export type MapperAnswers = [string[], string[], string[]];

/** Old single-answer enquiries still arrive from cached pages. */
export function parseMapperAnswers(value: unknown): MapperAnswers | null {
  if (!Array.isArray(value) || value.length !== legacyMapperQuestions.length)
    return null;
  const parsed = value.map((answer, index) => {
    const question = legacyMapperQuestions[index];
    const values = typeof answer === 'string' ? [answer] : answer;
    if (
      !Array.isArray(values) ||
      values.length < 1 ||
      values.length > question.options.length
    )
      return null;
    const cleaned = values.map((item) =>
      typeof item === 'string' ? item.trim().slice(0, 120) : '',
    );
    if (
      cleaned.some((item) => !item) ||
      new Set(cleaned).size !== cleaned.length
    )
      return null;
    // Cached single-answer pages may contain even older labels. Arrays must
    // contain only choices that the visitor could actually have seen.
    if (
      Array.isArray(answer) &&
      cleaned.some(
        (item) => !(question.options as readonly string[]).includes(item),
      )
    )
      return null;
    const exclusive = 'exclusive' in question ? question.exclusive : null;
    if (exclusive && cleaned.includes(exclusive) && cleaned.length > 1)
      return null;
    return cleaned;
  });
  return parsed.every(Boolean) ? (parsed as MapperAnswers) : null;
}
