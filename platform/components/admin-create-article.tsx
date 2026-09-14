'use client';

import { ArrowRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { PendingButton, StatusNote } from '@/components/ui/activity';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

export function AdminCreateArticle() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  // Controlled, because the editor has a preview mode in which the textarea is
  // unmounted, and FormData cannot read a field that is not in the document.
  const [content, setContent] = useState('');

  async function submit(event: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    event.preventDefault();
    setStatus('saving');
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), content };
    try {
      const response = await fetch('/api/admin/posts', {
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
          <small>NEW ARTICLE</small>
          <h2>Draft a post</h2>
        </div>
        <BookOpen />
      </div>
      <form className="admin-create-form" onSubmit={submit}>
        <label>
          Title
          <input name="title" required placeholder="A useful, specific promise" />
        </label>
        <label>
          Series
          <select name="category">
            <option>AI in Practice</option>
            <option>Work and Productivity</option>
            <option>Tools We Tested</option>
            <option>Build Notes</option>
            <option>African AI</option>
          </select>
        </label>
        <label>
          Reader summary
          <textarea
            name="excerpt"
            required
            placeholder="Why should someone read this?"
          />
        </label>
        <span className="md-field-label" id="article-body-label">
          Article
        </span>
        <MarkdownEditor
          id="article-body"
          value={content}
          onChange={setContent}
          disabled={status === 'saving' || status === 'saved'}
          describedBy="article-body-hint"
          placeholder={
            'Write in plain language. Separate paragraphs with a blank line.\n\n## A section heading\n\nSomething worth reading.'
          }
        />
        <p id="article-body-hint" className="draft-publish-note">
          Save the draft first. Request publication from the article list when
          it is ready for review.
        </p>
        <PendingButton
          className="create-submit"
          pending={status === 'saving'}
          done={status === 'saved'}
          pendingLabel="Saving"
          doneLabel="Saved"
          disabled={!content.trim()}
        >
          Save article <ArrowRight />
        </PendingButton>
        {status === 'error' && (
          <p className="form-error">
            <StatusNote tone="error">
              This could not be saved. Confirm the Neon database and your admin
              access, then try again.
            </StatusNote>
          </p>
        )}
      </form>
    </section>
  );
}
