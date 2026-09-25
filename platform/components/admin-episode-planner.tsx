'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  Download,
  FilePenLine,
  HelpCircle,
  Lightbulb,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import {
  CHANNELS,
  episodeDuration,
  sceneCueSheet,
  type Channel,
  type EpisodeInput,
  type MediaScene,
  type ProofCheck,
} from '@/lib/media-episodes';
import { ConfirmAction } from '@/components/ui/confirm-action';
import type { InspirationAngle, InspirationScript, VideoReference } from '@/lib/media-inspiration';
import { strToU8, zipSync } from 'fflate';

export type InspiredDraftInput = {
  reference: VideoReference;
  angle: InspirationAngle;
  draft: InspirationScript;
  evaluationId?: string;
};

type SavedEpisode = EpisodeInput & { id: string; status: string; updatedAt: string };
type Asset = { id: string; kind: string; url: string; prompt: string };
type Job = { id: string; status: string; prompt: string };
const BACKGROUNDS = { deep: '#062319', lime: '#c2f576', paper: '#f9faf7' } as const;

function mediaDuration(file: Blob, kind: 'audio' | 'video'): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(kind);
    const cleanup = () => { media.removeAttribute('src'); media.load(); URL.revokeObjectURL(url); };
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      const duration = media.duration;
      cleanup();
      if (Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error('Could not read media duration.'));
    };
    media.onerror = () => { cleanup(); reject(new Error('Could not read media duration.')); };
    media.src = url;
  });
}

const firstScript = `When people say “AI model,” what are they actually talking about?

Think of a model as the part of an AI system that learned patterns from examples. You give it an input, and it produces an output. Give one model speech, and it may return a transcript. Give another a prompt, and it may create an image. Give a language model a question, and it produces a response.

But the model is only one part of a useful product. Say a business wants help answering customer questions. It also needs current business information, rules about what the AI may answer, and a way to pass uncertain questions to a person.

So when you hear that a new model is “better,” ask: better at which task, at what cost, and with what checks? That question is much more useful than a leaderboard on its own.

I'm the founder of Aksen Labs. Follow along, and we'll make these ideas practical, one minute at a time.`;

function firstEpisode(): EpisodeInput {
  return {
    title: 'What is an AI model?',
    topic: 'Explain the role of a model in a useful AI product.',
    script: firstScript,
    aspectRatio: '9:16',
    sources: [],
    channelPosts: {},
    proofChecks: [],
    scenes: [
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 7, narration: 'When people say “AI model,” what are they actually talking about?', visual: 'Founder to camera; direct opening question.' },
      { id: crypto.randomUUID(), kind: 'visual', seconds: 22, narration: 'Think of a model as the part of an AI system that learned patterns from examples...', visual: 'Input → model → output; speech transcript, image, and question examples.' },
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 21, narration: 'But the model is only one part of a useful product...', visual: 'Founder with a clearly illustrative customer-question and human handoff graphic.' },
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 20, narration: 'So when you hear that a new model is “better”...', visual: 'Founder closes with three on-screen questions and Aksen Labs identifier.' },
    ],
  };
}

function blankEpisode(): EpisodeInput {
  return { title: '', topic: '', script: '', aspectRatio: '9:16', sources: [], scenes: [], channelPosts: {}, proofChecks: [] };
}

