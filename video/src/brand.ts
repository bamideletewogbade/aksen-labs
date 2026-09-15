/**
 * The site's palette, restated for video.
 *
 * These are copied from platform/app/agency.css rather than imported: the video
 * workspace builds on its own and has no path into the Next app, and a video is
 * rendered once and lives on someone's phone afterwards, so it should not break
 * because a stylesheet moved. If the site's palette changes, change it here too.
 * That is the trade, and it is written down so it is a decision rather than a
 * surprise.
 */
export const brand = {
  paper: '#f9faf7',
  /** The pale green the home hero sits on. */
  hero: '#eff3e8',
  ink: '#10261d',
  green: '#175b3b',
  deep: '#062319',
  lime: '#c2f576',
  signal: '#7cff62',
  muted: '#53635a',
  line: '#c9d4c7',
  onDark: '#e7efe3',
  mutedOnDark: '#a9bcb2',
} as const;

/**
 * Geist is the site's typeface and is on Google Fonts, but a render that
 * downloads a font is a render that fails on a bad connection at the wrong
 * moment. The stack degrades to the platform UI face, which is close enough in
 * width that the layout does not move.
 */
export const font = {
  sans: '"Geist", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"Geist Mono", "SFMono-Regular", Consolas, monospace',
  /** Georgia carries the site's italic accent in headings. */
  serif: 'Georgia, "Times New Roman", serif',
} as const;

/** Every composition renders at this rate, so durations in frames mean the same
 *  thing everywhere and a scene can be moved between them. */
export const fps = 30;

/**
 * The three shapes one story is cut to. Vertical is first on purpose: WhatsApp
 * Status and Instagram Stories are where this business's audience actually is,
 * and a 16:9 film letterboxed into a phone is what most small businesses post.
 */
export const formats = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wide: { width: 1920, height: 1080 },
} as const;

export type FormatName = keyof typeof formats;

/**
 * Type scales per format rather than one scale multiplied by a factor.
 *
 * A headline that fills a 1080-wide vertical frame is not the same headline
 * scaled down for a 1920-wide one: the vertical has half the line length, so it
 * needs a smaller size and more lines. Multiplying gets you text that overflows
 * in one shape and looks lost in another.
 */
export const scale: Record<
  FormatName,
  { kicker: number; headline: number; body: number; gutter: number }
> = {
  vertical: { kicker: 30, headline: 104, body: 42, gutter: 96 },
  square: { kicker: 28, headline: 88, body: 38, gutter: 88 },
  wide: { kicker: 26, headline: 96, body: 40, gutter: 120 },
};
