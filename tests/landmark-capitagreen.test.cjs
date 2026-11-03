const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// The landmark model programs (js/landmark-models/<model>.js) built against the kit (js/landmark-kit.js) on their
// real anchors (GEO.landmarks of js/singapore-geodata.js, tools/city/build.mjs): each stands where it is mapped,
// reaches its documented height, draws no faces that would flicker, and builds in a moment.

const chain = () => new Proxy(function node() {}, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k] : k === 'then' ? undefined : chain()),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => chain(),
  construct: () => chain()
});
class Chain { constructor(o) { const c = chain(); if (o && typeof o === 'object') Object.assign(c, o); return c; } }
class Group { constructor() { this.children = []; this.position = { set() {} }; } add(...o) { this.children.push(...o); return this; } }
const THREE = { Group, Mesh: Chain, BufferGeometry: Chain, Float32BufferAttribute: Chain, MeshStandardNodeMaterial: Chain, MeshLambertNodeMaterial: Chain, MeshBasicNodeMaterial: Chain, CanvasTexture: Chain, SRGBColorSpace: 'srgb', Color: Chain, FrontSide: 0, DoubleSide: 2 };
const tsl = new Proxy({}, { get: () => chain() });
const tinyLook = { pairMaterial: (a, b) => b, createTinyFlatMaterial: (hex) => new Chain({ color: hex }), blendHex: (a) => a, hexToRgb: () => [1, 1, 1] };
const { createKit } = loadModule(readFileSync(join(__dirname, '../js/landmark-kit.js'), 'utf8'), { imports: { 'three/webgpu': THREE, 'three/tsl': tsl, './tiny-look.js': tinyLook }, filename: 'landmark-kit.js' });

const geodata = import(pathToFileURL(join(__dirname, '../js/singapore-geodata.js')).href);
const siteOf = (L) => ({ id: L.id, name: L.name, x: L.x, z: L.z, parts: L.parts.map((p) => ({ ...p, ring: Array.from({ length: p.ring.length / 2 }, (_, k) => [p.ring[k * 2] - L.x, p.ring[k * 2 + 1] - L.z]) })) });

