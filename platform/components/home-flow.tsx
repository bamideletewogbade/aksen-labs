'use client';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { Check, Pause, Play } from 'lucide-react';

/**
 * One enquiry, followed from the customer's message to the moment money is
 * agreed. The homepage used to name places (on WhatsApp, in the shop) without
 * saying who does what, which left the reader guessing. Here every step names
 * an actor, and the last step is held by a person on purpose.
 */

type Actor = 'agent' | 'you';

const steps: {
  time: string;
  actor: Actor;
  title: string;
  detail: string;
}[] = [
  {
    time: '9:04 PM',
    actor: 'agent',
    title: 'A customer messages after you close',
    detail:
      'Same WhatsApp number your customers already save. Nobody has to install anything or learn a new app.',
  },
  {
    time: '9:04 PM',
    actor: 'agent',
    title: 'Price, stock and delivery are answered',
    detail:
      'From the prices and delivery areas you gave it. When it does not know something, it says so and calls you in.',
  },
  {
    time: '9:06 PM',
    actor: 'agent',
    title: 'The missing details are asked for',
    detail:
      'Name, quantity, address, a number to call. No half orders waiting for you to chase them in the morning.',
  },
  {
    time: '9:06 PM',
    actor: 'agent',
    title: 'The order is written down for you',
    detail:
      'One list your whole team can open, already filled in. Nothing sits in one person’s phone.',
  },
  {
    time: '7:31 AM',
    actor: 'you',
    title: 'You approve it, then it goes out',
    detail:
      'The discount, the promise date, the final price. Those stay with a person, and the customer only hears once you say yes.',
  },
];

const messages: {
  step: number;
  from: 'customer' | 'agent';
  text: string;
}[] = [
  {
    step: 0,
    from: 'customer',
    text: 'Good evening. Do you still have the 5 litre shea butter? How much is it?',
  },
  {
    step: 1,
    from: 'agent',
    text: 'Good evening. Yes, the 5 litre tub is in stock at GHS 480. Delivery inside Accra is GHS 30.',
  },
  {
    step: 2,
    from: 'agent',
    text: 'Shall I hold one for you? I will need a name, the delivery address and a number to call on arrival.',
  },
  {
    step: 2,
    from: 'customer',
    text: 'Yes please. Ama Boateng, 14 Spintex Road, 024 555 0198. Tomorrow is fine.',
  },
  {
    step: 3,
    from: 'agent',
    text: 'Noted, Ama. One 5 litre tub to Spintex Road, GHS 510 with delivery. The shop confirms in the morning and I will message you.',
  },
  {
    step: 4,
    from: 'agent',
    text: 'Confirmed by the shop. The rider leaves at 9:40 AM. Pay on delivery or by MoMo before he arrives.',
  },
];

