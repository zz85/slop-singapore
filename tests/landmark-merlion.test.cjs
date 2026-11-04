const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// SG-147 the Merlion (js/landmark-models/merlion.js) built against the kit (js/landmark-kit.js) on its real anchor
// (GEO.landmarks of js/singapore-geodata.js): the 8.6 m statue on its tiled waves on the round granite drum at the tip of
// Merlion Park, facing 75° (ENE) over the bay with its jet from the open mouth landing in the water, and the 2 m porcelain
// cub in its basin 23 m behind it, facing the other way, spouting into the basin. See docs/merlion.md.

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

let built = null;
async function merlion() {
  if (built) return built;
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'merlion');
  assert.ok(L, 'the Merlion has its own landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${L.model}.js`)).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // a lon/lat as a point about the anchor
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z]; };
  built = { kit, L, info, at, ms, GEO };
  return built;
}

const FACING = 75, CUB_FACING = 270; // compass bearings the statues face (docs/merlion.md)
const WATER = -2.2; // the bay (js/open-city-config.js waterLevel)
const CUB = [103.8543012, 1.2867975]; // OSM node 6283080658, The Merlion Cub

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}
const along = (p, dir) => p[0] * dir[0] + p[1] * dir[1];
const solids = (kit, re) => kit.parts.filter((p) => re.test(p.name) && p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
// the statue's lofts that span height y (their base ring there, near enough at the slices' spacing)
const sliceAt = (kit, re, y) => solids(kit, re).filter((p) => p.y0 <= y + 1e-6 && p.y1 > y + 1e-6);
const extent = (rings, dir) => { const t = rings.flat().map((q) => along(q, dir)); return [Math.min(...t), Math.max(...t)]; };
const STATUE = /^merlion-(body|head|mane|fin|curl)/;

test('the Merlion stands on its own anchor at the tip of Merlion Park and replaces no mapped building', async () => {
  const { L, info } = await merlion();
  assert.equal(info.name, 'Merlion');
  assert.equal(info.height, 8.6, 'the statue is 8.6 m tall (Roots.sg, Wikipedia)');
  assert.equal(L.parts.length, 0, 'nothing mapped is hidden for it');
  assert.ok(Math.abs(L.x - 131.4) < 0.2 && Math.abs(L.z + 437.2) < 0.2, 'anchored at the centre of OSM way 182819157');
});

test('the Merlion builds to its documented 8.6 m on its drum, which rises from the bay to just above the paving', async () => {
  const { kit, info, ms } = await merlion();
  assert.ok(ms < 1500, `built in ${Math.round(ms)} ms`);
  const drum = kit.parts.find((p) => p.name === 'merlion-drum');
  const coping = kit.parts.find((p) => p.name === 'merlion-drum-coping');
  assert.ok(drum && coping, 'the granite drum and its coping');
  assert.ok(Math.abs(drum.y0 - WATER) < 0.01, `the drum stands in the water (${drum.y0})`);
  assert.ok(coping.y1 >= 0.3 && coping.y1 <= 0.45, `its top just above the city's lawn (${coping.y1})`);
  const statue = solids(kit, STATUE);
  const top = Math.max(...statue.map((p) => p.bounds.maxY)), foot = Math.min(...kit.parts.filter((p) => /^merlion-wave/.test(p.name)).map((p) => p.bounds.minY));
  assert.ok(Math.abs(foot - coping.y1) < 0.01, `the waves stand on the drum (${foot})`);
  assert.ok(Math.abs(top - foot - info.height) < 0.12, `${(top - foot).toFixed(2)} m from the foot of its waves to the top of its head`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.minY - WATER) < 0.01, 'nothing below the water');
  // the drum: about 7.5 m across, its front 5 m out from the statue's axis toward the bay (the aerial's quay line)
  const [lo, hi] = extent([drum.ring], kit.compass(FACING));
  assert.ok(hi - lo > 7 && hi - lo < 8.2, `the drum ${(hi - lo).toFixed(1)} m across`);
  assert.ok(hi > 4.5 && hi < 5.5, `its front ${hi.toFixed(1)} m out toward the bay`);
});

