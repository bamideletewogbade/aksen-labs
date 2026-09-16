import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { brand } from '../brand';
// The kit's config is the single source for prices, the number and the link.
// Importing it rather than copying it means a price change cannot leave the
// videos quoting an old figure after the stills have moved on.
import { contact, industries, offers } from '../../../marketing/nigeria-kit/config.mjs';

/**
 * The Nigeria friends kit, as video.
 *
 * Vertical only. These go to WhatsApp Status, Instagram Reels and TikTok, all
 * of which are phone-first; a square cut would be a render nobody posts.
 *
 * Every industry shot is a generated illustration of a place with nobody in it,
 * and the drawn product screen of a fictional business. The label saying so is
 * on screen for the whole shot, not in a caption someone can crop.
 */

type Industry = (typeof industries)[number];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const SANS = 'GeistKit, Geist, Inter, system-ui, sans-serif';
const MONO = 'GeistKitMono, "Geist Mono", monospace';

export const NG_REEL = 360;
export const NG_OVERVIEW = 900;
export const NG_OFFERS = 450;

const Fonts = () => (
  <style>{`
    ${[
      ['Regular', 400],
      ['Medium', 500],
      ['SemiBold', 600],
      ['Bold', 700],
      ['Black', 900],
    ]
      .map(
        ([n, w]) =>
          `@font-face{font-family:GeistKit;font-weight:${w};src:url(${staticFile(`fonts/Geist-${n}.woff2`)}) format('woff2')}`,
      )
      .join('')}
    @font-face{font-family:GeistKitMono;src:url(${staticFile('fonts/GeistMono-Medium.woff2')}) format('woff2')}
  `}</style>
);

const Art = ({ name, zoom = 0.12, dim = 0.45 }: { name: string; zoom?: number; dim?: number }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = 1.05 + (f / durationInFrames) * zoom;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: brand.deep }}>
      <Img
        src={staticFile(`generated/${name}.png`)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})` }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(6,35,25,${dim}) 0%, rgba(6,35,25,0.2) 30%, rgba(6,35,25,0.75) 62%, ${brand.deep} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Kicker = ({ children, at = 0 }: { children: React.ReactNode; at?: number }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 12], [0, 1], clamp);
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 32,
        letterSpacing: 6,
        textTransform: 'uppercase',
        color: brand.lime,
        opacity: o,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transform: `translateX(${(1 - o) * -30}px)`,
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: 8, background: brand.signal, boxShadow: `0 0 20px ${brand.signal}` }} />
      {children}
    </div>
  );
};

/** Words land one after another. The last word can carry the italic accent. */
const Headline = ({ text, at = 0, size = 118, accent = true }: { text: string; at?: number; size?: number; accent?: boolean }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: size, lineHeight: 1.0, letterSpacing: -3, color: '#fff', display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.24}px`, textShadow: '0 8px 40px rgba(0,0,0,.35)' }}>
      {words.map((w, i) => {
        const s = spring({ frame: f - at - i * 3, fps, config: { damping: 16, stiffness: 150 } });
        const last = accent && i === words.length - 1;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: s,
              transform: `translateY(${(1 - s) * 50}px) rotate(${(1 - s) * 4}deg)`,
              filter: `blur(${(1 - s) * 8}px)`,
              ...(last ? { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 400, color: brand.lime, letterSpacing: -1 } : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Label = ({ text }: { text: string }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', fontFamily: MONO, fontSize: 22, color: 'rgba(231,239,227,.75)', letterSpacing: 1 }}>
    {text}
  </div>
);

const Brand = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: '#fff' }}>
    <span style={{ width: 46, height: 46, borderRadius: 13, background: brand.lime, boxShadow: `inset 0 0 0 9px ${brand.green}` }} />
    Aksen Labs
  </div>
);

const Cta = ({ at = 0, title = 'Book a free discovery call' }: { at?: number; title?: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 120 } });
  const pulse = 1 + Math.sin((f - at) / 6) * 0.015;
  return (
    <div
      style={{
        background: brand.lime,
        color: brand.deep,
        borderRadius: 34,
        padding: '30px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transform: `translateY(${(1 - s) * 120}px) scale(${f > at + 20 ? pulse : 1})`,
        opacity: s,
        fontFamily: SANS,
        boxShadow: '0 30px 80px rgba(194,245,118,.25)',
      }}
    >
      <div>
        <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
        <div style={{ fontSize: 32, fontWeight: 600 }}>WhatsApp {contact.whatsappDisplay}</div>
        {contact.link ? <div style={{ fontSize: 22, fontFamily: MONO, opacity: 0.75 }}>{contact.link}</div> : null}
      </div>
      <div style={{ width: 88, height: 88, borderRadius: 44, background: brand.deep, display: 'grid', placeItems: 'center', color: brand.lime, fontSize: 44 }}>↗</div>
    </div>
  );
};

