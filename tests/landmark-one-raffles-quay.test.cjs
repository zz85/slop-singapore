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

// --- One Raffles Quay (SG-043) ------------------------------------------------------------------------------------------
// Two glass towers on one block: the 50-storey North Tower turned off the street grid, its front blade rising as the
// lantern to 245 m in slots past the side faces' parapet, over an eight-storey lobby; the 29-storey South Tower on the
// grid; between them the district cooling plant on columns over an open plaza and drop-off; a stone block on Marina
// Boulevard and a podium round the South Tower carrying Deutsche Bank's name.

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

const ID = { outline: 47345006, north: 172915345, south: 172915347, plant: 852006596 };
// Points read off the mapped rings and the photographs: in the covered plaza under the cooling plant and in the drop-off's
// lane under its east end; on the forecourt before the North Tower's lobby and south-west of the South Tower; in the air
// between the towers; inside each tower; inside the North Tower's front blade (the lantern) and on its roof deck behind
// the parapet; in the slot at the blade's north end; on the podium and the Marina Boulevard block
const ORQ = {
  plaza: [103.8518355, 1.2811899], dropOff: [103.8521011, 1.2810720], forecourt: [103.8520200, 1.2817984],
  southForecourt: [103.8514055, 1.2807666], between: [103.8518562, 1.2812408], north: [103.8521602, 1.2814768],
  lantern: [103.8520402, 1.2816304], northDeck: [103.8523454, 1.2816059], slotNorth: [103.8522533, 1.2817538],
  south: [103.8516755, 1.2808960], podium: [103.8516204, 1.2806006], block: [103.8524302, 1.2816062]
};
const H = { lantern: 245, northRoof: 232, northParapet: 236.5, southTop: 139.9, soffit: 12, plant: 40, glassBand: 44 };

test('One Raffles Quay replaces its outline, the two towers and the roof plant\'s part, and nothing else', async () => {
  const { L, info } = await siteModel('one-raffles-quay');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [ID.outline, ID.north, ID.south, ID.plant].sort((a, b) => a - b));
  assert.equal(info.name, 'One Raffles Quay');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  assert.deepEqual([...registered.hide].sort((a, b) => a - b), [ID.outline, ID.north, ID.south, ID.plant].sort((a, b) => a - b));
  // The Sail's podium across Marina View Link belongs to The Sail's own site; 6 Raffles Quay across Raffles Quay stays the
  // city's
  assert.ok(!registered.hide.includes(47345007), 'The Sail\'s podium is not part of this site');
  assert.ok(!config.landmarks.some((l) => (l.hide || []).includes(47345004)), '6 Raffles Quay stays the city\'s');
});

test('One Raffles Quay builds on its anchor to its documented 245 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('one-raffles-quay');
  assert.equal(info.height, 245);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = siteOf(L).parts.find((p) => p.id === ID.outline).ring;
  for (const axis of [0, 1]) {
    const values = outline.map((p) => p[axis]), [lo, hi] = axis ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    assert.ok(lo >= Math.min(...values) - 1.5 && hi <= Math.max(...values) + 1.5, `within the mapped outline along ${axis ? 'z' : 'x'} (${lo.toFixed(1)}..${hi.toFixed(1)})`);
  }
  // every part stands within the outline (the signs a hair off their walls)
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const [cx, cz] = [(p.bounds.minX + p.bounds.maxX) / 2, (p.bounds.minZ + p.bounds.maxZ) / 2];
    assert.ok(covers(outline, cx, cz), `${p.name} stands on the site`);
  }
});

