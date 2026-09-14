// Run: node tests/support-knowledge.mjs
//
// retrieveSupportArticles feeds the public assistant, and it was rebuilt on top
// of a new scoring function so the admin preview could show what would be
// retrieved and why. A preview that drifts from the behaviour it previews is
// worse than no preview, so these hold the two together.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const uri = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const compile = (text) =>
  ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

// The real content modules, so the entries under test are the ones shipped.
//
// Built in dependency order and cached, because these import each other:
// pricing pulls in agency-content, and compiling it on its own leaves a bare
// './agency-content' that a data: URL cannot resolve.
const built = new Map();
function moduleUrl(name) {
  const cached = built.get(name);
  if (cached) return cached;
  const compiled = compile(fs.readFileSync(`lib/${name}.ts`, 'utf8')).replace(
    /from '\.\/([a-z-]+)'/g,
    (_, dependency) => `from '${moduleUrl(dependency)}'`,
  );
  const url = uri(compiled);
  built.set(name, url);
  return url;
}

const source = compile(
  fs.readFileSync('lib/support-knowledge.ts', 'utf8'),
).replace(
  /from '\.\/([a-z-]+)'/g,
  (_, dependency) => `from '${moduleUrl(dependency)}'`,
);

const {
  supportArticles,
  retrieveSupportArticles,
  scoreSupportArticles,
  retrievedArticleLimit,
} = await import(uri(source));

const articles = supportArticles();
assert.ok(articles.length >= 8, 'the knowledge base lost entries');

// Every entry must say where its words come from, or the screen that promises
// to tell you how to change an answer cannot keep that promise.
for (const article of articles) {
  assert.ok(
    typeof article.source === 'string' && article.source.trim().length > 10,
    `${article.id} has no usable source attribution`,
  );
  assert.ok(article.keywords.trim(), `${article.id} has no retrieval words`);
  assert.ok(article.content.trim(), `${article.id} has no content`);
  assert.ok(article.href.startsWith('/'), `${article.id} has no internal href`);
}

// Ids must be unique: the prompt labels each entry with its id, and two the
// same would make the model's citation ambiguous.
const ids = articles.map((a) => a.id);
assert.equal(new Set(ids).size, ids.length, 'duplicate article ids');

// The preview and the real retrieval must agree. Whatever scoring says would
// be sent is exactly what retrieval returns.
for (const question of [
  'How much does a website cost?',
  'Can I speak to a human on WhatsApp?',
  'What products do you sell?',
  'How do you actually start a project',
]) {
  const scored = scoreSupportArticles(question);
  const expected = scored
    .filter((m) => m.score > 0)
    .slice(0, retrievedArticleLimit)
    .map((m) => m.article.id);
  const actual = retrieveSupportArticles(question).map((a) => a.id);
  assert.deepEqual(
    actual,
    expected,
    `preview and retrieval disagree for: ${question}`,
  );
  assert.ok(
    actual.length <= retrievedArticleLimit,
    'retrieval returned more entries than the assistant is given',
  );
}

// Scoring reports which words matched, and those words must really be present.
const [top] = scoreSupportArticles('pricing cost for a website');
assert.ok(top.score > 0, 'an obvious pricing question matched nothing');
const haystack = `${top.article.keywords} ${top.article.content}`.toLowerCase();
for (const word of top.matched) {
  assert.ok(haystack.includes(word), `reported "${word}" but it is not there`);
}

// A question with nothing in common returns everything at zero rather than
// throwing, so the admin can show "nothing matched" instead of an error.
const nonsense = scoreSupportArticles('zzzz qqqq vvvv');
assert.equal(nonsense.length, articles.length);
assert.ok(nonsense.every((m) => m.score === 0));
assert.deepEqual(retrieveSupportArticles('zzzz qqqq vvvv'), []);

// Empty input must not throw either; the route trims before calling, but the
// function should not depend on that.
assert.doesNotThrow(() => scoreSupportArticles(''));

// The file path in `source` must never reach a prompt. The chat route builds
// its knowledge block from id, title and content only.
const chat = fs.readFileSync('app/api/chat/route.ts', 'utf8');
assert.doesNotMatch(
  chat,
  /a\.source|article\.source/,
  'the chat route now reads article.source, which would put file paths in a prompt',
);

console.log('support-knowledge: all checks passed');
