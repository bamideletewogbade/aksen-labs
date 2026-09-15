import { writeFileSync, mkdirSync } from 'node:fs';
import { loadEnv } from './load-env.mjs';

loadEnv();
const { chat } = await import('../src/ai/openrouter.mjs');

/**
 * Drafts the words for a clip, in the house voice, from a one line brief.
 *
 *   node scripts/write-script.mjs "hospitality, for small hotels taking bookings on WhatsApp"
 *
 * It writes scripts/drafts/<slug>.json and prints it. Nothing reads that file
 * automatically and nothing renders from it until a person moves the lines into
 * a composition. That is deliberate. Copy is the part of a marketing video that
 * makes a promise to a customer, and a model that has never met the business
 * should not be able to put a promise on screen without somebody reading it
 * first. The same rule the feedback board follows, for the same reason.
 *
 * The voice rules below are not decoration. This house style bans em dashes and
 * the stock phrasing models reach for, so they are stated as constraints and
 * then checked after the fact, because a model told not to use a word will use
 * it anyway about one time in five.
 */

const VOICE = `You write for Aksen Labs, a Ghana based company that sets up practical AI workflows for African businesses.

How the company writes:
- Plain English. Short sentences. A shop owner reads it without stopping.
- Concrete over abstract. "An agent answers on WhatsApp" beats "AI powered customer engagement".
- Never oversell. If something needs setup, or a person to check it, say so.
- Never claim a customer, a result or a number you were not given.

Banned, without exception:
- Em dashes and en dashes. Use a full stop or a comma.
- "Unlock", "unleash", "revolutionise", "game changer", "seamless", "cutting edge", "leverage", "empower", "transform your business", "in today's fast paced world", "we've all been there".
- Rhetorical questions as openers.
- Exclamation marks.

Shape of the clip, four scenes:
1. hook: the problem, in the owner's own words. Two short lines.
2. turn: what changes. Two short lines.
3. proof: one concrete moment. Four short message-length lines showing it happening.
4. close: what to do next. Two short lines.

Each headline line is at most six words, because it is set large on a phone.`;

const brief = process.argv.slice(2).join(' ').trim();
if (!brief) {
  console.error(
    'Give it a brief, for example:\n  node scripts/write-script.mjs "hospitality, small hotels taking bookings on WhatsApp"',
  );
  process.exit(1);
}

const slug = brief
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 50);

const shape = `Return only JSON, no prose around it, in exactly this shape:

{
  "kicker": "short label, under six words, sentence case",
  "hook": { "line1": "", "line2": "" },
  "turn": { "kicker": "", "line1": "", "line2": "", "body": "one sentence, under 25 words" },
  "proof": { "kicker": "", "messages": [ {"from": "them", "text": ""}, {"from": "us", "text": ""}, {"from": "them", "text": ""}, {"from": "us", "text": ""} ] },
  "close": { "line1": "", "line2": "" }
}

line2 in each scene is set in italic serif as the accent line, so it should be the half that turns the thought.`;

console.log(`Writing a draft for: ${brief}\n`);
const { content, model, cost } = await chat({
  system: VOICE,
  prompt: `Brief: ${brief}\n\n${shape}`,
  maxTokens: 1200,
});

// Models wrap JSON in a fence about half the time regardless of instruction.
const json = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

let draft;
try {
  draft = JSON.parse(json);
} catch {
  console.error('That did not come back as JSON. Raw output:\n');
  console.error(content);
  process.exit(1);
}

// Checked rather than trusted. A banned word in the draft is worth catching here
// while it is still cheap, not after it is rendered into three aspect ratios.
const banned = [
  'unlock', 'unleash', 'revolutioni', 'game changer', 'game-changer', 'seamless',
  'cutting edge', 'cutting-edge', 'leverage', 'empower', 'transform your business',
  'fast paced', 'fast-paced', "we've all been there",
];
const flat = JSON.stringify(draft).toLowerCase();
const hits = banned.filter((word) => flat.includes(word));
const dashes = /[—–]/.test(JSON.stringify(draft));

mkdirSync('scripts/drafts', { recursive: true });
writeFileSync(
  `scripts/drafts/${slug}.json`,
  `${JSON.stringify({ brief, model, draft }, null, 2)}\n`,
);

console.log(JSON.stringify(draft, null, 2));
console.log(`\nSaved to scripts/drafts/${slug}.json`);
if (typeof cost === 'number') console.log(`Cost: $${cost.toFixed(4)}`);

if (hits.length || dashes) {
  console.log('\nRead it again before using it:');
  if (hits.length) console.log(`  stock phrasing: ${hits.join(', ')}`);
  if (dashes) console.log('  contains a dash the house style bans');
}
console.log('\nNothing renders from this file. Move the lines you keep into a composition.');
