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
const THREE = { Group, Mesh: Chain, BufferGeometry: Chain, Float32BufferAttribute: Chain, MeshStandardNodeMaterial: Chain, MeshLambertNodeMaterial: Chain, Color: Chain, FrontSide: 0, DoubleSide: 2 };
const tsl = new Proxy({}, { get: () => chain() });
const tinyLook = { pairMaterial: (a, b) => b, createTinyFlatMaterial: (hex) => new Chain({ color: hex }), blendHex: (a) => a, hexToRgb: () => [1, 1, 1] };
const { createKit } = loadModule(readFileSync(join(__dirname, '../js/landmark-kit.js'), 'utf8'), { imports: { 'three/webgpu': THREE, 'three/tsl': tsl, './tiny-look.js': tinyLook }, filename: 'landmark-kit.js' });

const geodata = import(pathToFileURL(join(__dirname, '../js/singapore-geodata.js')).href);
const siteOf = (L) => ({ id: L.id, name: L.name, x: L.x, z: L.z, parts: L.parts.map((p) => ({ ...p, ring: Array.from({ length: p.ring.length / 2 }, (_, k) => [p.ring[k * 2] - L.x, p.ring[k * 2 + 1] - L.z]) })) });

test('the geodata anchors the six CBD landmarks with the mapped parts their programs build from', async () => {
  const { GEO } = await geodata;
  const ids = GEO.landmarks.map((l) => l.id);
  for (const id of ['uob-plaza', 'one-raffles-place', 'guoco-tower', 'republic-plaza', 'asia-square', 'marina-bay-financial-centre']) assert.ok(ids.includes(id), id);
  const republic = GEO.landmarks.find((l) => l.id === 'republic-plaza');
  assert.ok(republic.parts.some((p) => p.roofShape === 'skillion' && p.roofDir >= 0 && p.roofHeight > 0), 'the sloped corner parts carry their roof tags');
  const uob = GEO.landmarks.find((l) => l.id === 'uob-plaza');
  assert.ok(uob.parts.length >= 40, `UOB Plaza: ${uob.parts.length} mapped parts (both towers' stacks)`);
  assert.ok(uob.parts.some((p) => p.height === 280), 'the top of Plaza One at 280 m');
  const guoco = GEO.landmarks.find((l) => l.id === 'guoco-tower');
  assert.ok(guoco.parts.some((p) => p.height === 290 && p.minHeight === 180), 'the Wallich Residence part');
});

for (const [model, documented] of [['uob-plaza', 280], ['one-raffles-place', 283], ['guoco-tower', 290], ['republic-plaza', 280], ['asia-square', 228], ['marina-bay-financial-centre', 245]]) {
  test(`${model}: builds on its anchor to its documented height, with nothing to flicker`, async () => {
    const { GEO } = await geodata;
    const L = GEO.landmarks.find((l) => l.model === model);
    const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${model}.js`)).href);
    assert.equal(info.height, documented);
    const kit = createKit({ anchor: { x: L.x, z: L.z }, name: L.id });
    kit.bearingDeg = GEO.frame.bearingDeg;
    const t0 = performance.now();
    build(kit, siteOf(L));
    const ms = performance.now() - t0;
    assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
    const b = kit.bounds();
    assert.ok(Math.abs(b.maxY - documented) <= 3, `${b.maxY} m tall, ${documented} documented`);
    assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
    assert.ok(Math.max(Math.abs(b.minX), Math.abs(b.maxX), Math.abs(b.minZ), Math.abs(b.maxZ)) < 200, 'within 200 m of its anchor');
    assert.ok(kit.parts.length >= 4, `${kit.parts.length} parts`);
    const flicker = kit.flicker();
    assert.equal(flicker.length, 0, 'faces that would flicker: ' + JSON.stringify(flicker));
    const { colliders, footprints } = kit.finish();
    assert.ok(colliders.length >= 1 && footprints.length >= 1, 'something to walk into, something on the map');
    for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  });
}

async function fullertonModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'fullerton-hotel');
  assert.ok(L, 'the Fullerton Hotel has its own mapped landmark anchor');
  const { build } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/fullerton-hotel.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  return { kit, L };
}

test('Fullerton replaces the hotel footprint, preserving the separate One Fullerton building', async () => {
  const { kit, L } = await fullertonModel();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [46595395,407926378,407926385]);
  assert.ok(kit.triangles > 1000 && kit.triangles < 65000, `detailed but bounded geometry: ${kit.triangles} triangles`);
  const b = kit.bounds();
  assert.ok(b.maxY >= 36 && b.maxY <= 44, `heritage massing and rooftop flag: ${b.maxY} m`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.1);
  for (const axis of ['X', 'Z']) {
    const values = L.parts.find((p) => p.id === 46595395).ring.filter((_, i) => i % 2 === (axis === 'X' ? 0 : 1)).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`] >= Math.min(...values) - 20 && b[`max${axis}`] <= Math.max(...values) + 20, `${axis}: attached to the mapped hotel and adjacent pool terrace`);
  }
});

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}