export function AdminEpisodePlanner({
  externalDraft,
  onNavigateTab,
}: {
  externalDraft?: InspiredDraftInput | null;
  onNavigateTab?: (tabId: string) => void;
} = {}) {
  const [episodes, setEpisodes] = useState<SavedEpisode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EpisodeInput>(blankEpisode);
  const [sourcesText, setSourcesText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [storageReady, setStorageReady] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviewStatus, setReviewStatus] = useState('draft');
  const [activeScene, setActiveScene] = useState(0);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [voiceMode, setVoiceMode] = useState<'voiceover' | 'silent'>('voiceover');
  const [activeChannel, setActiveChannel] = useState<Channel>('linkedin');
  const [metaSection, setMetaSection] = useState<'channels' | 'proof' | 'sources'>('channels');

  const lastExternalDraftRef = useRef<InspiredDraftInput | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/admin/media/episodes').then(async (response) => {
      const data = await response.json() as { episodes?: SavedEpisode[]; error?: string };
      if (!live) return;
      if (!response.ok) { setStorageReady(false); setError(data.error || 'Could not load episodes.'); return; }
      setEpisodes(data.episodes || []);
    }).catch(() => { if (live) setError('Could not load episodes.'); });
    return () => { live = false; };
  }, []);

  async function refreshAssets() {
    try {
      const [gallery, renders] = await Promise.all([
        fetch('/api/admin/media/save').then((response) => response.json()) as Promise<{ assets?: Asset[] }>,
        fetch('/api/admin/media/video/jobs').then((response) => response.json()) as Promise<{ jobs?: Job[] }>,
      ]);
      setAssets((gallery.assets || []).filter((asset) => asset.kind === 'image'));
      setJobs((renders.jobs || []).filter((job) => job.status === 'completed'));
      setMessage('Available media assets refreshed.');
    } catch {
      setError('Could not refresh available media.');
    }
  }

  useEffect(() => {
    void Promise.all([
      fetch('/api/admin/media/save').then((response) => response.json()) as Promise<{ assets?: Asset[] }>,
      fetch('/api/admin/media/video/jobs').then((response) => response.json()) as Promise<{ jobs?: Job[] }>,
    ]).then(([gallery, renders]) => {
      setAssets((gallery.assets || []).filter((asset) => asset.kind === 'image'));
      setJobs((renders.jobs || []).filter((job) => job.status === 'completed'));
    }).catch(() => null);
  }, []);

  function loadExternal(input: InspiredDraftInput) {
    setVoiceFile(null);
    setSelectedId(null);
    setReviewStatus('draft');
    setActiveScene(0);
    setSourcesText(input.reference.url);
    setDraft({
      ...(input.evaluationId ? { originEvaluationId: input.evaluationId } : {}),
      title: input.angle.title,
      topic: input.angle.ownAngle.slice(0, 500),
      script: input.draft.script,
      sources: [input.reference.url],
      aspectRatio: '9:16',
      channelPosts: {},
      proofChecks: [{ id: crypto.randomUUID(), question: input.angle.proofNeeded, evidenceUrl: '', status: 'open' }],
      scenes: input.draft.scenes.map((scene) => ({ ...scene, id: crypto.randomUUID() })),
    });
    setError('');
    setMessage('Loaded draft from Idea Lab. Review wording and scenes, then save.');
  }

  useEffect(() => {
    if (externalDraft && externalDraft !== lastExternalDraftRef.current) {
      lastExternalDraftRef.current = externalDraft;
      loadExternal(externalDraft);
    }
  }, [externalDraft]);

  function choose(episode: SavedEpisode) {
    setVoiceFile(null);
    setSelectedId(episode.id);
    setDraft({
      title: episode.title,
      topic: episode.topic,
      script: episode.script,
      originEvaluationId: episode.originEvaluationId,
      scenes: Array.isArray(episode.scenes) ? episode.scenes : [],
      sources: Array.isArray(episode.sources) ? episode.sources : [],
      channelPosts: episode.channelPosts || {},
      proofChecks: Array.isArray(episode.proofChecks) ? episode.proofChecks : [],
      aspectRatio: episode.aspectRatio,
    });
    setReviewStatus(episode.status);
    setActiveScene(0);
    setSourcesText((episode.sources || []).join('\n'));
    setMessage('');
    setError('');
  }

  function start(input: EpisodeInput) {
    setVoiceFile(null);
    setSelectedId(null);
    setDraft(input);
    setSourcesText(input.sources.join('\n'));
    setReviewStatus('draft');
    setActiveScene(0);
    setMessage('');
    setError('');
  }

  function changeScene(id: string, change: Partial<MediaScene>) {
    setDraft((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => scene.id === id ? { ...scene, ...change } : scene),
    }));
  }

  function moveScene(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= draft.scenes.length) return;
    const scenes = [...draft.scenes];
    [scenes[index], scenes[next]] = [scenes[next], scenes[index]];
    setDraft({ ...draft, scenes });
    setActiveScene(next);
  }

  function changeProof(id: string, change: Partial<ProofCheck>) {
    setDraft((current) => ({
      ...current,
      proofChecks: current.proofChecks.map((check) => check.id === id ? { ...check, ...change } : check),
    }));
  }

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    const payload = {
      ...draft,
      id: selectedId,
      sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean),
    };
    try {
      const response = await fetch('/api/admin/media/episodes', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { episode?: SavedEpisode; error?: string };
      if (!response.ok || !data.episode) throw new Error(data.error || 'Could not save the episode.');
      const saved = data.episode;
      setSelectedId(saved.id);
      setReviewStatus(saved.status);
      setEpisodes((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setMessage('Draft saved successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the episode.');
    } finally {
      setBusy(false);
    }
  }

  async function review(action: 'submit' | 'approve' | 'reopen') {
    if (!selectedId) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const currentDraft = {
        ...draft,
        sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean),
      };
      const response = await fetch('/api/admin/media/episodes/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selectedId, action, currentDraft }),
      });
      const data = await response.json() as { episode?: SavedEpisode; error?: string; blockers?: string[] };
      if (!response.ok || !data.episode) throw new Error(data.blockers?.join(' ') || data.error || 'Review failed.');
      setReviewStatus(data.episode.status);
      setEpisodes((current) => [data.episode!, ...current.filter((item) => item.id !== selectedId)]);
      setMessage(
        action === 'approve'
          ? 'Episode approved for export preparation.'
          : action === 'submit'
            ? 'Episode sent to review.'
            : 'Episode reopened as draft.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review failed.');
    } finally {
      setBusy(false);
    }
  }

  function downloadPlan() {
    const cues = sceneCueSheet(draft.scenes);
    const payload = {
      version: 1,
      episodeId: selectedId,
      originEvaluationId: draft.originEvaluationId,
      title: draft.title,
      aspectRatio: draft.aspectRatio,
      durationSeconds: episodeDuration(draft.scenes),
      script: draft.script,
      sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean),
      channelPosts: draft.channelPosts,
      proofChecks: draft.proofChecks,
      scenes: cues,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aksen-episode-${selectedId || 'draft'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadRenderKit() {
    if (!selectedId || reviewStatus !== 'approved') {
      setError('Approve and save this episode before exporting a render kit.');
      return;
    }
    const saved = episodes.find((episode) => episode.id === selectedId);
    const currentDraft = {
      ...draft,
      sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean),
    };
    if (
      !saved ||
      JSON.stringify([
        currentDraft.title,
        currentDraft.topic,
        currentDraft.script,
        currentDraft.scenes,
        currentDraft.sources,
        currentDraft.aspectRatio,
        currentDraft.channelPosts,
        currentDraft.proofChecks,
        currentDraft.originEvaluationId,
      ]) !==
        JSON.stringify([
          saved.title,
          saved.topic,
          saved.script,
          saved.scenes,
          saved.sources,
          saved.aspectRatio,
          saved.channelPosts,
          saved.proofChecks,
          saved.originEvaluationId,
        ])
    ) {
      setError('Save and approve the latest episode changes before exporting.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('Collecting reviewed scene media...');
    try {
      const files: Record<string, Uint8Array> = {};
      const scenes = [];
      let totalBytes = 0;
      let voicePath = '';
      if (voiceMode === 'voiceover') {
        if (!voiceFile) throw new Error('Choose your recorded voiceover file, or select silent draft.');
        const extension = /\.(wav|mp3)$/i.exec(voiceFile.name)?.[1]?.toLowerCase();
        if (!extension) throw new Error('Voiceover must be a WAV or MP3 file.');
        const duration = await mediaDuration(voiceFile, 'audio');
        const planned = episodeDuration(draft.scenes);
        if (Math.abs(duration - planned) > 1) {
          throw new Error(`Voiceover is ${duration.toFixed(1)}s, but scene plan is ${planned}s. Match within 1 second.`);
        }
        voicePath = `episodes/${selectedId}/voice.${extension}`;
        files[voicePath] = new Uint8Array(await voiceFile.arrayBuffer());
        totalBytes += files[voicePath].byteLength;
      }
      for (const scene of draft.scenes) {
        if (!scene.asset) throw new Error(`Scene ${scenes.length + 1} needs media assigned.`);
        const url = scene.asset.kind === 'image'
          ? assets.find((asset) => asset.id === scene.asset?.id)?.url
          : `/api/admin/media/video/content?id=${encodeURIComponent(scene.asset.id)}`;
        if (!url) throw new Error(`Scene ${scenes.length + 1} media is unavailable. Refresh media list.`);
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Could not fetch media for scene ${scenes.length + 1}.`);
        const contentType = response.headers.get('content-type') || '';
        const extension = scene.asset.kind === 'video-job' ? 'mp4' : contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : '';
        if (!extension) throw new Error(`Scene ${scenes.length + 1} has an unsupported format.`);
        const path = `episodes/${selectedId}/${scene.id}.${extension}`;
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (extension === 'mp4') {
          const duration = await mediaDuration(new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }), 'video');
          if (duration + 0.1 < scene.seconds) throw new Error(`Scene ${scenes.length + 1} video clip (${duration.toFixed(1)}s) is shorter than scene duration (${scene.seconds}s).`);
        }
        totalBytes += bytes.byteLength;
        if (totalBytes > 150_000_000) throw new Error('Kit exceeds 150 MB export limit.');
        files[path] = bytes;
        let backgroundPath = '';
        if (scene.background?.kind === 'image') {
          const selected = assets.find((asset) => asset.id === (scene.background?.kind === 'image' ? scene.background.id : ''));
          if (!selected) throw new Error(`Scene ${scenes.length + 1} background image unavailable.`);
          const backgroundResponse = await fetch(selected.url, { credentials: 'same-origin' });
          if (!backgroundResponse.ok) throw new Error(`Could not download scene ${scenes.length + 1} background.`);
          const backgroundType = backgroundResponse.headers.get('content-type') || '';
          const backgroundExtension = backgroundType.includes('jpeg') ? 'jpg' : backgroundType.includes('png') ? 'png' : '';
          if (!backgroundExtension) throw new Error(`Scene ${scenes.length + 1} background has unsupported format.`);
          backgroundPath = `episodes/${selectedId}/${scene.id}-background.${backgroundExtension}`;
          const backgroundBytes = new Uint8Array(await backgroundResponse.arrayBuffer());
          totalBytes += backgroundBytes.byteLength;
          if (totalBytes > 150_000_000) throw new Error('Kit exceeds 150 MB export limit.');
          files[backgroundPath] = backgroundBytes;
        }
        scenes.push({
          id: scene.id,
          seconds: scene.seconds,
          narration: scene.narration,
          visual: scene.visual,
          assetPath: path,
          background: scene.background || { kind: 'preset', value: 'deep' },
          backgroundPath,
          fit: scene.fit || 'cover',
          transition: scene.transition || 'cut',
        });
      }
      files['episode.json'] = strToU8(JSON.stringify({
        version: 1,
        episodeId: selectedId,
        title: draft.title,
        aspectRatio: draft.aspectRatio,
        scenes,
        voicePath,
        channelPosts: draft.channelPosts,
        sources: draft.sources,
      }, null, 2));
      const archive = zipSync(files, { level: 0 });
      const blob = new Blob([new Uint8Array(archive)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aksen-render-${selectedId}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setMessage(`Render kit downloaded (${voicePath ? 'voiceover included' : 'silent'}).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare render kit.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selectedId || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/media/episodes', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: selectedId }),
      });
      if (!response.ok) throw new Error('Could not remove the draft.');
      setEpisodes((current) => current.filter((item) => item.id !== selectedId));
      start(blankEpisode());
      setMessage('Draft removed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove draft.');
    } finally {
      setBusy(false);
    }
  }

  const words = draft.script.trim() ? draft.script.trim().split(/\s+/).length : 0;
  const scriptEstSeconds = Math.round(words / 2.5);
  const plannedSeconds = episodeDuration(draft.scenes);
  const previewScene = draft.scenes[activeScene] || draft.scenes[0];
  const previewAsset = previewScene?.asset?.kind === 'image' ? assets.find((asset) => asset.id === previewScene.asset?.id) : null;
  const previewBackground = previewScene?.background?.kind === 'image' ? assets.find((asset) => asset.id === (previewScene.background?.kind === 'image' ? previewScene.background.id : '')) : null;

  return (
    <section className="admin-panel episode-planner-v2">
      {/* Top Bar: Saved Episodes & Fast Switcher */}
      <div className="planner-topbar">
        <div className="planner-episodes-strip">
          <span className="planner-strip-label">Episodes:</span>
          {episodes.length === 0 ? (
            <span className="planner-strip-empty">No saved episodes yet</span>
          ) : (
            <div className="planner-strip-chips">
              {episodes.map((episode) => (
                <button
                  type="button"
                  key={episode.id}
                  className={`planner-episode-chip ${selectedId === episode.id ? 'active' : ''}`}
                  onClick={() => choose(episode)}
                  title={episode.title}
                >
                  <span className="chip-title">{episode.title || 'Untitled'}</span>
                  <span className={`chip-badge status-${episode.status}`}>{episode.status.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="planner-quick-actions">
          <button
            type="button"
            className="planner-action-btn"
            onClick={() => start(blankEpisode())}
          >
            <Plus size={14} /> New
          </button>
          <button
            type="button"
            className="planner-action-btn secondary"
            onClick={() => start(firstEpisode())}
          >
            Template
          </button>
          {onNavigateTab && (
            <button
              type="button"
              className="planner-action-btn idea-btn"
              onClick={() => onNavigateTab('inspiration')}
              title="Find ideas from a YouTube link"
            >
              <Lightbulb size={14} /> Idea Lab &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Main Story & Core Information */}
      <div className="planner-story-core">
        <div className="planner-core-row">
          <label className="planner-title-field">
            <span>Episode title</span>
            <input
              value={draft.title}
              maxLength={120}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="e.g. What is an AI model?"
            />
          </label>
          <label className="planner-ratio-field">
            <span>Aspect ratio</span>
            <select
              value={draft.aspectRatio}
              onChange={(event) => setDraft({ ...draft, aspectRatio: event.target.value as EpisodeInput['aspectRatio'] })}
            >
              <option value="9:16">9:16 Vertical (Shorts/Reels)</option>
              <option value="16:9">16:9 Landscape (YouTube)</option>
              <option value="1:1">1:1 Square (Feed)</option>
            </select>
          </label>
        </div>

        <div className="planner-core-row">
          <label className="planner-topic-field">
            <span>Core takeaway or purpose</span>
            <input
              value={draft.topic}
              maxLength={500}
              onChange={(event) => setDraft({ ...draft, topic: event.target.value })}
              placeholder="The single core concept viewers should understand"
            />
          </label>
        </div>

        <div className="planner-script-box">
          <div className="planner-script-head">
            <label htmlFor="episode-spoken-script">Final spoken script</label>
            <div className="planner-timing-badges">
              <span className="timing-pill">
                <Clock size={12} /> {words} words · ~{scriptEstSeconds}s speech
              </span>
              <span className={`timing-pill ${Math.abs(scriptEstSeconds - plannedSeconds) > 5 && plannedSeconds > 0 ? 'timing-warn' : ''}`}>
                {plannedSeconds}s across {draft.scenes.length} scene{draft.scenes.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <textarea
            id="episode-spoken-script"
            className="episode-script"
            value={draft.script}
            maxLength={12000}
            rows={5}
            onChange={(event) => setDraft({ ...draft, script: event.target.value })}
            placeholder="Write the exact words spoken by the presenter or narrator..."
          />
        </div>
      </div>

      {/* Two-Column Split Canvas: Scenes List & Live Storyboard Preview */}
      <div className="planner-split-canvas">
        {/* Left: Scenes Editor */}
        <div className="planner-scenes-column">
          <div className="planner-section-header">
            <div>
              <h3>Scene plan</h3>
              <small>{draft.scenes.length} scene{draft.scenes.length === 1 ? '' : 's'} · {plannedSeconds}s total</small>
            </div>
            <div className="planner-scene-ctrls">
              <button
                type="button"
                className="planner-tool-btn"
                onClick={() => void refreshAssets()}
                title="Refresh media list"
              >
                <RefreshCw size={13} /> Refresh media
              </button>
              <button
                type="button"
                className="planner-add-scene-btn"
                disabled={draft.scenes.length >= 20}
                onClick={() => {
                  const newId = crypto.randomUUID();
                  setDraft({
                    ...draft,
                    scenes: [
                      ...draft.scenes,
                      { id: newId, kind: 'presenter', narration: '', visual: '', seconds: 8 },
                    ],
                  });
                  setActiveScene(draft.scenes.length);
                }}
              >
                <Plus size={14} /> Add scene
              </button>
            </div>
          </div>

          <div className="planner-scenes-list">
            {draft.scenes.length === 0 ? (
              <div className="planner-no-scenes">
                <p>No scenes added yet.</p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      scenes: [{ id: crypto.randomUUID(), kind: 'presenter', narration: '', visual: '', seconds: 8 }],
                    })
                  }
                >
                  <Plus size={14} /> Add first scene
                </button>
              </div>
            ) : (
              draft.scenes.map((scene, index) => {
                const isSelected = activeScene === index;
                const hasAsset = Boolean(scene.asset);
                return (
                  <div
                    key={scene.id}
                    className={`planner-scene-card ${isSelected ? 'scene-focused' : ''}`}
                    onClick={() => setActiveScene(index)}
                  >
                    <div className="scene-card-top">
                      <div className="scene-badge-group">
                        <span className="scene-index-badge">Scene {index + 1}</span>
                        <div className="scene-duration-input">
                          <input
                            type="number"
                            min={1}
                            max={300}
                            value={scene.seconds}
                            onChange={(event) =>
                              changeScene(scene.id, { seconds: Math.max(1, Number(event.target.value)) })
                            }
                          />
                          <span>s</span>
                        </div>
                        <select
                          className="scene-kind-select"
                          value={scene.kind}
                          onChange={(event) =>
                            changeScene(scene.id, { kind: event.target.value as MediaScene['kind'] })
                          }
                        >
                          <option value="presenter">Presenter</option>
                          <option value="visual">Visual</option>
                          <option value="uploaded">Uploaded footage</option>
                        </select>
                      </div>

                      <div className="scene-card-actions">
                        <button
                          type="button"
                          aria-label="Move scene up"
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); moveScene(index, -1); }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move scene down"
                          disabled={index === draft.scenes.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveScene(index, 1); }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove scene"
                          className="scene-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDraft({ ...draft, scenes: draft.scenes.filter((item) => item.id !== scene.id) });
                            if (activeScene >= draft.scenes.length - 1) setActiveScene(Math.max(0, draft.scenes.length - 2));
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="scene-card-body">
                      <div className="scene-text-fields">
                        <label>
                          <span>Spoken lines</span>
                          <textarea
                            rows={2}
                            value={scene.narration}
                            onChange={(event) => changeScene(scene.id, { narration: event.target.value })}
                            placeholder="What is spoken during this scene..."
                          />
                        </label>
                        <label>
                          <span>Visual direction</span>
                          <textarea
                            rows={2}
                            value={scene.visual}
                            onChange={(event) => changeScene(scene.id, { visual: event.target.value })}
                            placeholder="Visual cue, graphics, or gestures..."
                          />
                        </label>
                      </div>

                      {/* Scene Media & Appearance Row */}
                      <div className="scene-media-bar">
                        <label className="scene-asset-picker">
                          <span>Scene media</span>
                          <select
                            value={scene.asset ? `${scene.asset.kind}:${scene.asset.id}` : ''}
                            onChange={(event) => {
                              const [kind, id] = event.target.value.split(':');
                              changeScene(scene.id, {
                                asset: kind && id ? { kind: kind as 'image' | 'video-job', id } : undefined,
                              });
                            }}
                          >
                            <option value="">&mdash; None assigned &mdash;</option>
                            <optgroup label="Generated Images">
                              {assets.map((asset) => (
                                <option key={asset.id} value={`image:${asset.id}`}>
                                  {asset.prompt.slice(0, 55)}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Video Renders">
                              {jobs.map((job) => (
                                <option key={job.id} value={`video-job:${job.id}`}>
                                  {job.prompt.slice(0, 55)}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </label>

                        <div className="scene-styling-row">
                          <label>
                            <span>Background</span>
                            <select
                              value={scene.background?.kind === 'image' ? `image:${scene.background.id}` : scene.background?.value || 'deep'}
                              onChange={(event) => {
                                const value = event.target.value;
                                changeScene(scene.id, {
                                  background: value.startsWith('image:')
                                    ? { kind: 'image', id: value.slice(6) }
                                    : { kind: 'preset', value: value as 'deep' | 'lime' | 'paper' },
                                  fit: 'contain',
                                });
                              }}
                            >
                              <option value="deep">Deep green</option>
                              <option value="lime">Aksen lime</option>
                              <option value="paper">Warm paper</option>
                              {assets.length > 0 && (
                                <optgroup label="Image background">
                                  {assets.map((asset) => (
                                    <option key={asset.id} value={`image:${asset.id}`}>
                                      {asset.prompt.slice(0, 45)}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </label>

                          <label>
                            <span>Framing</span>
                            <select
                              value={scene.fit || 'cover'}
                              onChange={(event) => changeScene(scene.id, { fit: event.target.value as MediaScene['fit'] })}
                            >
                              <option value="cover">Fill frame</option>
                              <option value="contain">Show backdrop</option>
                            </select>
                          </label>

                          <label>
                            <span>Transition</span>
                            <select
                              value={scene.transition || 'cut'}
                              onChange={(event) => changeScene(scene.id, { transition: event.target.value as MediaScene['transition'] })}
                            >
                              <option value="cut">Cut</option>
                              <option value="fade">Fade</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Sticky Live Storyboard & Production Actions */}
        <div className="planner-preview-column">
          <div className="planner-sticky-preview">
            <div className="preview-card-head">
              <strong>Storyboard preview</strong>
              <small>{draft.aspectRatio} · {plannedSeconds}s</small>
            </div>

            <div
              className="episode-preview-frame"
              style={{
                aspectRatio: draft.aspectRatio.replace(':', ' / '),
                background: previewScene?.background?.kind === 'preset'
                  ? BACKGROUNDS[previewScene.background.value]
                  : BACKGROUNDS.deep,
              }}
            >
              {previewBackground && (
                <Image unoptimized fill src={previewBackground.url} alt="" className="episode-preview-background" />
              )}
              {previewScene?.asset?.kind === 'video-job' ? (
                <video
                  key={previewScene.asset.id}
                  src={`/api/admin/media/video/content?id=${encodeURIComponent(previewScene.asset.id)}`}
                  controls
                  muted
                  playsInline
                  className={previewScene.fit === 'contain' ? 'is-contained' : ''}
                >
                  <track
                    kind="captions"
                    src={`data:text/vtt;charset=utf-8,${encodeURIComponent(
                      `WEBVTT\n\n00:00:00.000 --> 00:00:${String(Math.floor(previewScene.seconds / 60)).padStart(2, '0')}:${String(previewScene.seconds % 60).padStart(2, '0')}.000\n${previewScene.narration}`,
                    )}`}
                  />
                </video>
              ) : previewAsset ? (
                <Image
                  unoptimized
                  width={270}
                  height={460}
                  src={previewAsset.url}
                  alt={previewScene.visual || 'Scene image'}
                  className={previewScene?.fit === 'contain' ? 'is-contained' : ''}
                />
              ) : (
                <div className="preview-frame-empty">
                  <span>{previewScene ? `Scene ${activeScene + 1}: Assign media to preview` : 'Add a scene to begin'}</span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      className="preview-to-studio-btn"
                      onClick={() => onNavigateTab('studio')}
                    >
                      Open Asset Studio &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>

            {previewScene && (
              <div className="preview-scene-caption">
                <span className="caption-tag">Scene {activeScene + 1} of {draft.scenes.length}</span>
                <p>{previewScene.narration || previewScene.visual || 'No spoken narration entered yet.'}</p>
              </div>
            )}

            {draft.scenes.length > 0 && (
              <div className="episode-preview-timeline">
                {draft.scenes.map((scene, index) => (
                  <button
                    type="button"
                    key={scene.id}
                    className={index === activeScene ? 'active' : ''}
                    onClick={() => setActiveScene(index)}
                    style={{ flex: Math.max(1, scene.seconds) }}
                    title={`Scene ${index + 1}: ${scene.seconds}s`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Production & Review Actions */}
            <div className="planner-production-card">
              <div className="production-card-top">
                <button
                  type="button"
                  className="planner-save-btn"
                  disabled={busy || !storageReady || !draft.title.trim()}
                  onClick={save}
                >
                  <Save size={14} /> {busy ? 'Saving...' : 'Save episode draft'}
                </button>
                {selectedId && (
                  <ConfirmAction
                    className="episode-remove-btn"
                    label="Delete"
                    confirmLabel="Delete"
                    pendingLabel="Deleting"
                    title="Remove this draft"
                    pending={busy}
                    onConfirm={() => void remove()}
                  />
                )}
              </div>

              {selectedId && (
                <div className="planner-review-section">
                  <div className="review-status-row">
                    <span>Status:</span>
                    <strong className={`status-pill status-${reviewStatus}`}>
                      {reviewStatus.replace('_', ' ')}
                    </strong>
                  </div>

                  <div className="review-actions-row">
                    {reviewStatus === 'draft' && (
                      <button type="button" className="btn-review" disabled={busy} onClick={() => void review('submit')}>
                        Submit for review
                      </button>
                    )}
                    {reviewStatus === 'in_review' && (
                      <button type="button" className="btn-approve" disabled={busy} onClick={() => void review('approve')}>
                        Approve episode
                      </button>
                    )}
                    {reviewStatus !== 'draft' && (
                      <button type="button" className="btn-reopen" disabled={busy} onClick={() => void review('reopen')}>
                        Reopen draft
                      </button>
                    )}
                    <button type="button" className="btn-cuesheet" onClick={downloadPlan}>
                      Edit plan (JSON)
                    </button>
                    {reviewStatus === 'approved' && (
                      <button type="button" className="btn-renderkit" disabled={busy} onClick={() => void downloadRenderKit()}>
                        <Download size={14} /> Download MP4 kit
                      </button>
                    )}
                  </div>

                  {reviewStatus === 'approved' && (
                    <div className="episode-voice-box">
                      <label>
                        <span>Audio mode</span>
                        <select
                          value={voiceMode}
                          onChange={(event) => setVoiceMode(event.target.value as 'voiceover' | 'silent')}
                        >
                          <option value="voiceover">Recorded voiceover (WAV/MP3)</option>
                          <option value="silent">Silent draft MP4</option>
                        </select>
                      </label>
                      {voiceMode === 'voiceover' && (
                        <label>
                          <span>Audio file</span>
                          <input
                            type="file"
                            accept=".wav,.mp3,audio/wav,audio/mpeg"
                            onChange={(event) => setVoiceFile(event.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}

              {message && <output className="episode-planner-message">{message}</output>}
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Workflows: Tabbed Channel Copy, Proof Checks, and Sources */}
      <div className="planner-meta-card">
        <div className="planner-meta-tabs">
          <button
            type="button"
            className={metaSection === 'channels' ? 'active' : ''}
            onClick={() => setMetaSection('channels')}
          >
            Distribution copy
          </button>
          <button
            type="button"
            className={metaSection === 'proof' ? 'active' : ''}
            onClick={() => setMetaSection('proof')}
          >
            Proof checks ({draft.proofChecks.length})
          </button>
          <button
            type="button"
            className={metaSection === 'sources' ? 'active' : ''}
            onClick={() => setMetaSection('sources')}
          >
            Research links
          </button>
        </div>

        <div className="planner-meta-body">
          {metaSection === 'channels' && (
            <div className="planner-channels-wrapper">
              <div className="channel-pills">
                {CHANNELS.map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    className={activeChannel === ch ? 'active' : ''}
                    onClick={() => setActiveChannel(ch)}
                  >
                    {ch[0].toUpperCase() + ch.slice(1)}
                  </button>
                ))}
              </div>
              <div className="channel-active-fields">
                <label>
                  <span>Post title or hook ({activeChannel[0].toUpperCase() + activeChannel.slice(1)})</span>
                  <input
                    value={draft.channelPosts[activeChannel]?.title || ''}
                    placeholder="Punchy hook for this platform..."
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        channelPosts: {
                          ...draft.channelPosts,
                          [activeChannel]: {
                            title: event.target.value,
                            caption: draft.channelPosts[activeChannel]?.caption || '',
                          },
                        },
                      })
                    }
                  />
                </label>
                <label>
                  <span>Caption</span>
                  <textarea
                    rows={4}
                    value={draft.channelPosts[activeChannel]?.caption || ''}
                    placeholder="Full caption or body copy..."
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        channelPosts: {
                          ...draft.channelPosts,
                          [activeChannel]: {
                            title: draft.channelPosts[activeChannel]?.title || '',
                            caption: event.target.value,
                          },
                        },
                      })
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {metaSection === 'proof' && (
            <div className="planner-proof-wrapper">
              {draft.proofChecks.length === 0 ? (
                <p className="meta-empty-text">No proof checks added yet. Verify factual claims with source links.</p>
              ) : (
                <div className="proof-checks-list">
                  {draft.proofChecks.map((check, index) => (
                    <div className="proof-check-item" key={check.id}>
                      <div className="proof-item-top">
                        <strong>Check {index + 1}</strong>
                        <button
                          type="button"
                          aria-label={`Remove proof check ${index + 1}`}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              proofChecks: draft.proofChecks.filter((item) => item.id !== check.id),
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        value={check.question}
                        maxLength={500}
                        onChange={(event) => changeProof(check.id, { question: event.target.value })}
                        placeholder="What claim or fact needs checking?"
                      />
                      <div className="proof-status-row">
                        <select
                          value={check.status}
                          onChange={(event) =>
                            changeProof(check.id, { status: event.target.value as ProofCheck['status'] })
                          }
                        >
                          <option value="open">Open</option>
                          <option value="verified">Verified with source</option>
                          <option value="illustrative">Clearly illustrative</option>
                        </select>
                        <input
                          type="url"
                          value={check.evidenceUrl}
                          onChange={(event) => changeProof(check.id, { evidenceUrl: event.target.value })}
                          placeholder="Evidence URL (https://...)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="planner-tool-btn"
                disabled={draft.proofChecks.length >= 20}
                onClick={() =>
                  setDraft({
                    ...draft,
                    proofChecks: [
                      ...draft.proofChecks,
                      { id: crypto.randomUUID(), question: '', evidenceUrl: '', status: 'open' },
                    ],
                  })
                }
              >
                <Plus size={14} /> Add proof check
              </button>
            </div>
          )}

          {metaSection === 'sources' && (
            <div className="planner-sources-wrapper">
              <label>
                <span>Reference URLs (one HTTPS link per line)</span>
                <textarea
                  rows={4}
                  value={sourcesText}
                  onChange={(event) => setSourcesText(event.target.value)}
                  placeholder="https://example.com/source-report"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
