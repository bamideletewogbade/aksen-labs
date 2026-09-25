'use client';

import Link from 'next/link';
import { cleanAiText } from '@/lib/ai-text';
import { ResponseText } from '@/components/response-text';
import { useEffect, useMemo, useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
import { operationTasks, demoScenarios } from '@/lib/operations-catalog';
import { agencyTemplates, templateText } from '@/lib/agency-templates';
import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Search,
  Sparkles,
  Zap,
  RefreshCw,
  Columns2,
  FilePenLine,
  ScrollText,
} from 'lucide-react';

type RecordOption = { id: string; name: string; company?: string };
type SavedDraft = {
  id: string;
  agent_name: string;
  trace: { content?: string; sourceLabel?: string };
};

const STAGES = ['All', 'Discover', 'Agree', 'Deliver', 'Launch', 'Retain'] as const;

export function OperationsDesk({
  mode = 'operations',
  initialLead = '',
  initialTask = '',
}: {
  mode?: 'operations' | 'templates' | 'demos';
  initialLead?: string;
  initialTask?: string;
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
  const [task, setTask] = useState<string>(
    initialTask && operationTasks.some((t) => t.id === initialTask)
      ? initialTask
      : operationTasks[0].id,
  );
  const [demoId, setDemoId] = useState<string>(demoScenarios[0].id);
  const [templateId, setTemplateId] = useState(agencyTemplates[0].id);
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [templateSearch, setTemplateSearch] = useState('');

  // Quick fill variables for templates
  const [clientVar, setClientVar] = useState('');
  const [projectVar, setProjectVar] = useState('');
  const [ownerVar, setOwnerVar] = useState('');
  const [dateVar, setDateVar] = useState(() => new Date().toISOString().slice(0, 10));
  const [feeVar, setFeeVar] = useState('');

  // View mode: 'split' | 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [copied, setCopied] = useState(false);

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
  const currentTemplate = agencyTemplates.find((t) => t.id === templateId) || agencyTemplates[0];

  const filteredTemplates = useMemo(() => {
    return agencyTemplates.filter((t) => {
      const matchesStage = selectedStage === 'All' || t.stage === selectedStage;
      const matchesSearch =
        !templateSearch.trim() ||
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.stage.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.content.toLowerCase().includes(templateSearch.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [selectedStage, templateSearch]);

  const remainingPlaceholders = useMemo(() => {
    const matches = content.match(/\[([^\]]+)\]/g) || [];
    return Array.from(new Set(matches));
  }, [content]);

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
              ? agencyTemplates.find((t) => t.id === templateId)?.kind || 'note'
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

  async function copyMarkdown() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setNotice('Failed to copy to clipboard automatically.');
    }
  }

  function applyQuickFill() {
    if (!content) return;
    let updated = content;
    if (clientVar.trim()) {
      updated = updated.replace(/\[client(\s*\/[^\]]+)?\]/gi, clientVar.trim());
      updated = updated.replace(/\[legal entity to confirm\]/gi, clientVar.trim());
    }
    if (projectVar.trim()) {
      updated = updated.replace(/\[project\]/gi, projectVar.trim());
    }
    if (ownerVar.trim()) {
      updated = updated.replace(/\[name\]/gi, ownerVar.trim());
      updated = updated.replace(/\[owner\]/gi, ownerVar.trim());
    }
    if (dateVar.trim()) {
      updated = updated.replace(/\[date\]/gi, dateVar.trim());
    }
    if (feeVar.trim()) {
      updated = updated.replace(/\[agreed amount\]/gi, feeVar.trim());
      updated = updated.replace(/\[fee\]/gi, feeVar.trim());
      updated = updated.replace(/\[estimate in GHS\]/gi, feeVar.trim());
    }
    setContent(updated);
    setNotice('Variables replaced in document draft.');
  }

  function resetToMaster() {
    setContent(templateText(templateId));
    setTitle(agencyTemplates.find((t) => t.id === templateId)?.name || '');
    setNotice('Restored original master template.');
  }

  function selectTemplate(id: string) {
    setTemplateId(id);
    setAiDraft(false);
    setContent(templateText(id));
    setTitle(agencyTemplates.find((t) => t.id === id)?.name || '');
    setNotice('');
  }

  // Render for Document Templates Mode
  if (mode === 'templates') {
    return (
      <div className="template-desk-layout">
        {/* Left Column: Template Navigator & Filters */}
        <section className="admin-panel template-catalog">
          <div className="template-search-wrap">
            <Search size={15} className="template-search-icon" />
            <input
              type="search"
              className="template-search"
              placeholder="Search templates or keywords..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
            />
          </div>

          <div className="template-stage-tabs" role="tablist">
            {STAGES.map((stage) => {
              const count =
                stage === 'All'
                  ? agencyTemplates.length
                  : agencyTemplates.filter((t) => t.stage === stage).length;
              const isActive = selectedStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`template-stage-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedStage(stage)}
                >
                  {stage} <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="template-list">
            {filteredTemplates.map((t) => {
              const isSelected = t.id === templateId;
              return (
                <button
                  type="button"
                  key={t.id}
                  className={`template-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectTemplate(t.id)}
                >
                  <div className="template-card-header">
                    <span className="template-pill stage-pill">{t.stage}</span>
                    <span className="template-pill kind-pill">{t.kind}</span>
                  </div>
                  <strong className="template-card-title">{t.name}</strong>
                </button>
              );
            })}
            {filteredTemplates.length === 0 && (
              <p className="ops-status">No templates match &ldquo;{templateSearch}&rdquo;.</p>
            )}
          </div>

          <div className="template-catalog-footer">
            <Link href="/admin/operations" className="template-footer-link">
              <FilePenLine size={14} /> Open AI draft creator
            </Link>
            <Link href="/admin/workspaces" className="template-footer-link">
              <ScrollText size={14} /> View client workspaces
            </Link>
          </div>
        </section>

        {/* Right Column: Template Studio Workspace */}
        <section className="admin-panel template-workspace">
          {error && <p role="alert" className="ops-error">{error}</p>}
          {notice && <output className="ops-status">{notice}</output>}

          {/* Active Template Meta & Quick Controls */}
          <div className="template-workspace-header">
            <div className="template-active-meta">
              <h2>{currentTemplate.name}</h2>
              <div className="template-meta-tags">
                <span className="template-pill stage-pill">{currentTemplate.stage}</span>
                <span className="template-pill kind-pill">{currentTemplate.kind}</span>
                {remainingPlaceholders.length === 0 ? (
                  <span className="template-pill pill-done">
                    <Check size={12} /> Placeholders complete
                  </span>
                ) : (
                  <span className="template-pill pill-pending">
                    {remainingPlaceholders.length} bracketed {remainingPlaceholders.length === 1 ? 'item' : 'items'} to fill
                  </span>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="template-view-switcher">
              <button
                type="button"
                className={viewMode === 'split' ? 'active' : ''}
                title="Split editor and preview"
                onClick={() => setViewMode('split')}
              >
                <Columns2 size={15} /> Split
              </button>
              <button
                type="button"
                className={viewMode === 'edit' ? 'active' : ''}
                title="Edit markdown draft"
                onClick={() => setViewMode('edit')}
              >
                <FileText size={15} /> Edit
              </button>
              <button
                type="button"
                className={viewMode === 'preview' ? 'active' : ''}
                title="Formatted reading preview"
                onClick={() => setViewMode('preview')}
              >
                <Eye size={15} /> Preview
              </button>
            </div>
          </div>

          {/* Client Quick-Fill Variables Bar */}
          <details className="template-fill-panel" open>
            <summary className="template-fill-summary">
              <Zap size={14} /> Client Quick-Fill Variables
              <small>Auto-populate [client], [project], [owner], [date] and [fee]</small>
            </summary>
            <div className="template-var-grid">
              <label>
                Client / Company
                <input
                  value={clientVar}
                  placeholder="e.g. Cedar Home Ltd"
                  onChange={(e) => setClientVar(e.target.value)}
                />
              </label>
              <label>
                Project name
                <input
                  value={projectVar}
                  placeholder="e.g. WhatsApp Inbound Capture"
                  onChange={(e) => setProjectVar(e.target.value)}
                />
              </label>
              <label>
                Owner / Contact
                <input
                  value={ownerVar}
                  placeholder="e.g. Kofi Mensah"
                  onChange={(e) => setOwnerVar(e.target.value)}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={dateVar}
                  onChange={(e) => setDateVar(e.target.value)}
                />
              </label>
              <label>
                Budget / Retainer
                <input
                  value={feeVar}
                  placeholder="e.g. $297/mo (GHS 3,500/mo)"
                  onChange={(e) => setFeeVar(e.target.value)}
                />
              </label>
            </div>
            <div className="template-var-actions">
              <button type="button" className="btn-apply-var" onClick={applyQuickFill}>
                <Sparkles size={14} /> Fill Variables into Draft
              </button>
              <button type="button" className="btn-reset-var" onClick={resetToMaster}>
                <RefreshCw size={14} /> Reset Template
              </button>
            </div>
          </details>

          {/* Document Title */}
          <label className="template-title-label">
            Document title
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          {/* Main Content Area based on View Mode */}
          <div className={`template-editor-container mode-${viewMode}`}>
            {(viewMode === 'split' || viewMode === 'edit') && (
              <div className="template-editor-pane">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  maxLength={80000}
                  className="template-textarea"
                  placeholder="Document template content..."
                />
              </div>
            )}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div className="template-preview-pane">
                <div className="preview-scroll">
                  <ResponseText text={content || '_No template content._'} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="template-action-bar">
            <div className="template-left-actions">
              <button
                type="button"
                className="btn-action"
                onClick={() => void copyMarkdown()}
                disabled={!content}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied Markdown!' : 'Copy Markdown'}
              </button>
              <button
                type="button"
                className="btn-action"
                onClick={download}
                disabled={!content}
              >
                <Download size={14} /> Download .md
              </button>
            </div>

            <div className="template-right-actions">
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="template-workspace-select"
              >
                <option value="">Save to workspace...</option>
                {data?.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-save-workspace"
                disabled={busy || !content.trim() || !title.trim() || !businessId}
                onClick={() => void save()}
              >
                Save to Client Workspace
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Render for Operations / Demos Mode
  return (
    <div className="ops-layout">
      <section className="admin-panel ops-controls">
        {mode === 'demos' ? (
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
            <PendingButton
              pending={busy}
              pendingLabel="Preparing reply"
              disabled={!message.trim() || !data?.aiConfigured}
              onClick={() => void generate()}
            >
              Run service demo
            </PendingButton>
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
              &amp; billing.
            </p>
            <PendingButton
              pending={busy}
              pendingLabel="Preparing draft"
              disabled={!sourceId || !data?.aiConfigured}
              onClick={() => void generate()}
            >
              Prepare AI draft
            </PendingButton>
            <Link href="/admin/email">Review and send service emails →</Link>
          </>
        )}
        {data && !data.aiConfigured && (
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

        <div className="ops-view-header">
          <label style={{ flex: 1 }}>
            Document title
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="template-view-switcher">
            <button
              type="button"
              className={viewMode === 'edit' ? 'active' : ''}
              onClick={() => setViewMode('edit')}
              title="Edit draft"
            >
              <FileText size={14} /> Edit
            </button>
            <button
              type="button"
              className={viewMode === 'split' ? 'active' : ''}
              onClick={() => setViewMode('split')}
              title="Split view"
            >
              <Columns2 size={14} /> Split
            </button>
            <button
              type="button"
              className={viewMode === 'preview' ? 'active' : ''}
              onClick={() => setViewMode('preview')}
              title="Reading preview"
            >
              <Eye size={14} /> Preview
            </button>
          </div>
        </div>

        <div className={`template-editor-container mode-${viewMode}`}>
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className="template-editor-pane">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                maxLength={80000}
                placeholder="Your draft will appear here."
              />
            </div>
          )}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="template-preview-pane">
              <div className="preview-scroll">
                <ResponseText text={content || '_No draft content yet. Click Prepare AI draft._'} />
              </div>
            </div>
          )}
        </div>

        <div className="ops-actions">
          <button
            type="button"
            disabled={!content}
            onClick={() => void copyMarkdown()}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied Markdown!' : 'Copy Markdown'}
          </button>
          <button disabled={!content} onClick={download}>
            <Download size={14} /> Download .md
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
