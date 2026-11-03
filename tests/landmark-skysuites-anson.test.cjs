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

// Skysuites @ Anson (SG-117): the near-black 250 m shaft with full-height silver fins, The Retreat's open setback
// terrace and the circular Vista Deck disc overhanging the plate
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

async function skysuites() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'skysuites-anson');
  assert.ok(L, 'Skysuites @ Anson has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/skysuites-anson.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  const tower = ring(393100851);
  // the tower plate's centre, and points derived from its longest edge: just inside that broad face (on The
  // Retreat's open deck ring, outside the set-back upper shaft) and 15 m out from the centre toward it (under
  // the Vista Deck's overhang, clear of the plate)
  const C = [0, 1].map((k) => tower.reduce((s, p) => s + p[k], 0) / tower.length);
  let M = null, best = -1;
  for (let i = 0; i < tower.length; i++) {
    const a = tower[i], b = tower[(i + 1) % tower.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > best) { best = len; M = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
  }
  const dir = [M[0] - C[0], M[1] - C[1]], dl = Math.hypot(...dir);
  const terrace = [C[0] + dir[0] * 0.92, C[1] + dir[1] * 0.92];
  const overhang = [C[0] + (dir[0] / dl) * 15, C[1] + (dir[1] / dl) * 15];
  return { kit, L, info, at, ms, plot: ring(172023451), tower, C, terrace, overhang };
}
// independently located points (lon, lat), from the OSM rings
const SS = {
  centre: [103.844712, 1.2745736], // the centroid of the mapped tower part 393100851
  street: [103.84442, 1.27460] // Enggor Street, west of the plot (Altez stands beyond it, not in this model)
};
const top = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));

test('Skysuites @ Anson replaces its podium outline and tower part, and nothing else', async () => {
  const { L, info } = await skysuites();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [172023451, 393100851]);
  const tower = L.parts.find((p) => p.id === 393100851);
  assert.equal(tower.levels, 71);
  assert.equal(tower.height, 250);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'skysuites-anson');
  assert.deepEqual(registered.hide, [172023451, 393100851]);
  for (const id of [172023443, 393100852, 171995554, 325832016])
    assert.ok(!registered.hide.includes(id), 'Altez and Mapletree Anson remain mapped buildings');
  assert.equal(info.name, 'Skysuites @ Anson');
  assert.equal(info.height, 250);
});

test('Skysuites: built on its anchor to 250 m in a moment, the disc over its plate', async () => {
  const { kit, ms, at, tower, C } = await skysuites();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 250) <= 3, `${b.maxY} m tall, 250 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const [cx, cz] = at(...SS.centre);
  assert.ok(covers(tower, cx, cz) && Math.hypot(cx - C[0], cz - C[1]) < 3, 'the OSM centroid and the generated ring agree');
  assert.ok(Math.abs(top(kit, cx, cz) - 250) <= 1, `the Vista Deck cap reaches 250 m (${top(kit, cx, cz)})`);
  const podium = kit.parts.find((p) => p.name === 'podium');
  assert.ok(podium && podium.y1 >= 18 && podium.y1 <= 24, 'the six-level podium under the shaft');
  const disc = kit.parts.find((p) => p.name === 'vista-disc');
  assert.ok(disc && disc.y0 >= 244 && disc.type === 'cylinder', 'the circular Vista Deck disc at the top');
  const discR = Math.max(...disc.ring.map(([x, z]) => Math.hypot(x - C[0], z - C[1])));
  assert.ok(discR > 14, `the disc (r ${discR.toFixed(1)} m) overhangs the plate's half-depth, as photographed`);
});

test('Skysuites has full-height silver fins and The Retreat as a genuinely open setback', async () => {
  const { kit, L, terrace } = await skysuites();
  const fins = kit.parts.filter((p) => p.name.startsWith('fin-'));
  assert.ok(fins.length >= 8, `${fins.length} silver fins on the shaft`);
  for (const f of fins) assert.ok(f.y1 - f.y0 > 150, `${f.name} runs the shaft's height`);
  assert.equal(builtOver(kit, terrace[0], terrace[1], 200, 203).length, 0, "The Retreat's deck ring is open air at 201 m");
  const upper = kit.parts.find((p) => p.name === 'upper-shaft');
  assert.ok(upper && upper.y0 >= 195 && upper.y0 <= 205 && upper.y1 >= 238, 'the louvred upper shaft over the terrace');
  assert.ok(kit.parts.filter((p) => p.name.startsWith('retreat-column-')).length >= 4, 'corner columns carry the upper shaft over the open deck');
  const { colliders } = kit.finish();
  assert.ok(!colliderAt(colliders, terrace[0] + L.x, 201, terrace[1] + L.z), 'no invisible wall fills the setback');
  assert.ok(colliderAt(colliders, terrace[0] + L.x, 198.4, terrace[1] + L.z), "the Retreat's deck itself stops descent");
});

test('Skysuites stays finite, batched and free of flicker, solid under its disc overhang only at the disc', async () => {
  const { kit, L, at, overhang } = await skysuites();
  assert.ok(kit.triangles > 400 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solid = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solid(SS.centre, 150), 'the shaft is solid at mid-height');
  assert.ok(solid(SS.centre, 220), 'the upper shaft is solid');
  assert.ok(solid(SS.centre, 248), 'and the Vista Deck over it');
  assert.equal(builtOver(kit, overhang[0], overhang[1], 205, 245).length, 0, 'open air under the disc overhang');
  assert.ok(colliderAt(colliders, overhang[0] + L.x, 247.5, overhang[1] + L.z), 'the overhanging disc stops descent');
  assert.ok(!colliderAt(colliders, overhang[0] + L.x, 230, overhang[1] + L.z), 'nothing invisible hangs below it');
  assert.ok(!solid(SS.street, 20), 'Enggor Street beside the plot stays open');
  assert.ok(footprints.some((f) => f.h >= 249), 'the map has the tower at its height');
});
