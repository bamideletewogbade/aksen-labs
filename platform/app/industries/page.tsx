import type { Metadata } from 'next';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { IndustryExplorer } from '@/components/industry-explorer';
export const metadata: Metadata = {
  title: 'Industries | Aksen Labs',
  description:
    'Explore how digital experiences, operations and AI could work in retail, professional services, hospitality, property and creative businesses.',
};
export default function IndustriesPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="industries"
          label="INDUSTRIES"
          title={
            <>
              Your world.
              <br />
              <em>Working better.</em>
            </>
          }
          text="Different businesses need different solutions. Find a familiar challenge and explore what a more connected way of working could look like."
          target="#industry-explorer"
          action="Explore your industry"
        />
        <section
          id="industry-explorer"
          className="agency-container refresh-industries"
        >
          <IndustryExplorer />
          <p className="refresh-scenario-note">
            Illustrative scenarios, not completed client projects. We agree the
            exact tools, connections and outcomes with your business.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
