import { redirect } from 'next/navigation';

/**
 * The AI examples moved into a tab on /products.
 *
 * This page was only ever reachable from the footer, and it overlapped the
 * products page, which already listed the same tools. The gallery it used to
 * host is now the "AI in practice" tab. The address stays because it has been
 * linked, and a dead link is worse than a hop.
 */
export default function AgentsPage() {
  redirect('/products#ai-examples');
}
