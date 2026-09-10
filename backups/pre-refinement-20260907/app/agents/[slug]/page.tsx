import { ArrowLeft, ArrowRight, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { agentCatalog } from '@/lib/agent-catalog';

export default async function AgentUseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = agentCatalog.find((item) => item.slug === slug) || agentCatalog[0];

  return <main><SiteNav />
    <section className="agent-detail-hero">
      <a className="agent-back" href="/agents"><ArrowLeft size={15} /> All Aksen agents</a>
      <div className="agent-detail-intro"><div><div className="agent-tags"><span>{agent.category}</span><span>{agent.industry}</span>{agent.liveDemo && <span className="live-tag"><i /> Live demo</span>}</div><h1>{agent.name}</h1><p>{agent.promise}</p></div><div className="agent-detail-moment"><small>A FAMILIAR MOMENT</small><blockquote>“{agent.moment}”</blockquote></div></div>
    </section>
    <section className="agent-detail-body">
      <div className="agent-job"><p className="home-kicker dark">WHAT THIS AGENT HELPS WITH</p><h2>Useful work, clearly defined.</h2><ul>{agent.work.map((item) => <li key={item}><span><Check size={16} /></span>{item}</li>)}</ul></div>
      <div className="agent-outcome-card"><ShieldCheck size={24} /><small>THE RESULT WE DESIGN FOR</small><h2>{agent.outcome}</h2><p>Important decisions can pause for approval, and your team can see what happened at every step.</p>{agent.liveDemo ? <a href={agent.liveDemo} target="_blank" rel="noreferrer">{agent.liveLabel} <ExternalLink size={16} /></a> : <a href="/agent-mapper">Map a version for your business <ArrowRight size={16} /></a>}</div>
    </section>
    <section className="page-cta"><p>Start with this use case</p><h2>Adapt it to the way your business already works.</h2><a href="/agent-mapper">Map the opportunity <ArrowRight /></a></section>
    <SiteFooter />
  </main>;
}

