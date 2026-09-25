'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SkeletonRows, Spinner } from '@/components/ui/activity';
import { LeadFilterBar } from '@/components/lead-filter-bar';
import { LeadSchedule } from '@/components/lead-schedule';
import { LeadImporter } from '@/components/lead-importer';
import { AdminTabs } from '@/components/admin-tabs';
import {
  EMPTY_FILTER,
  filterLeads,
  type LeadFilter,
  type StoredLead,
} from '@/lib/lead-filters';
import type { Cadence } from '@/lib/automation-schedule';
// The stored shape is defined beside the filter rules rather than here, so a
// column the filter reads can never go missing from the type the list uses.
type Lead = StoredLead;
type RunEvent = {
  id?: string;
  run_id?: string;
  runId?: string;
  stage: 'scout' | 'enrich' | 'verify' | 'save';
  status: 'active' | 'completed' | 'failed' | 'skipped';
  message: string;
  details?: Record<string, number | string>;
  created_at?: string;
};
type Data = {
  campaign: {
    id: string;
    target: string;
    enabled: boolean;
    next_run_at: string;
    running_until: string | null;
    cadence: Cadence;
    run_hour: number;
    max_per_day: number;
    last_scheduled_at: string | null;
  } | null;
  leads: Lead[];
  runs: {
    id: string;
    status: string;
    found: number;
    note: string;
    created_at: string;
  }[];
  events: RunEvent[];
  aiConfigured: boolean;
  /** null when the workspace is uncapped, which is not the same as none left. */
  remainingRuns: number | null;
  dailyRuns: number;
  targetMaxLength: number;
};
const researchAgents = [
  {
    stage: 'scout',
    name: 'Scout',
    job: 'Finds matching businesses and official websites.',
  },
  {
    stage: 'enrich',
    name: 'Enricher',
    job: 'Collects public business facts and contact details.',
  },
  {
    stage: 'verify',
    name: 'Evidence gate',
    job: 'Rejects claims and contacts unsupported by sources.',
  },
  {
    stage: 'save',
    name: 'CRM agent',
    job: 'Deduplicates and saves records for your review.',
  },
] as const;