test('the Merlion faces 75° (ENE) over the bay: the face, the mouth and the jet that way, the mane behind', async () => {
  const { kit } = await merlion();
  const F = kit.compass(FACING), R = kit.compass(FACING + 90);
  const y = (h) => 0.35 + h; // the drum's top, where the statue's waves stand
  // the snout reaches forward of the axis, the mane's back behind it
  const [back, front] = extent(sliceAt(kit, STATUE, y(7.5)).map((p) => p.ring), F);
  assert.ok(front > 1.5 && front < 2.0, `the snout ${front.toFixed(2)} m forward`);
  assert.ok(back < -1.6 && back > -2.0, `the mane ${(-back).toFixed(2)} m behind`);
  // the face is narrower than the mane round it; the mane wider than the fish's body; the body deeper than wide
  const width = (h) => { const [a, c] = extent(sliceAt(kit, STATUE, y(h)).map((p) => p.ring), R); return c - a; };
  const depth = (h) => { const [a, c] = extent(sliceAt(kit, STATUE, y(h)).map((p) => p.ring), F); return c - a; };
  assert.ok(width(6.0) > 2.4 && width(6.0) < 3.0, `the mane ${width(6.0).toFixed(2)} m across`);
  assert.ok(width(2.5) < 0.75 * width(6.0), `the body (${width(2.5).toFixed(2)} m) narrower than the mane`);
  assert.ok(depth(2.5) > 1.4 * width(2.5), `a fish's body: ${depth(2.5).toFixed(2)} m deep, ${width(2.5).toFixed(2)} m wide`);
  // the tail rises up the chest to a fin under the chin, standing proud of the throat
  const fwd = (h) => extent(sliceAt(kit, STATUE, y(h)).map((p) => p.ring), F)[1];
  assert.ok(fwd(5.4) > fwd(6.15) + 0.4, `the fin (${fwd(5.4).toFixed(2)}) proud of the throat (${fwd(6.15).toFixed(2)})`);
  // the mane falls in tiers to about 4.1 m at the back, the scales below
  const behind = (h) => -extent(sliceAt(kit, STATUE, y(h)).map((p) => p.ring), F)[0];
  assert.ok(behind(4.3) > behind(3.9) + 0.15, `the mane's hem overhangs the body (${behind(4.3).toFixed(2)} over ${behind(3.9).toFixed(2)})`);
});

test('the fish body carries rows of scales, the mane its tiers', async () => {
  const { kit } = await merlion();
  const R = kit.compass(FACING + 125);
  // up the flank behind the tail's curl, the lower edge of each row of scales stands proud of the row under it, as
  // overlapping scales do: a run of ledges, not a smooth column (the point of each section that lies most nearly that
  // way, as far out as it reaches)
  const flank = solids(kit, /^merlion-body/).sort((a, b) => a.y0 - b.y0).filter((p) => p.y0 > 1.8 && p.y0 < 4.3);
  const sideways = (ring) => ring.reduce((best, q) => { const d = Math.hypot(...q), a = along(q, R) / d; return a > best.a ? { a, d } : best; }, { a: -Infinity, d: 0 }).d;
  const side = flank.map((p) => sideways(p.ring));
  let ledges = 0;
  for (let i = 1; i < side.length; i++) if (side[i] - side[i - 1] > 0.04) ledges++;
  assert.ok(ledges >= 7, `${ledges} rows of scales down the flank`);
  // the mane: stepped tiers at its back
  const F = kit.compass(FACING);
  const mane = solids(kit, /^merlion-(head|mane)/).sort((a, b) => a.y0 - b.y0).filter((p) => p.y0 > 4.2 && p.y0 < 7.2);
  const backs = mane.map((p) => -extent([p.ring], F)[0]);
  let tiers = 0;
  for (let i = 1; i < backs.length; i++) if (backs[i] - backs[i - 1] > 0.06) tiers++; // each tier's hem juts out over the one below
  assert.ok(tiers >= 3, `${tiers} tiers down the back of the mane`);
});

test('the Merlion\'s jet leaves a nozzle in its open mouth and lands in the bay well beyond the drum', async () => {
  const { kit } = await merlion();
  const jet = kit.jets.find((j) => j.name === 'merlion-jet');
  assert.ok(jet, 'the Merlion spouts');
  const F = kit.compass(FACING), R = kit.compass(FACING + 90);
  const nozzle = kit.parts.find((p) => p.name === 'merlion-nozzle');
  const [x, y, z] = jet.from, b = nozzle.bounds;
  assert.ok(x >= b.minX - 0.02 && x <= b.maxX + 0.02 && y >= b.minY - 0.02 && y <= b.maxY + 0.02 && z >= b.minZ - 0.02 && z <= b.maxZ + 0.02, 'the water leaves the nozzle\'s end');
  // the mouth is open in front of it: no part of the head at the nozzle's height covers it, the upper jaw over it
  // and the lower jaw under it do
  const head = solids(kit, /^merlion-head/);
  assert.ok(!head.some((p) => p.y0 <= y && p.y1 >= y && covers(p.ring, x, z)), 'open in front of the nozzle');
  assert.ok(head.some((p) => p.y0 > y + 0.05 && p.y0 < y + 0.4 && covers(p.ring, x - F[0] * 0.15, z - F[1] * 0.15)), 'the upper jaw over it');
  assert.ok(head.some((p) => p.y1 < y - 0.05 && p.y1 > y - 0.6 && covers(p.ring, x - F[0] * 0.15, z - F[1] * 0.15)), 'the lower jaw under it');
  assert.ok(Math.abs(along([x, z], R)) < 0.05 && along([x, z], F) > 1.2, 'on the face\'s middle line, at the front');
  // out along the facing, a little upward, falling into the bay 11–14 m out (the aerial's splash), 6 m and more past
  // the drum's front
  const v = jet.velocity, horiz = Math.hypot(v[0], v[2]);
  assert.ok((v[0] * F[0] + v[2] * F[1]) / horiz > 0.999, 'straight out of the mouth');
  assert.ok(v[1] > 0 && v[1] < 0.25 * horiz, 'a little upward, as the photographs show');
  assert.equal(jet.floor, WATER, 'into the bay');
  const out = along(jet.lands, F);
  assert.ok(out > 11 && out < 14, `lands ${out.toFixed(1)} m out`);
  assert.ok(Math.abs(along(jet.lands, R)) < 0.1, 'in line with the face');
  const drum = kit.parts.find((p) => p.name === 'merlion-drum');
  assert.ok(out - extent([drum.ring], F)[1] >= 6, 'well beyond the drum');
});

