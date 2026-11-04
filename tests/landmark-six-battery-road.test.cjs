const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// The landmark model programs (js/landmark-models/<model>.js) built against the kit (js/landmark-kit.js) on their
// real anchors (GEO.landmarks of js/singapore-geodata.js, tools/city/build.mjs).

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

// --- Six Battery Road (SG-007) ------------------------------------------------------------------------------------------
// The former Standard Chartered Bank Building (1984): a sheer hexagonal tower of brown granite with window groups,
// 44 floors to a flat roof at 174 m, its long faces west and east, its narrow ends on the river and on Battery Road;
// west of it the podium re-clad in 2022 in faceted translucent glass on both frontages over a recessed glazed ground
// floor, with a garden on its roof; lower granite blocks in the wedges between the tower and the Bank of China.

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
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 106193384, 172916311), as east/north metres from the tower part's
// north-west node turned into lon/lat: the tower's middle; 1.5 m in from the outline's Battery Road edge halfway between
// the tower and Bonham Street (under the glass skin's overhang), 1 m in (the skin's top at the front) and 3 m out on the
// pavement; 6 m along the river edge from the tower and 2 m in (the linkway's door); 3 m out on the promenade; the
// middle of the podium's roof; the middles of the wedges east and north-east of the tower; 4 m along the river edge from
// Bonham Street and 2 m in (the riverside pavilion)
const SBR = {
  tower: [103.851909, 1.2855376], batteryUnder: [103.8516758, 1.2852016], batteryRim: [103.8516777, 1.2851975],
  batteryOut: [103.8516928, 1.2851648], riverEntrance: [103.8517513, 1.2856919], riverOut: [103.8516401, 1.28569],
  garden: [103.8516399, 1.2854154], eastBlock: [103.8521011, 1.28551], neBlock: [103.852023, 1.2858034],
  pavilion: [103.8515505, 1.2855987]
};
const IDS = [106193384, 172916311];
const ROOF = 174, PODIUM = 22.5, DECK = 19.5, SKIN = 7.2, RIVER_BLOCK = 19.75, EAST = 6.5;
// the tower's faces: outward bearings and lengths in the mapped plan (west, south-west, Battery Road, east, north-east, river)
const FACES = [[275, 45.4], [215, 11.35], [155, 22.7], [95, 45.4], [35, 11.35], [335, 22.7]];

test('Six Battery Road replaces its outline and its tower part, and nothing else', async () => {
  const { L, info } = await siteModel('six-battery-road');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), IDS);
  assert.equal(info.name, 'Six Battery Road');
  const tower = L.parts.find((p) => p.id === 106193384);
  assert.ok(tower.height === 174 && tower.levels === 42, 'the tower part is mapped at 174 m');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const [id, name] of [[46595418, 'Singapore Land Tower'], [106193386, 'Maybank Tower'], [106193390, 'Bank of China'],
    [172916312, 'Bank of China\'s tower'], [171999283, 'MYP Centre'], [46595384, 'HSBC']]) assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
});

