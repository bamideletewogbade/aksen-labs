import Link from 'next/link';
import {
  ArrowUpRight,
  BellRing,
  BookOpen,
  FileText,
  MessageCircle,
  Search,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { agentDesks, type DeskIcon } from '@/lib/agent-desks';

const icons: Record<DeskIcon, LucideIcon> = {
  message: MessageCircle,
  search: Search,
  file: FileText,
  bell: BellRing,
  chart: TrendingUp,
  book: BookOpen,
};

/**
 * One card per desk. `compact` drops the hand-over line for the homepage,
 * where the section above it has already made that argument in full.
 */
export function AgentDeskGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ag-desks ${compact ? 'is-compact' : ''}`}>
      {agentDesks.map((desk) => {
        const Icon = icons[desk.icon];
        const href = compact ? `/agents#${desk.id}` : desk.href;
        const title = (
          <>
            <Icon size={18} aria-hidden="true" />
            {desk.title}
            {href && <ArrowUpRight size={15} aria-hidden="true" />}
          </>
        );
        return (
          <article
            className="ag-desk"
            id={compact ? undefined : desk.id}
            key={desk.id}
          >
            <h3>{href ? <Link href={href}>{title}</Link> : title}</h3>
            <p>{desk.line}</p>
            {!compact && (
              <p className="ag-desk-hand">
                <span>Comes to you</span>
                {desk.handsOver}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