test('the Merlion cub stands where OSM puts it, 2 m tall, facing west, spouting into its basin', async () => {
  const { kit, at } = await merlion();
  const [cx, cz] = at(...CUB);
  const base = kit.parts.find((p) => p.name === 'cub-base');
  const mid = [(base.bounds.minX + base.bounds.maxX) / 2, (base.bounds.minZ + base.bounds.maxZ) / 2];
  assert.ok(Math.hypot(mid[0] - cx, mid[1] - cz) < 0.5, `the cub ${Math.hypot(mid[0] - cx, mid[1] - cz).toFixed(2)} m from OSM node 6283080658`);
  const cub = solids(kit, /^cub-(body|head|mane|fin)/);
  const foot = Math.min(...cub.map((p) => p.bounds.minY)), top = Math.max(...cub.map((p) => p.bounds.maxY));
  assert.ok(Math.abs(foot - base.y1) < 0.01, 'the cub on its rock');
  assert.ok(Math.abs(top - foot - 2.0) < 0.12, `${(top - foot).toFixed(2)} m tall`);
  const F = kit.compass(CUB_FACING), R = kit.compass(CUB_FACING + 90);
  const jet = kit.jets.find((j) => j.name === 'cub-jet');
  assert.ok(jet, 'the cub spouts');
  const nozzle = kit.parts.find((p) => p.name === 'cub-nozzle');
  const [x, y, z] = jet.from, b = nozzle.bounds;
  assert.ok(x >= b.minX - 0.02 && x <= b.maxX + 0.02 && y >= b.minY - 0.02 && y <= b.maxY + 0.02 && z >= b.minZ - 0.02 && z <= b.maxZ + 0.02, 'the water leaves the cub\'s nozzle');
  const rel = [x - mid[0], z - mid[1]];
  assert.ok(along(rel, F) > 0.3 && Math.abs(along(rel, R)) < 0.05, 'from its mouth, toward the west');
  assert.ok(!solids(kit, /^cub-head/).some((p) => p.y0 <= y && p.y1 >= y && covers(p.ring, x, z)), 'the cub\'s mouth open in front of it');
  // down into the basin's water, in front of the rock
  const water = kit.parts.find((p) => p.name === 'cub-basin-water');
  assert.ok(Math.abs(jet.floor - water.y1) < 0.01, 'into the basin');
  assert.ok(covers(water.ring, ...jet.lands), 'landing inside the basin');
  assert.ok(!covers(base.ring, ...jet.lands), 'clear of the rock');
  const rim = kit.parts.find((p) => p.name === 'cub-basin-rim');
  assert.ok(rim.y1 > water.y1 && rim.y1 < 0.6, 'the rim stands above the water');
});

test('nothing floats: every raised piece rests on or in something under it', async () => {
  const { kit } = await merlion();
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.02 && b.minX <= a.maxX + 0.02 && a.minZ <= b.maxZ + 0.02 && b.minZ <= a.maxZ + 0.02;
  for (const p of parts) {
    if (p.bounds.minY <= 0.4) continue; // on the paving, in the basin or in the bay
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.001 && q.bounds.maxY >= p.bounds.minY - 0.02 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the statue's slices run unbroken from its waves to the top of its head
  for (const re of [/^merlion-(body|head|mane)/, /^cub-(body|head|mane)/]) {
    const run = solids(kit, re).sort((a, b) => a.y0 - b.y0);
    for (let i = 1; i < run.length; i++) assert.ok(run[i].y0 <= Math.max(...run.slice(0, i).map((q) => q.y1)) + 1e-6, `${run[i].name} at ${run[i].y0.toFixed(2)} m sits on the slice under it`);
  }
});

test('the Merlion stays finite, within its hero budget, free of flicker and solid to walk into', async () => {
  const { kit } = await merlion();
  assert.ok(kit.triangles > 15000 && kit.triangles < 60000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 10)));
  const { group, colliders } = kit.finish();
  assert.ok(group.children.length <= 10, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const j of kit.jets) assert.ok([...j.from, ...j.velocity, ...j.lands, j.time].every(Number.isFinite), j.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (x, y, z) => colliders.some((c) => {
    const o = c.obb, dx = x + kit.anchor.x - o.cx, dz = z + kit.anchor.z - o.cz;
    return c.minY < y && c.maxY > y && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
  });
  for (const y of [1, 3, 6, 8.5]) assert.ok(solidAt(0, y, 0), `the statue is solid at ${y} m`);
  const F = kit.compass(FACING);
  assert.ok(!solidAt(F[0] * 9, 1, F[1] * 9), 'the bay beyond the drum is open');
});
