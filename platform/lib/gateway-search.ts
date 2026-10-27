/**
 * Web search through Vercel AI Gateway, for the calls that ask for it.
 *
 * Lead Scout and the editorial agent need two things from a search: an answer,
 * and the pages it came from, with their text. The evidence gate in
 * prospect-evidence.ts only accepts a website, email or phone number that
 * appears in a retrieved page, so a search that hides its results is no use
 * to it. The gateway's Chat Completions server tools hide them (only a call
 * count comes back), so this goes through the AI SDK instead, where Exa's
 * results arrive as tool results with url, title and page text.
 *
 * Exa is the same engine the OpenRouter route used, so the two routes find
 * comparable pages. Loaded with a dynamic import from openrouter.ts, so the
 * SDK is only touched by calls that search.
 */
import { createGateway, generateText, isStepCount } from 'ai';

export type GatewaySearchResult = {
  id?: string;
  model: string;
  content: string;
  finishReason: string;
  promptTokens?: number;
  completionTokens?: number;
  costDollars?: number;
  citations: Array<{ url: string; title: string; content: string }>;
};

type ExaResult = {
  url?: unknown;
  title?: unknown;
  text?: unknown;
  highlights?: unknown;
};

/** Exa tool output, flattened to the citation shape the callers already read. */
export function exaCitations(outputs: unknown[]) {
  const seen = new Set<string>();
  const citations: GatewaySearchResult['citations'] = [];
  for (const output of outputs) {
    const results = (output as { results?: unknown })?.results;
    if (!Array.isArray(results)) continue;
    for (const raw of results as ExaResult[]) {
      if (typeof raw?.url !== 'string' || seen.has(raw.url)) continue;
      seen.add(raw.url);
      const text =
        typeof raw.text === 'string'
          ? raw.text
          : Array.isArray(raw.highlights)
            ? raw.highlights.filter((h) => typeof h === 'string').join('\n')
            : '';
      citations.push({
        url: raw.url.slice(0, 1500),
        title: typeof raw.title === 'string' ? raw.title.slice(0, 300) : '',
        content: text.slice(0, 6000),
      });
    }
  }
  return citations.slice(0, 20);
}

export async function gatewaySearch(options: {
  apiKey: string;
  models: string[];
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
}): Promise<GatewaySearchResult> {
  const gateway = createGateway({ apiKey: options.apiKey });
  // AI SDK 7 refuses system messages inside `messages`; they go in
  // `instructions`, in the order the caller wrote them.
  const instructions = options.messages
    .filter((m) => m.role === 'system')
    .map((m) => ({ role: 'system' as const, content: m.content }));
  const conversation = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  const result = await generateText({
    model: gateway(options.models[0]),
    instructions,
    messages: conversation,
    temperature: options.temperature,
    maxOutputTokens: options.maxTokens,
    abortSignal: options.signal,
    // Matches the OpenRouter route's limits: five pages a search, about
    // 4,000 characters each, and room for two searches before the answer.
    tools: {
      exa_search: gateway.tools.exaSearch({
        numResults: 5,
        contents: { text: { maxCharacters: 4000 } },
      }),
    },
    stopWhen: isStepCount(3),
    providerOptions:
      options.models.length > 1
        ? { gateway: { models: options.models.slice(1) } }
        : undefined,
  });
  const outputs = result.steps.flatMap((step) =>
    step.toolResults
      .filter((part) => part.toolName === 'exa_search')
      .map((part) => part.output as unknown),
  );
  const { finalStep } = result;
  const cost = (finalStep.providerMetadata?.gateway as { cost?: unknown })
    ?.cost;
  const dollars = typeof cost === 'string' ? Number(cost) : cost;
  return {
    id: finalStep.response.id,
    model: finalStep.response.modelId,
    // Without response_format a model sometimes fences its JSON. A fence
    // around the whole answer carries nothing, so it goes.
    content: result.text
      .trim()
      .replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, '$1'),
    finishReason: result.finishReason,
    promptTokens: result.usage.inputTokens,
    completionTokens: result.usage.outputTokens,
    costDollars: typeof dollars === 'number' ? dollars : undefined,
    citations: exaCitations(outputs),
  };
}
