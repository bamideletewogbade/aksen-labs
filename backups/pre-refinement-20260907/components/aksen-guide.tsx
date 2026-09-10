'use client';

import { ArrowRight, Loader2, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type GuideMessage = { role: 'user' | 'assistant'; content: string };
type GuideLink = { label: string; href: string };
const starters = [
  'What could Aksen help my business improve?',
  'Can you connect our website, payments and operations?',
  'We have an idea for a digital product. Where should we start?',
];

export function AksenGuide() {
  const [messages, setMessages] = useState<GuideMessage[]>([
    {
      role: 'assistant',
      content: 'Hi, I am the Aksen Guide. Tell me what you would like your business to do better, or ask how we can help connect your systems and customer experiences.',
    },
  ]);
  const [links, setLinks] = useState<GuideLink[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());

  async function ask(text?: string) {
    const nextQuestion = (text || question).trim();
    if (!nextQuestion || loading) return;
    const history = messages.slice(-6);
    setMessages((current) => [...current, { role: 'user', content: nextQuestion }]);
    setQuestion(''); setLoading(true); setLinks([]);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: nextQuestion, history, conversationId }) });
      if (!response.ok) throw new Error('Guide unavailable');
      const data = await response.json() as { answer?: string; links?: GuideLink[] };
      setMessages((current) => [...current, { role: 'assistant', content: data.answer || 'Let us map a sensible place to start.' }]);
      setLinks(Array.isArray(data.links) ? data.links : []);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Aksen helps businesses improve customer experiences, connect operations and build digital products, using AI where it adds value. Explore our services or tell us what you want your business to do better.',
        },
      ]);
      setLinks([
        { label: 'Explore our services', href: '/solutions' },
        { label: 'Discuss your business', href: '/agent-mapper' },
      ]);
    }
    finally { setLoading(false); }
  }

  return <Sheet>
    <SheetTrigger className="aksen-guide-trigger" aria-label="Open the Aksen Guide"><span className="brand-signal" /><span>Ask Aksen</span></SheetTrigger>
    <SheetContent side="right" className="aksen-guide-panel" showCloseButton>
      <div className="guide-head"><span><span className="guide-badge-mark" /></span><div><SheetTitle>Aksen Guide</SheetTitle><SheetDescription>Find a sensible place to begin.</SheetDescription></div></div>
      <div className="guide-thread" aria-live="polite">
        {messages.map((message, index) => <div className={`guide-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? <span className="guide-msg-mark" /> : 'You'}</span><p>{message.content}</p></div>)}
        {loading && <div className="guide-message assistant"><span><Loader2 size={14} className="icon-spin" /></span><p>Thinking about the most useful next step...</p></div>}
        {messages.length === 1 && <div className="guide-starters">{starters.map((starter) => <button type="button" onClick={() => ask(starter)} key={starter}>{starter}<ArrowRight size={14} /></button>)}</div>}
        {links.length > 0 && <div className="guide-links">{links.map((link) => <a href={link.href} key={link.href}>{link.label}<ArrowRight size={14} /></a>)}</div>}
      </div>
      <form className="guide-compose" onSubmit={(event) => { event.preventDefault(); void ask(); }}><label htmlFor="aksen-guide-question">Ask about your business or our transformation services</label><div><input id="aksen-guide-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask what Aksen can help your business improve..." maxLength={500} /><button type="submit" disabled={!question.trim() || loading} aria-label="Send question">{loading ? <Loader2 size={17} className="icon-spin" /> : <Send size={17} />}</button></div><small><MessageCircle size={12} /> Answers are a starting point. Our team reviews every enquiry personally.</small></form>
    </SheetContent>
  </Sheet>;
}

