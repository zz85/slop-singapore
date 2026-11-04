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

// Apple Marina Bay Sands (SG-049): Foster + Partners' 30 m glass dome on its black base in the bay
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

async function apple() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'apple-marina-bay-sands');
  assert.ok(L, 'Apple Marina Bay Sands has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/apple-marina-bay-sands.js')).href);
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
// independently located points (lon, lat), from the OSM ring
const AP = {
  centre: [103.857571, 1.283330], // the mapped circle's bounds centre
  westGlass: [103.857454, 1.283330], // 13 m west: inside the dome near its equator
  boardwalk: [103.857865, 1.283536], // 40 m at bearing 55: on the bridge run to the shore
  bay: [103.857254, 1.283013] // 50 m at bearing 225: open water south-west of the dome
};

test('Apple replaces its dome way 821764692, and nothing else', async () => {
  const { L, info } = await apple();
  assert.deepEqual(L.parts.map((p) => p.id), [821764692]);
  const dome = L.parts[0];
  assert.equal(dome.roofShape, 'dome');
  assert.equal(dome.roofHeight, 15);
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'apple-marina-bay-sands');
  assert.deepEqual(registered.hide, [821764692]);
  for (const id of [172013197, 261191086, 827855915])
    assert.ok(!registered.hide.includes(id), 'the Crystal Pavilion and the ArtScience Museum remain');
  assert.equal(info.name, 'Apple Marina Bay Sands');
  assert.equal(info.height, 21, 'the mapped 5 m base + 15 m dome, rounded');
});

test('Apple: a 30 m class dome on a black base, baffles and oculus, boardwalk to shore', async () => {
  const { kit, ms, at } = await apple();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(b.maxY >= 19 && b.maxY <= 22, `${b.maxY} m tall, the mapped ~20 m`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands in the water (${b.minY})`);
  const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
  assert.ok(span >= 60 && span <= 110, `dome plus boardwalk spans ${span.toFixed(0)} m, not just the mapped circle`);
  const bands = kit.parts.filter((p) => p.name.startsWith('dome-band-'));
  assert.ok(bands.length >= 5, `${bands.length} latitude bands make the sphere`);
  const radii = bands.map((p) => Math.max(...p.ring.map(([x, z]) => Math.hypot(x, z))));
  assert.ok(Math.max(...radii) >= 13.5 && Math.max(...radii) <= 16.5, `equator radius ${Math.max(...radii).toFixed(1)} m: the published 30 m diameter`);
  const base = kit.parts.find((p) => p.name === 'black-base');
  assert.ok(base && base.y0 <= 0.5 && base.y1 >= 1.5 && base.y1 <= 5, 'the black glass base at the waterline');
  const oculus = kit.parts.find((p) => p.name === 'oculus');
  assert.ok(oculus && oculus.y1 >= 19, 'the oculus caps the apex');
  assert.ok(kit.parts.filter((p) => p.name.startsWith('baffle-')).length >= 3, 'concentric baffle rings inside the glass');
  const [cx, cz] = at(...AP.centre);
  assert.ok(top(kit, cx, cz) >= 19, `the dome closes over its centre (${top(kit, cx, cz)} m)`);
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1, 'one sign: the shore signpost');
  assert.equal(signs[0].logo, 'apple', "carrying Apple's mark alone, as the real signpost does");
});

test('Apple stays finite, batched and free of flicker, dome and deck solid and the bay open', async () => {
  const { kit, at } = await apple();
  assert.ok(kit.triangles > 400 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solid = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solid(AP.centre, 10), 'the dome interior stops descent');
  assert.ok(solid(AP.westGlass, 10), 'solid out to near the equator');
  assert.ok(!solid(AP.centre, 25), 'the air over the oculus is open');
  assert.ok(solid(AP.boardwalk, 1), 'the boardwalk deck is solid over the water');
  assert.ok(!solid(AP.boardwalk, 8), 'and open above it');
  assert.ok(!solid(AP.bay, 2) && !solid(AP.bay, 12), 'the bay around the dome stays open');
  assert.ok(footprints.some((f) => f.h >= 19), 'the map has the dome at its height');
});
