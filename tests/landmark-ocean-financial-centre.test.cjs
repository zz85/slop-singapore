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

// Ocean Financial Centre: a sail of a tower whose crown curves down toward the south-west, a lower slab wrapped round
// its plaza side, its lobby behind columns over a drop-off, and a folded glass canopy on one white column over the plaza
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
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, posts and rafters aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));

async function ofcModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'ocean-financial-centre');
  assert.ok(L, 'Ocean Financial Centre has its own mapped landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${L.model}.js`)).href);
  const kit = createKit({ anchor: { x: L.x, z: L.z }, name: L.id });
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
// places on the map (lon, lat), located from the Esri aerial and the OSM outlines independently of the program
const OFC = {
  towerBay: [103.852299, 1.283247], towerMiddle: [103.852021, 1.283084], towerSW: [103.851794, 1.282972],
  slabSliver: [103.851841, 1.283209], slabEnd: [103.851720, 1.282967], plaza: [103.851706, 1.283310], plazaSouth: [103.851751, 1.283202],
  dropOff: [103.852084, 1.282985], passage: [103.852245, 1.283313], link: [103.852066, 1.283301], podium: [103.851976, 1.283491],
  arcade: [103.852156, 1.283627], arcadeSouth: [103.851886, 1.283672],
  bayEnd: [103.852330, 1.283262], bowedMiddle: [103.852103, 1.282957], swEnd: [103.851770, 1.282959] // on the tower's faces
};

test('Ocean Financial Centre replaces its outline, tower, slab, podium and canopy, and not The Arcade', async () => {
  const { L, info } = await ofcModel();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [46595387, 172915346, 1566589605, 1566589606, 1566589607, 1566589608]);
  for (const id of [171999284, 172915362, 1566589603, 1566589604]) assert.ok(!L.parts.some((p) => p.id === id), `The Arcade's way ${id} stays with the city`);
  assert.equal(info.name, 'Ocean Financial Centre');
});

test('Ocean Financial Centre builds on its anchor to its documented 245 m, nothing on The Arcade', async () => {
  const { kit, info, at, ms } = await ofcModel();
  assert.equal(info.height, 245);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 3, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  assert.ok(Math.max(Math.abs(b.minX), Math.abs(b.maxX), Math.abs(b.minZ), Math.abs(b.maxZ)) < 120, 'within its site');
  for (const where of [OFC.arcade, OFC.arcadeSouth]) {
    const [x, z] = at(...where);
    assert.equal(builtOver(kit, x, z, 1, 400).length, 0, 'The Arcade next door is left to the city');
  }
});

test('Ocean Financial Centre: the tower\'s crown curves down 30 m from the bay end, over the 195 m slab', async () => {
  const { kit, at } = await ofcModel();
  const top = (where) => { const [x, z] = at(...where); return Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1)); };
  // the crown's screen over a point on the tower's face: the highest piece of it within 1.5 m
  const screen = (where) => {
    const [x, z] = at(...where);
    return Math.max(0, ...kit.parts.filter((p) => /^crown-screen-/.test(p.name) && x > p.bounds.minX - 1.5 && x < p.bounds.maxX + 1.5 && z > p.bounds.minZ - 1.5 && z < p.bounds.maxZ + 1.5).map((p) => p.y1));
  };
  const bay = screen(OFC.bayEnd), middle = screen(OFC.bowedMiddle), sw = screen(OFC.swEnd);
  assert.ok(Math.abs(bay - 245) <= 1, `the bay end at 245 m (${bay})`);
  assert.ok(Math.abs(sw - 215) <= 3, `the south-west end about 30 m lower (${sw})`);
  assert.ok(middle > (bay + sw) / 2 + 2 && middle < bay - 4, `curved, not straight: the middle of the bowed face nearer the bay end's height (${middle})`);
  assert.ok(top(OFC.towerMiddle) > 220, 'the crown is solid roofed inside, over the gardens');
  // the slab's roof, its glass parapet up to the mapped 195 m
  for (const where of [OFC.slabSliver, OFC.slabEnd]) assert.ok(top(where) >= 189 && top(where) <= 195, `the slab's roof under 195 m (${top(where)})`);
  const parapet = kit.parts.filter((p) => /^slab-parapet-/.test(p.name));
  assert.ok(parapet.length >= 3 && parapet.every((p) => Math.abs(p.y1 - 195) < 0.01), 'the slab\'s parapet to 195 m');
  // the crown is a screen with a roof of solar panels inside it, and the screen's top falls along the tower
  const screens = kit.parts.filter((p) => /^crown-screen-/.test(p.name));
  assert.ok(screens.length >= 12, `${screens.length} pieces of the crown's screen`);
  assert.ok(kit.parts.some((p) => p.name === 'crown-gardens'), 'the garden storeys and the solar roof inside the crown');
  assert.ok(kit.parts.filter((p) => /^bay-fin-/.test(p.name)).length >= 3, 'vertical fins on the bay end');
});

