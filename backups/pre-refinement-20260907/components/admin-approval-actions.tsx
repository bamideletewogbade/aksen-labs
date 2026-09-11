'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';

type Decision = 'approved' | 'rejected';

export function ApprovalActions({ id }: { id: string }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [decided, setDecided] = useState<Decision | null>(null);
  const [message, setMessage] = useState('');

  async function decide(decision: Decision) {
    setStatus('saving');
    try {
      const response = await fetch('/api/admin/approvals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, decision }) });
      const data = await response.json() as { error?: string; carriedOut?: string };
      if (!response.ok) throw new Error(data.error || 'The decision could not be saved.');
      setMessage(data.carriedOut === 'published' ? 'Approved and published' : decision === 'approved' ? 'Approval recorded; no automated action' : 'Rejected');
      setDecided(decision);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'This could not be saved. Please retry.');
      setStatus('error');
    }
  }

  if (decided) {
    return <p className="approval-decided" role="status">{decided === 'approved' ? <Check size={13} /> : <X size={13} />} {message}</p>;
  }

  return (
    <>
      <div>
        <button type="button" onClick={() => decide('rejected')} disabled={status === 'saving'}>Reject</button>
        <button type="button" onClick={() => decide('approved')} disabled={status === 'saving'}>{status === 'saving' ? 'Saving...' : 'Approve'}</button>
      </div>
      {status === 'error' && <small className="form-error" role="alert">{message}</small>}
    </>
  );
}
