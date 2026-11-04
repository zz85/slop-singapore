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

// ArtScience Museum (SG-048): Safdie's ten-fingered lotus over its lily pond, the tallest fingertip 60 m up
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
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

async function artscience() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'artscience-museum');
  assert.ok(L, 'the ArtScience Museum has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/artscience-museum.js')).href);
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
// independently located points (lon, lat), from the OSM rings: the round base's centroid and bearings from it
const AS = {
  core: [103.859171, 1.286088], // centroid of the mapped round base 827855915
  tallPetal: [103.859249, 1.286327], // 28 m at bearing 18 from the core: under the tallest finger
  pond: [103.858913, 1.286009], // 30 m at bearing 253: the lily pond between the western fingers
  outside: [103.858568, 1.286691] // 95 m at bearing 315: the bay/promenade beyond the pond outline
};
// relation 14314416's member ways, from the extract
const MEMBERS = [261191086, 827855854, 827855856, 827855857, 827855858, 827855859, 827855860, 827855861, 827855862, 827855863,
  827855864, 827855865, 827855866, 827855867, 827855868, 827855869, 827855870, 827855883, 827855884, 827855885, 827855886,
  827855887, 827855888, 827855889, 827855890, 827855891, 827855892, 827855893, 827855894, 827855895, 827855896, 827855897,
  827855898, 827855899, 827855900, 827855901, 827855903, 827855904, 827855905, 827855906, 827855907, 827855908, 827855910,
  827855911, 827855912, 827855913, 827855914, 827855915, 827855916, 827855917, 827855918, 827855919, 827855920, 827855921,
  827855922, 827855923, 827855924, 827855925, 827855926, 827855927, 827855928, 827855929, 827855930];

test('ArtScience replaces relation 14314416 and all its member ways, and nothing else', async () => {
  const { L, info } = await artscience();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [...MEMBERS].sort((a, b) => a - b));
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'artscience-museum');
  assert.deepEqual([...registered.hide].sort((a, b) => a - b), [...MEMBERS].sort((a, b) => a - b));
  assert.deepEqual(registered.hideRelations, [14314416]);
  for (const id of [172471575, 172471576, 620580651, 679034072, 827847306, 172013197, 821764692])
    assert.ok(!registered.hide.includes(id), 'the pond-side pavilions, the Shoppes slices, the Crystal Pavilion and the Apple dome remain');
  assert.equal(info.name, 'ArtScience Museum');
  assert.equal(info.height, 60, "the owner's documented tallest finger");
});

test('ArtScience: ten fingers in the mapped progression to 60 m, over pond and drum', async () => {
  const { kit, ms, at } = await artscience();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 60) <= 1, `${b.maxY} m tall, 60 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const tips = kit.parts.filter((p) => /^petal-\d+-tip$/.test(p.name));
  assert.equal(tips.length, 10, 'ten fingers');
  const heights = tips.map((p) => p.y1).sort((a, b) => b - a);
  assert.ok(Math.abs(heights[0] - 60) <= 1, `tallest fingertip ${heights[0]} m`);
  assert.ok(heights[9] >= 28 && heights[9] <= 38, `shortest fingertip ${heights[9]} m, still well over the pond`);
  for (let i = 1; i < heights.length; i++) assert.ok(heights[i] < heights[i - 1], 'a distinct height progression, no two fingers alike');
  const [cx, cz] = at(...AS.core);
  assert.ok(top(kit, cx, cz) >= 10, 'the round base/bowl stands over the mapped core');
  const [px, pz] = at(...AS.pond);
  assert.ok(top(kit, px, pz) <= 3, `the lily pond between the fingers stays open water/deck (${top(kit, px, pz)} m)`);
  assert.ok(kit.parts.some((p) => p.name === 'pond'), 'the reflecting lily pond is modelled');
  assert.ok(kit.parts.filter((p) => p.type === 'sign').length === 0, 'no crown sign: the photographs show none');
});

test('ArtScience stays finite, batched and free of flicker, petals solid and the pond and bay open', async () => {
  const { kit, at } = await artscience();
  assert.ok(kit.triangles > 800 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solid = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solid(AS.core, 5), 'the drum is solid at its base');
  assert.ok(solid(AS.tallPetal, 50), 'the tallest finger stops descent near its tip');
  assert.ok(!solid(AS.tallPetal, 65), 'the air over the fingertip is open');
  assert.ok(!solid(AS.pond, 12) && !solid(AS.pond, 30), 'no invisible wall over the pond between the fingers');
  assert.ok(!solid(AS.outside, 3) && !solid(AS.outside, 30), 'outside the pond outline stays open');
  assert.ok(footprints.some((f) => f.h >= 59), 'the map has a finger at its height');
});
