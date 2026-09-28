export const operationTasks = [
  {
    id: 'qualify',
    name: 'Qualify an enquiry',
    prompt:
      'Assess fit using only the record. Return known facts, unknowns, a suggested service, three discovery questions and the next human action. Do not treat a score as verified buying intent.',
  },
  // The record holds what Lead Scout or the enquiry form captured, never the
  // results of the enquiry test, so most checks come back Not checked until a
  // person has run it. That is the intended output: the draft shows what is
  // still to be done instead of guessing the gaps. Prices match lib/pricing.ts.
  {
    id: 'lead_audit',
    name: 'Enquiry gap audit',
    prompt:
      'Draft an enquiry gap audit using the ten Aksen checks. Website checks: 1 a one-tap WhatsApp or call button on the first screen of the home page on a phone; 2 opening hours or reply time shown; 3 prices, ranges or starting prices shown; 4 what a customer must send for a quote; 5 lead times shown; 6 products or work browsable on a phone without a PDF. Enquiry-test checks: 7 business-hours reply within one hour; 8 after-hours reply by 10am the next working day; 9 form or email acknowledged within one working day; 10 first reply moves the enquiry forward. Mark each Pass, Not yet or Not checked, quoting the record as evidence for every Pass and Not yet. Anything the record does not show is Not checked, never a guess. Give the score as checks passed out of checks run, not a percentage. List only gaps with evidence, at most three, each with the smallest fix, including fixes the business can make itself; if nothing is missing, say so. Close with the published next steps: a free 20-minute call, then the GHS 1,500 fixed assessment of one process; any build is quoted in writing only after it. No statistics without a named source, no customer claims, no promised results.',
  },
  {
    id: 'jev_followup',
    name: 'Jev creative follow-up (3 angles)',
    prompt:
      'Draft 3 distinct creative follow-up email options for this lead using Jev criteria (founder fit, practical concrete example, honest proof). Angle 1: Enquiry gap audit (the checks we ran and what they showed, nothing we did not see). Angle 2: Value-in-Advance Working Prototype (we build a custom simulation first, judge before committing). Angle 3: Hours saved, estimated only from figures the business has given us, otherwise ask for them. Include clear subject lines and a single call to action for each: reply directly, or book a free 20-minute call.',
  },
  {
    id: 'discovery',
    name: 'Prepare discovery',
    prompt:
      'Prepare a meeting agenda, baseline measures, stakeholder questions, dependencies and decisions needed.',
  },
  {
    id: 'proposal',
    name: 'Draft a proposal',
    prompt:
      'Draft problem, outcome, deliverables, exclusions, acceptance criteria, responsibilities, risks and commercial questions. Do not invent agreed prices, signatures, timelines or payment terms.',
  },
  {
    id: 'delivery',
    name: 'Plan implementation',
    prompt:
      'Draft phased implementation tasks with owners to confirm, dependencies, test evidence and acceptance gates. Distinguish proposed work from completed work.',
  },
  {
    id: 'followup',
    name: 'Draft a follow-up email',
    prompt:
      'Draft a concise subject and plain-text follow-up email using only established facts. One clear next step, no invented prior relationship or urgency. This is a draft, never a sent email.',
  },
  {
    id: 'care',
    name: 'Prepare a service review',
    prompt:
      'Prepare a monthly service review: known outcomes, missing metrics, incidents to confirm, usage questions, proposed improvements and renewal questions. Do not invent performance results.',
  },
] as const;
export const demoScenarios = [
  {
    id: 'whatsapp',
    name: 'WhatsApp service assistant',
    channel: 'WhatsApp simulation',
    context:
      'Fictional business: Cedar Home, Accra. Hours Monday-Friday 09:00-17:00. Standard shelf: GHS 450. Delivery within Accra quoted by staff; no fixed delivery charge. Custom sizes require staff quotation. No live stock, order lookup, payment verification or booking tool is connected.',
    examples: [
      'How much is a standard shelf?',
      'Can you make a custom size?',
      'I paid already. Confirm my order.',
    ],
    instruction:
      'Answer as Cedar Home customer support in at most 90 words. Use only the fictional reference. Do not claim to send WhatsApp messages, confirm payments, look up orders or reserve stock. Ask one useful next question. Escalate anything not supported by the reference.',
  },
  {
    id: 'commerce',
    name: 'Commerce enquiry assistant',
    channel: 'Website simulation',
    context:
      'Fictional business: Cedar Home, Accra. Standard shelf GHS 450. A custom shelf needs width, height, finish and installation location. Staff confirms feasibility and quote. No checkout, stock or payments connected.',
    examples: [
      'I need a shelf for a small office.',
      'Can I pay with Mobile Money?',
    ],
    instruction:
      'Help a visitor define their buying need, gather one missing detail at a time and explain what staff must confirm. Never claim that checkout or payment succeeded.',
  },
  {
    id: 'insight',
    name: 'Weekly reporting assistant',
    channel: 'Reporting simulation',
    context:
      'Fictional weekly data: 20 enquiries, 5 accepted quotations, GHS 12,000 invoiced, GHS 7,000 received against those invoices, 3 projects awaiting feedback. Last week is unavailable. Revenue recognition, profit and costs are unavailable.',
    examples: [
      'Give me this week’s review.',
      'Are we more profitable than last week?',
    ],
    instruction:
      'Explain only these sample figures. Separate invoiced amounts from cash received. Identify missing comparison and cost data. Suggest one operational next step without inventing growth or profit.',
  },
] as const;
export function getOperationTask(id: unknown) {
  return operationTasks.find((task) => task.id === id);
}
export function getDemoScenario(id: unknown) {
  return demoScenarios.find((item) => item.id === id);
}
export function demoNeedsHandoff(message: string) {
  return /human|person|refund|complaint|paid|payment|order|custom|stock|book|confirm/i.test(
    message,
  );
}
