import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { chatComplete } from '@/lib/openrouter';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = await request.json() as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : '';
  const kind = body.kind === 'video' ? 'video' : 'image';
  if (!prompt) return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });

  try {
    const { content } = await chatComplete({
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
    return NextResponse.json({ prompt: enhanced });
  } catch {
    return NextResponse.json({ error: 'Could not enhance that prompt right now.' }, { status: 502 });
  }
}
