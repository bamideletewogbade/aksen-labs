import { resolvePricingSelection } from '@/lib/pricing';
import { formatPrice } from '@/lib/currency';
import { requestCurrency } from '@/lib/request-currency';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/agency-motion';
import type { Metadata } from 'next';
import { StandaloneMapper } from '@/components/standalone-mapper';
import { WhatsAppLink } from '@/components/whatsapp-link';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
export const metadata: Metadata = {
  title: 'Discuss Your Business | Aksen Labs',
  description:
    'Answer three questions about your business, see a suggested starting point and choose whether to send an enquiry to Aksen Labs.',
};
export default async function OpportunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const selection = resolvePricingSelection((await searchParams).package);
  // Formatted here rather than in the mapper. The mapper is a client component
  // and shows this figure as text, and the visitor arrives from a pricing page
  // that was showing their currency: seeing a different one on the next screen
  // would read as two different prices for the same package.
  const { currency } = await requestCurrency();
  const shownSelection = selection
    ? { name: selection.name, price: formatPrice(selection.price, currency) }
    : undefined;
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <section className="agency-contact-section agency-container opening-contact">
          <Reveal className="agency-contact-copy">
            <p className="agency-eyebrow">DISCUSS YOUR BUSINESS</p>
            <h1>What would you like your business to do better?</h1>
            <p>
              Choose the goals, markets and tools that fit your business. Add
              one real example if you like. You’ll get a suggested starting
              point, then decide whether to send it to our team.
            </p>
            <div className="agency-contact-note">
              <strong>You don’t need a technical brief.</strong>
              <p>
                A new website, a better buying experience, connected operations
                or a product idea. Start wherever you are.
              </p>
            </div>
            <div className="agency-contact-note">
              <strong>What happens after you send an enquiry?</strong>
              <p>
                Our team reviews your answers and uses your email to discuss the
                scope and next steps. Sending an enquiry does not commit you to
                a paid assessment or project.
              </p>
            </div>
            <div className="agency-contact-note">
              <strong>Would you rather just message us?</strong>
              <p>
                WhatsApp reaches us directly, and a person answers. This is not
                one of the demonstrations on this site: those use fictional
                businesses. Email still works if you prefer a written trail.
              </p>
              <WhatsAppLink showNumber />
            </div>
            <div className="contact-opening-signoff">
              <ArrowUpRight strokeWidth={0.8} />
              <span>
                YOUR GOAL.
                <br />
                A PRACTICAL STARTING POINT.
              </span>
            </div>
          </Reveal>
          <StandaloneMapper
            key={shownSelection?.name ?? 'general'}
            pricingSelection={shownSelection}
          />
        </section>
      </main>
      <SiteFooter compact />
    </div>
  );
}
