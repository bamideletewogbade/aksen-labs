'use client';

import { useState } from 'react';
import { ArrowRight, Check, CircleAlert, CircleDashed, Loader2, Sparkles } from 'lucide-react';
import { youtubeVideoId, type InspirationAngle, type InspirationScript, type VideoReference } from '@/lib/media-inspiration';
import type { JevAnswers } from '@/lib/media-jev';

type StepId = 'reference' | 'angles' | 'jev' | 'script';
type StepStatus = 'waiting' | 'working' | 'done' | 'skipped' | 'failed';
type StepState = { status: StepStatus; detail: string };
type Steps = Record<StepId, StepState>;

const initialSteps: Steps = {
  reference: { status: 'waiting', detail: 'Waiting for a YouTube link.' },
  angles: { status: 'waiting', detail: 'Waiting for reference context.' },
  jev: { status: 'waiting', detail: 'Waiting for new angles.' },
  script: { status: 'waiting', detail: 'Waiting for your choice.' },
};

const agents: Array<{ id: StepId; label: string }> = [
  { id: 'reference', label: 'Reference reader' },
  { id: 'angles', label: 'Idea mapper' },
  { id: 'jev', label: 'Jev fit signal' },
  { id: 'script', label: 'Script architect' },
];

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'working') return <Loader2 size={16} className="icon-spin" aria-hidden="true" />;
  if (status === 'done') return <Check size={16} aria-hidden="true" />;
  if (status === 'failed') return <CircleAlert size={16} aria-hidden="true" />;
  return <CircleDashed size={16} aria-hidden="true" />;
}

async function requestStep<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/admin/media/inspiration', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'This step could not finish.');
  return data;
}

