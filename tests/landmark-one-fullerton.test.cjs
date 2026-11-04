const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// One Fullerton (SG-033) built against the kit on its real generated anchor: the two-storey glass dining
// building under its wave shells, replacing exactly its mapped outline and roof parts. See docs/one-fullerton.md.

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
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 60).map((p) => p.y1));

async function model() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'one-fullerton');
  assert.ok(L, 'One Fullerton has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/one-fullerton.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  return { kit, L, info, at, ms };
}
// independently located points (lon, lat) from the OSM rings' centroids
const P = {
  south: [103.8537560, 1.2852126], // part 407926371, the southern shell
  north: [103.8541444, 1.2862426], // part 407926390, the big northern shell
  drum: [103.8539956, 1.2859494], // part 407926388, the raised drum (min_height 8)
  bay: [103.85460, 1.28580], // Marina Bay water east of the building
  road: [103.85340, 1.28580] // Fullerton Road west of the building
};

test('SG-033 One Fullerton replaces its outline and seven roof parts, and nothing else', async () => {
  const { L, info } = await model();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b),
    [46595394, 407926351, 407926353, 407926356, 407926371, 407926374, 407926388, 407926390]);
  const outline = L.parts.find((p) => p.id === 46595394);
  assert.equal(outline.levels, 2);
  assert.equal(outline.height, 12);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'one-fullerton');
  assert.deepEqual([...registered.hide].sort((a, b) => a - b),
    [46595394, 407926351, 407926353, 407926356, 407926371, 407926374, 407926388, 407926390]);
  for (const id of [46595395, 172931401]) assert.ok(!registered.hide.includes(id), 'the Fullerton Hotel and Waterboat House remain their own landmarks');
  assert.equal(info.name, 'One Fullerton');
  assert.equal(info.height, 12);
});

test('SG-033 One Fullerton: a two-storey glass body under sloped wave shells to its mapped 12 m', async () => {
  const { kit, L, at, ms } = await model();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(b.maxY >= 11 && b.maxY <= 13, `${b.maxY} m tall, 12 mapped`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  for (const [axis, i] of [['X', 0], ['Z', 1]]) {
    const values = L.parts.find((p) => p.id === 46595394).ring.filter((_, k) => k % 2 === i).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b['min' + axis] >= Math.min(...values) - 2 && b['max' + axis] <= Math.max(...values) + 2, `${axis}: within the mapped outline`);
  }
  const [sx, sz] = at(...P.south), [nx, nz] = at(...P.north);
  assert.ok(builtOver(kit, sx, sz, 2, 3).length, 'glass body at the southern segment');
  assert.ok(top(kit, sx, sz) >= 8.5 && top(kit, sx, sz) <= 12.5, `southern shell over it (${top(kit, sx, sz)})`);
  assert.ok(top(kit, nx, nz) >= 9.5 && top(kit, nx, nz) <= 12.5, `the big northern shell (${top(kit, nx, nz)})`);
  const shells = kit.parts.filter((p) => p.name.startsWith('wave-roof-'));
  assert.ok(shells.length >= 4, `${shells.length} wave-roof shells from the mapped skillion parts`);
  assert.ok(shells.filter((p) => p.caps.length === 0).length >= 3, 'the shells are genuinely sloped tops, not flat slabs');
  const [dx, dz] = at(...P.drum);
  assert.ok(builtOver(kit, dx, dz, 9, 10.5).length, 'the raised drum stands above the body in the middle');
  assert.ok(kit.parts.some((p) => p.type === 'sign' && /fullerton/i.test(p.name)), 'the ONE FULLERTON sign of the photographs');
});

test('SG-033 One Fullerton stays finite, batched and flicker-free; roofs solid, bay and road open', async () => {
  const { kit, at } = await model();
  assert.ok(kit.triangles > 300 && kit.triangles < 65000, `${kit.triangles} triangles`);
  assert.equal(kit.flicker().length, 0, JSON.stringify(kit.flicker().slice(0, 10)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const hit = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(hit(P.south, 10), 'the southern shell stops descent');
  assert.ok(hit(P.north, 10.5), 'the northern shell stops descent');
  assert.ok(hit(P.drum, 10), 'the drum stops descent');
  assert.ok(!hit(P.bay, 3) && !hit(P.road, 3), 'the bay and Fullerton Road stay open');
  assert.ok(footprints.some((f) => f.h >= 11), 'the map has the building at its height');
});

