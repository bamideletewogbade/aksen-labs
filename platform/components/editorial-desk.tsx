'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Clock3,
  ExternalLink,
  FilePenLine,
  Radar,
  Sparkles,
} from 'lucide-react';
import { CADENCE_LABEL, type Cadence } from '@/lib/automation-schedule';
import { editorialSources } from '@/lib/editorial-sources';

type Idea = {
  id: string;
  title: string;
  angle: string;
  why_now: string;
  category: string;
  score: number;
  status: 'inbox' | 'drafted' | 'dismissed';
  post_id?: string | null;
  sources: Array<{ title: string; url: string }>;
};
type Payload = {
  settings: {
    enabled: boolean;
    cadence: Cadence;
    run_hour: number;
    auto_draft: boolean;
  };
  ideas: Idea[];
  runs: Array<{
    status: string;
    found: number;
    note?: string;
    created_at: string;
  }>;
};

export function EditorialDesk() {
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [cadence, setCadence] = useState<Cadence>('manual');
  const [hour, setHour] = useState(8);
  const [autoDraft, setAutoDraft] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/editorial', { cache: 'no-store' });
    if (!response.ok)
      throw new Error('The editorial desk could not be loaded.');
    const next = (await response.json()) as Payload;
    setData(next);
    setCadence(next.settings.cadence);
    setHour(next.settings.run_hour);
    setAutoDraft(next.settings.auto_draft);
  }, []);
  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  async function act(action: string, id?: string) {
    setBusy(id || action);
    setMessage('');
    try {
      const response = await fetch('/api/admin/editorial', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          action === 'schedule'
            ? { action, cadence, runHour: hour, autoDraft }
            : { action, id },
        ),
      });
      const result = (await response.json()) as {
        error?: string;
        note?: string;
      };
      if (!response.ok)
        throw new Error(result.error || 'That action could not finish.');
      if (action === 'draft') {
        window.location.reload();
        return;
      }
      setMessage(
        result.note ||
          (action === 'schedule' ? 'Editorial schedule saved.' : 'Updated.'),
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'That action could not finish.',
      );
    } finally {
      setBusy('');
    }
  }

  const inbox = data?.ideas.filter((idea) => idea.status === 'inbox') || [];
  const history = data?.ideas.filter((idea) => idea.status !== 'inbox') || [];
  const lastRun = data?.runs[0];

  return (
    <section
      className="admin-panel editorial-desk arrive"
      aria-labelledby="editorial-title"
    >
      <div className="editorial-lead">
        <div>
          <small>EDITORIAL AGENT</small>
          <h2 id="editorial-title">Find the signal. Keep the point of view.</h2>
          <p>
            Scans trusted product, engineering and African tech sources, then
            turns developments into evidence-backed angles for Aksen. It never
            publishes.
          </p>
        </div>
        <button
          className="admin-primary"
          onClick={() => act('research')}
          disabled={Boolean(busy)}
        >
          <Radar size={16} />{' '}
          {busy === 'research' ? 'Researching…' : 'Find fresh ideas'}
        </button>
      </div>

      <div className="editorial-flow" aria-label="Editorial workflow">
        <span>
          <Radar /> Research
        </span>
        <i>→</i>
        <span>
          <Sparkles /> Rank ideas
        </span>
        <i>→</i>
        <span>
          <FilePenLine /> Prepare draft
        </span>
        <i>→</i>
        <span>
          <Bot /> You approve
        </span>
      </div>

      <div className="editorial-settings">
        <label>
          Run automatically
          <select
            value={cadence}
            onChange={(event) => setCadence(event.target.value as Cadence)}
          >
            {Object.entries(CADENCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start after
          <select
            value={hour}
            onChange={(event) => setHour(Number(event.target.value))}
          >
            {Array.from({ length: 24 }, (_, value) => (
              <option key={value} value={value}>
                {String(value).padStart(2, '0')}:00 UTC
              </option>
            ))}
          </select>
        </label>
        <label className="editorial-check">
          <input
            type="checkbox"
            checked={autoDraft}
            onChange={(event) => setAutoDraft(event.target.checked)}
          />
          Prepare the strongest idea as a draft
        </label>
        <button
          className="admin-secondary"
          onClick={() => act('schedule')}
          disabled={Boolean(busy)}
        >
          <Clock3 size={15} /> Save schedule
        </button>
      </div>
      {message && (
        <p className="editorial-message" role="status">
          {message}
        </p>
      )}
      {lastRun && (
        <p className="editorial-last">
          Last research: {lastRun.note || `${lastRun.found} ideas found.`}
        </p>
      )}

      <div className="editorial-section-head">
        <div>
          <small>IDEA INBOX</small>
          <h3>
            {inbox.length
              ? `${inbox.length} angles worth your attention`
              : 'Ready for the next scan'}
          </h3>
        </div>
      </div>
      {inbox.length ? (
        <div className="editorial-ideas">
          {inbox.map((idea) => (
            <article key={idea.id} className="editorial-idea">
              <div className="editorial-score">
                <strong>{idea.score}</strong>
                <span>/ 100</span>
              </div>
              <div>
                <small>{idea.category}</small>
                <h3>{idea.title}</h3>
                <p className="editorial-why">{idea.why_now}</p>
                <p>{idea.angle}</p>
                <div className="editorial-links">
                  {idea.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
                <div className="editorial-actions">
                  <button
                    className="admin-primary"
                    onClick={() => act('draft', idea.id)}
                    disabled={Boolean(busy)}
                  >
                    {busy === idea.id ? 'Preparing…' : 'Prepare article draft'}
                  </button>
                  <button
                    className="admin-text-button"
                    onClick={() => act('dismiss', idea.id)}
                    disabled={Boolean(busy)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-admin">
          <strong>No ideas waiting.</strong>
          <span>
            Run a fresh scan when you want a new set of sourced angles.
          </span>
        </div>
      )}

      <details className="editorial-sources">
        <summary>
          What the agent watches <span>{editorialSources.length} sources</span>
        </summary>
        <div>
          {editorialSources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <strong>{source.name}</strong>
                <small>
                  {source.kind} · {source.focus}
                </small>
              </span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </details>
      {history.length > 0 && (
        <details className="editorial-history">
          <summary>
            Drafted and dismissed ideas <span>{history.length}</span>
          </summary>
          <ul>
            {history.map((idea) => (
              <li key={idea.id}>
                <span>
                  <strong>{idea.title}</strong>
                  <small>
                    {idea.status === 'drafted' ? 'Draft prepared' : 'Dismissed'}
                  </small>
                </span>
                {idea.status === 'dismissed' && (
                  <button
                    className="admin-text-button"
                    onClick={() => act('restore', idea.id)}
                  >
                    Restore
                  </button>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
