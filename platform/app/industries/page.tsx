import { redirect } from 'next/navigation';

/**
 * Industries moved onto /solutions.
 *
 * It was a nav item leading to one interactive explorer and a note saying the
 * scenarios are illustrative rather than completed work. That is a continuation
 * of "what we could do for you", not a separate question, so it now sits under
 * the services it illustrates. The address stays because it has been linked.
 */
export default function IndustriesPage() {
  redirect('/solutions#industries');
}
