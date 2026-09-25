'use client';

import { useState } from 'react';
import {
  parseLeadsFromText,
  type ParsedImportLead,
} from '@/lib/lead-import-parser';
import { Spinner } from '@/components/ui/activity';
import {
  FileUp,
  FileText,
  Plus,
  CheckCircle2,
  Trash2,
  Mail,
  Phone,
  Globe,
  Sparkles,
  Download,
} from 'lucide-react';

const ACCRA_SAMPLE_BRIEF = `Christie Brown
Location: 809 11th Lane, Viva Court, Osu, Accra
Official Email: retail@christiebrownonline.com
Phone/WhatsApp: +233 24 441 8477
Website: https://christiebrownonline.com
Observed Operational Gap: High volume of global/diaspora inquiries via WhatsApp for bespoke fits. Sales reps manually manage sizing measurements and stock availability, leading to delayed response times and cart abandonment during new collection drops.
Aksen Labs Proposed System: HITL WhatsApp Sales & Custom Sizing Desk. An interactive agent captures body measurements and stock preference, automatically structures a draft order, and routes it to an Osu showroom rep for 1-click invoice approval.

Kiki Clothing
Location: Airport Residential Area / Labone, Accra
Official Email: info@kikiclothing.com
Phone/Contact: +233 24 433 9301
Website: https://kikiclothing.com
Observed Operational Gap: Disconnected inventory between physical showroom and web shop. Customers frequently order online items that have already been sold in-store, requiring manual refund emails and customer frustration.
Aksen Labs Proposed System: Omnichannel Inventory & Sync Engine. Real-time sync connecting physical POS inventory with web e-commerce, paired with an automated order-status updates agent for buyers.

Bentsi-Enchill, Letsa & Ankomah
Location: 4 Momotse Avenue, Adabraka, Accra
Official Email: info@bentsienchill.com
Phone: +233 302 208 888
Website: https://bentsienchill.com
Observed Operational Gap: Inbound web inquiries arrive unscreened. Senior legal associates spend billable hours reading unqualified consultation requests and conducting repetitive manual KYC client onboarding document collection.
Aksen Labs Proposed System: RAG Legal Intake Desk & Secure Client Portal. AI agent screens conflict-of-interest checks and collects preliminaries, drafting an executive brief for partner review before creating a client portal space.

Imperial Homes Limited
Location: No. 6 Sir Arku Korsah Rd, Airport Residential, Accra
Official Email: info@imperialhomesghana.com
Phone: +233 302 731 033
Website: https://imperialhomesghana.com
Observed Operational Gap: High diaspora interest for off-plan property investments in Airport Residential/Abelenkpe. Site visit bookings rely on slow email chains, and diaspora buyers lack a centralized view of construction progress.
Aksen Labs Proposed System: Diaspora Buyer Portal & Automated Tour Scheduler. Interactive qualification tool for foreign buyers, automated site tour booking, and a secure updates portal for milestone tracking.

Jonmoore International Ltd
Location: No. 1a Publishing Road, Tema / Accra
Official Email: solutions@jonmoore.com.gh
Phone: +233 20 139 6339
Website: https://jonmoore.com.gh
Observed Operational Gap: Heavy freight quote requests involve manual back-and-forth emails to verify cargo dimensions and route clearance. Clients lack a portal to check cargo customs clearance and transit milestones in real time.
Aksen Labs Proposed System: Automated Freight Quotation & Fleet Status Portal. Structured quote builder that ingests cargo parameters, prepares a draft price quote for dispatch managers, and provides client status tracking.

Jandel Limited
Location: Accra, Greater Accra Region
Official Email: info@jandellimited.com
Phone: +233 26 124 0074
Website: https://jandellimited.com
Observed Operational Gap: Managing thousands of rentable decor assets across concurrent corporate events. Asset tracking and venue site-inspection reports are paper-based, leading to lost inventory and procurement friction.
Aksen Labs Proposed System: Asset Rental Tracker & Procurement Approval Engine. Mobile-friendly site-audit reporter for field teams paired with an automated inventory reservation and approval pipeline.

Complete Farmer
Location: 11 Molade-Akiwumi St, Airport West / East Legon, Accra
Official Email: info@completefarmer.com
Phone: +233 20 146 8190
Website: https://completefarmer.com
Observed Operational Gap: Onboarding international agricultural buyers and local farm growers requires extensive document collection and manual farm progress reporting. Support desks receive repetitive technical questions regarding platform metrics.
Aksen Labs Proposed System: Agri-Status Synthesizer & RAG Support Desk. RAG knowledge agent trained on Complete Farmer's documentation to answer support queries instantly, drafting operational farm updates for staff review.

Swoove 360 / Swoove Delivery
Location: Coastal Estates, Greater Accra Region, Accra
Official Email: developer@swoove.delivery
Phone: +233 35 937 946 33
Website: https://swoove.delivery
Observed Operational Gap: E-commerce merchants downloading the Swoove WordPress plugin frequently encounter API key setup and webhook configuration issues, placing heavy support demands on Swoove's engineering team.
Aksen Labs Proposed System: Merchant Onboarding & Developer Support Desk. Specialized developer assistant agent that troubleshoots API key setups and webhook errors, triaging complex technical issues to engineers.`;

