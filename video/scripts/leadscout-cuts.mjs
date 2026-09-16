import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Social cuts of the Lead Scout footage.
 *
 * Two windows are trimmed off and both matter.
 *
 * The head, because the field still held the previous session's text: "lets
 * find schools we can sell ai powered services too", which is a note to
 * yourself and not a sentence to put in front of a buyer.
 *
 * The tail, because scrolling reaches the run-status row, and the last real run
 * on this machine reads "Scout FAILED, agent run stopped before it could
 * complete". That is a true state and it is also the worst four seconds of
 * footage in the business. Run one search that completes and this can be
 * re-recorded with the whole pipeline in shot.
 *
 *   node scripts/leadscout-cuts.mjs
 */

const OUT = resolve('out/social');
const SRC = join(OUT, 'leadscout-raw.mp4');

/** Checked against extracted frames, not guessed. */
const WINDOW = { start: 6, duration: 18 };

const brand = { deep: '0x0b1410', paper: '0xf4f7f1', lime: '0xc2f576', muted: '0xa8bcae' };
const FONT_BOLD = 'C\\:/Windows/Fonts/segoeuib.ttf';
const FONT_REG = 'C\\:/Windows/Fonts/segoeui.ttf';
const esc = (t) => t.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019');

const captions = [
  { from: 0, to: 6, text: 'Describe the businesses you want.' },
  { from: 6, to: 12, text: 'In your own words, not a form.' },
  { from: 12, to: 18, text: 'It researches. You decide who to call.' },
];
const features = [
  { from: 0, to: 7, text: 'Finding clients, from public information' },
  { from: 7, to: 13, text: 'Evidence checked before anything is saved' },
  { from: 13, to: 18, text: 'No outreach is ever sent' },
];

function draw(list, { y, size, font, colour, wrap }) {
  return list
    .map(({ from, to, text }) => {
      const lines = [];
      let line = '';
      for (const word of text.split(' ')) {
        if ((line + ' ' + word).trim().length > wrap) {
          lines.push(line.trim());
          line = word;
        } else line += ' ' + word;
      }
      lines.push(line.trim());
      return lines
        .map(
          (part, i) =>
            `drawtext=fontfile='${font}':text='${esc(part)}':fontcolor=${colour}` +
            `:fontsize=${size}:x=(w-text_w)/2:y=${y + i * Math.round(size * 1.24)}` +
            `:enable='between(t,${from},${to})'`,
        )
        .join(',');
    })
    .join(',');
}

const ff = (args, file) => {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  console.log(
    `${file.split(/[\\/]/).pop().padEnd(26)} ${(statSync(file).size / 1024 / 1024).toFixed(1)} MB`,
  );
};

// Vertical. The source is 1600x900, so scaled to 1080 wide it is 608 tall.
const videoY = 660;
const vertical = join(OUT, 'leadscout-vertical.mp4');
ff(
  [
    '-ss', String(WINDOW.start), '-t', String(WINDOW.duration), '-i', SRC,
    '-filter_complex',
    [
      `[0:v]scale=1080:-2,setsar=1[clip]`,
      `color=c=${brand.deep}:s=1080x1920:d=${WINDOW.duration}:r=30[bg]`,
      `[bg][clip]overlay=x=0:y=${videoY}:shortest=1[base]`,
      `[base]` +
        `drawtext=fontfile='${FONT_BOLD}':text='aksen labs':fontcolor=${brand.lime}:fontsize=52:x=(w-text_w)/2:y=150,` +
        `${draw(captions, { y: 300, size: 62, font: FONT_BOLD, colour: brand.paper, wrap: 26 })},` +
        `${draw(features, { y: videoY + 608 + 110, size: 42, font: FONT_REG, colour: brand.lime, wrap: 34 })},` +
        `drawtext=fontfile='${FONT_REG}':text='${esc('Built in Ghana  ·  aksenlabs.com')}':fontcolor=${brand.muted}:fontsize=32:x=(w-text_w)/2:y=1660` +
        `[v]`,
    ].join(';'),
    '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30',
    vertical,
  ],
  vertical,
);

// Wide, for LinkedIn. Native shape so the interface stays readable.
const wide = join(OUT, 'leadscout-wide.mp4');
ff(
  [
    '-ss', String(WINDOW.start), '-t', String(WINDOW.duration), '-i', SRC,
    '-filter_complex',
    `[0:v]scale=1920:-2,setsar=1,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=${brand.deep}[base];` +
      `[base]drawtext=fontfile='${FONT_REG}':text='${esc('Aksen Labs  ·  Find potential clients  ·  No outreach is sent')}'` +
      `:fontcolor=${brand.muted}:fontsize=30:x=(w-text_w)/2:y=1012[v]`,
    '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30',
    wide,
  ],
  wide,
);

console.log('\nNo search was run, so no real company appears in either cut.\n');
