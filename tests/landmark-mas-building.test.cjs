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

// --- MAS Building (SG-090) ------------------------------------------------------------------------------------------------
// The Monetary Authority of Singapore's headquarters at 10 Shenton Way (RSP Architects Planners & Engineers, 1985): a
// sheer slab of terracotta tiles 46 by 66 m and 138 m tall. Its short faces (toward Prince Edward Road and Parsi Road,
// north-east and south-west) are frames of tiled piers round bays of close vertical louvres, with three slats under the
// crown band; its long faces (toward Springleaf Tower and Shenton Way, north-west and south-east) are deep louvred
// recesses between solid tiled ends, the crown band carried over them on a lattice. Round its foot on Parsi Road and
// Shenton Way a four-storey podium of polished granite with rounded corners and a tall portal on Shenton Way; toward
// Prince Edward Road the porte-cochère over the drop-off with the MAS crest and name; toward Springleaf Tower a low annex
// and a covered drive.

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}
// how far (x, z) lies outside a ring (0 inside)
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
  return { kit, L, info, at, ms, site: siteOf(L) };
}
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs and beams aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
const topAt = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0.5, 400).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 172915371 the tower part, 439006507 the podium strip, 43755573 the
// outline), in metres on the tower part's own axes (u toward Shenton Way, bearing 130.8°; v toward Prince Edward Road,
// 40.8°) from its middle, turned into lon/lat. The crown is 46 by 66 m in the aerial against the part's 49.7 by 71.2 m, so
// it stands about 2 m inside the part's sides; the probes' depths are measured from those sides:
//   middle (0, 0); nwRecess (-22, -10) and seRecess (22, -10), 2.9 m inside the north-west and south-east sides near their
//   middles (in the louvred recesses, under the crown's overhang); nwStrip (-22, 27) and seStrip (22, 27), the same
//   depths near the north and east corners (the solid tiled ends); swBay (-15, -32.5) and neBay (-12, 32.5) in the frame
//   faces' bays toward Parsi Road and Prince Edward Road (0.5 m in front of their louvres, 3 m inside the part's sides),
//   swPilaster (-8.7, -32.5) in the outer pier of the Parsi Road face's middle group and swSlats (-15, -32.2) in that
//   face's bay under the slats; wCorner (-21.9, -31.9) and sCorner (21.9, -31.9) in the Parsi Road face's end frames at
//   the west and south corners; sePodium (28, -24), portal (29.8, -18.5) and podiumOver (28, 12) in the mapped podium
//   strip along Shenton Way; drive (-21, -38) in the strip along Parsi Road where the covered service road (way
//   47345218) crosses it, nwDrive (-20, -20) beside the tower on that road; porch (0, 44) on the covered drop-off drive
//   (way 543397711) in the outline's north-east wing, porchOut (0, 54) past it; annex (-31.7, 10) in the outline's
//   north-west wing; springleafGap (-44, 10) between it and Springleaf Tower; eForecourt (28, 28) on the forecourt beside
//   the tower's east corner; roofRim (-22.2, 0) and roofDeck (-8, -6)
const MAS = {
  middle: [103.8466540, 1.2746668], nwRecess: [103.8464456, 1.2747283], seRecess: [103.8467449, 1.2744683],
  nwStrip: [103.8466629, 1.2749816], seStrip: [103.8469621, 1.2747216], swBay: [103.8463611, 1.2745329],
  swPilaster: [103.8464040, 1.2744957], swSlats: [103.8463629, 1.2745350], neBay: [103.8467632, 1.2749602],
  wCorner: [103.8463177, 1.2745778], sCorner: [103.8466157, 1.2743190], sePodium: [103.8467035, 1.2743370],
  portal: [103.8467481, 1.2743640], podiumOver: [103.8469149, 1.2745835], drive: [103.8462880, 1.2745307],
  nwDrive: [103.8464005, 1.2746480], porch: [103.8469123, 1.2749680], porchOut: [103.8469710, 1.2750364],
  annex: [103.8464971, 1.2749225], springleafGap: [103.8464134, 1.2749952], eForecourt: [103.8470088, 1.2746930],
  roofRim: [103.8465030, 1.2747979], roofDeck: [103.8465643, 1.2746730]
};
const IDS = [43755573, 172915371, 439006507];
// heights (m): the roof's parapet (the documented 138 m), the crown band's foot, the podium's roof, its portal's head,
// the porte-cochère's block over the drive
const TOP = 138, CROWN = 129, PODIUM = 19.5, PORTAL = 13, PORCH = [7, 19.5];

