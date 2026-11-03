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

// --- The Sail @ Marina Bay (SG-044) ---------------------------------------------------------------------------------------
// Two residential towers of a glass sail and a pale leaf each: Marina Bay Tower's leading edge bowed out at mid-height
// and rising into a pointed tip at 245 m, Central Park Tower's curving back under a crown sloping up to 215 m; the
// car-park podium with its club deck, the bridge over the drive, and the open plaza between them.

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
// ... and the same without the trees and palms
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree-crown|trunk|palm-crown/.test(p.name));
const top = (kit, x, z) => Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 325793771, 325793747, 47345007), NBBJ's plans and the photographs: inside
// each tower's glass leaf (the bay tower's beside its tip) and pale leaf; under the bay tower's overhanging leading edge, just inside its mapped east-
// south-east point; inside the park tower's mapped north-north-east end, where its leading edge curves back above
// mid-height; on the plaza between the towers, in the gap between them toward Marina View, under the bridge, on a
// tennis court on the club deck, and on the plaza just off the podium's curved edge
const SAIL = {
  bayGlass: [103.8529949, 1.2811155], bayPale: [103.8527273, 1.2813676], overhang: [103.8531682, 1.2811138],
  bowEnd: [103.8530294, 1.2808971], parkPale: [103.8528869, 1.2806828], plaza: [103.8528999, 1.2810471],
  gap: [103.8530963, 1.2809884], bridge: [103.8527271, 1.2811443], deck: [103.8524195, 1.2808680], plazaEdge: [103.8527761, 1.2810179]
};
const ROOF = { bay: 229, tip: 245, ridge: 215, podium: 25 };

test('The Sail replaces its two towers, the podium and the stray sliver, and nothing else', async () => {
  const { L, info } = await siteModel('the-sail');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [47345007, 325793747, 325793771, 1201220123]);
  assert.equal(info.name, 'The Sail @ Marina Bay');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const id of [393092728, 1035284763]) assert.ok(!registered.hide.includes(id), 'Marina Bay Suites and its podium stay the city\'s');
});

test('The Sail builds on its anchor to its documented 245 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('the-sail');
  assert.equal(info.height, 245);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const rings = siteOf(L).parts.filter((p) => p.ring.length >= 3).map((p) => p.ring);
  const extent = (axis) => [Math.min(...rings.flat().map((p) => p[axis])), Math.max(...rings.flat().map((p) => p[axis]))];
  // the towers and the podium keep within their mapped extents; only the canopy over the walk along Marina Boulevard
  // (3.5 m deep) and the boom on the bay face reach past the towers' mapped faces
  const inner = kit.parts.filter((p) => /^(bay-glass|bay-pale|park-|crown-|base-podium)/.test(p.name));
  for (const axis of [0, 1]) {
    const [lo, hi] = extent(axis), key = axis ? 'Z' : 'X';
    const parts = (list) => [Math.min(...list.map((p) => p.bounds[`min${key}`])), Math.max(...list.map((p) => p.bounds[`max${key}`]))];
    const [ilo, ihi] = parts(inner), [alo, ahi] = parts(kit.parts);
    assert.ok(ilo >= lo - 1.5 && ihi <= hi + 1.5, `the towers and podium within the mapped outline along ${key.toLowerCase()} (${ilo.toFixed(1)}..${ihi.toFixed(1)} in ${lo.toFixed(1)}..${hi.toFixed(1)})`);
    assert.ok(alo >= lo - 4 && ahi <= hi + 4, `everything within 4 m of it along ${key.toLowerCase()} (${alo.toFixed(1)}..${ahi.toFixed(1)})`);
  }
});