// --- CapitaGreen (SG-060) -------------------------------------------------------------------------------------------------
// A six-sided tower with a planted double skin, sky terraces cut into its corners, an open cage round the Sky Forest and
// the red wind catcher rising out of it to 242 m; a raised block of planted ledges on four posts over an open plaza.

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}
const colliderAt = (colliders, x, y, z) => colliders.some((c) => {
  const o = c.obb, dx = x - o.cx, dz = z - o.cz;
  return c.minY < y && c.maxY > y && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
});
async function siteModel(id) {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === id);
  assert.ok(L, `${id} has its own mapped landmark anchor`);
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${L.model}.js`)).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // a lon/lat as a point about the anchor, then in the world
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  return { kit, L, info, at, ms };
}
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, posts and rafters aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
// ... and the same without the trees and palms planted on the decks
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree-crown|trunk|palm-crown/.test(p.name));

// Points read off the mapped rings (OSM ways 1566865514, 1566865513) and the photographs: inside the tower, in the open
// plaza under the raised block, on the wind catcher's axis (a little west of the plan's middle, from the aerial), inside
// each sky terrace, just inside the cage at the roof's north-west edge, and on the pavement outside the cut corners
const CG = {
  tower: [103.8501365, 1.281583], plaza: [103.8501686, 1.2822014], axis: [103.8500482, 1.2818012],
  terraces: [
    { at: [103.8500965, 1.2821187], floor: 34.25, ceiling: 48.5, what: 'over the raised block' },
    { at: [103.8498752, 1.2816822], floor: 77, ceiling: 91.25, what: 'the west corner, lower' },
    { at: [103.8498632, 1.2817057], floor: 129.25, ceiling: 143.5, what: 'the west corner, upper' },
    { at: [103.8502397, 1.2816303], floor: 134, ceiling: 148.25, what: 'the east corner' }
  ],
  cageEdge: [103.8498943, 1.2819363], outsideEast: [103.8503888, 1.2818725], outsideWest: [103.8497608, 1.2817111]
};
const SKY_FOREST = 200.5, GARDEN = 204.5, RIM = 221.6; // the roof deck, the raised garden on it, the cage's rim

test('CapitaGreen replaces its outline, the tower, the raised block and its four posts, and nothing else', async () => {
  const { L, info } = await siteModel('capitagreen');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [393100853, 1566865509, 1566865510, 1566865511, 1566865512, 1566865513, 1566865514]);
  assert.equal(info.name, 'CapitaGreen');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const id of [424896147]) assert.ok(!registered.hide.includes(id), '18 Robinson stays the city\'s');
});

test('CapitaGreen builds on its anchor to its documented 242 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('capitagreen');
  assert.equal(info.height, 242);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = siteOf(L).parts.find((p) => p.id === 393100853).ring;
  for (const axis of [0, 1]) {
    const values = outline.map((p) => p[axis]), [lo, hi] = axis ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    assert.ok(lo >= Math.min(...values) - 1.5 && hi <= Math.max(...values) + 1.5, `within the mapped outline along ${axis ? 'z' : 'x'} (${lo.toFixed(1)}..${hi.toFixed(1)})`);
  }
});

test('CapitaGreen: the Sky Forest over the roof deck, and the wind catcher rising out of it to 242 m, open at the top', async () => {
  const { kit, at } = await siteModel('capitagreen');
  const top = ([lon, lat]) => { const [x, z] = at(lon, lat); return Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1)); };
  assert.ok(Math.abs(top(CG.tower) - GARDEN) <= 0.5, `the Sky Forest's raised garden at about 204 m (${top(CG.tower)})`);
  const [ax, az] = at(...CG.axis);
  const neck = builtOver(kit, ax, az, SKY_FOREST, 212);
  assert.ok(neck.some((p) => /^crown-neck-/.test(p.name) && Math.abs(p.y0 - SKY_FOREST) < 0.01), 'the red neck stands on the deck');
  // the broad white collar at the cage's rim, carried on the neck's lower funnel, from which the petals flare
  const collar = kit.parts.find((p) => p.name === 'crown-collar');
  assert.ok(collar && collar.bounds.minY >= RIM - 0.01 && collar.bounds.maxY <= 225, `the collar just over the rim (${collar?.bounds.minY}–${collar?.bounds.maxY} m)`);
  assert.ok(Math.min(collar.bounds.maxX - collar.bounds.minX, collar.bounds.maxZ - collar.bounds.minZ) >= 24, 'about 25 m across');
  assert.equal(builtOver(kit, ax, az, collar.bounds.maxY + 0.5, 400).length, 0, 'the funnel is open over the collar');
  // two tall petals, north and south, each flaring in five rings, its radius growing faster the higher it goes, cut
  // off in a level lip (the north one at the tip's 242 m, the south one a little lower)
  const petal = (name) => kit.parts.filter((p) => p.name.startsWith(`crown-petal-${name}-`)).sort((a, b) => a.y0 - b.y0);
  const n = petal('north'), s = petal('south');
  assert.ok(n.length >= 5 && s.length >= 5, `smooth flares (${n.length} and ${s.length} rings)`);
  assert.ok(Math.abs(n.at(-1).y1 - 242) <= 0.5 && s.at(-1).y1 >= 237 && s.at(-1).y1 < n.at(-1).y1, `lips at ${n.at(-1).y1} and ${s.at(-1).y1} m`);
  for (const [name, rings] of [['north', n], ['south', s]]) {
    const r = rings.map((p) => Math.max(...p.ring.map(([x, z]) => Math.hypot(x - ax, z - az))));
    const steps = r.slice(1).map((v, k) => (v - r[k]) / (rings[k + 1].y0 - rings[k].y0));
    assert.ok(steps.every((d, k) => d > 0 && (k === 0 || d > steps[k - 1])), `the ${name} petal flares in a concave curve (${steps.map((d) => d.toFixed(2))})`);
    assert.ok(Math.abs(rings[0].y0 - collar.bounds.maxY) < 0.5 && r[0] < 6, `the ${name} petal springs from the collar round the neck`);
    const lip = rings.at(-1).bounds;
    assert.ok(Math.hypot(lip.maxX - lip.minX, lip.maxZ - lip.minZ) >= 26, `the ${name} lip opens wide`);
  }
  // two red horns sweeping out east and west under the collar and past it
  for (const name of ['east', 'west']) {
    const horn = kit.parts.filter((p) => p.name.startsWith(`crown-horn-${name}-`));
    const tip = horn.at(-1).bounds, [tx, tz] = [(tip.minX + tip.maxX) / 2, (tip.minZ + tip.maxZ) / 2];
    assert.ok(horn.length >= 4 && Math.hypot(tx - ax, tz - az) >= 14 && tip.maxY <= 226, `the ${name} horn reaches out past the collar`);
  }
  assert.ok(kit.parts.some((p) => p.name === 'crown-restaurant' && Math.abs(p.y0 - SKY_FOREST) < 0.01), 'the restaurant\'s box on the deck');
  assert.ok(kit.parts.filter((p) => /^crown-forest-.*tree-crown$/.test(p.name)).length >= 15, 'the Sky Forest\'s trees');
});