test('One Raffles Quay: the North Tower is turned off the grid, its front blade rising as the lantern to 245 m past the side faces\' parapet', async () => {
  const { kit, L, at } = await siteModel('one-raffles-quay');
  const site = siteOf(L);
  const longest = (ring) => ring.map((a, i) => [a, ring[(i + 1) % ring.length]]).sort(([a, b], [c, d]) => Math.hypot(d[0] - c[0], d[1] - c[1]) - Math.hypot(b[0] - a[0], b[1] - a[1]))[0];
  const angle = ([a, b]) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const turn = Math.abs(((angle(longest(site.parts.find((p) => p.id === ID.north).ring)) - angle(longest(site.parts.find((p) => p.id === ID.south).ring))) * 180 / Math.PI) % 90);
  assert.ok(Math.min(turn, 90 - turn) > 20 && Math.min(turn, 90 - turn) < 32, `turned ${turn.toFixed(1)}° from the South Tower's grid`);
  const top = ([lon, lat], y0 = 0) => { const [x, z] = at(lon, lat); return Math.max(0, ...builtOver(kit, x, z, y0, 400).map((p) => p.y1)); };
  assert.equal(top(ORQ.lantern), H.lantern, 'the front blade reaches 245 m');
  const [dx, dz] = at(...ORQ.northDeck);
  assert.equal(builtOver(kit, dx, dz, H.northParapet + 0.5, 400).length, 0, 'nothing over the roof deck behind the parapet but the plant');
  assert.ok(builtOver(kit, dx, dz, H.northRoof - 1, H.northRoof).length >= 1, 'the roof deck under it');
  assert.ok(kit.parts.filter((p) => /^north-parapet-/.test(p.name)).every((p) => Math.abs(p.y1 - H.northParapet) < 0.01), 'the side faces\' parapet at 236.5 m');
  // the slot at the blade's north end: open the height of the shaft, the blade and the body built either side of it
  const [sx, sz] = at(...ORQ.slotNorth);
  assert.equal(builtOver(kit, sx, sz, 40, H.lantern + 1).length, 0, 'the slot is open');
  const tower = site.parts.find((p) => p.id === ID.north).ring;
  assert.ok(!covers(tower, sx, sz) && tower.some(([x, z]) => Math.hypot(x - sx, z - sz) < 3), 'beside the mapped tower, in its notch');
  // the eight-storey lobby over a recessed ground floor, just inside the front face
  const [nx, nz] = at(...ORQ.north);
  assert.ok(builtOver(kit, nx, nz, 1, 5).length >= 1 && builtOver(kit, nx, nz, 10, 37).length >= 1, 'the lobby and the ground floor under the tower');
  assert.ok(kit.parts.some((p) => p.name === 'north-lobby' && p.y0 === 6 && p.y1 === 38), 'the lobby eight storeys tall over a 6 m ground floor');
  assert.ok(kit.parts.some((p) => p.name === 'north-rake' && p.type === 'beam' && p.bounds.minY < 0.5 && p.bounds.maxY > 30), 'the white raking member across the lobby');
});

test('One Raffles Quay: the South Tower reaches its published 139.9 m, its plant kept under it', async () => {
  const { kit, at } = await siteModel('one-raffles-quay');
  const [x, z] = at(...ORQ.south);
  const over = builtOver(kit, x, z, 0, 400);
  assert.ok(Math.max(...over.map((p) => p.y1)) < H.southTop, 'the plant under the top');
  assert.ok(kit.parts.some((p) => p.name === 'south-lantern' && Math.abs(p.y1 - H.southTop) < 0.01), 'the blade to Raffles Quay to 139.9 m');
  assert.ok(kit.parts.filter((p) => /^south-pier-/.test(p.name)).length >= 10, 'stone piers under the glass');
  const low = kit.parts.find((p) => p.name === 'south-shaft-low');
  assert.ok(low && low.y0 === 10 && low.y1 === 56, 'the car-park storeys\' bands from 10 to 56 m');
});

test('One Raffles Quay: the cooling plant stands on columns over an open plaza and drop-off, the air between the towers open', async () => {
  const { kit, at } = await siteModel('one-raffles-quay');
  const { colliders } = kit.finish();
  for (const [what, where] of [['the plaza', ORQ.plaza], ['the drop-off', ORQ.dropOff]]) {
    const [x, z, wx, wz] = at(...where);
    assert.equal(builtOver(kit, x, z, 0.4, H.soffit - 0.1).length, 0, `${what} is open under the plant`);
    for (const y of [1.5, 6, 11]) assert.ok(!colliderAt(colliders, wx, y, wz), `${what}: free to walk at ${y} m`);
    const over = builtOver(kit, x, z, H.soffit, H.plant);
    assert.ok(over.some((p) => p.name === 'plant-block' && p.y0 === H.soffit && p.y1 === H.plant), `${what}: the louvred block over it`);
    assert.ok(colliderAt(colliders, wx, 25, wz) && colliderAt(colliders, wx, 42, wz), `${what}: solid above`);
  }
  assert.ok(kit.parts.filter((p) => /^plant-glass-/.test(p.name)).every((p) => p.y0 === H.plant && p.y1 === H.glassBand), 'the glass band to the mapped 44 m');
  assert.ok(kit.parts.filter((p) => /^plant-louvre-/.test(p.name)).length >= 150, 'the louvres\' staggered light edges');
  assert.ok(kit.parts.filter((p) => /^plaza-column-/.test(p.name)).length >= 6, 'on stone columns');
  const [bx, bz, wx, wz] = at(...ORQ.between);
  assert.equal(builtOver(kit, bx, bz, H.glassBand + 0.5, 400).length, 0, 'open between the towers over the plant');
  for (const y of [60, 130]) assert.ok(!colliderAt(colliders, wx, y, wz), `free to fly between the towers at ${y} m`);
});

