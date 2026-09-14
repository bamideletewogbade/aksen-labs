import { withRequestLog } from '@/lib/request-log';
import { logAgentRun } from '@/lib/agent-runs';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { chatComplete } from '@/lib/openrouter';

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const prompt =
    typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : '';
  const kind = body.kind === 'video' ? 'video' : 'image';
  if (!prompt)
    return NextResponse.json(
      { error: 'A prompt is required.' },
      { status: 400 },
    );

  try {
    const { content, costMicros, telemetry } = await chatComplete({
      profile: 'creative',
      temperature: 0.6,
      maxTokens: 220,
      messages: [
        {
          role: 'system',
          content: [
            `You expand short, rough ideas into a single detailed ${kind}-generation prompt for Aksen Labs, an African agentic AI company.`,
            'House visual direction: carbon black and soft white surfaces, restrained signal-green accents, authentic contemporary Accra, Ghana settings, natural skin tones, premium editorial realism.',
            'Never include: robots, floating brains, glowing holograms, Matrix-style code, cyberpunk cliches, readable on-image text, logos, or watermarks.',
            'Respond with exactly one dense paragraph (max 80 words) describing subject, setting, lighting, mood and composition, and nothing else.',
            'Never offer multiple options, headings, numbered lists, bold text, preamble or explanation. Output only the finished prompt text itself.',
          ].join(' '),
        },
        { role: 'user', content: prompt },
      ],
    });
    const enhanced = content.trim().replace(/^"|"$/g, '');
    if (!enhanced) throw new Error('Empty response');
    await logAgentRun({
      agentName: 'Creative prompt assistant',
      channel: 'admin',
      status: 'success',
      outcome: 'Prepared a creative brief',
      costMicros,
      trace: telemetry,
    });
    return NextResponse.json({ prompt: enhanced });
  } catch {
    await logAgentRun({
      agentName: 'Creative prompt assistant',
      channel: 'admin',
      status: 'error',
      outcome: 'Creative brief failed',
    });
    return NextResponse.json(
      { error: 'Could not enhance that prompt right now.' },
      { status: 502 },
    );
  }
}

export const POST = withRequestLog(
  '/api/admin/media/enhance-prompt',
  POSTHandler,
);
