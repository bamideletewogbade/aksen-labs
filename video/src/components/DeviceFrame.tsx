import React from 'react';
import { Img, staticFile, useCurrentFrame, interpolate } from 'remotion';
import { brand } from '../brand';

/**
 * A real screenshot of the real product, in a phone.
 *
 * The captures come from scripts/capture.mjs, which drives a headless browser
 * over the running site at phone width. So what is on screen in the film is the
 * product as it actually renders, not a mockup somebody drew of it, and when the
 * site changes the footage is one command away from being current again.
 *
 * It scrolls. A still screenshot of a web page reads as a picture of software;
 * the same image moving slowly reads as software being used. The scroll is a
 * plain linear translate rather than an eased one, because a phone being
 * scrolled by a thumb does not ease.
 */
export function DeviceFrame({
  capture,
  /** Fraction of the image scrolled past by the end of the shot. */
  scrollBy = 0.35,
  width = 560,
  tilt = 0,
}: {
  capture: string;
  scrollBy?: number;
  width?: number;
  tilt?: number;
}) {
  const frame = useCurrentFrame();
  const height = width * 2;
  const bezel = Math.round(width * 0.028);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: width * 0.11,
        padding: bezel,
        background: '#0d1a12',
        boxShadow: `0 ${width * 0.06}px ${width * 0.12}px rgba(6, 22, 14, 0.42)`,
        transform: `rotate(${tilt}deg)`,
        flex: '0 0 auto',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: width * 0.085,
          overflow: 'hidden',
          background: brand.paper,
          position: 'relative',
        }}
      >
        <Img
          src={staticFile(`captures/${capture}.png`)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            // Height is unset so the image keeps its own proportions and the
            // page can be taller than the screen, which is what makes the
            // scroll show anything.
            transform: `translateY(${interpolate(
              frame,
              [0, 150],
              [0, -scrollBy * height],
              { extrapolateRight: 'clamp' },
            )}px)`,
          }}
        />
      </div>
    </div>
  );
}