test('Fullerton has an actual atrium below the roof rather than a solid hotel block', async () => {
  const { kit, L } = await fullertonModel();
  const { GEO } = await geodata;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // The mapped way's vertex-average anchor is on the east wing, not at the atrium's physical centre.
  const { colliders } = kit.finish();
  for (const lat of [1.28603, 1.28643]) {
    // Test both atrium bays, clear of the central rooftop pavilion/link.
    const [wx, wz] = frame.toWorld(103.85298, lat);
    const x = wx - L.x, z = wz - L.z;
    const enclosing = kit.parts.filter((p) => p.y0 < 31 && p.y1 > 31 && covers(p.ring, x, z));
    assert.equal(enclosing.length, 0, 'the upper atrium stays open between the hotel wings');
    const below = kit.parts.filter((p) => p.y1 >= 15 && covers(p.ring, x, z));
    assert.ok(below.some((p) => p.y1 < 30), 'a lower atrium skylight is present');
    assert.ok(!colliders.some((c) => {
      const o = c.obb, dx = wx - o.cx, dz = wz - o.cz;
      return c.minY < 31 && c.maxY > 31 && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
    }), 'wing colliders leave the upper atrium bays clear');
  }
  assert.ok(kit.parts.filter((p) => p.type === 'cylinder' && p.y1 - p.y0 >= 9).length >= 12, 'the giant-order colonnade has individual shafts');
  const pool = kit.parts.find((p) => p.name === 'infinity-pool-water');
  assert.ok(pool && pool.y1 < 5, 'the river-side pool terrace stays below the colonnade');
});

test('Fullerton details merge into a few materials without coplanar flicker', async () => {
  const { kit } = await fullertonModel();
  const start = performance.now();
  const flicker = kit.flicker();
  assert.ok(performance.now() - start < 2000, 'detail validation must not stall city startup for multiple seconds');
  assert.equal(flicker.length, 0, 'no overlapping coplanar detail surfaces: ' + JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  assert.ok(colliders.length > 0 && footprints.length > 0);
  assert.ok(colliders.some((c) => c.maxY >= 33), 'the upper hotel wings remain solid to aircraft, not just the low plinth');
  assert.ok(footprints.some((p) => p.h >= 33), 'the map records the actual hotel height');
  for (const name of ['atrium-skylight', 'lighthouse-pavilion']) {
    const part = kit.parts.find((p) => p.name === name);
    const x = kit.anchor.x + part.ring.reduce((sum, p) => sum + p[0] / part.ring.length, 0);
    const z = kit.anchor.z + part.ring.reduce((sum, p) => sum + p[1] / part.ring.length, 0);
    const y = (part.y0 + part.y1) / 2;
    assert.ok(colliders.some((c) => {
      const o = c.obb, dx = x - o.cx, dz = z - o.cz;
      return c.minY <= y && c.maxY >= y && Math.abs(dx * o.cs - dz * o.sn) <= o.hx && Math.abs(dx * o.sn + dz * o.cs) <= o.hz;
    }), `${name} stops descent through its interior`);
  }
  for (const p of kit.parts) for (const n of Object.values(p.bounds)) assert.ok(Number.isFinite(n), `finite bounds for ${p.name}`);
});
