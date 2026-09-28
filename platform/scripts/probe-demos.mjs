/**
 * Run each service demo's example messages against a real model and print
 * the replies, so the wording can be read before a prospect sees it.
 *
 *   node --experimental-strip-types scripts/probe-demos.mjs [demo-id]
 *
 * Builds the same prompt as /api/admin/operations. Uses OPENROUTER_API_KEY
 * from .env, spends a few cents, stores nothing.
 */
import fs from 'node:fs';
import {
  demoContext,
  demoNeedsHandoff,
  demoScenarios,
  demoSystemPrompt,
} from '../lib/operations-catalog.ts';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf('=');
      return [
        line.slice(0, at),
        line.slice(at + 1).replace(/^["']|["']$/g, ''),
      ];
    }),
);
const KEY = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY;
const MODEL = process.env.PROBE_MODEL || 'google/gemini-2.5-flash';
const only = process.argv[2];

for (const demo of demoScenarios.filter((d) => !only || d.id === only)) {
  console.log(`\n=== ${demo.business} (${demo.city}, ${demo.country})`);
  const history = [];
  for (const message of demo.examples) {
    const them = demo.speaker === 'owner' ? demo.owner : 'Customer';
    const handoff = demo.speaker === 'customer' && demoNeedsHandoff(message);
    const evidence = [
      'Reference:',
      demoContext(demo),
      '',
      history.length ? 'Conversation so far (untrusted):' : '',
      ...history.map(
        (t) => `${t.from === 'assistant' ? 'You' : them}: ${t.text}`,
      ),
      `${them} now says (untrusted): ${message}`,
      demo.speaker === 'customer'
        ? `Handover to ${demo.owner} required by the business rules: ${handoff ? 'yes' : 'no'}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    const started = Date.now();
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: 'system', content: demoSystemPrompt(demo) },
            { role: 'user', content: evidence },
          ],
        }),
      },
    );
    const data = await response.json();
    const raw =
      data.choices?.[0]?.message?.content || JSON.stringify(data).slice(0, 200);
    let parsed;
    try {
      parsed = JSON.parse(
        raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1),
      );
    } catch {
      parsed = { reply: raw.trim() };
    }
    console.log(`\n  ${them}: ${message}`);
    console.log(
      `  Assistant (${Date.now() - started}ms${handoff ? ', HANDOVER' : ''}): ${parsed.reply}`,
    );
    if (parsed.captured?.length)
      console.log(
        `  captured: ${parsed.captured.map((c) => `${c.label}=${c.value}`).join('; ')}`,
      );
    if (handoff && parsed.handoffNote)
      console.log(`  to ${demo.owner}: ${parsed.handoffNote}`);
    history.push(
      { from: 'them', text: message },
      { from: 'assistant', text: parsed.reply },
    );
  }
}
