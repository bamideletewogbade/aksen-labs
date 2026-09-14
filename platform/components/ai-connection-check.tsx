'use client';
import { useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
import { AI_PROFILES, type AiProfile } from '@/lib/ai-routing';
export function AiConnectionCheck() {
  const [profile, setProfile] = useState<AiProfile>('conversation');
  const [routing, setRouting] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  async function check() {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const response = await fetch('/api/admin/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, routing }),
      });
      const data = (await response.json()) as {
        error?: string;
        model: string;
        durationMs: number;
        content: string;
        costMicros?: number;
      };
      if (!response.ok) throw Error(data.error || 'Test failed');
      setMessage(
        `Answered by ${data.model} in ${(data.durationMs / 1000).toFixed(1)}s. ${data.costMicros === undefined ? 'Cost not reported.' : `Reported cost: USD ${(data.costMicros / 1000000).toFixed(6)}.`} Response: ${data.content}`,
      );
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ai-check">
      <label>
        Use case
        <select
          value={profile}
          disabled={busy}
          onChange={(e) => setProfile(e.target.value as AiProfile)}
        >
          {Object.entries(AI_PROFILES).map(([id, item]) => (
            <option key={id} value={id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Test route
        <select
          value={routing}
          disabled={busy}
          onChange={(e) => setRouting(e.target.value)}
        >
          <option value="auto">Automatic selection</option>
          <option value="default">Default model + fallbacks</option>
        </select>
      </label>
      <PendingButton
        pending={busy}
        pendingLabel="Testing"
        onClick={() => void check()}
      >
        Run a small AI test
      </PendingButton>
      <p>
        Uses fictional data and provider credits. Five tests per hour. This does
        not change the active configuration.
      </p>
      {message &&
        (failed ? <p role="alert">{message}</p> : <output>{message}</output>)}
    </div>
  );
}
