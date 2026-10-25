// Component-state regression check with mocked native primitives (not a device UI test).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/app/(tabs)/index.tsx'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
let slots = [], cursor = 0, signedIn = true;
const actions = [];
const react = {
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
  useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  useCallback: (callback) => callback,
  useEffect() {},
};
const native = Object.fromEntries(['ActivityIndicator', 'FlatList', 'Modal', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map((name) => [name, name]));
native.StyleSheet = { create: (styles) => styles };
const jsx = (type, props) => ({ type, props });
const exportsObject = {};
vm.runInNewContext(code, {
  exports: exportsObject, setTimeout, clearTimeout,
  require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return native;
    if (name.endsWith('/screen')) return { Screen: 'Screen' };
    if (name.endsWith('/states')) return { MessageState: 'MessageState' };
    if (name.endsWith('/opportunity-card')) return { OpportunityCard: 'OpportunityCard' };
    if (name.endsWith('/api')) return { getOpportunities: async () => ({ items: [{ id: 'hidden-1', title: 'Hidden example' }], nextOffset: null, categories: [] }) };
    if (name.endsWith('/theme')) return { colours: {}, radius: {}, spacing: {} };
    if (name.endsWith('/app-provider')) return { useApp: () => ({ feed: { user: signedIn ? { id: 'member' } : null }, signedIn, refresh: async () => {}, action: async (value) => { actions.push(value); } }) };
    throw new Error(`Unexpected import: ${name}`);
  },
});
function render() { cursor = 0; return exportsObject.default(); }
function nodes(node) { if (!node || typeof node !== 'object') return []; return [node, ...[node.props?.children].flat(2).flatMap(nodes)]; }
function find(tree, predicate) { const result = nodes(tree).find(predicate); assert.ok(result, 'Expected component missing'); return result; }
function list(tree) { return find(tree, (node) => node.type === 'FlatList'); }
function modal(tree) { return find(tree, (node) => node.type === 'Modal'); }
async function main() {
  let tree = render();
  assert.equal(modal(tree).props.visible, false);
  const header = list(tree).props.ListHeaderComponent;
  assert.ok(!JSON.stringify(header).includes('Show expired posts'));
  assert.ok(!JSON.stringify(header).includes('Hidden posts'));
  const headerChildren = header.props.children.filter(Boolean);
  assert.ok(JSON.stringify(headerChildren.at(-1)).includes('Sort listings'));
  tree.props.action.props.onPress();
  tree = render();
  assert.equal(modal(tree).props.visible, true);
  find(modal(tree), (node) => node.props?.accessibilityRole === 'checkbox').props.onPress();
  tree = render();
  assert.equal(find(modal(tree), (node) => node.props?.accessibilityRole === 'checkbox').props.accessibilityState.checked, true);
  assert.ok(JSON.stringify(tree.props.action).includes('•'));
  find(modal(tree), (node) => node.props?.accessibilityState?.expanded === false).props.onPress();
  await new Promise(setImmediate);
  tree = render();
  await find(modal(tree), (node) => node.props?.accessibilityLabel === 'Unhide Hidden example').props.onPress();
  assert.equal(actions[0].action, 'hidePost');
  assert.equal(actions[0].hidden, false);
  find(modal(tree), (node) => node.type === 'Screen').props.action.props.onPress();
  assert.equal(modal(render()).props.visible, false);
  tree.props.action.props.onPress();
  tree = render(); modal(tree).props.onRequestClose();
  assert.equal(modal(render()).props.visible, false);
  signedIn = false; slots = []; tree = render();
  assert.ok(!JSON.stringify(modal(tree)).includes('Hidden posts'));
  console.log('PASS: compact header menu, listings immediately after sort, expired toggle, hidden/unhide, Done/back dismissal, guest access.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
