'use client';

import { useEffect, useState } from 'react';
import type { JevAnswers, JevOutcome } from '@/lib/media-jev';

type Evaluation = { id: string; referenceUrl: string; status: string; provider: string; model: string | null; promptVersion: string;
  answers: JevAnswers; suggestion: string | null; selectedAngle: string | null; outcome: JevOutcome;
  inputTokens: number | null; outputTokens: number | null; latencyMs: number | null; costMicros: number | null;
  createdAt: string; episode: { id: string; title: string; status: string } | null };
type Summary = { attempts: number; evaluated: number; comparable: number; agreement: number; labeled: number; published: number;
  inputTokens: number; outputTokens: number; averageLatencyMs: number | null;
  qualityWhenAgreed: { count: number; average: number | null }; qualityWhenDisagreed: { count: number; average: number | null } };

export function MediaJevEvaluationBoard() {
  const [rows, setRows] = useState<Evaluation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/media/jev-evaluations', { cache: 'no-store' });
      const data = await response.json() as { evaluations?: Evaluation[]; summary?: Summary; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not load Jev evaluations.');
      setRows(data.evaluations || []); setSummary(data.summary || null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load Jev evaluations.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let live = true;
    fetch('/api/admin/media/jev-evaluations', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json() as { evaluations?: Evaluation[]; summary?: Summary; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not load Jev evaluations.');
      if (live) { setRows(data.evaluations || []); setSummary(data.summary || null); setLoading(false); }
    }).catch((cause: unknown) => { if (live) { setError(cause instanceof Error ? cause.message : 'Could not load Jev evaluations.'); setLoading(false); } });
    return () => { live = false; };
  }, []);

  function edit(id: string, change: Partial<JevOutcome>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, outcome: { ...row.outcome, ...change } } : row));
  }

  async function save(row: Evaluation) {
    setBusyId(row.id); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/media/jev-evaluations', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: row.id, outcome: row.outcome }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save outcome.');
      setMessage('Outcome saved as a manual observation.');
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save outcome.'); }
    finally { setBusyId(null); }
  }

  return <section className="episode-jev-board" aria-labelledby="episode-jev-board-title">
    <div className="episode-scenes-head"><div><h3 id="episode-jev-board-title">Jev learning board</h3><p>Compare typed suggestions with your choices and the episodes that follow. Performance numbers below are entered manually until social accounts are connected.</p></div><button type="button" onClick={() => void refresh()} disabled={loading}>Refresh</button></div>
    {summary && <div className="episode-jev-summary"><span><strong>{summary.evaluated}</strong> Jev evaluations</span><span><strong>{summary.agreement}/{summary.comparable}</strong> suggestions chosen</span><span><strong>{summary.labeled}</strong> quality ratings</span><span><strong>{summary.published}</strong> marked published</span><span><strong>{summary.averageLatencyMs ?? '—'} ms</strong> average Jev response</span><span><strong>{summary.inputTokens + summary.outputTokens}</strong> recorded tokens</span></div>}
    {summary && (summary.qualityWhenAgreed.count > 0 || summary.qualityWhenDisagreed.count > 0) && <p className="episode-jev-comparison">Manual editorial quality: Jev and founder agreed {summary.qualityWhenAgreed.average ?? '—'}/5 ({summary.qualityWhenAgreed.count} rated); disagreed {summary.qualityWhenDisagreed.average ?? '—'}/5 ({summary.qualityWhenDisagreed.count} rated). Small samples are descriptive, not proof that Jev improves results.</p>}
    {loading && <output>Loading evaluations…</output>}
    {!loading && !rows.length && <p>No evaluations yet. Explore a YouTube idea, then choose an angle to start collecting comparisons.</p>}
    <div className="episode-jev-history">{rows.map((row) => <article key={row.id}>
      <div><strong>{row.episode?.title || 'Idea exploration'}</strong><span>{new Date(row.createdAt).toLocaleDateString()} · {row.status} · {row.episode?.status || 'no saved episode'}</span></div>
      <p>Founder fit: {row.answers?.founderFit?.choice || '—'} · Practical example: {row.answers?.practicalExample?.choice || '—'} · Jev suggestion: {row.suggestion || 'none'} · Your choice: {row.selectedAngle || 'pending'}</p>
      <small>{row.provider} · {row.model || 'Jev not run'} · {row.promptVersion} · {row.latencyMs ?? '—'} ms · {row.inputTokens ?? '—'} input / {row.outputTokens ?? '—'} output tokens · Provider cost {row.costMicros == null ? 'unavailable' : `$${(row.costMicros / 1_000_000).toFixed(4)}`}</small>
      <div className="episode-jev-outcome"><label>Editorial quality<select value={row.outcome?.editorialQuality || ''} onChange={(event) => edit(row.id, { editorialQuality: event.target.value ? Number(event.target.value) : undefined })}><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value}/5</option>)}</select></label><label>Published?<select value={row.outcome?.published == null ? '' : String(row.outcome.published)} onChange={(event) => edit(row.id, { published: event.target.value ? event.target.value === 'true' : undefined })}><option value="">Unknown</option><option value="false">No</option><option value="true">Yes, manually confirmed</option></select></label><label>Views<input type="number" min="0" value={row.outcome?.views ?? ''} onChange={(event) => edit(row.id, { views: event.target.value ? Number(event.target.value) : undefined })} placeholder="Manual" /></label><label>Average watch (seconds)<input type="number" min="0" max="1800" step="0.1" value={row.outcome?.averageWatchSeconds ?? ''} onChange={(event) => edit(row.id, { averageWatchSeconds: event.target.value ? Number(event.target.value) : undefined })} placeholder="Manual" /></label><label className="episode-jev-note">What changed or worked?<input value={row.outcome?.notes || ''} maxLength={500} onChange={(event) => edit(row.id, { notes: event.target.value })} placeholder="A brief editorial observation" /></label><button type="button" onClick={() => void save(row)} disabled={busyId === row.id}>{busyId === row.id ? 'Saving…' : 'Save outcome'}</button></div>
    </article>)}</div>
    {message && <output>{message}</output>}{error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
