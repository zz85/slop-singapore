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

// Altez (SG-116): the 250 m residential shaft on its Enggor Street podium, its broad faces scattered with the
// projecting silver-framed bays of the photographs, under a pale glazed crown
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

async function altez() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'altez');
  assert.ok(L, 'Altez has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/altez.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  return { kit, L, info, at, ms, plot: ring(172023443), tower: ring(393100852) };
}
// independently located points (lon, lat), from the OSM rings
const AZ = {
  centre: [103.8443671, 1.2744913], // the centroid of the mapped tower part 393100852
  deckNorth: [103.84435, 1.27476], // the podium roof north of the tower, inside the plot ring
  street: [103.84410, 1.27455] // Enggor Street, west of the plot
};
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

test('Altez replaces its plot outline and tower part, and nothing else', async () => {
  const { L, info } = await altez();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [172023443, 393100852]);
  const tower = L.parts.find((p) => p.id === 393100852);
  assert.equal(tower.levels, 62);
  assert.equal(tower.height, 250);
  assert.equal(tower.minHeight, 10, 'the tower part starts over the mapped 10 m podium');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'altez');
  assert.deepEqual(registered.hide, [172023443, 393100852]);
  for (const id of [152598430, 325793750, 325793752, 172023451, 393100851])
    assert.ok(!registered.hide.includes(id), 'Icon Village, the Icon towers and Skysuites remain mapped buildings');
  assert.equal(info.name, 'Altez');
  assert.equal(info.height, 250);
});

test('Altez: built on its anchor to 250 m in a moment, on its mapped footprints', async () => {
  const { kit, ms, at, plot, tower } = await altez();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 250) <= 3, `${b.maxY} m tall, 250 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const [cx, cz] = at(...AZ.centre);
  assert.ok(covers(tower, cx, cz), 'the probe centre lies in the mapped tower ring');
  assert.ok(Math.abs(top(kit, cx, cz) - 250) <= 1, `the plant over the crown reaches 250 m (${top(kit, cx, cz)})`);
  const podium = kit.parts.find((p) => p.name === 'podium');
  assert.ok(podium && Math.abs(podium.y1 - 10) <= 0.5, 'the podium stands at its mapped 10 m');
  const [dx, dz] = at(...AZ.deckNorth);
  assert.ok(covers(plot, dx, dz) && !covers(tower, dx, dz), 'the deck probe is on the plot, clear of the tower');
  assert.ok(top(kit, dx, dz) < 30, `nothing tall stands on the northern podium deck (${top(kit, dx, dz)} m)`);
  assert.ok(kit.parts.some((p) => /pool/.test(p.name) && p.y0 >= 9 && p.y1 < 13), 'a pool lies on the podium deck');
});

test('Altez has the scattered projecting bays and the pale crown of the photographs', async () => {
  const { kit } = await altez();
  const bays = kit.parts.filter((p) => p.name.startsWith('bay-frame-'));
  assert.ok(bays.length >= 60, `${bays.length} projecting bays scattered over the broad faces`);
  for (const bay of bays) assert.ok(bay.y0 >= 10 && bay.y1 <= 240, `${bay.name} hangs on the shaft, not the podium or crown`);
  const crown = kit.parts.find((p) => p.name === 'crown');
  assert.ok(crown && crown.y0 >= 230 && crown.y1 > 245, 'the glazed crown under the cornice');
  const shaft = kit.parts.find((p) => p.name === 'shaft');
  assert.ok(shaft && shaft.y0 <= 10 && shaft.y1 >= 230, 'the shaft rises from the podium to the crown');
  assert.ok(kit.parts.filter((p) => p.type === 'sign').length === 0, 'no tenant sign: the photographs show none');
});

test('Altez stays finite, batched and free of flicker, its shaft and decks solid, the street open', async () => {
  const { kit, at } = await altez();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solid = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solid(AZ.centre, 150), 'the shaft is solid at mid-height');
  assert.ok(solid(AZ.centre, 242), 'and in its crown');
  assert.ok(solid(AZ.deckNorth, 10.3), 'the podium deck stops descent');
  assert.ok(!solid(AZ.deckNorth, 40), 'the air over the deck is open');
  assert.ok(!solid(AZ.street, 3) && !solid(AZ.street, 20), 'Enggor Street beside the plot stays open');
  assert.ok(footprints.some((f) => f.h >= 249), 'the map has the tower at its height');
});
