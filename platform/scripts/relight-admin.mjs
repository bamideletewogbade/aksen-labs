import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Turn the admin from dark green to white with green in it.
 *
 * The admin was hand-tuned dark: 334 distinct colours across ten stylesheets,
 * no tokens, every shade chosen by eye against a near-black background. A
 * find-and-replace over that produces mud, because the same hex means opposite
 * things in different places. #bde997 is the brand lime, and it is a text
 * colour in one rule and a button fill in the next: inverting both gives you
 * unreadable text or an invisible button, depending which way you go.
 *
 * So the mapping keys on what a colour is being asked to do, not on the colour.
 * Property role decides the family, lightness decides the step within it. A
 * light value behind `color:` was foreground on dark and becomes dark ink; the
 * same value behind `background:` was a fill and becomes a light tint.
 *
 * The sidebar is deliberately left alone. A dark green rail against white
 * content keeps the brand present, anchors the layout, and is the half of this
 * that already looked right.
 *
 * Run once. It rewrites in place, and git is the undo.
 */

const root = 'app/admin';

/** Rules whose selector mentions any of these keep their dark values. */
const KEEP_DARK = [
  'admin-sidebar',
  'admin-brand',
  'admin-navigation',
  'admin-nav',
  'admin-user',
  'admin-skip',
];

const hexToRgb = (hex) => {
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const alpha = h.length === 8 ? h.slice(6) : '';
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    alpha,
  ];
};

function toHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v, i) => (i < 3 ? v / 255 : v));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

const hsl = (h, s, l) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/** Hue families, so an amber warning does not come out green. */
function family({ h, s }) {
  if (s < 0.12) return 'grey';
  if (h >= 60 && h < 170) return 'green';
  if (h >= 35 && h < 60) return 'amber';
  if (h >= 170 && h < 250) return 'blue';
  if (h >= 250 && h < 320) return 'violet';
  return 'red';
}

/**
 * Structural colours, decided by hand because banding cannot tell a page
 * background from a card sitting on it: on a dark theme both are nearly black,
 * and on a light one they have to end up different or the layout disappears.
 */
const STRUCTURAL = {
  '#0b1410': '#f4f7f1', // page
  '#0c1a12': '#ffffff', // card
  '#102017': '#ffffff',
  '#0f2117': '#ffffff',
  '#0f2217': '#ffffff',
  '#0d1f14': '#ffffff',
  '#0d1a12': '#ffffff',
  '#102018': '#ffffff',
  '#0f2017': '#ffffff',
  '#13241a': '#f7faf4', // inset
  '#14281c': '#f7faf4',
  '#14261a': '#f7faf4',
  '#122219': '#f7faf4',
  '#14251a': '#f7faf4',
  '#14271c': '#f7faf4',
  '#14271a': '#f7faf4',
  '#2f4736': '#dde7d8', // border
  '#29402e': '#dde7d8',
  '#2b4130': '#dde7d8',
  '#304936': '#d5e2d0',
  '#395440': '#d5e2d0',
  '#263a2a': '#e3ebde',
  '#253a2a': '#e3ebde',
  '#24382b': '#e3ebde',
};

