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

// CapitaSpring (SG-004): the tower on its five-sided plot with the Green Oasis open between its residences and offices
// and the Sky Garden in the screen of fins on its roof; the podium the length of the old Golden Shoe car park's strip,
// lifted over the City Room at its south end
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
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs and beams — fins, slats — aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
// the distance from (x, z) to a ring's nearest edge
const edgeDistance = (ring, x, z) => Math.min(...ring.map((a, i) => {
  const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2));
  return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t);
}));

async function capitaSpring() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'capitaspring');
  assert.ok(L, 'CapitaSpring has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/capitaspring.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // a lon/lat as a point about the anchor, then in the world
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  return { kit, L, info, at, ms, tower: ring(1157548672), outline: ring(694047464) };
}
// independently located points (lon, lat), from the OSM outline and the photographs
const CS = {
  roundEnd: [103.85015, 1.28350], // the round south end of the podium, over the City Room
  cityRoom: [103.8501050, 1.2836560], // 8 m in under the tower's south-east face, in the City Room
  lobbies: [103.85000, 1.28390], // the middle of the tower's plot
  oasis: [103.8499046, 1.2837860], // 4 m in from the middle of the tower's Church Street face
  skyWalk: [103.8498891, 1.2837769], // 2 m in from it: the Sky Garden's walk inside the crown's fins
  tailMiddle: [103.85015, 1.28445], // the podium's tail along Market Street
  tailNorth: [103.85025, 1.28490], // by Chulia Street
  overhang: [103.8502490, 1.28415] // 1 m in from the tail's Market Street edge, on the ground
};
const H = { podium: 47, oasis: 73.5, oasisTop: 104, offices: 252, garden: 259, crown: 280 };
const solidTop = (kit, x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).filter((p) => !/tree|trunk/.test(p.name)).map((p) => p.y1));

test('CapitaSpring replaces its outline, the podium and the tower, and nothing else', async () => {
  const { L, info } = await capitaSpring();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [694047464, 1157548671, 1157548672]);
  assert.equal(info.name, 'CapitaSpring');
  assert.equal(info.height, 280);
});

