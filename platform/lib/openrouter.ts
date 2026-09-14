import { cleanAiText, cleanAiValue } from './ai-text';
import { logBackendEvent } from './backend-events';
import { requestContext } from './request-context';
import { errorCode } from './log-policy';
import { AI_PROFILES, routingConfig, type AiProfile } from './ai-routing';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

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
  return routingConfig().models;
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/** OpenRouter reports cost in dollars. Store whole micros so it fits an integer column. */
export function toCostMicros(cost: unknown): number | undefined {
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0)
    return undefined;
  return Math.round(cost * 1_000_000);
}

export type AiTelemetry = {
  model: string;
  requestedModels: string[];
  routing: string;
  profile: AiProfile;
  requestId?: string;
  appRequestId: string;
  operationId: string;
  promptTokens?: number;
  completionTokens?: number;
};
export async function chatComplete(options: {
  messages: ChatMessage[];
  models?: string[];
  profile?: AiProfile;
  routing?: 'auto' | 'default';
  sessionId?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  timeoutMs?: number;
  webSearch?: boolean;
}): Promise<{
  content: string;
  model: string;
  costMicros?: number;
  telemetry: AiTelemetry;
  citations: Array<{ url: string; title: string; content: string }>;
}> {
  const profile =
    options.profile || (options.json ? 'structured' : 'conversation');
  const config = routingConfig(profile, options.routing);
  const models = options.models
    ? [
        ...new Set(options.models.map((model) => model.trim()).filter(Boolean)),
      ].slice(0, 3)
    : config.models;
  if (!models.length) throw new Error('At least one model is required.');
  const maxTokens = Math.min(
    4000,
    Math.max(
      1024,
      Math.floor(options.maxTokens || AI_PROFILES[profile].maxTokens),
    ),
  );
  const timeoutMs = Math.min(
    60000,
    Math.max(1000, options.timeoutMs || AI_PROFILES[profile].timeoutMs),
  );
  const started = Date.now();
  const operationId = crypto.randomUUID();
  const appRequestId = requestContext.getStore()?.requestId || operationId;
  const baseEvent = {
    requestId: appRequestId,
    operationId,
    profile,
    routing: config.mode,
  };
  await logBackendEvent('ai.started', baseEvent);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
        ...siteHeaders(),
      },
      body: JSON.stringify({
        model: models[0],
        ...(models.length > 1 ? { models: models.slice(1) } : {}),
        ...(models.includes('openrouter/auto')
          ? {
              plugins: [
                {
                  id: 'auto-router',
                  cost_tier: config.costTier,
                  ...(config.allowedModels.length
                    ? { allowed_models: config.allowedModels }
                    : {}),
                },
              ],
            }
          : {}),
        provider: {
          allow_fallbacks: true,
          ...(options.json ? { require_parameters: true } : {}),
        },
        temperature: options.temperature ?? 0.3,
        max_tokens: maxTokens,
        reasoning: { effort: 'low', exclude: true },
        ...(options.webSearch
          ? {
              tools: [
                {
                  type: 'openrouter:web_search',
                  parameters: {
                    engine: 'exa',
                    max_results: 5,
                    max_total_results: 10,
                    max_uses: 2,
                    max_characters: 4000,
                  },
                },
              ],
              max_tool_calls: 2,
            }
          : {}),
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
        ...(options.sessionId
          ? { session_id: options.sessionId.slice(0, 120) }
          : {}),
        messages: [
          {
            role: 'system',
            content:
              'Write directly in clear business language. Use plain headings, paragraphs and simple lists. Do not use Markdown emphasis, heading hashes or code fences in prose. Preserve source references and uncertainty. Skip stock introductions and unnecessary claims about yourself. When JSON is requested, return valid JSON and use clean plain text within its string values.',
          },
          ...options.messages,
        ],
      }),
    });
    if (!response.ok)
      throw new Error(`OpenRouter chat completion failed: ${response.status}`);
    const data = (await response.json()) as {
      id?: string;
      error?: unknown;
      choices?: Array<{
        finish_reason?: string;
        message?: {
          content?: string;
          annotations?: Array<{
            type?: string;
            url_citation?: { url?: string; title?: string; content?: string };
          }>;
        };
      }>;
      model?: string;
      usage?: {
        cost?: number;
        prompt_tokens?: number;
        completion_tokens?: number;
      };
    };
    if (data.error) throw new Error('OpenRouter returned a completion error.');
    const choice = data.choices?.[0];
    let content = choice?.message?.content?.trim();
    if (!content)
      throw new Error('OpenRouter returned an empty chat response.');
    if (choice?.finish_reason === 'length')
      throw new Error('OpenRouter response was truncated.');
    if (options.json) {
      const parsed: unknown = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('Expected a JSON object.');
      content = JSON.stringify(cleanAiValue(parsed));
    } else {
      content = cleanAiText(content);
    }
    if (!content)
      throw new Error('OpenRouter returned an empty cleaned response.');
    const model = data.model || 'unreported';
    const telemetry: AiTelemetry = {
      model,
      appRequestId,
      operationId,
      requestedModels: models,
      routing: options.models ? 'explicit' : config.mode,
      profile,
      requestId: data.id,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    };
    await logBackendEvent('ai.completed', {
      ...baseEvent,
      model,
      providerRequestId: data.id,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      costMicros: toCostMicros(data.usage?.cost),
      durationMs: Date.now() - started,
    });
    return {
      content,
      model,
      costMicros: toCostMicros(data.usage?.cost),
      telemetry,
      citations: (choice?.message?.annotations || [])
        .filter(
          (a) =>
            a.type === 'url_citation' &&
            typeof a.url_citation?.url === 'string',
        )
        .slice(0, 20)
        .map((a) => ({
          url: a.url_citation!.url!.slice(0, 1500),
          title: (a.url_citation!.title || '').slice(0, 300),
          content: (a.url_citation!.content || '').slice(0, 6000),
        })),
    };
  } catch (error) {
    await logBackendEvent('ai.failed', {
      ...baseEvent,
      errorCode: controller.signal.aborted ? 'timeout' : errorCode(error),
      durationMs: Date.now() - started,
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type ReferenceImage = { url: string };

function referencePayload(referenceImages?: ReferenceImage[]) {
  if (!referenceImages?.length) return {};
  return {
    input_references: referenceImages.map((ref) => ({
      type: 'image_url',
      image_url: { url: ref.url },
    })),
  };
}

export async function generateImage(options: {
  prompt: string;
  model?: string;
  referenceImages?: ReferenceImage[];
  aspectRatio?: string;
  size?: string;
  timeoutMs?: number;
}): Promise<{
  base64: string;
  mediaType: string;
  model: string;
  costMicros?: number;
}> {
  const {
    prompt,
    model = DEFAULT_IMAGE_MODEL,
    referenceImages,
    aspectRatio,
    size,
    timeoutMs = 120_000,
  } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OPENROUTER_BASE}/images`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
        ...siteHeaders(),
      },
      body: JSON.stringify({
        model,
        prompt,
        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
        ...(size ? { size } : {}),
        ...referencePayload(referenceImages),
      }),
    });
    if (!response.ok)
      throw new Error(`OpenRouter image generation failed: ${response.status}`);
    const data = (await response.json()) as {
      data?: Array<{ b64_json?: string; media_type?: string }>;
      usage?: { cost?: number };
    };
    const image = data.data?.[0];
    if (!image?.b64_json) throw new Error('OpenRouter returned no image.');
    return {
      base64: image.b64_json,
      mediaType: image.media_type || 'image/png',
      model,
      costMicros: toCostMicros(data.usage?.cost),
    };
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
  const {
    prompt,
    model = DEFAULT_VIDEO_MODEL,
    referenceImages,
    duration,
    aspectRatio,
    generateAudio,
  } = options;
  const response = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...siteHeaders(),
    },
    body: JSON.stringify({
      model,
      prompt,
      ...(duration ? { duration } : {}),
      ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
      ...(typeof generateAudio === 'boolean'
        ? { generate_audio: generateAudio }
        : {}),
      ...referencePayload(referenceImages),
    }),
  });
  if (!response.ok)
    throw new Error(`OpenRouter video submission failed: ${response.status}`);
  const data = (await response.json()) as {
    id: string;
    polling_url: string;
    status: string;
  };
  return { id: data.id, pollingUrl: data.polling_url, status: data.status };
}

export async function pollVideo(
  pollingUrl: string,
): Promise<{ status: string; unsignedUrls?: string[]; error?: string }> {
  const response = await fetch(pollingUrl, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!response.ok)
    throw new Error(`OpenRouter video status check failed: ${response.status}`);
  const data = (await response.json()) as {
    status: string;
    unsigned_urls?: string[];
    error?: string;
  };
  return {
    status: data.status,
    unsignedUrls: data.unsigned_urls,
    error: data.error,
  };
}
