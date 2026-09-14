import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const uri = (text) =>
  `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const react = uri(
  'export const useRef=()=>({current:motion.node}); export const useEffect=fn=>{motion.effect=fn};',
);
const jsx = uri('export const jsx=(tag,props)=>({tag,props});');
const code = ts
  .transpileModule(fs.readFileSync('components/agency-motion.tsx', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  })
  .outputText.replaceAll('"react/jsx-runtime"', JSON.stringify(jsx))
  .replaceAll("'react'", JSON.stringify(react));
const { Reveal } = await import(uri(code));
function mount({
  reduced = false,
  focus = false,
  supported = true,
  observer = true,
} = {}) {
  const nodeListeners = new Map(),
    preferenceListeners = new Map();
  const state = { effects: [], calls: [], cancelled: 0, disconnected: 0 };
  const preference = {
    matches: reduced,
    addEventListener: (key, fn) => preferenceListeners.set(key, fn),
    removeEventListener: (key) => preferenceListeners.delete(key),
  };
  const node = {
    contains: () => focus,
    addEventListener: (key, fn) => nodeListeners.set(key, fn),
    removeEventListener: (key) => nodeListeners.delete(key),
  };
  if (supported)
    node.animate = (frames, options) => {
      state.calls.push({ frames, options });
      return { cancel: () => state.cancelled++ };
    };
  globalThis.motion = { node };
  globalThis.document = { activeElement: {} };
  globalThis.window = { matchMedia: () => preference };
  globalThis.IntersectionObserver = class {
    constructor(fn) {
      state.intersect = fn;
    }
    observe() {}
    disconnect() {
      state.disconnected++;
    }
  };
  if (observer) window.IntersectionObserver = globalThis.IntersectionObserver;
  const tree = Reveal({
    as: 'article',
    children: 'Always readable',
    delay: 900,
  });
  assert.equal(tree.tag, 'article');
  assert.equal(tree.props.children, 'Always readable');
  assert.equal(tree.props.style, undefined);
  const cleanup = motion.effect();
  return { state, preference, preferenceListeners, nodeListeners, cleanup };
}
for (const options of [
  { reduced: true },
  { supported: false },
  { observer: false },
]) {
  const { state } = mount(options);
  assert.equal(state.intersect, undefined);
  assert.equal(state.calls.length, 0);
}
const normal = mount();
normal.state.intersect([{ isIntersecting: false }]);
assert.equal(normal.state.calls.length, 0);
normal.state.intersect([{ isIntersecting: true }]);
assert.equal(normal.state.calls.length, 1);
assert.equal(normal.state.disconnected, 1);
assert.equal(normal.state.calls[0].options.delay, 160);
assert.equal(normal.state.calls[0].options.duration, 520);
assert.ok(
  normal.state.calls[0].frames.every(
    (frame) => !frame.transform.includes('scale'),
  ),
);
normal.nodeListeners.get('focusin')();
assert.equal(normal.state.cancelled, 1);
normal.preference.matches = true;
normal.preferenceListeners.get('change')();
assert.equal(normal.state.cancelled, 2);
normal.cleanup();
assert.equal(normal.nodeListeners.size, 0);
assert.equal(normal.preferenceListeners.size, 0);
const focused = mount({ focus: true });
focused.state.intersect([{ isIntersecting: true }]);
assert.equal(focused.state.calls.length, 0);
console.log(
  'PASS: readable defaults, semantic article output, reduced-motion and unsupported-browser fallback, bounded delays, focus cancellation, preference changes and observer cleanup.',
);
