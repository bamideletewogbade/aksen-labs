import { AgentWorkbench } from '@/components/agent-workbench';
import { businessAgentCards } from '@/lib/agent-workbench';
export const metadata = { title: 'Agent desk | Aksen Workspace' };
export default function AgentDeskPage() {
  return (
    <div className="admin-agent-page">
      <header className="business-agents-intro">
        <p className="agent-kicker">AKSEN WORKSPACE</p>
        <h1>Agent desk</h1>
        <p>
          Nine focused assistants for planning, reviewing and preparing business
          work. Run a task and return to its saved draft here.
        </p>
      </header>
      <AgentWorkbench agents={businessAgentCards(true)} admin />
    </div>
  );
}
