import { LeadScout } from '@/components/lead-scout';
import './scout.css';
export const metadata = { title: 'Lead Scout | Aksen Workspace' };
export default function Page() {
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>SALES & RESEARCH</small>
          <h1>Lead Scout</h1>
          <p>Discover, enrich and review prospective clients.</p>
        </div>
      </header>
      <LeadScout />
    </section>
  );
}
