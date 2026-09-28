// Run: node tests/email-templates.mjs
//
// The templates are copy that goes to real people, so the checks are the ones
// that would embarrass us in an inbox: a blank nobody can fill, an em dash
// (house voice), a missing stop line on outreach, or a greeting to "Mrs".
import assert from 'node:assert/strict';
import {
  EMAIL_TEMPLATES,
  PERSON_TOKENS,
  STOP_LINE,
  TEMPLATE_GROUPS,
  fillTokens,
  firstName,
  parseRecipientLines,
  renderForRecipient,
  unfilledTokens,
} from '../lib/email-templates.ts';

const groups = new Set(TEMPLATE_GROUPS.map((g) => g.id));
const keys = new Set();
for (const t of EMAIL_TEMPLATES) {
  assert.ok(!keys.has(t.key), `duplicate template key ${t.key}`);
  keys.add(t.key);
  assert.ok(groups.has(t.group), `${t.key}: unknown group ${t.group}`);

  // Every blank must be one the desk can fill: per person, the signature, or
  // a field the template declares. Anything else could never be saved.
  const fillable = new Set([
    ...PERSON_TOKENS,
    'sender_name',
    ...t.fields.map((f) => f.key),
  ]);
  for (const token of unfilledTokens(`${t.subject}\n${t.body}`))
    assert.ok(fillable.has(token), `${t.key}: nothing fills {{${token}}}`);
  for (const f of t.fields)
    assert.ok(
      `${t.subject}${t.body}`.includes(`{{${f.key}}}`),
      `${t.key}: field ${f.key} is asked for but never used`,
    );

  assert.ok(
    !/[—–]/.test(t.subject + t.body + t.use),
    `${t.key}: em or en dash`,
  );
  assert.ok(t.body.includes('{{sender_name}}'), `${t.key}: unsigned`);
  assert.ok(
    !/guarantee|never miss|replace your staff/i.test(t.body),
    `${t.key}: absolute claim`,
  );
}
for (const g of ['leads', 'customers', 'profit'])
  assert.ok(
    EMAIL_TEMPLATES.some((t) => t.group === g && t.purpose === 'outreach'),
    `no outreach template for ${g}`,
  );

// Filling: shared blanks first, then per person.
const t = EMAIL_TEMPLATES.find((x) => x.key === 'leads-search');
const shared = {
  subject: fillTokens(t.subject, { sender_name: 'Bami' }),
  body: fillTokens(t.body, {
    sender_name: 'Bami',
    observation: 'there is no Google listing',
  }),
  purpose: 'outreach',
};
const done = renderForRecipient(shared, {
  email: 'ope@example.com',
  name: 'Mrs Ope Adebayo',
  business: 'The Frame Shop',
});
assert.deepEqual(done.missing, []);
assert.equal(done.subject, 'Finding The Frame Shop online');
assert.ok(done.body.startsWith('Hi Ope,'));
assert.ok(
  done.body.endsWith(STOP_LINE),
  'outreach must end with the stop line',
);

// A missing business name is reported, not sent as a blank.
const noBusiness = renderForRecipient(shared, { email: 'a@b.co' });
assert.deepEqual(noBusiness.missing, ['business']);
assert.ok(noBusiness.body.startsWith('Hi there,'));

// Service mail does not get the stop line.
const service = renderForRecipient(
  { subject: 'Hi', body: 'Hello {{first_name}}', purpose: 'service' },
  { email: 'a@b.co', name: 'Kwame' },
);
assert.equal(service.body, 'Hello Kwame');

// Blank values do not count as filled.
assert.equal(fillTokens('{{day}}', { day: '   ' }), '{{day}}');

assert.equal(firstName('Dr. Ama Serwaa'), 'Ama');
assert.equal(firstName(''), 'there');

const parsed = parseRecipientLines(
  'ope@example.com, Ope, The Frame Shop\nKwame Mensah <KWAME@example.com>, Wood N Things\n\nnot-an-email, Someone',
);
assert.deepEqual(parsed.recipients, [
  { email: 'ope@example.com', name: 'Ope', business: 'The Frame Shop' },
  {
    email: 'kwame@example.com',
    name: 'Kwame Mensah',
    business: 'Wood N Things',
  },
]);
assert.deepEqual(parsed.rejected, ['not-an-email, Someone']);

console.log(`email templates: ${EMAIL_TEMPLATES.length} templates checked`);
