'use client';

import { useEffect, useState } from 'react';
import { FilePenLine, Plus, Save, Trash2 } from 'lucide-react';
import type { EpisodeInput, MediaScene } from '@/lib/media-episodes';
import { ConfirmAction } from '@/components/ui/confirm-action';

type SavedEpisode = EpisodeInput & { id: string; status: string; updatedAt: string };

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
    scenes: [
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 7, narration: 'When people say “AI model,” what are they actually talking about?', visual: 'Founder to camera; direct opening question.' },
      { id: crypto.randomUUID(), kind: 'visual', seconds: 22, narration: 'Think of a model as the part of an AI system that learned patterns from examples...', visual: 'Input → model → output; speech transcript, image, and question examples.' },
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 21, narration: 'But the model is only one part of a useful product...', visual: 'Founder with a clearly illustrative customer-question and human handoff graphic.' },
      { id: crypto.randomUUID(), kind: 'presenter', seconds: 20, narration: 'So when you hear that a new model is “better”...', visual: 'Founder closes with three on-screen questions and Aksen Labs identifier.' },
    ],
  };
}

function blankEpisode(): EpisodeInput {
  return { title: '', topic: '', script: '', aspectRatio: '9:16', sources: [], scenes: [] };
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

  function choose(episode: SavedEpisode) {
    setSelectedId(episode.id);
    setDraft({ title: episode.title, topic: episode.topic, script: episode.script,
      scenes: Array.isArray(episode.scenes) ? episode.scenes : [],
      sources: Array.isArray(episode.sources) ? episode.sources : [],
      aspectRatio: episode.aspectRatio });
    setSourcesText((episode.sources || []).join('\n'));
    setMessage(''); setError('');
  }

  function start(input: EpisodeInput) {
    setSelectedId(null); setDraft(input); setSourcesText(input.sources.join('\n'));
    setMessage(''); setError('');
  }

  function changeScene(id: string, change: Partial<MediaScene>) {
    setDraft((current) => ({ ...current, scenes: current.scenes.map((scene) => scene.id === id ? { ...scene, ...change } : scene) }));
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
      setEpisodes((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setMessage('Draft saved. Nothing has been generated or published.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the episode.');
    } finally { setBusy(false); }
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
  const plannedSeconds = draft.scenes.reduce((sum, scene) => sum + scene.seconds, 0);

  return <section className="admin-panel episode-planner">
    <div className="panel-head"><div><small>EPISODE PLANNER</small><h2>Plan a video before rendering</h2></div><FilePenLine /></div>
    <p className="episode-planner-intro">Save scripts, source links, and a scene plan. The first episode template is ready to adapt. Generation stays a separate step.</p>
    <div className="episode-planner-actions">
      <button type="button" onClick={() => start(firstEpisode())}>Use first episode template</button>
      <button type="button" onClick={() => start(blankEpisode())}><Plus size={15} /> New blank episode</button>
    </div>
    {episodes.length > 0 && <div className="episode-planner-list"><span>Saved drafts</span><div>
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
        <div className="episode-scene-top"><strong>Scene {index + 1}</strong><button type="button" aria-label={`Remove scene ${index + 1}`} onClick={() => setDraft({ ...draft, scenes: draft.scenes.filter((item) => item.id !== scene.id) })}><Trash2 size={15} /></button></div>
        <div className="episode-scene-row"><label>Type<select value={scene.kind} onChange={(event) => changeScene(scene.id, { kind: event.target.value as MediaScene['kind'] })}><option value="presenter">Presenter avatar</option><option value="visual">Generated visual</option><option value="uploaded">Uploaded footage</option></select></label><label>Seconds<input type="number" min={1} max={300} value={scene.seconds} onChange={(event) => changeScene(scene.id, { seconds: Number(event.target.value) })} /></label></div>
        <label>Spoken lines<textarea value={scene.narration} onChange={(event) => changeScene(scene.id, { narration: event.target.value })} /></label>
        <label>Visual direction<textarea value={scene.visual} onChange={(event) => changeScene(scene.id, { visual: event.target.value })} /></label>
      </div>)}
    </div>
    <button type="button" className="episode-add-scene" disabled={draft.scenes.length >= 20} onClick={() => setDraft({ ...draft, scenes: [...draft.scenes, { id: crypto.randomUUID(), kind: 'presenter', narration: '', visual: '', seconds: 8 }] })}><Plus size={15} /> Add scene</button>
    <div className="episode-planner-footer"><button type="button" className="episode-save" disabled={busy || !storageReady || !draft.title.trim()} onClick={save}><Save size={15} /> {busy ? 'Working...' : 'Save draft'}</button>{selectedId && <ConfirmAction className="episode-remove" label="Remove draft" confirmLabel="Remove" pendingLabel="Removing" title="Remove this episode draft" pending={busy} onConfirm={() => void remove()} />}</div>
    {message && <output className="episode-planner-message">{message}</output>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
