export type VideoReference = {
  id: string;
  url: string;
  title: string;
  channel: string;
  description: string;
  metadataSource: 'youtube-api' | 'user';
};

export type InspirationAngle = {
  id: 'angle_1' | 'angle_2' | 'angle_3';
  title: string;
  hook: string;
  ownAngle: string;
  businessExample: string;
  sourceConnection: string;
  proofNeeded: string;
};

export type InspirationScript = {
  script: string;
  scenes: Array<{ kind: 'presenter' | 'visual'; seconds: number; narration: string; visual: string }>;
};

export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.split('/')[1] || '';
    else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      const [route, segment] = url.pathname.split('/').filter(Boolean);
      id = route === 'watch' ? url.searchParams.get('v') || '' : ['shorts', 'live', 'embed'].includes(route) ? segment || '' : '';
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function cleanAngles(value: unknown): InspirationAngle[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>).angles;
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const angles = raw.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const data = entry as Record<string, unknown>;
    const angle: InspirationAngle = {
      id: `angle_${index + 1}` as InspirationAngle['id'],
      title: clean(data.title, 120), hook: clean(data.hook, 250),
      ownAngle: clean(data.ownAngle, 600), businessExample: clean(data.businessExample, 600),
      sourceConnection: clean(data.sourceConnection, 400), proofNeeded: clean(data.proofNeeded, 400),
    };
    return Object.values(angle).every(Boolean) ? angle : null;
  });
  return angles.every(Boolean) ? angles as InspirationAngle[] : null;
}

export function cleanScript(value: unknown): InspirationScript | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const script = clean(data.script, 12000);
  if (!script || !Array.isArray(data.scenes) || data.scenes.length < 2 || data.scenes.length > 8) return null;
  const scenes = data.scenes.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const scene = entry as Record<string, unknown>;
    if (scene.kind !== 'presenter' && scene.kind !== 'visual') return null;
    if (typeof scene.seconds !== 'number' || !Number.isInteger(scene.seconds) || scene.seconds < 2 || scene.seconds > 45) return null;
    const narration = clean(scene.narration, 2000);
    const visual = clean(scene.visual, 1000);
    if (!narration || !visual) return null;
    return { kind: scene.kind, seconds: scene.seconds, narration, visual };
  });
  if (scenes.some((scene) => !scene)) return null;
  const duration = scenes.reduce((sum, scene) => sum + scene!.seconds, 0);
  if (duration < 40 || duration > 100) return null;
  return { script, scenes: scenes as InspirationScript['scenes'] };
}
