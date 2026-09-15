import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { brand, font, scale, type FormatName } from '../brand';
import { Generated } from './Generated';

/**
 * The shell every scene sits in.
 *
 * It carries the three things that have to be identical across every clip so
 * they read as one brand: the ground colour, the wordmark, and the safe area.
 * The safe area matters more than it looks: on a vertical clip, Instagram and
 * WhatsApp both put interface over roughly the top and bottom eighth of the
 * frame, so anything that has to be readable stays out of it.
 */

export function Wordmark({ tone }: { tone: 'light' | 'dark' }) {
  const onDark = tone === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: onDark ? brand.lime : brand.green,
          color: onDark ? brand.deep : brand.lime,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font.sans,
          fontSize: 34,
          fontWeight: 600,
          lineHeight: 1,
          paddingBottom: 4,
        }}
      >
        a
      </div>
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: onDark ? brand.onDark : brand.ink,
        }}
      >
        aksen
        <span style={{ fontWeight: 400, opacity: 0.6 }}> labs</span>
      </div>
    </div>
  );
}

export function Frame({
  format,
  tone = 'light',
  children,
  /** Set on the last scene so the outro does not carry a second wordmark. */
  hideWordmark = false,
  /** A key from assets.config.mjs. The scrim over it is not optional: type has
   *  to stay readable over whatever the model happened to draw that day. */
  backdrop,
}: {
  format: FormatName;
  tone?: 'light' | 'dark';
  children: React.ReactNode;
  hideWordmark?: boolean;
  backdrop?: string;
}) {
  const { gutter } = scale[format];
  const onDark = tone === 'dark';
  const { height } = useVideoConfig();
  // A tenth of the height top and bottom on vertical, where the platform chrome
  // sits. The wide cut has no chrome over it, so it keeps its own margin.
  const safe = format === 'vertical' ? height * 0.09 : gutter * 0.7;

  return (
    <AbsoluteFill
      style={{
        background: onDark ? brand.deep : brand.hero,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingLeft: gutter,
        paddingRight: gutter,
        paddingTop: safe,
        paddingBottom: safe,
      }}
    >
      {/* Layering is explicit here, and it has to be. The backdrop and its scrim
          are absolutely positioned, and the animated text inside Rise carries a
          transform. Both of those paint in the positioned layer, above plain
          blocks, so without a stated z-index the scrim washed out the wordmark
          while leaving the animated headline crisp. Stating it is one line and
          removes the whole class of bug. */}
      {backdrop && (
        <AbsoluteFill style={{ zIndex: 0 }}>
          <Generated name={backdrop} hideLabel />
          {/* Generated art is unpredictable in a way a photograph is not: the
              same prompt gives a different contrast every run, so the type
              cannot rely on it being light or dark where the words fall.
              The scrim therefore covers the band the text sits in and lets the
              art through above it. A flat scrim heavy enough to guarantee
              contrast everywhere hides the picture entirely, which is the same
              as not generating one. */}
          <AbsoluteFill
            style={{
              background: onDark
                ? 'linear-gradient(180deg, #06231944 0%, #0623195c 32%, #062319ee 47%, #062319f7 100%)'
                : 'linear-gradient(180deg, #eff3e844 0%, #eff3e85c 32%, #eff3e8ee 47%, #eff3e8f7 100%)',
            }}
          />
        </AbsoluteFill>
      )}
      <div
        style={{ position: 'relative', zIndex: 1, opacity: hideWordmark ? 0 : 1 }}
      >
        <Wordmark tone={tone} />
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
      {/* Balances the wordmark so the middle block is actually centred. */}
      <div style={{ height: 52 }} />
    </AbsoluteFill>
  );
}

/**
 * Text that arrives. Deliberately plain: a rise and a fade over a third of a
 * second, no spring, no blur. On a phone at arm's length anything busier just
 * reads as the video being slow to start.
 */
export function Rise({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lift = interpolate(local, [0, 12], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ ...style, opacity, transform: `translateY(${lift}px)` }}>
      {children}
    </div>
  );
}