const PricePill = ({ name, price, at = 0 }: { name: string; price: string; at?: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 16,
        padding: '18px 32px',
        borderRadius: 999,
        background: 'rgba(6,35,25,.85)',
        border: `2px solid rgba(194,245,118,.55)`,
        transform: `scale(${0.6 + s * 0.4})`,
        opacity: s,
        transformOrigin: 'left center',
        fontFamily: SANS,
      }}
    >
      <span style={{ fontSize: 30, color: brand.mutedOnDark }}>{name}</span>
      <b style={{ fontSize: 52, color: brand.lime }}>{price}</b>
    </div>
  );
};

/** The drawn product screen, sliding up with a tilt that settles. */
const Screen = ({ id, at = 0, width = 900 }: { id: string; at?: number; width?: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 90 } });
  const float = Math.sin((f - at) / 22) * 6;
  return (
    <Img
      src={staticFile(`ng-ui/${id}.png`)}
      style={{
        width,
        borderRadius: 40,
        transform: `translateY(${(1 - s) * 500 + float}px) rotate(${-2 + (1 - s) * 10}deg) scale(${0.85 + s * 0.15})`,
        opacity: Math.min(1, s * 1.5),
        filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.5))',
      }}
    />
  );
};

const Typed = ({ text, at, size = 44 }: { text: string; at: number; size?: number }) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [at, at + text.length * 0.9], [0, text.length], clamp));
  return <div style={{ fontFamily: SANS, fontSize: size, color: brand.onDark, lineHeight: 1.3 }}>{text.slice(0, n)}</div>;
};

/* ------------------------------------------------------------------ */
/* One industry, twelve seconds.                                       */
/* ------------------------------------------------------------------ */

