import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createBuildingPicker, rayPrism, insideRings, toLonLat } from '../js/building-picker.js';
import { decodeBuildingInfo, formatAddress, describeBuilding, bindBuildingInfo } from '../js/building-info.js';
import { makeFrame } from '../tools/city/frame.mjs';

// A click on a building (js/building-picker.js, js/building-info.js): the ray through the click meets the building as
// it stands, the nearest first, and the card says its name, its address (else the streets it is near) and where it is

const square = (cx, cz, half) => Float64Array.from([cx - half, cz - half, cx + half, cz - half, cx + half, cz + half, cx - half, cz + half]);
const unit = (x, y, z) => { const l = Math.hypot(x, y, z); return { x: x / l, y: y / l, z: z / l }; };
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('a ray meets a prism through a wall, onto its roof, never through a courtyard', () => {
  const box = [square(0, 0, 10)];
  near(rayPrism({ x: -50, y: 5, z: 0 }, { x: 1, y: 0, z: 0 }, box, 0, 20), 40, 1e-9);
  assert.equal(rayPrism({ x: -50, y: 25, z: 0 }, { x: 1, y: 0, z: 0 }, box, 0, 20), Infinity, 'over it');
  near(rayPrism({ x: 0, y: 100, z: 0 }, { x: 0, y: -1, z: 0 }, box, 0, 20), 80, 1e-9);
  near(rayPrism({ x: 0, y: -5, z: 0 }, { x: 0, y: 1, z: 0 }, box, 8, 20), 13, 1e-9);
  // a block round a courtyard: straight down the courtyard reaches the ground
  const court = [square(0, 0, 20), square(0, 0, 8)];
  assert.ok(insideRings(court, 15, 0) && !insideRings(court, 0, 0));
  assert.equal(rayPrism({ x: 0, y: 50, z: 0 }, { x: 0, y: -1, z: 0 }, court, 0, 20), Infinity);
  near(rayPrism({ x: 15, y: 50, z: 0 }, { x: 0, y: -1, z: 0 }, court, 0, 20), 30, 1e-9);
});

test('the picker: the nearest building along the ray, before the ground', () => {
  const p = createBuildingPicker();
  p.add([square(100, 0, 10)], 0, 10, 'low');
  p.add([square(200, 0, 10)], 0, 200, 'tower');
  p.add([square(400, 0, 10)], 0, 10, 'far');
  assert.equal(p.size, 3);
  // level across the city, 5 m up: the low block first
  assert.equal(p.pick({ x: 0, y: 5, z: 0 }, unit(1, 0, 0)).ref, 'low');
  // 50 m up: over the low block, into the tower
  const hit = p.pick({ x: 0, y: 50, z: 0 }, unit(1, 0, 0));
  assert.equal(hit.ref, 'tower');
  near(hit.x, 190, 1e-6);
  assert.deepEqual([hit.cx, hit.cz], [200, 0], 'the middle of its outline');
  // from above, straight down onto the far block's roof; and down onto the street between them: nothing
  assert.equal(p.pick({ x: 400, y: 300, z: 5 }, unit(0, -1, 0)).ref, 'far');
  assert.equal(p.pick({ x: 300, y: 300, z: 0 }, unit(0, -1, 0)), null, 'the ground first');
  // down a slope towards the far block: it lands short of it
  assert.equal(p.pick({ x: 300, y: 30, z: 0 }, unit(10, -10, 0)), null);
  // looking away: nothing
  assert.equal(p.pick({ x: 0, y: 5, z: 0 }, unit(-1, 0, 0)), null);
  // a long way down the street, past the 64 m cells and back across negative ones
  const q = createBuildingPicker();
  q.add([square(-1000, -1000, 15)], 0, 30, 'there');
  assert.equal(q.pick({ x: 100, y: 120, z: 100 }, unit(-1100, -105, -1100)).ref, 'there');
});

test('an island tile\'s outlines, about its corner: once while it is in view, gone with it, back with it', () => {
  const p = createBuildingPicker();
  p.add([square(4510, 6030, 5)], 0, 10, 'its neighbour'); // (sharing a cell with the tile's building)
  const outlines = { pts: Float32Array.from([0, 0, 20, 0, 20, 20, 0, 20]), offsets: Uint32Array.from([0, 4]), tops: Float32Array.from([40]) };
  p.addTile('3_4', 4500, 6000, outlines);
  p.addTile('3_4', 4500, 6000, outlines);
  assert.equal(p.size, 2);
  const down = (x, z) => p.pick({ x, y: 500, z }, unit(0, -1, 0));
  const hit = down(4510, 6010);
  assert.deepEqual(hit.ref, { kind: 'tile', tile: '3_4' });
  near(hit.y, 40, 1e-6);
  p.dropTile('3_4');
  assert.equal(p.size, 1);
  assert.equal(down(4510, 6010), null);
  assert.equal(down(4510, 6030).ref, 'its neighbour', 'the rest of its cell stays');
  p.addTile('3_4', 4500, 6000, outlines);
  assert.deepEqual(down(4510, 6010).ref, { kind: 'tile', tile: '3_4' });
  // a tile of several buildings sharing cells, alone in them: all gone at once
  const q = createBuildingPicker();
  const two = { pts: Float32Array.from([0, 0, 10, 0, 10, 10, 0, 10, 20, 0, 30, 0, 30, 10, 20, 10]), offsets: Uint32Array.from([0, 4, 8]), tops: Float32Array.from([12, 15]) };
  q.addTile('1_1', 1500, 1500, two);
  assert.equal(q.size, 2);
  q.dropTile('1_1');
  assert.equal(q.size, 0);
  assert.equal(q.pick({ x: 1505, y: 100, z: 1505 }, unit(0, -1, 0)), null);
  q.dropTile('1_1');
  q.addTile('1_1', 1500, 1500, two);
  assert.equal(q.pick({ x: 1525, y: 100, z: 1505 }, unit(0, -1, 0)).y, 15);
});