test('The Sail: each tower is a glass sail and a pale leaf, meeting at a seam', async () => {
  const { kit, at } = await siteModel('the-sail');
  const glass = kit.parts.filter((p) => /^bay-glass-/.test(p.name) && p.y0 >= 9), pale = kit.parts.find((p) => p.name === 'bay-pale');
  const parkGlass = kit.parts.filter((p) => /^park-glass-/.test(p.name) && p.y0 >= 9), parkPale = kit.parts.find((p) => p.name === 'park-pale');
  assert.ok(glass.length >= 20 && parkGlass.length >= 10, 'the glass leaves are lofted in many bands');
  assert.equal(new Set(glass.map((p) => p.material)).size, 1, 'one glass for the bay tower\'s sail');
  assert.notEqual(glass[0].material, pale.material, 'the bay tower\'s pale leaf is not its glass');
  assert.equal(parkGlass[0].material, glass[0].material, 'the same glass on both sails');
  assert.equal(parkPale.material, pale.material, 'and the same pale leaf on both towers');
  // the glass leaf to its roof at 229 m beside the tip; the pale leaves lower (their roofs sloping: the bay tower's
  // falling from 227 m at the seam, the park tower's rising to 209 m at it)
  const [gx, gz] = at(...SAIL.bayGlass);
  assert.ok(Math.abs(top(kit, gx, gz) - ROOF.bay) < 0.01, `the bay tower's glass leaf roof at ${top(kit, gx, gz)} m`);
  for (const [where, part, hi] of [['bayPale', pale, 227], ['parkPale', parkPale, 209]]) {
    const [x, z] = at(...SAIL[where]);
    assert.ok(solidOver(kit, x, z, 190, 198).includes(part), `${where}: the pale leaf stands there`);
    assert.ok(Math.abs(part.bounds.maxY - hi) < 0.01, `${where}: its roof's high side at ${part.bounds.maxY} m`);
  }
  // the white seam up the bay face from the ground to the pale leaf's roof, and the boom across it high up, on it
  const seam = kit.parts.find((p) => p.name === 'bay-seam'), boom = kit.parts.find((p) => p.name === 'bay-boom');
  assert.ok(seam.y0 === 0 && seam.y1 >= 227, `the seam from the ground to ${seam.y1} m`);
  assert.ok(boom.bounds.minY > 185 && boom.bounds.maxY < 200, 'the boom at about 192 m');
  const touches = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  assert.ok(touches(boom.bounds, seam.bounds), 'the boom rests on the seam');
});

test('The Sail: Marina Bay Tower\'s leading edge bows out over an open foot and rises into the 245 m tip', async () => {
  const { kit, at } = await siteModel('the-sail');
  const { colliders } = kit.finish();
  // the leading end's reach (the city's x is the grid toward Marina View, along the tower) at the foot, mid-height, top
  const reach = (y) => Math.max(...kit.parts.filter((p) => /^bay-glass-/.test(p.name) && p.y0 <= y && p.y1 >= y).map((p) => p.bounds.maxX));
  const [foot, mid, roof] = [reach(1), reach(120), reach(228)];
  assert.ok(mid - foot >= 4 && mid - roof >= 2, `bowed: ${foot.toFixed(1)} at the foot, ${mid.toFixed(1)} at 120 m, ${roof.toFixed(1)} at the roof`);
  const [x, z, wx, wz] = at(...SAIL.overhang);
  assert.equal(solidOver(kit, x, z, 0.5, 6.9).filter((p) => !/post/.test(p.name)).length, 0, 'open under the overhang');
  assert.ok(!colliderAt(colliders, wx, 3, wz), 'and free to walk into');
  assert.ok(solidOver(kit, x, z, 6.9, 7.5).some((p) => p.name === 'bay-skylight'), 'a glass skylight over it at 7 m');
  assert.ok(solidOver(kit, x, z, 119, 121).some((p) => /^bay-glass-/.test(p.name)), 'the bowed leaf over it at mid-height');
  assert.equal(solidOver(kit, x, z, 215, 300).length, 0, 'drawn back again near the top');
  // the tip: its point over the leading end, 16 m over the glass leaf's roof
  const tip = kit.parts.find((p) => p.name === 'crown-bay-tip');
  assert.ok(Math.abs(tip.y0 - ROOF.bay) < 0.01 && Math.abs(tip.bounds.maxY - ROOF.tip) < 0.01, `the tip from ${tip.y0} to ${tip.bounds.maxY} m`);
  assert.ok(tip.bounds.maxX >= roof - 0.5, `the tip reaches the leading edge at the roof (${tip.bounds.maxX.toFixed(1)}, ${roof.toFixed(1)})`);
  const [, , gx, gz] = at(...SAIL.bayGlass);
  assert.ok(colliderAt(colliders, gx, 120, gz) && colliderAt(colliders, gx, 228, gz), 'the glass leaf is solid to fly into');
});

