import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { placeEntries, rankPlaces, bindPlaceSearch } from '../js/place-search.js';

// The top bar's search (js/place-search.js): places, landmarks and streets by name, the best match first; picking one
// hands it to the map view
const places = [
  { id: 'raffles', name: 'Raffles Place', sub: 'Downtown Core', x: 0, z: 6 },
  { id: 'mbs', name: 'Marina Bay Sands', sub: 'Bayfront', x: 915, z: -483 }
];
const landmarks = [
  { id: 'raffles-hotel', name: 'Raffles Hotel', x: 400, z: -900, parts: [{ height: 20 }, { height: 31 }] },
  { id: 'mbfc', name: 'Marina Bay Financial Centre', x: 600, z: -200, parts: [{ height: 245 }] },
  { id: 'dup', name: 'raffles place', x: 1, z: 1 }
];
const roads = [
  { name: 'Raffles Quay', pts: [{ x: 0, z: 0 }, { x: 100, z: 0 }] },
  { name: 'Raffles Quay', pts: [{ x: 100, z: 0 }, { x: 300, z: 50 }] },
  { name: 'North Bridge Road', pts: [{ x: -2000, z: 0 }, { x: 2000, z: 0 }] },
  { name: 'Orchard Road', pts: [] }
];
const entries = placeEntries({ places, landmarks, roads });

test('what can be searched: each place, landmark and street once, framed whole', () => {
  assert.deepEqual(entries.map((e) => [e.kind, e.name]), [
    ['place', 'Raffles Place'], ['place', 'Marina Bay Sands'],
    ['landmark', 'Raffles Hotel'], ['landmark', 'Marina Bay Financial Centre'],
    ['street', 'Raffles Quay'], ['street', 'North Bridge Road']
  ], 'a name already listed (any case) and a street without points are left out');
  const quay = entries.find((e) => e.name === 'Raffles Quay');
  assert.deepEqual([quay.x, quay.z], [150, 25], 'a street: the middle of all its stretches');
  assert.equal(quay.distance, 350, 'a short street: no closer than 350 m');
  assert.equal(entries.find((e) => e.name === 'North Bridge Road').distance, 2400, 'a long one: no farther than 2.4 km');
  assert.equal(entries.find((e) => e.name === 'Raffles Hotel').distance, 350);
  assert.equal(entries.find((e) => e.name === 'Marina Bay Financial Centre').distance, 245 * 2.4, 'a tower taken in whole');
  // New York's geodata keeps its landmarks by name, not in a list: just its places
  const byName = { 'Empire State Building': { x: 0, z: 0 } };
  assert.deepEqual(placeEntries({ places, landmarks: byName, roads: null }).map((e) => e.name), ['Raffles Place', 'Marina Bay Sands']);
  assert.deepEqual(placeEntries({ places: [{ x: 0, z: 0 }] }), [], 'a place without a name');
});

test('the best match first: the start of the name, then a word, then anywhere; places before streets', () => {
  const names = (q) => rankPlaces(q, entries).map((e) => e.name);
  assert.deepEqual(names('raffles'), ['Raffles Place', 'Raffles Hotel', 'Raffles Quay']);
  assert.deepEqual(names('  BAY  '), ['Marina Bay Sands', 'Marina Bay Financial Centre'], 'case and spaces do not matter');
  assert.deepEqual(names('ridge'), ['North Bridge Road'], 'inside a word');
  assert.deepEqual(names('bridge'), ['North Bridge Road']);
  assert.deepEqual(names(''), []);
  assert.deepEqual(names('zzz'), []);
  assert.equal(rankPlaces('a', entries, 2).length, 2, 'at most the limit');
});

