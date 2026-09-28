'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MonitorUp,
  RotateCcw,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  allGoals,
  assessmentQuestions,
  customerChannels,
  helpsLabel,
  jevReading,
  orderVolumes,
  ownerConversationEntry,
  roadmapPlainText,
  teamSizes,
  type Roadmap,
} from '@/lib/assessment';

export type LeadOption = {
  id: string;
  business: string;
  person: string;
  status: string;
};

type Step = 'start' | 'ask' | 'roadmap' | 'finish' | 'done';

type Draft = {
  leadId: string;
  business: string;
  person: string;
  sells: string;
  area: string;
  decides: string;
  channels: string[];
  volume: string;
  team: string;
  goals: string[];
  answers: Record<string, string>;
  step: Step;
  q: number;
  roadmap: Roadmap | null;
  jev: number | null;
  shown: boolean;
  nextAction: string;
  followUpAt: string;
  stage: string;
  channel: string;
  foundVia: string;
};

/** What the client screen is allowed to show. Nothing private is ever in it. */
export type ClientState = {
  business: string;
  area: string;
  sells: string;
  step: Step;
  question: { index: number; total: number; prompt: string } | null;
  answer: string;
  channels: string[];
  goals: string[];
  roadmap: Roadmap | null;
  nextAction: string;
  followUpAt: string;
};

const CHANNEL = 'aksen-assessment';
const STORAGE_KEY = 'aksen-assessment-v1';
const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal out',
  won: 'Won',
  lost: 'Lost',
};
const publicQuestions = assessmentQuestions.filter((q) => !q.private);
const pricingQuestion = assessmentQuestions.find((q) => q.private);

const blank = (lead?: LeadOption): Draft => ({
  leadId: lead?.id ?? '',
  business: lead?.business ?? '',
  person: lead?.person ?? '',
  sells: '',
  area: '',
  decides: '',
  channels: [],
  volume: '',
  team: '',
  goals: [],
  answers: {},
  step: 'start',
  q: 0,
  roadmap: null,
  jev: null,
  shown: false,
  nextAction: '',
  followUpAt: '',
  stage: 'qualified',
  channel: 'call',
  foundVia: '',
});

