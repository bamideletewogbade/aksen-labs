import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Social cuts from a screen recording.
 *
 * Three things this does that a manual trim does not.
 *
 * It crops the browser away. The source is a full-screen capture, so the top
 * of every frame carries a tab strip, an address bar reading localhost:3000,
 * and a bookmarks bar with the founder's personal links on it. None of that
 * belongs on a company's LinkedIn.
 *
 * It only ever cuts from a range that has been checked. The middle of this
 * recording shows Lead Scout results: named Ghanaian companies with their phone
 * numbers and email addresses on screen. Those businesses have not agreed to
 * appear in Aksen's marketing, and the operating brief's rule about client
 * records covers exactly this. SAFE_RANGE is the part that shows the product
 * instead of the data, and nothing here reads outside it.
 *
 * It pads rather than crops for vertical. A 16:9 screen recording cropped to
 * 9:16 keeps a third of the frame and loses the interface it was recorded to
 * show. Letterboxing onto a brand background keeps every pixel readable and
 * leaves room for the caption to do the work, which matters because all of
 * this is watched with the sound off.
 *
 *   node scripts/social-cuts.mjs "C:/path/to/recording.mp4"
 */

const source = process.argv[2] || 'C:/Users/HP/Videos/2026-09-15 23-56-29.mp4';
const OUT = resolve('out/social');
mkdirSync(OUT, { recursive: true });

/** Browser chrome measured off a full-resolution frame, not guessed. */
const CROP = 'crop=1844:994:62:84';

/**
 * The window that is safe to publish from.
 *
 * 0 to 6s is the OBS window itself. After about 58s the recording moves into
 * Lead Scout and shows third-party contact details. Between 58 and 66 a Chrome
 * popup sits over the page.
 */
const SAFE_RANGE = { start: 6, end: 58 };

const brand = {
  deep: '0x0b1410',
  ink: '0x10261d',
  paper: '0xf4f7f1',
  lime: '0xc2f576',
  muted: '0xa8bcae',
};

const FONT_BOLD = 'C\\:/Windows/Fonts/segoeuib.ttf';
const FONT_REG = 'C\\:/Windows/Fonts/segoeui.ttf';

/** ffmpeg reads a colon as an option separator, so every one has to be escaped. */
const esc = (text) =>
  text.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019');

/**
 * Captions, in output time. Written to carry the message on their own, because
 * the interface in the frame is too small to read on a phone and the sound is
 * off anyway.
 */
const captions = [
  { from: 0, to: 8, text: 'Your customers message after you close.' },
  { from: 8, to: 14, text: 'An agent answers, and takes the order properly.' },
  { from: 14, to: 20, text: 'Websites, business systems and AI.' },
  { from: 20, to: 27, text: 'Built in Ghana, for African businesses.' },
  { from: 27, to: 34, text: 'Free tools on the site. No account.' },
  { from: 34, to: 41, text: 'People keep the decisions that matter.' },
  { from: 41, to: 52, text: 'Aksen Labs' },
];

/**
 * A second line under the clip, naming the thing on screen.
 *
 * It exists because the first render left four hundred pixels of empty canvas
 * below the video. Space on a phone is the scarcest thing in this format, and
 * the caption above is the argument while this is the evidence: what the
 * feature is actually called.
 */
const features = [
  { from: 0, to: 14, text: 'An agent that answers on WhatsApp' },
  { from: 14, to: 20, text: 'Websites, shops and payments' },
  { from: 20, to: 27, text: 'Connected records and reporting' },
  { from: 27, to: 34, text: 'Business agents, free to run' },
  { from: 34, to: 41, text: 'Prices and promises stay with a person' },
  { from: 41, to: 52, text: 'aksenlabs.com' },
];

function drawCaptions(list, { y, size, wrap, font = FONT_BOLD, colour }) {
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
            `drawtext=fontfile='${font}':text='${esc(part)}'` +
            `:fontcolor=${colour ?? brand.paper}:fontsize=${size}` +
            `:x=(w-text_w)/2:y=${y + i * Math.round(size * 1.24)}` +
            `:enable='between(t,${from},${to})'`,
        )
        .join(',');
    })
    .join(',');
}

const wordmark = (y, size) =>
  `drawtext=fontfile='${FONT_BOLD}':text='aksen labs':fontcolor=${brand.lime}` +
  `:fontsize=${size}:x=(w-text_w)/2:y=${y}`;

