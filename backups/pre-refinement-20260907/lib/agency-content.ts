export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  short: string;
  description: string;
  buyerExplanation: string;
  capabilities: string[];
  question: string;
  deliverable: string;
  exampleScope: string[];
  image: string;
}

export const services: ServiceItem[] = [
  {
    id: 'commerce',
    number: '01',
    title: 'Customer experience & commerce',
    short: 'Help customers discover, choose and buy from you.',
    description: 'Give customers a clear, dependable path from discovering your business to choosing, paying, receiving orders, and coming back.',
    buyerExplanation: 'Help customers discover, choose and buy from you',
    capabilities: [
      'Websites & digital storefronts',
      'Checkout, Mobile Money & card payments',
      'Booking & scheduling flows',
      'Customer service & multi-channel engagement',
    ],
    question: 'How do we turn customer interest into reliable revenue?',
    deliverable: 'A connected buying experience with the payment, enquiry, and order tools your team needs behind it.',
    exampleScope: ['Storefront design & build', 'Paystack / MoMo integration', 'Automated order confirmations', 'Staff enquiry inbox'],
    image: '/retail-commerce.png',
  },
  {
    id: 'operations',
    number: '02',
    title: 'Business systems & operations',
    short: 'Connect the information and work your team relies on.',
    description: 'Connect scattered information, eliminate manual handovers, and give your team an organized, dependable way to get work done.',
    buyerExplanation: 'Connect the information and work your team relies on',
    capabilities: [
      'Centralized customer & project records',
      'Staff admin portals & workspaces',
      'Approval workflows & task management',
      'Cross-tool integrations & automations',
    ],
    question: 'How do we scale operations without creating internal chaos?',
    deliverable: 'Shared records, clear responsibilities, and zero lost data between one task and the next.',
    exampleScope: ['Internal operations workspace', 'Inventory & order sync', 'Automated staff handoffs', 'Approval gate tracking'],
    image: '/aksen-systems.png',
  },
  {
    id: 'insight',
    number: '03',
    title: 'Data & business insight',
    short: 'Make performance easier to understand and act on.',
    description: 'Turn scattered transactions, inquiries, and customer records into clear reports you can actually make decisions with.',
    buyerExplanation: 'Make performance easier to understand and act on',
    capabilities: [
      'Operational dashboards & KPIs',
      'Data cleaning & consolidation',
      'Revenue, inventory & pipeline reporting',
      'Decision-support summaries',
    ],
    question: 'How do we know what is actually working and where we are losing revenue?',
    deliverable: 'Useful reporting built directly around the decisions founders and managers need to make every week.',
    exampleScope: ['Executive performance dashboard', 'Pipeline conversion tracking', 'Weekly automated digest', 'Customer retention metrics'],
    image: '/professional-services-workflow.png',
  },
  {
    id: 'products',
    number: '04',
    title: 'Digital products & new services',
    short: 'Turn a business idea into something people can use.',
    description: 'Turn a new business idea into a tested digital product—built for real users, connected to local payments, and ready to launch.',
    buyerExplanation: 'Turn a business idea into something people can use',
    capabilities: [
      'Opportunity discovery & user research',
      'Interactive prototypes & validation',
      'Custom web & mobile applications',
      'Client portals & self-service tools',
    ],
    question: 'Could we turn a manual service or new idea into a custom software product?',
    deliverable: 'A focused digital product, from initial validation and prototype to production build and launch roadmap.',
    exampleScope: ['Interactive clickable prototype', 'Production web application', 'User onboarding & authentication', 'Telemetry & iteration roadmap'],
    image: '/creator-campaign.png',
  },
];

export interface PillarItem {
  id: string;
  badge: string;
  name: string;
  headline: string;
  description: string;
  role: string;
  examples: string[];
  precedent: { name: string; context: string; link?: string };
}

export const threePillars: PillarItem[] = [
  {
    id: 'company',
    badge: 'LAYER 01 / THE FOUNDATION',
    name: 'The Company',
    headline: 'Aksen Labs leads the strategy, engineering, and client relationship.',
    description: 'We are a digital transformation agency dedicated to helping African businesses grow with technology—combining strategic planning, hands-on engineering, and ongoing support.',
    role: 'Maintains high engineering standards, manages project delivery, and ensures every system delivers tangible business results.',
    examples: ['Digital strategy & roadmap', 'Full-stack engineering', 'Team adoption & training', 'Ongoing support & maintenance'],
    precedent: {
      name: 'Integrated Delivery',
      context: 'We combine management consulting depth with technical product delivery under one trusted team.',
    },
  },
  {
    id: 'engagement',
    badge: 'LAYER 02 / THE WORK',
    name: 'The Engagement',
    headline: 'A specific business hires Aksen to achieve a defined improvement.',
    description: 'Each client engagement starts with a concrete business goal and defined scope—whether launching a high-converting commerce system, uniting back-office operations, or delivering data clarity.',
    role: 'Localized around the client’s real currency, payment providers (MoMo, Paystack, bank transfers), customer behavior, and daily team workflows.',
    examples: ['2 to 4-week focused sprints', 'Full connected commerce deployment', 'Internal tools & ERP integrations', 'Scoped AI assistance pilots'],
    precedent: {
      name: 'The Frame Shop (TFS Proposal)',
      context: 'Our connected proposal unites retail discovery, custom enquiries, MoMo checkout, workshop operations, and team AI under one goal.',
    },
  },
  {
    id: 'product',
    badge: 'LAYER 03 / THE SCALE',
    name: 'The Product',
    headline: 'Packaging proven solutions into ready-to-use software.',
    description: 'When we solve a common operational problem across multiple clients, we package the solution into a streamlined tool that businesses can adopt quickly.',
    role: 'Provides modular, pre-built software that gets businesses up and running without building from scratch every time.',
    examples: ['Workspace demo & client portals', 'Messaging-first enquiry CRM', 'Milestone approval workflow', 'Local commerce & receipt engine'],
    precedent: {
      name: 'Modular Business Software',
      context: 'Pre-built components for bookings, orders, and customer management that reduce deployment time.',
    },
  },
];

