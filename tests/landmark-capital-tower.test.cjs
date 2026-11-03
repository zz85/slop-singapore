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

// --- Capital Tower (SG-062) -----------------------------------------------------------------------------------------------
// A 60 × 49 m shaft of stone wings and banded glass bays to 163 m, a plant storey and glass boxes to 190 m, a glass tier
// curving in on all four sides to 229 m, and the louvred crown to 254 m; a glass funnel on the plaza face, the entrance
// canopy, and the eight-storey car park on the north-east side with the club's pool on its roof.

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
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 510811294, 1558353295) in the drawing (u toward Robinson Road, v toward
// the car park): inside the tower; in the plaza face's slot, in front of its recessed glass; in the corner notches
// beside the plaza bay, over the three-storey blocks; 2 m inside the north-west wall (inside the tier low down, outside
// it near the top as the glass curves in); under the entrance canopy; on the forecourt clear of the canopy; inside the
// funnel; over the club's pool; inside the car park; on the pavements beyond the end walls
const CT = {
  tower: [103.8476022, 1.2775961], slotRecess: [103.8474936, 1.2774213], notchW: [103.8472993, 1.2775520],
  notchS: [103.8476917, 1.2773052], tierNW: [103.8473936, 1.2777380], canopy: [103.8474784, 1.2773967],
  forecourt: [103.8475536, 1.2773387], funnel: [103.8474831, 1.2774044], pool: [103.8478298, 1.2777836],
  podium: [103.8476069, 1.2779451], outsideNW: [103.8473707, 1.2777950], outsideSE: [103.8478813, 1.2774739]
};
const IDS = [47345009, 510811279, 510811283, 510811287, 510811289, 510811290, 510811291, 510811292, 510811293, 510811294,
  510811295, 510811296, 510811297, 1558353295, 1558353296, 1558353297, 1566725293, 1566725294, 1566725295, 1566725296];
const SHAFT = 163, TIER = 228.6, BAND = 235, ROOF = 252.4, PODIUM = 28;

test('Capital Tower replaces its outline, the stacked tower parts, the car park and the corner blocks, and nothing else', async () => {
  const { L, info } = await siteModel('capital-tower');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), IDS);
  assert.equal(info.name, 'Capital Tower');
  assert.equal(L.parts.find((p) => p.id === 1558353295).levels, 8, 'the car park block is mapped with eight storeys');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const [id, name] of [[48948265, 'SBF Center'], [47345028, 'Robinson 77']]) assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
});

test('Capital Tower builds on its anchor to its documented 254 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('capital-tower');
  assert.equal(info.height, 254);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  // in the outline's own frame (along the grid toward Robinson Road and toward the car park): the tower and the car
  // park within the outline, cornices and ledges up to 1.5 m proud; only the forecourt with its canopy and palms (on the
  // ground) and the funnel's canopy (at 94 m) reach out from the plaza face, by no more than 6.5 and 8 m
  const outline = siteOf(L).parts.find((p) => p.id === 47345009).ring;
  const U = kit.compass(122), V = kit.compass(32), d = (p, a) => p[0] * a[0] + p[1] * a[1];
  const [u0, u1, v0, v1] = [Math.min(...outline.map((p) => d(p, U))), Math.max(...outline.map((p) => d(p, U))), Math.min(...outline.map((p) => d(p, V))), Math.max(...outline.map((p) => d(p, V)))];
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const pts = p.type === 'beam' ? [[p.bounds.minX, p.bounds.minZ], [p.bounds.maxX, p.bounds.maxZ]] : p.ring;
    const front = /^base-/.test(p.name) ? 6.5 : /^funnel-/.test(p.name) ? 8 : 1.5;
    for (const q of pts) {
      const [u, v] = [d(q, U), d(q, V)];
      assert.ok(u >= u0 - 1.5 && u <= u1 + 1.5 && v <= v1 + 1.5 && v >= v0 - front, `${p.name} within the outline (${(u - u0).toFixed(1)}, ${(v - v0).toFixed(1)})`);
    }
  }
});