test('Ocean Financial Centre keeps the plaza, the drop-off and the passage open, under a canopy on a column', async () => {
  const { kit, at } = await ofcModel();
  const { colliders } = kit.finish();
  for (const [name, where, clear] of [['the plaza', OFC.plaza, 23], ['the plaza by the slab', OFC.plazaSouth, 23], ['the drop-off', OFC.dropOff, 11.5], ['the passage to Collyer Quay', OFC.passage, 13]]) {
    const [x, z, wx, wz] = at(...where);
    assert.equal(builtOver(kit, x, z, 0.5, clear).length, 0, `${name}: nothing built from the paving to ${clear} m`);
    for (const y of [2, clear / 2, clear - 0.5]) assert.ok(!colliderAt(colliders, wx, y, wz), `${name}: clear to walk and fly at ${y} m`);
  }
  // the canopy over the plaza: high and solid to land on, held by its column, the slab and the green walls
  const [px, pz, pwx, pwz] = at(...OFC.plaza);
  const roof = builtOver(kit, px, pz, 20, 60).filter((p) => /^canopy-/.test(p.name));
  assert.ok(roof.length === 1 && roof[0].y0 > 24 && roof[0].y1 < 42, 'the canopy over the plaza between 24 and 42 m');
  assert.ok(colliderAt(colliders, pwx, (roof[0].y0 + roof[0].y1) / 2, pwz), 'the canopy stops descent');
  const column = kit.parts.find((p) => p.name === 'canopy-column');
  const lowest = Math.min(...kit.parts.filter((p) => /^canopy-(west|south|north)-/.test(p.name)).map((p) => p.y0));
  assert.ok(column.y0 <= 0.5 && column.y1 >= lowest - 0.05, 'the column stands on the plaza and reaches the canopy\'s low point');
  const walls = kit.parts.filter((p) => /^green-wall-/.test(p.name));
  assert.ok(walls.length >= 3, 'the green wall on the podium');
  assert.ok(Math.max(...walls.map((p) => p.y1)) >= 35, 'the green wall rises under the canopy\'s high corner');
  // the elevated parts are solid: the tower above its lobby, the link over the passage, the podium
  for (const [name, where, y] of [['the tower', OFC.towerMiddle, 150], ['the crown', OFC.towerBay, 235], ['the slab', OFC.slabEnd, 100], ['the link', OFC.link, 17], ['the podium', OFC.podium, 10], ['over the drop-off', OFC.dropOff, 20]]) {
    const [, , wx, wz] = at(...where);
    assert.ok(colliderAt(colliders, wx, y, wz), `${name} is solid at ${y} m`);
  }
});

test('Ocean Financial Centre: Keppel\'s marks hang on the crown, the name on a low plinth, each on a wall under its top', async () => {
  const { kit } = await ofcModel();
  const signs = kit.parts.filter((p) => p.type === 'sign');
  const crown = signs.filter((s) => s.logo === 'keppel'), plinth = signs.filter((s) => s.name === 'sign:ocean-financial-centre');
  assert.equal(crown.length, 2, 'Keppel\'s mark toward the bay and toward Raffles Place');
  assert.equal(plinth.length, 1, 'the building\'s name on its plinth');
  assert.ok(!signs.some((s) => s.logo === 'anz'), 'ANZ moved to Marina One in October 2026: its sign is gone');
  assert.equal(signs.length, 3);
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const host = solids.filter((p) => p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 1 && w.y0 <= s.y0 && w.y1 >= s.y1));
    assert.ok(host.length, `${s.name} hangs on a wall that stands behind all of it`);
  }
  for (const s of crown) assert.ok(s.y1 < 245 && s.y0 > 220, `${s.name} on the crown, under its top (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
  const block = kit.parts.find((p) => p.name === 'plinth');
  assert.ok(plinth[0].y0 > 0.1 && plinth[0].y1 < block.y1, 'the name within the plinth\'s height, not over it');
  const width = Math.hypot(plinth[0].ring[1][0] - plinth[0].ring[0][0], plinth[0].ring[1][1] - plinth[0].ring[0][1]);
  assert.ok(width <= 11.5, `a small sign (${width.toFixed(1)} m)`);
});

test('Ocean Financial Centre: thick stainless columns stand clear in front of the lobby wall', async () => {
  const { kit } = await ofcModel();
  const columns = kit.parts.filter((p) => /^column-/.test(p.name));
  assert.ok(columns.length >= 15, `${columns.length} columns`);
  const lobby = kit.parts.find((p) => p.name === 'lobby');
  for (const c of columns) {
    const d = c.bounds.maxX - c.bounds.minX;
    assert.ok(d >= 1.5 && d <= 1.9, `${c.name} about 1.8 m round (${d.toFixed(2)})`);
    assert.ok(c.ring.length >= 16, 'round enough to read as round');
    const [cx, cz] = [(c.bounds.minX + c.bounds.maxX) / 2, (c.bounds.minZ + c.bounds.maxZ) / 2];
    assert.ok(!covers(lobby.ring, cx, cz), `${c.name} stands outside the lobby wall`);
  }
  // the name's plinth: low, before the columns (the drop-off behind it stays open: the test above)
  const block = kit.parts.find((p) => p.name === 'plinth');
  assert.ok(block.y1 <= 2, 'a low plinth');
});

test('Ocean Financial Centre stays finite, batched and free of flicker', async () => {
  const { kit } = await ofcModel();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  const materials = new Set([...kit.parts.map((p) => p.material)]);
  assert.ok(materials.size <= 16, `${materials.size} materials`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  assert.ok(footprints.some((f) => f.h >= 190), 'the map has the tower at its height');
});
