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
}

export const services: ServiceItem[] = [
  {
    id: 'commerce',
    number: '01',
    title: 'Customer experience & commerce',
    short: 'Websites, online shops and booking tools that help customers buy.',
    description:
      'Give customers a clear, dependable path from discovering your business to choosing, paying, receiving orders, and coming back.',
    buyerExplanation: 'Help customers discover, choose and buy from you',
    capabilities: [
      'Websites & digital storefronts',
      'Checkout, Mobile Money & card payments',
      'Booking & scheduling flows',
      'Customer enquiries & service tools',
    ],
    question: 'How do we turn customer interest into reliable revenue?',
    deliverable:
      'A connected buying experience with the payment, enquiry, and order tools your team needs behind it.',
    exampleScope: [
      'Storefront design & build',
      'Paystack / MoMo integration',
      'Automated order confirmations',
      'Staff enquiry inbox',
    ],
  },
  {
    id: 'operations',
    number: '02',
    title: 'Business systems & operations',
    short: 'Keep customer records, orders and team handovers connected.',
    description:
      'Bring customer information, orders and tasks together so your team can find the latest details and see who needs to act next.',
    buyerExplanation: 'Connect the information and work your team relies on',
    capabilities: [
      'Centralized customer & project records',
      'Staff admin portals & workspaces',
      'Approval workflows & task management',
      'Connections between your existing tools',
    ],
    question: 'How do we scale operations without creating internal chaos?',
    deliverable:
      'Shared records and clear responsibilities for the work your team needs to carry forward.',
    exampleScope: [
      'Internal operations workspace',
      'Inventory & order sync',
      'Automated staff handoffs',
      'Approval gate tracking',
    ],
  },
  {
    id: 'insight',
    number: '03',
    title: 'Data & business insight',
    short: 'Reports and dashboards that show how your business is doing.',
    description:
      'Turn scattered transactions, inquiries, and customer records into clear reports you can actually make decisions with.',
    buyerExplanation: 'Make performance easier to understand and act on',
    capabilities: [
      'Dashboards for sales and operations',
      'Data cleaning & consolidation',
      'Revenue, inventory & pipeline reporting',
      'Summaries for business reviews',
    ],
    question:
      'How do we know what is actually working and where we are losing revenue?',
    deliverable:
      'Useful reporting built directly around the decisions founders and managers need to make every week.',
    exampleScope: [
      'Executive performance dashboard',
      'Pipeline conversion tracking',
      'Weekly automated digest',
      'Customer retention metrics',
    ],
  },
  {
    id: 'products',
    number: '04',
    title: 'Digital products & new services',
    short: 'Test a new idea, then build a custom application or service.',
    description:
      'Turn a new business idea into a tested digital product—built for real users, connected to local payments, and ready to launch.',
    buyerExplanation: 'Turn a business idea into something people can use',
    capabilities: [
      'Customer research & idea testing',
      'Interactive prototypes to test with users',
      'Custom web & mobile applications',
      'Client portals & self-service tools',
    ],
    question:
      'Could we turn a manual service or new idea into a custom software product?',
    deliverable:
      'A focused digital product, from initial validation and prototype to production build and launch roadmap.',
    exampleScope: [
      'Interactive clickable prototype',
      'Production web application',
      'User onboarding & authentication',
      'Usage tracking & an improvement plan',
    ],
  },
];

export const approach = [
  {
    number: '01',
    title: 'Understand',
    text: 'Start with your goals, your customers and how the business works today.',
    lead: 'Start with your goals, your customers and how the business works today.',
    detail:
      'We examine your customer journeys, team handoffs, current software, and where revenue or time is slipping away. We agree on the high-impact problems worth solving first.',
    output: 'A clear priority and agreed measures of success.',
  },
  {
    number: '02',
    title: 'Design',
    text: 'Agree what to build, what it costs, the delivery plan and how we will test it.',
    lead: 'Choose the changes that matter. Agree what to build, connect or improve.',
    detail:
      'We map the end-to-end customer and staff experience, select the right technology stack, and define clear milestones. You know exactly what is included, what it depends on, and how we verify it.',
    output: 'An agreed scope, a design and a plan for delivery.',
  },
  {
    number: '03',
    title: 'Build',
    text: 'Build the website, system or product and test it with the people who will use it.',
    lead: 'Bring the experience and systems together, testing the details as we go.',
    detail:
      'We engineer websites, configure payments, build database records, and connect internal tools. We integrate AI where it assists with routine work, keeping people firmly in control of critical choices.',
    output: 'Working software tested against the agreed requirements.',
  },
  {
    number: '04',
    title: 'Make it work',
    text: 'Train your team, launch the agreed solution and put support arrangements in place.',
    lead: 'Help your team use it, launch with care and learn from real use.',
    detail:
      'Software is only as good as its daily adoption. We train your staff, supervise rollout, monitor live metrics, and establish a clear roadmap for ongoing refinement and support.',
    output: 'Team guidance, a launch review and agreed support arrangements.',
  },
];

export const agencyDescription =
  'Aksen Labs is a Ghana-based digital transformation agency helping African businesses prosper through technology. We build websites and online shops, connect customer records and team workflows, create reports and dashboards, and develop custom digital products. We agree the business goal, scope and price, then build, test and help the team use the solution. AI supports tasks such as organising enquiries, preparing drafts and finding information, with people reviewing important decisions. We welcome projects in Ghana, Nigeria, across Africa and beyond, subject to project fit and delivery arrangements.';
