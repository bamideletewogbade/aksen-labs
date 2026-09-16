import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { brand, font, fps, type FormatName } from '../brand';

/**
 * The sixty second ad.
 *
 * The launch film is a slow argument for somebody who has already decided to
 * pay attention. This is the opposite: it is for a feed, it has one second to
 * earn the next one, and it is built on hard cuts and type that arrives rather
 * than fades. Every shot is the real product, because an ad for software that
 * uses illustrations of software is telling you something.
 *
 * Six acts, and the order is the argument:
 *
 *   01  the evening        a problem, stated as three numbers
 *   02  the name           who is talking
 *   03  what we sell       four services, four seconds each
 *   04  the workshop       our own back office, running
 *   05  how it is built    the shape of a custom workflow
 *   06  the line           the promise the company turns on, then out
 *
 * Nothing here claims a customer or a result, because there are none yet. The
 * proof on offer is that the software exists and you can go and press it.
 */

const f = (seconds: number) => Math.round(seconds * fps);

const shots = {
  open: 7,
  title: 4,
  services: 15,
  workshop: 16,
  build: 11,
  close: 7,
};

export const aksenAdDuration = f(
  Object.values(shots).reduce((total, s) => total + s, 0),
);

const at = (key: keyof typeof shots) => {
  const keys = Object.keys(shots) as (keyof typeof shots)[];
  return f(
    keys.slice(0, keys.indexOf(key)).reduce((total, k) => total + shots[k], 0),
  );
};

/**
 * Type that lands rather than appears.
 *
 * A fade says the video is loading. A short overshoot on the scale, finished
 * inside a quarter of a second, says something arrived. It is the only motion
 * in the piece that is allowed to be fast.
 */
function Slam({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame() - delay;
  const opacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const size = interpolate(frame, [0, 5, 8], [1.14, 0.99, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        ...style,
        opacity,
        transform: `scale(${size})`,
        transformOrigin: 'left center',
      }}
    >
      {children}
    </div>
  );
}

/** A still, pushed. Four seconds of a motionless screenshot reads as a stall. */
function Screen({
  name,
  from = 1.0,
  to = 1.08,
  duration,
}: {
  name: string;
  from?: number;
  to?: number;
  duration: number;
}) {
  const frame = useCurrentFrame();
  const size = interpolate(frame, [0, duration], [from, to], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(`screens/${name}.png`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          transform: `scale(${size})`,
        }}
      />
    </AbsoluteFill>
  );
}

/** A single lime frame on a cut. Cheap, and it makes a hard edit feel deliberate. */
function Flash({ at: when }: { at: number }) {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [when - 1, when, when + 3], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ background: brand.lime, opacity: on, zIndex: 40 }} />
  );
}

function Kicker({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: size,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: brand.lime,
      }}
    >
      {children}
    </div>
  );
}

const sizes = {
  vertical: { huge: 118, big: 78, mid: 52, body: 36, kicker: 26 },
  square: { huge: 104, big: 70, mid: 46, body: 33, kicker: 24 },
  wide: { huge: 132, big: 86, mid: 54, body: 36, kicker: 24 },
} as const;

