import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { brand, font, scale, type FormatName } from '../brand';

/**
 * Burned-in captions.
 *
 * Not an accessibility afterthought: most of this film will be watched with the
 * sound off, on a phone, in a feed. If the argument only exists in a voiceover
 * then for most viewers the argument does not exist. So the caption carries the
 * script and the audio is the thing that is optional, which is the opposite of
 * how video usually gets made.
 *
 * Words arrive in time with speech rather than a line appearing whole, because a
 * full sentence popping in gets read ahead of the narration and then the viewer
 * is waiting rather than listening.
 *
 * It sits above the bottom safe area. Instagram and WhatsApp both put interface
 * over roughly the bottom eighth of a vertical frame, and a caption under a
 * progress bar is a caption nobody reads.
 */

export type CaptionLine = {
  /** Frame this line starts on, relative to the sequence it lives in. */
  from: number;
  durationInFrames: number;
  text: string;
};

function Word({
  word,
  index,
  total,
  duration,
}: {
  word: string;
  index: number;
  total: number;
  duration: number;
}) {
  const frame = useCurrentFrame();
  // Words are spread across the first 55% of the line's time, so the last word
  // lands well before the line leaves rather than flashing as it goes.
  const per = (duration * 0.55) / Math.max(total, 1);
  const at = index * per;
  const opacity = interpolate(frame - at, [0, 4], [0.28, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // The trailing space is load-bearing. With the gap done by marginRight and no
  // whitespace between the spans, the browser sees one unbroken token and the
  // caption runs off the side of the frame instead of wrapping.
  return (
    <>
      <span style={{ opacity }}>{word}</span>{' '}
    </>
  );
}

export function Captions({
  lines,
  format,
  tone = 'light',
}: {
  lines: CaptionLine[];
  format: FormatName;
  tone?: 'light' | 'dark';
}) {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const active = lines.find(
    (line) => frame >= line.from && frame < line.from + line.durationInFrames,
  );
  // An empty line is a deliberate silence, not a missing caption. The shot it
  // belongs to speaks for itself, so it gets no plate at all rather than an
  // empty one sitting there looking like a bug.
  if (!active || !active.text.trim()) return null;

  const local = frame - active.from;
  const fade = interpolate(
    local,
    [0, 5, active.durationInFrames - 6, active.durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const words = active.text.split(' ');
  const onDark = tone === 'dark';

  return (
    <div
      style={{
        position: 'absolute',
        left: scale[format].gutter * 0.7,
        right: scale[format].gutter * 0.7,
        bottom: format === 'vertical' ? height * 0.13 : scale[format].gutter,
        zIndex: 10,
        opacity: fade,
        // Deliberately not a flex row. A flex item has an automatic minimum size
        // of its content, so a long caption refused to wrap and ran off the
        // right of the frame instead. A centred block has no such opinion.
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          // A solid plate rather than a text shadow. The film cuts between a
          // dark room, a pale backdrop and a screenshot, and text shadow is
          // legible over exactly one of those.
          background: onDark ? '#04150ee8' : '#10261df2',
          color: onDark ? brand.onDark : '#f4f8ef',
          padding: `${format === 'vertical' ? 22 : 18}px 28px`,
          borderRadius: 14,
          fontFamily: font.sans,
          fontSize: scale[format].body * 1.05,
          fontWeight: 500,
          lineHeight: 1.38,
          letterSpacing: '-0.015em',
          textAlign: 'center',
          textWrap: 'balance',
        }}
      >
        {words.map((word, index) => (
          <Word
            key={`${index}-${word}`}
            word={word}
            index={index}
            total={words.length}
            duration={active.durationInFrames}
          />
        ))}
      </div>
    </div>
  );
}

/** Lays a script out end to end, so a timing change in one line does not mean
 *  recalculating the `from` of every line after it by hand. */
export function layoutCaptions(
  script: { text: string; seconds: number }[],
  fps: number,
  startAt = 0,
): CaptionLine[] {
  let cursor = startAt;
  return script.map((line) => {
    const durationInFrames = Math.round(line.seconds * fps);
    const entry = { from: cursor, durationInFrames, text: line.text };
    cursor += durationInFrames;
    return entry;
  });
}