test('Capital Tower: the shaft to 163 m, the glass tier curving in on all four sides to 229 m, the crown to 254 m', async () => {
  const { kit, at } = await siteModel('capital-tower');
  const [tx, tz] = at(...CT.tower);
  assert.equal(top(kit, tx, tz), 254, 'the crown\'s roof over the middle of the plan');
  assert.ok(builtOver(kit, tx, tz, SHAFT - 1, SHAFT - 0.5).some((p) => /^shaft-/.test(p.name)), 'the shaft up to 163 m');
  assert.ok(builtOver(kit, tx, tz, SHAFT + 0.1, SHAFT + 0.5).some((p) => p.name === 'band-cornice'), 'the cornice over it');
  // the tier: six lofts from the wings' rectangle (60 × 42 m) to the mapped top (51 × 33 m), each face receding faster
  // the higher it goes (a convex shoulder, as the photographs show): true slopes, not steps
  const tier = kit.parts.filter((p) => /^tier-\d$/.test(p.name)).sort((a, b) => a.y0 - b.y0);
  assert.equal(tier.length, 6);
  assert.ok(tier.every((p) => p.type === 'loft') && tier.every((p, k) => k === 0 || Math.abs(p.y0 - tier[k - 1].y1) < 0.01), 'one unbroken run of lofts');
  const U = kit.compass(122), V = kit.compass(32), d = (p, a) => p[0] * a[0] + p[1] * a[1];
  const width = (ring, a) => Math.max(...ring.map((p) => d(p, a))) - Math.min(...ring.map((p) => d(p, a)));
  for (const [axis, base, last, label] of [[U, 60.1, 50.7, 'along Robinson Road'], [V, 42.3, 33.1, 'across it']]) {
    const w = [width(tier[0].ring, axis), ...tier.map((p) => width(p.caps[0].ring, axis))];
    assert.ok(Math.abs(w[0] - base) < 0.3 && Math.abs(w.at(-1) - last) < 0.3, `${label}: from ${w[0].toFixed(1)} to ${w.at(-1).toFixed(1)} m`);
    const steps = tier.map((p, k) => (w[k] - w[k + 1]) / (p.y1 - p.y0));
    assert.ok(steps.every((s, k) => s >= 0 && (k === 0 || s > steps[k - 1])), `${label}: each face recedes faster the higher it goes (${steps.map((s) => s.toFixed(3))})`);
  }
  // 2 m inside the north-west wall: inside the tier low down, outside it near the top
  const [nx, nz] = at(...CT.tierNW);
  assert.ok(builtOver(kit, nx, nz, 190, 200).some((p) => /^tier-/.test(p.name)), 'inside the tier at 190–200 m');
  assert.equal(builtOver(kit, nx, nz, 216, 227).length, 0, 'the north-west face has curved in past it by 216 m');
  // the crown: the band, the club's glass behind five blades narrowing upward, the flat roof on posts
  const blades = [0, 1, 2, 3, 4].map((k) => kit.parts.filter((p) => p.name.startsWith(`crown-blade-${k}-`)));
  assert.ok(blades.every((b) => b.length === 4), 'five blades, each a frame round the glass');
  const spans = blades.map((b) => Math.max(...b.map((p) => p.bounds.maxX)) - Math.min(...b.map((p) => p.bounds.minX)));
  assert.ok(spans.every((s, k) => k === 0 || s < spans[k - 1]), 'each blade narrower than the one under it');
  const glass = kit.parts.find((p) => p.name === 'crown-glass');
  assert.ok(Math.abs(glass.y0 - BAND) < 0.01 && Math.abs(glass.y1 - ROOF) < 0.01, 'the club\'s glass from the band to the roof');
  assert.ok(kit.parts.filter((p) => /^crown-post-/.test(p.name)).length >= 20, 'posts round the blades');
});

