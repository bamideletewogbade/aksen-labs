import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AgentWorkbench } from '@/components/agent-workbench';
import { businessAgentCards } from '@/lib/agent-workbench';
export const metadata = { title: 'Free tools | Aksen Workspace' };
// The same three tools a visitor can run on /business-agents. They are here for
// two sales jobs: seeing exactly what a visitor gets, and running one on a
// prospect's own notes before a call. Everything else that used to be listed
// was a generic prompt and is shelved in lib/agent-workbench.ts.
export default function AgentDeskPage() {
  return (
    <div className="admin-agent-page">
      <header className="business-agents-intro">
        <div>
          <p className="agent-kicker">SALES</p>
          <h1>Free tools</h1>
          <p>
            The tools visitors use on the website. Run one on a prospect&apos;s
            notes before a call, or see exactly what a visitor gets.
          </p>
        </div>
        <Link
          href="/business-agents"
          target="_blank"
          rel="noopener noreferrer"
          className="agent-public-link"
        >
          Open the public page <ArrowUpRight size={15} />
        </Link>
      </header>
      <AgentWorkbench agents={businessAgentCards(true)} admin />
    </div>
  );
}
