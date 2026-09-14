import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { boundedJson } from '@/lib/bounded-json';
import {
  retrievedArticleLimit,
  scoreSupportArticles,
} from '@/lib/support-knowledge';

/**
 * What would the assistant be given, if someone asked this?
 *
 * Runs the real scoring rather than an approximation of it, and calls no model:
 * retrieval happens before the model is involved, so this costs nothing and
 * can be used as often as it is useful. It answers a question the knowledge
 * screen could not: whether an entry is reachable at all.
 */
async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 2000);
  } catch {
    return NextResponse.json(
      { error: 'Ask a question to preview.' },
      { status: 400 },
    );
  }
  const question = (typeof body.question === 'string' ? body.question : '')
    .trim()
    .slice(0, 500);
  if (!question)
    return NextResponse.json(
      { error: 'Ask a question to preview.' },
      { status: 400 },
    );

  const scored = scoreSupportArticles(question);
  const reached = scored.filter((match) => match.score > 0);

  return NextResponse.json(
    {
      question,
      limit: retrievedArticleLimit,
      // Everything scored, not only the winners: seeing that an entry scored
      // zero is the useful part when a question goes to the wrong place.
      matches: scored.map((match, index) => ({
        id: match.article.id,
        title: match.article.title,
        score: match.score,
        matched: match.matched.slice(0, 12),
        // Rank among entries that scored at all, so the cut-off is visible.
        sent: match.score > 0 && index < retrievedArticleLimit,
      })),
      reached: reached.length,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export const POST = withRequestLog('/api/admin/support/knowledge', POSTHandler);