test('The Sail: Central Park Tower\'s bow curves back above mid-height under a crown rising to a 215 m ridge at the seam', async () => {
  const { kit, at } = await siteModel('the-sail');
  const { colliders } = kit.finish();
  const [x, z, wx, wz] = at(...SAIL.bowEnd);
  assert.ok(solidOver(kit, x, z, 99, 101).length >= 1, 'the bow full at 100 m');
  assert.ok(colliderAt(colliders, wx, 60, wz), 'and solid there');
  assert.equal(solidOver(kit, x, z, 160, 300).length, 0, 'curved back from its mapped end above 150 m');
  assert.ok(!colliderAt(colliders, wx, 180, wz), 'and free to fly by there');
  const crown = kit.parts.find((p) => p.name === 'crown-park');
  assert.ok(Math.abs(crown.y0 - 203) < 0.01 && Math.abs(crown.bounds.maxY - ROOF.ridge) < 0.01, `the crown from ${crown.y0} to ${crown.bounds.maxY} m`);
  // the ridge stands over the seam, toward the pale leaf (the city's z is across the grid, toward the park)
  const pale = kit.parts.find((p) => p.name === 'park-pale');
  assert.ok(Math.abs(crown.bounds.maxZ - pale.bounds.minZ) < 0.05, 'the crown\'s high side on the seam');
  const [px, pz] = at(...SAIL.parkPale);
  assert.ok(top(kit, px, pz) < ROOF.ridge - 4, 'the pale leaf\'s roof lower than the ridge');
});

test('The Sail: the plaza, the gap between the towers and the drive under the bridge stay open; the deck is solid', async () => {
  const { kit, at } = await siteModel('the-sail');
  const { colliders } = kit.finish();
  for (const where of ['plaza', 'gap', 'plazaEdge']) {
    const [x, z, wx, wz] = at(...SAIL[where]);
    assert.equal(solidOver(kit, x, z, 0.5, 400).length, 0, `${where}: open to the sky`);
    for (const y of [1.5, 26, 120]) assert.ok(!colliderAt(colliders, wx, y, wz), `${where}: free at ${y} m`);
    assert.ok(builtOver(kit, x, z, 0, 0.5).some((p) => p.name === 'base-plaza' && p.y1 >= 0.3), `${where}: paved above the city's lawn`);
  }
  const [bx, bz, bwx, bwz] = at(...SAIL.bridge);
  assert.equal(solidOver(kit, bx, bz, 0.5, 24.2).length, 0, 'the drive open under the bridge');
  assert.ok(!colliderAt(colliders, bwx, 12, bwz), 'and free to drive through');
  assert.ok(solidOver(kit, bx, bz, 24.3, 28.4).length >= 2 && colliderAt(colliders, bwx, 26, bwz), 'the bridge solid at 24–28 m');
  const [dx, dz, dwx, dwz] = at(...SAIL.deck);
  assert.ok(Math.abs(top(kit, dx, dz) - ROOF.podium - 0.16) < 0.01, `the courts on the deck at 25 m (${top(kit, dx, dz)})`);
  assert.ok(colliderAt(colliders, dwx, 12, dwz) && colliderAt(colliders, dwx, 24, dwz), 'the podium solid to the deck');
  const names = kit.parts.map((p) => p.name);
  assert.ok(names.filter((n) => /^base-deck-pool-/.test(n)).length === 3, 'three pools on the deck');
  assert.ok(names.filter((n) => /^base-deck-court-/.test(n)).length === 2, 'two tennis courts');
  assert.ok(names.filter((n) => /palm-crown$/.test(n)).length >= 12, 'palms along the pools');
});

test('The Sail: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('the-sail');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the bridge on the podium and on the bay tower's wall; the wing on its posts
  const bridge = kit.parts.find((p) => p.name === 'base-bridge-floor'), podium = kit.parts.find((p) => p.name === 'base-podium');
  const tower = kit.parts.filter((p) => /^bay-glass-|^bay-pale/.test(p.name));
  assert.ok(overlap(bridge.bounds, podium.bounds) && tower.some((t) => overlap(bridge.bounds, t.bounds) && t.y0 <= 24.3 && t.y1 >= 25), 'the bridge stands on its ends');
  const wing = kit.parts.find((p) => p.name === 'base-wing'), posts = kit.parts.filter((p) => /^base-wing-post-/.test(p.name));
  assert.ok(posts.length >= 3 && posts.every((p) => Math.abs(p.y0 - ROOF.podium) < 0.01 && p.y1 >= wing.y0), 'the wing on posts from the deck');
});

test('The Sail stays finite, batched, sign-free and free of flicker', async () => {
  const { kit } = await siteModel('the-sail');
  assert.ok(kit.triangles > 3000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  assert.equal(kit.parts.filter((p) => p.type === 'sign').length, 0, 'no signs: the towers carry none');
  assert.ok(footprints.some((f) => f.h >= 228) && footprints.some((f) => f.h >= 200 && f.h < 215), 'the map has both towers at their heights');
});