test('Capital Tower: the plaza face\'s slot, the funnel on it, and the glass boxes and slits over the cornice', async () => {
  const { kit, at } = await siteModel('capital-tower');
  const { colliders } = kit.finish();
  // the slot is a recess up the bay: open in front of its glass, between the flanks, above the funnel
  const [sx, sz, swx, swz] = at(...CT.slotRecess);
  assert.equal(builtOver(kit, sx, sz, 100, SHAFT - 2).length, 0, 'the slot is recessed behind the bay\'s face');
  assert.ok(!colliderAt(colliders, swx, 130, swz), 'free to fly into');
  // the funnel: a half cone of glass widening from 72 m to 94 m under its canopy, solid
  const funnel = kit.parts.find((p) => p.name === 'funnel-glass'), canopy = kit.parts.find((p) => p.name === 'funnel-canopy');
  assert.ok(funnel.type === 'loft' && Math.abs(funnel.y0 - 72) < 0.5 && Math.abs(funnel.y1 - 94.2) < 0.5, `from ${funnel.y0} to ${funnel.y1} m`);
  const radius = (ring) => Math.max(...ring.map(([x, z]) => Math.hypot(x - ring[0][0], z - ring[0][1]))) / 2;
  assert.ok(radius(funnel.caps[0].ring) > 2 * radius(funnel.ring), 'more than twice as wide at the top as at its foot');
  assert.ok(Math.abs(canopy.y0 - funnel.y1) < 0.01, 'the canopy on its rim');
  const [, , fx, fz] = at(...CT.funnel);
  assert.ok(colliderAt(colliders, fx, 85, fz), 'the funnel is solid');
  // the glass boxes in front of the bays from the cornice to 190 m, each under its ledge; a dark slit over each
  for (const side of ['sw', 'ne']) {
    const b = kit.parts.find((p) => p.name === `band-box-${side}`), ledge = kit.parts.find((p) => p.name === `band-box-${side}-ledge`);
    assert.ok(b.y0 > SHAFT && Math.abs(b.y1 - 189.6) < 0.01 && ledge.y0 > b.y1 && ledge.y1 <= 191, `the ${side} box and its ledge`);
    assert.ok(kit.parts.some((p) => p.name.startsWith(`tier-slit-${side}-`) && Math.abs(p.y0 - ledge.y1) < 0.01), `a slit over the ${side} ledge`);
  }
});

test('Capital Tower: open spaces stay open — the corner notches over the plinth, under the canopy, the forecourt', async () => {
  const { kit, at } = await siteModel('capital-tower');
  const { colliders } = kit.finish();
  for (const where of ['notchW', 'notchS']) {
    const [x, z, wx, wz] = at(...CT[where]);
    assert.ok(builtOver(kit, x, z, 0, 11).some((p) => /^base-corner-/.test(p.name)), `${where}: the three-storey block`);
    assert.equal(builtOver(kit, x, z, 12.5, SHAFT - 1).length, 0, `${where}: open over it up to the cornice`);
    assert.ok(!colliderAt(colliders, wx, 60, wz) && colliderAt(colliders, wx, 6, wz), `${where}: solid low, free above`);
  }
  // the canopy over the entrance: on posts, open under it, solid to land on
  const [cx, cz, cwx, cwz] = at(...CT.canopy);
  assert.ok(builtOver(kit, cx, cz, 5.5, 6.1).some((p) => p.name === 'base-canopy'), 'the canopy over the entrance');
  assert.equal(builtOver(kit, cx, cz, 0.5, 5.5).length, 0, 'open under it');
  assert.ok(colliderAt(colliders, cwx, 5.8, cwz) && !colliderAt(colliders, cwx, 2, cwz), 'solid to land on, free to walk under');
  assert.equal(kit.parts.filter((p) => /^base-canopy-post-/.test(p.name)).length, 2, 'two posts at its edge');
  // the forecourt, paved above the city's lawn and open to the sky
  const [px, pz, pwx, pwz] = at(...CT.forecourt);
  assert.ok(builtOver(kit, px, pz, 0, 0.5).some((p) => p.name === 'base-forecourt' && p.y1 >= 0.3), 'paved above the lawn');
  assert.equal(builtOver(kit, px, pz, 0.5, 400).length, 0, 'open to the sky');
  for (const y of [2, 60, 170]) assert.ok(!colliderAt(colliders, pwx, y, pwz), `no invisible walls on the forecourt at ${y} m`);
});

