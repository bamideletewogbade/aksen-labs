import { AgentWorkbench } from '@/components/agent-workbench';
import { businessAgentCards } from '@/lib/agent-workbench';
export const metadata = { title: 'AI tools | Aksen Workspace' };
export default function AgentDeskPage() {
  return (
    <div className="admin-agent-page">
      <header className="business-agents-intro">
        <p className="agent-kicker">AI TOOLS</p>
        <h1>Get a useful first draft</h1>
        <p>
          Choose what you need help with, add the facts, then review the result
          before using it.
        </p>
      </header>
      <AgentWorkbench agents={businessAgentCards(true)} admin />
    </div>
  );
}
