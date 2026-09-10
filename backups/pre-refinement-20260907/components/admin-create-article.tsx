'use client';

import { ArrowRight, BookOpen, Check } from 'lucide-react';
import { useState } from 'react';

export function AdminCreateArticle() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function submit(event: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    event.preventDefault(); setStatus('saving');
    const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/admin/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Save failed'); setStatus('saved'); setTimeout(() => window.location.reload(), 700);
    } catch { setStatus('error'); }
  }

  return <section className="admin-panel quick-create-panel">
    <div className="panel-head"><div><small>NEW ARTICLE</small><h2>Draft a post</h2></div><BookOpen /></div>
    <form className="admin-create-form" onSubmit={submit}>
      <label>Title<input name="title" required placeholder="A useful, specific promise" /></label>
      <label>Series<select name="category"><option>AI in Practice</option><option>Work and Productivity</option><option>Tools We Tested</option><option>Build Notes</option><option>African AI</option></select></label>
      <label>Reader summary<textarea name="excerpt" required placeholder="Why should someone read this?" /></label>
      <label>Article<textarea name="content" required className="article-input" placeholder="Write in plain language. Separate paragraphs with a blank line." /></label>
      <p className="draft-publish-note">Save the draft first. Request publication from the article list when it is ready for review.</p>
      <button className="create-submit" disabled={status === 'saving' || status === 'saved'}>{status === 'saved' ? <><Check /> Saved</> : <>{status === 'saving' ? 'Saving...' : 'Save article'} <ArrowRight /></>}</button>
      {status === 'error' && <p className="form-error">This could not be saved. Confirm the Neon database and your admin access, then try again.</p>}
    </form>
  </section>;
}