const record: { step: number; label: string; value: string }[] = [
  { step: 1, label: 'Item', value: 'Shea butter, 5 litre tub' },
  { step: 1, label: 'Price', value: 'GHS 480' },
  { step: 2, label: 'Customer', value: 'Ama Boateng, 024 555 0198' },
  { step: 2, label: 'Deliver to', value: '14 Spintex Road, Accra' },
  { step: 3, label: 'Delivery', value: 'Tomorrow, GHS 30' },
  { step: 3, label: 'Total', value: 'GHS 510' },
];

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function HomeFlow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    reducedMotion,
    () => true,
  );
  const shell = useRef<HTMLDivElement>(null);
  const running = !paused && !engaged && visible && !reduced;

  // A diagram that plays while nobody is looking is wasted work and a wasted
  // battery, so it only runs while it is on screen and the tab is in front.
  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        update();
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    // The last step is the one worth reading twice, so it holds longer.
    const hold = active === steps.length - 1 ? 6200 : 4200;
    const timer = window.setTimeout(
      () => setActive((value) => (value + 1) % steps.length),
      hold,
    );
    return () => window.clearTimeout(timer);
  }, [running, active]);

  const current = steps[active];
  const shown = messages.filter((message) => message.step <= active);
  const approved = active === steps.length - 1;

  return (
    <div
      className={`flow-shell ${running ? 'is-playing' : 'is-paused'}`}
      ref={shell}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setEngaged(true);
      }}
      onPointerLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setEngaged(false);
      }}
    >
      {/* The two panes illustrate the step list beside them and add nothing a
          reader would miss, so they stay out of the accessibility tree rather
          than announcing a new chat message every four seconds. */}
      <div className="flow-panes" aria-hidden="true">
        <div className="flow-pane flow-chat">
          <div className="flow-pane-head">
            <span className="flow-channel">
              <span className="flow-dot" />
              WHATSAPP
            </span>
            <span className="flow-pane-note">Your shop number</span>
          </div>
          <div className="flow-thread">
            {shown.map((message, index) => (
              <p
                key={`${message.step}-${index}`}
                className={`flow-bubble is-${message.from}`}
                style={{
                  // Two messages can belong to one step. The second waits for
                  // the first so the thread reads like someone typing it.
                  animationDelay: `${index - shown.findIndex((item) => item.step === message.step) > 0 ? 620 : 0}ms`,
                }}
              >
                {message.text}
              </p>
            ))}
            {active < steps.length - 1 && (
              <span className="flow-typing">
                <i />
                <i />
                <i />
              </span>
            )}
          </div>
        </div>

        <div className="flow-pane flow-record">
          <div className="flow-pane-head">
            <span className="flow-channel">
              <span className="flow-dot" />
              YOUR ORDER LIST
            </span>
            <span className="flow-pane-note">Order 1042</span>
          </div>
          <dl className="flow-fields">
            {record.map((field) => {
              const filled = field.step <= active;
              return (
                <div
                  key={field.label}
                  className={`flow-field ${filled ? 'is-filled' : ''}`}
                >
                  <dt>{field.label}</dt>
                  <dd>
                    {filled ? (
                      <span className="flow-value">{field.value}</span>
                    ) : (
                      <span className="flow-blank" />
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div
            className={`flow-approval ${approved ? 'is-approved' : ''} ${
              active >= 3 ? 'is-ready' : ''
            }`}
          >
            <span className="flow-approval-mark">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="flow-approval-text">
              <strong>
                {approved
                  ? 'Approved by you, 7:31 AM'
                  : active >= 3
                    ? 'Waiting for you to approve'
                    : 'Nothing to approve yet'}
              </strong>
              <small>
                Price, discount and promise date stay with a person.
              </small>
            </span>
          </div>
        </div>
      </div>

      <div className="flow-side">
        <ol
          className="flow-steps"
          style={
            {
              '--flow-fill': `${(active / (steps.length - 1)) * 100}%`,
            } as CSSProperties
          }
        >
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={
                index === active
                  ? 'is-current'
                  : index < active
                    ? 'is-done'
                    : ''
              }
            >
              <button
                type="button"
                aria-pressed={index === active}
                onClick={() => {
                  setActive(index);
                  setPaused(true);
                }}
              >
                <span className="flow-step-meta">
                  <span className="flow-step-time">{step.time}</span>
                  <span className={`flow-who is-${step.actor}`}>
                    {step.actor === 'agent' ? 'THE AGENT' : 'YOU'}
                  </span>
                </span>
                <span className="flow-step-title">{step.title}</span>
                {/* Collapsed with a grid row rather than display:none, so the
                    detail stays readable to a screen reader on every step
                    while only the current one takes up space. */}
                <span className="flow-step-detail">
                  <span>{step.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flow-controls">
          <span className="flow-count">
            Step {active + 1} of {steps.length}
            <span className="flow-count-detail">
              {current.actor === 'agent'
                ? 'Handled by the agent'
                : 'Held by your team'}
            </span>
          </span>
          <button
            type="button"
            className="flow-toggle"
            disabled={reduced}
            onClick={() => setPaused((value) => !value)}
            aria-label={
              reduced
                ? 'Automatic motion is off because of your device setting'
                : paused
                  ? 'Play the walkthrough'
                  : 'Pause the walkthrough'
            }
          >
            {paused || reduced ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
