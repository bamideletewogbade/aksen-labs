'use client';
import { useEffect, useRef, useState } from 'react';
import { PendingButton, Spinner } from '@/components/ui/activity';

/**
 * A destructive action that takes two deliberate clicks in the same place.
 *
 * Not a `confirm()` dialog: those are blocked in some embedded contexts, cannot
 * be styled or made to explain themselves, and train people to dismiss them
 * without reading. Not a modal either, because every one of these sits inside a
 * list and a modal would lose the row it belongs to.
 *
 * Arming is abandoned on blur and after a few seconds, so a button left armed
 * by a distraction is not still waiting to fire when someone comes back and
 * clicks where they think the old label was.
 */
export function ConfirmAction({
  label,
  confirmLabel,
  pendingLabel,
  onConfirm,
  pending = false,
  disabled = false,
  className = '',
  title,
}: {
  label: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const [armed, setArmed] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 5000);
    const away = (event: FocusEvent | MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setArmed(false);
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('focusin', away as EventListener);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', away);
      document.removeEventListener('focusin', away as EventListener);
    };
  }, [armed]);

  return (
    <span className={`confirm-action ${className}`.trim()} ref={box}>
      {armed ? (
        <>
          <PendingButton
            type="button"
            className="confirm-action-go"
            pending={pending}
            pendingLabel={pendingLabel}
            disabled={disabled}
            onClick={() => {
              setArmed(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </PendingButton>
          <button
            type="button"
            className="confirm-action-cancel"
            onClick={() => setArmed(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          className="confirm-action-arm"
          title={title}
          disabled={disabled || pending}
          onClick={() => setArmed(true)}
        >
          {pending && <Spinner />}
          {pending ? pendingLabel : label}
        </button>
      )}
    </span>
  );
}
