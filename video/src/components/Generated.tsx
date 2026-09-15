import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import { brand, font } from '../brand';
import manifest from '../generated-manifest.json';

/**
 * A generated asset, on screen, honestly.
 *
 * Three things this does that a bare <Img> would not.
 *
 * It fails loudly. A missing asset renders a visible placeholder naming the key,
 * not a blank frame. A video that silently ships a black rectangle because
 * somebody forgot to run the generator is worse than one that does not render.
 *
 * It carries the label. An asset in assets.config.mjs that depicts a person or a
 * place has a `label`, and it is stamped on the frame. The site already says
 * "Fictional business example" under its own demonstrations; a generated shop
 * front in a marketing clip is the same promise, and it should not depend on
 * whoever assembles the composition remembering to add a caption.
 *
 * It reads from the manifest, so the file path and the provenance come from the
 * same record the generator wrote.
 */

type Entry = {
  file: string;
  kind: string;
  label: string | null;
};

const assets = manifest as Record<string, Entry>;

function Missing({ name }: { name: string }) {
  return (
    <AbsoluteFill
      style={{
        // Above whatever scrim the frame puts over a backdrop. A failure notice
        // that a scrim can hide is not a failure notice.
        zIndex: 20,
        background: '#2a1f14',
        color: '#f0c89a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        fontFamily: font.mono,
        fontSize: 28,
        lineHeight: 1.5,
        textAlign: 'center',
      }}
    >
      Missing generated asset
      <br />
      <strong style={{ fontSize: 34 }}>{name}</strong>
      <br />
      Run: node scripts/generate.mjs
    </AbsoluteFill>
  );
}

export function Generated({
  name,
  style,
  /** Set when the surrounding scene already states what the picture is. */
  hideLabel = false,
}: {
  name: string;
  style?: React.CSSProperties;
  hideLabel?: boolean;
}) {
  const entry = assets[name];
  if (!entry) return <Missing name={name} />;

  const source = staticFile(entry.file);
  const fill: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...style,
  };

  return (
    <AbsoluteFill>
      {entry.kind === 'video' ? (
        // OffthreadVideo rather than Video: it extracts the exact frame for the
        // timestamp being rendered instead of relying on a playing element, so a
        // render cannot land between frames.
        <OffthreadVideo src={source} style={fill} />
      ) : (
        <Img src={source} style={fill} />
      )}
      {entry.label && !hideLabel && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '18px 28px',
            background: 'linear-gradient(transparent, #06130cd0)',
            color: brand.onDark,
            fontFamily: font.mono,
            fontSize: 22,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {entry.label}
        </div>
      )}
    </AbsoluteFill>
  );
}
