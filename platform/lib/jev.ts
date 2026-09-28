/**
 * Jev, OpenRouter's Decisions API: calibrated probabilities on typed questions.
 *
 * Taken from Bishop-Platform/platform/lib/jev/client.ts, which found the two
 * things that cost time. The endpoint is /api/alpha/decisions; /api/v1/decisions
 * is a 404 that reads like "model unavailable" rather than "wrong URL". And it
 * needs prepaid credit, so a trial balance answers 402.
 *
 * Callers treat any failure as "no answer" and let a person decide. Jev is a
 * second opinion in this app, never a gate that can block work.
 */

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';
export const JEV_MODEL = 'typesafe/jev-1.13';

export type JevAnswer = {
  noul?: number;
  choice?: string;
  score?: number;
  confidence?: number;
};

export async function askJev(input: {
  state: string;
  questions: Record<string, { type: string; instructions: string }>;
  timeoutMs?: number;
}): Promise<Record<string, JevAnswer>> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error('OPENROUTER_API_KEY is not set.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 12000);
  try {
    const response = await fetch(DECISIONS_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://aksenlabs.com',
        'X-Title': 'Aksen Labs',
      },
      body: JSON.stringify({
        model: process.env.JEV_MODEL?.trim() || JEV_MODEL,
        state: input.state,
        questions: input.questions,
      }),
    });
    if (response.status === 402)
      throw new Error('Jev needs prepaid OpenRouter credit.');
    if (!response.ok) throw new Error(`Jev returned ${response.status}.`);
    const body = (await response.json()) as {
      answers?: Record<string, JevAnswer>;
      error?: { message?: string };
    };
    if (body.error || !body.answers)
      throw new Error(body.error?.message || 'Jev returned no answers.');
    return body.answers;
  } finally {
    clearTimeout(timer);
  }
}
