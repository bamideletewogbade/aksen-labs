/**
 * Jev, TypeSafe's System One model: calibrated probabilities on typed questions.
 *
 * Three routes reach it, tried in order until one answers:
 *
 * 1. Vercel AI Gateway's TypeSafe-compatible API, when the gateway is on. Same
 *    request and response shapes as TypeSafe, billed and logged with every
 *    other model call. Its model is GATEWAY_JEV_MODEL in ai-routing.ts, from
 *    https://ai-gateway.vercel.sh/typesafe/v1/models.
 * 2. TypeSafe directly, when TYPESAFE_API_KEY is set.
 * 3. OpenRouter's Decisions API. Taken from Bishop-Platform, which found the
 *    two things that cost time: the endpoint is /api/alpha/decisions
 *    (/api/v1/decisions is a 404 that reads like "model unavailable"), and it
 *    needs prepaid credit, so a trial balance answers 402.
 *
 * Callers treat any failure as "no answer" and let a person decide. Jev is a
 * second opinion in this app, never a gate that can block work.
 */
import { GATEWAY_JEV_MODEL, gatewayEnabled } from './ai-routing';

export { GATEWAY_JEV_MODEL };
export const JEV_MODEL = 'typesafe/jev-1.13';

export type JevProvider = 'gateway' | 'typesafe' | 'openrouter';

export type JevAnswer = {
  noul?: number;
  choice?: string;
  score?: number;
  confidence?: number;
};

type Route = {
  provider: JevProvider;
  url: string;
  key: string;
  model: string;
  headers?: Record<string, string>;
};

function routes(): Route[] {
  const list: Route[] = [];
  const gateway = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gateway && gatewayEnabled())
    list.push({
      provider: 'gateway',
      url: 'https://ai-gateway.vercel.sh/typesafe/v1/systemone',
      key: gateway,
      model: process.env.AI_GATEWAY_JEV_MODEL?.trim() || GATEWAY_JEV_MODEL,
    });
  const typesafe = process.env.TYPESAFE_API_KEY?.trim();
  if (typesafe)
    list.push({
      provider: 'typesafe',
      url: 'https://api.typesafe.ai/v1/systemone',
      key: typesafe,
      model: 'jev-latest',
    });
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter)
    list.push({
      provider: 'openrouter',
      url: 'https://openrouter.ai/api/alpha/decisions',
      key: openrouter,
      model: process.env.JEV_MODEL?.trim() || JEV_MODEL,
      headers: {
        'HTTP-Referer': process.env.SITE_URL || 'https://aksenlabs.com',
        'X-Title': 'Aksen Labs',
      },
    });
  return list;
}

/** Whether any route to Jev is configured. */
export function jevConfigured(): boolean {
  return routes().length > 0;
}

/**
 * One System One request, returned raw with the route that answered.
 *
 * The timeout covers every attempt together, so a slow first route cannot
 * make the caller wait three times over.
 */
export async function systemOne(input: {
  state: unknown;
  questions: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ provider: JevProvider; body: Record<string, unknown> }> {
  const available = routes();
  if (!available.length) throw new Error('No Jev route is configured.');
  const signal = AbortSignal.timeout(input.timeoutMs ?? 12000);
  let lastError: unknown;
  for (const route of available) {
    try {
      const response = await fetch(route.url, {
        method: 'POST',
        signal,
        headers: {
          authorization: `Bearer ${route.key}`,
          'content-type': 'application/json',
          ...route.headers,
        },
        body: JSON.stringify({
          model: route.model,
          state: input.state,
          questions: input.questions,
        }),
      });
      if (response.status === 402)
        throw new Error(`Jev on ${route.provider} needs prepaid credit.`);
      if (!response.ok)
        throw new Error(
          `Jev on ${route.provider} returned ${response.status}.`,
        );
      const body = (await response.json()) as Record<string, unknown>;
      if (body.error || !body.answers)
        throw new Error(`Jev on ${route.provider} returned no answers.`);
      return { provider: route.provider, body };
    } catch (error) {
      lastError = error;
      if (signal.aborted) break;
    }
  }
  throw lastError;
}

export async function askJev(input: {
  state: string;
  questions: Record<string, { type: string; instructions: string }>;
  timeoutMs?: number;
}): Promise<Record<string, JevAnswer>> {
  const { body } = await systemOne(input);
  return body.answers as Record<string, JevAnswer>;
}
