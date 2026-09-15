export type EditorialSource = {
  name: string;
  url: string;
  kind: 'Model lab' | 'Builder' | 'African tech' | 'Research';
  focus: string;
};

/**
 * A deliberately small watchlist. X is useful for early signals, while the
 * linked first-party sites and research pages are where a claim should be
 * verified before it reaches an article.
 */
export const editorialSources: EditorialSource[] = [
  {
    name: 'OpenAI',
    url: 'https://x.com/OpenAI',
    kind: 'Model lab',
    focus: 'Model launches, agents and applied AI',
  },
  {
    name: 'Anthropic',
    url: 'https://x.com/AnthropicAI',
    kind: 'Model lab',
    focus: 'Models, safety and long-running agents',
  },
  {
    name: 'Google DeepMind',
    url: 'https://x.com/GoogleDeepMind',
    kind: 'Model lab',
    focus: 'Models, multimodality and research',
  },
  {
    name: 'Meta AI',
    url: 'https://x.com/AIatMeta',
    kind: 'Model lab',
    focus: 'Open models and applied research',
  },
  {
    name: 'Mistral AI',
    url: 'https://x.com/MistralAI',
    kind: 'Model lab',
    focus: 'Efficient and open-weight models',
  },
  {
    name: 'Simon Willison',
    url: 'https://x.com/simonw',
    kind: 'Builder',
    focus: 'Hands-on model testing and tool design',
  },
  {
    name: 'Chip Huyen',
    url: 'https://x.com/chipro',
    kind: 'Builder',
    focus: 'AI engineering and production systems',
  },
  {
    name: 'Hamel Husain',
    url: 'https://x.com/HamelHusain',
    kind: 'Builder',
    focus: 'Evals, agents and dependable AI products',
  },
  {
    name: 'Latent Space',
    url: 'https://x.com/latentspacepod',
    kind: 'Builder',
    focus: 'AI engineering and architecture conversations',
  },
  {
    name: 'TechCabal',
    url: 'https://x.com/TechCabal',
    kind: 'African tech',
    focus: 'African startups, markets and operators',
  },
  {
    name: 'Briter Bridges',
    url: 'https://x.com/BriterBridges',
    kind: 'African tech',
    focus: 'African innovation and investment data',
  },
  {
    name: 'MEST Africa',
    url: 'https://x.com/MESTAfrica',
    kind: 'African tech',
    focus: 'West African founders and company building',
  },
  {
    name: 'Masakhane',
    url: 'https://www.masakhane.io/',
    kind: 'Research',
    focus: 'African language AI and local research',
  },
  {
    name: 'GSMA Mobile for Development',
    url: 'https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/',
    kind: 'Research',
    focus: 'Mobile-first adoption, inclusion and scalable use cases',
  },
  {
    name: 'TechCabal Insights',
    url: 'https://insights.techcabal.com/',
    kind: 'Research',
    focus: 'African technology and funding evidence',
  },
];

export const editorialPillars = [
  'What a new model changes for an African business in practice',
  'Architecture notes: agents, retrieval, evals, cost and reliability',
  'AI entrepreneurship in Ghana and across Africa',
  'Digital operations for owner-led and growing businesses',
  'What Aksen is learning while building products and client systems',
];

export function editorialResearchBrief(today: string) {
  return `Today is ${today}. Find timely, source-backed story opportunities for Aksen Labs.

Editorial pillars:
${editorialPillars.map((pillar) => `- ${pillar}`).join('\n')}

Watchlist:
${editorialSources.map((source) => `- ${source.name}: ${source.focus} (${source.url})`).join('\n')}

Use X posts as early signals, not final proof. Verify launches and factual claims on a model lab's official announcement, a named research paper, or a reputable African technology publication. Prefer developments from the last 30 days. A useful older architecture source is allowed when a current event gives it a new practical angle.`;
}