export const JEV_MARKET_PRESETS = [
  {
    id: 'tema-logistics',
    label: '🚢 Tema Port Logistics & Clearing',
    description: 'Customs clearance, freight forwarders, bonded warehouses',
    target: `## Objective\nFind active freight forwarders, customs clearance agents, and logistics providers based in or operating around Tema, Ghana.\n\n## Target Profiles\n- Customs clearing agencies, freight forwarders, and bonded warehouse operators\n- Operating around Tema Port and the Industrial Area\n- Key decision-makers: Managing Director, Operations Manager, Head of Clearance\n\n## Good Fit Signals\n- Active company website or verifiable Ghana business directory listing\n- Handles high-volume documentation, cargo tracking, or shipping manifests\n- 5–50 employees with local phone or email contact\n\n## Avoid\n- Informal individual runner clearing agents without registered company office\n- Multinational shipping lines with locked global IT infrastructure`,
  },
  {
    id: 'tema-wholesalers',
    label: '📦 Tema Industrial & FMCG Wholesalers',
    description: 'Bulk distributors, building suppliers, industrial packaging',
    target: `## Objective\nFind B2B distributors, building material suppliers, and FMCG wholesalers located in the Tema Industrial Area, Ghana.\n\n## Target Profiles\n- Wholesalers supplying commercial contractors, manufacturing plants, or retail chains\n- Key decision-makers: Managing Director, Commercial Director, Head of Supply Chain\n\n## Good Fit Signals\n- Heavy volume of repeat orders and proforma invoicing\n- Operating physical warehouse/depot facilities in Tema\n- Verifiable digital footprint or local business directory presence\n\n## Avoid\n- Micro retail stalls, container kiosks, or individual street retailers`,
  },
  {
    id: 'ghana-clinics',
    label: '🏥 Private Diagnostics & Clinics',
    description: 'Specialist medical clinics, diagnostic labs, dental practices',
    target: `## Objective\nIdentify established private medical clinics, diagnostic imaging centers, and specialist practices in Accra and Tema, Ghana.\n\n## Target Profiles\n- Multi-specialist clinics, dental clinics, diagnostic imaging and pathology labs\n- Key decision-makers: Medical Director, Practice Manager, Chief Administrator\n\n## Good Fit Signals\n- Private healthcare facilities serving corporate and middle/high-income patients\n- Inbound patient booking via phone/WhatsApp that could benefit from automated scheduling and intake\n- Active physical address in Tema or Accra with contact telephone\n\n## Avoid\n- Public government polyclinics and community health posts (CHPS)\n- Single-practitioner informal herbal medicine shops`,
  },
  {
    id: 'custom-furniture',
    label: '🪑 High-End Custom Furniture & Joinery',
    description: 'Custom joinery, architectural fixtures, commercial fit-outs',
    target: `## Objective\nFind premium custom furniture makers, joinery workshops, and architectural woodcrafters in Ghana.\n\n## Target Profiles\n- Custom residential and commercial furniture makers, office fit-out contractors\n- Key decision-makers: Managing Director, Creative Director, Head of Production\n\n## Good Fit Signals\n- High-ticket projects ($1,500–$25,000+ per order)\n- Needs structured client project scoping, milestone invoicing, and digital client review\n- Established showroom, factory, or commercial workshop\n\n## Avoid\n- Roadside informal carpenters without digital presence or corporate registration`,
  },
  {
    id: 'commercial-real-estate',
    label: '🏢 Real Estate & Property Developers',
    description: 'Commercial developers, gated estates, facility managers',
    target: `## Objective\nFind commercial property developers, estate management companies, and corporate real estate firms in Accra and Tema, Ghana.\n\n## Target Profiles\n- Property development firms, gated community developers, facility management agencies\n- Key decision-makers: Managing Partner, Development Director, Head of Sales\n\n## Good Fit Signals\n- Actively selling or leasing commercial spaces, apartments, or industrial warehouses\n- Needs inbound enquiry qualification, client intake, and automated lease agreements\n- Active website or project showcase listings\n\n## Avoid\n- Freelance individual property brokers or unregulated agents`,
  },
];