function convert(hex, property, selector) {
  const key = hex.toLowerCase();
  const [, , , alpha] = hexToRgb(key);

  const c = toHsl(key);
  const fam = family(c);
  const prop = property.toLowerCase();

  const isText =
    prop === 'color' ||
    prop === 'fill' ||
    prop === 'stroke' ||
    prop === '-webkit-text-fill-color';

  // The structural table describes surfaces. The same near-black is also used
  // as the label on a lime button, and sending that through the surface table
  // turns the text the colour of the page it sits on.
  if (STRUCTURAL[key] && !alpha && !isText) return STRUCTURAL[key];
  const isBorder = prop.startsWith('border') || prop === 'outline-color';
  const isShadow = prop.includes('shadow');
  const isAccentVar =
    prop.startsWith('--') || prop === 'accent-color' || prop === 'caret-color';

  // Alpha values were overlays on a dark field. On white they need to be a
  // tint of ink instead, or they disappear or turn into a grey smear.
  if (alpha) {
    const a = parseInt(alpha, 16) / 255;
    if (fam === 'grey')
      return `#10261d${Math.round(Math.min(a * 1.2, 0.14) * 255)
        .toString(16)
        .padStart(2, '0')}`;
    const base = {
      green: '#2f7d32',
      amber: '#9a6b12',
      red: '#b3412c',
      blue: '#2b6aa0',
      violet: '#6a4fa8',
    }[fam];
    return `${base}${alpha}`;
  }

  if (isShadow) return '#10261d1f';

  // An accent carried in a custom property or an accent-color is a brand mark,
  // not a surface. It stays saturated and only gets dark enough to read.
  //
  // --signal is the exception and it matters: it is only ever a background or a
  // border, never text, and the labels sitting on it are dark. Darkening it put
  // dark green text on a dark green button, which is how "Find leads" ended up
  // at a contrast ratio of 1.57 to 1. It stays light.
  if (isAccentVar) {
    if (prop === '--signal') return '#bde997';
    if (fam === 'green') return '#2f7d32';
    if (fam === 'amber') return '#9a6b12';
    if (fam === 'red') return '#b3412c';
    return hsl(c.h, Math.min(c.s, 0.6), 0.42);
  }

  if (isText) {
    // Saturated accents stay their own colour and darken until they read.
    if (c.s > 0.3 && fam !== 'grey') {
      if (fam === 'green') return c.l > 0.6 ? '#2c6b2f' : '#1d5b3c';
      if (fam === 'amber') return '#8a6414';
      if (fam === 'red') return '#a8372a';
      if (fam === 'blue') return '#245f8f';
      if (fam === 'violet') return '#5b4494';
    }
    if (c.l >= 0.8) return '#11241a'; // was the brightest text
    if (c.l >= 0.62) return '#2b3d32'; // secondary
    if (c.l >= 0.45) return '#56685c'; // muted
    return '#11241a';
  }

  if (isBorder) {
    if (c.s > 0.3 && fam !== 'grey') {
      if (fam === 'green') return '#9dcf83';
      if (fam === 'amber') return '#e2c079';
      if (fam === 'red') return '#e8a495';
      return hsl(c.h, 0.35, 0.72);
    }
    if (c.l < 0.3) return '#e0e8db';
    if (c.l < 0.5) return '#d5e0cf';
    return '#e8efe3';
  }

  // Everything else is a surface.
  //
  // Green is the theme rather than a signal, so a dark saturated green was a
  // card and becomes white. Tinting every one of them the way an amber warning
  // gets tinted is what made the first pass look like a lawn. Only a genuinely
  // light green was a lime fill, and only that stays green.
  if (c.s > 0.3 && fam === 'green') {
    if (c.l >= 0.6) return '#dcf3bd'; // lime chip or button
    if (c.l < 0.2) return '#ffffff'; // card
    if (c.l < 0.35) return '#f7faf3'; // inset
    return '#eaf5df'; // a panel that really was tinted
  }
  // The other hues are signals. A dark red surface was an error background and
  // should still read as one.
  if (c.s > 0.3 && fam !== 'grey') {
    if (fam === 'amber') return '#fbeecb';
    if (fam === 'red') return '#fbe0d9';
    if (fam === 'blue') return '#dceaf6';
    if (fam === 'violet') return '#e7e0f7';
  }
  if (c.l < 0.14) return '#ffffff';
  if (c.l < 0.24) return '#fbfcfa';
  if (c.l < 0.4) return '#f4f7f1';
  if (c.l < 0.6) return '#eef3e9';
  return '#f7faf5';
}

/**
 * The colours that were never hex.
 *
 * A dark theme separates surfaces by laying translucent white over them. On
 * white that does nothing at all: every one of those borders, wells and hover
 * states quietly disappeared, which is the kind of change a palette diff does
 * not show and a screenshot of one page does not catch. They become the same
 * idea in reverse, a wash of ink.
 *
 * The lime tints are the other half. At four per cent over near-black a lime
 * wash reads as a faint glow; over white it is invisible, so the tints that
 * were doing structural work become a green that can actually be seen.
 */
