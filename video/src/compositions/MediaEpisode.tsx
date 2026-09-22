import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { brand, font, fps, type FormatName } from '../brand';
import { Captions } from '../components/Captions';

export type EpisodeScene = { id: string; seconds: number; narration: string; visual: string; assetPath: string; background?: { kind: 'preset'; value: 'deep' | 'lime' | 'paper' } | { kind: 'image' }; backgroundPath?: string; fit?: 'cover' | 'contain'; transition?: 'cut' | 'fade' };
export type EpisodeManifest = { title: string; aspectRatio: '9:16' | '16:9' | '1:1'; scenes: EpisodeScene[]; voicePath?: string };
const BACKGROUNDS = { deep: brand.deep, lime: brand.lime, paper: brand.paper } as const;

function EpisodeShot({ scene, title, index, count, format, durationInFrames }: { scene: EpisodeScene; title: string; index: number; count: number; format: FormatName; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const preset = scene.background?.kind === 'preset' ? scene.background.value : 'deep';
  const background = BACKGROUNDS[preset];
  const light = scene.background?.kind === 'preset' && scene.background.value !== 'deep';
  const src = scene.assetPath ? staticFile(scene.assetPath) : '';
  const video = /\.(mp4|webm)$/i.test(scene.assetPath);
  const contained = scene.fit === 'contain';
  const mediaStyle: React.CSSProperties = contained
    ? { width: '84%', height: '78%', objectFit: 'contain', borderRadius: 24, boxShadow: '0 24px 80px #0007' }
    : { width: '100%', height: '100%', objectFit: 'cover' };
  const opacity = scene.transition === 'fade'
    ? interpolate(frame, [0, Math.min(12, durationInFrames - 1)], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  return <AbsoluteFill style={{ backgroundColor: background, opacity }}>
    {scene.backgroundPath && <Img src={staticFile(scene.backgroundPath)} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />}
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {src ? video ? <OffthreadVideo src={src} muted style={mediaStyle} /> : <Img src={src} style={mediaStyle} />
        : <div style={{ padding: 100, color: light ? brand.ink : brand.onDark, fontFamily: font.sans, fontSize: 60, textAlign: 'center' }}>{scene.visual}</div>}
    </AbsoluteFill>
    <div style={{ position: 'absolute', top: format === 'vertical' ? 96 : 50, left: 70, right: 70, color: light && !scene.backgroundPath && contained ? brand.ink : brand.onDark, fontFamily: font.sans, fontSize: format === 'vertical' ? 34 : 28, textShadow: light && !scene.backgroundPath && contained ? 'none' : '0 2px 12px #000', display: 'flex', justifyContent: 'space-between', gap: 30 }}><span>{title}</span><span>{String(index + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}</span></div>
    <Captions format={format} lines={[{ from: 0, durationInFrames, text: scene.narration }]} />
  </AbsoluteFill>;
}

export function MediaEpisode({ episode }: { episode: EpisodeManifest }) {
  const format: FormatName = episode.aspectRatio === '16:9' ? 'wide' : episode.aspectRatio === '1:1' ? 'square' : 'vertical';
  let cursor = 0;
  return <AbsoluteFill style={{ backgroundColor: brand.deep }}>
    {episode.voicePath && <Audio src={staticFile(episode.voicePath)} />}
    {episode.scenes.map((scene, index) => {
      const from = cursor;
      const durationInFrames = Math.round(scene.seconds * fps);
      cursor += durationInFrames;
      return <Sequence key={scene.id} from={from} durationInFrames={durationInFrames}>
        <EpisodeShot scene={scene} title={episode.title} index={index} count={episode.scenes.length} format={format} durationInFrames={durationInFrames} />
      </Sequence>;
    })}
  </AbsoluteFill>;
}
