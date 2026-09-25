export type ImportContact = {
  kind: 'email' | 'phone' | 'linkedin' | 'x';
  value: string;
  source?: string;
  excerpt?: string;
};

export type ParsedImportLead = {
  id: string;
  company: string;
  website: string;
  description: string;
  opportunity: string;
  contacts: ImportContact[];
  location?: string;
  selected?: boolean;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?[0-9]{1,3}[0-9\s-]{7,15})/g;
const URL_REGEX = /(https?:\/\/[^\s"'<>]+)/g;

function cleanString(val: unknown, max = 1000): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, max);
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/[,\s.]+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseLeadsFromText(text: string): ParsedImportLead[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 1. Try parsing as JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.leads)
          ? parsed.leads
          : Array.isArray(parsed.data)
            ? parsed.data
            : [];
      if (list.length > 0) {
        return list.map((item: any, idx: number) => {
          const company = cleanString(item.company || item.name || `Lead ${idx + 1}`, 160);
          const rawUrl = cleanString(item.website || item.url || item.domain || '');
          const website = normalizeUrl(rawUrl || `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
          const contacts: ImportContact[] = [];

          if (item.email) contacts.push({ kind: 'email', value: cleanString(item.email) });
          if (item.phone) contacts.push({ kind: 'phone', value: cleanString(item.phone) });
          if (Array.isArray(item.contacts)) {
            for (const c of item.contacts) {
              if (c && c.value) {
                contacts.push({
                  kind: ['email', 'phone', 'linkedin', 'x'].includes(c.kind) ? c.kind : 'email',
                  value: cleanString(c.value),
                  excerpt: cleanString(c.excerpt || c.value),
                });
              }
            }
          }

          return {
            id: `import-${idx}-${Date.now()}`,
            company,
            website,
            description: cleanString(item.description || item.bio || item.about || ''),
            opportunity: cleanString(item.opportunity || item.gap || item.solution || item.notes || ''),
            location: cleanString(item.location || ''),
            contacts,
            selected: true,
          };
        });
      }
    } catch {
      // Not JSON, continue to CSV/Text
    }
  }

  // 2. Try CSV parsing
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0].includes(',')) {
    const header = lines[0].toLowerCase();
    if (header.includes('company') || header.includes('name') || header.includes('website')) {
      const parsedCsv: ParsedImportLead[] = [];
      const cols = lines[0].split(',').map((c) => c.trim().toLowerCase());
      const companyIdx = cols.findIndex((c) => c.includes('company') || c.includes('name') || c.includes('business'));
      const websiteIdx = cols.findIndex((c) => c.includes('website') || c.includes('url') || c.includes('domain'));
      const emailIdx = cols.findIndex((c) => c.includes('email'));
      const phoneIdx = cols.findIndex((c) => c.includes('phone') || c.includes('tel') || c.includes('mobile'));
      const descIdx = cols.findIndex((c) => c.includes('description') || c.includes('about') || c.includes('profile'));
      const oppIdx = cols.findIndex((c) => c.includes('opportunity') || c.includes('gap') || c.includes('solution') || c.includes('notes'));

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim());
        if (row.length < 2) continue;
        const company = cleanString(row[companyIdx] || `Lead ${i}`, 160);
        const rawUrl = cleanString(row[websiteIdx] || '');
        const website = normalizeUrl(rawUrl || `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
        const contacts: ImportContact[] = [];
        if (emailIdx !== -1 && row[emailIdx]) contacts.push({ kind: 'email', value: cleanString(row[emailIdx]) });
        if (phoneIdx !== -1 && row[phoneIdx]) contacts.push({ kind: 'phone', value: cleanString(row[phoneIdx]) });

        parsedCsv.push({
          id: `import-${i}-${Date.now()}`,
          company,
          website,
          description: descIdx !== -1 ? cleanString(row[descIdx]) : '',
          opportunity: oppIdx !== -1 ? cleanString(row[oppIdx]) : '',
          contacts,
          selected: true,
        });
      }
      if (parsedCsv.length > 0) return parsedCsv;
    }
  }

  // 3. Fallback: Parse unstructured / block text (like OSINT briefs, PDF copy, notes)
  // Split on double newlines, markdown headers (##), or section keywords
  const blocks = trimmed.split(/(?:\r?\n\s*\r?\n|(?=^#{1,3}\s)|(?=^\d+\.\s+[A-Z]))/m)
    .map((b) => b.trim())
    .filter((b) => b.length > 20);

  const parsedBlocks: ParsedImportLead[] = [];

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const blockLines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!blockLines.length) continue;

    // Detect Company Name: usually first non-header line
    let company = '';
    let location = '';
    let gap = '';
    let solution = '';
    let description = '';

    for (let li = 0; li < Math.min(3, blockLines.length); li++) {
      const line = blockLines[li].replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '');
      if (
        !line.toLowerCase().startsWith('category') &&
        !line.toLowerCase().startsWith('target account') &&
        !line.toLowerCase().startsWith('location:') &&
        !line.toLowerCase().startsWith('official email:')
      ) {
        company = line.split(/[—–|]/)[0].trim().slice(0, 160);
        break;
      }
    }

    if (!company) company = `Lead ${idx + 1}`;

    // Extract location
    const locMatch = block.match(/location:\s*([^\n]+)/i);
    if (locMatch) location = locMatch[1].trim();

    // Extract Observed Gap and Proposed Solution
    const gapMatch = block.match(/(?:observed\s+operational\s+gap|bottleneck|operational\s+gap|gap):\s*([^\n]+(?:\n[^\n]+)?)/i);
    if (gapMatch) gap = gapMatch[1].trim();

    const solMatch = block.match(/(?:aksen\s+labs\s+proposed\s+system|proposed\s+system|solution|recommended\s+solution):\s*([^\n]+(?:\n[^\n]+)?)/i);
    if (solMatch) solution = solMatch[1].trim();

    // Combine opportunity
    let opportunity = '';
    if (gap && solution) {
      opportunity = `Operational Gap: ${gap} | Proposed System: ${solution}`;
    } else if (gap) {
      opportunity = `Operational Gap: ${gap}`;
    } else if (solution) {
      opportunity = `Proposed System: ${solution}`;
    }

    // Extract Emails
    const emails = Array.from(new Set(block.match(EMAIL_REGEX) || []));
    // Extract Phones
    const phones = Array.from(new Set(block.match(PHONE_REGEX) || [])).filter((p) => p.replace(/\D/g, '').length >= 9);
    // Extract URLs
    const urls = Array.from(new Set(block.match(URL_REGEX) || [])).filter((u) => !u.includes('schema.org') && !u.includes('w3.org'));

    // Website detection
    let website = '';
    if (urls.length > 0) {
      website = urls[0];
    } else if (emails.length > 0) {
      const emailDomain = emails[0].split('@')[1];
      if (emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain.toLowerCase())) {
        website = `https://${emailDomain}`;
      }
    }

    if (!website) {
      website = `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    }

    const contacts: ImportContact[] = [];
    emails.forEach((em) => contacts.push({ kind: 'email', value: em }));
    phones.forEach((ph) => contacts.push({ kind: 'phone', value: ph }));

    // Extract social handles
    const igMatch = block.match(/@([a-zA-Z0-9_.-]+)/);
    if (igMatch) {
      contacts.push({ kind: 'x', value: `@${igMatch[1]}` });
    }

    // Build description from remaining lines
    const descLines = blockLines.filter(
      (l) =>
        !l.toLowerCase().startsWith('location:') &&
        !l.toLowerCase().startsWith('official email:') &&
        !l.toLowerCase().startsWith('phone') &&
        !l.toLowerCase().startsWith('observed operational gap') &&
        !l.toLowerCase().startsWith('aksen labs proposed system'),
    );
    description = descLines.slice(1, 4).join(' ').slice(0, 800);
    if (location && !description.includes(location)) {
      description = `${description ? description + ' · ' : ''}Location: ${location}`;
    }

    if (company && (emails.length || phones.length || website)) {
      parsedBlocks.push({
        id: `import-${idx}-${Date.now()}`,
        company,
        website: normalizeUrl(website),
        description,
        opportunity: opportunity || 'Hypothetical fit for Aksen digital transformation and automation workflows.',
        location,
        contacts,
        selected: true,
      });
    }
  }

  return parsedBlocks;
}
