import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { brand, font, fps, scale, type FormatName } from '../brand';
import { Frame, Rise, Wordmark } from '../components/Frame';
import { Generated } from '../components/Generated';
import { DeviceFrame } from '../components/DeviceFrame';
import { HumanSlot } from '../components/HumanSlot';
import { Captions, layoutCaptions } from '../components/Captions';

/**
 * The launch film.
 *
 * Structure is a plain problem-to-proof arc rather than a feature list, because
 * a feature list is what a company writes when it has not decided who it is
 * talking to. This one is talking to somebody who runs a small shop and lost
 * their evening to WhatsApp.
 *
 *   01  the evening              generated still, no people
 *   02  the problem, named       generated still
 *   03  a person                 recorded in OBS, slate until then
 *   04  what happens instead     real product screens
 *   05  where the line is        the argument the company actually turns on
 *   06  what is free today       real product screen
 *   07  the morning after        generated still
 *   08  where to go              close card
 *
 * Every shot carries a caption, and the captions carry the script. Most of this
 * will be watched muted in a feed, so the film has to work with no sound at all
 * and gain from sound rather than depend on it.
 */

// Seconds per shot. Kept here as one readable block so the pacing can be argued
// about without reading the JSX, and so the captions and the shots are cut from
// the same numbers rather than drifting apart.
const shots = {
  evening: 4,
  problem: 5,
  human: 8,
  instead: 7,
  team: 6,
  line: 6,
  free: 6,
  morning: 4,
  close: 4,
};

const seconds = Object.values(shots).reduce((total, s) => total + s, 0);
export const launchFilmDuration = Math.round(seconds * fps);

const f = (s: number) => Math.round(s * fps);

/** Cumulative start frame for a shot, so inserting one does not mean retyping
 *  every number after it. */
const at = (key: keyof typeof shots) => {
  const keys = Object.keys(shots) as (keyof typeof shots)[];
  return f(
    keys.slice(0, keys.indexOf(key)).reduce((total, k) => total + shots[k], 0),
  );
};

const script = [
  { text: 'It is nine at night and the shop closed an hour ago.', seconds: shots.evening },
  { text: 'Forty messages came in today. Three of them were orders.', seconds: shots.problem },
  { text: '', seconds: shots.human },
  { text: 'An agent answers on WhatsApp and takes the order with the details complete.', seconds: shots.instead },
  { text: 'Your team sees every one in a single place.', seconds: shots.team },
  { text: 'It never sets a price, takes a payment, or promises a date. You do.', seconds: shots.line },
  { text: 'Three tools are free on the site right now. No account.', seconds: shots.free },
  { text: 'The evening is yours again.', seconds: shots.morning },
  { text: 'aksenlabs.com', seconds: shots.close },
];

/**
 * A product shot: kicker, then the phone, sitting clear of the caption.
 *
 * The caption plate occupies the bottom fifth of a vertical frame, and a phone
 * centred in the whole frame runs straight under it. So the group is centred in
 * the space above the caption instead, and the phone is sized to that space
 * rather than to the frame.
 */
function ProductShot({
  format,
  kicker,
  capture,
  scrollBy,
  tilt,
}: {
  format: FormatName;
  kicker: string;
  capture: string;
  scrollBy: number;
  tilt: number;
}) {
  const vertical = format === 'vertical';
  return (
    <Frame format={format} hideWordmark>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: vertical ? 'center' : 'flex-start',
          justifyContent: 'center',
          height: '100%',
          // Room for the caption plate plus the platform chrome under it.
          paddingBottom: vertical ? '26%' : '12%',
        }}
      >
        <Rise>
          <Kicker format={format}>{kicker}</Kicker>
        </Rise>
        <Rise delay={5}>
          <DeviceFrame
            capture={capture}
            scrollBy={scrollBy}
            width={vertical ? 440 : 380}
            tilt={tilt}
          />
        </Rise>
      </div>
    </Frame>
  );
}