test('MAS Building replaces its outline, tower part and podium strip, and nothing else', async () => {
  const { L, info } = await siteModel('mas-building');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), IDS);
  assert.equal(info.name, 'MAS Building');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const [id, name] of [[47345217, 'Springleaf Tower'], [172915354, 'Springleaf Tower\'s round tower'], [172915357, 'Springleaf Tower\'s slab'],
    [172097381, 'Lumiere'], [447362688, 'EON Shenton']]) assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
});

test('MAS Building builds on its anchor to its documented 138 m, within its mapped outline, in a moment', async () => {
  const { kit, info, ms, site } = await siteModel('mas-building');
  assert.equal(info.height, TOP);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - TOP) <= 0.05, `${b.maxY} m tall, ${TOP} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = site.parts.find((p) => p.id === 43755573).ring;
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const pts = p.type === 'beam' ? [[p.bounds.minX, p.bounds.minZ], [p.bounds.maxX, p.bounds.maxZ]] : p.ring;
    for (const [x, z] of pts) assert.ok(outside(outline, x, z) <= 0.5, `${p.name} within the outline (${outside(outline, x, z).toFixed(2)} m out)`);
  }
  // the tower itself (everything over the podium) within the mapped tower part
  const tower = site.parts.find((p) => p.id === 172915371).ring;
  for (const p of kit.parts.filter((q) => q.type !== 'sign' && q.y1 > 25)) for (const [x, z] of p.ring) assert.ok(outside(tower, x, z) <= 0.2, `${p.name} within the tower part`);
});

test('MAS Building: a sheer slab to a flat roof at 138 m, solid through, its roof a parapet round a deck of plant', async () => {
  const { kit, at } = await siteModel('mas-building');
  const { colliders } = kit.finish();
  const [, , mx, mz] = at(...MAS.middle);
  for (const y of [2, 30, 80, 125, 131]) assert.ok(colliderAt(colliders, mx, y, mz), `solid at ${y} m`);
  assert.ok(!colliderAt(colliders, mx, TOP + 1, mz), 'nothing over the roof');
  const [rx, rz] = at(...MAS.roofRim), [dx, dz] = at(...MAS.roofDeck);
  assert.ok(Math.abs(topAt(kit, rx, rz) - TOP) < 0.05, `the parapet at ${topAt(kit, rx, rz)} m`);
  const deck = topAt(kit, dx, dz);
  assert.ok(deck > CROWN + 3 && deck < TOP - 0.5, `the deck and its plant below the parapet (${deck} m)`);
  // the crown: one band round all four faces from 129 m, under the parapet, 46 by 66 m on the mapped axes
  const crown = kit.parts.find((p) => p.name === 'tower-crown');
  assert.ok(crown && Math.abs(crown.y0 - CROWN) < 0.01, 'the crown band from 129 m');
  const [ux, uz] = kit.compass(130.8), [vx, vz] = kit.compass(40.8);
  const span = (d) => { const t = crown.ring.map(([x, z]) => x * d[0] + z * d[1]); return Math.max(...t) - Math.min(...t); };
  assert.ok(Math.abs(span([ux, uz]) - 46) < 0.3 && Math.abs(span([vx, vz]) - 66) < 0.3, `the crown ${span([ux, uz]).toFixed(1)} by ${span([vx, vz]).toFixed(1)} m`);
});

test('MAS Building: the long faces are deep louvred recesses between solid tiled ends, the crown carried over them on a lattice', async () => {
  const { kit, at } = await siteModel('mas-building');
  const { colliders } = kit.finish();
  for (const where of ['nwRecess', 'seRecess']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.equal(builtOver(kit, x, z, PODIUM + 1, 124).length, 0, `${where}: open in front of the louvres`);
    for (const y of [40, 100]) assert.ok(!colliderAt(colliders, wx, y, wz), `${where}: free at ${y} m`);
    assert.ok(builtOver(kit, x, z, 130, 134).some((p) => p.name === 'tower-crown'), `${where}: the crown band over it`);
    assert.ok(colliderAt(colliders, wx, 132, wz), `${where}: the overhang is solid`);
  }
  for (const where of ['nwStrip', 'seStrip']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.ok(builtOver(kit, x, z, 60, 61).some((p) => /-strip$/.test(p.name)), `${where}: the solid tiled end`);
    assert.ok(colliderAt(colliders, wx, 60, wz), `${where}: solid`);
  }
  // the recesses' other ends: the Parsi Road face's end frames, flush with the crown (the west one over the drive)
  for (const where of ['wCorner', 'sCorner']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.ok(builtOver(kit, x, z, 60, 61).some((p) => /^tower-sw-frame-/.test(p.name)) && colliderAt(colliders, wx, 60, wz), `${where}: the end frame`);
  }
  // the lattice under the band along each recess' outer edge
  for (const face of ['nw', 'se']) {
    const posts = kit.parts.filter((p) => new RegExp(`^tower-lattice-post-${face}-`).test(p.name));
    assert.ok(posts.length >= 12, `${face}: ${posts.length} lattice posts`);
    assert.ok(posts.every((p) => p.y0 >= 123.5 && p.y1 <= CROWN + 0.01), `${face}: the lattice under the band`);
    assert.ok(kit.parts.some((p) => p.name === `tower-lattice-chord-${face}`), `${face}: its chord`);
  }
});

test('MAS Building: the short faces are frames of piers round louvred bays, three slats under the crown', async () => {
  const { kit, at } = await siteModel('mas-building');
  const { colliders } = kit.finish();
  for (const where of ['swBay', 'neBay']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.equal(builtOver(kit, x, z, PODIUM + 1, 110).length, 0, `${where}: the louvres stand back of the piers`);
    assert.ok(!colliderAt(colliders, wx, 60, wz), `${where}: free in front of them`);
    assert.ok(builtOver(kit, x, z, 129, 131).some((p) => p.name === 'tower-crown'), `${where}: the crown band, flush with the piers, over the bay`);
  }
  const [px, pz, pwx, pwz] = at(...MAS.swPilaster);
  assert.ok(builtOver(kit, px, pz, 60, 61).some((p) => /^tower-sw-pier-/.test(p.name)) && colliderAt(colliders, pwx, 60, pwz), 'a pier of the middle group');
  for (const face of ['sw', 'ne']) {
    const piers = kit.parts.filter((p) => new RegExp(`^tower-${face}-pier-`).test(p.name));
    assert.equal(piers.length, 4, `${face}: four piers in the middle group`);
    assert.ok(piers.every((p) => p.y0 <= 0.01 && Math.abs(p.y1 - 116.4) < 0.01), `${face}: from the ground to the lowest slat`);
    assert.equal(kit.parts.filter((p) => new RegExp(`^tower-${face}-slat-`).test(p.name)).length, 3, `${face}: three slats`);
  }
  // under the crown: three slats with dark gaps between them, the band over them
  const [sx, sz] = at(...MAS.swSlats);
  for (const y of [117.5, 121.5, 125.5, 131]) assert.ok(builtOver(kit, sx, sz, y - 0.05, y + 0.05).length, `a slat (or the band) at ${y} m`);
  for (const y of [119.5, 123.3, 128]) assert.equal(builtOver(kit, sx, sz, y - 0.05, y + 0.05).length, 0, `a gap at ${y} m`);
  assert.equal(builtOver(kit, sx, sz, 40, 110).length, 0, 'the louvres behind it below');
});

test('MAS Building: the granite podium along Parsi Road and Shenton Way, its portal, the covered drive under its west end', async () => {
  const { kit, at } = await siteModel('mas-building');
  const { colliders } = kit.finish();
  for (const where of ['sePodium', 'podiumOver']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.ok(Math.abs(topAt(kit, x, z) - PODIUM) < 1.2, `${where}: the podium's roof at ${topAt(kit, x, z)} m`);
    assert.equal(builtOver(kit, x, z, PODIUM + 1.5, 400).length, 0, `${where}: open over the podium`);
    assert.ok(colliderAt(colliders, wx, 10, wz) && !colliderAt(colliders, wx, PODIUM + 3, wz), `${where}: solid to its roof`);
  }
  const [cx, cz, cwx, cwz] = at(...MAS.portal);
  assert.equal(builtOver(kit, cx, cz, 0.5, PORTAL - 0.5).length, 0, 'the portal is open');
  assert.ok(!colliderAt(colliders, cwx, 2, cwz) && colliderAt(colliders, cwx, 16, cwz), 'walk in under it, the podium over it');
  for (const where of ['drive', 'nwDrive']) {
    const [x, z, wx, wz] = at(...MAS[where]);
    assert.equal(builtOver(kit, x, z, 0.5, 6.5).length, 0, `${where}: the covered drive is open`);
    assert.ok(!colliderAt(colliders, wx, 3, wz), `${where}: free to drive`);
    assert.ok(colliderAt(colliders, wx, 12, wz) && builtOver(kit, x, z, 7, 12).length, `${where}: covered over`);
  }
  // the podium's corners on Shenton Way and Parsi Road are rounded
  const podium = kit.parts.find((p) => p.name === 'podium');
  assert.ok(podium && podium.ring.length >= 20, 'the podium ring with its rounded corners');
  assert.ok(kit.parts.find((p) => p.name === 'podium-west-bridge').ring.length >= 8, 'the west end rounded too');
});

