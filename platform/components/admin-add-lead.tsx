'use client';

import { ArrowRight, Check, UserPlus } from 'lucide-react';
import { useState } from 'react';

export function AdminAddLead() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  async function submit(event: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');
    const payload = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    try {
      const response = await fetch('/api/admin/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error || 'This could not be saved.');
        throw new Error('failed');
      }
      setStatus('saved');
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="admin-panel quick-create-panel">
      <div className="panel-head">
        <div>
          <small>ADD A LEAD</small>
          <h2>Add an enquiry</h2>
        </div>
        <UserPlus />
      </div>
      <form className="admin-create-form" onSubmit={submit}>
        <label>
          Their name
          <input name="name" required placeholder="Contact name" />
        </label>
        <label>
          Business
          <input
            name="company"
            required
            placeholder="Business or organisation"
          />
        </label>
        <label>
          Email <small>optional</small>
          <input
            name="email"
            type="email"
            placeholder="Leave blank if you only have WhatsApp"
          />
        </label>
        <label>
          What do they need?
          <textarea
            name="need"
            required
            placeholder="Enquiries piling up on WhatsApp with no record of them"
          />
        </label>
        <label>
          Where did they come from?
          <input
            name="channel"
            placeholder="Instagram comment, referral, event"
          />
        </label>
        <label>
          Follow up on <small>optional</small>
          <input name="followUpAt" type="date" />
        </label>
        <button
          className="create-submit"
          disabled={status === 'saving' || status === 'saved'}
        >
          {status === 'saved' ? (
            <>
              <Check /> Added
            </>
          ) : (
            <>
              {status === 'saving' ? 'Saving...' : 'Add to pipeline'}{' '}
              <ArrowRight />
            </>
          )}
        </button>
        {status === 'error' && (
          <p className="form-error">
            {message ||
              'This could not be saved. Check the database connection and try again.'}
          </p>
        )}
      </form>
    </section>
  );
}