test('CapitaSpring: built on its anchor to 280 m in a moment, on its mapped outline', async () => {
  const { kit, ms, outline } = await capitaSpring();
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - 280) <= 3, `${b.maxY} m tall, 280 documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const mid = [(p.bounds.minX + p.bounds.maxX) / 2, (p.bounds.minZ + p.bounds.maxZ) / 2];
    assert.ok(covers(outline, ...mid) || edgeDistance(outline, ...mid) < 2.5, `${p.name} stands on the outline`);
  }
});

test('CapitaSpring: the tower in bands — residences, the open Green Oasis, offices, and the Sky Garden in its fins', async () => {
  const { kit, at } = await capitaSpring();
  const [lx, lz] = at(...CS.lobbies);
  assert.ok(builtOver(kit, lx, lz, 50, 70).length >= 1, 'the residences over the podium');
  assert.ok(builtOver(kit, lx, lz, 120, 240).length >= 1, 'the offices over the Green Oasis');
  assert.ok(Math.abs(solidTop(kit, lx, lz) - 268) <= 4, `the restaurant pavilion in the middle of the Sky Garden (${solidTop(kit, lx, lz)})`);
  // the Green Oasis: open from its floor to the first terrace a few metres in from the fins
  const [ox, oz] = at(...CS.oasis);
  assert.equal(builtOver(kit, ox, oz, H.oasis + 0.6, H.oasis + 6.8).length, 0, 'the Green Oasis is open behind its fins');
  assert.ok(builtOver(kit, ox, oz, H.oasis - 1, H.oasis).length >= 1, 'on the residences\' roof');
  assert.ok(builtOver(kit, ox, oz, H.oasisTop - 0.5, H.oasisTop + 5).length >= 1, 'under the offices');
  const terraces = kit.parts.filter((p) => /^oasis-terrace-/.test(p.name));
  assert.ok(new Set(terraces.map((p) => p.y1.toFixed(1))).size >= 3, 'planted terraces at three levels winding round the core');
  assert.ok(terraces.every((p) => p.y0 > H.oasis && p.y1 < H.oasisTop), 'all within the Green Oasis');
  assert.ok(kit.parts.filter((p) => /^oasis.*tree-crown$/.test(p.name)).length >= 8, 'trees in the Green Oasis');
  assert.ok(kit.parts.some((p) => p.name === 'oasis-core' && p.y0 <= H.oasis && p.y1 >= H.oasisTop - 1), 'the core carries the offices across it');
  assert.ok(kit.parts.filter((p) => /^oasis-column-/.test(p.name) && p.y1 >= H.oasisTop - 1).length >= 12, 'a ring of columns carries them too');
  // the Sky Garden: open to the sky inside the crown's fins, over the plant storey
  const [sx, sz] = at(...CS.skyWalk);
  assert.equal(builtOver(kit, sx, sz, H.garden + 0.2, H.crown + 1).length, 0, 'the Sky Garden\'s walk is open to the sky');
  assert.ok(builtOver(kit, sx, sz, H.garden - 1, H.garden).length >= 1, 'on the plant storey');
  assert.ok(kit.parts.filter((p) => /^sky-garden-bed-\d+$/.test(p.name)).length >= 12, 'terraced beds spiral up round the pavilion');
});

test('CapitaSpring: the Green Oasis\'s fins part in lenses, every one fixed at both ends', async () => {
  const { kit, tower } = await capitaSpring();
  const chains = (prefix) => {
    const out = new Map();
    for (const p of kit.parts.filter((q) => q.type === 'beam' && q.name.startsWith(prefix))) {
      const k = p.name.slice(prefix.length).split('-')[0];
      if (!out.has(k)) out.set(k, []);
      out.get(k).push(p);
    }
    return [...out.values()];
  };
  const oasis = chains('oasis-fin-'), crown = chains('crown-fin-');
  assert.ok(oasis.length >= 120, `fins all round the Green Oasis (${oasis.length})`);
  for (const fin of oasis) {
    assert.ok(Math.min(...fin.map((p) => p.y0)) <= H.oasis + 0.1 && Math.max(...fin.map((p) => p.y1)) >= H.oasisTop - 0.8, 'each Green Oasis fin spans it, fixed to the slab edges');
  }
  assert.ok(oasis.filter((f) => f.length > 3).length >= 40, 'lenses open the Green Oasis');
  // the crown's real fins are the ones bending round its openings, from the band at its foot to the ring beam
  assert.ok(crown.length >= 20 && crown.every((f) => f.length > 3), `bent fins round the crown's openings (${crown.length})`);
  for (const fin of crown) {
    assert.ok(Math.min(...fin.map((p) => p.y0)) <= H.offices + 0.4 && Math.max(...fin.map((p) => p.y1)) >= H.crown - 0.8, 'each rises from the offices\' top to the ring beam');
  }
  // none strays from the walls: every end lies within the fins' depth of the tower's outline
  for (const p of kit.parts.filter((q) => q.type === 'beam' && /^(oasis|crown)-fin-/.test(q.name))) {
    for (const [x, z] of p.ring) assert.ok(edgeDistance(tower, x, z) < 0.5, `${p.name} is on the tower's wall`);
  }
  assert.ok(kit.parts.filter((p) => /^crown-corner-fin-/.test(p.name)).length >= 10, 'fins bowing out at the crown\'s corners');
  assert.ok(kit.parts.filter((p) => /^crown-top-band-/.test(p.name)).length >= 5, 'a ring beam round the top holds them');
});

test('CapitaSpring: the crown is the fin screen carried up past the offices, a lattice cut by teardrop openings', async () => {
  const { kit, tower } = await capitaSpring();
  const screen = kit.parts.filter((p) => /^crown-screen-/.test(p.name));
  // a thin panel on the wall line of every face, from the offices' top to the ring beam
  for (const p of screen) for (const [x, z] of p.ring) assert.ok(edgeDistance(tower, x, z) < 0.4, `${p.name} stands on the tower's wall line`);
  assert.ok(Math.min(...screen.map((p) => p.y0)) <= H.offices + 0.3 && Math.max(...screen.map((p) => p.y1)) >= H.crown - 0.6, 'from the offices\' top to the ring beam');
  // how much of each face the panel covers at a height (its outer slabs' areas over their thickness)
  const area = (r) => Math.abs(r.reduce((m, [x, z], i) => { const [u, v] = r[(i + 1) % r.length]; return m + x * v - u * z; }, 0)) / 2;
  const covered = (face, y) => screen.filter((p) => p.name.startsWith(`crown-screen-${face}-`) && p.name.endsWith('-0') && p.y0 < y && p.y1 > y).reduce((m, p) => m + area(p.ring) / 0.15, 0);
  for (let face = 0; face < tower.length; face++) {
    const L = Math.hypot(tower[(face + 1) % tower.length][0] - tower[face][0], tower[(face + 1) % tower.length][1] - tower[face][1]);
    assert.ok(covered(face, H.offices + 3) > L - 1.5, `face ${face}: the lattice runs the whole face under the openings (${covered(face, H.offices + 3).toFixed(1)} of ${L.toFixed(1)} m)`);
    assert.ok(covered(face, 268) < covered(face, H.offices + 3) - 3, `face ${face}: teardrop openings cut it near the top (${covered(face, 268).toFixed(1)} m)`);
  }
  // seen from the garden too: two thin slabs back to back
  assert.ok(screen.some((p) => p.name.endsWith('-0')) && screen.some((p) => p.name.endsWith('-1')), 'painted on both faces');
});