function Kicker({
  format,
  tone = 'light',
  children,
}: {
  format: FormatName;
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: scale[format].kicker,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: tone === 'dark' ? brand.lime : brand.green,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function Headline({
  format,
  tone = 'light',
  size = 1,
  children,
}: {
  format: FormatName;
  tone?: 'light' | 'dark';
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontFamily: font.sans,
        fontSize: scale[format].headline * size,
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

function Accent({ tone = 'light', children }: { tone?: 'light' | 'dark'; children: React.ReactNode }) {
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

/**
 * A still, drifting. Four seconds of a motionless picture reads as a stall; the
 * same picture creeping reads as a held shot.
 *
 * A small overscan remains as a second line of defence. The letterbox these
 * models paint in is cut at generation time by scripts/trim-borders.mjs, which
 * is the right place for it, but a couple of per cent here covers a single stray
 * row the detector left behind and costs nothing worth keeping.
 */
const OVERSCAN = 1.03;

function Still({
  name,
  from = OVERSCAN,
  to = OVERSCAN + 0.09,
}: {
  name: string;
  from?: number;
  to?: number;
}) {
  const frame = useCurrentFrame();
  const scaleAt = interpolate(frame, [0, 150], [
    Math.max(from, OVERSCAN),
    Math.max(to, OVERSCAN),
  ], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ transform: `scale(${scaleAt})` }}>
      <Generated name={name} />
    </AbsoluteFill>
  );
}

/** A scrim under the type on a photographic shot. The generated stills are busy
 *  and unpredictable in a way a flat colour is not. */
function Shade({ strength = 'heavy' }: { strength?: 'heavy' | 'light' }) {
  return (
    <AbsoluteFill
      style={{
        // Weighted to the bottom third, where the type and the caption live,
        // and kept off the middle. An even scrim heavy enough to guarantee
        // contrast turns a lamplit room into grey mud, and then there was no
        // point generating a picture at all.
        background:
          strength === 'heavy'
            ? 'linear-gradient(180deg, #04150e14 0%, #04150e1f 34%, #04150eab 62%, #04150ee8 100%)'
            : 'linear-gradient(180deg, #04150e08 0%, #04150e14 45%, #04150e70 78%, #04150eb8 100%)',
      }}
    />
  );
}

export function LaunchFilm({ format }: { format: FormatName }) {
  const captions = layoutCaptions(script, fps);
  const gutter = scale[format].gutter;

  return (
    <AbsoluteFill style={{ background: brand.deep }}>
      {/* 01 The evening. The one generated clip in the film, because motion at
          the open earns attention that a still does not. */}
      <Sequence durationInFrames={f(shots.evening)}>
        <AbsoluteFill>
          <Generated name="opening-drift" />
          <Shade strength="light" />
          <AbsoluteFill style={{ padding: gutter, justifyContent: 'flex-start' }}>
            <Rise>
              <Wordmark tone="dark" />
            </Rise>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>

      {/* 02 The problem, in the room where it happens. */}
      <Sequence from={at('problem')} durationInFrames={f(shots.problem)}>
        <AbsoluteFill>
          <Still name="late-counter" />
          <Shade />
          <AbsoluteFill style={{ padding: gutter, justifyContent: 'center' }}>
            <Rise delay={4}>
              <Headline format={format} tone="dark" size={0.74}>
                Forty messages.
                <br />
                <Accent tone="dark">Three were orders.</Accent>
              </Headline>
            </Rise>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>

      {/* 03 A person. Nothing here can generate this shot honestly. */}
      <Sequence from={at('human')} durationInFrames={f(shots.human)}>
        <HumanSlot format={format} />
      </Sequence>

      {/* 04 What happens instead, on the actual product. */}
      <Sequence from={at('instead')} durationInFrames={f(shots.instead)}>
        <ProductShot
          format={format}
          kicker="What happens instead"
          capture="order-demo"
          scrollBy={0.22}
          tilt={-2}
        />
      </Sequence>

      {/* 05 The team side of the same order. */}
      <Sequence from={at('team')} durationInFrames={f(shots.team)}>
        <ProductShot
          format={format}
          kicker="One place, not forty threads"
          capture="products-tools"
          scrollBy={0.32}
          tilt={2}
        />
      </Sequence>

      {/* 06 Where the line is. The argument the company actually turns on, so it
          gets a plain dark card and no picture competing with it. */}
      <Sequence from={at('line')} durationInFrames={f(shots.line)}>
        <Frame format={format} tone="dark" hideWordmark>
          <Rise>
            <Kicker format={format} tone="dark">
              Where the line is
            </Kicker>
          </Rise>
          <Rise delay={5}>
            <Headline format={format} tone="dark" size={0.68}>
              People keep the decisions
              <br />
              <Accent tone="dark">that carry consequences.</Accent>
            </Headline>
          </Rise>
        </Frame>
      </Sequence>

      {/* 07 What is free today, which is the only ask the film makes. */}
      <Sequence from={at('free')} durationInFrames={f(shots.free)}>
        <ProductShot
          format={format}
          kicker="Free on the site today"
          capture="feedback-board"
          scrollBy={0.26}
          tilt={-1.5}
        />
      </Sequence>

      {/* 08 The same room, next morning. The pair does the before and after
          without a line of copy claiming a result. */}
      <Sequence from={at('morning')} durationInFrames={f(shots.morning)}>
        <AbsoluteFill>
          <Still name="morning-counter" from={1.08} to={1} />
          <Shade strength="light" />
        </AbsoluteFill>
      </Sequence>

      {/* 09 Where to go. */}
      <Sequence from={at('close')} durationInFrames={f(shots.close)}>
        <AbsoluteFill>
          <Generated name="backdrop-close-dark" />
          <AbsoluteFill
            style={{
              background: 'linear-gradient(180deg, #062319cc 0%, #062319f2 70%)',
            }}
          />
          <AbsoluteFill
            style={{
              padding: gutter,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 34,
            }}
          >
            <Rise>
              <Wordmark tone="dark" />
            </Rise>
            <Rise delay={7}>
              <Headline format={format} tone="dark" size={0.56}>
                <Accent tone="dark">Take more orders.</Accent>
              </Headline>
            </Rise>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>

      {/* Captions sit above every shot, on one timeline, so a re-cut moves the
          words with the pictures. */}
      <Captions lines={captions} format={format} tone="dark" />
    </AbsoluteFill>
  );
}
