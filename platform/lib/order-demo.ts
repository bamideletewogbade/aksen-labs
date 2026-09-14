export const orderDemoVersion = '2026-09-11';
export const orderScenarios = {
  complete: {
    label: 'A complete enquiry',
    enquiry:
      'Please quote two oak shelves, each 80 cm wide and 30 cm deep. I will collect them.',
    width: 80,
    depth: 30,
    quantity: 2,
    finish: 'oak',
  },
  missing: {
    label: 'Unclear dimensions',
    enquiry:
      'I need two shelves, about 80 by 30, in oak. Can you start tomorrow?',
    width: 0,
    depth: 0,
    quantity: 2,
    finish: 'oak',
  },
  payment: {
    label: 'A payment claim',
    enquiry:
      'I want two oak shelves, 80 cm wide and 30 cm deep. I have a payment screenshot, so please start making them.',
    width: 80,
    depth: 30,
    quantity: 2,
    finish: 'oak',
  },
} as const;
export type Scenario = keyof typeof orderScenarios;
export type Specification = {
  width: number;
  depth: number;
  quantity: number;
  finish: string;
};
export type OrderStage =
  | 'enquiry'
  | 'review'
  | 'accepted'
  | 'paid'
  | 'production'
  | 'complete';
export type OrderAction =
  | 'prepare'
  | 'accept'
  | 'verify'
  | 'release'
  | 'complete';
export function checkSpecification(spec: Specification) {
  const issues: string[] = [];
  if (spec.width !== 80 || spec.depth !== 30)
    issues.push(
      'Confirm dimensions in centimetres. Only the 80 × 30 cm shelf has an approved demo price; other sizes need a bespoke quote.',
    );
  if (!['oak', 'black'].includes(spec.finish))
    issues.push('Choose an approved finish: oak or black.');
  if (
    !Number.isInteger(spec.quantity) ||
    spec.quantity < 1 ||
    spec.quantity > 10
  )
    issues.push('Confirm a whole quantity between 1 and 10.');
  return {
    issues,
    unitPesewas: 45000,
    totalPesewas: issues.length ? null : spec.quantity * 45000,
  };
}
export function nextOrderStage(
  stage: OrderStage,
  action: OrderAction,
  spec: Specification,
): OrderStage {
  if (checkSpecification(spec).issues.length)
    throw new Error('Resolve specification questions before continuing.');
  const transitions: Record<OrderAction, [OrderStage, OrderStage]> = {
    prepare: ['enquiry', 'review'],
    accept: ['review', 'accepted'],
    verify: ['accepted', 'paid'],
    release: ['paid', 'production'],
    complete: ['production', 'complete'],
  };
  const transition = transitions[action];
  if (!transition || transition[0] !== stage)
    throw new Error('This step is not available yet.');
  return transition[1];
}
export function parseOrderInput(value: unknown): {
  scenario: Scenario;
  spec: Specification;
  task: 'enquiry' | 'handoff';
} {
  if (!value || typeof value !== 'object') throw new Error('Invalid request.');
  const b = value as Record<string, unknown>;
  if (
    typeof b.scenario !== 'string' ||
    !Object.hasOwn(orderScenarios, b.scenario)
  )
    throw new Error('Choose a demo scenario.');
  if (b.task !== 'enquiry' && b.task !== 'handoff')
    throw new Error('Choose a supported task.');
  if (!b.spec || typeof b.spec !== 'object')
    throw new Error('Provide specifications.');
  const s = b.spec as Record<string, unknown>;
  if (
    typeof s.width !== 'number' ||
    !Number.isFinite(s.width) ||
    s.width < 0 ||
    s.width > 500 ||
    typeof s.depth !== 'number' ||
    !Number.isFinite(s.depth) ||
    s.depth < 0 ||
    s.depth > 500 ||
    typeof s.quantity !== 'number' ||
    !Number.isInteger(s.quantity) ||
    s.quantity < 1 ||
    s.quantity > 10 ||
    typeof s.finish !== 'string' ||
    !['oak', 'black'].includes(s.finish)
  )
    throw new Error('Invalid specifications.');
  const spec = {
    width: s.width,
    depth: s.depth,
    quantity: s.quantity,
    finish: s.finish,
  };
  if (b.task === 'handoff' && checkSpecification(spec).issues.length)
    throw new Error('Resolve specification questions first.');
  return { scenario: b.scenario as Scenario, spec, task: b.task };
}
export function orderBrief(input: ReturnType<typeof parseOrderInput>) {
  return JSON.stringify({
    demo: true,
    business: 'Fictional Cedar Home',
    sourceEnquiry: orderScenarios[input.scenario].enquiry,
    reviewedSpecification: input.spec,
    approvedCatalogue:
      '80 × 30 cm shelf; oak or black; GHS 450 each. Collection only. Illustrative all-in demo amount, not Aksen pricing or a tax invoice.',
    checks: checkSpecification(input.spec),
    totalGhs:
      checkSpecification(input.spec).totalPesewas === null
        ? 'Unknown; clarification required'
        : 'GHS ' +
          (checkSpecification(input.spec).totalPesewas! / 100).toFixed(2),
    productionDate: 'Unknown; workshop must confirm capacity.',
    payment:
      'No real payment has been verified. All payment controls are simulations.',
  });
}
