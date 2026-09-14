/** Local editorial articles shown when no published database posts are available. */
export const editorialPosts = [
  {
    id: 'practice',
    slug: 'what-a-useful-ai-agent-actually-does',
    title: 'What a useful AI agent actually does at work',
    excerpt:
      'Start with a specific task, the right information and a clear handover to a person.',
    category: 'AI in practice',
    readingMinutes: 2,
    publishedAt: null,
    authorName: 'Aksen Labs',
    content:
      'A useful AI assistant starts with a task you can describe clearly. It might organise an enquiry, retrieve an answer from approved business information or prepare a first draft for a colleague. The task matters more than the label.\n\nImagine a customer asking for a custom order. An assistant could collect the dimensions, preferences and intended date. It could organise those details into a request your team can review. A person would still confirm the specification, price and commitment.\n\nThe quality of the information matters. An assistant cannot reliably describe stock, policies or availability unless it can access a maintained source. Decide who owns those records and how changes reach the system.\n\nTest the difficult cases as well as the easy ones. What happens when a request is ambiguous, a record is missing or an integration is unavailable? The assistant needs a clear way to say it cannot complete the task and pass it to someone who can.\n\nBegin with one bounded use. Compare the time spent, corrections needed and customer experience before expanding. Useful AI earns its place in the work.',
  },
  {
    id: 'work',
    slug: 'automate-the-repetition-not-the-judgement',
    title: 'Where automation helps—and where people matter',
    excerpt:
      'A practical way to choose what to automate in an everyday business process.',
    category: 'Business systems',
    readingMinutes: 2,
    publishedAt: null,
    authorName: 'Aksen Labs',
    content:
      'Look for work your team repeats with the same inputs and a clear rule. Copying an approved order into a task list, reminding a colleague about a deadline and sending a receipt after a verified payment are useful places to investigate.\n\nWrite the process down before choosing software. What starts it? Which information is required? Who receives the result? What happens if a step fails? This often reveals a missing responsibility or an unclear rule that technology alone cannot fix.\n\nSeparate preparation from commitment. Software can collect information and prepare a draft. Decisions involving unusual pricing, sensitive complaints or exceptions may still need an experienced person. Make that handover explicit.\n\nAutomation also needs a visible failure path. A task should not disappear when a connection fails. Your team needs a way to see the problem, correct it and continue without duplicating the work.\n\nChoose one process and measure whether the change helps. Time saved is useful, but so are fewer corrections, clearer ownership and a more dependable customer experience.',
  },
  {
    id: 'build',
    slug: 'why-we-are-building-aksen-os',
    title: 'Why we are exploring a connected business workspace',
    excerpt:
      'What a shared place for briefs, decisions and delivery could make possible.',
    category: 'Inside Aksen Labs',
    readingMinutes: 2,
    publishedAt: null,
    authorName: 'Aksen Labs',
    content:
      'A business project creates more than a list of tasks. There are conversations, documents, decisions, approvals and responsibilities. When these live in separate places, people spend time reconstructing the context.\n\nOur workspace exploration brings that context closer to the work. The public demonstration uses fictional scenarios to show how a team might develop a brief, review prepared material and decide what happens next.\n\nThe document assistant is one part of that idea. It can help prepare material for review, while a person remains responsible for checking the content and approving the next action. The wider goal is continuity between information and decisions.\n\nA demonstration is a place to test an approach. A real implementation needs the business’s records, access rules, integrations and operational checks. Those choices depend on how the team actually works.\n\nThis is how we think about products at Aksen Labs: explore a useful problem, make the idea tangible and learn what would make it dependable in practice.',
  },
];