// Storage is read through useSyncExternalStore so the server render (nothing
// saved) and the browser's first render agree, then the browser corrects it.
// Another tab saving fires `storage`, which is the only change worth hearing.
function subscribeStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}
function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function parseSaved(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as Draft;
    return draft && draft.business && draft.step !== 'done' ? draft : null;
  } catch {
    return null;
  }
}

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function Checks({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="as-checks">
      <legend>
        {legend} <small>tick all that apply</small>
      </legend>
      {options.map((option) => (
        <label key={option}>
          <input
            type="checkbox"
            checked={value.includes(option)}
            onChange={() => onChange(toggle(value, option))}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

function Choice({
  legend,
  options,
  value,
  onChange,
  name,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  name: string;
}) {
  // One answer only: a business has one team size and one order volume.
  return (
    <fieldset className="as-checks">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option}>
          <input
            type="radio"
            name={name}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

export function RoadmapView({
  business,
  roadmap,
}: {
  business: string;
  roadmap: Roadmap;
}) {
  return (
    <article className="as-roadmap">
      <header>
        <small>FREE ASSESSMENT</small>
        <h2>{business}: what we found</h2>
      </header>
      {roadmap.heard.length > 0 && (
        <section>
          <h3>What you told us</h3>
          <ul>
            {roadmap.heard.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {roadmap.slipping.length > 0 && (
        <section>
          <h3>Where things are slipping</h3>
          <ul>
            {roadmap.slipping.map((item) => (
              <li key={item.where}>
                <strong>{item.where}</strong>
                {item.evidence && <span>{item.evidence}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {roadmap.doThisWeek.length > 0 && (
        <section className="as-roadmap-free">
          <h3>You can do this week, at no cost</h3>
          <ul>
            {roadmap.doThisWeek.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {roadmap.weCouldBuild.length > 0 && (
        <section>
          <h3>What we could build with you</h3>
          <ul>
            {roadmap.weCouldBuild.map((item) => (
              <li key={item.what}>
                <strong>
                  {item.what}
                  <em>{helpsLabel[item.helpsWith] ?? item.helpsWith}</em>
                </strong>
                {item.why && <span>{item.why}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {roadmap.nextStep && (
        <footer>
          <h3>Next step</h3>
          <p>{roadmap.nextStep}</p>
          <small>
            This assessment is free. AI helped prepare it; we checked it.
          </small>
        </footer>
      )}
    </article>
  );
}

export function AssessmentDesk({
  leads,
  initialLeadId,
}: {
  leads: LeadOption[];
  initialLeadId: string;
}) {
  const preselected = leads.find((lead) => lead.id === initialLeadId);
  const [d, setD] = useState<Draft>(() => blank(preselected));
  // A dropped connection or an accidental refresh mid-call must not lose the
  // owner's words, so the draft is kept in this browser until it is saved.
  // An unfinished one is offered back rather than restored silently: the
  // person on the next call may be someone else. Nothing is written over it
  // until you resume, discard, or start typing a new one.
  const savedRaw = useSyncExternalStore(
    subscribeStorage,
    readSaved,
    () => null,
  );
  const [choice, setChoice] = useState<'pending' | 'resumed' | 'discarded'>(
    'pending',
  );
  const saved = useMemo(() => parseSaved(savedRaw), [savedRaw]);
  const offerResume = choice === 'pending' && !!saved;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [copied, setCopied] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState('');
  const channel = useRef<BroadcastChannel | null>(null);

  // Typing into a new assessment is itself the choice not to resume.
  const decide = () =>
    setChoice((current) => (current === 'pending' ? 'discarded' : current));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    decide();
    setD((current) => ({ ...current, [key]: value }));
  };
  const answer = (id: string, value: string) => {
    decide();
    setD((current) => ({
      ...current,
      answers: { ...current.answers, [id]: value },
    }));
  };

  useEffect(() => {
    if (offerResume || d.step === 'done' || !d.business.trim()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
      // No storage: the assessment still works, it cannot survive a reload.
    }
  }, [d, offerResume]);

  const question = d.step === 'ask' ? publicQuestions[d.q] : null;
  const clientState: ClientState = useMemo(
    () => ({
      business: d.business,
      area: d.area,
      sells: d.sells,
      step: d.step,
      question: question
        ? {
            index: d.q + 1,
            total: publicQuestions.length,
            prompt: question.prompt,
          }
        : null,
      answer: question ? d.answers[question.id] || '' : '',
      channels: d.channels,
      goals: d.goals,
      // The draft reaches the client screen only after it is released here.
      roadmap: d.shown ? d.roadmap : null,
      nextAction: d.nextAction,
      followUpAt: d.followUpAt,
    }),
    [d, question],
  );

  // The client screen is a separate window, shared on the call instead of
  // this one. It receives only ClientState, so nothing private can reach it.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc.onmessage = (event) => {
      if (event.data?.type === 'hello') setClientOpen(true);
      if (event.data?.type === 'bye') setClientOpen(false);
    };
    return () => bc.close();
  }, []);
  useEffect(() => {
    channel.current?.postMessage({ type: 'state', state: clientState });
  }, [clientState, clientOpen]);

  function openClientScreen() {
    window.open(
      '/admin/assessment/client',
      'aksen-assessment-client',
      'popup,width=1280,height=800',
    );
  }

  function chooseLead(id: string) {
    const lead = leads.find((item) => item.id === id);
    setD((current) => ({
      ...current,
      leadId: id,
      business: lead?.business || current.business,
      person: lead?.person || current.person,
    }));
  }

  function startOver() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored to clear.
    }
    setD(blank());
    setChoice('discarded');
    setError('');
    setSavedLeadId('');
  }

  async function draftRoadmap() {
    setBusy(true);
    setError('');
    set('step', 'roadmap');
    try {
      const res = await fetch('/api/admin/assessment/roadmap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d),
      });
      const data = (await res.json()) as {
        roadmap?: Roadmap;
        jev?: number | null;
        error?: string;
      };
      if (typeof data.jev === 'number' || data.jev === null)
        set('jev', data.jev ?? null);
      if (!res.ok || !data.roadmap)
        throw new Error(data.error || 'The draft did not come back.');
      setD((current) => ({
        ...current,
        roadmap: data.roadmap ?? null,
        jev: data.jev ?? null,
        shown: false,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The draft did not come back.');
    } finally {
      setBusy(false);
    }
  }

  function removeItem(
    section:
      | 'heard'
      | 'doThisWeek'
      | 'questionsLeft'
      | 'slipping'
      | 'weCouldBuild',
    index: number,
  ) {
    setD((current) => {
      if (!current.roadmap) return current;
      const next = { ...current.roadmap };
      if (section === 'slipping')
        next.slipping = next.slipping.filter((_, i) => i !== index);
      else if (section === 'weCouldBuild')
        next.weCouldBuild = next.weCouldBuild.filter((_, i) => i !== index);
      else next[section] = next[section].filter((_, i) => i !== index);
      return { ...current, roadmap: next };
    });
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/assessment/finish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(d),
      });
      const data = (await res.json()) as { leadId?: string; error?: string };
      if (!res.ok || !data.leadId)
        throw new Error(data.error || 'The assessment was not saved.');
      setSavedLeadId(data.leadId);
      set('step', 'done');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear.
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'The assessment was not saved.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
      setError('Copying was blocked by the browser. Select the text instead.');
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const reading = jevReading(d.jev);
  const matchingLeads = leads.filter((lead) =>
    `${lead.business} ${lead.person}`
      .toLowerCase()
      .includes(leadSearch.trim().toLowerCase()),
  );
  const steps: [Step, string][] = [
    ['start', 'The business'],
    ['ask', 'Questions'],
    ['roadmap', 'Roadmap'],
    ['finish', 'Next step'],
  ];
  // A step is open once what it needs exists, not only when it is behind you.
  // Going back to fix the business name must not mean clicking through six
  // questions again to reach a roadmap that is already drafted.
  const reachable: Record<Step, boolean> = {
    start: true,
    ask: !!d.business.trim(),
    roadmap: !!d.roadmap,
    finish: !!d.roadmap,
    done: false,
  };

  return (
    <div className="as">
      <header className="as-head">
        <div>
          <p className="as-kicker">SALES · FREE ASSESSMENT</p>
          <h1>{d.business || 'Free assessment'}</h1>
          <p>
            Ask, listen and write down their words. The roadmap is drafted from
            what they said, and nothing is saved until you agree a next step.
          </p>
        </div>
        <div className="as-head-actions">
          <button type="button" className="as-btn" onClick={openClientScreen}>
            <MonitorUp size={16} />
            {clientOpen ? 'Client screen open' : 'Open client screen'}
          </button>
          <button type="button" className="as-btn as-quiet" onClick={startOver}>
            <RotateCcw size={15} /> Start over
          </button>
        </div>
      </header>

      <p className="as-share-note">
        {clientOpen ? (
          <>
            <Check size={14} /> Share the <b>client screen</b> window on the
            call, not this one. It shows the question, their words and the
            roadmap once you release it. Nothing else.
          </>
        ) : (
          <>
            On a video call, open the client screen and share that window. This
            window keeps your notes, the draft and anything meant only for you.
          </>
        )}
      </p>

      {offerResume && saved && (
        <output className="as-restored">
          <p>
            You have an unfinished assessment with{' '}
            <b>{saved.business || 'a business'}</b>
            {saved.step === 'ask'
              ? `, at question ${saved.q + 1}`
              : saved.step === 'roadmap' || saved.step === 'finish'
                ? ', with a roadmap drafted'
                : ''}
            .
          </p>
          <button
            type="button"
            className="as-btn as-primary"
            onClick={() => {
              setD(saved);
              setChoice('resumed');
            }}
          >
            Resume it
          </button>
          <button
            type="button"
            className="as-btn as-quiet"
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                // Nothing stored.
              }
              setChoice('discarded');
            }}
          >
            Discard it
          </button>
        </output>
      )}

      {d.step !== 'done' && (
        <ol className="as-steps" aria-label="Assessment steps">
          {steps.map(([id, label], index) => (
            <li key={id} aria-current={d.step === id ? 'step' : undefined}>
              <button
                type="button"
                disabled={!reachable[id] || busy}
                onClick={() => set('step', id)}
              >
                <span>{index + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p className="as-error" role="alert">
          {error}
        </p>
      )}

      {d.step === 'start' && (
        <section className="as-card">
          {leads.length > 0 && (
            <div className="as-private">
              <label htmlFor="as-lead-search">
                Already in your pipeline? <small>optional</small>
              </label>
              <input
                id="as-lead-search"
                type="search"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Search your leads"
              />
              <div className="as-lead-list">
                <button
                  type="button"
                  aria-pressed={!d.leadId}
                  onClick={() => set('leadId', '')}
                >
                  A business I am meeting for the first time
                </button>
                {matchingLeads.slice(0, 8).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    aria-pressed={d.leadId === lead.id}
                    onClick={() => chooseLead(lead.id)}
                  >
                    {lead.business || lead.person}
                    <small>
                      {lead.business ? `${lead.person} · ` : ''}
                      {STAGE_LABEL[lead.status] ?? lead.status}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="as-grid">
            <label>
              Business name
              <input
                value={d.business}
                onChange={(e) => set('business', e.target.value)}
                placeholder="Cedar Home Furniture"
                required
              />
            </label>
            <label>
              Who you are speaking to
              <input
                value={d.person}
                onChange={(e) => set('person', e.target.value)}
                placeholder="Name and role"
              />
            </label>
            <label>
              What they sell
              <input
                value={d.sells}
                onChange={(e) => set('sells', e.target.value)}
                placeholder="Custom shelves and home furniture"
              />
            </label>
            <label>
              Where they are
              <input
                value={d.area}
                onChange={(e) => set('area', e.target.value)}
                placeholder="Tema, Community 11"
              />
            </label>
            <label>
              Who decides on spending
              <input
                value={d.decides}
                onChange={(e) => set('decides', e.target.value)}
                placeholder="The owner, a partner, a manager"
              />
            </label>
          </div>
          <Choice
            legend="Orders or enquiries"
            name="as-volume"
            options={orderVolumes}
            value={d.volume}
            onChange={(v) => set('volume', v)}
          />
          <Choice
            legend="Team size"
            name="as-team"
            options={teamSizes}
            value={d.team}
            onChange={(v) => set('team', v)}
          />
          <div className="as-actions">
            <button
              type="button"
              className="as-btn as-primary"
              disabled={!d.business.trim()}
              onClick={() => setD((c) => ({ ...c, step: 'ask', q: 0 }))}
            >
              Start the questions <ArrowRight size={16} />
            </button>
            {!d.business.trim() && (
              <span className="as-hint">Add the business name to begin.</span>
            )}
          </div>
        </section>
      )}

      {d.step === 'ask' && question && (
        <section className="as-card as-ask">
          <p className="as-progress">
            Question {d.q + 1} of {publicQuestions.length}
          </p>
          <h2>{question.prompt}</h2>
          {question.hint && (
            <p className="as-for-you">
              <b>For you:</b> {question.hint}
            </p>
          )}
          {question.id === 'orders_in' && (
            <Checks
              legend="Where customers reach them"
              options={customerChannels}
              value={d.channels}
              onChange={(v) => set('channels', v)}
            />
          )}
          {question.id === 'one_thing' && (
            <Checks
              legend="What they want more of"
              options={allGoals}
              value={d.goals}
              onChange={(v) => set('goals', v)}
            />
          )}
          <label className="as-words">
            In their words
            <textarea
              value={d.answers[question.id] || ''}
              onChange={(e) => answer(question.id, e.target.value)}
              rows={5}
              placeholder="Write what they say, as close to their words as you can."
            />
          </label>
          <div className="as-actions">
            <button
              type="button"
              className="as-btn"
              onClick={() =>
                d.q === 0 ? set('step', 'start') : set('q', d.q - 1)
              }
            >
              <ArrowLeft size={16} /> Back
            </button>
            {d.q < publicQuestions.length - 1 ? (
              <button
                type="button"
                className="as-btn as-primary"
                onClick={() => set('q', d.q + 1)}
              >
                {d.answers[question.id] ? 'Next question' : 'Skip'}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="as-btn as-primary"
                disabled={busy}
                onClick={() => void draftRoadmap()}
              >
                Draft the roadmap <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      )}

      {d.step === 'roadmap' && (
        <section className="as-card">
          {busy && (
            <p className="as-busy">
              <Loader2 size={16} className="icon-spin" /> Drafting from their
              answers. This takes up to half a minute.
            </p>
          )}
          {!busy && !d.roadmap && (
            <div className="as-actions">
              <button
                type="button"
                className="as-btn as-primary"
                onClick={() => void draftRoadmap()}
              >
                Draft the roadmap
              </button>
            </div>
          )}
          {d.roadmap && (
            <>
              <div className={`as-jev as-private`} data-tone={reading.tone}>
                <b>Jev, only for you:</b> {reading.label}
                {d.jev !== null && <span>{d.jev.toFixed(2)}</span>}
              </div>
              <p className="as-for-you">
                Check it before they see it. Remove anything that is not right,
                then release it to the client screen.
              </p>
              <div className="as-review">
                <RoadmapView business={d.business} roadmap={d.roadmap} />
                <aside>
                  <h3>Remove a line</h3>
                  {(
                    [
                      ['heard', d.roadmap.heard],
                      ['doThisWeek', d.roadmap.doThisWeek],
                    ] as const
                  ).map(([section, items]) =>
                    items.map((item, index) => (
                      <button
                        type="button"
                        key={`${section}-${item}`}
                        onClick={() => removeItem(section, index)}
                      >
                        {item}
                      </button>
                    )),
                  )}
                  {d.roadmap.slipping.map((item, index) => (
                    <button
                      type="button"
                      key={`s-${item.where}`}
                      onClick={() => removeItem('slipping', index)}
                    >
                      {item.where}
                    </button>
                  ))}
                  {d.roadmap.weCouldBuild.map((item, index) => (
                    <button
                      type="button"
                      key={`b-${item.what}`}
                      onClick={() => removeItem('weCouldBuild', index)}
                    >
                      {item.what}
                    </button>
                  ))}
                  {d.roadmap.questionsLeft.length > 0 && (
                    <>
                      <h3>Still to ask</h3>
                      <ul>
                        {d.roadmap.questionsLeft.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </aside>
              </div>
              <div className="as-actions">
                <button
                  type="button"
                  className="as-btn"
                  onClick={() => setD((c) => ({ ...c, step: 'ask', q: 0 }))}
                >
                  <ArrowLeft size={16} /> Back to the questions
                </button>
                <button
                  type="button"
                  className="as-btn"
                  disabled={busy}
                  onClick={() => void draftRoadmap()}
                >
                  <RotateCcw size={15} /> Redraft
                </button>
                <button
                  type="button"
                  className={`as-btn ${d.shown ? '' : 'as-primary'}`}
                  onClick={() => set('shown', !d.shown)}
                >
                  {d.shown ? <EyeOff size={16} /> : <Eye size={16} />}
                  {d.shown
                    ? 'Hide from client screen'
                    : 'Show on client screen'}
                </button>
                <button
                  type="button"
                  className="as-btn"
                  onClick={() =>
                    void copy(
                      'roadmap',
                      roadmapPlainText(d.business, d.roadmap!),
                    )
                  }
                >
                  {copied === 'roadmap' ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  {copied === 'roadmap' ? 'Copied' : 'Copy for WhatsApp'}
                </button>
                <button
                  type="button"
                  className="as-btn as-primary"
                  onClick={() => set('step', 'finish')}
                >
                  Agree the next step <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {d.step === 'finish' && (
        <section className="as-card">
          <h2 className="as-title">Agree the next step</h2>
          <p className="as-for-you">
            If you leave without a next step and a date, the contact did not
            happen. Both are shown on the client screen.
          </p>
          <div className="as-grid">
            <label className="as-wide">
              Next step
              <input
                value={d.nextAction}
                onChange={(e) => set('nextAction', e.target.value)}
                placeholder="Send the quote for the WhatsApp order desk"
              />
            </label>
            <label>
              By when
              <input
                type="date"
                min={today}
                value={d.followUpAt}
                onChange={(e) => set('followUpAt', e.target.value)}
              />
            </label>
          </div>
          <div className="as-private as-private-block">
            <p className="as-private-label">Only for you</p>
            <div className="as-grid">
              <label>
                Pipeline stage
                <select
                  value={d.stage}
                  onChange={(e) => set('stage', e.target.value)}
                >
                  {Object.entries(STAGE_LABEL).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                How you spoke
                <select
                  value={d.channel}
                  onChange={(e) => set('channel', e.target.value)}
                >
                  <option value="call">Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">In person</option>
                </select>
              </label>
              <label>
                How you found them
                <input
                  value={d.foundVia}
                  onChange={(e) => set('foundVia', e.target.value)}
                  placeholder="Walk-in, Instagram, referral from ..."
                />
              </label>
            </div>
            {pricingQuestion && (
              <label className="as-words">
                {pricingQuestion.prompt}
                <small>{pricingQuestion.hint}</small>
                <textarea
                  rows={3}
                  value={d.answers[pricingQuestion.id] || ''}
                  onChange={(e) => answer(pricingQuestion.id, e.target.value)}
                  placeholder="Which they picked, and why, in their words."
                />
              </label>
            )}
            <div className="as-jev" data-tone={reading.tone}>
              <b>Jev:</b> {reading.label}
            </div>
          </div>
          <div className="as-actions">
            <button
              type="button"
              className="as-btn"
              onClick={() => set('step', d.roadmap ? 'roadmap' : 'ask')}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="as-btn as-primary"
              disabled={busy || !d.nextAction.trim() || !d.followUpAt}
              onClick={() => void finish()}
            >
              {busy ? (
                <Loader2 size={16} className="icon-spin" />
              ) : (
                <Check size={16} />
              )}
              Save the assessment
            </button>
            {(!d.nextAction.trim() || !d.followUpAt) && (
              <span className="as-hint">
                A next step and a date are needed.
              </span>
            )}
          </div>
        </section>
      )}

      {d.step === 'done' && (
        <section className="as-card as-done">
          <h2 className="as-title">
            <Check size={20} /> Saved to {d.business}
          </h2>
          <p>
            The lead is at <b>{STAGE_LABEL[d.stage]}</b>, with the next step and
            date in the pipeline and a line in its history.
          </p>
          <div className="as-entry">
            <div>
              <h3>For Owner-Conversations.md</h3>
              <p>
                The Phase 1 log. Paste it into{' '}
                <code>Docs/Owner-Conversations.md</code>, newest first.
              </p>
            </div>
            <pre>
              {ownerConversationEntry(d, {
                date: today,
                foundVia: d.foundVia,
                nextStep: d.nextAction,
                followUp: d.followUpAt,
              })}
            </pre>
            <button
              type="button"
              className="as-btn"
              onClick={() =>
                void copy(
                  'entry',
                  ownerConversationEntry(d, {
                    date: today,
                    foundVia: d.foundVia,
                    nextStep: d.nextAction,
                    followUp: d.followUpAt,
                  }),
                )
              }
            >
              {copied === 'entry' ? <Check size={16} /> : <Copy size={16} />}
              {copied === 'entry' ? 'Copied' : 'Copy the entry'}
            </button>
          </div>
          <div className="as-actions">
            <Link
              className="as-btn"
              href={`/admin/pipeline?q=${encodeURIComponent(d.business)}`}
            >
              Open in the pipeline
            </Link>
            {d.roadmap && (
              <button
                type="button"
                className="as-btn"
                onClick={() =>
                  void copy('roadmap', roadmapPlainText(d.business, d.roadmap!))
                }
              >
                {copied === 'roadmap' ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} />
                )}
                {copied === 'roadmap'
                  ? 'Copied'
                  : 'Copy the roadmap for WhatsApp'}
              </button>
            )}
            <button
              type="button"
              className="as-btn as-primary"
              onClick={startOver}
            >
              Start another assessment
            </button>
          </div>
          {savedLeadId && <span className="sr-only">Lead {savedLeadId}</span>}
        </section>
      )}
    </div>
  );
}