function relightFunctional(value) {
  return value.replace(
    /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*[,/]?\s*([\d.]+%?)?\s*\)/g,
    (whole, r, g, b, alpha) => {
      const [red, green, blue] = [r, g, b].map(Number);
      if (alpha === undefined) return whole;
      const a = alpha.endsWith('%')
        ? parseFloat(alpha) / 100
        : parseFloat(alpha);

      const isWhite = red > 230 && green > 230 && blue > 230;
      const isLime = green > red && green > blue && green > 180 && red > 120;

      // White over dark made things lighter. Ink over white makes them darker,
      // which is the same amount of separation pointing the other way.
      if (isWhite) {
        changed += 1;
        return `rgba(16, 38, 29, ${Math.min(a * 1.6, 0.16).toFixed(3)})`;
      }
      // A lime wash needs to be a green one, and a little stronger, to survive
      // being put on a white page.
      if (isLime) {
        changed += 1;
        return `rgba(23, 91, 59, ${Math.min(a * 1.8, 0.22).toFixed(3)})`;
      }
      return whole;
    },
  );
}

/**
 * Every stylesheet, and how much of it belongs to the admin.
 *
 * `app/admin` is all admin. globals.css is not: it carries the public site as
 * well, and sixty-five admin rules sit in the middle of it, including the one
 * that paints the shell. Converting the file wholesale would repaint the
 * marketing site; leaving it out is why a dark background survived under the
 * new white one and put unreadable buttons on two pages.
 */
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    // admin-light.css is the hand-written correction layer. Running the
    // converter over its own output is how a deliberate white became lime.
    else if (name.endsWith('.css') && name !== 'admin-light.css')
      files.push({ path: full, all: true });
  }
})(root);

files.push({ path: 'app/globals.css', all: false });

/** In a shared stylesheet, only rules that are about the admin. */
const inScope = (file, selector) =>
  file.all || /\.admin-|\.admin\b/.test(selector);

let changed = 0;
let skipped = 0;

for (const file of files) {
  const text = readFileSync(file.path, 'utf8');
  let selector = '';
  let out = '';
  let i = 0;

  while (i < text.length) {
    const brace = text.indexOf('{', i);
    if (brace === -1) {
      out += text.slice(i);
      break;
    }
    const head = text.slice(i, brace + 1);
    out += head;

    // An at-rule opens a nested block rather than a declaration list. Consuming
    // it as a rule makes the scanner pair its brace with the closing brace of
    // the FIRST rule inside it, which then gets processed under whatever
    // selector happened to precede the at-rule. That is how `.admin-refresh`
    // came to be treated as part of the sidebar and kept its dark background.
    if (/@(media|supports|keyframes|layer|document)/.test(head)) {
      i = brace + 1;
      continue;
    }

    // Everything after the last closing brace is this rule's own selector.
    selector = head
      .slice(head.lastIndexOf('}') + 1)
      .replace('{', '')
      .trim();

    const close = text.indexOf('}', brace);
    if (close === -1) {
      out += text.slice(brace + 1);
      break;
    }
    const body = text.slice(brace + 1, close);
    const keepDark =
      KEEP_DARK.some((s) => selector.includes(s)) || !inScope(file, selector);

    out += body.replace(
      /([-a-zA-Z]+)\s*:\s*([^;}]*)/g,
      (whole, property, value) => {
        if (!/#[0-9a-fA-F]{3,8}\b/.test(value)) return whole;
        if (keepDark) {
          skipped += (value.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
          return whole;
        }
        let next = value.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => {
          changed += 1;
          return convert(hex, property, selector);
        });
        next = relightFunctional(next);
        return `${property}: ${next}`;
      },
    );
    out += '}';
    i = close + 1;
  }

  writeFileSync(file.path, out, 'utf8');
}

console.log(
  `\n${files.length} stylesheets. ${changed} colours relit, ${skipped} left alone (sidebar, and the public site inside globals.css).\n`,
);
