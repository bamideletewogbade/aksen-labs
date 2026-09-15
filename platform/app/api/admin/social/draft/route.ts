import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import { chatComplete } from '@/lib/openrouter';
import { withRequestLog } from '@/lib/request-log';
import {
  socialContextPrompt,
  socialProviders,
  socialWorkspace,
  type SocialProvider,
} from '@/lib/social-context';

const labels: Record<SocialProvider, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
};

const clean = (value: unknown, limit: number) =>
  (typeof value === 'string' ? value : '').trim().slice(0, limit);

function requestedProviders(value: unknown) {
  if (!Array.isArray(value)) return [...socialProviders];
  const selected = value.filter((item): item is SocialProvider =>
    socialProviders.includes(item as SocialProvider),
  );
  return [...new Set(selected)].slice(0, socialProviders.length);
}

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 6000);
  } catch {
    return NextResponse.json(
      { error: 'A valid draft brief is required.' },
      { status: 400 },
    );
  }
  const topic = clean(body.topic, 1200);
  const goal = clean(body.goal, 500);
  const proof = clean(body.proof, 2200);
  const providers = requestedProviders(body.providers);
  if (!topic || !providers.length)
    return NextResponse.json(
      { error: 'Add a topic and choose at least one channel.' },
      { status: 400 },
    );

  try {
    const workspace = await socialWorkspace(user.userId);
    const requestedShape = providers
      .map((provider) => `"${provider}":""`)
      .join(',');
    const result = await chatComplete({
      profile: 'drafting',
      json: true,
      temperature: 0.45,
      maxTokens: 2200,
      timeoutMs: 60_000,
      messages: [
        {
          role: 'system',
          content: [
            "You are Aksen Labs' social content partner. Produce drafts for human review; never claim that anything was posted.",
            `Return only JSON {"drafts":{${requestedShape}}}. Include exactly the requested keys.`,
            'LinkedIn: thoughtful and specific, with a strong opening and short paragraphs. Instagram: vivid, useful caption with restrained hashtags. TikTok: a natural 30-45 second spoken script with a hook, useful middle and simple close. X: one self-contained post, concise enough for a standard post.',
            'Do not invent customers, case studies, results, statistics, partnerships or demand. If proof is absent, write from principles, a build lesson, a question or an observable product capability.',
            'Avoid generic AI hype, engagement bait and repeated wording across channels. Never include credentials, private data or instructions to auto-publish.',
            socialContextPrompt(workspace.context),
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Topic or raw thought: ${topic}\nGoal: ${goal || 'Share something useful and start a relevant conversation.'}\nVerified proof or source notes: ${proof || 'None supplied. Make no outcome or factual performance claims.'}\nChannels: ${providers.map((provider) => labels[provider]).join(', ')}`,
        },
      ],
    });
    const parsed = JSON.parse(result.content) as { drafts?: unknown };
    const rawDrafts =
      parsed.drafts && typeof parsed.drafts === 'object'
        ? (parsed.drafts as Record<string, unknown>)
        : {};
    const drafts = Object.fromEntries(
      providers.map((provider) => [provider, clean(rawDrafts[provider], 5000)]),
    );
    if (Object.values(drafts).some((draft) => !draft))
      throw new Error('Incomplete social draft response.');

    await getDb()
      .insert(auditEvents)
      .values({
        id: crypto.randomUUID(),
        actorId: user.userId,
        actorType: 'agent',
        action: 'social.drafts_created',
        entityType: 'workspace',
        entityId: user.userId,
        details: { providers, model: result.model },
      })
      .catch(() => null);
    return NextResponse.json({ drafts });
  } catch {
    return NextResponse.json(
      {
        error:
          'Social drafts could not be created. Check AI usage and configuration.',
      },
      { status: 502 },
    );
  }
}

export const POST = withRequestLog('/api/admin/social/draft', POSTHandler);
