import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { existsSync } from './footage';
import { brand, font, scale, type FormatName } from '../brand';

/**
 * The gap in the film where a real person goes.
 *
 * This is the one shot nothing here can generate, and that is on purpose rather
 * than a limitation being dressed up. A launch film for a company with no
 * customers yet could open with a generated shop owner saying the product
 * changed their business, and it would be the easiest frame in advertising and
 * the only outright lie in the edit. Aksen has not got that customer. The rest
 * of the film is careful about this: the demos say "fictional business", the
 * illustrations carry a label.
 *
 * So the film leaves a hole the founder fills by talking to a camera for fifteen
 * seconds. OBS is configured for exactly that shot, and dropping the file into
 * public/footage/founder.mp4 puts it in the edit. Until then this renders a
 * slate saying what is missing and how long it needs to be, which is a thing you
 * can send to whoever is recording it.
 */
export function HumanSlot({
  format,
  file = 'founder',
}: {
  format: FormatName;
  file?: string;
}) {
  const frame = useCurrentFrame();
  const recorded = existsSync(file);

  if (recorded)
    return (
      <AbsoluteFill style={{ background: '#050d08' }}>
        <OffthreadVideo
          src={staticFile(`footage/${file}.mp4`)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted={false}
        />
      </AbsoluteFill>
    );

  return (
    <AbsoluteFill
      style={{
        background: '#141a16',
        alignItems: 'center',
        justifyContent: 'center',
        padding: scale[format].gutter,
        textAlign: 'center',
      }}
    >
      {/* A slate, not an error. This shot is meant to be missing until somebody
          records it, so it reads as a production note rather than a failure. */}
      <div
        style={{
          border: `2px dashed ${brand.lime}66`,
          borderRadius: 20,
          padding: '48px 40px',
          maxWidth: '90%',
        }}
      >
        <div
          style={{
            fontFamily: font.mono,
            fontSize: scale[format].kicker * 0.85,
            letterSpacing: '0.16em',
            color: brand.lime,
            marginBottom: 26,
          }}
        >
          SHOT 03 / TO CAMERA
        </div>
        <div
          style={{
            fontFamily: font.sans,
            fontSize: scale[format].headline * 0.38,
            fontWeight: 560,
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            color: brand.onDark,
          }}
        >
          Fifteen seconds,
          <br />
          you to the camera.
        </div>
        <div
          style={{
            fontFamily: font.sans,
            fontSize: scale[format].body * 0.78,
            lineHeight: 1.6,
            color: brand.mutedOnDark,
            marginTop: 24,
          }}
        >
          Say who this is for and what you built.
          <br />
          Record it in OBS with the Aksen Labs scenes,
          <br />
          save it as public/footage/founder.mp4
        </div>
        {/* A blink, so nobody mistakes the slate for a frozen render. */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#e2704f',
            margin: '30px auto 0',
            opacity: Math.sin(frame / 7) > 0 ? 1 : 0.25,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
