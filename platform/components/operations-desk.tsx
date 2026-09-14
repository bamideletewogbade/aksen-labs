'use client';
import Link from 'next/link';
import {cleanAiText} from '@/lib/ai-text';
import {ResponseText} from '@/components/response-text';
import { useEffect, useState } from 'react';
import { operationTasks, demoScenarios } from '@/lib/operations-catalog';
import { agencyTemplates, templateText } from '@/lib/agency-templates';

type RecordOption = { id: string; name: string; company?: string };
type SavedDraft = {
  id: string;
  agent_name: string;
  trace: { content?: string; sourceLabel?: string };
};
export function OperationsDesk({
  mode = 'operations',
  initialLead = '',
}: {
  mode?: 'operations' | 'templates' | 'demos';
  initialLead?: string;
}) {
  const [data, setData] = useState<{
    leads: RecordOption[];
    projects: RecordOption[];
    businesses: RecordOption[];
    drafts: SavedDraft[];
    aiConfigured: boolean;
  } | null>(null);
  const [sourceType, setSourceType] = useState('lead');
  const [sourceId, setSourceId] = useState(initialLead);
  const [task, setTask] = useState<string>(operationTasks[0].id);
  const [demoId, setDemoId] = useState<string>(demoScenarios[0].id);
  const [templateId, setTemplateId] = useState(agencyTemplates[0].id);
  const [message, setMessage] = useState('');
  const [aiDraft, setAiDraft] = useState(mode !== 'templates');
  const [content, setContent] = useState(
    mode === 'templates' ? templateText(agencyTemplates[0].id) : '',
  );
  const [title, setTitle] = useState(
    mode === 'templates' ? agencyTemplates[0].name : '',
  );
  const [businessId, setBusinessId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [handoff, setHandoff] = useState(false);
  const demo = demoScenarios.find((item) => item.id === demoId)!;
  async function load() {
    try {
      const res = await fetch('/api/admin/operations');
      const body = (await res.json()) as {
        error?: string;
        content: string;
        sourceLabel: string;
        handoff: boolean;
        leads: RecordOption[];
        projects: RecordOption[];
        businesses: RecordOption[];
        drafts: SavedDraft[];
        aiConfigured: boolean;
      };
      if (!res.ok) throw Error(body.error || 'Request failed.');
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load records.');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/operations', { signal: controller.signal })
      .then(async (res) => {
        const body = (await res.json()) as NonNullable<typeof data> & {
          error?: string;
        };
        if (!res.ok) throw Error(body.error || 'Records unavailable.');
        setData(body);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            'Records unavailable. Check access and database connection.',
          );
      });
    return () => controller.abort();
  }, []);
  async function generate() {
    setBusy(true);
    setError('');
    setNotice('');
    setContent('');
    setHandoff(false);
    try {
      const res = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'demos'
            ? { demo: demoId, message }
            : { task, sourceType, sourceId },
        ),
      });
      const body = (await res.json()) as {
        error?: string;
        content: string;
        sourceLabel: string;
        handoff: boolean;
        leads: RecordOption[];
        projects: RecordOption[];
        businesses: RecordOption[];
        drafts: SavedDraft[];
        aiConfigured: boolean;
      };
      if (!res.ok) throw Error(body.error || 'Request failed.');
      setContent(body.content);
      setAiDraft(true);
      setTitle(
        `${mode === 'demos' ? demo.name : operationTasks.find((t) => t.id === task)!.name} — ${body.sourceLabel}`,
      );
      setHandoff(body.handoff);
      setNotice('Draft saved to AI activity. Review before using.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Draft failed.');
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveDocument',
          businessId,
          title,
          content,
          kind:
            mode === 'templates'
              ? agencyTemplates.find((t) => t.id === templateId)!.kind
              : 'note',
          evidenceStatus: aiDraft ? 'ai_draft' : 'internal',
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        content: string;
        sourceLabel: string;
        handoff: boolean;
        leads: RecordOption[];
        projects: RecordOption[];
        businesses: RecordOption[];
        drafts: SavedDraft[];
        aiConfigured: boolean;
      };
      if (!res.ok) throw Error(body.error || 'Request failed.');
      setNotice('Saved in the selected client workspace.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 80) || 'aksen-draft'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="ops-layout">
      <section className="admin-panel ops-controls">
        {mode === 'templates' ? (
          <>
            <label>
              Document template
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setAiDraft(false);
                  setContent(templateText(e.target.value));
                  setTitle(
                    agencyTemplates.find((t) => t.id === e.target.value)!.name,
                  );
                  setNotice('');
                }}
              >
                {agencyTemplates.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.stage} / {t.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Replace bracketed fields with verified information. Save a
              client-specific copy or download an editable Markdown document.
            </p>
            <Link href="/admin/workspaces">
              Open Clients & billing for invoices and receipts →
            </Link>
          </>
        ) : mode === 'demos' ? (
          <>
            <label>
              Service demo
              <select
                value={demoId}
                disabled={busy}
                onChange={(e) => {
                  setDemoId(e.target.value);
                  setMessage('');
                  setContent('');
                  setHandoff(false);
                }}
              >
                {demoScenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="ops-status">
              {demo.channel} · Fictional data · No external messages
            </p>
            <details>
              <summary>Approved demo knowledge</summary>
              <p>{demo.context}</p>
            </details>
            <div className="ops-example-list">
              {demo.examples.map((example) => (
                <button
                  disabled={busy}
                  type="button"
                  key={example}
                  onClick={() => setMessage(example)}
                >
                  {example}
                </button>
              ))}
            </div>
            <label>
              Customer message
              <textarea
                value={message}
                maxLength={1000}
                rows={3}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button
              disabled={busy || !message.trim() || !data?.aiConfigured}
              onClick={() => void generate()}
            >
              {busy ? 'Preparing reply…' : 'Run service demo'}
            </button>
          </>
        ) : (
          <>
            <label>
              AI task
              <select
                value={task}
                disabled={busy}
                onChange={(e) => setTask(e.target.value)}
              >
                {operationTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source type
              <select
                value={sourceType}
                disabled={busy}
                onChange={(e) => {
                  setSourceType(e.target.value);
                  setSourceId('');
                }}
              >
                <option value="lead">Enquiry</option>
                <option value="project">My project</option>
              </select>
            </label>
            <label>
              Record
              <select
                value={sourceId}
                disabled={busy}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">Choose a record</option>
                {(sourceType === 'lead' ? data?.leads : data?.projects)?.map(
                  (item) => (
                    <option value={item.id} key={item.id}>
                      {item.company || item.name}
                    </option>
                  ),
                )}
              </select>
            </label>
            <p>
              The assistant uses this record only. For proposals grounded in
              multiple documents, use the source-selection assistant in Clients
              & billing.
            </p>
            <button
              disabled={busy || !sourceId || !data?.aiConfigured}
              onClick={() => void generate()}
            >
              {busy ? 'Preparing draft…' : 'Prepare AI draft'}
            </button>
            <Link href="/admin/email">Review and send service emails →</Link>
          </>
        )}
        {data && !data.aiConfigured && mode !== 'templates' && (
          <p role="alert">
            AI needs OPENROUTER_API_KEY in the server environment.
          </p>
        )}
        {!data && <button onClick={() => void load()}>Reload records</button>}
        <details>
          <summary>Recent AI drafts</summary>
          {data?.drafts.length ? (
            data.drafts.map((d) => (
              <button
                className="ops-history"
                key={d.id}
                onClick={() => {
                  setContent(cleanAiText(d.trace.content || ''));
                  setAiDraft(true);
                  setTitle(
                    `${d.agent_name} — ${d.trace.sourceLabel || 'Draft'}`,
                  );
                  setNotice('Loaded a saved AI draft.');
                }}
              >
                {d.agent_name} / {d.trace.sourceLabel}
              </button>
            ))
          ) : (
            <p>No saved operations drafts yet.</p>
          )}
        </details>
      </section>
      <section className="admin-panel ops-editor">
        {error && (
          <p role="alert" className="ops-error">
            {error}
          </p>
        )}
        {notice && <output className="ops-status">{notice}</output>}
        {handoff && (
          <p className="ops-status">
            Human handoff required. In this demo, no staff notification is sent.
          </p>
        )}
        {content && <details className="response-preview" open={mode === 'demos'}><summary>Reading preview</summary><ResponseText text={content}/></details>}
        <label>
          Document title
          <input
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          {mode === 'demos' ? 'Demo response' : 'Editable draft'}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={22}
            maxLength={80000}
            placeholder="Your draft will appear here."
          />
        </label>
        <div className="ops-actions">
          <button disabled={!content} onClick={download}>
            Download .md
          </button>
          <Link href="/admin/email">Open email outbox</Link>
        </div>
        <label>
          Save a copy to a client workspace
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          >
            <option value="">Choose a workspace</option>
            {data?.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={busy || !content.trim() || !title.trim() || !businessId}
          onClick={() => void save()}
        >
          Save document copy
        </button>
      </section>
    </div>
  );
}