export function LeadImporter({
  onImportComplete,
}: {
  onImportComplete: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'brief' | 'csv' | 'single'>('brief');
  const [inputText, setInputText] = useState('');
  const [parsedLeads, setParsedLeads] = useState<ParsedImportLead[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Single lead inputs
  const [singleCompany, setSingleCompany] = useState('');
  const [singleWebsite, setSingleWebsite] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleGap, setSingleGap] = useState('');
  const [singleSolution, setSingleSolution] = useState('');

  const handleParse = (text: string) => {
    setError('');
    setMessage('');
    const leads = parseLeadsFromText(text);
    if (!leads.length) {
      setError('Could not detect any valid businesses from this text. Ensure it contains company names and websites or contact details.');
      setParsedLeads([]);
      return;
    }
    setParsedLeads(leads);
    setMessage(`Parsed ${leads.length} ${leads.length === 1 ? 'business' : 'businesses'} ready for import.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      setInputText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCompany.trim()) {
      setError('Please provide a company name.');
      return;
    }
    const cleanUrl = singleWebsite.trim().startsWith('http')
      ? singleWebsite.trim()
      : `https://${singleWebsite.trim().replace(/^www\./, '')}`;

    const contacts: ParsedImportLead['contacts'] = [];
    if (singleEmail.trim()) contacts.push({ kind: 'email', value: singleEmail.trim() });
    if (singlePhone.trim()) contacts.push({ kind: 'phone', value: singlePhone.trim() });

    const newLead: ParsedImportLead = {
      id: `manual-${Date.now()}`,
      company: singleCompany.trim(),
      website: cleanUrl || `https://${singleCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      description: singleGap.trim(),
      opportunity: singleGap && singleSolution
        ? `Operational Gap: ${singleGap.trim()} | Proposed Solution: ${singleSolution.trim()}`
        : singleSolution.trim() || singleGap.trim(),
      contacts,
      selected: true,
    };

    setParsedLeads((prev) => [newLead, ...prev]);
    setMessage(`Added ${singleCompany}.`);
    setSingleCompany('');
    setSingleWebsite('');
    setSingleEmail('');
    setSinglePhone('');
    setSingleGap('');
    setSingleSolution('');
  };

  const handleToggleLead = (id: string) => {
    setParsedLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l)),
    );
  };

  const handleRemoveLead = (id: string) => {
    setParsedLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleImport = async () => {
    const selected = parsedLeads.filter((l) => l.selected !== false);
    if (!selected.length) {
      setError('Please select at least one lead to import.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        action: 'import',
        leads: selected.map((l) => ({
          company: l.company,
          website: l.website,
          description: l.description,
          opportunity: l.opportunity,
          contacts: l.contacts,
        })),
      };

      const res = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string; note?: string };
      if (!res.ok) throw new Error(data.error || 'Import failed.');

      setMessage(data.note || `Successfully imported ${selected.length} leads!`);
      setParsedLeads([]);
      setInputText('');
      await onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="scout-panel scout-importer">
      <div className="scout-importer-header">
        <div>
          <h2>Import Target Accounts &amp; Intelligence</h2>
          <p>
            Quickly ingest pre-researched businesses, OSINT reconnaissance briefs, CSV rosters, or single accounts into your Review Queue.
          </p>
        </div>
      </div>

      {/* Mode Navigation */}
      <div className="scout-import-modes">
        <button
          type="button"
          className={`scout-mode-pill ${mode === 'brief' ? 'active' : ''}`}
          onClick={() => setMode('brief')}
        >
          <FileText size={14} /> Paste Brief or OSINT Notes
        </button>
        <button
          type="button"
          className={`scout-mode-pill ${mode === 'csv' ? 'active' : ''}`}
          onClick={() => setMode('csv')}
        >
          <FileUp size={14} /> Upload / Paste CSV
        </button>
        <button
          type="button"
          className={`scout-mode-pill ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          <Plus size={14} /> Quick Add Single Lead
        </button>
      </div>

      {/* Mode 1: Paste Brief */}
      {mode === 'brief' && (
        <div className="scout-import-section">
          <div className="scout-import-toolbar">
            <span className="scout-small">Paste raw text from a reconnaissance document, PDF, or email brief:</span>
            <button
              type="button"
              className="scout-preset-pill"
              onClick={() => {
                setInputText(ACCRA_SAMPLE_BRIEF);
                handleParse(ACCRA_SAMPLE_BRIEF);
              }}
            >
              <Sparkles size={13} /> Load Accra Reconnaissance Brief (8 Leads)
            </button>
          </div>
          <textarea
            className="scout-target"
            style={{ minHeight: '180px' }}
            placeholder="Paste notes, e.g.:&#10;Christie Brown&#10;Location: Osu, Accra&#10;Email: retail@christiebrownonline.com&#10;Phone: +233 24 441 8477&#10;Observed Operational Gap: Manual WhatsApp order flow&#10;Proposed System: HITL Sales Desk"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="scout-actions">
            <button
              type="button"
              className="scout-primary"
              disabled={busy || !inputText.trim()}
              onClick={() => handleParse(inputText)}
            >
              Parse Leads from Text
            </button>
            {inputText && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setInputText('');
                  setParsedLeads([]);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: CSV / JSON */}
      {mode === 'csv' && (
        <div className="scout-import-section">
          <div className="scout-import-toolbar">
            <span className="scout-small">Upload or paste CSV rows (headers: Company, Website, Email, Phone, Gap, Solution):</span>
            <label className="scout-preset-pill scout-file-label">
              <FileUp size={13} /> Choose CSV / JSON File
              <input
                type="file"
                accept=".csv,.json,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <textarea
            className="scout-target"
            style={{ minHeight: '160px' }}
            placeholder="Company,Website,Email,Phone,Opportunity&#10;Christie Brown,https://christiebrownonline.com,retail@christiebrownonline.com,+233244418477,WhatsApp sizing desk&#10;Kiki Clothing,https://kikiclothing.com,info@kikiclothing.com,+233244339301,POS inventory sync"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="scout-actions">
            <button
              type="button"
              className="scout-primary"
              disabled={busy || !inputText.trim()}
              onClick={() => handleParse(inputText)}
            >
              Parse CSV / JSON
            </button>
            {inputText && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setInputText('');
                  setParsedLeads([]);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Quick Add Single Lead */}
      {mode === 'single' && (
        <form onSubmit={handleAddSingle} className="scout-single-lead-form">
          <div className="scout-form-grid">
            <div>
              <label htmlFor="company-input">Company Name *</label>
              <input
                id="company-input"
                className="scout-query"
                placeholder="e.g. Christie Brown"
                value={singleCompany}
                onChange={(e) => setSingleCompany(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="website-input">Website URL *</label>
              <input
                id="website-input"
                className="scout-query"
                placeholder="e.g. https://christiebrownonline.com"
                value={singleWebsite}
                onChange={(e) => setSingleWebsite(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="email-input">Official Email</label>
              <input
                id="email-input"
                className="scout-query"
                placeholder="e.g. retail@christiebrownonline.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone-input">Phone / WhatsApp</label>
              <input
                id="phone-input"
                className="scout-query"
                placeholder="e.g. +233 24 441 8477"
                value={singlePhone}
                onChange={(e) => setSinglePhone(e.target.value)}
              />
            </div>
            <div className="full-width">
              <label htmlFor="gap-input">Observed Operational Bottleneck / Gap</label>
              <input
                id="gap-input"
                className="scout-query"
                placeholder="e.g. Manual sizing chats on WhatsApp leading to cart abandonment during drops"
                value={singleGap}
                onChange={(e) => setSingleGap(e.target.value)}
              />
            </div>
            <div className="full-width">
              <label htmlFor="solution-input">Recommended Aksen Solution</label>
              <input
                id="solution-input"
                className="scout-query"
                placeholder="e.g. HITL WhatsApp Sales & Custom Sizing Desk"
                value={singleSolution}
                onChange={(e) => setSingleSolution(e.target.value)}
              />
            </div>
          </div>
          <div className="scout-actions">
            <button type="submit" className="scout-primary" disabled={busy}>
              + Add to Staging Queue
            </button>
          </div>
        </form>
      )}

      {/* Messages / Alerts */}
      {message && <output aria-live="polite">{message}</output>}
      {error && <p role="alert">{error}</p>}

      {/* Parsed Preview Table */}
      {parsedLeads.length > 0 && (
        <div className="scout-preview-table-container">
          <div className="scout-preview-header">
            <h3>Staged Leads for Import ({parsedLeads.length})</h3>
            <span className="scout-small">
              {parsedLeads.filter((l) => l.selected !== false).length} of {parsedLeads.length} selected
            </span>
          </div>
          <div className="scout-import-list">
            {parsedLeads.map((lead) => (
              <div
                key={lead.id}
                className={`scout-import-row ${lead.selected === false ? 'unselected' : ''}`}
              >
                <div className="scout-import-row-main">
                  <input
                    type="checkbox"
                    checked={lead.selected !== false}
                    onChange={() => handleToggleLead(lead.id)}
                    aria-label={`Select ${lead.company}`}
                  />
                  <div className="scout-import-details">
                    <div className="scout-import-company">
                      <strong>{lead.company}</strong>
                      <a href={lead.website} target="_blank" rel="noreferrer" className="scout-small">
                        <Globe size={12} /> {lead.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                    {lead.opportunity && (
                      <p className="scout-import-gap">{lead.opportunity}</p>
                    )}
                    <div className="scout-import-contacts">
                      {lead.contacts.map((c, i) => (
                        <span key={i} className="scout-contact-badge">
                          {c.kind === 'email' ? <Mail size={11} /> : <Phone size={11} />}
                          {c.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="scout-remove-row-btn"
                  title="Remove from import"
                  onClick={() => handleRemoveLead(lead.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="scout-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="scout-primary"
              disabled={busy || !parsedLeads.some((l) => l.selected !== false)}
              onClick={handleImport}
            >
              {busy ? (
                <>
                  <Spinner size={14} /> Importing…
                </>
              ) : (
                `⚡ Import ${parsedLeads.filter((l) => l.selected !== false).length} Leads to Review Queue`
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setParsedLeads([])}
            >
              Cancel Staging
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