test('CapitaSpring: the podium runs the whole strip to Chulia Street, lifted over the City Room, set back over a walkway', async () => {
  const { kit, at } = await capitaSpring();
  for (const where of ['tailMiddle', 'tailNorth', 'roundEnd']) {
    const [x, z] = at(...CS[where]);
    assert.ok(Math.abs(solidTop(kit, x, z) - H.podium) <= 1.5, `the podium's roof garden at ${H.podium} m over the ${where} (${solidTop(kit, x, z)})`);
  }
  for (const where of ['roundEnd', 'cityRoom']) {
    const [x, z] = at(...CS[where]);
    assert.equal(builtOver(kit, x, z, 0.5, 17.4).length, 0, `the City Room is open under the podium (${where})`);
    assert.ok(builtOver(kit, x, z, 18, 46).length >= 1, `the podium over it (${where})`);
  }
  const [vx, vz] = at(...CS.overhang);
  assert.equal(builtOver(kit, vx, vz, 0.5, 5.5).length, 0, 'the walkway under the tail\'s overhang is open');
  assert.ok(kit.parts.filter((p) => /^city-room-column-/.test(p.name)).length >= 3, 'columns carry the tower\'s end over the City Room');
  assert.ok(kit.parts.some((p) => p.name === 'podium-pool'), 'the residents\' lap pool on the roof garden');
});

test('CapitaSpring: signs only where the building carries them, on its walls under the roofline', async () => {
  const { kit, tower } = await capitaSpring();
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.deepEqual(Array.from(signs, (s) => s.name).sort(), ['sign:capitaland-e', 'sign:capitaland-sw', 'sign:citadines']);
  for (const s of signs.filter((q) => /capitaland/.test(q.name))) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    assert.ok(edgeDistance(tower, mx, mz) < 1, `${s.name} hangs on the tower's wall`);
    assert.ok(s.y1 <= H.offices && s.y0 >= H.offices - 10, `${s.name} under the crown (${s.y0}–${s.y1})`);
  }
  const cit = signs.find((s) => s.name === 'sign:citadines');
  const host = kit.parts.find((p) => p.name === 'podium-round-end');
  const [cx, cz] = [(cit.ring[0][0] + cit.ring[1][0]) / 2, (cit.ring[0][1] + cit.ring[1][1]) / 2];
  assert.ok(edgeDistance(host.ring, cx, cz) < 1.5 && cit.y0 >= host.y0 && cit.y1 <= host.y1, 'Citadines\' name on the round end over the City Room');
});

test('CapitaSpring stays finite, batched and free of flicker; solid where it is built, open where it is not', async () => {
  const { kit, at } = await capitaSpring();
  assert.ok(kit.triangles > 10000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  const materials = new Set(kit.parts.filter((p) => p.type !== 'sign').map((p) => p.material));
  const signMaterials = new Set(kit.parts.filter((p) => p.type === 'sign').map((p) => p.material));
  assert.ok(materials.size + signMaterials.size <= 16, `${materials.size} + ${signMaterials.size} materials`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solid = (where, y) => { const [, , x, z] = at(...CS[where]); return colliderAt(colliders, x, y, z); };
  assert.ok(solid('lobbies', 30) && solid('lobbies', 60) && solid('lobbies', 150) && solid('lobbies', 255), 'the tower is solid up its height');
  assert.ok(solid('tailMiddle', 30) && solid('tailNorth', 30), 'the podium is solid along the strip');
  assert.ok(solid('roundEnd', 30) && solid('cityRoom', 30), 'and over the City Room');
  assert.ok(!solid('roundEnd', 8) && !solid('cityRoom', 8), 'the City Room is walkable');
  assert.ok(!solid('overhang', 3) && solid('overhang', 20), 'and the walkway under the overhang');
  assert.ok(!solid('oasis', 77), 'the Green Oasis is open to fly into');
  assert.ok(solid('skyWalk', H.garden - 2) && !solid('skyWalk', H.garden + 8), 'the Sky Garden\'s floor stops a descent, the air over it does not');
  assert.ok(!solid('tailMiddle', 60), 'nothing invisible over the roof garden');
  // the Green Oasis's terraces are solid to stand on
  const terrace = kit.parts.find((p) => /^oasis-terrace-/.test(p.name));
  const [tx, tz] = [terrace.ring.reduce((m, q) => m + q[0], 0) / 4 + kit.anchor.x, terrace.ring.reduce((m, q) => m + q[1], 0) / 4 + kit.anchor.z];
  assert.ok(colliderAt(colliders, tx, terrace.y1 - 0.3, tz), 'a terrace stops a descent');
  assert.ok(footprints.some((f) => f.h >= 250), 'the map has the tower at its height');
});
