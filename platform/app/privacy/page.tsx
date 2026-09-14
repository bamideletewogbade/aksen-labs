import type { Metadata } from 'next';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { emailConfig } from '@/lib/resend';

export const metadata: Metadata = {
  title: 'Privacy | Aksen Labs',
  description:
    'What Aksen Labs collects when you send an enquiry or use the free business agents, why we hold it, who processes it and how to reach us about it.',
};

export default function PrivacyPage() {
  const contact = emailConfig().replyTo;
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content" className="privacy-page agency-container">
        <header>
          <p className="agency-eyebrow">PRIVACY</p>
          <h1>What we collect, and why.</h1>
          <p className="privacy-lead">
            This describes what actually happens when you use this website. If
            anything here is unclear, ask us and we will explain it.
          </p>
        </header>

        <section>
          <h2>When you send an enquiry</h2>
          <p>
            The contact and pricing forms collect your name, your work email,
            your company name and your answers to the three questions, plus the
            pricing package you selected if you came from that page.
          </p>
          <p>
            We use it to read your enquiry and reply to you. We send you an
            acknowledgement so you know it arrived, and we notify ourselves so
            it is not missed. We do not sell it, and we do not add you to a
            marketing list from this form.
          </p>
        </section>

        <section>
          <h2>When you use the free business agents</h2>
          <p>
            The brief you type is sent to our AI provider to produce your draft.
            Do not put passwords, card numbers, or another person&rsquo;s
            personal details into it.
          </p>
          <p>
            For visitors, we record that a run happened and whether it
            succeeded. We do not store the brief you wrote or the draft you
            received, so download anything you want to keep before you leave the
            page. Drafts run from the Aksen admin workspace are saved to that
            account.
          </p>
        </section>

        <section>
          <h2>Who processes it</h2>
          <ul>
            <li>
              <strong>Neon</strong> hosts the database where enquiries are
              stored.
            </li>
            <li>
              <strong>Cloudflare</strong> serves this website and sees the
              network requests that reach it.
            </li>
            <li>
              <strong>Resend</strong> delivers the enquiry emails.
            </li>
            <li>
              <strong>OpenRouter</strong> runs the AI models behind the agents
              and the assistant.
            </li>
            <li>
              <strong>WhatsApp, owned by Meta</strong>, carries the conversation
              if you choose to message us there. Tapping our WhatsApp link tells
              Meta you contacted us, and shows us your WhatsApp number and
              profile name. We do not control that, and it happens before you
              send anything, so use the enquiry form instead if you would rather
              it did not.
            </li>
          </ul>
          <p>
            To limit abuse of the free tools we count requests against a one-way
            hash of your network address. We keep the count, not the address,
            and the count resets every hour.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p>
            We keep an enquiry while we are in contact with you and afterwards
            as a record of the conversation, because we may need to show what
            was discussed and agreed. Ask us to delete yours and we will, unless
            we need it for a live piece of work or an obligation we owe someone
            else.
          </p>
        </section>

        <section>
          <h2>Asking us about your information</h2>
          <p>
            Write to <a href={`mailto:${contact}`}>{contact}</a> to ask what we
            hold about you, to correct it, or to have it removed. A person reads
            that address.
          </p>
        </section>
      </main>
      <SiteFooter compact />
    </div>
  );
}
