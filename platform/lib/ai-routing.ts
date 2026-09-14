export const AI_PROFILES = {
  conversation: {
    label: 'Customer conversations',
    costTier: 'low',
    maxTokens: 500,
    timeoutMs: 20000,
  },
  structured: {
    label: 'Structured recommendations',
    costTier: 'low',
    maxTokens: 900,
    timeoutMs: 25000,
  },
  drafting: {
    label: 'Business document drafting',
    costTier: 'medium',
    maxTokens: 1800,
    timeoutMs: 45000,
  },
  creative: {
    label: 'Creative brief preparation',
    costTier: 'low',
    maxTokens: 500,
    timeoutMs: 20000,
  },
} as const;
export type AiProfile = keyof typeof AI_PROFILES;
export const DEFAULT_MODEL = 'deepseek/deepseek-v4-pro-0813';
const list = (value: string) => [
  ...new Set(
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  ),
];
export function routingConfig(
  profile: AiProfile = 'conversation',
  mode?: 'auto' | 'default',
) {
  const selectedMode =
    mode ||
    (process.env.OPENROUTER_ROUTING_MODE === 'default' ? 'default' : 'auto');
  const defaultModel = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
  const fallbacks = list(
    process.env.OPENROUTER_FALLBACK_MODELS ||
      'anthropic/claude-sonnet-5,openai/gpt-4o-mini',
  ).filter((model) => model !== 'openrouter/auto');
  const models = [
    ...new Set([
      ...(selectedMode === 'auto' ? ['openrouter/auto'] : []),
      defaultModel,
      ...fallbacks,
    ]),
  ].slice(0, 3);
  const tier = process.env.OPENROUTER_AUTO_COST_TIER;
  const costTier =
    tier && ['low', 'medium', 'high', 'xhigh', 'max'].includes(tier)
      ? tier
      : AI_PROFILES[profile].costTier;
  return {
    mode: selectedMode,
    defaultModel,
    models,
    costTier,
    allowedModels: list(process.env.OPENROUTER_AUTO_ALLOWED_MODELS || ''),
    profile,
  };
}