test('MAS Building: the porte-cochère over the drop-off, the annex toward Springleaf Tower, the open ground round them', async () => {
  const { kit, at } = await siteModel('mas-building');
  const { colliders } = kit.finish();
  const [x, z, wx, wz] = at(...MAS.porch);
  assert.equal(builtOver(kit, x, z, 0.5, PORCH[0] - 0.1).length, 0, 'open under the porte-cochère');
  assert.ok(builtOver(kit, x, z, PORCH[0], PORCH[1]).some((p) => p.name === 'porch-canopy'), 'its block over the drive');
  assert.ok(!colliderAt(colliders, wx, 3, wz) && colliderAt(colliders, wx, 12, wz), 'drive under, solid over');
  assert.ok(kit.parts.filter((p) => /^porch-column-/.test(p.name)).length >= 2, 'on columns');
  const [ax, az, awx, awz] = at(...MAS.annex);
  const annex = topAt(kit, ax, az);
  assert.ok(annex > 4 && annex < 9, `the low annex (${annex} m)`);
  assert.ok(colliderAt(colliders, awx, 2, awz) && !colliderAt(colliders, awx, 12, awz), 'the annex is solid, low');
  for (const where of ['porchOut', 'springleafGap', 'eForecourt']) {
    const [ox, oz, owx, owz] = at(...MAS[where]);
    assert.equal(builtOver(kit, ox, oz, 0.5, 400).length, 0, `${where}: open`);
    for (const y of [2, 30]) assert.ok(!colliderAt(colliders, owx, y, owz), `${where}: free at ${y} m`);
  }
  // the outline's ground is paved above the city's lawn
  for (const where of ['porch', 'drive', 'nwDrive', 'portal']) {
    const [px, pz] = at(...MAS[where]);
    assert.ok(kit.parts.some((p) => p.name === 'base-paving' && p.y1 >= 0.3 && covers(p.ring, px, pz)), `${where}: paved`);
  }
});

