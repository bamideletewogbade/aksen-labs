/** Shared by the visitor mapper and saved enquiry; provides a sensible transformation starting point. */
export function workflowSuggestion(work: string): string {
  const goal = (work || '').toLowerCase();
  if (
    goal.includes('sell online') ||
    goal.includes('buying') ||
    goal.includes('commerce') ||
    goal.includes('order')
  ) {
    return 'Connected Commerce & Order System';
  }
  if (
    goal.includes('serve customer') ||
    goal.includes('customer question') ||
    goal.includes('support') ||
    goal.includes('enquir')
  ) {
    return 'Customer Experience & Enquiry System';
  }
  if (
    goal.includes('connect internal') ||
    goal.includes('work and system') ||
    goal.includes('internal operation') ||
    goal.includes('searching for info')
  ) {
    return 'Internal Operations & Workflow System';
  }
  if (
    goal.includes('understand business') ||
    goal.includes('performance') ||
    goal.includes('data') ||
    goal.includes('see what is happening')
  ) {
    return 'Business Intelligence & Performance Dashboard';
  }
  if (
    goal.includes('digital product') ||
    goal.includes('new service') ||
    goal.includes('product idea')
  ) {
    return 'Digital Product Discovery & MVP Build';
  }
  if (
    goal.includes('content') ||
    goal.includes('marketing') ||
    goal.includes('growth')
  ) {
    return 'Growth & Content Publishing System';
  }
  return 'Digital Transformation Scoping Sprint';
}
