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

// --- OCBC Centre (SG-006) -------------------------------------------------------------------------------------------------
// "The calculator": a slab between two half-round granite cores, its offices in three stacks cantilevered 5.5 m out
// from the cores on both long faces, the girder floors between them recessed; the crown with OCBC's mark, the walk under
// the lowest stack on Chulia Street; the car-park podium, Centre South and Centre East round it.

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
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, ledges and other beams aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));

// Points read off the mapped rings (OSM ways 335167787 and the stacks' strips 325793729 and 335167802, which meet the
// cores' faces at the four corners of the slab's straight middle, 38.3 m long and 22.3 m across, its axis on 116°):
// the slab's middle; inside each face's stacks, 3 m out from the cores' face; near each end of the river-side stack;
// just inside and just outside each core's half-circle on the slab's axis (the mapped ring bulges 2 m further); the
// walk between the east core and Centre East; inside Centre East, Centre South and the podium; Bar On Chulia's yard
const OC = {
  centre: [103.8493189, 1.2852617],
  stackNNE: [103.8493747, 1.2853768], stackSSW: [103.8492631, 1.2851466], stackNNEEast: [103.8495131, 1.2853089],
  coreEastIn: [103.8495515, 1.2851476], coreEastOut: [103.8495733, 1.2851368],
  coreWestIn: [103.8490863, 1.2853759], coreWestOut: [103.8490645, 1.2853866],
  walkway: [103.8495808, 1.2851131],
  east: [103.8496807, 1.2848682], south: [103.8488541, 1.2847506], podium: [103.8490338, 1.2850491], bar: [103.8489439, 1.2855013]
};
// the stacks' soffits and tops, and the recessed girder floors between them (from the model's storey grid, 3.656 m)
const STACKS = [[15.94, 67.71], [74.44, 126.2], [131.98, 189.34]];
const GAPS = [[67.71, 74.44], [126.2, 131.98]];

test('OCBC Centre replaces its outline, the tower, the stacks\' six strips, the podium, Centre East and Centre South, and nothing else', async () => {
  const { L, info } = await siteModel('ocbc-centre');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b),
    [171999325, 325793729, 335167787, 335167802, 407705487, 407705497, 407705501, 460431821, 460431822, 460431823, 460431824]);
  assert.equal(info.name, 'OCBC Centre');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const [id, name] of [[764327106, 'Bar On Chulia'], [172002560, 'Royal One Phillip'], [171999290, 'the Yueh Hai Ching Temple']]) {
    assert.ok(!registered.hide.includes(id), `${name} stays the city's`);
  }
});

test('OCBC Centre builds on its anchor to its documented 198 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms, at } = await siteModel('ocbc-centre');
  assert.equal(info.height, 198);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = siteOf(L).parts.find((p) => p.id === 171999325).ring;
  for (const axis of [0, 1]) {
    const values = outline.map((p) => p[axis]), [lo, hi] = axis ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    assert.ok(lo >= Math.min(...values) - 1.5 && hi <= Math.max(...values) + 1.5, `within the mapped outline along ${axis ? 'z' : 'x'} (${lo.toFixed(1)}..${hi.toFixed(1)})`);
  }
  // nothing over Bar On Chulia's yard next door
  const [bx, bz] = at(...OC.bar);
  assert.equal(builtOver(kit, bx, bz, 0, 300).length, 0, 'Bar On Chulia stays the city\'s');
});

test('OCBC Centre: the slab between two half-round cores, granite to the roof', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  const top = (where) => { const [x, z] = at(...where); return Math.max(0, ...builtOver(kit, x, z, 0, 400).filter((p) => !/plant|fan/.test(p.name)).map((p) => p.y1)); };
  assert.ok(Math.abs(top(OC.centre) - 196) < 0.01, `the plant well's floor in the roof's middle, 2 m under the roof (${top(OC.centre)})`);
  for (const [where, what] of [[OC.coreEastIn, 'east'], [OC.coreWestIn, 'west']]) assert.ok(Math.abs(top(where) - 198) < 0.01, `the ${what} core rises to the roof at 198 m`);
  // the cores are true half-circles of the slab's width: nothing beyond them, where the mapped ring bulges
  for (const [where, what] of [[OC.coreEastOut, 'east'], [OC.coreWestOut, 'west']]) {
    const [x, z] = at(...where);
    assert.equal(builtOver(kit, x, z, 0.4, 300).length, 0, `open just beyond the ${what} core`);
  }
  const slab = kit.parts.find((p) => p.name === 'tower-slab');
  assert.ok(slab.ring.length >= 30, 'the cores drawn round');
  const extent = Math.hypot(slab.bounds.maxX - slab.bounds.minX, slab.bounds.maxZ - slab.bounds.minZ);
  assert.ok(extent > 60 && extent < 66, `about 61 m long and 22 m across (${extent.toFixed(1)} m corner to corner)`);
});