test('a world point\'s longitude & latitude: the frame\'s own inverse', () => {
  const frame = { lat0: 1.28405, lon0: 103.85143, bearingDeg: 31.8 };
  const exact = makeFrame({ lat0: frame.lat0, lon0: frame.lon0, theta: (frame.bearingDeg * Math.PI) / 180 });
  for (const [x, z] of [[0, 0], [915, -483], [-3565, -788], [4000, 2500]]) {
    const [lon, lat] = toLonLat(frame, x, z);
    const [elon, elat] = exact.toLonLat(x, z);
    near(lon, elon, 1e-12);
    near(lat, elat, 1e-12);
    const [bx, bz] = exact.toWorld(lon, lat);
    near(bx, x, 1e-6);
    near(bz, z, 1e-6);
  }
});

test('the names & addresses: decoded in order, written as Singapore writes them', () => {
  const INFO = { version: 1, buildings: 10, strings: ['UOB Plaza', 'Raffles Place', '80', '048624', 'Boat Quay', '7'], data: [2, 1, 2, 3, 4, 3, 0, 5, 6, 0], sites: { mbs: { name: 'Marina Bay Sands', street: '', number: '', postcode: '' } } };
  const names = decodeBuildingInfo(INFO);
  assert.equal(names.count, 10);
  assert.deepEqual([...names.byIndex.keys()], [2, 5]);
  assert.deepEqual(names.byIndex.get(2), { name: 'UOB Plaza', street: 'Raffles Place', number: '80', postcode: '048624' });
  assert.deepEqual(names.byIndex.get(5), { name: '', street: 'Boat Quay', number: '7', postcode: '' });
  assert.equal(formatAddress(names.byIndex.get(2), 'Singapore'), '80 Raffles Place, Singapore 048624');
  assert.equal(formatAddress(names.byIndex.get(5), 'Singapore'), '7 Boat Quay');
  assert.equal(formatAddress({ street: 'Orchard Road' }), 'Orchard Road');
  assert.equal(formatAddress({ number: '5' }), '', 'no street, no address');
  const rows = (o) => describeBuilding({ lon: 103.851, lat: 1.284, city: 'Singapore', ...o }).map(([label, value]) => `${label}: ${value}`);
  assert.deepEqual(rows({ info: names.byIndex.get(2) }), ['Name: UOB Plaza', 'Address: 80 Raffles Place, Singapore 048624', 'Coordinates: 1.28400, 103.85100']);
  assert.deepEqual(rows({ info: names.sites.mbs, near: 'Bayfront Avenue' }), ['Name: Marina Bay Sands', 'Near: Bayfront Avenue', 'Coordinates: 1.28400, 103.85100'], 'no address: what it is near');
  assert.deepEqual(rows({ info: null }), ['Coordinates: 1.28400, 103.85100']);
});

// A small stand-in DOM: the canvas's pointer events and the card
function fakePage() {
  const listeners = {};
  const canvas = { addEventListener(type, fn) { (listeners[type] ||= []).push(fn); } };
  const fire = (type, e) => { for (const fn of listeners[type] || []) fn({ button: 0, pointerId: 1, timeStamp: 0, type, ...e }); };
  const make = () => ({ children: [], style: {}, className: '', textContent: '', append(...c) { this.children.push(...c); }, replaceChildren(...c) { this.children = c; } });
  const card = { ...make(), hidden: false, offsetWidth: 220, offsetHeight: 80 };
  const doc = { createElement: make, pointerLockElement: null };
  return { canvas, card, fire, doc, win: { innerWidth: 1000, innerHeight: 700 } };
}