test('CapitaGreen: the cage is the outer skin carried past the roof, pale glass under a flat white rim on the fins', async () => {
  const { kit, at } = await siteModel('capitagreen');
  const [x, z] = at(...CG.cageEdge);
  assert.equal(solidOver(kit, x, z, SKY_FOREST + 0.1, RIM - 0.7).length, 0, 'nothing solid inside the cage at the roof\'s edge');
  const glass = kit.parts.filter((p) => /^crown-cage-glass-/.test(p.name)), rim = kit.parts.filter((p) => /^crown-cage-rim-/.test(p.name));
  assert.equal(glass.length, 6, 'glass along each of the six walls');
  for (const p of glass) assert.ok(Math.abs(p.y0 - SKY_FOREST) < 0.01 && p.y1 >= 218, `${p.name} from the deck almost to the top`);
  assert.equal(rim.length, 6, 'a rim along each wall');
  for (const p of rim) assert.ok(Math.abs(p.y1 - RIM) < 0.01 && p.y1 - p.y0 < 1, `${p.name} a flat band at the top`);
  const fins = kit.parts.filter((p) => /^tower-fin-/.test(p.name));
  assert.ok(fins.filter((p) => Math.abs(p.bounds.maxY - (RIM - 0.6)) < 0.01).length >= 120, 'a dense row of fins up the tower to the rim');
});

test('CapitaGreen: the raised block of planted ledges stands 20–30 m over an open plaza, on its four posts and the tower', async () => {
  const { kit, at } = await siteModel('capitagreen');
  const [px, pz] = at(...CG.plaza);
  assert.equal(solidOver(kit, px, pz, 0.5, 19.9).length, 0, 'the plaza under the block is open');
  assert.ok(builtOver(kit, px, pz, 0, 0.5).some((p) => p.name === 'base-plaza' && p.y1 >= 0.3), 'paved above the city\'s lawn');
  const block = solidOver(kit, px, pz, 20, 40);
  assert.ok(block.length >= 3 && Math.min(...block.map((p) => p.y0)) === 20 && Math.abs(Math.max(...block.map((p) => p.y1)) - 30.4) < 0.01, 'the block from 20 to 30 m');
  const posts = kit.parts.filter((p) => /^base-post-/.test(p.name));
  assert.equal(posts.length, 4);
  for (const p of posts) assert.ok(p.y0 === 0 && p.y1 === 20, `${p.name} from the ground to the soffit`);
  assert.ok(kit.parts.filter((p) => /^base-column-/.test(p.name)).length >= 30, 'the white wavy columns under the block');
});

