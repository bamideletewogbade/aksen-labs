'use client';

import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { useState } from 'react';
import { PendingButton } from '@/components/ui/activity';

export function AdminCreateProject() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  async function submit(event: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    event.preventDefault();
    setStatus('saving');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Save failed');
      setStatus('saved');
      setTimeout(() => window.location.reload(), 700);
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="admin-panel quick-create-panel">
      <div className="panel-head">
        <div>
          <small>NEW PROJECT</small>
          <h2>Create a project</h2>
        </div>
        <BriefcaseBusiness />
      </div>
      <form className="admin-create-form" onSubmit={submit}>
        <label>
          Project name
          <input name="name" required placeholder="Customer portal launch" />
        </label>
        <label>
          Client
          <input
            name="clientName"
            required
            placeholder="Client or internal initiative"
          />
        </label>
        <label>
          Business outcome
          <textarea
            name="objective"
            required
            placeholder="What must improve, for whom, and how will we know?"
          />
        </label>
        <PendingButton
          className="create-submit"
          pending={status === 'saving'}
          done={status === 'saved'}
          pendingLabel="Creating"
          doneLabel="Saved"
        >
          Create project <ArrowRight />
        </PendingButton>
        {status === 'error' && (
          <p className="form-error">
            This could not be saved. Confirm the Neon database and your admin
            access, then try again.
          </p>
        )}
      </form>
    </section>
  );
}
