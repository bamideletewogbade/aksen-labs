import type { Metadata } from 'next';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { AgentWorkbench } from '@/components/agent-workbench';
import { businessAgentCards } from '@/lib/agent-workbench';
export const metadata: Metadata = {
  title: 'Free Business Agents | Aksen Labs',
  description:
    'Find automation opportunities, plan a digital product or design a useful lead magnet with Aksen’s free AI drafting tools.',
};
export default function BusinessAgentsPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content" className="business-agents-page agency-container">
        <header className="business-agents-intro">
          <p className="agency-eyebrow">BUSINESS AGENTS</p>
          <h1>
            A useful next step.
            <br />
            <em>From the facts you provide.</em>
          </h1>
          <p>
            Choose a task, describe your business and get a draft you can
            review. Start with your own brief or a fictional example.
          </p>
        </header>
        <AgentWorkbench agents={businessAgentCards()} />
      </main>
      <SiteFooter compact />
    </div>
  );
}
