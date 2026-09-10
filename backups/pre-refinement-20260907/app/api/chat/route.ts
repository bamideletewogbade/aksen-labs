import { NextResponse } from 'next/server';
import { chatComplete, type ChatMessage } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';
import { saveConversationTurn } from '@/lib/conversations';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, limit = 900) {
  if (typeof value !== 'string') return '';
  return value.replace(/\*\*/g, '').replace(/[—–]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/#{1,6}\s*/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Please send a valid question.' }, { status: 400 }); }
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const question = cleanText(input.question, 500);
  const history = Array.isArray(input.history) ? input.history.slice(-6).map((item): ChatMessage | null => {
    if (!item || typeof item !== 'object') return null;
    const message = item as Record<string, unknown>;
    const role = message.role === 'assistant' ? 'assistant' : 'user';
    const content = cleanText(message.content, 500);
    return content ? { role, content } : null;
  }).filter((item): item is ChatMessage => item !== null) : [];
  if (!question) return NextResponse.json({ error: 'Ask a short question about Aksen.' }, { status: 400 });
  const conversationId = typeof input.conversationId === 'string' && UUID_PATTERN.test(input.conversationId) ? input.conversationId : crypto.randomUUID();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    await saveConversationTurn({ id: conversationId, summary: question, handoffReason: 'The guide is not configured with a model provider.', urgency: 'elevated' });
    return NextResponse.json({
      answer: 'Aksen helps businesses improve customer experiences, connect operations and build digital products, using AI where it adds value. Explore our services or tell us what you want your business to do better.',
      links: [{ label: 'Explore our services', href: '/solutions' }, { label: 'Discuss your business', href: '/agent-mapper' }],
      source: 'fallback',
    });
  }

  const startedAt = Date.now();
  try {
    const { content, costMicros } = await chatComplete({
      temperature: 0.25,
      maxTokens: 220,
      messages: [
        {
          role: 'system',
          content: 'You are the Aksen Guide. Aksen Labs is a Ghana-based digital transformation agency helping African businesses grow, serve customers better and operate more effectively. Its capability areas are customer experience and commerce, business systems and operations, data and insight, and digital products. AI is used where it improves the work. Begin by understanding the visitor\'s business goal and existing setup. Suggest a relevant service or a scoping conversation. Do not force every need into an AI agent or a single workflow. Do not invent clients, completed projects, integrations, prices, geographic offices or performance results. TFS is an illustrative proposal model, not a delivered client result. Treat Nigeria and other African countries as possible markets, subject to actual project fit and delivery arrangements. Answer in at most 70 words using warm, plain business language. Do not use markdown, bullets, asterisks, em dashes, technical architecture terms or invented claims. When useful, recommend exploring our services (/solutions), our approach (/how-it-works), illustrative scenarios (/industries), or discussing their business (/agent-mapper).'
        },
        ...history,
        { role: 'user', content: question },
      ],
    });
    const answer = cleanText(content, 900);
    if (!answer) throw new Error('Empty guide response');
    await Promise.all([
      logAgentRun({ agentName: 'Front Door', channel: 'web', status: 'success', outcome: answer.slice(0, 160), durationMs: Date.now() - startedAt, costMicros }),
      saveConversationTurn({ id: conversationId, summary: question, handoffReason: null, urgency: 'normal' }),
    ]);
    return NextResponse.json({
      answer,
      links: [
        { label: 'Explore our services', href: '/solutions' },
        { label: 'How we work', href: '/how-it-works' },
        { label: 'Discuss your business', href: '/agent-mapper' },
      ],
      source: 'openrouter',
    });
  } catch {
    await Promise.all([
      logAgentRun({ agentName: 'Front Door', channel: 'web', status: 'error', outcome: 'Fell back to the canned answer', durationMs: Date.now() - startedAt }),
      saveConversationTurn({ id: conversationId, summary: question, handoffReason: 'The guide could not reach a model and used the canned fallback answer.', urgency: 'elevated' }),
    ]);
    return NextResponse.json({
      answer: 'Aksen helps businesses improve customer experiences, connect operations and build digital products, using AI where it adds value. Explore our services or tell us what you want your business to do better.',
      links: [
        { label: 'Explore our services', href: '/solutions' },
        { label: 'Discuss your business', href: '/agent-mapper' },
      ],
      source: 'fallback',
    });
  }
}
