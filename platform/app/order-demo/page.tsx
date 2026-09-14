import Link from 'next/link';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { OrderDemo } from '@/components/order-demo';
import './order-demo.css';
export const metadata = {
  title: 'Connected order demo | Aksen Labs',
  description:
    'Explore a fictional enquiry, quote, payment check and workshop handoff with Aksen.',
};
export default function Page() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <OrderDemo />
        <p className="order-demo-links">
          <Link href="/agent-mapper">Discuss a pilot for your business →</Link>
          <Link href="/support-demo">Try the support assistant →</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
