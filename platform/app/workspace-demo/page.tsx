'use client';
import {ResponseText} from '@/components/response-text';
import Link from 'next/link';
import { useState } from 'react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { demoBrief } from '@/lib/workspace-demo';
export default function WorkspaceDemo() {
  const [result, setResult] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function prepare(task: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/workspace-demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = (await response.json()) as {
        content?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error);
      setResult(data.content || 'No draft returned.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The preview is unavailable.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="workspace"
          label="WORKSPACE DEMO · FICTIONAL BUSINESS"
          title={
            <>
              A brief in.
              <br />
              <em>A useful draft out.</em>
            </>
          }
          text="Try the document assistant with a sample business brief. Review what it prepares and the questions it leaves for a person."
        />
        <section
          className="workspace-main"
          style={{
            padding: 'clamp(22px, 5vw, 70px)',
            maxWidth: 1300,
            margin: 'auto',
          }}
        >
          <div className="ws-grid">
            <section className="ws-card ws-form">
              <span className="ws-badge">SOURCE 1 · EXAMPLE ONLY</span>
              <h2>Cedar Studio discovery note</h2>
              <p>{demoBrief}</p>
              <button disabled={busy} onClick={() => prepare('brief')}>
                Find the open questions
              </button>
              <button
                className="ws-primary"
                disabled={busy}
                onClick={() => prepare('proposal')}
              >
                Prepare a proposed scope
              </button>
              <p className="ws-note">
                A shared request limit keeps this preview available within a
                bounded AI budget. Nothing is issued or sent.
              </p>
            </section>
            <section className="ws-card">
              <h2>Review the assistant’s draft</h2>
              {busy && <output>Reading the sample brief…</output>}
              {error && (
                <p className="ws-alert" role="alert">
                  {error}
                </p>
              )}
              <div className="ws-document-text" aria-live="polite">
                {result ? <ResponseText text={result}/> : 'Choose a task to prepare a readable draft from the sample brief.'}
              </div>
              <p className="ws-note">
                In a business workspace, you choose your own documents, edit the
                result and save it with source references.
              </p>
            </section>
          </div>
          <div className="ws-card" style={{ marginTop: 22 }}>
            <h2>People control the commitments.</h2>
            <p>
              Reviewed proposal → financial draft → issued invoice → recorded
              payment → receipt. The assistant helps prepare the work; it cannot
              approve scope, set prices or claim money has arrived.
            </p>
            <Link className="ws-demo-link" href="/agent-mapper">
              Explore a workflow for your business
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
