const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// Suntec City (SG-215) built against the kit on its real generated anchor: five towers in their mapped
// tiers, the mall podium, the convention centre's pyramid roof and the Fountain of Wealth.
// See docs/suntec-city.md.

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

const PYRAMIDS = [393090403, 393090405, 393090406, 393090407, 393090408, 393090409, 393090410, 393090412, 393090414, 393090416,
  393090417, 393090418, 393090419, 393090420, 393090421, 393090422, 393090426, 393090429, 393090431, 393090433, 393090436,
  393090439, 393090441, 393090451, 393090452, 393090453, 393090454, 393090455, 393090456, 393090457, 393090458, 393090459,
  393090461, 393090462, 393090465, 393090468, 393090469, 393090470, 393090471, 393090473, 393090474, 393090476, 393090477,
  393090478, 393090479, 393090481, 463425266, 463425278, 463425281, 463425283, 463425284, 463425285, 463425286, 463425287,
  463425288, 463425289, 463425290, 463425291, 463425292, 463425293, 463425294, 463425295, 463425296, 463425297, 463425298,
  463425299, 463425300, 463425303, 463425304, 463425305, 463425306];
const EXPECTED = [46595146, 46595147, 46595148, 102938119, 741937829, 741937830, 741937831, 741937832,
  393090486, 393090485, 393090484, 393090487, 172373826, 172373825, 172373827, 393090483,
  46595145, 741937828, 393210508, 46595137, 492114727, 393210509, 46594818,
  393090489, 591301851, ...PYRAMIDS, 460430417, 460430418, 460430419, 460430420].sort((a, b) => a - b);

async function model() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'suntec-city');
  assert.ok(L, 'Suntec City has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/suntec-city.js')).href);
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
// independently located points (lon, lat) from the OSM rings' centroids
const P = {
  t1: [103.8584145, 1.2954162], t3: [103.8596014, 1.2952585], t5: [103.8579528, 1.2946134],
  mallE: [103.8601631, 1.2947541], conv: [103.8572606, 1.2935891],
  fountain: [103.8589213, 1.2947645], // centroid of the four mapped fountain legs
  courtRoad: [103.85930, 1.29476] // the roundabout east of the fountain basin
};

test('SG-215 Suntec City replaces its towers, mall, convention centre and fountain legs, and nothing else', async () => {
  const { L, info } = await model();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), EXPECTED, `${EXPECTED.length} mapped ways`);
  assert.equal(L.parts.find((p) => p.id === 172373826).height, 181, 'the top tier part carries the documented 181 m');
  assert.equal(L.parts.find((p) => p.id === 741937828).levels, 18, 'Tower Five, the 18-storey thumb');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'suntec-city');
  assert.deepEqual([...registered.hide].sort((a, b) => a - b), EXPECTED);
  for (const id of [46595138, 155987124]) assert.ok(!registered.hide.includes(id), 'Conrad Centennial and the Pan Pacific block remain mapped neighbours');
  assert.equal(info.name, 'Suntec City');
  assert.equal(info.height, 181);
});

test('SG-215 Suntec City: four 181 m towers in three mapped tiers, the 72 m thumb, mall and convention roofs', async () => {
  const { kit, at, ms } = await model();
  assert.ok(ms < 1000, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 181) <= 2, `${b.maxY} m tall, 181 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  for (const [name, where, want] of [['Tower One', P.t1, 181], ['Tower Three', P.t3, 181], ['Tower Five', P.t5, 72]]) {
    const [x, z] = at(...where);
    assert.ok(Math.abs(top(kit, x, z) - want) <= 2, `${name} reaches ${want} m over its mapped centre (${top(kit, x, z)})`);
  }
  for (const n of [1, 2, 3, 4]) {
    const tiers = kit.parts.filter((p) => p.name.startsWith(`tower-${n}-tier-`));
    assert.equal(tiers.length, 3, `Tower ${n} is built in its three mapped tiers`);
    assert.ok(tiers.some((p) => p.y1 <= 95) && tiers.some((p) => p.y0 >= 145), `Tower ${n} steps at the mapped 90/150 m tiers`);
  }
  const [mx, mz] = at(...P.mallE);
  assert.ok(top(kit, mx, mz) >= 17 && top(kit, mx, mz) < 40, `the mall podium at its mapped 20 m (${top(kit, mx, mz)})`);
  const [cx, cz] = at(...P.conv);
  assert.ok(top(kit, cx, cz) >= 27.5 && top(kit, cx, cz) <= 34, `the convention centre at 28 m with its pyramids (${top(kit, cx, cz)})`);
  assert.ok(kit.parts.filter((p) => p.name.startsWith('conv-pyramid-')).length >= 70, 'the white roof pyramids of the photographs');
  assert.ok(kit.parts.some((p) => p.type === 'sign' && /suntec/i.test(p.name)), 'the SUNTEC crown sign of the 2024 photograph');
});

test('SG-215 Suntec City: the Fountain of Wealth ring over an open court, collision where the solids are', async () => {
  const { kit, at } = await model();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  assert.equal(kit.flicker().length, 0, JSON.stringify(kit.flicker().slice(0, 10)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const ring = kit.parts.filter((p) => p.name.startsWith('fountain-ring-'));
  assert.ok(ring.length >= 12 && ring.every((p) => p.y0 >= 12 && p.y1 <= 16), 'the bronze ring at its published 13.8 m');
  assert.ok(kit.parts.some((p) => p.name === 'fountain-basin' && p.y1 <= 1), 'the dark basin disc on the court');
  assert.equal(kit.parts.filter((p) => p.name.startsWith('fountain-leg-')).length, 4, 'four slanted legs');
  const hit = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(hit(P.t1, 120) && hit(P.t1, 175), 'Tower One solid in its middle and top tiers');
  assert.ok(hit(P.t5, 60), 'Tower Five solid');
  assert.ok(hit(P.mallE, 10), 'the mall solid under its roof');
  assert.ok(hit([P.fountain[0], P.fountain[1] + 11 / 110574], 13.8), 'the fountain ring stops descent');
  assert.ok(!hit(P.fountain, 5), 'open air under the ring at the basin centre');
  const [rx, rz] = at(...P.courtRoad);
  assert.equal(builtOver(kit, rx, rz, 2, 10).length, 0, 'no invented mass over the roundabout');
  assert.ok(!hit(P.courtRoad, 3), 'the roundabout stays drivable');
  assert.ok(footprints.some((f) => f.h >= 180), 'the map has the towers at their height');
});

