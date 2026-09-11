'use client';

import { ArrowRight, Bot, Check, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { workflowSuggestion } from '@/lib/workflow-suggestion';

type Pilot = { title: string; summary: string; firstWorkflow: string; steps: string[]; firstMetric: string; humanControl: string };

const questions = [
  {
    prompt: 'What would you like your business to do better?',
    options: [
      'Sell online or improve the buying experience',
      'Serve customers better',
      'Connect internal work and systems',
      'Understand business performance',
      'Develop a new digital product',
      'Help me work out where to start',
    ],
  },
  {
    prompt: 'Where is your business based or operating?',
    options: [
      'Ghana',
      'Nigeria',
      'Kenya or East Africa',
      'South Africa or Southern Africa',
      'Multiple African countries',
      'Beyond Africa / International',
    ],
  },
  {
    prompt: 'What does your current setup look like?',
    options: [
      'WhatsApp, phone and social media',
      'Website, email and basic invoicing',
      'Spreadsheets and manual handoffs',
      'Multiple disconnected tools and apps',
    ],
  },
];

export function StandaloneMapper() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', company: '' });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [pilotState, setPilotState] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const complete = step === questions.length;
  const title = pilot?.title || workflowSuggestion(answers[0] || '');

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    const controller = new AbortController();
    setPilotState('loading');
    fetch('/api/recommendation', { signal: controller.signal, method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers }) })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('no recommendation'))))
      .then((data) => { if (!cancelled) { setPilot((data as { recommendation: Pilot }).recommendation); setPilotState('ready'); } })
      // The mapper still has to answer the visitor when the model is unreachable.
      .catch(() => { if (!cancelled) setPilotState('fallback'); });
    return () => { cancelled = true; controller.abort(); };
  }, [complete, answers]);

  function choose(answer: string) {
    setAnswers((current) => [...current.slice(0, step), answer]);
    setStep((current) => current + 1);
  }

  function restart() {
    setAnswers([]); setStep(0); setShowContact(false); setStatus('idle'); setPilot(null); setPilotState('idle');
  }

  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    try {
      const response = await fetch('/api/opportunities', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...contact, answers, recommendation: title }) });
      if (!response.ok) throw new Error('save failed');
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mapper-shell standalone">
      <div className="mapper-topline"><div className="agent-avatar"><Bot size={18} /></div><div><strong>Aksen Transformation Scoper</strong><span>A short conversation, not a sales form</span></div><span className="online"><i /> ready</span></div>
      <div className="mapper-thread" aria-live="polite">
        <div className="agent-message"><span>AK</span><p>Tell us what you want your business to do better. We will suggest a practical starting point for your digital transformation.</p></div>
        {answers.map((answer, index) => <div className="thread-pair" key={answer}><div className="user-message">{answer}</div>{index + 1 < questions.length && index + 1 < step && <div className="agent-message compact"><span>AK</span><p>{questions[index + 1].prompt}</p></div>}</div>)}
        {!complete ? (
          <div className="choice-panel">
            <p className="current-question">{questions[step].prompt}</p>
            <div className="choice-grid">{questions[step].options.map((option) => <button key={option} onClick={() => choose(option)}>{option}<ChevronRight size={15} /></button>)}</div>
            <div className="mapper-progress"><span style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div><small>Question {step + 1} of {questions.length}</small>
          </div>
        ) : (
          <div className="recommendation-card" aria-busy={pilotState === 'loading'}>
            <div className="recommendation-head"><Check size={17} /><span>A SENSIBLE FIRST STEP</span></div>
            {pilotState === 'loading' ? (
              <p className="pilot-loading">Reading your answers and preparing a suggestion…</p>
            ) : (
              <>
                <h3>{title}</h3>
                {pilot ? (
                  <>
                    <p>{pilot.summary}</p>
                    <p className="pilot-workflow"><strong>Start here.</strong> {pilot.firstWorkflow}</p>
                    <ol className="pilot-steps">{pilot.steps.map((pilotStep) => <li key={pilotStep}>{pilotStep}</li>)}</ol>
                    <dl className="pilot-guardrails">
                      <div><dt>First milestone</dt><dd>{pilot.firstMetric}</dd></div>
                      <div><dt>Your team stays in control</dt><dd>{pilot.humanControl}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p>Begin with how your business can <strong>{answers[0]?.toLowerCase()}</strong> in {answers[1]}. We recommend connecting your {answers[2]?.toLowerCase()} setup to an integrated, reliable system, measuring business progress, and keeping your team firmly in control.</p>
                )}
              </>
            )}
            <div className="recommendation-actions"><button className="continue-button" disabled={pilotState === 'loading'} onClick={() => setShowContact(true)}>Discuss this with Aksen <ArrowRight size={16} /></button><button onClick={restart}>Start again</button></div>
            {showContact && status !== 'saved' && <form className="contact-continuation" onSubmit={save}><p><strong>Who should we prepare this for?</strong><br />We will review your answers before our team gets in touch.</p><label>Your name<input required value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></label><label>Work email<input required type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label><label>Company or project<input required value={contact.company} onChange={(event) => setContact({ ...contact, company: event.target.value })} /></label><button disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save my enquiry'} <ArrowRight size={15} /></button>{status === 'error' && <small>That did not save. Please try again.</small>}</form>}
            {status === 'saved' && <div className="saved-state"><Check size={18} /><div><strong>Your enquiry is in our pipeline.</strong><span>Our team will review your answers before contacting you.</span></div></div>}
          </div>
        )}
      </div>
    </div>
  );
}
