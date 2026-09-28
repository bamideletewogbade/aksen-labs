import { redirect } from 'next/navigation';

/**
 * "AI tools", then "Free tools", became the Assessment page on 28 September
 * 2026. As a workspace page it was the visitors' three free tools seen from
 * inside, and it never had a job of its own: its saved-drafts list was empty.
 * The visitors keep their page at /business-agents. The address stays because
 * it has been bookmarked, and a dead link is worse than a hop.
 */
export default function AgentDeskPage() {
  redirect('/admin/assessment');
}
