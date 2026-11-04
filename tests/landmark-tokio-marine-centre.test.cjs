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

// Tokio Marine Centre (SG-083), 20 McCallum Street (Chan Sau Yan Associates, completed 2010): a dark-glass office
// slab on open stilts over a public concourse, wrapped in a pale fair-faced concrete exoskeleton of bundled
// near-vertical columns and long diagonals — the "bamboo grove". CTBUH: 124.5 m architectural, 21 floors;
// the roof slab is modelled at the structural 121.5 m under its plant. See docs/tokio-marine-centre.md.
function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}
function outside(ring, x, z) {
  if (covers(ring, x, z)) return 0;
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[j], [bx, bz] = ring[i], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}
const colliderAt = (colliders, x, y, z) => colliders.some((c) => {
  const o = c.obb, dx = x - o.cx, dz = z - o.cz;
  return c.minY < y && c.maxY > y && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
});
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));

async function tokioMarine() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'tokio-marine-centre');
  assert.ok(L, 'Tokio Marine Centre has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/tokio-marine-centre.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  const site = siteOf(L);
  return { kit, L, info, at, ms, ring: site.parts[0].ring };
}
const TOP = 124.5, ROOF = 121.5, BASE = [11, 20], TOWER0 = 20;

test('Tokio Marine Centre replaces its single mapped outline, and nothing else', async () => {
  const { L, info } = await tokioMarine();
  assert.deepEqual(L.parts.map((p) => p.id), [171995558]);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'tokio-marine-centre');
  assert.deepEqual(registered.hide, [171995558]);
  for (const [id, name] of [[171995560, '158 Cecil Street'], [171995552, 'Far Eastern Bank Building'], [171995555, 'Wing On Life Building'],
    [171995559, 'Bangkok Bank'], [326926561, "Bangkok Bank's tower part"], [171995553, 'The Clift']])
    assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
  assert.equal(info.name, 'Tokio Marine Centre');
  assert.equal(info.height, TOP);
});

test('Tokio Marine Centre builds on its anchor to 124.5 m in a moment, within its mapped outline', async () => {
  const { kit, ms, ring } = await tokioMarine();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - TOP) <= 0.2, `${b.maxY} m tall, ${TOP} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  for (const p of kit.parts.filter((q) => q.type !== 'sign' && q.type !== 'beam')) {
    for (const [x, z] of p.ring) assert.ok(outside(ring, x, z) <= 0.6, `${p.name} within the outline (${outside(ring, x, z).toFixed(2)} m out)`);
  }
  const glass = kit.parts.find((p) => p.name === 'tower-glass');
  assert.ok(glass && glass.type === 'loft' && Math.abs(glass.y0 - TOWER0) < 0.1 && Math.abs(glass.y1 - ROOF) < 0.2,
    'the flared glass tower from the base band to the 121.5 m roof slab');
  const plant = kit.parts.find((p) => p.name === 'roof-plant');
  assert.ok(plant && plant.y0 >= ROOF - 0.1 && Math.abs(plant.y1 - TOP) < 0.2, 'roof plant to the architectural top');
});

test('Tokio Marine Centre stands on stilts over an open concourse, its dark base band above', async () => {
  const { kit, ring, L } = await tokioMarine();
  const { colliders } = kit.finish();
  const stilts = kit.parts.filter((p) => p.name.startsWith('stilt-'));
  assert.ok(stilts.length >= 5, `${stilts.length} stilts`);
  assert.ok(stilts.every((p) => p.y0 <= 0.1 && p.y1 >= BASE[0] - 0.2), 'the stilts carry the base band from the ground');
  // open concourse: 4 m inside the middle of the long north edge, clear of the vertex stilts and the lobby box
  const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  let edge = null, best = -1;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], bb = ring[(i + 1) % ring.length], len = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    if (len > best) { best = len; edge = [a, bb]; }
  }
  const mid = [(edge[0][0] + edge[1][0]) / 2, (edge[0][1] + edge[1][1]) / 2];
  const toC = [c[0] - mid[0], c[1] - mid[1]], d = Math.hypot(...toC);
  const px = mid[0] + toC[0] / d * 4, pz = mid[1] + toC[1] / d * 4;
  assert.ok(covers(ring, px, pz), 'the concourse probe lies inside the outline');
  assert.equal(builtOver(kit, px, pz, 0.6, BASE[0] - 1).length, 0, 'the concourse is open there');
  assert.ok(!colliderAt(colliders, px + L.x, 3, pz + L.z), 'and free to walk through');
  assert.ok(builtOver(kit, px, pz, BASE[0], BASE[1]).some((p) => p.name === 'base-band'), 'the dark base band over it');
  assert.ok(colliderAt(colliders, px + L.x, 15, pz + L.z), 'the band is solid above');
  // the tower solid through, the air over the roof open
  for (const y of [40, 80, 115]) assert.ok(colliderAt(colliders, c[0] + L.x, y, c[1] + L.z), `the tower solid at ${y} m`);
  assert.ok(!colliderAt(colliders, c[0] + L.x, TOP + 2, c[1] + L.z), 'nothing over the roof');
});

test('Tokio Marine Centre wears its bamboo exoskeleton: bundled uprights and long diagonals over the glass', async () => {
  const { kit } = await tokioMarine();
  const uprights = kit.parts.filter((p) => p.name.startsWith('exo-up-'));
  assert.ok(uprights.length >= 24, `${uprights.length} exoskeleton uprights round the tower`);
  assert.ok(uprights.every((p) => p.y0 >= TOWER0 - 0.1 && p.y1 > ROOF - 1), 'the uprights run the tower height to the roofline');
  assert.ok(uprights.some((p) => p.y1 > ROOF + 0.3), 'some uprights overshoot the parapet, as photographed');
  const diagonals = kit.parts.filter((p) => p.type === 'beam' && p.name.startsWith('exo-diag-'));
  assert.ok(diagonals.length >= 8, `${diagonals.length} long diagonals`);
  assert.ok(diagonals.every((p) => p.bounds.maxY - p.bounds.minY > 15), 'each diagonal crosses many floors');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1, 'the ground-level name screen only: no crown sign in any photograph');
  assert.ok(signs[0].y1 < 7, `the sign at street level (${signs[0].y0.toFixed(1)}-${signs[0].y1.toFixed(1)} m)`);
});

test('Tokio Marine Centre stays finite, batched and free of flicker', async () => {
  const { kit } = await tokioMarine();
  assert.ok(kit.triangles > 500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  assert.ok(footprints.some((f) => f.h >= TOP - 0.5), 'the map has the tower at its height');
});
