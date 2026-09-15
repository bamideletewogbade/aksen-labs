import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

export const socialProviders = [
  'linkedin',
  'instagram',
  'tiktok',
  'x',
] as const;
export type SocialProvider = (typeof socialProviders)[number];

export type SocialProfiles = Record<SocialProvider, string>;

export type SocialContext = {
  mission: string;
  audience: string;
  offers: string;
  voice: string;
  guardrails: string;
  callToAction: string;
};

export type SocialWorkspace = {
  profiles: SocialProfiles;
  context: SocialContext;
};

export const defaultSocialWorkspace: SocialWorkspace = {
  profiles: {
    linkedin: 'https://www.linkedin.com/in/bamidele-tewogbade/',
    instagram: '',
    tiktok: '',
    x: '',
  },
  context: {
    mission:
      'Make digital transformation practical and affordable for African businesses, using AI as a multiplier rather than the whole offer.',
    audience:
      'Owner-led SMEs and growing teams in Accra and Ghana first, then businesses across Africa and the wider world.',
    offers:
      'Digital strategy, websites and digital products, workflow automation, AI assistants and agents, WhatsApp experiences, data and operational systems, delivered from discovery through pilot to managed improvement.',
    voice:
      "Warm, direct, useful and grounded. Explain the business problem in plain language, show the practical path, and respect the reader's time.",
    guardrails:
      'Separate verified facts from ideas and hypotheses. Never invent adoption, client results, ROI, demand or testimonials. Do not publish, message prospects or make commitments without human approval.',
    callToAction:
      'Invite a low-pressure conversation or a small diagnostic step that helps the reader clarify one costly or repetitive workflow.',
  },
};

const contextLimits: Record<keyof SocialContext, number> = {
  mission: 600,
  audience: 600,
  offers: 1200,
  voice: 600,
  guardrails: 1000,
  callToAction: 500,
};

const providerHosts: Record<SocialProvider, string[]> = {
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanText(value: unknown, limit: number) {
  return (typeof value === 'string' ? value : '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function cleanProfileUrl(value: unknown, provider: SocialProvider) {
  const raw = cleanText(value, 500);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      !providerHosts[provider].includes(url.hostname)
    )
      return '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

export function cleanSocialWorkspace(value: unknown): SocialWorkspace {
  const root = objectValue(value);
  const rawProfiles = objectValue(root.profiles);
  const rawContext = objectValue(root.context);
  const profiles = Object.fromEntries(
    socialProviders.map((provider) => [
      provider,
      cleanProfileUrl(rawProfiles[provider], provider),
    ]),
  ) as SocialProfiles;
  const context = Object.fromEntries(
    (Object.keys(contextLimits) as Array<keyof SocialContext>).map((key) => [
      key,
      cleanText(rawContext[key], contextLimits[key]),
    ]),
  ) as SocialContext;
  return { profiles, context };
}

function mergeStored(value: unknown): SocialWorkspace {
  const root = objectValue(value);
  return cleanSocialWorkspace({
    profiles: {
      ...defaultSocialWorkspace.profiles,
      ...objectValue(root.profiles),
    },
    context: {
      ...defaultSocialWorkspace.context,
      ...objectValue(root.context),
    },
  });
}

export async function socialWorkspace(ownerId: string) {
  if (!ownerId) return defaultSocialWorkspace;
  try {
    const result = await getDb().execute(
      sql`SELECT social_profiles, social_context
          FROM workspace_settings WHERE owner_id=${ownerId}`,
    );
    const row = result.rows[0];
    if (!row) return defaultSocialWorkspace;
    return mergeStored({
      profiles: row.social_profiles,
      context: row.social_context,
    });
  } catch {
    // The admin should still render before the additive migration is applied.
    return defaultSocialWorkspace;
  }
}

export function socialContextPrompt(context: SocialContext) {
  return [
    `Mission: ${context.mission}`,
    `Audience: ${context.audience}`,
    `Offers: ${context.offers}`,
    `Voice: ${context.voice}`,
    `Evidence and approval rules: ${context.guardrails}`,
    `Preferred call to action: ${context.callToAction}`,
  ].join('\n');
}