test('the card: a click shows it beside the point, a drag or a pinch does not, a click on nothing hides it', () => {
  const { canvas, card, fire, doc, win } = fakePage();
  const picks = [];
  let found = { rows: [['Name', 'UOB Plaza', 'name'], ['Coordinates', '1.28503, 103.85081', 'coords']], point: { x: 1, y: 2, z: 3 } };
  let at = { x: 400, y: 300, visible: true };
  const ui = bindBuildingInfo({ canvas, card, doc, win, pickAt: (x, y) => { picks.push([x, y]); return found; }, project: () => at });
  assert.equal(card.hidden, true);
  assert.equal(ui.visible, false);
  // a click
  fire('pointerdown', { clientX: 400, clientY: 300, timeStamp: 0 });
  fire('pointerup', { clientX: 402, clientY: 301, timeStamp: 150 });
  assert.deepEqual(picks, [[402, 301]]);
  assert.equal(card.hidden, false);
  assert.equal(ui.visible, true);
  assert.deepEqual(card.children.map((r) => [r.className, r.children[0].textContent, r.children[1].textContent]), [
    ['bi-row bi-name', 'Name', 'UOB Plaza'], ['bi-row bi-coords', 'Coordinates', '1.28503, 103.85081']
  ]);
  assert.equal(card.style.transform, 'translate(414px, 314px)', 'below and to the right of the point');
  // it follows its point; near the right edge it turns to the left of it, and behind the camera it waits unseen
  at = { x: 950, y: 300, visible: true };
  ui.update();
  assert.equal(card.style.transform, 'translate(716px, 314px)');
  at = { x: 0, y: 0, visible: false };
  ui.update();
  assert.equal(card.style.visibility, 'hidden');
  // a drag of the view, a long press, a pinch, another button: no pick
  fire('pointerdown', { clientX: 400, clientY: 300 });
  fire('pointerup', { clientX: 440, clientY: 300, timeStamp: 100 });
  fire('pointerdown', { clientX: 400, clientY: 300 });
  fire('pointerup', { clientX: 400, clientY: 300, timeStamp: 2000 });
  fire('pointerdown', { clientX: 400, clientY: 300, pointerId: 1 });
  fire('pointerdown', { clientX: 500, clientY: 300, pointerId: 2 });
  fire('pointerup', { clientX: 400, clientY: 300, pointerId: 1 });
  fire('pointerup', { clientX: 500, clientY: 300, pointerId: 2 });
  fire('pointerdown', { clientX: 400, clientY: 300, button: 2 });
  fire('pointerup', { clientX: 400, clientY: 300, button: 2 });
  assert.equal(picks.length, 1);
  // a click on the ground: the card goes; Esc (main.js) the same
  found = null;
  fire('pointerdown', { clientX: 10, clientY: 10 });
  fire('pointerup', { clientX: 10, clientY: 10 });
  assert.equal(card.hidden, true);
  assert.equal(ui.visible, false);
  found = { rows: [], point: {} };
  fire('pointerdown', { clientX: 10, clientY: 10 });
  fire('pointerup', { clientX: 10, clientY: 10 });
  ui.hide();
  assert.equal(card.hidden, true);
});

test('Singapore\'s names & addresses: one list per building drawn, its landmarks named with their addresses', async () => {
  const { INFO } = await import('../js/singapore-building-info.js');
  const { GEO } = await import('../js/singapore-geodata.js');
  let count = 0;
  for (let i = 0, d = GEO.buildings.data; i < d.length; count++) {
    const rings = d[i];
    i += 4 + GEO.buildings.extra;
    for (let r = 0; r < rings; r++) i += 1 + d[i] * 2;
  }
  assert.equal(INFO.buildings, count, 'written with the geodata the city draws');
  const names = decodeBuildingInfo(INFO);
  assert.ok(names.byIndex.size > 10000, `${names.byIndex.size} buildings with a name or an address`);
  assert.ok([...names.byIndex.keys()].every((k) => k >= 0 && k < count));
  const named = [...names.byIndex.values()].map((v) => v.name);
  for (const n of ['National Museum of Singapore', 'Raffles City Shopping Centre', 'Sim Lim Square']) assert.ok(named.includes(n), n);
  for (const l of GEO.landmarks) assert.equal(names.sites[l.id]?.name, l.name, `${l.id}: named`);
  assert.equal(formatAddress(names.sites['uob-plaza'], 'Singapore'), '80 Raffles Place, Singapore 048624');
  assert.equal(formatAddress(names.sites['raffles-hotel'], 'Singapore'), '1 Beach Road', 'the hotel\'s relation, not a wing\'s');
  for (const id of ['mbs', 'flyer', 'supertrees', 'esplanade']) assert.ok(names.sites[id]?.name, `${id}: named`);
});

test('the page: the card, and the picker over the city, its landmarks and the island tiles', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="building-info" class="building-info" role="status" aria-live="polite" hidden><\/div>/);
  const main = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.match(main, /buildingPicker\.addTile\(key, x, z, outlines\)/);
  assert.match(main, /import\(`\.\/\$\{CITY\.id\}-building-info\.js`\)/);
  for (const f of ['../js/singapore-landmarks.js', '../js/landmark-models.js']) {
    assert.match(fs.readFileSync(new URL(f, import.meta.url), 'utf8'), /\.site\b/, `${f}: its footprints know their landmark`);
  }
});
