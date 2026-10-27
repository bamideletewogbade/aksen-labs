import assert from 'node:assert/strict';
import { loadLocalModule } from '../scripts/prospecting-runtime.mjs';
const { outreachEvidence, parseOutreach } = await loadLocalModule(
  'lib/prospect-outreach.ts',
);
const url = 'https://fictional.example/contact';
const source = {
  url,
  title: 'Fictional workshop',
  content:
    'Our workshop accepts custom furniture enquiries. Email hello@fictional.example for details.',
};
const raw = {
  company: 'Fictional workshop',
  website: 'https://fictional.example',
  sources: [source],
  contacts: [{ kind: 'email', value: 'hello@fictional.example', source: url }],
  checkedAt: '2026-10-27',
  description: 'Workshop',
  opportunity: 'Possible enquiry workflow',
};
const lead = outreachEvidence(raw);
const output = {
  observations: [
    { quote: 'Our workshop accepts custom furniture enquiries.', source: url },
  ],
  hypothesis: 'An enquiry form may help; confirm their process.',
  question: 'How are enquiries recorded?',
  subject: 'Custom furniture enquiries',
  body: 'Hello, how do you record custom furniture enquiries? Aksen Labs',
};
assert.equal(parseOutreach(output, lead).recipient, 'hello@fictional.example');
assert.throws(() =>
  outreachEvidence({
    ...raw,
    contacts: [
      { kind: 'email', value: 'invented@fictional.example', source: url },
    ],
  }),
);
assert.throws(() => outreachEvidence({ ...raw, sources: [] }));
assert.throws(() =>
  parseOutreach(
    {
      ...output,
      observations: [{ quote: 'You are losing customers.', source: url }],
    },
    lead,
  ),
);
assert.throws(() =>
  parseOutreach(
    {
      ...output,
      observations: [
        {
          quote: output.observations[0].quote,
          source: 'https://invented.example',
        },
      ],
    },
    lead,
  ),
);
assert.throws(() =>
  parseOutreach(
    { ...output, subject: 'Subject\nBcc: attacker@example.com' },
    lead,
  ),
);
console.log(
  'PASS: source and contact evidence, fabricated observation rejection, subject header injection rejection.',
);
