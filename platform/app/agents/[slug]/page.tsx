import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { agentCatalog } from '@/lib/agent-catalog';
export default async function AgentUseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = agentCatalog.find((item) => item.slug === slug);
  if (!agent) notFound();
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <div className="agency-container refresh-back">
          <Link className="agency-text-link" href="/agents">
            <ArrowLeft size={16} /> All AI examples
          </Link>
        </div>
        <PageIntro
          variant="intelligence"
          label={`${agent.category} / ${agent.industry}`}
          title={<>{agent.name}</>}
          text={agent.promise}
          image="agency-intelligence"
          alt="A glass intelligence core connected to organised data layers"
        />
        <section className="agency-container refresh-section refresh-scope">
          <div>
            <p className="agency-eyebrow">WHAT IT COULD HELP WITH</p>
            <ul className="refresh-agent-work">
              {agent.work.map((item) => (
                <li key={item}>
                  <Check size={17} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="agency-eyebrow">THE OUTCOME WE DESIGN FOR</p>
            <h2>{agent.outcome}</h2>
            <p style={{ marginTop: 20 }}>
              We define the information it can use, what it can do and when a
              person needs to review the work.
            </p>
            <Link
              className="agency-text-link"
              href={agent.liveDemo || '/agent-mapper'}
            >
              {agent.liveDemo
                ? agent.liveLabel
                : 'Discuss a version for your business'}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