export const approach = [
  {
    number: '01',
    title: 'Understand',
    text: 'Start with your goals, your customers and how the business works today.',
    lead: 'Start with your goals, your customers and how the business works today.',
    detail: 'We examine your customer journeys, team handoffs, current software, and where revenue or time is slipping away. We agree on the high-impact problems worth solving first.',
    output: 'A defined business objective, prioritized friction points, and agreed success criteria.',
  },
  {
    number: '02',
    title: 'Design',
    text: 'Choose the changes that matter. Agree what to build, connect or improve.',
    lead: 'Choose the changes that matter. Agree what to build, connect or improve.',
    detail: 'We map the end-to-end customer and staff experience, select the right technology stack, and define clear milestones. You know exactly what is included, what it depends on, and how we verify it.',
    output: 'Detailed specifications, user journeys, architecture plan, and confirmed project scope.',
  },
  {
    number: '03',
    title: 'Build',
    text: 'Bring the experience and systems together, testing the details as we go.',
    lead: 'Bring the experience and systems together, testing the details as we go.',
    detail: 'We engineer websites, configure payments, build database records, and connect internal tools. We integrate AI where it assists with routine work, keeping people firmly in control of critical choices.',
    output: 'Production-ready software, integrated APIs, verified checkout flows, and operational workspaces.',
  },
  {
    number: '04',
    title: 'Make it work',
    text: 'Help your team use it, launch with care and learn from real use.',
    lead: 'Help your team use it, launch with care and learn from real use.',
    detail: 'Software is only as good as its daily adoption. We train your staff, supervise rollout, monitor live metrics, and establish a clear roadmap for ongoing refinement and support.',
    output: 'Team onboarding, operating documentation, launch review, and continuous support structure.',
  },
];

export const connectedSystemSteps = [
  {
    step: '01',
    phase: 'Discovery',
    title: 'Clear digital storefront & product discovery',
    customerAction: 'A customer visits the website and discovers curated items or custom project options.',
    systemAction: 'A fast, responsive storefront displays verified pricing, live availability, and high-resolution visuals.',
    recordGenerated: 'Browsing session & product interest logged to unified catalogue.',
    humanTouch: 'Customer can trigger instant inquiry if bespoke specifications are needed.',
  },
  {
    step: '02',
    phase: 'Consultation & AI Assist',
    title: 'Intelligent enquiry capture & quote drafting',
    customerAction: 'The customer submits dimensions, finish preferences, and requests an estimate.',
    systemAction: 'AI assistant structures the inquiry, checks current materials pricing, and prepares a draft estimate.',
    recordGenerated: 'Pending Quote Record created in centralized CRM with full customer history.',
    humanTouch: 'Team member reviews specifications, adjusts pricing if needed, and approves the quote.',
  },
  {
    step: '03',
    phase: 'Transaction & Checkout',
    title: 'Fast, direct Mobile Money & card checkout',
    customerAction: 'Customer accepts quote and pays instantly via MTN MoMo, Telecel Cash, or bank card.',
    systemAction: 'Integrated payment gateway verifies transaction in real time and issues digital receipt.',
    recordGenerated: 'Verified Payment Record linked to Order # and accounting ledger.',
    humanTouch: 'Automated notification dispatched to customer while finance logs the transaction.',
  },
  {
    step: '04',
    phase: 'Fulfillment & Ops',
    title: 'Workshop dispatch & order tracking',
    customerAction: 'Customer receives real-time SMS / WhatsApp tracking updates on order status.',
    systemAction: 'Order drops directly into the team production workspace with inventory deduction.',
    recordGenerated: 'Production Ticket with assigned technician, target completion date, and delivery slip.',
    humanTouch: 'Workshop manager oversees quality control and marks item ready for dispatch.',
  },
  {
    step: '05',
    phase: 'Insights & Care',
    title: 'Performance analytics & post-delivery care',
    customerAction: 'Customer receives completed delivery and shares feedback on their experience.',
    systemAction: 'Executive dashboard reflects updated sales revenue, margin, and average turnaround time.',
    recordGenerated: 'Customer lifetime record updated; automated post-service satisfaction prompt sent.',
    humanTouch: 'Account manager reviews customer satisfaction and schedules follow-up for repeat business.',
  },
];

export const agencyDescription =
  'Aksen Labs is a Ghana-based digital transformation agency helping African businesses grow, serve customers better and operate more effectively. We work across customer experience and commerce, business systems and operations, data and insight, and digital products. We focus on solving real business problems first, using AI only where it delivers genuine improvements. Open to projects in Ghana, Nigeria, and across Africa.';

