import { LeadScout } from '@/components/lead-scout';
import './scout.css';
export const metadata = { title: 'Find leads | Aksen Workspace' };
export default function Page() {
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>SALES & RESEARCH</small>
          <h1>Lead Scout</h1>
          <p>
            Research businesses, check the evidence and choose which ones enter
            your sales pipeline.
          </p>
        </div>
      </header>
      {/* A row of three links sat here: the pipeline is already a tab above,
          and AI usage is linked from the failure notice, the one moment it is
          needed. */}
      <LeadScout />
    </section>
  );
}
