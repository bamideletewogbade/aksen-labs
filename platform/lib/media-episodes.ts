export type MediaScene = {
  id: string;
  kind: 'presenter' | 'visual' | 'uploaded';
  narration: string;
  visual: string;
  seconds: number;
  asset?: { kind: 'image' | 'video-job'; id: string };
  background?: { kind: 'preset'; value: 'deep' | 'lime' | 'paper' } | { kind: 'image'; id: string };
  fit?: 'cover' | 'contain';
  transition?: 'cut' | 'fade';
};

export type Channel = 'linkedin' | 'instagram' | 'tiktok' | 'youtube';
export type ChannelPost = { caption: string; title: string };
export type ProofCheck = { id: string; question: string; evidenceUrl: string; status: 'open' | 'verified' | 'illustrative' };

export type EpisodeInput = {
  originEvaluationId?: string;
  title: string;
  topic: string;
  script: string;
  scenes: MediaScene[];
  sources: string[];
  aspectRatio: '9:16' | '16:9' | '1:1';
  channelPosts: Partial<Record<Channel, ChannelPost>>;
  proofChecks: ProofCheck[];
};

export const CHANNELS: Channel[] = ['linkedin', 'instagram', 'tiktok', 'youtube'];

export function episodeDuration(scenes: MediaScene[]) {
  return scenes.reduce((total, scene) => total + scene.seconds, 0);
}

export function sceneCueSheet(scenes: MediaScene[]) {
  let start = 0;
  return scenes.map((scene) => {
    const cue = { sceneId: scene.id, start, end: start + scene.seconds, narration: scene.narration, visual: scene.visual, asset: scene.asset || null, background: scene.background || { kind: 'preset', value: 'deep' }, fit: scene.fit || 'cover', transition: scene.transition || 'cut' };
    start = cue.end;
    return cue;
  });
}

export function cleanEpisodeInput(value: unknown): EpisodeInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) return null;
  if (typeof body.topic !== 'string' || body.topic.length > 500) return null;
  if (typeof body.script !== 'string' || body.script.length > 12000) return null;
  if (body.aspectRatio !== '9:16' && body.aspectRatio !== '16:9' && body.aspectRatio !== '1:1') return null;
  if (body.originEvaluationId != null && (typeof body.originEvaluationId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.originEvaluationId))) return null;
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
    let asset: MediaScene['asset'];
    if (item.asset != null) {
      if (!item.asset || typeof item.asset !== 'object' || Array.isArray(item.asset)) return null;
      const selected = item.asset as Record<string, unknown>;
      if (selected.kind !== 'image' && selected.kind !== 'video-job') return null;
      if (typeof selected.id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(selected.id)) return null;
      asset = { kind: selected.kind, id: selected.id };
    }
    let background: MediaScene['background'];
    if (item.background != null) {
      if (!item.background || typeof item.background !== 'object' || Array.isArray(item.background)) return null;
      const selected = item.background as Record<string, unknown>;
      if (selected.kind === 'preset' && (selected.value === 'deep' || selected.value === 'lime' || selected.value === 'paper')) background = { kind: 'preset', value: selected.value };
      else if (selected.kind === 'image' && typeof selected.id === 'string' && /^[a-zA-Z0-9_-]{1,150}$/.test(selected.id)) background = { kind: 'image', id: selected.id };
      else return null;
    }
    if (item.fit != null && item.fit !== 'cover' && item.fit !== 'contain') return null;
    if (item.transition != null && item.transition !== 'cut' && item.transition !== 'fade') return null;
    scenes.push({ id: item.id, kind: item.kind, narration: item.narration.trim(), visual: item.visual.trim(), seconds: item.seconds, ...(asset ? { asset } : {}), ...(background ? { background } : {}), ...(item.fit ? { fit: item.fit as MediaScene['fit'] } : {}), ...(item.transition ? { transition: item.transition as MediaScene['transition'] } : {}) });
  }
  if (new Set(scenes.map((scene) => scene.id)).size !== scenes.length) return null;
  if (episodeDuration(scenes) > 1800) return null;
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
  if (!body.channelPosts || typeof body.channelPosts !== 'object' || Array.isArray(body.channelPosts)) return null;
  const rawPosts = body.channelPosts as Record<string, unknown>;
  if (Object.keys(rawPosts).some((key) => !CHANNELS.includes(key as Channel))) return null;
  const channelPosts: EpisodeInput['channelPosts'] = {};
  for (const channel of CHANNELS) {
    const post = rawPosts[channel];
    if (post == null) continue;
    if (!post || typeof post !== 'object' || Array.isArray(post)) return null;
    const fields = post as Record<string, unknown>;
    if (typeof fields.caption !== 'string' || fields.caption.length > 3000 || typeof fields.title !== 'string' || fields.title.length > 120) return null;
    channelPosts[channel] = { caption: fields.caption.trim(), title: fields.title.trim() };
  }
  if (!Array.isArray(body.proofChecks) || body.proofChecks.length > 20) return null;
  const proofChecks: ProofCheck[] = [];
  for (const entry of body.proofChecks) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id)) return null;
    if (typeof item.question !== 'string' || !item.question.trim() || item.question.length > 500) return null;
    if (typeof item.evidenceUrl !== 'string' || item.evidenceUrl.length > 2000) return null;
    if (item.status !== 'open' && item.status !== 'verified' && item.status !== 'illustrative') return null;
    const evidenceUrl = item.evidenceUrl.trim();
    if (evidenceUrl) {
      try { if (new URL(evidenceUrl).protocol !== 'https:') return null; } catch { return null; }
    }
    if (item.status === 'verified' && !evidenceUrl) return null;
    proofChecks.push({ id: item.id, question: item.question.trim(), evidenceUrl, status: item.status });
  }
  if (new Set(proofChecks.map((item) => item.id)).size !== proofChecks.length) return null;
  return {
    ...(typeof body.originEvaluationId === 'string' ? { originEvaluationId: body.originEvaluationId } : {}),
    title: body.title.trim(),
    topic: body.topic.trim(),
    script: body.script.trim(),
    scenes,
    sources,
    aspectRatio: body.aspectRatio,
    channelPosts,
    proofChecks,
  };
}
