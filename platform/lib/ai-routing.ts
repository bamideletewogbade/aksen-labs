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
/**
 * Vercel AI Gateway is the first route when its key is present.
 *
 * One key reaches every provider, with fallbacks across models and one place
 * to read spend, so a provider outage becomes a slower answer rather than a
 * broken page. OpenRouter stays configured behind it: if the gateway refuses a
 * request, the same call is retried there. Model ids differ between the two,
 * so the gateway has its own lists, all kept here.
 *
 * The Vercel team is on AI Gateway's free tier, which serves only part of the
 * catalogue and answers 403 for the rest (DeepSeek V4 Pro, every Anthropic
 * model, Gemini 3.6, Jev). Every gateway model below is on the free tier, from
 * https://vercel.com/ai-gateway/models?freeTier=true on 23 Oct 2026, and each
 * was checked with one live call on 24 Oct 2026. Buying credits moves the team
 * to the paid tier; the env overrides then reach the full catalogue without a
 * code change.
 */
export const GATEWAY_DEFAULT_MODEL = 'google/gemini-2.5-flash';
export const GATEWAY_FALLBACK_MODELS =
  'openai/gpt-4.1-mini,deepseek/deepseek-v3.1';
/**
 * The Front Desk agent on /agents: small, quick, and reliable at calling the
 * shop's tools in order. AI_GATEWAY_AGENT_MODEL overrides the first.
 */
export const GATEWAY_AGENT_MODEL = 'openai/gpt-4.1-mini';
export const GATEWAY_AGENT_FALLBACKS = ['google/gemini-2.5-flash'];
/**
 * The mapper's writer. Its probe found cheap routed models wrote generic
 * reports, so it gets the strongest free-tier writer, with a different
 * family behind it. MAPPER_WRITER_GATEWAY_MODELS overrides them.
 */
export const GATEWAY_MAPPER_WRITER_MODELS =
  'openai/gpt-4.1,google/gemini-2.5-flash';
export function gatewayMapperWriterModels(): string[] {
  return list(
    process.env.MAPPER_WRITER_GATEWAY_MODELS || GATEWAY_MAPPER_WRITER_MODELS,
  ).slice(0, 3);
}
/**
 * Jev's stand-in on the free tier: a decision model served by the gateway's
 * TypeSafe-compatible API that answers both noul and choice questions.
 * AI_GATEWAY_JEV_MODEL overrides it; typesafe-ai/jev-1.13.0 once on credits.
 */
export const GATEWAY_JEV_MODEL = 'liquid/d1-ultra';
export function gatewayEnabled(): boolean {
  return (
    !!process.env.AI_GATEWAY_API_KEY?.trim() &&
    process.env.AI_PROVIDER !== 'openrouter'
  );
}
/** Whether any model route is configured. Use this, not one provider's key. */
export function aiConfigured(): boolean {
  return gatewayEnabled() || !!process.env.OPENROUTER_API_KEY?.trim();
}
/**
 * Lead Scout's gateway models. They match the defaults today, but stay
 * separate: the search needs tools, JSON output and temperature (it runs at
 * 0.1), which not every default candidate offers. Three providers, so one
 * outage leaves two. AI_GATEWAY_SCOUT_MODELS overrides them.
 */
export const GATEWAY_SCOUT_MODELS =
  'google/gemini-2.5-flash,openai/gpt-4.1-mini,deepseek/deepseek-v3.1';
export function gatewayScoutModels(): string[] {
  return list(
    process.env.AI_GATEWAY_SCOUT_MODELS || GATEWAY_SCOUT_MODELS,
  ).slice(0, 3);
}
export function gatewayModels(): string[] {
  return [
    ...new Set([
      process.env.AI_GATEWAY_MODEL?.trim() || GATEWAY_DEFAULT_MODEL,
      ...list(
        process.env.AI_GATEWAY_FALLBACK_MODELS || GATEWAY_FALLBACK_MODELS,
      ),
    ]),
  ].slice(0, 3);
}
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
