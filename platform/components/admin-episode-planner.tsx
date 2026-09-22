'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, FilePenLine, Plus, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { CHANNELS, episodeDuration, sceneCueSheet, type EpisodeInput, type MediaScene, type ProofCheck } from '@/lib/media-episodes';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { MediaInspirationWorkbench } from '@/components/media-inspiration-workbench';
import { MediaJevEvaluationBoard } from '@/components/media-jev-evaluation-board';
import type { InspirationAngle, InspirationScript, VideoReference } from '@/lib/media-inspiration';
import { strToU8, zipSync } from 'fflate';

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
    media.onloadedmetadata = () => { const duration = media.duration; cleanup(); if (Number.isFinite(duration) && duration > 0) resolve(duration); else reject(new Error('Could not read media duration.')); };
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

export function AdminEpisodePlanner() {
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
    const [gallery, renders] = await Promise.all([
      fetch('/api/admin/media/save').then((response) => response.json()) as Promise<{ assets?: Asset[] }>,
      fetch('/api/admin/media/video/jobs').then((response) => response.json()) as Promise<{ jobs?: Job[] }>,
    ]);
    setAssets((gallery.assets || []).filter((asset) => asset.kind === 'image'));
    setJobs((renders.jobs || []).filter((job) => job.status === 'completed'));
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

  function choose(episode: SavedEpisode) {
    setVoiceFile(null);
    setSelectedId(episode.id);
    setDraft({ title: episode.title, topic: episode.topic, script: episode.script, originEvaluationId: episode.originEvaluationId,
      scenes: Array.isArray(episode.scenes) ? episode.scenes : [],
      sources: Array.isArray(episode.sources) ? episode.sources : [], channelPosts: episode.channelPosts || {}, proofChecks: Array.isArray(episode.proofChecks) ? episode.proofChecks : [],
      aspectRatio: episode.aspectRatio });
    setReviewStatus(episode.status); setActiveScene(0);
    setSourcesText((episode.sources || []).join('\n'));
    setMessage(''); setError('');
  }

  function start(input: EpisodeInput) {
    setVoiceFile(null);
    setSelectedId(null); setDraft(input); setSourcesText(input.sources.join('\n')); setReviewStatus('draft'); setActiveScene(0);
    setMessage(''); setError('');
  }

  function useInspiredDraft(input: { reference: VideoReference; angle: InspirationAngle; draft: InspirationScript; evaluationId?: string }) {
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
    setMessage('Inspired draft loaded. Review the wording, evidence and scene plan, then save it as a new episode.');
  }

  function changeScene(id: string, change: Partial<MediaScene>) {
    setDraft((current) => ({ ...current, scenes: current.scenes.map((scene) => scene.id === id ? { ...scene, ...change } : scene) }));
  }

  function moveScene(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= draft.scenes.length) return;
    const scenes = [...draft.scenes];
    [scenes[index], scenes[next]] = [scenes[next], scenes[index]];
    setDraft({ ...draft, scenes }); setActiveScene(next);
  }

  function changeProof(id: string, change: Partial<ProofCheck>) {
    setDraft((current) => ({ ...current, proofChecks: current.proofChecks.map((check) => check.id === id ? { ...check, ...change } : check) }));
  }

  async function save() {
    setBusy(true); setError(''); setMessage('');
    const payload = { ...draft, id: selectedId, sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean) };
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
      setMessage('Draft saved. Nothing has been generated or published.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the episode.');
    } finally { setBusy(false); }
  }

  async function review(action: 'submit' | 'approve' | 'reopen') {
    if (!selectedId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const currentDraft = { ...draft, sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean) };
      const response = await fetch('/api/admin/media/episodes/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selectedId, action, currentDraft }) });
      const data = await response.json() as { episode?: SavedEpisode; error?: string; blockers?: string[] };
      if (!response.ok || !data.episode) throw new Error(data.blockers?.join(' ') || data.error || 'Review failed.');
      setReviewStatus(data.episode.status);
      setEpisodes((current) => [data.episode!, ...current.filter((item) => item.id !== selectedId)]);
      setMessage(action === 'approve' ? 'Episode approved for export preparation. No post has been published.' : action === 'submit' ? 'Episode sent to review.' : 'Episode reopened as a draft.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review failed.'); }
    finally { setBusy(false); }
  }

  function downloadPlan() {
    const cues = sceneCueSheet(draft.scenes);
    const payload = { version: 1, episodeId: selectedId, originEvaluationId: draft.originEvaluationId, title: draft.title, aspectRatio: draft.aspectRatio, durationSeconds: episodeDuration(draft.scenes), script: draft.script, sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean), channelPosts: draft.channelPosts, proofChecks: draft.proofChecks, scenes: cues };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `aksen-episode-${selectedId || 'draft'}.json`; link.click(); URL.revokeObjectURL(url);
  }

  async function downloadRenderKit() {
    if (!selectedId || reviewStatus !== 'approved') { setError('Approve and save this episode before exporting a render kit.'); return; }
    const saved = episodes.find((episode) => episode.id === selectedId);
    const currentDraft = { ...draft, sources: sourcesText.split(/\r?\n/).map((source) => source.trim()).filter(Boolean) };
    if (!saved || JSON.stringify([currentDraft.title, currentDraft.topic, currentDraft.script, currentDraft.scenes, currentDraft.sources, currentDraft.aspectRatio, currentDraft.channelPosts, currentDraft.proofChecks, currentDraft.originEvaluationId]) !==
      JSON.stringify([saved.title, saved.topic, saved.script, saved.scenes, saved.sources, saved.aspectRatio, saved.channelPosts, saved.proofChecks, saved.originEvaluationId])) {
      setError('Save and approve the latest episode changes before exporting.'); return;
    }
    setBusy(true); setError(''); setMessage('Collecting reviewed scene media...');
    try {
      const files: Record<string, Uint8Array> = {};
      const scenes = [];
      let totalBytes = 0;
      let voicePath = '';
      if (voiceMode === 'voiceover') {
        if (!voiceFile) throw new Error('Choose your recorded voiceover, or select an intentionally silent render.');
        const extension = /\.(wav|mp3)$/i.exec(voiceFile.name)?.[1]?.toLowerCase();
        if (!extension) throw new Error('Voiceover must be a WAV or MP3 file.');
        const duration = await mediaDuration(voiceFile, 'audio');
        const planned = episodeDuration(draft.scenes);
        if (Math.abs(duration - planned) > 1) throw new Error(`Voiceover is ${duration.toFixed(1)}s, but the scene plan is ${planned}s. Adjust the scene seconds or recording to within 1 second.`);
        voicePath = `episodes/${selectedId}/voice.${extension}`;
        files[voicePath] = new Uint8Array(await voiceFile.arrayBuffer());
        totalBytes += files[voicePath].byteLength;
      }
      for (const scene of draft.scenes) {
        setMessage(`Checking scene ${scenes.length + 1} of ${draft.scenes.length}...`);
        if (!scene.asset) throw new Error(`Scene ${scenes.length + 1} needs media.`);
        const url = scene.asset.kind === 'image'
          ? assets.find((asset) => asset.id === scene.asset?.id)?.url
          : `/api/admin/media/video/content?id=${encodeURIComponent(scene.asset.id)}`;
        if (!url) throw new Error(`Scene ${scenes.length + 1} media is unavailable. Refresh available media.`);
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Could not download scene ${scenes.length + 1} media. Provider output may have expired.`);
        const contentType = response.headers.get('content-type') || '';
        const extension = scene.asset.kind === 'video-job' ? 'mp4' : contentType.includes('jpeg') ? 'jpg' : contentType.includes('png') ? 'png' : '';
        if (!extension) throw new Error(`Scene ${scenes.length + 1} has an unsupported media format.`);
        const path = `episodes/${selectedId}/${scene.id}.${extension}`;
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (extension === 'mp4') {
          const duration = await mediaDuration(new Blob([new Uint8Array(bytes)], { type: 'video/mp4' }), 'video');
          if (duration + 0.1 < scene.seconds) throw new Error(`Scene ${scenes.length + 1} clip is ${duration.toFixed(1)}s but the scene needs ${scene.seconds}s. Extend the clip or shorten the scene.`);
        }
        totalBytes += bytes.byteLength;
        if (totalBytes > 150_000_000) throw new Error('This kit exceeds the 150 MB browser export limit. Use smaller scene clips.');
        files[path] = bytes;
        let backgroundPath = '';
        if (scene.background?.kind === 'image') {
          const selected = assets.find((asset) => asset.id === (scene.background?.kind === 'image' ? scene.background.id : ''));
          if (!selected) throw new Error(`Scene ${scenes.length + 1} background image is unavailable.`);
          const backgroundResponse = await fetch(selected.url, { credentials: 'same-origin' });
          if (!backgroundResponse.ok) throw new Error(`Could not download scene ${scenes.length + 1} background.`);
          const backgroundType = backgroundResponse.headers.get('content-type') || '';
          const backgroundExtension = backgroundType.includes('jpeg') ? 'jpg' : backgroundType.includes('png') ? 'png' : '';
          if (!backgroundExtension) throw new Error(`Scene ${scenes.length + 1} background has an unsupported format.`);
          backgroundPath = `episodes/${selectedId}/${scene.id}-background.${backgroundExtension}`;
          const backgroundBytes = new Uint8Array(await backgroundResponse.arrayBuffer());
          totalBytes += backgroundBytes.byteLength;
          if (totalBytes > 150_000_000) throw new Error('This kit exceeds the 150 MB browser export limit.');
          files[backgroundPath] = backgroundBytes;
        }
        scenes.push({ id: scene.id, seconds: scene.seconds, narration: scene.narration, visual: scene.visual, assetPath: path, background: scene.background || { kind: 'preset', value: 'deep' }, backgroundPath, fit: scene.fit || 'cover', transition: scene.transition || 'cut' });
      }
      files['episode.json'] = strToU8(JSON.stringify({ version: 1, episodeId: selectedId, title: draft.title, aspectRatio: draft.aspectRatio, scenes, voicePath, channelPosts: draft.channelPosts, sources: draft.sources }, null, 2));
      const archive = zipSync(files, { level: 0 });
      const blob = new Blob([new Uint8Array(archive)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `aksen-render-${selectedId}.zip`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setMessage(`Render kit downloaded (${voicePath ? 'voiceover included' : 'silent'}). Run the episode renderer on a machine with Remotion installed.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the render kit.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!selectedId || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/media/episodes', {
        method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selectedId }),
      });
      if (!response.ok) throw new Error('Could not remove the draft.');
      setEpisodes((current) => current.filter((item) => item.id !== selectedId));
      start(blankEpisode());
      setMessage('Draft removed.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove the draft.'); }
    finally { setBusy(false); }
  }

  const words = draft.script.trim() ? draft.script.trim().split(/\s+/).length : 0;
  const plannedSeconds = episodeDuration(draft.scenes);
  const previewScene = draft.scenes[activeScene];
  const previewAsset = previewScene?.asset?.kind === 'image' ? assets.find((asset) => asset.id === previewScene.asset?.id) : null;
  const previewBackground = previewScene?.background?.kind === 'image' ? assets.find((asset) => asset.id === (previewScene.background?.kind === 'image' ? previewScene.background.id : '')) : null;

  return <section className="admin-panel episode-planner">
    <div className="panel-head"><div><small>EPISODE PLANNER</small><h2>Plan a video before rendering</h2></div><FilePenLine /></div>
    <p className="episode-planner-intro">Plan the story, assign media, review claims and channel copy, then export an approved render kit for an MP4. Keep the downloaded kit and MP4 backed up until durable media storage is connected.</p>
    <MediaInspirationWorkbench onDraft={useInspiredDraft} />
    <MediaJevEvaluationBoard />
    <div className="episode-planner-actions">
      <button type="button" onClick={() => start(firstEpisode())}>Use first episode template</button>
      <button type="button" onClick={() => start(blankEpisode())}><Plus size={15} /> New blank episode</button>
    </div>
    {episodes.length > 0 && <div className="episode-planner-list"><span>Saved episodes</span><div>
      {episodes.map((episode) => <button type="button" className={selectedId === episode.id ? 'active' : ''} key={episode.id} onClick={() => choose(episode)}>{episode.title}</button>)}
    </div></div>}
    <div className="episode-planner-fields">
      <label>Title<input value={draft.title} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What is an AI model?" /></label>
      <label>Angle or purpose<textarea value={draft.topic} maxLength={500} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} placeholder="The one idea viewers should understand" /></label>
      <label>Final spoken script<textarea className="episode-script" value={draft.script} maxLength={12000} onChange={(event) => setDraft({ ...draft, script: event.target.value })} placeholder="Write the exact words the presenter should say" /></label>
      <div className="episode-planner-meta"><span>{words} words · roughly {Math.round(words / 2.5)} seconds of speech</span><label>Format<select value={draft.aspectRatio} onChange={(event) => setDraft({ ...draft, aspectRatio: event.target.value as EpisodeInput['aspectRatio'] })}><option value="9:16">9:16 vertical</option><option value="16:9">16:9 landscape</option><option value="1:1">1:1 square</option></select></label></div>
      <label>Source links, one HTTPS URL per line<textarea value={sourcesText} onChange={(event) => setSourcesText(event.target.value)} placeholder="https://example.com/source" /></label>
    </div>
    <div className="episode-scenes-head"><h3>Scene plan</h3><span>{plannedSeconds}s planned</span></div>
    <div className="episode-scenes">
      {draft.scenes.map((scene, index) => <div className="episode-scene" key={scene.id}>
        <div className="episode-scene-top"><strong>Scene {index + 1}</strong><div className="episode-scene-actions"><button type="button" aria-label={`Move scene ${index + 1} up`} disabled={index === 0} onClick={() => moveScene(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Move scene ${index + 1} down`} disabled={index === draft.scenes.length - 1} onClick={() => moveScene(index, 1)}><ArrowDown size={15} /></button><button type="button" aria-label={`Remove scene ${index + 1}`} onClick={() => setDraft({ ...draft, scenes: draft.scenes.filter((item) => item.id !== scene.id) })}><Trash2 size={15} /></button></div></div>
        <div className="episode-scene-row"><label>Type<select value={scene.kind} onChange={(event) => changeScene(scene.id, { kind: event.target.value as MediaScene['kind'] })}><option value="presenter">Presenter avatar</option><option value="visual">Generated visual</option><option value="uploaded">Uploaded footage</option></select></label><label>Seconds<input type="number" min={1} max={300} value={scene.seconds} onChange={(event) => changeScene(scene.id, { seconds: Number(event.target.value) })} /></label></div>
        <label>Spoken lines<textarea value={scene.narration} onChange={(event) => changeScene(scene.id, { narration: event.target.value })} /></label>
        <label>Visual direction<textarea value={scene.visual} onChange={(event) => changeScene(scene.id, { visual: event.target.value })} /></label>
        <label>Scene media<select value={scene.asset ? `${scene.asset.kind}:${scene.asset.id}` : ''} onChange={(event) => { const [kind, id] = event.target.value.split(':'); changeScene(scene.id, { asset: kind && id ? { kind: kind as 'image' | 'video-job', id } : undefined }); }}><option value="">No asset selected</option><optgroup label="Generated images">{assets.map((asset) => <option key={asset.id} value={`image:${asset.id}`}>{asset.prompt.slice(0, 70)}</option>)}</optgroup><optgroup label="Completed video jobs">{jobs.map((job) => <option key={job.id} value={`video-job:${job.id}`}>{job.prompt.slice(0, 70)}</option>)}</optgroup></select></label>
        <div className="episode-scene-style"><label>Background<select value={scene.background?.kind === 'image' ? `image:${scene.background.id}` : scene.background?.value || 'deep'} onChange={(event) => { const value = event.target.value; changeScene(scene.id, { background: value.startsWith('image:') ? { kind: 'image', id: value.slice(6) } : { kind: 'preset', value: value as 'deep' | 'lime' | 'paper' }, fit: 'contain' }); }}><option value="deep">Deep green</option><option value="lime">Aksen lime</option><option value="paper">Warm paper</option><optgroup label="Generated image">{assets.map((asset) => <option key={asset.id} value={`image:${asset.id}`}>{asset.prompt.slice(0, 70)}</option>)}</optgroup></select></label><label>Media framing<select value={scene.fit || 'cover'} onChange={(event) => changeScene(scene.id, { fit: event.target.value as MediaScene['fit'] })}><option value="cover">Fill frame</option><option value="contain">Show background around media</option></select></label><label>Scene entrance<select value={scene.transition || 'cut'} onChange={(event) => changeScene(scene.id, { transition: event.target.value as MediaScene['transition'] })}><option value="cut">Cut</option><option value="fade">Fade in</option></select></label></div>
      </div>)}
    </div>
    <button type="button" className="episode-refresh" onClick={() => void refreshAssets().catch(() => setError('Could not refresh media.'))}>Refresh available media</button>
    <button type="button" className="episode-add-scene" disabled={draft.scenes.length >= 20} onClick={() => setDraft({ ...draft, scenes: [...draft.scenes, { id: crypto.randomUUID(), kind: 'presenter', narration: '', visual: '', seconds: 8 }] })}><Plus size={15} /> Add scene</button>
    <div className="episode-preview"><div className="episode-scenes-head"><h3>Storyboard preview</h3><span>{plannedSeconds}s · {draft.aspectRatio}</span></div><div className="episode-preview-frame" style={{ aspectRatio: draft.aspectRatio.replace(':', ' / '), background: previewScene?.background?.kind === 'preset' ? BACKGROUNDS[previewScene.background.value] : BACKGROUNDS.deep }}>{previewBackground && <Image unoptimized fill src={previewBackground.url} alt="" className="episode-preview-background" />}{previewScene?.asset?.kind === 'video-job' ? <video key={previewScene.asset.id} src={`/api/admin/media/video/content?id=${encodeURIComponent(previewScene.asset.id)}`} controls muted playsInline className={previewScene.fit === 'contain' ? 'is-contained' : ''}><track kind="captions" src={`data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n00:00:00.000 --> 00:00:${String(Math.floor(previewScene.seconds / 60)).padStart(2, '0')}:${String(previewScene.seconds % 60).padStart(2, '0')}.000\n${previewScene.narration}`)}`} /></video> : previewAsset ? <Image unoptimized width={270} height={460} src={previewAsset.url} alt={previewScene.visual || 'Scene image'} className={previewScene?.fit === 'contain' ? 'is-contained' : ''} /> : <span>{previewScene ? 'Assign media to preview this scene' : 'Add a scene to begin'}</span>}</div>{previewScene && <p><strong>Scene {activeScene + 1}:</strong> {previewScene.narration || previewScene.visual} · {previewScene.transition === 'fade' ? 'Fades in' : 'Cut'} · {previewScene.fit === 'contain' ? 'Framed media' : 'Full-frame media'}</p>}<div className="episode-preview-timeline">{draft.scenes.map((scene, index) => <button type="button" key={scene.id} className={index === activeScene ? 'active' : ''} onClick={() => setActiveScene(index)} style={{ flex: scene.seconds }}>{index + 1} · {scene.seconds}s</button>)}</div><small>Backgrounds show around framed media. They do not remove a recorded video’s original backdrop. Clip audio is muted in the preview and final render.</small></div>
    <div className="episode-channel-posts"><h3>Channel copy</h3><p>Prepare different hooks and captions for each platform. Publishing remains a separate approval and connection step.</p>{CHANNELS.map((channel) => <div className="episode-channel" key={channel}><h4>{channel[0].toUpperCase() + channel.slice(1)}</h4><label>Post title or hook<input value={draft.channelPosts[channel]?.title || ''} onChange={(event) => setDraft({ ...draft, channelPosts: { ...draft.channelPosts, [channel]: { title: event.target.value, caption: draft.channelPosts[channel]?.caption || '' } } })} /></label><label>Caption<textarea value={draft.channelPosts[channel]?.caption || ''} onChange={(event) => setDraft({ ...draft, channelPosts: { ...draft.channelPosts, [channel]: { title: draft.channelPosts[channel]?.title || '', caption: event.target.value } } })} /></label></div>)}</div>
    <div className="episode-proof-board"><div><h3>Proof checks</h3><p>Keep claims and examples honest before review. Mark a check verified only with an HTTPS evidence link. Mark an example illustrative when the script makes that clear.</p></div>{draft.proofChecks.map((check, index) => <div className="episode-proof-check" key={check.id}><div className="episode-scene-top"><strong>Check {index + 1}</strong><button type="button" aria-label={`Remove proof check ${index + 1}`} onClick={() => setDraft({ ...draft, proofChecks: draft.proofChecks.filter((item) => item.id !== check.id) })}><Trash2 size={15} /></button></div><label>What needs checking?<input value={check.question} maxLength={500} onChange={(event) => changeProof(check.id, { question: event.target.value })} /></label><div className="episode-scene-row"><label>Status<select value={check.status} onChange={(event) => changeProof(check.id, { status: event.target.value as ProofCheck['status'] })}><option value="open">Open</option><option value="verified">Verified with source</option><option value="illustrative">Clearly illustrative</option></select></label><label>Evidence URL<input type="url" value={check.evidenceUrl} onChange={(event) => changeProof(check.id, { evidenceUrl: event.target.value })} placeholder="https://…" /></label></div></div>)}<button type="button" disabled={draft.proofChecks.length >= 20} onClick={() => setDraft({ ...draft, proofChecks: [...draft.proofChecks, { id: crypto.randomUUID(), question: 'Which factual claim needs a source?', evidenceUrl: '', status: 'open' }] })}><Plus size={15} /> Add proof check</button></div>
    <div className="episode-planner-footer"><button type="button" className="episode-save" disabled={busy || !storageReady || !draft.title.trim()} onClick={save}><Save size={15} /> {busy ? 'Working...' : 'Save draft'}</button>{selectedId && <ConfirmAction className="episode-remove" label="Remove draft" confirmLabel="Remove" pendingLabel="Removing" title="Remove this episode draft" pending={busy} onConfirm={() => void remove()} />}</div>
    {selectedId && <div className="episode-review"><strong>Review: {reviewStatus.replace('_', ' ')}</strong><div>{reviewStatus === 'draft' && <button type="button" disabled={busy} onClick={() => void review('submit')}>Submit for review</button>}{reviewStatus === 'in_review' && <button type="button" disabled={busy} onClick={() => void review('approve')}>Approve episode</button>}{reviewStatus !== 'draft' && <button type="button" disabled={busy} onClick={() => void review('reopen')}>Reopen draft</button>}<button type="button" onClick={downloadPlan}>Download edit plan</button>{reviewStatus === 'approved' && <button type="button" disabled={busy} onClick={() => void downloadRenderKit()}>Download MP4 render kit</button>}</div>{reviewStatus === 'approved' && <div className="episode-voice"><label>Audio for the final MP4<select value={voiceMode} onChange={(event) => setVoiceMode(event.target.value as 'voiceover' | 'silent')}><option value="voiceover">My recorded voiceover</option><option value="silent">Intentional silent draft</option></select></label>{voiceMode === 'voiceover' && <label>Recording (WAV or MP3)<input type="file" accept=".wav,.mp3,audio/wav,audio/mpeg" onChange={(event) => setVoiceFile(event.target.files?.[0] || null)} /></label>}<small>Record the full script once. Match the scene plan within one second. This file is included in the downloaded kit only; it is not saved to the episode database. Scene clips are muted in the final MP4.</small></div>}</div>}
    {message && <output className="episode-planner-message">{message}</output>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
