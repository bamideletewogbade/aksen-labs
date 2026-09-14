export type AgencyTemplate = {
  id: string;
  name: string;
  stage: string;
  kind: string;
  content: string;
};
const header = (name: string) =>
  `# ${name}\n\nClient: [client / legal entity to confirm]\nProject: [project]\nOwner: [name]\nDate / version: [date] / v1\nStatus: Draft — review before use\n\n`;
export const agencyTemplates: AgencyTemplate[] = [
  {
    id: 'qualification',
    name: 'Lead qualification',
    stage: 'Discover',
    kind: 'discovery',
    content: `## Source and permission\nSource URL / referral: [source]\nObserved on: [date]\nContact source: [source]\nPermission to respond: [evidence / unknown]\nMarketing subscription: [separate evidence / not subscribed]\n\n## Fit\nBusiness and market: [facts]\nObserved problem and evidence: [facts]\nProposed service: [hypothesis]\nBudget, decision maker, timing: [unknown until confirmed]\n\n## Next step\nQuestions: [three questions]\nOwner / follow-up date: [owner / date]\nDo not infer buying intent from public contact details.`,
  },
  {
    id: 'discovery',
    name: 'Discovery brief',
    stage: 'Discover',
    kind: 'discovery',
    content: `## Business outcome\nProblem: [client words]\nCurrent process: [steps, tools, owners]\nBaseline: [measure, source, date]\nTarget: [agreed measurable outcome]\n\n## Scope inputs\nUsers and stakeholders: [names / roles]\nData and integrations: [systems / access owner]\nConstraints: [budget / capacity / market]\n\n## Evidence and decisions\nConfirmed facts: [source]\nAssumptions: [to validate]\nOpen questions: [owner / due date]\nAssessment fee / treatment: [separate agreed scope; any credit explicit]\nClient confirmation: [name / date]`,
  },
  {
    id: 'proposal',
    name: 'Service proposal',
    stage: 'Agree',
    kind: 'proposal',
    content: `## Understanding\nClient problem: [confirmed evidence]\nOutcome and baseline: [measure]\n\n## Recommended engagement\nDeliverables: [bounded list]\nExclusions: [explicit list]\nClient responsibilities: [content / access / feedback]\nDependencies: [third parties]\nAcceptance criteria: [testable criteria]\n\n## Commercial schedule\nCurrency: GHS\nService fees: [agreed amount]\nAssessment: [separate fee / agreed credit]\nApplicable taxes: [confirmed treatment]\nExternal usage / licences: [itemised / approved allowance]\nPayment milestones: [agreed]\nReview rounds / change process: [agreed]\nTimelines / starting conditions: [agreed]\nValidity: [date]\n\n## Decision\nOpen matters: [list]\nAcceptance names / dates: [actual approval evidence]`,
  },
  {
    id: 'scope',
    name: 'Statement of work',
    stage: 'Agree',
    kind: 'scope',
    content: `## Scope baseline\nApproved proposal reference: [reference]\nDeliverable | Owner | Acceptance evidence | Due date\n[deliverable] | [owner] | [test / sign-off] | [date]\n\n## Boundaries\nIncluded: [list]\nExcluded: [list]\nData access and permissions: [approved sources]\nAI use / human approval points: [rules]\n\n## Delivery terms to agree\nKickoff prerequisites: [access / content / payment]\nReview rounds: [number]\nDefect support: [period / definition]\nChange requests: [written estimate and approval]\nSupport coverage: [separate plan]\nOwnership, licence and confidentiality provisions: [reference agreed contract]\nApprovals: [people / dates]`,
  },
  {
    id: 'kickoff',
    name: 'Kickoff and access checklist',
    stage: 'Deliver',
    kind: 'scope',
    content: `## Ready to start\n[ ] Scope and commercial approval recorded\n[ ] Initial payment requirement checked\n[ ] Client sponsor and daily contact named\n[ ] Success measures agreed\n[ ] Content and data owners identified\n[ ] Accounts owned by the appropriate business\n[ ] Access shared through an approved credential manager, never this document\n[ ] Test environment and sample data ready\n[ ] Feedback cadence and escalation contacts agreed\n\n## First week\nTask / owner / due date: [list]\nBlockers: [owner / resolution date]`,
  },
  {
    id: 'ai-playbook',
    name: 'AI agent knowledge and handoff',
    stage: 'Deliver',
    kind: 'scope',
    content: `## Agent purpose\nUser and channel: [who / where]\nAllowed jobs: [bounded tasks]\nOut-of-scope jobs: [list]\n\n## Approved knowledge\nSource | Owner | Version | Review date\n[source] | [owner] | [version] | [date]\n\n## Actions and boundaries\nTools and permissions: [read / draft / execute]\nHuman approval: [actions requiring review]\nMissing knowledge response: [honest fallback]\nHandoff triggers: [refunds / complaints / payment checks / unsupported requests]\nHandoff owner and hours: [contact / schedule]\n\n## Channel readiness\nWhatsApp account / number: [verified setup]\nWebhook verification / retries / deduplication: [test evidence]\nTemplate and messaging eligibility: [provider requirements checked]\nUsage allowance and alerts: [agreed]\nRetention and deletion: [policy]\nTest evidence: [reference]`,
  },
  {
    id: 'weekly-update',
    name: 'Weekly project update',
    stage: 'Deliver',
    kind: 'note',
    content: `## This week\nCompleted and evidence: [facts]\nIn progress: [tasks / owners]\nNext week: [tasks]\n\n## Decisions and blockers\nDecision | Owner | Needed by | Impact\n[item] | [name] | [date] | [impact]\n\n## Scope and budget\nApproved changes: [references]\nUnapproved requests: [pending]\nSchedule: [current status and evidence]\nClient action: [one clear next step]`,
  },
  {
    id: 'change',
    name: 'Change request',
    stage: 'Deliver',
    kind: 'scope',
    content: `Change ID: [id]\nRequested by / date: [name / date]\nOriginal scope reference: [reference]\nRequested change and reason: [details]\nOptions including no change: [options]\nImpact on fees / dates / support: [estimate in GHS]\nDependencies and risks: [list]\nAcceptance criteria: [evidence]\nDecision: [pending / approved / rejected]\nApproved by / date: [actual evidence]\nDo not begin additional work before approval.`,
  },
  {
    id: 'uat',
    name: 'Testing and client acceptance',
    stage: 'Launch',
    kind: 'handover',
    content: `## Acceptance tests\nRequirement | Scenario | Expected | Actual | Evidence | Reviewer\n[item] | [test] | [expected] | [actual] | [link] | [name]\n\n## Include\n[ ] Normal and failure paths\n[ ] Mobile and accessibility checks\n[ ] Permissions and data isolation\n[ ] AI unsupported requests and handoff\n[ ] Payment and webhook duplicate handling where applicable\n[ ] Recovery and support process\n\n## Decision\nOpen defects / severity: [list]\nAccepted limitations: [actual agreement]\nAcceptance: [pending / signed evidence]\nLaunch authority: [name / date]`,
  },
  {
    id: 'handover',
    name: 'Launch and handover',
    stage: 'Launch',
    kind: 'handover',
    content: `## Delivered\nApproved scope / acceptance reference: [links]\nLive URLs / account owners: [list]\nRunbook / repository / backups: [locations]\nCredentials: [credential-manager reference only]\nTraining: [date / attendees / material]\n\n## Operating plan\nMonitoring and alert owner: [name]\nSupport contact / coverage: [agreed]\nDefect period: [agreed]\nRollback and recovery: [steps / owner]\nOutstanding work: [list / dates]\n\n## Follow-up\nFirst review: [date]\nSuccess metrics / source: [measures]\nHandover acknowledged by: [name / date]`,
  },
  {
    id: 'care',
    name: 'Monthly service review',
    stage: 'Retain',
    kind: 'note',
    content: `Period: [month]\nAgreed care plan: [reference]\nIncluded hours / tasks and used allowance: [actuals]\n\n## Outcomes\nMetric | Baseline | Current | Source\n[metric] | [value] | [value] | [evidence]\n\n## Operations\nIncidents / resolution / lessons: [facts]\nAI quality and handoffs: [review sample]\nThird-party usage and costs: [actuals]\nBackups / access / knowledge reviews: [evidence]\n\n## Next month\nProposed improvement: [scope and price if additional]\nRenewal / plan changes: [decision needed]\nOwner / review date: [name / date]`,
  },
  {
    id: 'email-sequence',
    name: 'Relationship email sequence',
    stage: 'Retain',
    kind: 'note',
    content: `Audience: [segment]\nPermission / relationship evidence: [source]\nSuppression check: [date]\nSender: [verified domain]\nReply-to: bishoptewogbade@gmail.com\n\n## 1. First conversation\nSubject: [specific business need]\nObserved fact: [source]\nUseful idea: [hypothesis, not a claim]\nNext step: [one question]\n\n## 2. Follow-up\nSend only if no reply or opt-out: [agreed interval]\nAdd useful context: [one idea]\n\n## 3. Close the loop\nAsk whether to pause: [short message]\nStop after reply, opt-out, complaint, bounce or closure.\n\n## Client lifecycle\nKickoff: [agreed next step]\nDelivery: [weekly status]\nHandover: [training / support]\nReview: [outcome discussion]\nMarketing subscriptions are separate from service correspondence. Campaign emails require an unsubscribe mechanism and suppression handling.`,
  },
  {
    id: 'billing',
    name: 'Billing readiness checklist',
    stage: 'Agree',
    kind: 'note',
    content: `[ ] Seller identity confirmed\n[ ] Customer billing identity confirmed\n[ ] Proposal / scope acceptance evidenced\n[ ] Currency and line items agreed\n[ ] Applicable tax treatment confirmed\n[ ] Payment terms and due date agreed\n[ ] Payment instructions independently verified\n[ ] Correct project linked\nUse Clients & billing for numbered proformas, invoices and payment-backed receipts. This checklist is not an invoice or payment record.`,
  },
];
export function templateText(id: string) {
  const item = agencyTemplates.find((t) => t.id === id);
  return item ? header(item.name) + item.content : '';
}