test('MAS Building: nothing floats — every raised piece rests on something under it, or hangs from the crown', async () => {
  const { kit } = await siteModel('mas-building');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  const crown = parts.find((p) => p.name === 'tower-crown');
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    // the crown's lattice hangs from the band: a post's top against the band's underside, the chord on the posts
    const lattice = /^tower-lattice-/.test(p.name) && (Math.abs(p.bounds.maxY - crown.bounds.minY) < 0.01 && overlap(p.bounds, crown.bounds)
      || parts.some((q) => /^tower-lattice-post/.test(q.name) && q.bounds.minY < p.bounds.maxY && q.bounds.maxY > p.bounds.maxY && overlap(p.bounds, q.bounds)));
    assert.ok(under || lattice, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the crown on the tower, the parapet on the crown
  for (const p of parts.filter((q) => /^tower-rim-/.test(q.name))) assert.ok(Math.abs(p.y0 - crown.y1) < 0.01, `${p.name} on the crown`);
});

test('MAS Building: its crest and name hang on the porte-cochère toward Shenton Way, nothing on the tower', async () => {
  const { kit } = await siteModel('mas-building');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1);
  const s = signs[0];
  assert.equal(s.logo, 'mas');
  assert.ok(s.y0 > PORCH[0] + 1 && s.y1 < PORCH[1], `on the porte-cochère over the drive (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
  const [dx, dz] = kit.compass(130.8);
  const [a, b] = s.ring, nx = b[1] - a[1], nz = -(b[0] - a[0]);
  assert.ok(Math.abs(nx * dx + nz * dz) / Math.hypot(nx, nz) > 0.99, 'facing Shenton Way');
  const [mx, mz] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  const host = solids.filter((p) => p.name === 'porch-canopy' && p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 0.6 && w.y0 <= s.y0 && w.y1 >= s.y1 && w.nx * dx + w.nz * dz > 0.99));
  assert.ok(host.length, 'hung on the porte-cochère\'s wall, which stands behind all of it');
  assert.ok(s.y1 <= host[0].y1 - 1, 'under its top');
  const wide = Math.hypot(b[0] - a[0], b[1] - a[1]);
  assert.ok(wide >= 2.5 && wide <= 6, `a plausible size (${wide.toFixed(1)} m wide)`);
});

test('MAS Building stays finite, batched and free of flicker; solid where built', async () => {
  const { kit, at } = await siteModel('mas-building');
  assert.ok(kit.triangles > 1000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...MAS[where]); return colliderAt(colliders, x, y, z); };
  for (const y of [1.5, 12, 60, 120, 135]) assert.ok(solidAt('middle', y), `the tower is solid at ${y} m`);
  assert.ok(footprints.some((f) => f.h >= TOP - 0.5), 'the map has the tower at its height');
});
