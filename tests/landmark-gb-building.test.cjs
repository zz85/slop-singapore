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

// GB Building (SG-075), 143 Cecil Street (Kenzo Tange / Tange Associates, 1985): a three-storey podium on the
// diagonal Cecil/McCallum site, the office slab floating over a recessed transfer level at its north-east end —
// two solid light-panel storeys, then twenty horizontally banded glass floors between blank white end walls.
// The 93 m top is an estimate from the photographed band count and office floor heights; the only published
// figure (240 ft) is marked unconfirmed by its source and cannot fit the storey count. See docs/gb-building.md.
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

async function gbBuilding() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'gb-building');
  assert.ok(L, 'GB Building has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/gb-building.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  return { kit, L, info, at, ms, outline: ring(504809533), tower: ring(326926543), podiumPart: ring(1566584725) };
}
// independently located points (lon, lat), from the OSM rings
const GB = {
  towerCentre: [103.848155, 1.278891], // the mapped tower part's centre
  podiumSW: [103.848001, 1.278651], // the mapped podium part's centre, clear of the tower
  streetNE: [103.84830, 1.27915] // past the tower's north-east end, on Cecil Street
};
const TOP = 93, PODIUM = 13, VOID = [13, 17.5], SOLID = [17.5, 24.5], GLASS = [24.5, 90.5];

test('GB Building replaces its outline, tower part and podium part, and nothing else', async () => {
  const { L, info } = await gbBuilding();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [326926543, 504809533, 1566584725]);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'gb-building');
  assert.deepEqual(registered.hide, [504809533, 326926543, 1566584725]);
  for (const [id, name] of [[172270395, 'Oxley Tower'], [1566584723, "Oxley Tower's podium part"], [1479526103, "Oxley Tower's glass part"],
    [172270399, 'Robinson Square'], [172270428, 'TAHIR Building'], [172024968, 'Tung Ann Association Building']])
    assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
  assert.equal(info.name, 'GB Building');
  assert.equal(info.height, TOP);
});

test('GB Building builds on its anchor to 93 m in a moment, within its mapped outline', async () => {
  const { kit, ms, at, outline, tower } = await gbBuilding();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - TOP) <= 0.1, `${b.maxY} m tall, ${TOP} modelled`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  for (const p of kit.parts.filter((q) => q.type !== 'sign' && q.type !== 'beam')) {
    for (const [x, z] of p.ring) assert.ok(outside(outline, x, z) <= 0.35, `${p.name} within the outline (${outside(outline, x, z).toFixed(2)} m out)`);
  }
  const [cx, cz] = at(...GB.towerCentre);
  assert.ok(covers(tower, cx, cz), 'the tower probe lies in the mapped tower part');
  assert.ok(Math.abs(top(kit, cx, cz) - TOP) <= 0.1, `the crown over the tower centre at ${top(kit, cx, cz)} m`);
});

test('GB Building: the podium at 13 m, the tower floating over its transfer void on a core', async () => {
  const { kit, at, outline, tower, L } = await gbBuilding();
  const { colliders } = kit.finish();
  const [px, pz, pwx, pwz] = at(...GB.podiumSW);
  const podiumTop = top(kit, px, pz);
  assert.ok(podiumTop > PODIUM - 0.5 && podiumTop < PODIUM + 1.5, `the podium roof at ${podiumTop} m`);
  assert.equal(builtOver(kit, px, pz, PODIUM + 2, 400).length, 0, 'open over the podium-only stretch');
  assert.ok(colliderAt(colliders, pwx, 8, pwz) && !colliderAt(colliders, pwx, 30, pwz), 'the podium solid to its roof only');
  // the void: inside the tower ring near its north-west corner, away from the central core
  const c = tower.reduce((s, p) => [s[0] + p[0] / tower.length, s[1] + p[1] / tower.length], [0, 0]);
  const v = tower[0], vx = c[0] + (v[0] - c[0]) * 0.55, vz = c[1] + (v[1] - c[1]) * 0.55;
  assert.ok(covers(tower, vx, vz) && covers(outline, vx, vz), 'the void probe lies under the tower');
  assert.equal(builtOver(kit, vx, vz, VOID[0] + 0.4, VOID[1] - 0.3).length, 0, 'the transfer level is open there');
  assert.ok(!colliderAt(colliders, vx + L.x, 15.5, vz + L.z), 'and free to pass through');
  assert.ok(builtOver(kit, vx, vz, SOLID[0], SOLID[1]).some((p) => p.name === 'tower-solid'), 'the solid panel band over the void');
  assert.ok(colliderAt(colliders, vx + L.x, 21, vz + L.z), 'solid over the void');
  assert.ok(kit.parts.some((p) => p.name === 'void-core' && p.y0 <= VOID[0] + 0.1 && p.y1 >= VOID[1] - 0.1), 'a core carries the tower through the void');
  // the covered walkway along McCallum Street: inside the outline's south-east edge, clear of the lobby glass
  assert.ok(covers(outline, 10.4, 27.4), 'the walkway probe lies inside the outline');
  assert.equal(builtOver(kit, 10.4, 27.4, 0.6, 5).length, 0, 'the walkway is open at ground level');
  assert.ok(!colliderAt(colliders, 10.4 + L.x, 2, 27.4 + L.z) && colliderAt(colliders, 10.4 + L.x, 8, 27.4 + L.z), 'walk under the podium, which is solid above');
});

test('GB Building: the banded glass shaft between its blank end walls, its name low on the Cecil end', async () => {
  const { kit, at } = await gbBuilding();
  const { colliders } = kit.finish();
  const shaft = kit.parts.find((p) => p.name === 'tower-shaft');
  assert.ok(shaft && Math.abs(shaft.y0 - GLASS[0]) < 0.1 && Math.abs(shaft.y1 - GLASS[1]) < 0.1, 'the glass shaft over the solid band');
  const solid = kit.parts.find((p) => p.name === 'tower-solid');
  assert.ok(solid && Math.abs(solid.y0 - SOLID[0]) < 0.1 && Math.abs(solid.y1 - SOLID[1]) < 0.1, 'the two solid storeys at its foot');
  const crown = kit.parts.find((p) => p.name === 'tower-crown');
  assert.ok(crown && Math.abs(crown.y1 - TOP) < 0.1, 'the parapet crown at the top');
  const [, , wx, wz] = at(...GB.towerCentre);
  for (const y of [30, 60, 88]) assert.ok(colliderAt(colliders, wx, y, wz), `the tower solid at ${y} m`);
  assert.ok(!colliderAt(colliders, wx, TOP + 2, wz), 'nothing over the roof');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1, 'one small building name, no tenant signage');
  assert.ok(signs[0].y1 < 7, `the name low on the street corner (${signs[0].y0.toFixed(1)}-${signs[0].y1.toFixed(1)} m)`);
  const [sx, sz, swx, swz] = at(...GB.streetNE);
  assert.equal(builtOver(kit, sx, sz, 0.5, 400).length, 0, 'nothing built past the north-east end');
  assert.ok(!colliderAt(colliders, swx, 3, swz), 'Cecil Street stays open');
});

test('GB Building stays finite, batched and free of flicker', async () => {
  const { kit } = await gbBuilding();
  assert.ok(kit.triangles > 300 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  assert.ok(footprints.some((f) => f.h >= TOP - 0.5), 'the map has the tower at its height');
});
