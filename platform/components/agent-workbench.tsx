'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Download, Loader2, FilePenLine } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResponseText } from '@/components/response-text';
import type { AgentCard } from '@/lib/agent-workbench';

type Draft = {
  id: string;
  name: string;
  agentId: string;
  content: string;
  saved: boolean;
  createdAt: string;
  snapshotAt?: string | null;
};
type SavedDraft = {
  id: string;
  agent_name: string;
  agent_id: string;
  content: string;
  created_at: string;
  snapshot_at: string | null;
};
export function AgentWorkbench({
  agents,
  admin = false,
}: {
  agents: AgentCard[];
  admin?: boolean;
}) {
  const [selected, setSelected] = useState(agents[0].id);
  const [brief, setBrief] = useState('');
  const [snapshot, setSnapshot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<SavedDraft[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const agent = agents.find((item) => item.id === selected) || agents[0];
  const endpoint = admin
    ? '/api/admin/business-agents'
    : '/api/business-agents';
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!admin) return;
    const abort = new AbortController();
    fetch('/api/admin/business-agents', { signal: abort.signal })
      .then(async (res) => {
        const data = (await res.json()) as {
          error?: string;
          drafts?: SavedDraft[];
        };
        if (!res.ok) throw new Error(data.error || 'Saved drafts unavailable.');
        setHistory(Array.isArray(data.drafts) ? data.drafts : []);
        setHistoryError('');
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setHistoryError(
            e instanceof Error ? e.message : 'Saved drafts unavailable.',
          );
      });
    return () => abort.abort();
  }, [admin, historyRefresh]);
  function choose(id: string) {
    setSelected(id);
    setBrief('');
    setDraft(null);
    setError('');
    setSnapshot(false);
  }
  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (busy || brief.trim().length < 30) return;
    setBusy(true);
    setError('');
    setDraft(null);
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 60000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.signal,
        body: JSON.stringify({ agent: selected, brief, snapshot }),
      });
      const data = (await res.json()) as Partial<Draft> & { error?: string };
      if (!res.ok)
        throw new Error(data.error || 'The agent could not finish this draft.');
      if (typeof data.content !== 'string')
        throw new Error('No draft was returned.');
      const completed = data as Draft;
      setDraft(completed);
      if (completed.saved) {
        setHistory((items) =>
          [
            {
              id: completed.id,
              agent_name: completed.name,
              agent_id: completed.agentId,
              content: completed.content,
              created_at: completed.createdAt,
              snapshot_at: completed.snapshotAt || null,
            },
            ...items,
          ].slice(0, 12),
        );
        setHistoryError('');
      }
    } catch (e) {
      setError(
        abort.signal.aborted
          ? 'This is taking longer than expected. Your brief is still here. For an admin run, check saved drafts before trying again.'
          : e instanceof Error
            ? e.message
            : 'The agent is unavailable.',
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }
  function download() {
    if (!draft) return;
    const blob = new Blob(
      [
        `${draft.name}\nDraft for human review · ${draft.createdAt}\n\n${draft.content}`,
      ],
      { type: 'text/plain;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aksen-${draft.agentId}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="agent-workbench">
      <div className="agent-workbench-layout">
        <nav className="agent-picker" aria-label="Choose a business agent">
          {agents.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              disabled={busy}
              aria-pressed={selected === item.id}
              className={`agent-choice ${selected === item.id ? 'is-selected' : ''}`}
              onClick={() => choose(item.id)}
            >
              <span className="agent-choice-name">{item.name}</span>
              <span className="agent-choice-job">{item.job}</span>
              <span className="agent-choice-access">
                {admin
                  ? item.public
                    ? 'Also available to visitors'
                    : 'Admin only'
                  : 'Free AI draft'}
              </span>
            </Button>
          ))}
        </nav>
        <div className="agent-working-area">
          <div className="agent-task-heading">
            <span className="agent-kicker">
              {admin ? 'AKSEN AGENT DESK' : 'TRY A BUSINESS AGENT'}
            </span>
            <h2>{agent.name}</h2>
            <p>{agent.job}</p>
          </div>
          <form onSubmit={run} className="agent-brief-form">
            <label htmlFor="agent-brief">Your brief</label>
            <p id="agent-input-help">{agent.input}</p>
            <Textarea
              id="agent-brief"
              aria-describedby="agent-input-help agent-privacy"
              value={brief}
              maxLength={8000}
              minLength={30}
              required
              disabled={busy}
              rows={8}
              onChange={(e) => {
                setBrief(e.target.value);
                setDraft(null);
              }}
              placeholder="Describe one real problem, or try the fictional example below."
            />
            <div className="agent-brief-actions">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setBrief(agent.sample);
                  setDraft(null);
                  setError('');
                  setSnapshot(false);
                }}
              >
                Use a fictional example
              </Button>
              <span>{brief.length.toLocaleString()} / 8,000</span>
            </div>
            {admin && selected === 'founder-review' && (
              <label className="agent-snapshot">
                <input
                  type="checkbox"
                  checked={snapshot}
                  disabled={busy}
                  onChange={(e) => {
                    setSnapshot(e.target.checked);
                    setDraft(null);
                  }}
                />
                <span>
                  Include my latest project records
                  <br />
                  <small>
                    Up to 25 projects you own, including status, objective and
                    next step. Sent with your brief to the AI provider.
                  </small>
                </span>
              </label>
            )}
            <div className="agent-output-promise">
              <strong>What you’ll get</strong>
              <p>{agent.output}</p>
              <p className="agent-boundary">{agent.boundary}</p>
            </div>
            <p id="agent-privacy" className="agent-privacy">
              {admin
                ? 'Your brief goes to the AI provider. Completed drafts are saved in your admin history. Use authorised business information and remove credentials.'
                : 'Use non-sensitive information. Your brief goes to the AI provider; Aksen’s public activity log stores run details, not your brief or result. Download anything you want to keep.'}
            </p>
            <Button
              type="submit"
              className="agent-run"
              disabled={busy || brief.trim().length < 30}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Preparing your draft…
                </>
              ) : (
                <>
                  <FilePenLine size={17} />
                  Run this agent
                </>
              )}
            </Button>
            {error && (
              <p role="alert" className="agent-error">
                {error}
              </p>
            )}
          </form>
          {draft && (
            <section className="agent-result" aria-label="Agent draft">
              <div className="agent-result-heading">
                <div>
                  <span className="agent-kicker">
                    {draft.saved ? 'SAVED DRAFT' : 'YOUR DRAFT'}
                  </span>
                  <h3>{draft.name}</h3>
                </div>
                <Button type="button" variant="outline" onClick={download}>
                  <Download size={16} />
                  Download
                </Button>
              </div>
              <output className="agent-result-status">
                Ready for your review. Check facts and assumptions before
                acting.
              </output>
              {draft.snapshotAt && (
                <p className="agent-privacy">
                  Project snapshot:{' '}
                  {new Date(draft.snapshotAt).toLocaleString()}. A current view,
                  not a weekly financial report.
                </p>
              )}
              <ResponseText text={draft.content} />
              {!admin && (
                <Link className="agent-next" href="/agent-mapper">
                  Discuss putting this into practice <ArrowUpRight size={17} />
                </Link>
              )}
            </section>
          )}
        </div>
      </div>
      {admin && (
        <section className="agent-history">
          <h2>Recent saved drafts</h2>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setHistoryRefresh((value) => value + 1)}
          >
            Refresh saved drafts
          </Button>
          {historyError && <output>{historyError}</output>}
          {!history.length && !historyError && (
            <p>Your completed drafts will appear here.</p>
          )}
          <div>
            {history.map((item) => (
              <Button
                type="button"
                variant="outline"
                key={item.id}
                disabled={busy}
                onClick={() => {
                  if (!agents.some((a) => a.id === item.agent_id)) return;
                  choose(item.agent_id);
                  setDraft({
                    id: item.id,
                    agentId: item.agent_id,
                    name: item.agent_name,
                    content: item.content,
                    createdAt: item.created_at,
                    saved: true,
                    snapshotAt: item.snapshot_at,
                  });
                }}
              >
                <span>{item.agent_name}</span>
                <small>{new Date(item.created_at).toLocaleDateString()}</small>
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