export function sharpenQueryWithJev(raw: string): string {
  const text = raw.trim().toLowerCase();

  let location = 'Ghana (Tema / Greater Accra)';
  if (text.includes('tema')) location = 'Tema, Ghana';
  else if (text.includes('accra')) location = 'Accra, Ghana';
  else if (text.includes('kumasi')) location = 'Kumasi, Ghana';
  else if (text.includes('takoradi')) location = 'Takoradi, Ghana';

  if (/logistics|freight|clearing|port|cargo|shipping|forwarding|harbour/.test(text)) {
    return `## Objective\nFind active freight forwarders, customs clearance agents, and logistics providers based in or operating around ${location}.\n\n## Target Profiles\n- Customs clearing agencies, freight forwarders, and bonded warehouse operators\n- Operating around port terminals and industrial hubs\n- Key decision-makers: Managing Director, Operations Manager, Head of Clearance\n\n## Good Fit Signals\n- Heavy documentation workflows needing client portal or workflow automation\n- Active operations, verified office in ${location}\n- 5–50 employees with local phone or email contact\n\n## Avoid\n- Individual motorcycle dispatch or informal courier runners\n- Multinationals with locked global procurement (e.g. Maersk global)`;
  }

  if (/furniture|wood|interior|decor|joinery|fitout|kitchen|cabinet/.test(text)) {
    return `## Objective\nIdentify established custom furniture workshops, joineries, and interior decor specialists in ${location}.\n\n## Target Profiles\n- Residential/commercial furniture makers, custom joineries, architectural woodcrafters\n- Key decision-makers: Managing Director, Creative Director, Workshop Head\n\n## Good Fit Signals\n- High-ticket custom projects ($1,500–$25,000+ per order)\n- Manual quotation, milestone billing, and customer sign-off needs\n- Active commercial workshop or showroom\n\n## Avoid\n- Informal roadside workshops with no online presence or verifiable registration`;
  }

  if (/clinic|hospital|doctor|health|dental|medical|diagnost|pharma|patient/.test(text)) {
    return `## Objective\nFind established private clinics, diagnostic centers, and specialist medical practices in ${location}.\n\n## Target Profiles\n- Multi-specialist clinics, dental clinics, imaging/lab centers, private surgical suites\n- Key decision-makers: Medical Director, Practice Manager, Chief Operations Officer\n\n## Good Fit Signals\n- Manual patient booking and WhatsApp enquiry volume needing automated intake\n- Established private facility with 5+ staff\n- Active telephone and physical address\n\n## Avoid\n- Public government health posts or CHPS compounds\n- Unregistered single-practitioner herbal shops`;
  }

  if (/wholesale|distribut|fmcg|supplier|bulk|warehouse|industrial|factory|manufactur/.test(text)) {
    return `## Objective\nIdentify established B2B wholesalers, industrial suppliers, and FMCG distributors operating in ${location}.\n\n## Target Profiles\n- Commercial distributors supplying retailers, contractors, or factories\n- Key decision-makers: Managing Director, Commercial Director, Head of Supply Chain\n\n## Good Fit Signals\n- High-ticket repeat wholesale orders, manual proforma invoicing\n- Physical depot/warehouse facility\n- Verifiable business registration or directory listing\n\n## Avoid\n- Retail corner stores or small market kiosks`;
  }

  if (/real estate|property|developer|apartment|housing|estate|broker|lease|land/.test(text)) {
    return `## Objective\nFind commercial property developers, serviced apartment operators, and facility management firms in ${location}.\n\n## Target Profiles\n- Real estate developers, gated community managers, commercial property agents\n- Key decision-makers: Managing Partner, Development Director, Head of Leasing\n\n## Good Fit Signals\n- Active pipeline of commercial or residential units for sale or lease\n- Inbound enquiry volume needing lead qualification and lease document generation\n- Active website or official listings\n\n## Avoid\n- Freelance individual property brokers without registered company offices`;
  }

  return `## Objective\nFind established B2B service providers, logistics operators, commercial distributors, and professional businesses operating in ${location}.\n\n## Target Profiles\n- Independent B2B companies (logistics, wholesale supply, specialized contracting, commercial services)\n- Decision-makers: Managing Director, General Manager, Head of Operations\n- Annual turnover roughly $150k–$3M equivalent\n\n## Good Fit Signals\n- Active commercial operations with verifiable business website or official directory listing\n- Receptive to operational AI automation, digital invoicing, or client portal systems\n- Public telephone or verified corporate email\n\n## Avoid\n- Informal micro-retail stalls, street traders, or roadside kiosks\n- Government monopolies or global multinationals with overseas procurement headquarters`;
}

