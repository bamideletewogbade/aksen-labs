'use client';
import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { PendingButton, SkeletonRows, StatusNote } from '@/components/ui/activity';

/**
 * Profile only, on purpose.
 *
 * The other things an operator might expect to find under "settings" are
 * deployment secrets held by Cloudflare: the database URL, the model provider
 * key, the admin password hash. A form that appeared to edit those would be
 * both untrue and a way to lock yourself out of the admin from inside the
 * admin. They are shown on this page as status, with where to change them.
 */
export function AdminSettings({
  displayNameLimit,
  fullNameLimit,
}: {
  displayNameLimit: number;
  fullNameLimit: number;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState<{ failed: boolean; text: string } | null>(
    null,
  );
  const [loadedFullName, setLoadedFullName] = useState('');
  const [loadedDisplayName, setLoadedDisplayName] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/settings', { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          displayName?: string;
          fullName?: string;
          email?: string;
        };
        setFullName(data.fullName ?? '');
        setDisplayName(data.displayName ?? '');
        setLoadedFullName(data.fullName ?? '');
        setLoadedDisplayName(data.displayName ?? '');
        setEmail(data.email ?? '');
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setNote({ failed: true, text: 'Settings could not be loaded.' });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const changed =
    fullName.trim() !== loadedFullName.trim() ||
    displayName.trim() !== loadedDisplayName.trim();

  async function save(event: { preventDefault(): void }) {
    event.preventDefault();
    setSaving(true);
    setNote(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName, displayName }),
      });
      const data = (await response.json()) as {
        error?: string;
        fullName?: string;
        displayName?: string;
      };
      if (!response.ok) throw new Error(data.error || 'That did not save.');
      setLoadedFullName(data.fullName ?? '');
      setLoadedDisplayName(data.displayName ?? '');
      setNote({
        failed: false,
        // The greeting is rendered on the server, so it does not change until
        // the next page load. Saying so avoids the obvious conclusion that the
        // save silently failed.
        text: 'Saved. The dashboard greeting updates when you next open it.',
      });
    } catch (e) {
      setNote({
        failed: true,
        text: e instanceof Error ? e.message : 'That did not save.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="settings-form">
        <SkeletonRows rows={3} label="Loading your profile" />
      </div>
    );

  return (
    <form className="settings-form arrive" onSubmit={save}>
      <label>
        Full name
        <input
          value={fullName}
          maxLength={fullNameLimit}
          placeholder="Bishop Tewogbade"
          onChange={(event) => setFullName(event.target.value)}
        />
        <small>Used on documents and in the record of who did what.</small>
      </label>
      <label>
        What to call you
        <input
          value={displayName}
          maxLength={displayNameLimit}
          placeholder="Bishop"
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <small>
          The dashboard greeting. Left empty, the first word of your full name
          is used.
        </small>
      </label>
      <label>
        Sign-in email
        <input value={email} disabled readOnly />
        <small>
          Set by ADMIN_EMAILS on the deployment. Changing who may sign in is not
          something the admin should be able to do to itself.
        </small>
      </label>
      <div className="settings-actions">
        <PendingButton
          type="submit"
          pending={saving}
          pendingLabel="Saving"
          disabled={!changed}
        >
          <UserRound size={15} />
          Save profile
        </PendingButton>
        {note && (
          <StatusNote tone={note.failed ? 'error' : 'done'}>
            {note.text}
          </StatusNote>
        )}
      </div>
    </form>
  );
}
