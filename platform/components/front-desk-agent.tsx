'use client';

/**
 * The Front Desk, talking.
 *
 * The visible tool cards are the point. A visitor should see the agent check
 * the price list, write up the order and pass the discount request on, not
 * just read a fluent reply, because the reply is the part any chatbot can
 * fake. What it looked up and what it handed over is what makes it an agent.
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  ArrowUp,
  ClipboardList,
  RotateCcw,
  Search,
  Truck,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FrontDeskMessage } from '@/app/api/front-desk/route';
import { frontDeskStarters, shop } from '@/lib/front-desk';

type Part = FrontDeskMessage['parts'][number];

function Working({ label }: { label: string }) {
  return <div className="fd-card is-working">{label}</div>;
}

function ToolCard({ part }: { part: Part }) {
  switch (part.type) {
    case 'tool-lookUpProducts': {
      if (part.state === 'output-error')
        return <div className="fd-card is-error">{part.errorText}</div>;
      if (part.state !== 'output-available')
        return <Working label="Checking the price list" />;
      return (
        <div className="fd-card">
          <span className="fd-card-label">
            <Search size={14} /> Checked the price list
          </span>
          {part.output.items.length ? (
            <ul className="fd-items">
              {part.output.items.map((item) => (
                <li key={item.sku}>
                  <span>{item.name}</span>
                  <strong>{item.inStock ? item.price : 'Out of stock'}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nothing on the list matches.</p>
          )}
        </div>
      );
    }
    case 'tool-checkDelivery': {
      if (part.state === 'output-error')
        return <div className="fd-card is-error">{part.errorText}</div>;
      if (part.state !== 'output-available')
        return <Working label="Checking delivery" />;
      return (
        <div className="fd-card">
          <span className="fd-card-label">
            <Truck size={14} /> Checked delivery
          </span>
          <p>
            {part.output.area
              ? `${part.output.area}: ${part.output.fee}, ${part.output.days}`
              : 'Not a listed area. The owner sets this fee.'}
          </p>
        </div>
      );
    }
    case 'tool-prepareOrder': {
      if (part.state === 'output-error')
        return <div className="fd-card is-error">{part.errorText}</div>;
      if (part.state !== 'output-available')
        return <Working label="Writing up the order" />;
      const order = part.output;
      return (
        <div className={`fd-card is-order ${order.ready ? 'is-ready' : ''}`}>
          <span className="fd-card-label">
            <ClipboardList size={14} /> Order written up
          </span>
          {order.lines.length > 0 && (
            <ul className="fd-items">
              {order.lines.map((line) => (
                <li key={line.sku}>
                  <span>
                    {line.quantity} × {line.name}
                  </span>
                  <strong>{line.lineTotal}</strong>
                </li>
              ))}
              {order.delivery && (
                <li>
                  <span>Delivery, {order.delivery.area}</span>
                  <strong>{order.delivery.fee}</strong>
                </li>
              )}
              {order.total && (
                <li className="fd-total">
                  <span>Total</span>
                  <strong>{order.total}</strong>
                </li>
              )}
            </ul>
          )}
          {order.problems.map((problem) => (
            <p className="fd-problem" key={problem}>
              {problem}
            </p>
          ))}
          {order.missing.length > 0 && (
            <p className="fd-missing">
              Still needed: {order.missing.join(', ')}.
            </p>
          )}
          {order.ready && (
            <p className="fd-ready">
              Ready for the payment link. In a live shop Paystack sends it; in
              this demo nothing is sent.
            </p>
          )}
        </div>
      );
    }
    case 'tool-handToOwner': {
      if (part.state === 'output-error')
        return <div className="fd-card is-error">{part.errorText}</div>;
      if (part.state !== 'output-available')
        return <Working label="Passing this to the owner" />;
      return (
        <div className="fd-card is-handover">
          <span className="fd-card-label">
            <UserRound size={14} /> Passed to the owner · {part.output.reason}
          </span>
          <p>{part.output.summary}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

export function FrontDeskAgent() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport<FrontDeskMessage>({ api: '/api/front-desk' }),
    [],
  );
  const { messages, sendMessage, status, error, setMessages } =
    useChat<FrontDeskMessage>({ transport });
  const [draft, setDraft] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const busy = status === 'submitted' || status === 'streaming';

  // Follow the conversation inside the panel only. Scrolling the page would
  // pull a reader away from wherever they were reading.
  useEffect(() => {
    const node = log.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setDraft('');
    void sendMessage({ text: value });
  };

  return (
    <div className="fd-shell">
      <div className="fd-head">
        <div>
          <strong>{shop.name}</strong>
          <span>Fictional shop · live agent</span>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            className="fd-reset"
            onClick={() => setMessages([])}
            disabled={busy}
          >
            <RotateCcw size={14} /> Start again
          </button>
        )}
      </div>
      <div className="fd-log" ref={log} aria-live="polite">
        {messages.length === 0 && (
          <div className="fd-empty">
            <p>
              Write to it as a customer would. Ask for a price, place an order,
              or ask for something it should not decide on its own.
            </p>
            <div className="fd-starters">
              {frontDeskStarters.map((starter) => (
                <button
                  type="button"
                  key={starter}
                  onClick={() => send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`fd-turn ${message.role === 'user' ? 'is-customer' : 'is-agent'}`}
          >
            {message.parts.map((part, index) =>
              part.type === 'text' ? (
                part.text.trim() ? (
                  <p className="fd-bubble" key={index}>
                    {part.text}
                  </p>
                ) : null
              ) : (
                <ToolCard part={part} key={index} />
              ),
            )}
          </div>
        ))}
        {status === 'submitted' && <Working label="Reading your message" />}
        {error && (
          <p className="fd-error">
            The front desk could not answer just now. Try again in a moment.
          </p>
        )}
      </div>
      <form
        className="fd-input"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <label className="sr-only" htmlFor="fd-message">
          Message the front desk
        </label>
        <input
          id="fd-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type as a customer. Made-up details are fine."
          maxLength={500}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send"
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}
