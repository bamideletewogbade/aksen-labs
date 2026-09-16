'use client';
import { Check, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * A spinner never appears alone. Under prefers-reduced-motion it stops
 * turning, and globals.css enforces that globally, so anything relying on the
 * movement to say "working" would go silent. The label beside it is what
 * actually carries the message; this draws attention to it.
 */
export function Spinner({
  size = 14,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`aksen-spinner ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A button that reports its own work.
 *
 * The label is rendered a second time, hidden and unmeasured, at its resting
 * width. The button therefore keeps one size across idle, pending and done,
 * instead of growing when "Save" becomes "Saving…" and nudging everything
 * beside it. aria-busy and the polite live region mean the change is announced
 * rather than only drawn.
 */
export function PendingButton({
  pending,
  done,
  children,
  pendingLabel,
  doneLabel = 'Saved',
  className = '',
  disabled,
  ...rest
}: {
  pending: boolean;
  done?: boolean;
  children: ReactNode;
  pendingLabel: string;
  doneLabel?: string;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button
      {...rest}
      className={`pending-button ${className}`.trim()}
      aria-busy={pending}
      disabled={disabled || pending}
    >
      {/* Every label the button can show, stacked and unmeasured, so its width
          is the widest of them. Reserving only the idle label still let the
          button grow whenever the pending text was the longer one, which is
          the usual case: "Save" becoming "Saving".

          The sizer and the face occupy the same grid cell. As flex siblings
          they added up instead: the button needed room for the label twice,
          and anything not stretched to full width wrapped, which is why the
          icon sat on its own line above the text on every admin form. */}
      <span className="pending-button-sizer" aria-hidden="true">
        <span>{children}</span>
        <span>{pendingLabel}</span>
        {done !== undefined && <span>{doneLabel}</span>}
      </span>
      <span className="pending-button-face">
        {pending && <Spinner />}
        {done && !pending && <Check size={14} aria-hidden="true" />}
        <span className="pending-button-label">
          {pending ? pendingLabel : done ? doneLabel : children}
        </span>
      </span>
    </button>
  );
}

/** A placeholder that keeps the shape of what is coming, rather than a word. */
export function Skeleton({
  width,
  height = '1em',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, display: 'block' }}
      aria-hidden="true"
    />
  );
}

/**
 * Rows of skeleton while a list loads. The region is labelled for screen
 * readers, which get a single "Loading" rather than a run of empty boxes.
 */
export function SkeletonRows({
  rows = 3,
  label = 'Loading',
}: {
  rows?: number;
  label?: string;
}) {
  return (
    // <output> carries role="status" implicitly, so the announcement is the
    // same without the attribute.
    <output className="skeleton-stack" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height="1.05em" />
      ))}
    </output>
  );
}

/** Inline result of an action: working, done, or failed, announced politely. */
export function StatusNote({
  tone,
  children,
}: {
  tone: 'working' | 'done' | 'error';
  children: ReactNode;
}) {
  return (
    <output className="status-note" data-tone={tone} aria-live="polite">
      {tone === 'working' && <Spinner />}
      {tone === 'done' && <Check size={14} aria-hidden="true" />}
      {tone === 'error' && <TriangleAlert size={14} aria-hidden="true" />}
      {children}
    </output>
  );
}

/**
 * True once a request has been running long enough to be worth interrupting
 * the page for. Showing a loading state instantly makes a fast response flash,
 * which reads as a glitch; this holds it back until the wait is real.
 */
export function useDelayedPending(pending: boolean, delay = 220) {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    // No synchronous setState in the effect body: the reset is handled by
    // returning `pending && elapsed` instead, which also means the indicator
    // disappears the instant the work finishes rather than a render later.
    if (!pending) return;
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => {
      clearTimeout(timer);
      setElapsed(false);
    };
  }, [pending, delay]);
  return pending && elapsed;
}