export function MediaInspirationWorkbench({ onDraft }: {
  onDraft: (input: { reference: VideoReference; angle: InspirationAngle; draft: InspirationScript; evaluationId?: string }) => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [ownTake, setOwnTake] = useState('');
  const [reference, setReference] = useState<VideoReference | null>(null);
  const [angles, setAngles] = useState<InspirationAngle[]>([]);
  const [jevSuggestion, setJevSuggestion] = useState<string | null>(null);
  const [jevAnswers, setJevAnswers] = useState<JevAnswers>({});
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Steps>(initialSteps);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canEmbed, setCanEmbed] = useState(true);
  const videoId = youtubeVideoId(url);

  function update(id: StepId, status: StepStatus, detail: string) {
    setSteps((current) => ({ ...current, [id]: { status, detail } }));
  }

  async function explore() {
    if (running) return;
    setRunning(true); setError(''); setAngles([]); setReference(null); setSelectedId(null); setJevSuggestion(null); setJevAnswers({}); setEvaluationId(null); setCanEmbed(true);
    setSteps({ ...initialSteps, reference: { status: 'working', detail: 'Checking the link and available metadata…' } });
    let stage: StepId = 'reference';
    try {
      const lookup = await requestStep<{ reference: VideoReference; note?: string; embeddable?: boolean }>({ step: 'lookup', url, title });
      const found = { ...lookup.reference, title: lookup.reference.title || title.trim() };
      if (!found.title) throw new Error('Add the video title. YouTube metadata is unavailable here.');
      setReference(found);
      setCanEmbed(lookup.embeddable !== false);
      update('reference', 'done', lookup.note || (lookup.embeddable === false ? 'Metadata found; this video cannot be embedded.' : 'Link and public metadata ready.'));
      stage = 'angles'; update(stage, 'working', 'Finding three original angles from your take…');
      const ideas = await requestStep<{ angles: InspirationAngle[] }>({ step: 'angles', reference: found, notes, ownTake });
      setAngles(ideas.angles);
      update(stage, 'done', 'Three angles ready. Passing them to Jev for a fit signal.');
      stage = 'jev'; update(stage, 'working', 'Evaluating fit without selecting for you…');
      const reading = await requestStep<{ status: 'shadow' | 'skipped' | 'unavailable'; evaluationId: string; suggestion?: string; answers?: JevAnswers; note: string }>({ step: 'jev', referenceUrl: found.url, angles: ideas.angles, ownTake });
      setEvaluationId(reading.evaluationId);
      setJevAnswers(reading.answers || {});
      if (reading.status === 'shadow' && reading.suggestion) setJevSuggestion(reading.suggestion);
      update(stage, reading.status === 'shadow' ? 'done' : 'skipped', reading.note);
      update('script', 'waiting', 'Choose the angle that sounds most like you.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'This step could not finish.';
      update(stage, 'failed', message); setError(message);
    } finally { setRunning(false); }
  }

  async function choose(angle: InspirationAngle) {
    if (!reference || !evaluationId || running) return;
    setSelectedId(angle.id); setRunning(true); setError('');
    update('script', 'working', 'Writing a short original script and scene plan…');
    try {
      await requestStep<{ recorded: boolean }>({ step: 'select', evaluationId, selectedAngle: angle.id });
      const result = await requestStep<{ draft: InspirationScript }>({ step: 'script', reference, angle, notes, ownTake });
      onDraft({ reference, angle, draft: result.draft, evaluationId });
      update('script', 'done', 'Draft handed to the episode planner for your edits and approval.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The script could not be written.';
      update('script', 'failed', message); setError(message);
    } finally { setRunning(false); }
  }

  return <section className="episode-inspiration" aria-labelledby="episode-inspiration-title">
    <div className="panel-head"><div><small>FROM REFERENCE TO ORIGINAL IDEA</small><h3 id="episode-inspiration-title">Start with a video that sparked a thought</h3></div><Sparkles size={21} /></div>
    <p>Paste a YouTube link, add what stood out, then tell us your own view or how you would apply it. The agents use the information you provide; they do not download or transcribe someone else&apos;s video.</p>
    <div className="episode-inspiration-inputs">
      <label>YouTube link<input type="url" value={url} onChange={(event) => { setUrl(event.target.value); setCanEmbed(true); }} placeholder="https://www.youtube.com/watch?v=…" /></label>
      <label>Video title <small>Useful if YouTube metadata is unavailable</small><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder="What is this video about?" /></label>
      <label>Your notes or a transcript you can provide <small>Optional; we will not invent missing content</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={7000} placeholder="A few points that stood out, with timestamps if useful" /></label>
      <label>Your own take or implementation <small>Required</small><textarea value={ownTake} onChange={(event) => setOwnTake(event.target.value)} maxLength={3000} placeholder="I agree with the idea, but for an African small business I would test…" /></label>
    </div>
    {videoId && <div className="episode-reference">{canEmbed ? <iframe title="YouTube reference video" src={'https://www.youtube-nocookie.com/embed/' + videoId} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <a href={'https://www.youtube.com/watch?v=' + videoId} target="_blank" rel="noopener noreferrer">Open this video on YouTube</a>}<p>Reference player only. Its footage is not added to your episode.</p></div>}
    <button type="button" className="episode-inspiration-run" disabled={running || !videoId || ownTake.trim().length < 20} onClick={() => void explore()}>{running ? 'Agents working…' : 'Explore original angles'} <ArrowRight size={16} /></button>
    <ol className="episode-agent-flow" aria-label="Inspiration agent workflow">
      {agents.map(({ id, label }) => <li key={id} className={'status-' + steps[id].status} aria-current={steps[id].status === 'working' ? 'step' : undefined}><span className="episode-agent-icon"><StatusIcon status={steps[id].status} /></span><div><strong>{label}</strong><small>{steps[id].status.replace('_', ' ')}</small><p>{steps[id].detail}</p></div></li>)}
    </ol>
    {angles.length > 0 && <div className="episode-angle-list"><h4>Choose your direction</h4><p>Jev checks founder fit and practical example separately. A suggestion appears only when both checks agree. Your selection decides what becomes a script.</p>{angles.map((angle) => <article key={angle.id} className={selectedId === angle.id ? 'selected' : ''}><div><strong>{angle.title}</strong>{jevSuggestion === angle.id && <span className="episode-jev-badge">Jev suggested</span>}{jevAnswers.founderFit?.choice === angle.id && <span className="episode-jev-badge">Founder fit</span>}{jevAnswers.practicalExample?.choice === angle.id && <span className="episode-jev-badge">Practical example</span>}</div><p><b>Hook:</b> {angle.hook}</p><p><b>Your contribution:</b> {angle.ownAngle}</p><p><b>Business example:</b> {angle.businessExample}</p><p><b>Reference link:</b> {angle.sourceConnection}</p><p><b>Check first:</b> {angle.proofNeeded}</p><button type="button" disabled={running || !evaluationId} onClick={() => void choose(angle)}>Use this angle <ArrowRight size={15} /></button></article>)}</div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <output className="episode-flow-live" aria-live="polite">{agents.find((agent) => steps[agent.id].status === 'working')?.label || (steps.script.status === 'done' ? 'Draft ready for your review.' : '')}</output>
  </section>;
}