type Readiness = {
  database: boolean;
  missingTables: string[];
  openrouter: boolean;
  resend: boolean;
  adminAllowlist: boolean;
  notes: string[];
};
export function LeadScout() {
  const [data, setData] = useState<Data | null>(null);
  const [ready, setReady] = useState<Readiness | null>(null);
  const [target, setTarget] = useState(
    'Furniture and custom-order businesses in Ghana with a public company website.',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // One object rather than a field per facet, so the bar and filterLeads can
  // never end up applying different rules to the same list. Opens on the
  // unreviewed leads, which is the only view with work waiting in it.
  const [filter, setFilter] = useState<LeadFilter>({
    ...EMPTY_FILTER,
    status: 'new',
  });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [checkedAt, setCheckedAt] = useState(0);
  const [liveEvents, setLiveEvents] = useState<RunEvent[]>([]);
  const dirty = useRef(false);
  const locked = useRef(false);
  const targetBox = useRef<HTMLTextAreaElement>(null);
  // Falls back until the first load answers; the server remains the authority.
  const maxTarget = data?.targetMaxLength ?? 8000;
  // Grow to fit the brief instead of scrolling a small window, capped so a
  // long prompt cannot push the search buttons off the screen.
  useEffect(() => {
    const box = targetBox.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight + 2, 520)}px`;
  }, [target]);
  const visible = filterLeads(data?.leads || [], filter);
  const [tab, setTab] = useState('search');
  const unsaved = target.trim() !== data?.campaign?.target;
  const validTarget = target.trim().length >= 10;
  const running =
    !!data?.campaign?.running_until &&
    new Date(data.campaign.running_until).getTime() > checkedAt;
  const researchBlocked =
    (data?.campaign ? !data.campaign.enabled : false) ||
    !data?.aiConfigured ||
    data?.remainingRuns === 0 ||
    running;
  const canDiscover =
    !busy &&
    !loading &&
    validTarget &&
    !researchBlocked;

  const reason = loading
    ? 'Loading your saved search…'
    : !data
      ? 'Refresh to load your saved search.'
      : !data.aiConfigured
        ? 'The AI connection needs configuration.'
        : data.campaign && !data.campaign.enabled
          ? 'Searches are paused. Resume to discover or enrich leads.'
          : data.remainingRuns === 0
            ? 'Daily research allowance used. It resets at midnight UTC.'
            : running
              ? 'A search is already running. Refresh to check its progress.'
              : unsaved
                ? 'Target updated. Click "Save & Find" to search with these criteria.'
                : 'Ready to discover businesses.';
  const latestRunId = data?.runs[0]?.id;
  const shownEvents = liveEvents.length
    ? liveEvents
    : (data?.events || [])
        .filter((event) => event.run_id === latestRunId)
        .reverse();
  const load = useCallback(async () => {
    const [response, health] = await Promise.all([
      fetch('/api/admin/prospects', { signal: AbortSignal.timeout(30000) }),
      fetch('/api/admin/readiness', {
        signal: AbortSignal.timeout(30000),
      }).catch(() => null),
    ]);
    const payload = (await response.json()) as Data & { error?: string };
    if (!response.ok)
      throw new Error(payload.error || 'Lead Scout unavailable.');
    setData(payload);
    setCheckedAt(Date.now());
    if (payload.campaign && !dirty.current) setTarget(payload.campaign.target);
    if (health?.ok) setReady((await health.json()) as Readiness);
  }, []);
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed.'))
      .finally(() => setLoading(false));
  }, [load]);

  async function act(
    action: string,
    id?: string,
    extra?: Record<string, unknown>,
  ): Promise<boolean> {
    if (locked.current) return false;
    locked.current = true;
    setPending(action + (id ? ':' + id : ''));
    setBusy(true);
    setError('');
    setMessage('');
    if (action === 'discover' || action === 'enrich') setLiveEvents([]);
    try {
      if (action === 'refresh') {
        await load();
        setMessage('Queue refreshed.');
        return true;
      }
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, target, id, ...extra }),
        signal: AbortSignal.timeout(150000),
      });
      if (
        response.headers
          .get('content-type')
          ?.includes('application/x-ndjson') &&
        response.body
      ) {
        if (!response.ok) throw new Error('The research run could not start.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalNote = '';
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), {
            stream: !done,
          });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as RunEvent & {
              type: string;
              error?: string;
              note?: string;
            };
            if (event.type === 'progress')
              setLiveEvents((current) => [...current, event]);
            if (event.type === 'complete')
              finalNote = event.note || 'Research complete.';
            if (event.type === 'error')
              throw new Error(event.error || 'The research run stopped.');
          }
          if (done) break;
        }
        setMessage(finalNote || 'Research complete.');
        await load();
        return true;
      }
      const result = (await response.json()) as {
        error?: string;
        note?: string;
      };
      if (!response.ok)
        throw new Error(
          (result.error || 'Action failed.') +
            ' Reference: ' +
            (response.headers.get('x-request-id') || 'unavailable'),
        );
      if (action === 'configure') dirty.current = false;
      setMessage(result.note || 'Done.');
      await load().catch(() =>
        setError(
          'The action succeeded, but the queue could not refresh. Use Refresh before repeating it.',
        ),
      );
      return true;
    } catch (e) {
      if (action === 'discover' || action === 'enrich')
        await load().catch(() => undefined);
      setError(
        e instanceof Error && e.name === 'TimeoutError'
          ? 'The request timed out. Refresh before retrying; the run may still finish.'
          : e instanceof Error
            ? e.message
            : 'Action failed.',
      );
      return false;
    } finally {
      locked.current = false;
      setPending('');
      setLoading(false);
      setBusy(false);
    }
  }

  async function saveAndDiscover() {
    if (locked.current || busy || loading) return;
    if (!validTarget) {
      setError('Describe a target market in at least 10 characters.');
      return;
    }
    if (unsaved || !data?.campaign) {
      const ok = await act('configure');
      if (!ok) return;
    }
    await act('discover');
  }

  const newLeads = (data?.leads || []).filter(
    (lead) => lead.status === 'new',
  ).length;
  return (
    <div className="scout">
      {/* Four jobs on one screen became a two-thousand pixel scroll: search,
          review, schedule and history. Tabs keep each one a screen high, and
          every panel stays mounted, so a half-written brief survives a look
          at the queue. */}
      <AdminTabs
        label="Lead Scout"
        active={tab}
        onChange={setTab}
        tabs={[
          {
            id: 'search',
            label: 'Search',
            panel: (
              <>
                {newLeads > 0 && (
                  <div className="scout-queue-banner">
                    <div className="scout-queue-banner-content">
                      <span className="scout-queue-badge">{newLeads} UNREVIEWED</span>
                      <div className="scout-queue-banner-text">
                        <strong>
                          {newLeads} researched {newLeads === 1 ? 'business is' : 'businesses are'} waiting in your review queue.
                        </strong>
                        <p>
                          Review company evidence and shortlist strong fits before spending more research runs.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="scout-queue-banner-cta"
                      onClick={() => setTab('queue')}
                    >
                      Review {newLeads} {newLeads === 1 ? 'Lead' : 'Leads'} &rarr;
                    </button>
                  </div>
                )}

                <section className="scout-panel">
                  <div className="scout-panel-header">
                    <div>
                      <h2>Find businesses worth a conversation</h2>
                      <p>
                        Search public company information, review the evidence and
                        move suitable prospects into Enquiries. No outreach is sent.
                      </p>
                    </div>
                  </div>

                  {/* Jev Market Presets */}
                  <div className="scout-presets-box">
                    <div className="scout-presets-header">
                      <span className="scout-presets-title">⚡ Jev Market Presets</span>
                      <small className="scout-presets-subtitle">Select a proven local B2B niche to load targeting rules</small>
                    </div>
                    <div className="scout-presets-list">
                      {JEV_MARKET_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className="scout-preset-pill"
                          disabled={busy || loading}
                          title={preset.description}
                          onClick={() => {
                            dirty.current = true;
                            setTarget(preset.target);
                            setMessage(`Loaded preset: ${preset.label.replace(/^[^\s]+\s/, '')}`);
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="scout-target-head">
                    <div className="scout-target-label-row">
                      <label htmlFor="scout-target">Target market</label>
                      <button
                        type="button"
                        className="scout-sharpen-btn"
                        disabled={busy || loading || !target.trim()}
                        title="Refine your input into a structured 4-part B2B brief using Jev's qualification rules"
                        onClick={() => {
                          const sharpened = sharpenQueryWithJev(target);
                          dirty.current = true;
                          setTarget(sharpened);
                          setMessage('✨ Target brief sharpened with Jev’s qualification rules.');
                        }}
                      >
                        ✨ Sharpen with Jev
                      </button>
                    </div>
                    <span
                      className={
                        target.length > maxTarget * 0.9
                          ? 'scout-counter is-near'
                          : 'scout-counter'
                      }
                    >
                      {target.length.toLocaleString()} /{' '}
                      {maxTarget.toLocaleString()}
                    </span>
                  </div>
                  <textarea
                    id="scout-target"
                    ref={targetBox}
                    className="scout-target"
                    value={target}
                    maxLength={maxTarget}
                    spellCheck={false}
                    disabled={busy || loading}
                    aria-describedby="scout-target-hint"
                    placeholder={
                      'Describe who you want to reach. Markdown is fine.\n\n## Objective\nFind ...\n\n## Good fit\n- ...\n\n## Avoid\n- ...'
                    }
                    onKeyDown={(e) => {
                      // A prompt is written as an outline, so Tab should indent rather
                      // than jump to the next control and lose the writer's place.
                      // Shift+Tab still moves focus, which keeps keyboard navigation out.
                      if (e.key !== 'Tab' || e.shiftKey) return;
                      e.preventDefault();
                      const box = e.currentTarget;
                      const { selectionStart: from, selectionEnd: to } = box;
                      const next =
                        target.slice(0, from) + '  ' + target.slice(to);
                      if (next.length > maxTarget) return;
                      dirty.current = true;
                      setTarget(next);
                      requestAnimationFrame(() => {
                        box.selectionStart = box.selectionEnd = from + 2;
                      });
                    }}
                    onChange={(e) => {
                      dirty.current = true;
                      setTarget(e.target.value);
                    }}
                  />
                  <p id="scout-target-hint" className="scout-small">
                    Headings and lists are kept as written. Tab indents;
                    Shift+Tab leaves the field.
                  </p>
                  <div className="scout-actions">
                    <button
                      className="scout-primary"
                      disabled={!canDiscover}
                      aria-describedby="scout-search-status"
                      onClick={saveAndDiscover}
                    >
                      {busy && pending === 'discover'
                        ? 'Discovering…'
                        : unsaved
                          ? '⚡ Save & Find up to 5 businesses'
                          : 'Find up to 5 businesses'}
                    </button>
                    <button
                      disabled={
                        busy || loading || !data || !validTarget || !unsaved
                      }
                      onClick={() => act('configure')}
                    >
                      Save target only
                    </button>
                    {data?.campaign && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(data.campaign?.enabled ? 'pause' : 'resume')
                        }
                      >
                        {data.campaign.enabled
                          ? 'Pause searches'
                          : 'Resume searches'}
                      </button>
                    )}
                    <button
                      disabled={busy || loading}
                      onClick={() => act('refresh')}
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      disabled={busy || loading}
                      onClick={() => setTab('import')}
                    >
                      📥 Import leads
                    </button>
                  </div>
                  <p id="scout-search-status" className="scout-search-status">
                    {reason}
                  </p>
                  <p className="scout-small">
                    {/* Read from the server rather than written here, so the number
                      shown is the number actually enforced. */}
                    {data
                      ? data.remainingRuns === null
                        ? 'Research runs are not capped for this workspace. '
                        : `${data.remainingRuns} of ${data.dailyRuns} research runs remaining today. `
                      : ''}
                    Sources and contact details need human review. A saved
                    target controls searches; recurring execution requires the
                    connected scheduler.
                  </p>
                  {busy && (
                    <output aria-live="polite" className="scout-working">
                      <Spinner size={15} />
                      <span>
                        {pending.startsWith('enrich')
                          ? 'Enriching the selected business…'
                          : pending === 'discover'
                            ? 'Researching businesses…'
                            : 'Saving or refreshing…'}{' '}
                        Research can take about a minute.
                      </span>
                    </output>
                  )}
                  {message && <output aria-live="polite">{message}</output>}
                  {error && <p role="alert">{error}</p>}
                </section>
                <section
                  className="scout-agent-board"
                  aria-labelledby="research-team-heading"
                >
                  <div className="scout-agent-head">
                    <div>
                      <span className="scout-eyebrow">RESEARCH TEAM</span>
                      <h2 id="research-team-heading">
                        From market search to review queue
                      </h2>
                    </div>
                    <span
                      className={
                        busy &&
                        ['discover', 'enrich'].some((value) =>
                          pending.startsWith(value),
                        )
                          ? 'scout-live'
                          : 'scout-idle'
                      }
                    >
                      {busy &&
                      ['discover', 'enrich'].some((value) =>
                        pending.startsWith(value),
                      )
                        ? 'Agents working'
                        : shownEvents.length
                          ? 'Latest run'
                          : 'Ready'}
                    </span>
                  </div>
                  <ol className="scout-agent-flow">
                    {researchAgents.map((agent, index) => {
                      const event = [...shownEvents]
                        .reverse()
                        .find((item) => item.stage === agent.stage);
                      return (
                        <li
                          key={agent.stage}
                          className={event ? `is-${event.status}` : ''}
                        >
                          <span className="scout-agent-number">
                            {index + 1}
                          </span>
                          <div>
                            <strong>{agent.name}</strong>
                            <p>{event?.message || agent.job}</p>
                          </div>
                          <span className="scout-agent-state">
                            {event?.status || 'waiting'}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="scout-agent-note">
                    Agents only use public business information. Nothing here
                    contacts a prospect; you decide what enters Enquiries.
                  </p>
                </section>
                {newLeads > 0 && !busy && (
                  <button
                    type="button"
                    className="scout-to-queue"
                    onClick={() => setTab('queue')}
                  >
                    Review {newLeads} new {newLeads === 1 ? 'lead' : 'leads'} in
                    the queue →
                  </button>
                )}
              </>
            ),
          },
          {
            id: 'queue',
            label: 'Review queue',
            note: newLeads || undefined,
            panel: (
              <section>
                <h2 className="scout-sr-only">Prospect review queue</h2>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="scout-preset-pill"
                    onClick={() => setTab('import')}
                    title="Import new target accounts from documents, notes, CSV or JSON"
                  >
                    📥 Import leads from brief / CSV
                  </button>
                </div>
                <LeadFilterBar
                  leads={data?.leads || []}
                  filter={filter}
                  onChange={setFilter}
                  shown={visible.length}
                />
                {!data && !error && (
                  <SkeletonRows rows={5} label="Loading saved leads" />
                )}
                {/* An empty list has two quite different causes, and saying which one
                  it is saves someone re-running a search they did not need. */}
                {data && !visible.length && (
                  <p>
                    {data.leads.length
                      ? 'No leads match these filters. Clear one, or widen the status.'
                      : 'Nothing saved yet. Run a search, or set a schedule above and let one run overnight.'}
                  </p>
                )}
                <div className="scout-grid">
                  {visible.map((lead) => (
                    <article className="scout-panel" key={lead.id}>
                      <span className="scout-small">
                        {lead.status} · Public research, not verified buying
                        intent
                      </span>
                      <h3>{lead.company}</h3>
                      <a href={lead.website} target="_blank" rel="noreferrer">
                        Company website ↗
                      </a>
                      <p>{lead.data.description}</p>
                      <h4>Possible fit — AI hypothesis</h4>
                      <p>{lead.data.opportunity}</p>
                      <h4>Public business contacts</h4>
                      {lead.data.contacts.length ? (
                        <ul>
                          {lead.data.contacts.map((c, i) => (
                            <li key={i}>
                              <strong>{c.kind}: </strong>
                              {c.value}{' '}
                              <a
                                href={c.source}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Source ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          No contact details supported by the returned evidence.
                        </p>
                      )}
                      <p className="scout-small">
                        {/* Older saved leads predate checkedAt; "Checked Invalid Date" read as a fault in the evidence rather than a missing field. */}
                        {lead.data.checkedAt &&
                        !Number.isNaN(Date.parse(lead.data.checkedAt))
                          ? `Checked ${new Date(lead.data.checkedAt).toLocaleDateString()}. `
                          : ''}
                        Public availability does not establish consent to
                        marketing.
                      </p>
                      <details>
                        <summary>
                          Review source evidence ({lead.data.sources.length})
                        </summary>
                        {lead.data.sources.map((s, i) => (
                          <div key={i}>
                            <a href={s.url} target="_blank" rel="noreferrer">
                              {s.title || s.url} ↗
                            </a>
                            <p className="scout-excerpt">
                              {s.content ||
                                'No excerpt returned. Open the source to verify.'}
                            </p>
                          </div>
                        ))}
                      </details>
                      <div className="scout-actions">
                        {['new', 'shortlisted'].includes(lead.status) && (
                          <>
                            <button
                              disabled={busy || researchBlocked}
                              onClick={() => act('enrich', lead.id)}
                            >
                              {pending === 'enrich:' + lead.id
                                ? 'Enriching…'
                                : 'Enrich public details'}
                            </button>
                            {lead.status === 'new' && (
                              <button
                                disabled={busy}
                                onClick={() => act('shortlist', lead.id)}
                              >
                                Shortlist
                              </button>
                            )}
                            {lead.status === 'shortlisted' && (
                              <button
                                disabled={busy}
                                onClick={() => act('promote', lead.id)}
                              >
                                Move to Enquiries
                              </button>
                            )}
                            <button
                              disabled={busy}
                              onClick={() => act('dismiss', lead.id)}
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        {lead.status === 'dismissed' && (
                          <button
                            disabled={busy}
                            onClick={() => act('restore', lead.id)}
                          >
                            Restore to new leads
                          </button>
                        )}
                        {lead.opportunity_id && (
                          <Link
                            href={
                              '/admin/pipeline?q=' +
                              encodeURIComponent(lead.company)
                            }
                          >
                            Open Enquiries →
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ),
          },
          {
            id: 'import',
            label: 'Import',
            panel: (
              <LeadImporter
                onImportComplete={async () => {
                  await load();
                  setTab('queue');
                }}
              />
            ),
          },
          {
            id: 'schedule',
            label: 'Schedule',
            panel: (
              <>
                <LeadSchedule
                  campaign={data?.campaign ?? null}
                  busy={busy}
                  pending={pending}
                  onSave={(schedule) =>
                    void act('schedule', undefined, schedule)
                  }
                />
                <details className="scout-panel">
                  <summary>Recent search runs</summary>
                  <ul>
                    {data?.runs.length === 0 && (
                      <li>No searches have run yet.</li>
                    )}
                    {data?.runs.map((run) => (
                      <li key={run.id}>
                        <strong>
                          {new Date(run.created_at).toLocaleString()} ·{' '}
                          {run.status}
                        </strong>
                        <span>
                          {run.note ||
                            'In progress. A run left here after interruption needs review.'}
                        </span>
                        {data.events.some(
                          (event) => event.run_id === run.id,
                        ) && (
                          <ol className="scout-run-events">
                            {data.events
                              .filter((event) => event.run_id === run.id)
                              .reverse()
                              .map((event) => (
                                <li key={event.id}>
                                  <span>{event.stage}</span>
                                  <b>{event.status}</b>
                                  <p>{event.message}</p>
                                </li>
                              ))}
                          </ol>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/audit">Open activity log →</Link>
                </details>
                {ready && (
                  <details className="scout-panel">
                    <summary>
                      Business readiness ·{' '}
                      {ready.database && !ready.missingTables.length
                        ? 'database connected'
                        : 'database needs attention'}
                    </summary>
                    <ul>
                      <li>
                        AI key: {ready.openrouter ? 'configured' : 'missing'}
                      </li>
                      <li>
                        Resend sender and key:{' '}
                        {ready.resend ? 'configured' : 'not configured'}
                      </li>
                      <li>
                        Production admin allowlist:{' '}
                        {ready.adminAllowlist
                          ? 'configured'
                          : 'not configured; production access stays closed'}
                      </li>
                      {ready.missingTables.length > 0 && (
                        <li>
                          Missing tables: {ready.missingTables.join(', ')}
                        </li>
                      )}
                      {ready.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
