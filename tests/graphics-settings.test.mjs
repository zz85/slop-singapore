import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { TREE_LEVELS, TREE_KEY, initialTreeDetail, bindTreeDetail } from '../js/graphics-settings.js';

const memory = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
};
function button(level) {
  const attrs = {}, classes = new Set(), listeners = [];
  return {
    dataset: { trees: level },
    setAttribute: (k, v) => (attrs[k] = v),
    getAttribute: (k) => attrs[k],
    classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), contains: (c) => classes.has(c) },
    addEventListener: (t, f) => listeners.push(f),
    click() { listeners.forEach((f) => f()); }
  };
}

test('tree detail starts at the URL\'s level, else the saved one, else medium', () => {
  assert.deepEqual(TREE_LEVELS, ['off', 'low', 'medium', 'high']);
  assert.equal(initialTreeDetail(), 'medium');
  assert.equal(initialTreeDetail({ storage: memory({ [TREE_KEY]: 'low' }) }), 'low');
  assert.equal(initialTreeDetail({ search: '?trees=high', storage: memory({ [TREE_KEY]: 'low' }) }), 'high');
  assert.equal(initialTreeDetail({ search: '?trees=ultra', storage: memory({ [TREE_KEY]: 'nonsense' }) }), 'medium');
  const broken = { getItem() { throw new Error('denied'); } };
  assert.equal(initialTreeDetail({ storage: broken }), 'medium');
});

test('the tree-detail menu applies, marks and saves the level picked', () => {
  const buttons = TREE_LEVELS.map(button);
  const applied = [];
  const storage = memory();
  const s = bindTreeDetail({ buttons, apply: (l) => applied.push(l), storage, level: 'low' });
  assert.deepEqual(applied, ['low'], 'the starting level applied');
  assert.equal(storage.m.size, 0, 'and not saved (only a pick is)');
  const checked = () => buttons.filter((b) => b.getAttribute('aria-checked') === 'true').map((b) => b.dataset.trees);
  assert.deepEqual(checked(), ['low']);
  assert.ok(buttons[1].classList.contains('active'));
  buttons[3].click();
  assert.equal(s.get(), 'high');
  assert.deepEqual(applied, ['low', 'high']);
  assert.deepEqual(checked(), ['high']);
  assert.ok(!buttons[1].classList.contains('active'));
  assert.equal(storage.getItem(TREE_KEY), 'high');
  assert.equal(s.set('ultra'), false);
  assert.equal(s.get(), 'high');
  // a storage that refuses: still applied
  const t = bindTreeDetail({ buttons: TREE_LEVELS.map(button), apply: () => {}, storage: { setItem() { throw new Error('full'); } } });
  assert.equal(t.set('off'), true);
});

test('the menu: a button opening it, and a choice for every level', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="btn-graphics"[^>]*popovertarget="graphics-popover"/);
  const pop = html.slice(html.indexOf('id="graphics-popover"'), html.indexOf('<!-- Navigation'));
  for (const level of TREE_LEVELS) assert.match(pop, new RegExp(`data-trees="${level}"[^>]*role="radio"`));
  assert.match(pop, /role="radiogroup"/);
});
