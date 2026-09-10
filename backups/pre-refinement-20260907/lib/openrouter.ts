const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// OpenRouter's `models` fallback array is capped at 3 entries, so this stays at
// exactly 3 - DeepSeek V4 as the default, then two other providers for resilience
// if DeepSeek errors or is unavailable.
const DEFAULT_CHAT_MODELS = [
  'deepseek/deepseek-v4-pro-0813',
  'anthropic/claude-sonnet-5',
  'openai/gpt-4o-mini',
];

export const DEFAULT_IMAGE_MODEL = 'openai/gpt-image-1';
export const DEFAULT_VIDEO_MODEL = 'bytedance/seedance-2.0-mini';

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured.');
  return key;
}

function siteHeaders(): Record<string, string> {
  return {
    'HTTP-Referer': process.env.SITE_URL || 'https://aksenlabs.com',
    'X-Title': 'Aksen Labs',
  };
}

export function chatModels(): string[] {
  const override = process.env.OPENROUTER_MODEL;
  if (!override) return DEFAULT_CHAT_MODELS;
  return [override, ...DEFAULT_CHAT_MODELS.filter((model) => model !== override)];
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** OpenRouter reports cost in dollars. Store whole micros so it fits an integer column. */
export function toCostMicros(cost: unknown): number | undefined {
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0) return undefined;
  return Math.round(cost * 1_000_000);
}

export async function chatComplete(options: {
  messages: ChatMessage[];
  models?: string[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<{ content: string; model: string; costMicros?: number }> {
  const { messages, models = chatModels(), temperature = 0.3, maxTokens = 500, json = false, timeoutMs = 20_000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', ...siteHeaders() },
      body: JSON.stringify({
        models,
        temperature,
        max_tokens: maxTokens,
        // Some fallback models (DeepSeek V4 in particular) spend the max_tokens budget on an
        // internal reasoning trace before writing the actual answer, which can leave `content`
        // empty for short budgets. None of our call sites need that trace, so turn it off.
        reasoning: { enabled: false },
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        messages,
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter chat completion failed: ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; model?: string; usage?: { cost?: number } };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter returned an empty chat response.');
    return { content, model: data.model || models[0], costMicros: toCostMicros(data.usage?.cost) };
  } finally {
    clearTimeout(timeout);
  }
}

export type ReferenceImage = { url: string };

function referencePayload(referenceImages?: ReferenceImage[]) {
  if (!referenceImages?.length) return {};
  return { input_references: referenceImages.map((ref) => ({ type: 'image_url', image_url: { url: ref.url } })) };
}

export async function generateImage(options: {
  prompt: string;
  model?: string;
  referenceImages?: ReferenceImage[];
  aspectRatio?: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{ base64: string; mediaType: string; model: string; costMicros?: number }> {
  const { prompt, model = DEFAULT_IMAGE_MODEL, referenceImages, aspectRatio, size, timeoutMs = 120_000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OPENROUTER_BASE}/images`, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', ...siteHeaders() },
      body: JSON.stringify({
        model,
        prompt,
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
        ...(size ? { size } : {}),
        ...referencePayload(referenceImages),
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter image generation failed: ${response.status}`);
    const data = await response.json() as { data?: Array<{ b64_json?: string; media_type?: string }>; usage?: { cost?: number } };
    const image = data.data?.[0];
    if (!image?.b64_json) throw new Error('OpenRouter returned no image.');
    return { base64: image.b64_json, mediaType: image.media_type || 'image/png', model, costMicros: toCostMicros(data.usage?.cost) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitVideo(options: {
  prompt: string;
  model?: string;
  referenceImages?: ReferenceImage[];
  duration?: number;
  aspectRatio?: string;
  generateAudio?: boolean;
}): Promise<{ id: string; pollingUrl: string; status: string }> {
  const { prompt, model = DEFAULT_VIDEO_MODEL, referenceImages, duration, aspectRatio, generateAudio } = options;
  const response = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', ...siteHeaders() },
    body: JSON.stringify({
      model,
      prompt,
      ...(duration ? { duration } : {}),
      ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
      ...(typeof generateAudio === 'boolean' ? { generate_audio: generateAudio } : {}),
      ...referencePayload(referenceImages),
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter video submission failed: ${response.status}`);
  const data = await response.json() as { id: string; polling_url: string; status: string };
  return { id: data.id, pollingUrl: data.polling_url, status: data.status };
}

export async function pollVideo(pollingUrl: string): Promise<{ status: string; unsignedUrls?: string[]; error?: string }> {
  const response = await fetch(pollingUrl, { headers: { Authorization: `Bearer ${apiKey()}` } });
  if (!response.ok) throw new Error(`OpenRouter video status check failed: ${response.status}`);
  const data = await response.json() as { status: string; unsigned_urls?: string[]; error?: string };
  return { status: data.status, unsignedUrls: data.unsigned_urls, error: data.error };
}
