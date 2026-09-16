import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * A voice track for the social cuts.
 *
 * Two ways in. Record it yourself and pass --audio, which is the one worth
 * using: the audience is Ghanaian business owners, a founder's own voice is the
 * whole point of a founder-led brand, and a company whose argument is that it
 * is honest about AI should probably not narrate itself with an obviously
 * synthetic American accent.
 *
 * Or pass --tts and this drives the Windows speech engine, which has David and
 * Zira installed and nothing better. It is here so the option can be heard and
 * judged rather than argued about, and so there is something to time the edit
 * against before a real recording exists.
 *
 * Either way the lines are placed at fixed seconds rather than read straight
 * through, so the words land on the frames they describe, and the result is
 * normalised to -14 LUFS, which is what the platforms turn everything into
 * anyway.
 *
 *   node scripts/voiceover.mjs whatsapp-30s --tts
 *   node scripts/voiceover.mjs whatsapp-30s --audio ../recordings/vo.wav
 */

const OUT = resolve('out/social');
const WORK = resolve('out/social/.vo');

/**
 * What is said, and when.
 *
 * Not a reading of the on-screen captions. The caption is there for anyone
 * watching muted; the voice earns its place by saying the part the caption has
 * no room for.
 */
const scripts = {
  'whatsapp-30s': [
    { at: 0.6, text: 'It is nine at night. Your shop closed an hour ago, and the messages did not.' },
    { at: 7.4, text: 'An agent answers on WhatsApp and takes the order properly.' },
    { at: 13.4, text: 'Aksen Labs builds websites, business systems and A I for African businesses.' },
    { at: 19.4, text: 'It never sets a price or promises a date. That stays with you.' },
    { at: 25.4, text: 'Free to try. Built in Ghana.' },
  ],
  'instagram-reel-45s': [
    { at: 0.6, text: 'It is nine at night. Your shop closed an hour ago, and the messages did not.' },
    { at: 7.6, text: 'An agent answers on WhatsApp, asks for what is missing, and writes the order down where your team can see it.' },
    { at: 14.6, text: 'Aksen Labs builds websites, business systems and A I for African businesses.' },
    { at: 20.4, text: 'It never sets a price, takes a payment, or promises a date. That stays with you.' },
    { at: 27.0, text: 'Three tools on the site are free. No account, nothing to install.' },
    { at: 34.0, text: 'Run one on your own business and see what comes back.' },
    { at: 40.0, text: 'Aksen Labs. Built in Ghana.' },
  ],
  'linkedin-52s': [
    { at: 0.6, text: 'A shop in Accra gets forty messages in an evening. Three of them are orders.' },
    { at: 7.4, text: 'Somebody reads all forty, twice. That is not a technology problem. It is an evening problem.' },
    { at: 15.0, text: 'Aksen Labs builds websites, business systems and A I for African businesses.' },
    { at: 21.5, text: 'The agent answers, asks for what is missing, and prepares the reply.' },
    { at: 28.0, text: 'It never sets a price, takes a payment, or promises a date. The system does not give it the option.' },
    { at: 37.0, text: 'This is what is built today, not a customer story.' },
    { at: 43.0, text: 'Three tools are free to open right now. Aksen Labs, built in Ghana.' },
  ],
};
scripts['tiktok-45s'] = scripts['instagram-reel-45s'];

const name = process.argv[2];
const useTts = process.argv.includes('--tts');
const audioFlag = process.argv.indexOf('--audio');
const recorded = audioFlag === -1 ? null : process.argv[audioFlag + 1];

if (!name || !scripts[name]) {
  console.error(
    `\nUsage: node scripts/voiceover.mjs <cut> [--tts | --audio file]\n\nCuts: ${Object.keys(scripts).join(', ')}\n`,
  );
  process.exit(1);
}
const lines = scripts[name];
const video = join(OUT, `${name}.mp4`);
if (!existsSync(video)) {
  console.error(`\n${video} does not exist. Run scripts/social-cuts.mjs first.\n`);
  process.exit(1);
}
const videoSeconds = Number(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video],
    { encoding: 'utf8' },
  ).trim(),
);

const ff = (args) =>
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });

mkdirSync(WORK, { recursive: true });

/** The script as plain text, so a real recording has something to read. */
function printScript() {
  console.log(`\n${name}\n${'-'.repeat(name.length)}`);
  for (const { at, text } of lines) {
    const m = Math.floor(at / 60);
    const s = (at % 60).toFixed(1).padStart(4, '0');
    console.log(`  ${m}:${s}  ${text}`);
  }
  const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
  console.log(`\n  ${words} words. Read at a comfortable pace, not a rush.\n`);
}

