export type MediaScene = {
  id: string;
  kind: 'presenter' | 'visual' | 'uploaded';
  narration: string;
  visual: string;
  seconds: number;
};

export type EpisodeInput = {
  title: string;
  topic: string;
  script: string;
  scenes: MediaScene[];
  sources: string[];
  aspectRatio: '9:16' | '16:9' | '1:1';
};

export function cleanEpisodeInput(value: unknown): EpisodeInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) return null;
  if (typeof body.topic !== 'string' || body.topic.length > 500) return null;
  if (typeof body.script !== 'string' || body.script.length > 12000) return null;
  if (body.aspectRatio !== '9:16' && body.aspectRatio !== '16:9' && body.aspectRatio !== '1:1') return null;
  if (!Array.isArray(body.scenes) || body.scenes.length > 20) return null;
  const scenes: MediaScene[] = [];
  for (const scene of body.scenes) {
    if (!scene || typeof scene !== 'object' || Array.isArray(scene)) return null;
    const item = scene as Record<string, unknown>;
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id)) return null;
    if (item.kind !== 'presenter' && item.kind !== 'visual' && item.kind !== 'uploaded') return null;
    if (typeof item.narration !== 'string' || item.narration.length > 2000) return null;
    if (typeof item.visual !== 'string' || item.visual.length > 1000) return null;
    if (typeof item.seconds !== 'number' || !Number.isInteger(item.seconds) || item.seconds < 1 || item.seconds > 300) return null;
    scenes.push({ id: item.id, kind: item.kind, narration: item.narration.trim(), visual: item.visual.trim(), seconds: item.seconds });
  }
  if (new Set(scenes.map((scene) => scene.id)).size !== scenes.length) return null;
  if (!Array.isArray(body.sources) || body.sources.length > 20) return null;
  const sources: string[] = [];
  for (const source of body.sources) {
    if (typeof source !== 'string' || source.length > 2000) return null;
    const trimmed = source.trim();
    if (!trimmed) continue;
    try {
      if (new URL(trimmed).protocol !== 'https:') return null;
    } catch {
      return null;
    }
    sources.push(trimmed);
  }
  return {
    title: body.title.trim(),
    topic: body.topic.trim(),
    script: body.script.trim(),
    scenes,
    sources,
    aspectRatio: body.aspectRatio,
  };
}