/** The dark ground every act sits on, with a readable scrim over any screen. */
function Stage({
  children,
  scrim = 'heavy',
}: {
  children?: React.ReactNode;
  scrim?: 'heavy' | 'light' | 'none';
}) {
  return (
    <AbsoluteFill style={{ background: brand.deep }}>
      {children}
      {/* Weighted to the bottom, where the type sits, and kept off the middle.
          The first pass used an even scrim heavy enough to guarantee contrast
          anywhere, which washed the product to a flat green and left an ad for
          software with no software visible in it. The screen is the argument;
          the scrim only has to protect the words. */}
      {scrim !== 'none' && (
        <AbsoluteFill
          style={{
            background:
              scrim === 'heavy'
                ? 'linear-gradient(180deg, #06231926 0%, #0623191f 34%, #062319c9 68%, #062319fa 100%)'
                : 'linear-gradient(180deg, #06231914 0%, #06231914 46%, #062319b3 76%, #062319f7 100%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
}

const services = [
  { n: '01', name: 'Customer experience and commerce', note: 'Websites, shops, booking and payments.', screen: 'home-services' },
  { n: '02', name: 'Business systems and operations', note: 'Records, admin tools, approvals, integrations.', screen: 'admin-drafts' },
  { n: '03', name: 'Data and business insight', note: 'Reporting you can act on.', screen: 'admin-home-lower' },
  { n: '04', name: 'Digital products and new services', note: 'An idea, built into something people use.', screen: 'products' },
];

const workshop = [
  { label: 'Leads, researched', screen: 'admin-prospects' },
  { label: 'Drafts, before anyone acts', screen: 'admin-tools' },
  { label: 'What the AI may not do', screen: 'admin-feedback' },
  { label: 'One idea, every channel', screen: 'admin-social' },
];

const stages = [
  { n: '1', name: 'Scout', note: 'Reads public information' },
  { n: '2', name: 'Enricher', note: 'Collects the facts' },
  { n: '3', name: 'Evidence gate', note: 'Rejects what it cannot support' },
  { n: '4', name: 'You', note: 'Decide what happens next' },
];

export function AksenAd({ format }: { format: FormatName }) {
  const s = sizes[format];
  const vertical = format === 'vertical';
  const pad = vertical ? 88 : 132;

  return (
    <AbsoluteFill style={{ background: brand.deep }}>
      {/* 01 The evening. Three numbers, hard cuts, no pictures. Nothing earns
          attention in a feed like a black frame with one line on it. */}
      <Sequence durationInFrames={f(shots.open)}>
        <Stage scrim="none">
          <AbsoluteFill style={{ padding: pad, justifyContent: 'center' }}>
            <Sequence durationInFrames={f(2.2)}>
              <Slam>
                <div style={{ fontFamily: font.mono, fontSize: s.big, color: brand.lime, letterSpacing: '-0.02em' }}>
                  9:04 PM
                </div>
                <div style={{ fontFamily: font.sans, fontSize: s.mid, color: brand.mutedOnDark, marginTop: 18 }}>
                  The shop closed an hour ago.
                </div>
              </Slam>
            </Sequence>
            <Sequence from={f(2.2)} durationInFrames={f(2.2)}>
              <Slam>
                <div style={{ fontFamily: font.sans, fontSize: s.huge, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.05em', lineHeight: 1 }}>
                  40 messages.
                </div>
              </Slam>
            </Sequence>
            <Sequence from={f(4.4)}>
              <Slam>
                <div style={{ fontFamily: font.sans, fontSize: s.huge, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.05em', lineHeight: 1 }}>
                  3 were
                </div>
                <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: s.huge, color: brand.lime, letterSpacing: '-0.05em', lineHeight: 1.05 }}>
                  orders.
                </div>
              </Slam>
            </Sequence>
          </AbsoluteFill>
        </Stage>
      </Sequence>

      {/* 02 The name. */}
      <Sequence from={at('title')} durationInFrames={f(shots.title)}>
        <Stage scrim="none">
          <Flash at={0} />
          <AbsoluteFill style={{ padding: pad, justifyContent: 'center', alignItems: 'center' }}>
            <Slam style={{ transformOrigin: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, justifyContent: 'center' }}>
                <div style={{ width: s.big, height: s.big, borderRadius: s.big * 0.26, background: brand.lime, color: brand.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.sans, fontSize: s.big * 0.66, fontWeight: 600, paddingBottom: 6 }}>
                  a
                </div>
                <div style={{ fontFamily: font.sans, fontSize: s.big, fontWeight: 600, letterSpacing: '-0.045em', color: brand.onDark }}>
                  aksen<span style={{ opacity: 0.55, fontWeight: 400 }}> labs</span>
                </div>
              </div>
            </Slam>
            <Slam delay={8} style={{ transformOrigin: 'center', marginTop: 34, textAlign: 'center' }}>
              <div style={{ fontFamily: font.sans, fontSize: s.body, color: brand.mutedOnDark, letterSpacing: '0.02em' }}>
                Websites. Business systems. AI.
              </div>
              <div style={{ fontFamily: font.mono, fontSize: s.kicker, color: brand.lime, letterSpacing: '0.16em', marginTop: 16 }}>
                BUILT IN GHANA
              </div>
            </Slam>
          </AbsoluteFill>
        </Stage>
      </Sequence>

      {/* 03 What we sell. Four services, under four seconds each, each one a
          real screen with the name over it. */}
      {services.map((service, i) => {
        const each = shots.services / services.length;
        return (
          <Sequence
            key={service.n}
            from={at('services') + f(each * i)}
            durationInFrames={f(each)}
          >
            <Stage scrim="heavy">
              <Screen name={service.screen} duration={f(each)} from={1.02} to={1.12} />
            </Stage>
            <Flash at={0} />
            <AbsoluteFill style={{ padding: pad, justifyContent: 'flex-end', paddingBottom: vertical ? 420 : pad }}>
              <Slam>
                <Kicker size={s.kicker}>{service.n}</Kicker>
                <div style={{ fontFamily: font.sans, fontSize: s.big, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.045em', lineHeight: 1.04, marginTop: 14, maxWidth: vertical ? '100%' : '62%' }}>
                  {service.name}
                </div>
                <div style={{ fontFamily: font.sans, fontSize: s.body, color: brand.mutedOnDark, marginTop: 16 }}>
                  {service.note}
                </div>
              </Slam>
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* 04 The workshop. The claim is that we run the agency on this, so the
          evidence is the back office rather than a diagram of one. */}
      <Sequence from={at('workshop')} durationInFrames={f(shots.workshop)}>
        <Sequence durationInFrames={f(3.4)}>
          <Stage scrim="none">
            <AbsoluteFill style={{ padding: pad, justifyContent: 'center' }}>
              <Slam>
                <Kicker size={s.kicker}>WE RUN AKSEN ON IT</Kicker>
                <div style={{ fontFamily: font.sans, fontSize: s.big, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.045em', lineHeight: 1.05, marginTop: 18 }}>
                  Our shop window.
                </div>
                <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: s.big, color: brand.lime, letterSpacing: '-0.045em', lineHeight: 1.1 }}>
                  And the workshop behind it.
                </div>
              </Slam>
            </AbsoluteFill>
          </Stage>
        </Sequence>
        {workshop.map((item, i) => {
          const each = (shots.workshop - 3.4) / workshop.length;
          return (
            <Sequence key={item.label} from={f(3.4 + each * i)} durationInFrames={f(each)}>
              <Stage scrim="light">
                <Screen name={item.screen} duration={f(each)} from={1.04} to={1.13} />
              </Stage>
              <Flash at={0} />
              <AbsoluteFill style={{ padding: pad, justifyContent: 'flex-end' }}>
                <Slam>
                  <div style={{ fontFamily: font.sans, fontSize: s.mid, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.03em' }}>
                    {item.label}
                  </div>
                </Slam>
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </Sequence>

      {/* 05 How a custom workflow is shaped. The stages are the ones the product
          actually runs, ending on the one a person holds. */}
      <Sequence from={at('build')} durationInFrames={f(shots.build)}>
        <Stage scrim="heavy">
          {/* Low, because the page underneath is white and this act carries more
              type than any other: a headline, four stage names and four notes.
              At half opacity the screen fought all nine of them. */}
          <AbsoluteFill style={{ opacity: 0.2 }}>
            <OffthreadVideo
              src={staticFile('screens/leadscout.mp4')}
              startFrom={f(8)}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            />
          </AbsoluteFill>
        </Stage>
        <Flash at={0} />
        <AbsoluteFill style={{ padding: pad, justifyContent: 'center' }}>
          <Slam>
            <Kicker size={s.kicker}>CUSTOM AI WORKFLOWS</Kicker>
            <div style={{ fontFamily: font.sans, fontSize: s.mid * 1.2, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 16, maxWidth: vertical ? '100%' : '70%' }}>
              We build the work around how your team already works.
            </div>
          </Slam>
          <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: vertical ? 18 : 28, marginTop: 46 }}>
            {stages.map((stage, i) => (
              <Slam key={stage.name} delay={f(1.1 + i * 0.5)} style={{ flex: 1 }}>
                <div style={{ borderTop: `2px solid ${i === 3 ? brand.lime : '#2b4433'}`, paddingTop: 16 }}>
                  <div style={{ fontFamily: font.mono, fontSize: s.kicker * 0.86, color: i === 3 ? brand.lime : brand.mutedOnDark, letterSpacing: '0.14em' }}>
                    {stage.n}
                  </div>
                  <div style={{ fontFamily: font.sans, fontSize: s.body * 1.12, fontWeight: 600, color: brand.onDark, marginTop: 8 }}>
                    {stage.name}
                  </div>
                  <div style={{ fontFamily: font.sans, fontSize: s.body * 0.82, color: brand.mutedOnDark, marginTop: 6 }}>
                    {stage.note}
                  </div>
                </div>
              </Slam>
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 06 The line, then out. This is the argument the company turns on, so it
          gets the last full shot and nothing shares it. */}
      <Sequence from={at('close')} durationInFrames={f(shots.close)}>
        <Stage scrim="none">
          <Flash at={0} />
          <Sequence durationInFrames={f(4.2)}>
            <AbsoluteFill style={{ padding: pad, justifyContent: 'center' }}>
              <Slam>
                <div style={{ fontFamily: font.sans, fontSize: s.mid * 1.16, fontWeight: 600, color: brand.onDark, letterSpacing: '-0.035em', lineHeight: 1.22 }}>
                  It never sets a price.
                  <br />
                  It never takes a payment.
                </div>
                <div style={{ fontFamily: font.serif, fontStyle: 'italic', fontSize: s.mid * 1.16, color: brand.lime, letterSpacing: '-0.035em', lineHeight: 1.3 }}>
                  It never promises a date.
                </div>
              </Slam>
              <Slam delay={f(1.6)}>
                <div style={{ fontFamily: font.sans, fontSize: s.body, color: brand.mutedOnDark, marginTop: 30, maxWidth: vertical ? '100%' : '64%' }}>
                  Those stay with a person. Not because we ask, because the system
                  does not give it the option.
                </div>
              </Slam>
            </AbsoluteFill>
          </Sequence>
          <Sequence from={f(4.2)}>
            <AbsoluteFill style={{ padding: pad, justifyContent: 'center', alignItems: 'center' }}>
              <Slam style={{ transformOrigin: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: font.sans, fontSize: s.big, fontWeight: 600, letterSpacing: '-0.045em', color: brand.onDark }}>
                  aksen<span style={{ opacity: 0.55, fontWeight: 400 }}> labs</span>
                </div>
                <div style={{ fontFamily: font.mono, fontSize: s.kicker, color: brand.lime, letterSpacing: '0.16em', marginTop: 18 }}>
                  AKSENLABS.COM
                </div>
              </Slam>
              {/* The credit, small and last, the way a credit goes. */}
              <Slam delay={f(1.1)} style={{ transformOrigin: 'center', marginTop: 54, textAlign: 'center' }}>
                <div style={{ fontFamily: font.mono, fontSize: s.kicker * 0.78, color: '#5d7a64', letterSpacing: '0.2em' }}>
                  PRODUCED BY BISHOP
                </div>
              </Slam>
            </AbsoluteFill>
          </Sequence>
        </Stage>
      </Sequence>
    </AbsoluteFill>
  );
}

/** Kept for the studio sidebar, which shows the length of each composition. */
export const aksenAdSeconds = aksenAdDuration / fps;
void useVideoConfig;
