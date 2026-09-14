'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { PendingButton, StatusNote } from '@/components/ui/activity';

type Decision = 'approved' | 'rejected';

export function ApprovalActions({ id }: { id: string }) {
  // Which decision is in flight, not merely that one is. Both buttons were
  // disabled while saving but only Approve changed its label, so rejecting
  // looked like nothing had happened at all.
  const [saving, setSaving] = useState<Decision | null>(null);
  const [failed, setFailed] = useState(false);
  const [decided, setDecided] = useState<Decision | null>(null);
  const [message, setMessage] = useState('');

  async function decide(decision: Decision) {
    setSaving(decision);
    setFailed(false);
    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, decision }),
      });
      const data = (await response.json()) as {
        error?: string;
        carriedOut?: string;
      };
      if (!response.ok)
        throw new Error(data.error || 'The decision could not be saved.');
      setMessage(
        data.carriedOut === 'published'
          ? 'Approved and published'
          : decision === 'approved'
            ? 'Approval recorded; no automated action'
            : 'Rejected',
      );
      setDecided(decision);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'This could not be saved. Please retry.',
      );
      setFailed(true);
    } finally {
      setSaving(null);
    }
  }

  if (decided) {
    return (
      <output className="approval-decided arrive">
        {decided === 'approved' ? <Check size={13} /> : <X size={13} />}{' '}
        {message}
      </output>
    );
  }

  return (
    <>
      <div>
        <PendingButton
          type="button"
          pending={saving === 'rejected'}
          pendingLabel="Rejecting"
          disabled={saving !== null}
          onClick={() => decide('rejected')}
        >
          Reject
        </PendingButton>
        <PendingButton
          type="button"
          pending={saving === 'approved'}
          pendingLabel="Approving"
          disabled={saving !== null}
          onClick={() => decide('approved')}
        >
          Approve
        </PendingButton>
      </div>
      {failed && (
        <small className="form-error" role="alert">
          <StatusNote tone="error">{message}</StatusNote>
        </small>
      )}
    </>
  );
}
