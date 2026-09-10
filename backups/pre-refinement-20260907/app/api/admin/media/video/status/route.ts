import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { pollVideo } from '@/lib/openrouter';

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const pollingUrl = new URL(request.url).searchParams.get('url') || '';
  let parsed: URL;
  try {
    parsed = new URL(pollingUrl);
  } catch {
    return NextResponse.json({ error: 'A valid polling url is required.' }, { status: 400 });
  }
  // The polling url is supplied by the client from an earlier submit response. Since this route
  // attaches our OpenRouter secret key to whatever url it fetches, only ever allow OpenRouter's
  // own host here — otherwise a crafted url could be used to exfiltrate the key to a third party.
  if (parsed.origin !== 'https://openrouter.ai') return NextResponse.json({ error: 'That polling url is not allowed.' }, { status: 400 });

  try {
    const status = await pollVideo(parsed.toString());
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ error: 'Could not check the video status right now.' }, { status: 502 });
  }
}