test('One Raffles Quay: the forecourts stay open; the towers, the lantern, the podium and the block are solid', async () => {
  const { kit, at } = await siteModel('one-raffles-quay');
  const { colliders } = kit.finish();
  for (const [what, where] of [['the North Tower\'s forecourt', ORQ.forecourt], ['the South Tower\'s forecourt', ORQ.southForecourt]]) {
    const [x, z, wx, wz] = at(...where);
    const over = builtOver(kit, x, z, 0.4, 400);
    assert.equal(over.length, 0, `${what} is open (${over.map((p) => p.name)})`);
    assert.ok(builtOver(kit, x, z, 0, 0.4).some((p) => p.name === 'paving' && p.y1 >= 0.3), `${what}: paved above the city's lawn`);
    for (const y of [1.5, 20]) assert.ok(!colliderAt(colliders, wx, y, wz), `${what}: free at ${y} m`);
  }
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solidAt(ORQ.north, 3) && solidAt(ORQ.north, 20) && solidAt(ORQ.north, 150) && solidAt(ORQ.north, 231), 'the North Tower');
  assert.ok(solidAt(ORQ.lantern, 240) && !solidAt(ORQ.northDeck, 240), 'the lantern, and the open deck behind the parapet');
  assert.ok(solidAt(ORQ.south, 5) && solidAt(ORQ.south, 100) && solidAt(ORQ.south, 133), 'the South Tower');
  assert.ok(solidAt(ORQ.podium, 10) && !solidAt(ORQ.podium, 30), 'the podium to 22 m');
  assert.ok(solidAt(ORQ.block, 12), 'the Marina Boulevard block');
});

test('One Raffles Quay: nothing floats — every raised piece rests on or in something under it (a louvre\'s edge on its wall)', async () => {
  const { kit } = await siteModel('one-raffles-quay');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    const wall = /^plant-louvre-/.test(p.name) && parts.find((q) => q.name === 'plant-block' && q.bounds.minY <= p.bounds.minY && q.bounds.maxY >= p.bounds.maxY && overlap(p.bounds, q.bounds));
    assert.ok(under || wall, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the lantern on the shaft, the cooling plant on its columns, the canopies on columns and piers
  const find = (name) => kit.parts.find((p) => p.name === name);
  assert.equal(find('north-lantern').y0, find('north-shaft').y1);
  assert.ok(kit.parts.filter((p) => /^plaza-column-/.test(p.name)).every((p) => Math.abs(p.y1 - find('plant-block').y0) < 0.01), 'the columns carry the plant');
});

test('One Raffles Quay: its signs hang on walls under their rooflines — the name on the trough, Deutsche Bank\'s on the podium', async () => {
  const { kit } = await siteModel('one-raffles-quay');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.deepEqual(Array.from(signs, (s) => s.name).sort(), ['sign:deutsche-bank', 'sign:deutsche-bank-mark', 'sign:one-raffles-quay']);
  assert.ok(signs.every((s) => s.y1 < 25), 'none on the towers\' crowns');
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const host = solids.find((p) => p.walls.some((w) => {
      const t = mx * -w.nz + mz * w.nx;
      return Math.abs(mx * w.nx + mz * w.nz - w.off) < 0.5 && t >= w.a0 && t <= w.a1 && w.y0 <= s.y0 && w.y1 >= s.y1;
    }));
    assert.ok(host, `${s.name} on a wall that stands behind all of it`);
    assert.ok(s.y1 <= host.y1, `${s.name} under ${host.name}'s top`);
    assert.equal(host.name, s.name === 'sign:one-raffles-quay' ? 'plaza-trough' : 'podium');
  }
  // the mark right of the name, as one reads it from the street
  const name = signs.find((s) => s.name === 'sign:deutsche-bank'), mark = signs.find((s) => s.name === 'sign:deutsche-bank-mark');
  const [a, b] = name.ring, along = [b[0] - a[0], b[1] - a[1]], c = (r) => [(r[0][0] + r[1][0]) / 2, (r[0][1] + r[1][1]) / 2];
  const [nc, mc] = [c(name.ring), c(mark.ring)];
  assert.ok((mc[0] - nc[0]) * along[0] + (mc[1] - nc[1]) * along[1] > 0, 'the mark after the name');
  assert.equal(mark.logo, 'deutsche-bank');
});

test('One Raffles Quay stays finite, batched and free of flicker', async () => {
  const { kit } = await siteModel('one-raffles-quay');
  assert.ok(kit.triangles > 2000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  assert.ok(footprints.some((f) => f.h >= 230) && footprints.some((f) => f.h >= 130 && f.h < 140), 'the map has both towers at their heights');
});