test('Capital Tower: the car park\'s eight storeys with the club\'s pool on its roof', async () => {
  const { kit, at } = await siteModel('capital-tower');
  const { colliders } = kit.finish();
  const [x, z] = at(...CT.pool);
  assert.ok(Math.abs(top(kit, x, z) - (PODIUM + 0.35)) < 0.01, `the pool's water on the deck (${top(kit, x, z)})`);
  assert.ok(builtOver(kit, x, z, PODIUM + 0.3, PODIUM + 0.4).some((p) => p.name === 'podium-pool'), 'over the pool');
  const podium = kit.parts.find((p) => p.name === 'podium');
  assert.ok(podium.y0 === 0 && podium.y1 === PODIUM, 'the car park from the ground to 28 m');
  const [, , wx, wz] = at(...CT.podium);
  assert.ok(colliderAt(colliders, wx, 15, wz) && colliderAt(colliders, wx, PODIUM + 0.2, wz), 'solid through, the deck to land on');
  assert.ok(kit.parts.filter((p) => /^podium-umbrella-\d$/.test(p.name)).length >= 4, 'umbrellas along the pool');
});

test('Capital Tower: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('capital-tower');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the crown in particular: the roof on the glass and the posts, the posts on the band, the band on the cornice
  const find = (n) => kit.parts.find((p) => p.name === n);
  assert.ok(Math.abs(find('crown-roof').y0 - find('crown-glass').y1) < 0.01, 'the roof on the glass');
  for (const p of kit.parts.filter((q) => /^crown-post-/.test(q.name))) assert.ok(Math.abs(p.bounds.minY - BAND) < 0.2 && p.bounds.maxY >= ROOF, `${p.name} from the band to the roof`);
  assert.ok(find('crown-band').y0 <= find('crown-cornice').y1 + 0.01, 'the band on the cornice');
  assert.ok(find('crown-cornice-soffit').y0 < TIER, 'the cornice on the tier');
});

test('Capital Tower: its signs hang on walls under the roofline — CapitaLand on the crown\'s band toward the plaza, the name by the door', async () => {
  const { kit } = await siteModel('capital-tower');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.deepEqual(Array.from(signs, (s) => s.name).sort(), ['sign:capital-tower', 'sign:capitaland']);
  const [dx, dz] = kit.compass(212);
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const host = solids.filter((p) => p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 0.6 && w.y0 <= s.y0 && w.y1 >= s.y1 && w.nx * dx + w.nz * dz > 0.99));
    assert.ok(host.length, `${s.name} on a wall facing the plaza that stands behind all of it`);
    assert.ok(s.y1 <= Math.max(...host.map((p) => p.y1)), `${s.name} under its wall's top`);
  }
  const cl = signs.find((s) => s.name === 'sign:capitaland');
  assert.ok(cl.y0 > 229.6 && cl.y1 <= BAND, `CapitaLand on the crown's band (${cl.y0.toFixed(1)}–${cl.y1.toFixed(1)} m)`);
  const width = Math.hypot(cl.ring[1][0] - cl.ring[0][0], cl.ring[1][1] - cl.ring[0][1]);
  assert.ok(width >= 9 && width <= 13, `about 12 m wide (${width.toFixed(1)})`);
  assert.ok(signs.find((s) => s.name === 'sign:capital-tower').y1 <= 8, 'the name under the lobby\'s top');
});

test('Capital Tower stays finite, batched and free of flicker; solid where built, open on the pavements', async () => {
  const { kit, at } = await siteModel('capital-tower');
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  for (const y of [1.5, 80, 162, 168, 185, 200, 226, 232, 245, 253.5]) assert.ok(solidAt(CT.tower, y), `the tower is solid at ${y} m`);
  for (const y of [1.5, 60, 170]) assert.ok(!solidAt(CT.outsideNW, y) && !solidAt(CT.outsideSE, y), `no invisible walls beyond the end walls at ${y} m`);
  assert.ok(footprints.some((f) => f.h >= 160), 'the map has the shaft at its height');
});
