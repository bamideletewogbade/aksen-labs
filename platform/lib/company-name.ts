// The enquiry form stores placeholders like "Not given" when someone skips the
// company field. Read them as missing, so no screen titles a lead "Not given"
// and every caller can fall back to the person's name instead.
const placeholderCompanies = new Set([
  'not given',
  'n/a',
  'na',
  'none',
  'unknown',
  '-',
]);

export function companyName(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && !placeholderCompanies.has(text.toLowerCase()) ? text : '';
}
