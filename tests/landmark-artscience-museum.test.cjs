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

// ArtScience Museum (SG-048): Safdie's lotus: ten petals on a bowl lifted over its lily pond, the tallest 60 m up
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
  underBowl: [103.858991, 1.286088], // 20 m at bearing 270: under the lifted bowl, over the pond
  tallPetal: [103.859260, 1.286361], // 32 m at bearing 18: in the tallest petal near its end
  longPetal: [103.859501, 1.285811], // 48 m at bearing 130: in the long south-eastern petal near its end
  underLong: [103.859446, 1.285857], // 40 m at bearing 130: the plaza under that petal
  notch: [103.858905, 1.286007], // 31 m at bearing 253: the notch between two western petals
  entrance: [103.859292, 1.286209], // 19 m at bearing 45: the glazed entrance pavilion
  outside: [103.858567, 1.286691] // 95 m at bearing 315: the bay/promenade beyond the outline
};
// the petals' bearings, clustered from the mapped slices, and the progression of their documented heights
const BEARINGS = [18, 60, 96, 130, 166, 200, 237, 269, 303, 335];
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

test('ArtScience: ten petals rising from the five short western ones to the 60 m northern one, on a lifted bowl', async () => {
  const { kit, ms, at } = await artscience();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 60) <= 1, `${b.maxY} m tall, 60 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const tips = BEARINGS.map((_, i) => kit.parts.find((p) => p.name === `petal-${i}-tip`));
  assert.ok(tips.every(Boolean), 'ten petals, each ending in a cut tip');
  const heights = tips.map((p) => p.y1);
  assert.ok(Math.abs(heights[0] - 60) <= 1, `the northern petal reaches ${heights[0]} m`);
  for (let i = 1; i < 5; i++) assert.ok(heights[i] < heights[i - 1] - 2, `falling clockwise from the tallest: ${heights.slice(0, 5)}`);
  for (const h of heights.slice(5)) assert.ok(h >= 33 && h <= 37, `the western petals stand alike (the mapped 15 m, scaled): ${h}`);
  // each petal spreads as far as the mapped outline does on its bearing
  const { L } = await artscience();
  const [cx, cz] = at(...AS.core), N = kit.compass(0), E = kit.compass(90);
  const bearing = ([x, z]) => (Math.atan2((x - cx) * E[0] + (z - cz) * E[1], (x - cx) * N[0] + (z - cz) * N[1]) * 180 / Math.PI + 360) % 360;
  const near = (a, deg, tol) => Math.abs(((a - deg + 540) % 360) - 180) <= tol;
  const outline = L.parts.find((p) => p.id === 261191086).ring;
  const corners = Array.from({ length: outline.length / 2 }, (_, k) => [outline[k * 2] - L.x, outline[k * 2 + 1] - L.z]);
  const outlinePts = corners.flatMap(([x, z], k) => { // every half metre along its edges
    const [x2, z2] = corners[(k + 1) % corners.length], n = Math.max(1, Math.ceil(Math.hypot(x2 - x, z2 - z) / 0.5));
    return Array.from({ length: n }, (_, j) => [x + (x2 - x) * j / n, z + (z2 - z) * j / n]);
  });
  BEARINGS.forEach((deg, i) => {
    const pts = kit.parts.filter((p) => p.name.startsWith(`petal-${i}-`)).flatMap((p) => p.ring);
    const reach = Math.max(...pts.map(([x, z]) => Math.hypot(x - cx, z - cz)));
    const mapped = Math.max(...outlinePts.filter((q) => near(bearing(q), deg, 10)).map(([x, z]) => Math.hypot(x - cx, z - cz)));
    assert.ok(Math.abs(reach - mapped) <= 5, `petal at ${deg}°: reaches ${reach.toFixed(1)} m, mapped ${mapped.toFixed(1)} m`);
    assert.ok(pts.filter(([x, z]) => Math.hypot(x - cx, z - cz) > 3).every((q) => near(bearing(q), deg, 30)), `petal at ${deg}° keeps to its own bearing`);
  });
  // the bowl is lifted over the pond on its core; the dish between the petals is open to the sky
  const bowl = kit.parts.filter((p) => p.name.startsWith('petal-'));
  assert.ok(Math.abs(Math.min(...bowl.map((p) => p.y0)) - 12.6) < 0.5, "the bowl's underside 12.6 m over the pond");
  assert.ok(top(kit, cx, cz) >= 12, 'the core carries the bowl over the mapped round base');
  const [ux, uz] = at(...AS.underBowl);
  assert.ok(builtOver(kit, ux, uz, 0.5, 12).filter((p) => !p.name.startsWith('lily')).length === 0, "nothing stands under the bowl's western flank but the pond");
  assert.ok(kit.parts.some((p) => p.name === 'pond') && kit.parts.filter((p) => p.name.startsWith('lily-')).length >= 10, 'the lily pond, with its pads');
  const [ex, ez] = at(...AS.entrance);
  assert.ok(builtOver(kit, ex, ez, 2, 9).some((p) => p.name === 'entrance'), 'the glazed entrance pavilion on the north-east');
  assert.ok(kit.parts.filter((p) => p.type === 'sign').length === 0, 'no crown sign: the photographs show none');
});

test('ArtScience stays finite, batched and free of flicker, the bowl and petals solid and the dish, notches and bay open', async () => {
  const { kit } = await artscience();
  assert.ok(kit.triangles > 2000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const { at } = await artscience();
  const solid = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solid(AS.core, 5), 'the core is solid');
  assert.ok(!solid(AS.underBowl, 5) && solid(AS.underBowl, 20), 'open under the lifted bowl, solid inside it');
  assert.ok(solid(AS.tallPetal, 50) && !solid(AS.tallPetal, 64), 'the tallest petal stops descent near its end, the air over it open');
  assert.ok(solid(AS.longPetal, 40) && !solid(AS.underLong, 5), 'the long south-eastern petal is solid, the plaza under it open');
  assert.ok(!solid(AS.core, 40), 'the dish between the petals is open to the sky');
  assert.ok(!solid(AS.notch, 31), 'the notch between two western petals is open');
  assert.ok(solid(AS.entrance, 5), 'the entrance pavilion is solid');
  assert.ok(!solid(AS.outside, 3) && !solid(AS.outside, 30), 'the bay beyond stays open');
  assert.ok(footprints.some((f) => f.h >= 59), 'the map has a petal at its height');
});