export const NaijaReel: React.FC<{ id: string }> = ({ id }) => {
  const b = industries.find((x: Industry) => x.id === id) as Industry;
  const o = offers.find((x) => x.id === b.offer)!;
  const f = useCurrentFrame();
  const out = interpolate(f, [NG_REEL - 10, NG_REEL], [1, 0.0], clamp);
  return (
    <AbsoluteFill style={{ background: brand.deep, opacity: out }}>
      <Fonts />
      <Art name={b.art} />
      <AbsoluteFill style={{ padding: '100px 76px 120px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand />
          <div style={{ fontFamily: MONO, fontSize: 22, color: brand.mutedOnDark, letterSpacing: 2 }}>WHAT WE CAN BUILD</div>
        </div>
        <div style={{ marginTop: 80 }}>
          <Kicker at={6}>
            {b.sector} · {b.place}
          </Kicker>
        </div>
        <div style={{ marginTop: 26 }}>
          <Headline text={b.hook} at={12} />
        </div>
      </AbsoluteFill>
      {/* Fixed positions, not flow: the lower block arrives in stages, and in a
          flex column each arrival pushed the screen up into the headline. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 690, display: 'flex', justifyContent: 'center', transform: `scale(${interpolate(f, [150, 185], [1, 0.78], clamp)})`, transformOrigin: 'top center' }}>
        <Screen id={b.id} at={70} />
      </div>
      <div style={{ position: 'absolute', left: 76, right: 76, bottom: 130, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <Sequence from={150} layout="none">
          <Typed text={b.line} at={0} />
        </Sequence>
        <Sequence from={225} layout="none">
          <div><PricePill name={o.name} price={o.price} at={0} /></div>
        </Sequence>
        <Sequence from={250} layout="none">
          <Cta at={0} />
        </Sequence>
      </div>
      <Label text={`Illustration. ${b.business} is a fictional example.`} />
      <Audio src={staticFile('audio/ng-bed.wav')} volume={(fr) => interpolate(fr, [0, 15, NG_REEL - 20, NG_REEL], [0, 0.7, 0.7, 0], clamp)} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Thirty seconds, all industries, what we are, how it works, prices.  */
/* ------------------------------------------------------------------ */

const Montage: React.FC = () => {
  const f = useCurrentFrame();
  const per = 40;
  const i = Math.min(industries.length - 1, Math.floor(f / per));
  const b = industries[i];
  const local = f - i * per;
  const flash = interpolate(local, [0, 4], [0.5, 0], clamp);
  return (
    <AbsoluteFill>
      <Art name={b.art} zoom={0.3} dim={0.35} />
      <AbsoluteFill style={{ padding: '240px 76px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <Kicker at={i * per}>{b.sector}</Kicker>
        </div>
        <div style={{ marginTop: 20, alignSelf: 'flex-start', fontFamily: SANS, fontWeight: 700, fontSize: 96, letterSpacing: -2.5, color: '#fff', lineHeight: 1 }}>
          {b.hook}
        </div>
        <div style={{ marginTop: 70, transform: `scale(${interpolate(local, [0, per], [0.94, 1.02])}) rotate(${interpolate(local, [0, per], [-3, 0])}deg)` }}>
          <Img src={staticFile(`ng-ui/${b.id}.png`)} style={{ width: 880, borderRadius: 40, filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.5))' }} />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 120, right: 76, fontFamily: MONO, fontSize: 30, color: brand.lime }}>
        {String(i + 1).padStart(2, '0')}/{String(industries.length).padStart(2, '0')}
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <Label text={`Illustration. ${b.business} is a fictional example.`} />
    </AbsoluteFill>
  );
};

const Backdrop = () => (
  <>
    <Art name="ng-backdrop-lime" zoom={0.15} dim={0.2} />
  </>
);

const Pillars: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    ['Get more customers', 'Pages, WhatsApp ordering, lead lists'],
    ['Run smoother inside', 'Bookings, stock, approvals, dashboards'],
    ['Know your numbers', 'Sales, orders and payments in one view'],
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: '200px 76px', display: 'flex', flexDirection: 'column' }}>
        <Kicker>Not just a website</Kicker>
        <div style={{ marginTop: 26 }}>
          <Headline text="A digital partner for the AI era" size={110} />
        </div>
        <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {items.map(([t, d], i) => {
            const s = spring({ frame: f - 30 - i * 12, fps, config: { damping: 16 } });
            return (
              <div
                key={t}
                style={{
                  padding: 38,
                  borderRadius: 32,
                  background: 'linear-gradient(120deg, rgba(23,91,59,.9), rgba(6,35,25,.9))',
                  border: '1.5px solid rgba(194,245,118,.3)',
                  opacity: s,
                  transform: `translateX(${(1 - s) * 200}px)`,
                  fontFamily: SANS,
                }}
              >
                <div style={{ fontSize: 54, fontWeight: 700, color: brand.lime }}>{t}</div>
                <div style={{ fontSize: 36, color: brand.onDark }}>{d}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 50, fontFamily: SANS, fontSize: 40, color: brand.onDark, opacity: interpolate(f, [80, 95], [0, 1], clamp) }}>
          AI does the busy work. <b style={{ color: brand.lime }}>You make the decisions.</b>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const steps = [
    ['Free call', '20 minutes on WhatsApp'],
    ['Best first step', 'We pick what to start with'],
    ['Fixed price build', 'Pay half to begin'],
    ['We keep it running', 'Support as you grow'],
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: '200px 76px', display: 'flex', flexDirection: 'column' }}>
        <Kicker>How it works</Kicker>
        <div style={{ marginTop: 26 }}>
          <Headline text="It starts with a free call" size={112} />
        </div>
        <div style={{ marginTop: 80, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 44, top: 44, bottom: 44, width: 6, background: 'rgba(194,245,118,.2)', borderRadius: 3 }}>
            <div style={{ height: `${interpolate(f, [20, 120], [0, 100], clamp)}%`, background: brand.lime, borderRadius: 3 }} />
          </div>
          {steps.map(([t, d], i) => {
            const s = spring({ frame: f - 20 - i * 25, fps, config: { damping: 14 } });
            return (
              <div key={t} style={{ display: 'flex', gap: 34, alignItems: 'center', marginBottom: 46, opacity: s, transform: `translateY(${(1 - s) * 40}px)`, fontFamily: SANS }}>
                <div style={{ width: 94, height: 94, borderRadius: 47, background: s > 0.5 ? brand.lime : brand.deep, border: `4px solid ${brand.lime}`, color: brand.deep, display: 'grid', placeItems: 'center', fontSize: 44, fontWeight: 800, position: 'relative' }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 54, fontWeight: 700, color: '#fff' }}>{t}</div>
                  <div style={{ fontSize: 36, color: brand.mutedOnDark }}>{d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PriceMenu: React.FC<{ list?: typeof offers; title?: string; ctaAt?: number }> = ({ list = offers, title = 'Start small. Grow from there', ctaAt = 70 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ padding: '140px 76px 130px', display: 'flex', flexDirection: 'column' }}>
        <Brand />
        <div style={{ marginTop: 60 }}>
          <Kicker>Simple prices · Naira</Kicker>
        </div>
        <div style={{ marginTop: 22 }}>
          <Headline text={title} size={100} />
        </div>
        <div style={{ marginTop: 40 }}>
          {list.map((o, i) => {
            const s = spring({ frame: f - 14 - i * 5, fps, config: { damping: 18 } });
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '22px 0', borderBottom: '1.5px solid rgba(194,245,118,.18)', opacity: s, transform: `translateX(${(1 - s) * -80}px)`, fontFamily: SANS }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 42, fontWeight: 650, color: '#fff' }}>{o.name}</div>
                  <div style={{ fontSize: 26, color: brand.mutedOnDark }}>{o.note}</div>
                </div>
                <div style={{ fontSize: 46, fontWeight: 800, whiteSpace: 'nowrap', color: o.price === 'Free' ? brand.deep : brand.lime, background: o.price === 'Free' ? brand.lime : 'transparent', padding: o.price === 'Free' ? '4px 20px' : 0, borderRadius: 14 }}>
                  {o.price}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <Cta at={ctaAt} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const NaijaOverview: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: brand.deep }}>
      <Fonts />
      <Sequence durationInFrames={96}>
        <AbsoluteFill>
          <Backdrop />
          <AbsoluteFill style={{ padding: '300px 76px', display: 'flex', flexDirection: 'column' }}>
            <Brand />
            <div style={{ marginTop: 90 }}>
              <Kicker at={4}>For Nigerian businesses</Kicker>
            </div>
            <div style={{ marginTop: 26 }}>
              <Headline text="We build tech that helps your business grow" at={10} size={122} />
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={96} durationInFrames={360}>
        <Montage />
      </Sequence>
      <Sequence from={456} durationInFrames={150}>
        <Pillars />
      </Sequence>
      <Sequence from={606} durationInFrames={144}>
        <Steps />
      </Sequence>
      <Sequence from={750} durationInFrames={150}>
        <PriceMenu list={offers.slice(0, 5)} ctaAt={50} />
      </Sequence>
      <AbsoluteFill style={{ background: brand.deep, opacity: interpolate(f, [890, 900], [0, 1], clamp), pointerEvents: 'none' }} />
      <Audio src={staticFile('audio/ng-bed.wav')} volume={(fr) => interpolate(fr, [0, 15, NG_OVERVIEW - 25, NG_OVERVIEW], [0, 0.75, 0.75, 0], clamp)} />
    </AbsoluteFill>
  );
};

export const NaijaOffers: React.FC = () => (
  <AbsoluteFill style={{ background: brand.deep }}>
    <Fonts />
    <PriceMenu ctaAt={80} />
    <Audio src={staticFile('audio/ng-bed.wav')} volume={(fr) => interpolate(fr, [0, 15, NG_OFFERS - 20, NG_OFFERS], [0, 0.7, 0.7, 0], clamp)} />
  </AbsoluteFill>
);

