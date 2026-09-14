import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from './agency-motion';
import { services } from '@/lib/agency-content';
export function ServiceList() {
  return (
    <div className="refresh-service-list">
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 40}>
          <Link href={`/solutions#${service.id}`}>
            <span>{service.number}</span>
            <h3>{service.title}</h3>
            <p>{service.short}</p>
            <ArrowUpRight size={22} />
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
export function AgencyCTA() {
  return (
    <aside className="agency-container refresh-mini-cta">
      <p>Have a business challenge in mind?</p>
      <Link className="agency-text-link" href="/agent-mapper">
        Let’s work out the next step <ArrowUpRight size={18} />
      </Link>
    </aside>
  );
}
