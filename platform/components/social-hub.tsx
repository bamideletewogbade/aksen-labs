'use client';
import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Save,
  ShieldCheck,
  PenLine,
} from 'lucide-react';
import { PendingButton, StatusNote } from '@/components/ui/activity';
import { AdminTabs } from '@/components/admin-tabs';
import {
  socialProviders,
  type SocialContext,
  type SocialProvider,
  type SocialWorkspace,
} from '@/lib/social-context';

type ProviderSetup = {
  id: SocialProvider;
  label: string;
  credentialReady: boolean;
  credentialNames: string;
  developerUrl: string;
};

const contextFields: Array<{
  key: keyof SocialContext;
  label: string;
  help: string;
  rows: number;
}> = [
  {
    key: 'mission',
    label: 'Mission',
    help: 'The change Aksen exists to make—not a campaign slogan.',
    rows: 3,
  },
  {
    key: 'audience',
    label: 'Who we are speaking to',
    help: 'The people, businesses and geography the draft should understand.',
    rows: 3,
  },
  {
    key: 'offers',
    label: 'What Aksen can actually help with',
    help: 'Real services and products. Keep experiments distinct from proven work.',
    rows: 4,
  },
  {
    key: 'voice',
    label: 'Voice',
    help: 'How Aksen should sound when the idea becomes a post.',
    rows: 3,
  },
  {
    key: 'guardrails',
    label: 'Evidence and approval rules',
    help: 'The promises AI must not invent and the decisions it must leave to you.',
    rows: 4,
  },
  {
    key: 'callToAction',
    label: 'Preferred next step',
    help: 'A useful, low-pressure action readers can take.',
    rows: 3,
  },
];

