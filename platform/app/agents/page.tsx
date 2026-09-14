import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { AgentGallery } from '@/components/agent-gallery';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
export const metadata: Metadata = {
  title: 'AI in Practice | Aksen Labs',
  description:
    'Practical AI assistance for customers and teams, built into the wider business systems Aksen Labs designs.',
};
export default function AgentsPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="intelligence"
          label="AI IN PRACTICE"
          title={
            <>
              Practical tasks.
              <br />
              <em>Useful first drafts.</em>
            </>
          }
          text="Try an agent to find automation opportunities, plan a digital product or design a lead magnet. Explore the examples below for other ways AI can support customers and teams."
          image="agency-intelligence"
          alt="A glass intelligence core surrounded by connected graphite data layers"
          target="/business-agents"
          action="Try the business agents"
        />
        <section
          id="ai-examples"
          className="agency-container agents-gallery-section"
        >
          <p className="refresh-scenario-note">
            These are capability examples. Each needs the right business
            information, integrations and staff responsibilities.
          </p>
          <AgentGallery />
        </section>
        <aside className="agency-container refresh-mini-cta">
          <p>See a document assistant prepare work for review.</p>
          <Link className="agency-text-link" href="/workspace-demo">
            Try the workspace demo <ArrowUpRight size={18} />
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
