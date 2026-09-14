export type Citation = { url: string; title: string; content: string };
export type PublicContact = {
  kind: 'email' | 'phone' | 'linkedin' | 'x';
  value: string;
  source: string;
  excerpt: string;
};
export type Prospect = {
  company: string;
  website: string;
  domain: string;
  description: string;
  opportunity: string;
  contacts: PublicContact[];
  sources: Citation[];
  checkedAt: string;
};
export function publicUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 1500) return null;
  try {
    const u = new URL(value);
    if (
      !['https:', 'http:'].includes(u.protocol) ||
      u.username ||
      u.password ||
      u.port ||
      !u.hostname.includes('.') ||
      /(^[\d.]+$|:|\.local$|\.internal$|\.localhost$)/i.test(u.hostname)
    )
      return null;
    u.hash = '';
    return u.href;
  } catch {
    return null;
  }
}
const plain = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';
export function validateProspects(
  raw: unknown,
  citations: Citation[],
): Prospect[] {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as { leads?: unknown }).leads)
  )
    throw new Error('Invalid prospect response.');
  const indexed = new Map(
    citations.flatMap((c) => {
      const url = publicUrl(c.url);
      return url ? [[url, { ...c, url }] as const] : [];
    }),
  );
  const accepted: Prospect[] = [];
  for (const item of (raw as { leads: unknown[] }).leads.slice(0, 5)) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    const company = plain(p.company, 160);
    const website = publicUrl(p.website);
    if (!company || !website || !Array.isArray(p.sources)) continue;
    const sources = p.sources
      .map((s) => indexed.get(publicUrl(s) || ''))
      .filter((s): s is Citation => !!s);
    const domain = new URL(website).hostname
      .replace(/^www\./, '')
      .toLowerCase();
    if (
      [
        'linkedin.com',
        'twitter.com',
        'x.com',
        'facebook.com',
        'instagram.com',
      ].some((d) => domain === d || domain.endsWith('.' + d))
    )
      continue;
    // A company website must actually appear in a returned citation or its excerpt.
    if (
      !sources.some(
        (s) =>
          new URL(s.url).hostname.replace(/^www\./, '') === domain ||
          s.content.toLowerCase().includes(domain),
      )
    )
      continue;
    const contacts: PublicContact[] = [];
    for (const entry of Array.isArray(p.contacts)
      ? p.contacts.slice(0, 10)
      : []) {
      if (!entry || typeof entry !== 'object') continue;
      const c = entry as Record<string, unknown>;
      const value = plain(c.value, 250);
      const source = indexed.get(publicUrl(c.source) || '');
      if (!value || !source || !sources.some((s) => s.url === source.url))
        continue;
      let supported = false;
      if (c.kind === 'email')
        supported =
          /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) &&
          source.content.toLowerCase().includes(value.toLowerCase());
      if (c.kind === 'phone') {
        const digits = value.replace(/\D/g, '');
        supported =
          /^[+\d ()-]+$/.test(value) &&
          digits.length >= 8 &&
          digits.length <= 15 &&
          source.content
            .replace(/[^\d+()\s-]/g, '|')
            .split('|')
            .some((chunk) => chunk.replace(/\D/g, '').includes(digits));
      }
      if (c.kind === 'linkedin' || c.kind === 'x') {
        const link = publicUrl(value);
        if (link) {
          const u = new URL(link);
          supported =
            (c.kind === 'linkedin'
              ? /(^|\.)linkedin\.com$/.test(u.hostname) &&
                u.pathname.startsWith('/company/')
              : [
                  'x.com',
                  'www.x.com',
                  'twitter.com',
                  'www.twitter.com',
                ].includes(u.hostname) &&
                /^\/[\w]{1,30}\/?$/.test(u.pathname)) &&
            (link === source.url || source.content.includes(value));
        }
      }
      if (supported)
        contacts.push({
          kind: c.kind as PublicContact['kind'],
          value,
          source: source.url,
          excerpt: source.content.slice(0, 6000),
        });
    }
    accepted.push({
      company,
      website,
      domain,
      description: plain(p.description, 900),
      opportunity: plain(p.opportunity, 900),
      contacts,
      sources,
      checkedAt: new Date().toISOString(),
    });
  }
  return accepted;
}
