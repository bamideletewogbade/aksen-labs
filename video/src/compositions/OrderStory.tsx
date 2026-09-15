import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { brand, font, fps, scale, type FormatName } from '../brand';
import { Frame, Rise } from '../components/Frame';

/**
 * The retail story from the home page, cut for social.
 *
 * It is the same argument the hero makes, in the same words, because a clip that
 * says something the site does not is a clip that sets up a disappointment. Four
 * scenes: the problem an owner recognises, what changes, what it costs them to
 * find out, and where to go.
 *
 * Every scene is measured in frames at the shared rate, so one can be lengthened
 * without the rest drifting out of step.
 */

const scenes = {
  hook: 4 * fps,
  turn: 4 * fps,
  proof: 5 * fps,
  close: 3 * fps,
};

export const orderStoryDuration =
  scenes.hook + scenes.turn + scenes.proof + scenes.close;

function Kicker({ format, children, tone = 'light' }: {
  format: FormatName;
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: scale[format].kicker,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: tone === 'dark' ? brand.lime : brand.green,
        marginBottom: 28,
      }}
    >
      {children}
    </div>
  );
}

function Headline({ format, tone = 'light', children }: {
  format: FormatName;
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: font.sans,
        fontSize: scale[format].headline,
        fontWeight: 600,
        letterSpacing: '-0.05em',
        lineHeight: 1.03,
        color: tone === 'dark' ? brand.onDark : brand.ink,
      }}
    >
      {children}
    </div>
  );
}

/** The site sets its second line in a serif italic. It is the one flourish the
 *  brand has, so the video keeps it rather than inventing another. */
function Accent({ tone = 'light', children }: {
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontFamily: font.serif,
        fontStyle: 'italic',
        fontWeight: 400,
        letterSpacing: '-0.055em',
        color: tone === 'dark' ? brand.lime : brand.green,
      }}
    >
      {children}
    </span>
  );
}

function Body({ format, tone = 'light', children }: {
  format: FormatName;
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: font.sans,
        fontSize: scale[format].body,
        lineHeight: 1.5,
        color: tone === 'dark' ? brand.mutedOnDark : brand.muted,
        marginTop: 32,
        maxWidth: format === 'wide' ? '62%' : '100%',
      }}
    >
      {children}
    </div>
  );
}

/** A message thread, drawn rather than screen-recorded. A real screenshot of
 *  WhatsApp would be someone else's interface and someone's real phone number. */
function Thread({ format }: { format: FormatName }) {
  const frame = useCurrentFrame();
  const lines = [
    { from: 'them', text: 'Do you have the 5L in stock?' },
    { from: 'us', text: 'Yes. Two left. Delivery to Osu today?' },
    { from: 'them', text: 'Yes please' },
    { from: 'us', text: 'Order placed. Your team can see it now.' },
  ];
  return (
    <div style={{ display: 'grid', gap: 18, marginTop: 40 }}>
      {lines.map((line, index) => {
        const at = index * 14;
        const opacity = interpolate(frame - at, [0, 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const lift = interpolate(frame - at, [0, 10], [14, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const mine = line.from === 'us';
        return (
          <div
            key={line.text}
            style={{
              opacity,
              transform: `translateY(${lift}px)`,
              alignSelf: mine ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '20px 26px',
              borderRadius: 20,
              borderBottomRightRadius: mine ? 6 : 20,
              borderBottomLeftRadius: mine ? 20 : 6,
              background: mine ? brand.green : '#ffffff',
              color: mine ? brand.paper : brand.ink,
              border: mine ? 'none' : `1px solid ${brand.line}`,
              fontFamily: font.sans,
              fontSize: scale[format].body * 0.92,
              lineHeight: 1.4,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </div>
  );
}

/**
 * `art` decides whether the title and closing cards sit on generated backdrops.
 *
 * It is off by default, so the story renders with nothing but type and colour
 * and costs nothing. Turning it on needs the assets generated first, and if they
 * are missing the frame says so rather than rendering blank.
 */
export function OrderStory({
  format,
  art = false,
}: {
  format: FormatName;
  art?: boolean;
}) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={scenes.hook}>
        <Frame
          format={format}
          backdrop={art ? 'backdrop-hero-vertical' : undefined}
        >
          <Rise>
            <Kicker format={format}>For shops that sell on WhatsApp</Kicker>
          </Rise>
          <Rise delay={6}>
            <Headline format={format}>
              Take more orders.
              <br />
              <Accent>Not more messages.</Accent>
            </Headline>
          </Rise>
        </Frame>
      </Sequence>

      <Sequence from={scenes.hook} durationInFrames={scenes.turn}>
        <Frame format={format}>
          <Rise>
            <Kicker format={format}>What changes</Kicker>
          </Rise>
          <Rise delay={5}>
            <Headline format={format}>
              An agent answers
              <br />
              <Accent>where they already are.</Accent>
            </Headline>
          </Rise>
          <Rise delay={12}>
            <Body format={format}>
              It takes the order with the details complete, and your team sees
              every one in a single place.
            </Body>
          </Rise>
        </Frame>
      </Sequence>

      <Sequence
        from={scenes.hook + scenes.turn}
        durationInFrames={scenes.proof}
      >
        <Frame format={format}>
          <Rise>
            <Kicker format={format}>One enquiry, start to finish</Kicker>
          </Rise>
          <Thread format={format} />
        </Frame>
      </Sequence>

      <Sequence
        from={scenes.hook + scenes.turn + scenes.proof}
        durationInFrames={scenes.close}
      >
        <Frame
          format={format}
          tone="dark"
          backdrop={art ? 'backdrop-close-dark' : undefined}
        >
          <Rise>
            <Headline format={format} tone="dark">
              Tell us what your
              <br />
              <Accent tone="dark">week looks like.</Accent>
            </Headline>
          </Rise>
          <Rise delay={8}>
            <Body format={format} tone="dark">
              aksenlabs.com
            </Body>
          </Rise>
        </Frame>
      </Sequence>
    </AbsoluteFill>
  );
}
