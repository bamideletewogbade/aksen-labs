import { AssessmentClient } from '@/components/assessment-client';
import '../assessment.css';

export const metadata = { title: 'Free assessment | Aksen Labs' };

/**
 * Inside /admin so it needs the same sign-in, and so no stranger can open a
 * view of a live assessment. It shows no workspace chrome: the sidebar is
 * hidden by assessment.css whenever this view is on the page.
 */
export default function AssessmentClientPage() {
  return <AssessmentClient />;
}