const footer = (y, size, text) =>
  `drawtext=fontfile='${FONT_REG}':text='${esc(text)}':fontcolor=${brand.muted}` +
  `:fontsize=${size}:x=(w-text_w)/2:y=${y}`;

/**
 * A vertical cut: the recording letterboxed onto a brand canvas, caption above,
 * wordmark below. `bottomSafe` is how much room the platform's own controls
 * take at the foot of the screen.
 */
function vertical({ name, start, duration, bottomSafe, captionSet, featureSet }) {
  // 1844x994 scaled to 1080 wide is 582 tall. Laid out from the top: wordmark,
  // caption, clip, feature line, then the platform's own controls.
  const videoY = 660;
  const videoH = 582;
  const featureY = videoY + videoH + 110;
  const filter = [
    `[0:v]${CROP},scale=1080:-2,setsar=1[clip]`,
    `color=c=${brand.deep}:s=1080x1920:d=${duration}:r=30[bg]`,
    `[bg][clip]overlay=x=0:y=${videoY}:shortest=1[base]`,
    `[base]` +
      `${wordmark(150, 52)},` +
      `${drawCaptions(captionSet, { y: 300, size: 62, wrap: 26 })},` +
      `${drawCaptions(featureSet, { y: featureY, size: 42, wrap: 34, font: FONT_REG, colour: brand.lime })},` +
      `${footer(1920 - bottomSafe - 60, 32, 'Built in Ghana  ·  aksenlabs.com')}` +
      `[v]`,
  ].join(';');

  const file = resolve(OUT, `${name}.mp4`);
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      String(start),
      '-t',
      String(duration),
      '-i',
      source,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      // The recording is silent through this range: RMS sits at -92dB. A silent
      // track is worse than none, because the platforms offer to add music and
      // an existing track gets in the way of that.
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-r',
      '30',
      file,
    ],
    { stdio: 'inherit' },
  );
  return file;
}

/** The wide cut. No crop to vertical, so the interface stays legible. */
function wide({ name, start, duration }) {
  const filter =
    `[0:v]${CROP},scale=1920:-2,setsar=1,` +
    `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=${brand.deep}[base];` +
    `[base]${footer(1006, 30, 'Aksen Labs  ·  Websites, business systems and AI  ·  Built in Ghana')}[v]`;

  const file = resolve(OUT, `${name}.mp4`);
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      String(start),
      '-t',
      String(duration),
      '-i',
      source,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '21',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-r',
      '30',
      file,
    ],
    { stdio: 'inherit' },
  );
  return file;
}

const made = [];

// WhatsApp status caps a segment at 30 seconds, so this is the whole story in
// thirty: the problem, the answer, and where to go.
made.push(
  vertical({
    name: 'whatsapp-30s',
    start: SAFE_RANGE.start,
    duration: 30,
    bottomSafe: 120,
    captionSet: captions.filter((c) => c.from < 30),
    featureSet: features.filter((c) => c.from < 30),
  }),
);

// Reels and TikTok take the same file format. They differ in how much of the
// bottom their own interface covers, so the footer sits higher on TikTok.
made.push(
  vertical({
    name: 'instagram-reel-45s',
    start: SAFE_RANGE.start,
    duration: 45,
    bottomSafe: 200,
    captionSet: captions,
    featureSet: features,
  }),
);
made.push(
  vertical({
    name: 'tiktok-45s',
    start: SAFE_RANGE.start,
    duration: 45,
    bottomSafe: 320,
    captionSet: captions,
    featureSet: features,
  }),
);

// LinkedIn is watched on a desktop by people who will actually read an
// interface, so it keeps the native shape and the full length.
made.push(
  wide({
    name: 'linkedin-52s',
    start: SAFE_RANGE.start,
    duration: SAFE_RANGE.end - SAFE_RANGE.start,
  }),
);

const { statSync } = await import('node:fs');
console.log('');
for (const file of made) {
  const mb = (statSync(file).size / 1024 / 1024).toFixed(1);
  console.log(`${resolve(file).split(/[\\/]/).pop().padEnd(26)} ${mb} MB`);
}
console.log(`\nWritten to ${OUT}\n`);

void writeFileSync;