test('Six Battery Road builds on its anchor to its documented 174 m, within its mapped outline, in a moment', async () => {
  const { kit, info, ms, site } = await siteModel('six-battery-road');
  assert.equal(info.height, ROOF);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - ROOF) <= 0.5, `${b.maxY} m tall, ${ROOF} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  // within the outline, the skin's folds up to 1.5 m proud of it over the pavements
  const outline = site.parts.find((p) => p.id === 172916311).ring;
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const pts = p.type === 'beam' ? [[p.bounds.minX, p.bounds.minZ], [p.bounds.maxX, p.bounds.maxZ]] : p.ring;
    for (const [x, z] of pts) assert.ok(outside(outline, x, z) <= 1.5, `${p.name} within the outline (${outside(outline, x, z).toFixed(2)} m out)`);
  }
});

test('Six Battery Road: the tower rises sheer on its mapped hexagon from the ground to the roof at 174 m', async () => {
  const { kit, at, site } = await siteModel('six-battery-road');
  const mapped = site.parts.find((p) => p.id === 106193384).ring;
  // the mapped plan is a hexagon with every corner at 120°: long faces west and east, its ends at an angle
  mapped.forEach((p, i) => {
    const a = mapped[(i + mapped.length - 1) % mapped.length], c = mapped[(i + 1) % mapped.length];
    const u = [a[0] - p[0], a[1] - p[1]], v = [c[0] - p[0], c[1] - p[1]];
    const deg = (Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180) / Math.PI;
    assert.ok(Math.abs(deg - 120) < 4, `the mapped corner ${i} is ${deg.toFixed(1)}°`);
  });
  // the tower's stacked pieces, unbroken from the ground to the roof, each on the same hexagon: no setbacks
  const pieces = kit.parts.filter((p) => /^tower-(base|low|blank|shaft|crown)$/.test(p.name)).sort((a, b) => a.y0 - b.y0);
  assert.deepEqual(Array.from(pieces, (p) => p.name), ['tower-base', 'tower-low', 'tower-blank', 'tower-shaft', 'tower-crown']);
  assert.ok(pieces[0].y0 === 0 && pieces.every((p, k) => k === 0 || Math.abs(p.y0 - pieces[k - 1].y1) < 0.01), 'one unbroken stack');
  const reach = (ring, deg) => { const [dx, dz] = kit.compass(deg); return Math.max(...ring.map(([x, z]) => x * dx + z * dz)); };
  for (const p of pieces.slice(1)) {
    for (const [deg] of FACES) assert.ok(Math.abs(reach(p.ring, deg) - reach(mapped, deg)) < 0.8, `${p.name}'s face toward ${deg}° on the mapped one (${(reach(p.ring, deg) - reach(mapped, deg)).toFixed(2)} m)`);
  }
  // its six faces at their mapped lengths (4 : 1 : 2 of an 11.35 m bay), the crown's ring a plain hexagon
  const crown = pieces.at(-1).ring;
  assert.equal(crown.length, 6);
  const lengths = crown.map((p, i) => Math.hypot(crown[(i + 1) % 6][0] - p[0], crown[(i + 1) % 6][1] - p[1])).sort((a, b) => a - b);
  assert.deepEqual(lengths.map((l) => Math.round(l / 11.35)), [1, 1, 2, 2, 4, 4]);
  assert.ok(lengths.every((l) => Math.abs(l / 11.35 - Math.round(l / 11.35)) < 0.02), `sides ${lengths.map((l) => l.toFixed(2))}`);
  // the window rows (42 office floors of 3.95 m) end under a plain granite crown of two plant floors, about 9 m
  const shaft = pieces.find((p) => p.name === 'tower-shaft'), crownPiece = pieces.at(-1);
  assert.ok(crownPiece.y1 - shaft.y1 > 7.5 && crownPiece.y1 - shaft.y1 < 10, `the crown band from ${shaft.y1} to ${crownPiece.y1} m`);
  // the flat roof over the middle, the parapet at 174 m
  const [tx, tz] = at(...SBR.tower);
  const roofTop = top(kit, tx, tz);
  assert.ok(roofTop > 173 && roofTop <= ROOF, `the roof over the middle at ${roofTop} m`);
  assert.ok(kit.parts.some((p) => /^tower-parapet-/.test(p.name) && Math.abs(p.y1 - ROOF) < 0.01), 'the parapet at 174 m');
});

test('Six Battery Road: the glass podium over its recessed ground floor, its roof garden, the lower granite blocks', async () => {
  const { kit, at } = await siteModel('six-battery-road');
  // on Battery Road: open under the skin's overhang, paved above the city's lawn; the skin over it from 7.2 m
  const [ux, uz] = at(...SBR.batteryUnder);
  assert.equal(builtOver(kit, ux, uz, 0.5, SKIN - 0.3).length, 0, 'open under the skin');
  assert.ok(builtOver(kit, ux, uz, 0, 0.5).some((p) => p.y1 >= 0.3), 'paved above the lawn');
  assert.ok(builtOver(kit, ux, uz, SKIN + 0.3, 20).some((p) => /^skin-/.test(p.name)), 'the skin over the walk');
  // the skin is folded: its lofts' outer points move in and out between their foot and their top (the lower rows,
  // with level tops; the upper ones slope to the garden)
  const skins = kit.parts.filter((p) => /^skin-/.test(p.name) && p.type === 'loft');
  assert.ok(skins.length >= 6, `${skins.length} skin lofts`);
  const folded = skins.filter((p) => p.caps.length && p.ring.some(([x, z], i) => Math.hypot(x - p.caps[0].ring[i][0], z - p.caps[0].ring[i][1]) > 0.3));
  assert.ok(folded.length >= 4, 'facets: the top rings are not the feet moved up');
  // on the river: the linkway's door under the raised skin
  const [ex, ez] = at(...SBR.riverEntrance);
  assert.equal(builtOver(kit, ex, ez, 0.5, 8).length, 0, 'the river door is open up to 8 m');
  assert.ok(builtOver(kit, ex, ez, 9, 20).some((p) => /^skin-/.test(p.name)), 'with the skin over it');
  // the roof: the skin's rim high at the front, the garden's deck lower in the middle with planted beds and trees
  const [rx, rz] = at(...SBR.batteryRim), [gx, gz] = at(...SBR.garden);
  assert.ok(top(kit, rx, rz) > 21.5 && top(kit, rx, rz) <= PODIUM + 0.01, `the rim at ${top(kit, rx, rz)} m`);
  assert.ok(Math.abs(top(kit, gx, gz) - DECK) < 1.2, `the garden at ${top(kit, gx, gz)} m`);
  assert.ok(kit.parts.filter((p) => /^roof-garden-.*tree-crown$/.test(p.name)).length >= 4, 'trees on the roof');
  // the wedges between the tower and the Bank of China: the low glazed block on Battery Road, the five-storey one on the river
  const [bx, bz] = at(...SBR.eastBlock), [nx, nz] = at(...SBR.neBlock);
  const mass = (x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).filter((p) => !/tree|trunk|planter/.test(p.name)).map((p) => p.y1));
  assert.ok(Math.abs(mass(bx, bz) - EAST) < 1.2, `the east block at ${mass(bx, bz)} m`);
  assert.ok(Math.abs(mass(nx, nz) - RIVER_BLOCK) < 1.2, `the river block at ${mass(nx, nz)} m`);
  // the riverside pavilion: low, under the skin's raised edge
  const [px, pz] = at(...SBR.pavilion);
  const pav = builtOver(kit, px, pz, 0.5, 6).filter((p) => /^pavilion-/.test(p.name));
  assert.ok(pav.length && Math.max(...pav.map((p) => p.y1)) < 4.5, 'the pavilion under 4.5 m');
  // the podium stays under the tower's lowest window rows
  for (const p of kit.parts.filter((q) => /^(skin|podium|roof-garden|east|ne|pavilion)-/.test(q.name) && !/tree|trunk/.test(q.name))) assert.ok(p.y1 <= PODIUM + 0.6, `${p.name} under ${PODIUM} m`);
});