test('OCBC Centre: three stacks of offices cantilever 5.5 m out on both faces, the girder floors between them recessed and open', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  const { colliders } = kit.finish();
  for (const where of [OC.stackNNE, OC.stackSSW, OC.stackNNEEast]) {
    const [x, z, wx, wz] = at(...where);
    for (const [s0, s1] of STACKS) {
      const mid = (s0 + s1) / 2;
      assert.ok(builtOver(kit, x, z, mid - 0.1, mid + 0.1).length >= 1, `a stack at ${mid.toFixed(0)} m`);
      assert.ok(colliderAt(colliders, wx, mid, wz), `solid to fly into at ${mid.toFixed(0)} m`);
    }
    for (const [g0, g1] of GAPS) {
      assert.equal(builtOver(kit, x, z, g0 + 0.1, g1 - 0.1).length, 0, `the girder floor ${g0.toFixed(0)}–${g1.toFixed(0)} m recessed behind the stacks' face`);
      assert.ok(!colliderAt(colliders, wx, (g0 + g1) / 2, wz), `free to fly into at ${((g0 + g1) / 2).toFixed(0)} m`);
    }
    assert.equal(builtOver(kit, x, z, 189.5, 400).length, 0, 'over the top stack, the crown is set back to the cores\' face');
  }
  // each stack: its storeys of windows on a deeper fascia over a dark recessed edge with the brackets' ends, under a
  // band; a sill ledge along each storey
  for (const face of ['nne', 'ssw']) {
    for (const [k, name] of ['lower', 'middle', 'upper'].entries()) {
      const parts = kit.parts.filter((p) => p.name.startsWith(`stack-${face}-${name}-`));
      const soffit = parts.find((p) => p.name.endsWith('-soffit')), fascia = parts.find((p) => p.name.endsWith('-fascia')), band = parts.find((p) => p.name.endsWith('-band'));
      assert.ok(Math.abs(soffit.y0 - STACKS[k][0]) < 0.05 && Math.abs(band.y1 - STACKS[k][1]) < 0.05, `the ${face} ${name} stack from ${soffit.y0.toFixed(1)} to ${band.y1.toFixed(1)} m`);
      assert.ok(Math.abs(fascia.y0 - soffit.y1) < 0.01 && fascia.y1 - fascia.y0 > 1.2, 'its fascia over the dark edge');
      const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
      assert.ok(area(fascia.ring) - area(soffit.ring) > 0.7 * 38, 'the dark edge set back under the fascia');
      assert.equal(parts.filter((p) => /-ledge-/.test(p.name)).length, 13, `the ${face} ${name} stack has 13 storeys of windows`);
      assert.equal(parts.filter((p) => /-bracket-/.test(p.name)).length, 12, 'a bracket a bay under it');
      // the depth: from the slab's face out to the stack's front
      const offices = parts.find((p) => p.name.endsWith('-offices'));
      const [a, b, c] = offices.ring;
      const depth = Math.hypot(c[0] - b[0], c[1] - b[1]), width = Math.hypot(b[0] - a[0], b[1] - a[1]);
      assert.ok(Math.abs(depth - 5.7) < 0.05 && Math.abs(width - 38.3) < 1, `${width.toFixed(1)} m wide, out 5.5 m (and 0.2 m into the slab)`);
    }
  }
  assert.ok(kit.parts.some((p) => p.name === 'stack-nne-upper-glass' && p.y1 - p.y0 > 3), 'the top storey of paler glass');
});

test('OCBC Centre: the walk under the lowest stack along Chulia Street is open to 16 m, the stack solid over it', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  const { colliders } = kit.finish();
  const [x, z, wx, wz] = at(...OC.stackNNE);
  assert.equal(builtOver(kit, x, z, 0.4, 15.9).length, 0, 'open under the stack');
  assert.ok(builtOver(kit, x, z, 0, 0.4).some((p) => p.name === 'base-walk' && p.y1 >= 0.3), 'paved above the city\'s lawn');
  for (const y of [1.5, 8, 15]) assert.ok(!colliderAt(colliders, wx, y, wz), `free to walk and fly at ${y} m`);
  assert.ok(colliderAt(colliders, wx, 20, wz), 'the stack over it is solid');
  // the banking hall's glass a metre inside the cores' faces, the girder band over it
  const hall = kit.parts.find((p) => p.name === 'tower-hall');
  assert.ok(hall && hall.y0 === 0 && hall.y1 === 12, 'the banking hall is 12 m high');
  // the walk between the east core and Centre East stays open
  const [ex, ez, ewx, ewz] = at(...OC.walkway);
  assert.equal(builtOver(kit, ex, ez, 0.4, 300).length, 0, 'open between the east core and Centre East');
  for (const y of [1.5, 30]) assert.ok(!colliderAt(colliders, ewx, y, ewz), `no invisible wall there at ${y} m`);
});

