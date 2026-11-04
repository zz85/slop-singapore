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

// Wing On Life Building (SG-084), 150 Cecil Street (James Ferrie & Partners, completed 1975): a near-blind tiled
// podium and, inset over its roof terrace, a cream slab wrapped in twelve bands of precast twisted fins forming
// diamond openings over recessed dark glass, a plain service core on its rear face and a blank crown band.
// 56 m and 20 storeys are the mapped values. See docs/wing-on-life-building.md.
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
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

async function wingOnLife() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'wing-on-life-building');
  assert.ok(L, 'Wing On Life Building has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/wing-on-life-building.js')).href);
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
const TOP = 56, PODIUM = 13, FINNED = [13.8, 52.5];

test('Wing On Life Building replaces its single mapped outline, and nothing else', async () => {
  const { L, info } = await wingOnLife();
  assert.deepEqual(L.parts.map((p) => p.id), [171995555]);
  const part = L.parts[0];
  assert.equal(part.levels, 20);
  assert.equal(part.height, 56);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'wing-on-life-building');
  assert.deepEqual(registered.hide, [171995555]);
  for (const [id, name] of [[171995552, 'Far Eastern Bank Building'], [171995562, 'Solitaire on Cecil'], [171995560, '158 Cecil Street'], [171995558, 'Tokio Marine Centre']])
    assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
  assert.equal(info.name, 'Wing On Life Building');
  assert.equal(info.height, TOP);
});

test('Wing On Life Building builds on its anchor to its mapped 56 m in a moment, within its outline', async () => {
  const { kit, ms, ring } = await wingOnLife();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - TOP) <= 0.1, `${b.maxY} m tall, ${TOP} mapped`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  // the neighbours share the outline's long edges: nothing may step over them
  for (const p of kit.parts.filter((q) => q.type !== 'sign' && q.type !== 'beam')) {
    for (const [x, z] of p.ring) assert.ok(outside(ring, x, z) <= 0.35, `${p.name} within the outline (${outside(ring, x, z).toFixed(2)} m out)`);
  }
  const podium = kit.parts.find((p) => p.name === 'podium');
  assert.ok(podium && Math.abs(podium.y1 - PODIUM) <= 0.2, 'the podium to its 13 m');
  const crown = kit.parts.find((p) => p.name === 'crown');
  assert.ok(crown && crown.y0 >= FINNED[1] - 0.1 && Math.abs(crown.y1 - TOP) <= 0.1, 'the blank crown band to 56 m');
});

test('Wing On Life Building: the finned slab inset over the podium terrace, solid through', async () => {
  const { kit, ring, L } = await wingOnLife();
  const { colliders } = kit.finish();
  const avg = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  // the podium roof terrace toward the north-west corner, clear of the tower slab and its fins
  const v = ring[2], tx = v[0] + (avg[0] - v[0]) * 0.22, tz = v[1] + (avg[1] - v[1]) * 0.22;
  assert.ok(covers(ring, tx, tz), 'the terrace probe lies inside the outline');
  const terraceTop = top(kit, tx, tz);
  assert.ok(terraceTop > PODIUM - 0.4 && terraceTop < PODIUM + 1.2, `the terrace at ${terraceTop} m`);
  assert.equal(builtOver(kit, tx, tz, PODIUM + 2, 400).length, 0, 'the tower keeps clear of the terrace corner');
  assert.ok(!colliderAt(colliders, tx + L.x, 20, tz + L.z), 'the air over the terrace is open');
  assert.ok(colliderAt(colliders, tx + L.x, 12.9, tz + L.z), 'the podium roof stops descent');
  for (const y of [20, 35, 50]) assert.ok(colliderAt(colliders, avg[0] + L.x, y, avg[1] + L.z), `the slab solid at ${y} m`);
  assert.ok(!colliderAt(colliders, avg[0] + L.x, TOP + 2, avg[1] + L.z), 'nothing over the crown');
  assert.ok(kit.parts.some((p) => p.name === 'core-bar' && p.y1 > FINNED[1] - 2), 'the plain rear service core up the slab');
});

test('Wing On Life Building wears twelve bands of diamond fins over its recessed glass', async () => {
  const { kit } = await wingOnLife();
  const slabs = kit.parts.filter((p) => p.name.startsWith('tower-slab-'));
  assert.equal(slabs.length, 12, 'twelve projecting slab edges, one per finned floor');
  const fins = kit.parts.filter((p) => p.type === 'beam' && p.name.startsWith('fin-'));
  assert.ok(fins.length >= 500, `${fins.length} diagonal fin blades`);
  assert.ok(fins.every((p) => p.bounds.minY >= FINNED[0] - 0.6 && p.bounds.maxY <= FINNED[1] + 0.6), 'the fins keep to the finned bands');
  const diagonal = fins.filter((p) => {
    const [a, bb] = p.ring;
    return Math.hypot(bb[0] - a[0], bb[1] - a[1]) > 0.5 && p.bounds.maxY - p.bounds.minY > 1.5;
  });
  assert.ok(diagonal.length >= fins.length * 0.9, 'the blades run diagonally, not vertically');
  const glass = kit.parts.find((p) => p.name === 'tower-glass');
  assert.ok(glass && Math.abs(glass.y0 - FINNED[0]) < 0.1 && Math.abs(glass.y1 - FINNED[1]) < 0.1, 'the recessed glass behind the lattice');
  assert.equal(kit.parts.filter((p) => p.type === 'sign').length, 0, 'no signage: the photographs show none');
});

test('Wing On Life Building stays finite, batched and free of flicker', async () => {
  const { kit } = await wingOnLife();
  assert.ok(kit.triangles > 2000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  assert.ok(footprints.some((f) => f.h >= TOP - 0.5), 'the map has the slab at its height');
});
