export type AgentUseCase = {
  slug: string;
  name: string;
  shortName: string;
  category: 'Customer care' | 'Sales' | 'Operations' | 'Marketing';
  industry: string;
  promise: string;
  moment: string;
  work: string[];
  outcome: string;
  liveDemo?: string;
  liveLabel?: string;
};

export const agentCatalog: AgentUseCase[] = [
  {
    slug: 'property-concierge',
    name: 'Property Concierge',
    shortName: 'Property',
    category: 'Customer care',
    industry: 'Property',
    promise: 'Help people find suitable properties and move towards a viewing.',
    moment:
      'Ama sends a message after hours looking for a two-bedroom home in East Legon within a clear budget.',
    work: [
      'Answers common property questions',
      'Understands location, budget and timing',
      'Finds relevant available options',
      'Qualifies serious enquiries',
      'Prepares viewing requests for the team',
    ],
    outcome:
      'The customer gets useful help immediately and the property team receives a clear, qualified opportunity.',
    liveDemo: 'https://proptis-ai-concierge.accrainnovationcente.chatgpt.site/',
    liveLabel: 'Open the Proptis demonstration',
  },
  {
    slug: 'guest-concierge',
    name: 'Guest Concierge',
    shortName: 'Hospitality',
    category: 'Customer care',
    industry: 'Hospitality',
    promise: 'Look after routine guest requests before and during their stay.',
    moment:
      'Kojo wants a weekend room in Cape Coast, needs pickup information and has a late check-in question.',
    work: [
      'Answers stay and facility questions',
      'Checks the details needed for a reservation',
      'Captures special requests',
      'Prepares pickup and check-in information',
      'Hands exceptions to reception',
    ],
    outcome:
      'The guest feels attended to while reception receives one organized request instead of scattered messages.',
  },
  {
    slug: 'sales-order-guide',
    name: 'Sales and Order Guide',
    shortName: 'Retail',
    category: 'Sales',
    industry: 'Retail and commerce',
    promise: 'Turn stock and delivery questions into complete, useful orders.',
    moment:
      'Esi asks on WhatsApp whether an item is available and whether it can be delivered to Osu.',
    work: [
      'Answers product questions',
      'Checks approved stock information',
      'Suggests suitable alternatives',
      'Captures delivery details',
      'Creates a clear order for fulfilment',
    ],
    outcome:
      'Fewer interested customers disappear while waiting for a reply, and the team gets cleaner orders to fulfil.',
  },
  {
    slug: 'client-intake-guide',
    name: 'Client Intake Guide',
    shortName: 'Professional services',
    category: 'Sales',
    industry: 'Professional services',
    promise:
      'Understand a new client and prepare the right consultation or handover.',
    moment:
      'Yaw needs help registering a company but does not know which service or documents he needs.',
    work: [
      'Explains services in plain language',
      'Collects the relevant background',
      'Identifies urgency and fit',
      'Explains what to prepare',
      'Books or routes the consultation',
    ],
    outcome:
      'The prospect arrives better prepared and the right expert receives the context before the conversation.',
  },
  {
    slug: 'team-knowledge-guide',
    name: 'Team Knowledge Guide',
    shortName: 'Internal teams',
    category: 'Operations',
    industry: 'Growing businesses',
    promise:
      'Help employees find trusted answers and complete routine internal requests.',
    moment:
      'A team member needs the latest process, document or approval but is not sure who to ask.',
    work: [
      'Searches approved company knowledge',
      'Explains the right process',
      'Collects missing request details',
      'Routes approval to the right person',
      'Records the result for visibility',
    ],
    outcome:
      'People spend less time searching and managers receive better-prepared requests.',
  },
  {
    slug: 'campaign-companion',
    name: 'Campaign Companion',
    shortName: 'Marketing',
    category: 'Marketing',
    industry: 'Creators and marketing teams',
    promise:
      'Move from rough idea to organized content and customer follow-up.',
    moment:
      'Nana sends a voice note after a shoot with several ideas, offers and possible posts mixed together.',
    work: [
      'Finds the useful ideas in a rough brief',
      'Prepares channel-ready drafts',
      'Keeps the brand voice consistent',
      'Routes work for approval',
      'Organizes high-interest customer replies',
    ],
    outcome:
      'The team publishes faster and turns audience interest into a visible follow-up list.',
  },
];

export const agentCategories = [
  'All',
  'Customer care',
  'Sales',
  'Operations',
  'Marketing',
] as const;
