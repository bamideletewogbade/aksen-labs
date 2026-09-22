// A small provider contract check. It sends synthetic concepts only and prints no credentials.
process.loadEnvFile('.env');
const directKey = process.env.TYPESAFE_API_KEY;
const routerKey = process.env.OPENROUTER_API_KEY;
const provider = directKey ? 'typesafe' : routerKey ? 'openrouter' : 'none';
if (provider === 'none') throw new Error('Set TYPESAFE_API_KEY or OPENROUTER_API_KEY.');
const response = await fetch(provider === 'typesafe' ? 'https://api.typesafe.ai/v1/systemone' : 'https://openrouter.ai/api/alpha/decisions', {
  method: 'POST', signal: AbortSignal.timeout(15_000),
  headers: { Authorization: 'Bearer ' + (directKey || routerKey), 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: provider === 'typesafe' ? 'jev-latest' : 'typesafe/jev-1.13',
    state: { ownTake: 'Explain a practical AI concept using one simple action.', concepts: [
      { title: 'A', ownAngle: 'Define a term', businessExample: 'A shop reads a definition' },
      { title: 'B', ownAngle: 'Test a customer support workflow', businessExample: 'A shop lists five common questions and checks AI answers with a person' },
      { title: 'C', ownAngle: 'Discuss model news', businessExample: 'A shop reads a headline' },
    ] },
    questions: {
      founder_fit: { type: 'choice', instructions: 'Which concept best reflects ownTake?', criteria: { angle_1: 'Definition only', angle_2: 'Practical action', angle_3: 'News only', none: 'No fit' } },
      practical_example: { type: 'choice', instructions: 'Which concept has the clearest concrete business action?', criteria: { angle_1: 'Definition only', angle_2: 'Five question test', angle_3: 'News only', none: 'No action' } },
    } }),
});
const body = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(`Jev ${provider} request failed: HTTP ${response.status} ${JSON.stringify(body).slice(0, 400)}`);
console.log(JSON.stringify({ provider, model: body.model, keys: Object.keys(body), answers: body.answers, usage: body.usage }));
