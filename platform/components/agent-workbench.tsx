'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download, FilePenLine, Mail } from 'lucide-react';
import { Spinner } from '@/components/ui/activity';
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
  // The copy offer, on the public side only. Closed until the draft exists and
  // the visitor has read it, because asking before then takes away the thing
  // that makes these worth trying: nothing to hand over.
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyEmail, setCopyEmail] = useState('');
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyDone, setCopyDone] = useState('');
  const [copyError, setCopyError] = useState('');
  const copyField = useRef<HTMLInputElement | null>(null);
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
  // Focus follows the click that opened the field. An autoFocus attribute would
  // do the same thing and also steal focus on first paint for anyone who lands
  // here with the form already open.
  useEffect(() => {
    if (copyOpen) copyField.current?.focus();
  }, [copyOpen]);
  function resetCopy() {
    setCopyOpen(false);
    setCopyBusy(false);
    setCopyDone('');
    setCopyError('');
  }
  function choose(id: string) {
    setSelected(id);
    setBrief('');
    setDraft(null);
    setError('');
    setSnapshot(false);
    resetCopy();
  }
  async function run(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || brief.trim().length < 30) return;
    setBusy(true);
    setError('');
    setDraft(null);
    resetCopy();
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
  async function sendCopy(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (copyBusy || !draft) return;
    setCopyBusy(true);
    setCopyError('');
    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'business_agent',
          email: copyEmail,
          tool: draft.name,
          note: brief,
          draft: draft.content,
        }),
      });
      const data = (await res.json()) as { sent?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || 'That did not send.');
      // `sent` is false when nothing can actually leave, and the wording has to
      // follow it. Telling somebody a copy is on its way when the queue has
      // nowhere to send it is the one outcome worth avoiding here.
      setCopyDone(
        data.sent
          ? `On its way to ${copyEmail}.`
          : 'Saved. A person will reply to that address.',
      );
    } catch (e) {
      setCopyError(e instanceof Error ? e.message : 'That did not send.');
    } finally {
      setCopyBusy(false);
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
        {admin ? (
          <div className="agent-admin-picker">
            <label htmlFor="admin-agent-select">
              What do you need help with?
            </label>
            <select
              id="admin-agent-select"
              value={selected}
              disabled={busy}
              onChange={(event) => choose(event.target.value)}
            >
              {agents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span>
              {agent.public
                ? 'Also available on the public website'
                : 'Private workspace tool'}
            </span>
          </div>
        ) : (
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
        )}
        <div className="agent-working-area">
          <div className="agent-task-heading">
            <span className="agent-kicker">
              {admin ? 'SELECTED TOOL' : 'TRY A BUSINESS AGENT'}
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
              className="agent-run pending-button"
              aria-busy={busy}
              disabled={busy || brief.trim().length < 30}
            >
              {/* The same sizing trick as PendingButton, applied by hand
                  because this uses the shared Button component and would
                  otherwise jump from "Run this agent" to the longer pending
                  label mid-click.

                  The face wrapper is not optional. The sizer and the visible
                  content share one grid cell, and bare text beside an icon is
                  an anonymous item that cannot be placed into it: without the
                  wrapper the icon lands in the cell and the words get pushed
                  into a second row and clipped. */}
              <span className="pending-button-sizer" aria-hidden="true">
                <span>Run this agent</span>
                <span>Preparing your draft…</span>
              </span>
              <span className="pending-button-face">
                {busy ? (
                  <>
                    <Spinner size={17} />
                    Preparing your draft…
                  </>
                ) : (
                  <>
                    <FilePenLine size={17} />
                    Run this agent
                  </>
                )}
              </span>
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
                <div className="agent-after">
                  {copyDone ? (
                    <p className="agent-copy-done">
                      <Check size={16} />
                      {copyDone}
                    </p>
                  ) : copyOpen ? (
                    <form className="agent-copy-form" onSubmit={sendCopy}>
                      <label htmlFor="agent-copy-email">
                        Where should it go?
                      </label>
                      <div className="agent-copy-row">
                        <input
                          id="agent-copy-email"
                          type="email"
                          required
                          ref={copyField}
                          disabled={copyBusy}
                          value={copyEmail}
                          placeholder="you@yourbusiness.com"
                          onChange={(e) => setCopyEmail(e.target.value)}
                          aria-describedby="agent-copy-note"
                        />
                        <Button
                          type="submit"
                          aria-busy={copyBusy}
                          disabled={copyBusy}
                        >
                          {copyBusy ? (
                            <Spinner size={16} />
                          ) : (
                            <Mail size={16} />
                          )}
                          {copyBusy ? 'Sending' : 'Send it'}
                        </Button>
                      </div>
                      {/* The privacy line above this section promises the log
                          keeps run details and not the brief. Giving us an
                          address changes that, so it says so here rather than
                          leaving the earlier promise quietly untrue. */}
                      <p id="agent-copy-note" className="agent-privacy">
                        This draft and what you wrote are kept with your address
                        so a person can follow up. Nothing else, and no list.
                      </p>
                      {copyError && (
                        <p role="alert" className="agent-error">
                          {copyError}
                        </p>
                      )}
                    </form>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="agent-copy-open"
                      onClick={() => setCopyOpen(true)}
                    >
                      <Mail size={16} />
                      Send this to yourself
                    </Button>
                  )}
                  <Link className="agent-next" href="/agent-mapper">
                    Discuss putting this into practice{' '}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
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