let track;

if (recorded) {
  if (!existsSync(recorded)) {
    console.error(`\n${recorded} does not exist.\n`);
    process.exit(1);
  }
  // A single recorded read, used as it is. Trusting the reader to have followed
  // the timings beats slicing their performance into pieces.
  track = recorded;
} else if (useTts) {
  // Each line to its own file, then delayed into place. Speaking the whole
  // script in one pass would drift out of sync with the pictures by the third
  // sentence.
  const parts = [];
  lines.forEach(({ text }, i) => {
    const wav = join(WORK, `line-${i}.wav`);
    const ps = [
      'Add-Type -AssemblyName System.Speech;',
      '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
      // Zira is the less mechanical of the two installed.
      "try { $s.SelectVoice('Microsoft Zira Desktop') } catch {};",
      '$s.Rate = -1;',
      `$s.SetOutputToWaveFile('${wav.replace(/\\/g, '\\\\')}');`,
      `$s.Speak(@'\n${text}\n'@);`,
      '$s.Dispose();',
    ].join(' ');
    execFileSync('powershell', ['-NoProfile', '-Command', ps], {
      stdio: 'inherit',
    });
    parts.push(wav);
  });

  // The scripted time is where a line wants to start, not where it can. A line
  // that runs long would otherwise still be talking when the next one begins,
  // and amix would play both at once. Each start is pushed to whichever is
  // later: the time it asked for, or a breath after the previous line ended.
  const GAP = 0.3;
  let cursor = 0;
  const placed = lines.map((line, i) => {
    const seconds = Number(
      execFileSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'csv=p=0',
          parts[i],
        ],
        { encoding: 'utf8' },
      ).trim(),
    );
    const at = Math.max(line.at, cursor);
    cursor = at + seconds + GAP;
    return { ...line, at, asked: line.at, seconds, drifted: at > line.at + 0.05 };
  });

  const overrun = cursor - GAP - videoSeconds;
  if (overrun > 0)
    console.log(
      `\n  The read runs ${overrun.toFixed(1)}s past the end of the cut. Shorten a line.\n`,
    );
  for (const p of placed.filter((p) => p.drifted))
    console.log(
      `  pushed ${p.asked.toFixed(1)}s -> ${p.at.toFixed(1)}s so it does not talk over the line before it: "${p.text.slice(0, 38)}..."`,
    );

  const inputs = parts.flatMap((p) => ['-i', p]);
  const delays = placed
    .map(
      (l, i) =>
        `[${i}:a]aresample=48000,adelay=${Math.round(l.at * 1000)}|${Math.round(l.at * 1000)}[a${i}]`,
    )
    .join(';');
  const mix =
    lines.map((_, i) => `[a${i}]`).join('') +
    `amix=inputs=${lines.length}:dropout_transition=0:normalize=0[mixed]`;

  track = join(WORK, 'track.wav');
  ff([
    ...inputs,
    '-filter_complex',
    `${delays};${mix}`,
    '-map',
    '[mixed]',
    '-ac',
    '2',
    '-ar',
    '48000',
    track,
  ]);
} else {
  printScript();
  console.log(
    'Nothing rendered. Pass --tts to hear the Windows voice, or --audio <file>\n' +
      'with a recording of the script above.\n',
  );
  process.exit(0);
}

const outFile = join(OUT, `${name}-vo.mp4`);
ff([
  '-i',
  video,
  '-i',
  track,
  // -14 LUFS is what every one of these platforms normalises to. Handing them
  // something already there means they do not have to squash it on the way in.
  //
  // apad matters as much as the loudness. The voice finishes before the footage
  // does, and -shortest without it cut the video off at the last word: the
  // LinkedIn cut lost its final three seconds that way. Padding with silence
  // lets the picture run to its own end.
  '-filter_complex',
  '[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,apad[a]',
  '-map',
  '0:v',
  '-map',
  '[a]',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-b:a',
  '160k',
  '-shortest',
  '-movflags',
  '+faststart',
  outFile,
]);

rmSync(WORK, { recursive: true, force: true });

const { statSync } = await import('node:fs');
printScript();
console.log(
  `${outFile.split(/[\\/]/).pop()}  ${(statSync(outFile).size / 1024 / 1024).toFixed(1)} MB\n`,
);