// A small stand-in DOM: the field, the list and their events
function fakeDom() {
  const make = (tag) => {
    const listeners = {};
    const el = {
      tagName: tag.toUpperCase(), id: '', className: '', hidden: false, value: '', textContent: '', dataset: {}, children: [], attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      removeAttribute(k) { delete this.attrs[k]; },
      getAttribute(k) { return this.attrs[k] ?? null; },
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      fire(type, e = {}) { const ev = { preventDefault() { ev.prevented = true; }, stopPropagation() {}, target: el, ...e }; for (const fn of listeners[type] || []) fn(ev); return ev; },
      append(...c) { this.children.push(...c); },
      replaceChildren(...c) { this.children = c; },
      querySelectorAll(sel) { return sel === '[role="option"]' ? this.children.filter((c) => c.attrs.role === 'option') : []; },
      focus() { doc.focused = el; },
      blur() { if (doc.focused === el) doc.focused = null; },
      select() {}
    };
    return el;
  };
  const docListeners = {};
  const doc = {
    focused: null,
    createElement: make,
    addEventListener(type, fn) { (docListeners[type] ||= []).push(fn); },
    fire(type, e) { const ev = { preventDefault() { ev.prevented = true; }, ...e }; for (const fn of docListeners[type] || []) fn(ev); return ev; }
  };
  const input = make('input');
  const list = make('ul');
  list.id = 'place-results';
  return { doc, input, list };
}

test('the field: typing lists the matches, the arrows and Enter pick one, Escape empties it', () => {
  const { doc, input, list } = fakeDom();
  const picked = [];
  bindPlaceSearch({ input, list, entries, onPick: (e) => picked.push(e.name), doc });
  assert.equal(list.hidden, true);
  input.value = 'raff';
  input.fire('input');
  assert.equal(list.hidden, false);
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(list.children.map((li) => li.children[0].textContent), ['Raffles Place', 'Raffles Hotel', 'Raffles Quay']);
  input.fire('keydown', { key: 'ArrowDown' });
  input.fire('keydown', { key: 'ArrowDown' });
  assert.equal(input.getAttribute('aria-activedescendant'), 'place-results-1');
  assert.equal(list.children[1].getAttribute('aria-selected'), 'true');
  input.fire('keydown', { key: 'Enter' });
  assert.deepEqual(picked, ['Raffles Hotel']);
  assert.equal(input.value, 'Raffles Hotel');
  assert.equal(list.hidden, true);

  input.value = 'bay';
  input.fire('input');
  input.fire('keydown', { key: 'Enter' });
  assert.deepEqual(picked, ['Raffles Hotel', 'Marina Bay Sands'], 'Enter with none chosen: the first');

  input.value = 'qwerty';
  input.fire('input');
  assert.equal(list.children[0].className, 'search-empty', 'nothing by that name: said so');
  input.fire('keydown', { key: 'Enter' });
  assert.equal(picked.length, 2);
  input.fire('keydown', { key: 'Escape' });
  assert.equal(input.value, '');
  assert.equal(list.hidden, true);
});

test('a click picks; "/" puts the cursor in the field, unless typing elsewhere', () => {
  const { doc, input, list } = fakeDom();
  const picked = [];
  bindPlaceSearch({ input, list, entries, onPick: (e) => picked.push(e.name), doc });
  input.value = 'north';
  input.fire('input');
  list.children[0].fire('click');
  assert.deepEqual(picked, ['North Bridge Road']);

  const typing = doc.fire('keydown', { key: '/', target: { tagName: 'TEXTAREA' } });
  assert.equal(doc.focused, null);
  assert.ok(!typing.prevented);
  const slash = doc.fire('keydown', { key: '/', target: { tagName: 'BODY' } });
  assert.equal(doc.focused, input);
  assert.ok(slash.prevented, 'the "/" is not typed into the field');
});

test('the page: the search in the top bar, a combobox over its list', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<input id="place-search"[^>]*role="combobox"[^>]*aria-controls="place-results"/);
  assert.match(html, /<ul id="place-results"[^>]*role="listbox"/);
  const main = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.match(main, /bindPlaceSearch\(\{/);
});