test('Six Battery Road: open spaces stay open — under the skin, the river door, the pavements', async () => {
  const { kit, at } = await siteModel('six-battery-road');
  const { colliders } = kit.finish();
  const solidAt = (where, y) => { const [, , x, z] = at(...SBR[where]); return colliderAt(colliders, x, y, z); };
  for (const where of ['batteryUnder', 'riverEntrance']) {
    assert.ok(!solidAt(where, 2) && !solidAt(where, 5), `${where}: free to walk under`);
    assert.ok(solidAt(where, 15), `${where}: the skin is solid to fly into`);
  }
  for (const where of ['batteryOut', 'riverOut']) for (const y of [2, 60, 170]) assert.ok(!solidAt(where, y), `${where}: no invisible walls at ${y} m`);
  assert.ok(solidAt('garden', 10) && solidAt('garden', DECK - 0.3) && !solidAt('garden', DECK + 3), 'the podium solid under its garden, open over it');
});

test('Six Battery Road: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('six-battery-road');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the parapet on the crown, the crown on the shaft
  const crown = kit.parts.find((p) => p.name === 'tower-crown');
  for (const p of kit.parts.filter((q) => /^tower-parapet-/.test(q.name))) assert.ok(Math.abs(p.y0 - crown.y1) < 0.01, `${p.name} on the crown`);
});

test('Six Battery Road: Standard Chartered\'s mark hangs on the tower\'s walls over the river and over Battery Road, nothing on the crown', async () => {
  const { kit } = await siteModel('six-battery-road');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 2);
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  for (const [bearing, label] of [[335, 'the river'], [155, 'Battery Road']]) {
    const [dx, dz] = kit.compass(bearing);
    const s = signs.find((q) => { const [a, b] = q.ring; const nx = b[1] - a[1], nz = -(b[0] - a[0]); return Math.abs(nx * dx + nz * dz) / Math.hypot(nx, nz) > 0.99 && (q.bounds.minX + q.bounds.maxX) / 2 * dx + (q.bounds.minZ + q.bounds.maxZ) / 2 * dz > 0; });
    assert.ok(s, `a sign facing ${label}`);
    assert.equal(s.logo, 'standard-chartered');
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const host = solids.filter((p) => /^tower-/.test(p.name) && p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 0.6 && w.y0 <= s.y0 && w.y1 >= s.y1 && w.nx * dx + w.nz * dz > 0.99));
    assert.ok(host.length, `the mark facing ${label} on a tower wall that stands behind all of it`);
    assert.ok(s.y1 <= Math.max(...host.map((p) => p.y1)), 'under its wall\'s top');
    assert.ok(s.y0 > 14 && s.y1 < 21, `over the podium's floors (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
  }
});

test('Six Battery Road stays finite, batched and free of flicker; solid where built', async () => {
  const { kit, at } = await siteModel('six-battery-road');
  assert.ok(kit.triangles > 1000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...SBR[where]); return colliderAt(colliders, x, y, z); };
  for (const y of [1.5, 12, 18, 60, 120, 166, 173]) assert.ok(solidAt('tower', y), `the tower is solid at ${y} m`);
  assert.ok(solidAt('eastBlock', 5) && solidAt('neBlock', 15), 'the granite blocks are solid');
  assert.ok(footprints.some((f) => f.h >= 170), 'the map has the tower at its height');
});