export function SocialHub({
  initialWorkspace,
  providers,
}: {
  initialWorkspace: SocialWorkspace;
  providers: ProviderSetup[];
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [savedWorkspace, setSavedWorkspace] = useState(initialWorkspace);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<{
    failed: boolean;
    text: string;
  } | null>(null);
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [proof, setProof] = useState('');
  const [selected, setSelected] = useState<SocialProvider[]>([
    'linkedin',
    'instagram',
    'tiktok',
    'x',
  ]);
  const [drafting, setDrafting] = useState(false);
  const [drafts, setDrafts] = useState<Partial<Record<SocialProvider, string>>>(
    {},
  );
  const [draftNote, setDraftNote] = useState<{
    failed: boolean;
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState<SocialProvider | null>(null);

  const changed = JSON.stringify(workspace) !== JSON.stringify(savedWorkspace);

  function setProfile(provider: SocialProvider, value: string) {
    setWorkspace((current) => ({
      ...current,
      profiles: { ...current.profiles, [provider]: value },
    }));
  }

  function setContext(key: keyof SocialContext, value: string) {
    setWorkspace((current) => ({
      ...current,
      context: { ...current.context, [key]: value },
    }));
  }

  async function save(event: { preventDefault(): void }) {
    event.preventDefault();
    setSaving(true);
    setSaveNote(null);
    try {
      const response = await fetch('/api/admin/social', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(workspace),
      });
      const data = (await response.json()) as SocialWorkspace & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error || 'Social Hub did not save.');
      const next = { profiles: data.profiles, context: data.context };
      setWorkspace(next);
      setSavedWorkspace(next);
      setSaveNote({
        failed: false,
        text: 'Saved. New AI social drafts will use this context.',
      });
    } catch (error) {
      setSaveNote({
        failed: true,
        text:
          error instanceof Error ? error.message : 'Social Hub did not save.',
      });
    } finally {
      setSaving(false);
    }
  }

  function toggleProvider(provider: SocialProvider) {
    setSelected((current) =>
      current.includes(provider)
        ? current.filter((item) => item !== provider)
        : [...current, provider],
    );
  }

  async function createDrafts(event: { preventDefault(): void }) {
    event.preventDefault();
    setDrafting(true);
    setDraftNote(null);
    try {
      const response = await fetch('/api/admin/social/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, goal, proof, providers: selected }),
      });
      const data = (await response.json()) as {
        drafts?: Partial<Record<SocialProvider, string>>;
        error?: string;
      };
      if (!response.ok || !data.drafts)
        throw new Error(data.error || 'Drafts were not created.');
      setDrafts(data.drafts);
      setDraftNote({
        failed: false,
        text: 'Drafts created for review. Nothing was posted.',
      });
    } catch (error) {
      setDraftNote({
        failed: true,
        text:
          error instanceof Error ? error.message : 'Drafts were not created.',
      });
    } finally {
      setDrafting(false);
    }
  }

  async function copyDraft(provider: SocialProvider, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(provider);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="social-stack">
      <section className="admin-panel social-safety">
        <ShieldCheck />
        <div>
          <strong>Your password does not belong in this workspace.</strong>
          <p>
            Profile links work now. Publishing uses each network&apos;s official
            sign-in once it is set up. AI drafts; you publish.
          </p>
        </div>
      </section>

      {/* Drafting is what this screen is opened for; channels and context are
          set once and revisited rarely, so they moved behind their own tabs
          instead of sitting above the studio on every visit. */}
      <AdminTabs
        label="Social Hub"
        tabs={[
          {
            id: 'studio',
            label: 'Draft studio',
            panel: (
              <form className="admin-panel" onSubmit={createDrafts}>
                <div className="panel-head">
                  <div>
                    <small>DRAFT STUDIO</small>
                    <h2>One idea, shaped for each channel</h2>
                  </div>
                  <PenLine />
                </div>
                <div className="social-draft-form">
                  <label>
                    Topic or rough thought
                    <textarea
                      rows={5}
                      required
                      value={topic}
                      placeholder="Example: Why we are building Aksen as a service business first, and what that teaches us about useful AI."
                      onChange={(event) => setTopic(event.target.value)}
                    />
                  </label>
                  <label>
                    What should this post achieve? <span>(optional)</span>
                    <input
                      value={goal}
                      placeholder="Start conversations with owners losing time to repetitive admin"
                      onChange={(event) => setGoal(event.target.value)}
                    />
                  </label>
                  <label>
                    Verified proof or source notes <span>(optional)</span>
                    <textarea
                      rows={3}
                      value={proof}
                      placeholder="Only include facts, links, tested capabilities or results we can defend."
                      onChange={(event) => setProof(event.target.value)}
                    />
                  </label>
                  <fieldset>
                    <legend>Channels</legend>
                    <div className="social-channel-choices">
                      {providers.map((provider) => (
                        <label key={provider.id}>
                          <input
                            type="checkbox"
                            checked={selected.includes(provider.id)}
                            onChange={() => toggleProvider(provider.id)}
                          />
                          {provider.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="settings-actions">
                  <PendingButton
                    type="submit"
                    pending={drafting}
                    pendingLabel="Shaping drafts"
                    disabled={!topic.trim() || !selected.length}
                  >
                    <PenLine size={15} /> Create review drafts
                  </PendingButton>
                  {draftNote && (
                    <StatusNote tone={draftNote.failed ? 'error' : 'done'}>
                      {draftNote.text}
                    </StatusNote>
                  )}
                </div>
                {Object.keys(drafts).length > 0 && (
                  <div className="social-draft-results">
                    {socialProviders.flatMap((provider) => {
                      const draft = drafts[provider];
                      if (!draft) return [];
                      const label = providers.find(
                        (item) => item.id === provider,
                      )?.label;
                      return [
                        <article key={provider}>
                          <div>
                            <h3>{label}</h3>
                            <button
                              type="button"
                              onClick={() => copyDraft(provider, draft)}
                            >
                              {copied === provider ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copied === provider ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <textarea
                            rows={provider === 'tiktok' ? 9 : 7}
                            value={draft}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [provider]: event.target.value,
                              }))
                            }
                            aria-label={`${label} draft`}
                          />
                        </article>,
                      ];
                    })}
                  </div>
                )}
              </form>
            ),
          },
          {
            id: 'channels',
            label: 'Channels',
            panel: (
              <section className="admin-panel">
                <div className="panel-head">
                  <div>
                    <small>CONNECTIONS</small>
                    <h2>Your social front doors</h2>
                  </div>
                </div>
                <p className="social-intro">
                  Add the public profile for each channel. A saved profile gives
                  you a one-click route to the account; API readiness tells us
                  whether secure publishing can be wired next.
                </p>
                <div className="social-provider-grid">
                  {providers.map((provider) => {
                    const profile = workspace.profiles[provider.id];
                    return (
                      <article className="social-provider" key={provider.id}>
                        <div className="social-provider-head">
                          <span
                            className={`social-mark social-mark-${provider.id}`}
                          >
                            {provider.id === 'x'
                              ? 'X'
                              : provider.label.slice(0, 2)}
                          </span>
                          <div>
                            <h3>{provider.label}</h3>
                            <span data-ready={Boolean(profile)}>
                              {profile ? 'Profile linked' : 'Profile needed'}
                            </span>
                          </div>
                        </div>
                        <label>
                          Public profile URL
                          <input
                            type="url"
                            inputMode="url"
                            placeholder={`https://${provider.id}.com/...`}
                            value={profile}
                            onChange={(event) =>
                              setProfile(provider.id, event.target.value)
                            }
                          />
                        </label>
                        <div className="social-provider-actions">
                          {profile && (
                            <a href={profile} target="_blank" rel="noreferrer">
                              Open profile <ExternalLink size={14} />
                            </a>
                          )}
                          <a
                            className="quiet-link"
                            href={provider.developerUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Developer setup <ExternalLink size={14} />
                          </a>
                        </div>
                        <div
                          className="social-api-status"
                          data-ready={provider.credentialReady}
                        >
                          <strong>
                            {provider.credentialReady
                              ? 'Developer credentials present'
                              : 'OAuth setup not configured'}
                          </strong>
                          <small>{provider.credentialNames}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ),
          },
          {
            id: 'context',
            label: 'AI context',
            panel: (
              <form className="admin-panel" onSubmit={save}>
                <div className="panel-head">
                  <div>
                    <small>AI CONTEXT</small>
                    <h2>What every draft should understand</h2>
                  </div>
                </div>
                <p className="social-intro">
                  This is reusable company context, not a one-off prompt. Edit
                  it as the business learns, wins real proof, or narrows an
                  offer.
                </p>
                <div className="social-context-grid">
                  {contextFields.map((field) => (
                    <label key={field.key}>
                      {field.label}
                      <textarea
                        rows={field.rows}
                        value={workspace.context[field.key]}
                        onChange={(event) =>
                          setContext(field.key, event.target.value)
                        }
                      />
                      <small>{field.help}</small>
                    </label>
                  ))}
                </div>
                <div className="settings-actions">
                  <PendingButton
                    type="submit"
                    pending={saving}
                    pendingLabel="Saving context"
                    disabled={!changed}
                  >
                    <Save size={15} /> Save profiles and context
                  </PendingButton>
                  {saveNote && (
                    <StatusNote tone={saveNote.failed ? 'error' : 'done'}>
                      {saveNote.text}
                    </StatusNote>
                  )}
                </div>
              </form>
            ),
          },
        ]}
      />
    </div>
  );
}
