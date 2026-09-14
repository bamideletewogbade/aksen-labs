'use client';

import { Download, ImagePlus, Loader2, Plus, Image, FilePenLine, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
import { ConfirmAction } from '@/components/ui/confirm-action';

type Mode = 'image' | 'video';
type Reference = { id: string; dataUrl: string };
type Result = { kind: 'image'; dataUrl: string } | { kind: 'video'; url: string };
type GalleryItem = { id: string; kind: 'image' | 'video'; prompt: string; model: string; aspectRatio: string | null; url: string; createdAt: string };

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const DURATIONS = [4, 5, 8, 10, 15];

const STYLE_PRESETS = [
  { label: 'Product shot', snippet: 'clean studio product photography, soft directional light, carbon-black and soft-white surfaces, restrained signal-green accent' },
  { label: 'Accra lifestyle', snippet: 'authentic contemporary Accra setting, natural daylight, real people, no visual stereotypes' },
  { label: 'Abstract signal', snippet: 'abstract geometric signal motif, monochrome with a single signal-green accent, no readable text, no logos' },
  { label: 'Team at work', snippet: 'capable professionals collaborating in a modern office, candid and unposed, premium editorial realism' },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AdminMediaStudio() {
  const [mode, setMode] = useState<Mode>('image');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [duration, setDuration] = useState(5);
  const [references, setReferences] = useState<Reference[]>([]);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [enhancing, setEnhancing] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [removingAsset, setRemovingAsset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadGallery() {
    try {
      const response = await fetch('/api/admin/media/save');
      const data = await response.json() as { assets?: GalleryItem[] };
      if (data.assets) setGallery(data.assets);
    } catch { /* gallery is a nice-to-have; ignore failures */ }
  }

  useEffect(() => { void loadGallery(); }, []);


  async function removeAsset(id: string) {
    setRemovingAsset(id);
    try {
      const response = await fetch('/api/admin/media/save', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error('remove failed');
      // Dropped locally rather than refetched, so the grid does not reshuffle
      // while someone is looking at it.
      setGallery((current) => current.filter((item) => item.id !== id));
    } catch {
      setErrorMessage('That generation could not be removed.');
    } finally {
      setRemovingAsset(null);
    }
  }
  function applyPreset(snippet: string) {
    setPrompt((current) => (current.trim() ? `${current.trim()}, ${snippet}` : snippet));
  }

  async function enhancePrompt() {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const response = await fetch('/api/admin/media/enhance-prompt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, kind: mode }) });
      const data = await response.json() as { prompt?: string; error?: string };
      if (response.ok && data.prompt) setPrompt(data.prompt);
    } finally {
      setEnhancing(false);
    }
  }

  async function addReferenceFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const remaining = 4 - references.length;
    const picked = Array.from(files).slice(0, remaining);
    const withDataUrls = await Promise.all(picked.map(async (file) => ({ id: crypto.randomUUID(), dataUrl: await readFileAsDataUrl(file) })));
    setReferences((current) => [...current, ...withDataUrls]);
  }

  function removeReference(id: string) {
    setReferences((current) => current.filter((ref) => ref.id !== id));
  }

  function useResultAsReference() {
    if (result?.kind !== 'image' || references.length >= 4) return;
    setReferences((current) => [...current, { id: crypto.randomUUID(), dataUrl: result.dataUrl }]);
  }

  function reuseFromGallery(item: GalleryItem) {
    setMode(item.kind);
    setPrompt(item.prompt);
    if (item.aspectRatio) setAspectRatio(item.aspectRatio);
    setResult(item.kind === 'image' ? { kind: 'image', dataUrl: item.url } : { kind: 'video', url: item.url });
  }

  async function saveVideoAsset(url: string, model: string) {
    try {
      await fetch('/api/admin/media/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'video', prompt, model, aspectRatio, url, referenceCount: references.length }) });
      await loadGallery();
    } catch { /* history is best-effort */ }
  }

  async function pollVideoUntilDone(pollingUrl: string, model: string) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 12_000));
      const response = await fetch(`/api/admin/media/video/status?url=${encodeURIComponent(pollingUrl)}`);
      const data = await response.json() as { status?: string; unsignedUrls?: string[]; error?: string };
      if (data.status === 'completed' && data.unsignedUrls?.[0]) {
        setResult({ kind: 'video', url: data.unsignedUrls[0] });
        setStatus('idle');
        await saveVideoAsset(data.unsignedUrls[0], model);
        return;
      }
      if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
        throw new Error(data.error || 'The video job did not finish.');
      }
      setProgressNote(`Still rendering... (checked ${attempt + 1} times)`);
    }
    throw new Error('The video is taking longer than expected. Check back shortly.');
  }

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setStatus('working'); setErrorMessage(''); setResult(null);
    setProgressNote(mode === 'video' ? 'Starting the video job...' : 'Generating the image...');
    try {
      const referenceImages = references.map((ref) => ref.dataUrl);
      if (mode === 'image') {
        const response = await fetch('/api/admin/media/image', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, aspectRatio, referenceImages }) });
        const data = await response.json() as { dataUrl?: string; error?: string };
        if (!response.ok || !data.dataUrl) throw new Error(data.error || 'The image could not be generated.');
        setResult({ kind: 'image', dataUrl: data.dataUrl });
        setStatus('idle');
        await loadGallery();
      } else {
        const response = await fetch('/api/admin/media/video', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, aspectRatio, duration, referenceImages }) });
        const data = await response.json() as { pollingUrl?: string; model?: string; error?: string };
        if (!response.ok || !data.pollingUrl) throw new Error(data.error || 'The video job could not be started.');
        await pollVideoUntilDone(data.pollingUrl, data.model || 'unknown');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  }

  return (
    <section className="admin-panel media-studio-panel">
      <div className="panel-head"><div><small>CREATIVE STUDIO</small><h2>Generate a marketing asset</h2></div><Image /></div>
      <div className="create-tabs">
        <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => { setMode('image'); setResult(null); setStatus('idle'); }}><ImagePlus /> Image</button>
        <button type="button" className={mode === 'video' ? 'active' : ''} onClick={() => { setMode('video'); setResult(null); setStatus('idle'); }}><Video /> Video</button>
      </div>
      <form className="admin-create-form media-studio-form" onSubmit={submit}>
        <label>Describe what you want<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required placeholder="A calm product shot of our brand colours on a wooden desk, morning light" /></label>
        <div className="media-preset-row">
          {STYLE_PRESETS.map((preset) => <button type="button" key={preset.label} onClick={() => applyPreset(preset.snippet)}>{preset.label}</button>)}
          <button type="button" className="media-enhance-button" onClick={enhancePrompt} disabled={!prompt.trim() || enhancing}>{enhancing ? <Loader2 size={13} className="icon-spin" /> : <FilePenLine size={13} />} Enhance</button>
        </div>
        <div className="media-studio-row">
          <label>Aspect ratio<select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>{ASPECT_RATIOS.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}</select></label>
          {mode === 'video' && <label>Duration<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{DURATIONS.map((value) => <option key={value} value={value}>{value}s</option>)}</select></label>}
        </div>
        <div className="media-reference-field">
          <span>Reference images (optional, up to 4) â€” style guides or examples to match</span>
          <div className="media-reference-list">
            {references.map((ref) => <div className="media-reference-thumb" key={ref.id}><img src={ref.dataUrl} alt="Reference" /><button type="button" onClick={() => removeReference(ref.id)} aria-label="Remove reference"><X size={13} /></button></div>)}
            {references.length < 4 && <button type="button" className="media-reference-add" onClick={() => fileInputRef.current?.click()}><Plus size={16} /></button>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => addReferenceFiles(event.target.files)} />
        </div>
        <PendingButton className="create-submit" pending={status === 'working'} pendingLabel={progressNote || 'Working'} disabled={!prompt.trim()}>Generate {mode} <Image /></PendingButton>
        {status === 'error' && <p className="form-error">{errorMessage}</p>}
      </form>
      {result && (
        <div className="media-result">
          {result.kind === 'image'
            ? <img src={result.dataUrl} alt="Generated result" />
            : <video src={result.url} controls autoPlay muted loop playsInline />}
          <div className="media-result-actions">
            <a href={result.kind === 'image' ? result.dataUrl : result.url} download={`aksen-${mode}-${Date.now()}.${result.kind === 'image' ? 'png' : 'mp4'}`}><Download size={15} /> Download</a>
            {result.kind === 'image' && references.length < 4 && <button type="button" onClick={useResultAsReference}><ImagePlus size={15} /> Use as a reference</button>}
          </div>
        </div>
      )}
      {gallery.length > 0 && (
        <div className="media-gallery">
          <span>Recent generations</span>
          <div className="media-gallery-grid">
            {gallery.map((item) => (
              // A figure rather than a nested button: the tile itself is a
              // button that reuses the prompt, and a remove control inside it
              // would have been a button inside a button, which is invalid and
              // behaves differently in every browser.
              <figure className="media-gallery-item" key={item.id}>
                <button type="button" onClick={() => reuseFromGallery(item)} title={item.prompt}>
                  {item.kind === 'image' ? <img src={item.url} alt={item.prompt} /> : <video src={item.url} muted />}
                  <span>{item.kind === 'video' && <Video size={11} />} {timeAgo(item.createdAt)}</span>
                </button>
                <ConfirmAction
                  className="media-gallery-remove"
                  label="Remove"
                  confirmLabel="Remove"
                  pendingLabel="Removing"
                  title="Remove this generation from the gallery"
                  pending={removingAsset === item.id}
                  disabled={removingAsset !== null}
                  onConfirm={() => void removeAsset(item.id)}
                />
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