test('OCBC Centre: the podium, Centre South and Centre East, each at its own height', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  const { colliders } = kit.finish();
  const solidTop = (where) => { const [x, z] = at(...where); return Math.max(0, ...builtOver(kit, x, z, 0, 400).filter((p) => !/plant|cooling|tank|car/.test(p.name)).map((p) => p.y1)); };
  assert.equal(solidTop(OC.podium), 15.5, 'the car-park podium, six levels to 15.5 m');
  assert.equal(solidTop(OC.south), 28, 'Centre South, seven storeys to 28 m');
  assert.equal(solidTop(OC.east), 56, 'Centre East to 56 m, as mapped');
  for (const [where, y] of [[OC.podium, 8], [OC.south, 2.5], [OC.south, 20], [OC.east, 40]]) {
    const [, , wx, wz] = at(...where);
    assert.ok(colliderAt(colliders, wx, y, wz), `solid at ${y} m`);
  }
  // Centre East's curved front of banded glass toward the tower
  const east = kit.parts.find((p) => p.name === 'east');
  assert.ok(east.ring.length >= 14, 'its curved front rounded');
  // Centre South over its colonnade: the piers carry its edge, the ground floor set in
  const piers = kit.parts.filter((p) => /^south-pier-/.test(p.name));
  assert.ok(piers.length >= 15 && piers.every((p) => p.y0 === 0 && Math.abs(p.y1 - 4.6) < 1e-9), `${piers.length} piers under its edge`);
  // the podium's roof: cooling towers, a tank and cars on the deck, and the link under the south-west stack
  assert.ok(kit.parts.filter((p) => /^podium-cooling-/.test(p.name)).length === 9 && kit.parts.some((p) => p.name === 'podium-tank'));
  const [sx, sz] = at(...OC.stackSSW);
  assert.ok(builtOver(kit, sx, sz, 0, 15).some((p) => p.name === 'podium-link'), 'the podium joins the tower\'s foot under the south-west stack');
});

test('OCBC Centre: OCBC\'s mark and name hang on the crown, toward the river at its east end and toward Chinatown at its west end', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 2);
  const [cx, cz] = at(...OC.centre);
  const U = kit.compass(116), V = kit.compass(26);
  for (const s of signs) {
    assert.equal(s.logo, 'ocbc');
    assert.ok(s.y1 <= 198 - 0.5 && s.y0 >= 189.34, `${s.name} on the crown between the top stack (189.3 m) and the roofline (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const u = (mx - cx) * U[0] + (mz - cz) * U[1], v = (mx - cx) * V[0] + (mz - cz) * V[1];
    const toRiver = v > 0;
    assert.ok(Math.abs(Math.abs(v) - 11.3) < 0.5, `${s.name} hangs on the crown's face (${v.toFixed(2)} m from the axis)`);
    assert.ok(toRiver ? u > 5 && u < 16 : u < -5 && u > -16, `${s.name} toward the ${toRiver ? 'east' : 'west'} end (${u.toFixed(1)} m along)`);
    const width = Math.hypot(s.ring[1][0] - s.ring[0][0], s.ring[1][1] - s.ring[0][1]);
    assert.ok(width > 10 && width < 16, `${s.name} ${width.toFixed(1)} m wide`);
  }
  assert.deepEqual([...signs.map((s) => s.name)].sort(), ['sign:ocbc-nne', 'sign:ocbc-ssw']);
  // on a wall: walls facing the same way as the sign, within 0.5 m behind it, along all of it, that together (the slab
  // and the roof's edge over it) stand behind it from its foot to its top
  const walls = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3).flatMap((p) => p.walls);
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const out = [mx - cx, mz - cz];
    const behind = walls.filter((w) => w.nx * out[0] + w.nz * out[1] > 0 && s.ring.every(([x, z]) => {
      const d = x * w.nx + z * w.nz - w.off, a = -x * w.nz + z * w.nx;
      return d > 0 && d < 0.5 && a >= w.a0 - 0.01 && a <= w.a1 + 0.01;
    })).sort((a, b) => a.y0 - b.y0);
    let reach = s.y0;
    for (const w of behind) if (w.y0 <= reach + 0.01) reach = Math.max(reach, w.y1);
    assert.ok(behind.length && reach >= s.y1, `${s.name} hangs on a wall standing behind it to ${reach.toFixed(1)} m`);
  }
});

test('OCBC Centre: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('ocbc-centre');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the stacks reach into the slab behind them: each stack's ring overlaps the slab's
  const slab = kit.parts.find((p) => p.name === 'tower-slab');
  for (const p of kit.parts.filter((q) => /-offices$/.test(q.name))) {
    assert.ok(p.ring.some(([x, z]) => covers(slab.ring, x, z)), `${p.name} is fixed to the slab`);
  }
});

test('OCBC Centre stays finite, batched and free of flicker; solid where built', async () => {
  const { kit, at } = await siteModel('ocbc-centre');
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  for (const y of [1.5, 50, 100, 150, 197]) assert.ok(solidAt(OC.centre, y), `the slab is solid at ${y} m`);
  for (const y of [50, 150, 197]) assert.ok(solidAt(OC.coreEastIn, y) && solidAt(OC.coreWestIn, y), `the cores are solid at ${y} m`);
  for (const y of [1.5, 50, 150]) assert.ok(!solidAt(OC.coreEastOut, y) && !solidAt(OC.coreWestOut, y), `no invisible wall beyond the cores at ${y} m`);
  assert.ok(footprints.some((f) => f.h >= 196), 'the map has the tower at its height');
});