test('CapitaGreen: sky terraces are cut into the corners, open between their floors and ceilings', async () => {
  const { kit, at } = await siteModel('capitagreen');
  const { colliders } = kit.finish();
  for (const t of CG.terraces) {
    const [x, z, wx, wz] = at(...t.at);
    assert.equal(solidOver(kit, x, z, t.floor + 0.1, t.ceiling - 0.1).length, 0, `${t.what}: open`);
    assert.ok(solidOver(kit, x, z, t.floor - 2, t.floor).length >= 1, `${t.what}: storeys under it`);
    assert.ok(solidOver(kit, x, z, t.ceiling, t.ceiling + 2).length >= 1, `${t.what}: the tower over it`);
    assert.ok(!colliderAt(colliders, wx, (t.floor + t.ceiling) / 2, wz), `${t.what}: free to fly into`);
    assert.ok(colliderAt(colliders, wx, t.ceiling + 3, wz), `${t.what}: solid above`);
  }
});

test('CapitaGreen: nothing floats — every raised piece rests on or in something under it (a fin on a wall beside it)', async () => {
  const { kit } = await siteModel('capitagreen');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    // a fin starting over a sky terrace is fixed to the storeys' wall that starts there with it
    const wall = /^tower-fin-/.test(p.name) && parts.find((q) => q.type !== 'beam' && q.bounds.minY <= p.bounds.minY + 0.01 && q.bounds.maxY >= p.bounds.minY + 1 && overlap(p.bounds, q.bounds));
    assert.ok(under || wall, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the crown in particular: the neck on the deck, the lower funnel on the neck, the collar on the funnel, the petals
  // on the collar, the horns on the funnel, the rim on the fins
  const find = (re) => kit.parts.filter((p) => re.test(p.name));
  const neck = find(/^crown-neck-/).sort((a, b) => a.y0 - b.y0);
  assert.ok(Math.abs(neck[0].y0 - SKY_FOREST) < 0.01 && neck.every((p, k) => k === 0 || Math.abs(p.y0 - neck[k - 1].y1) < 0.01), 'the neck rises unbroken from the deck');
  const collarUnder = find(/^crown-collar-under$/)[0];
  assert.ok(collarUnder.y0 < neck.at(-1).y1, 'the collar sits on the funnel');
  for (const p of find(/^crown-petal-.*-0$/)) assert.ok(p.y0 < find(/^crown-collar$/)[0].y1, `${p.name} springs from inside the collar`);
});

test('CapitaGreen: its one sign, the name over the lobby, hangs on the south-east wall under the block\'s soffit', async () => {
  const { kit } = await siteModel('capitagreen');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1);
  const [s] = signs;
  assert.ok(s.y1 <= 20, 'under the lobby\'s top');
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
  const host = solids.filter((p) => p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 1 && w.y0 <= s.y0 && w.y1 >= s.y1 && w.nx > 0.99));
  assert.ok(host.length, 'on a wall facing south-east (the city\'s +x) that stands behind all of it');
});

test('CapitaGreen stays finite, batched and free of flicker; solid where built, open on the pavement and in the plaza', async () => {
  const { kit, at } = await siteModel('capitagreen');
  assert.ok(kit.triangles > 3000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solidAt(CG.tower, 1.5) && solidAt(CG.tower, 100) && solidAt(CG.tower, 199), 'the tower is solid from the lobby to the deck');
  assert.ok(solidAt(CG.axis, 205), 'the wind catcher\'s neck is solid');
  assert.ok(solidAt(CG.plaza, 25), 'the raised block is solid');
  assert.ok(!solidAt(CG.plaza, 1.5) && !solidAt(CG.plaza, 12), 'the plaza under it is not');
  assert.ok(!solidAt(CG.cageEdge, 210), 'nor the air inside the cage');
  for (const y of [1.5, 60, 150]) assert.ok(!solidAt(CG.outsideEast, y) && !solidAt(CG.outsideWest, y), `no invisible walls outside the cut corners at ${y} m`);
  assert.ok(footprints.some((f) => f.h >= 200), 'the map has the tower at its height');
});
