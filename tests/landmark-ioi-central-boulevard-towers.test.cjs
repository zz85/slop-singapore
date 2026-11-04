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

// --- IOI Central Boulevard Towers (SG-045) -------------------------------------------------------------------------------
// Two unequal glass towers with notched corners and louvred crowns, the 48-storey West Tower (237.9 m) and the broad
// 16-storey East Tower (100.4 m), raised on columns over Central Green, the planted sky park with its jogging track on
// the roof of the six-storey podium; a four-storey block along Commerce Street with its own roof garden.

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
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, posts and railings aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
// ... and the same without the trees planted on the decks
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree-crown|trunk/.test(p.name));

const ID = { outline: 1206694672, centralSquare: 725993952, podium: 1075230981, block: 1206694673, west: 1075230983, east: 1075230982, westCore: 1075230987, eastCore: 1075230986 };
// heights (m), from the owner's stacking elevation (the West Tower's 237.9 m and the East Tower's 100.4 m from CTBUH):
// the sky park's deck on the six-storey podium, the towers' soffits over it, the four-storey block's roof garden, the
// tops of the towers' office floors (where the louvred crowns begin)
const H = { deck: 30, westSoffit: 42.5, eastSoffit: 45, block: 20.3, westCrown: 225.7, eastCrown: 88.3, west: 237.9, east: 100.4 };
// Points read off the mapped rings: the centroids of the West Tower (way 1075230983), of the grey parts at sky-park level
// under each tower (their cores, 1075230987 and 1075230986) and of the four-level part along Commerce Street
// (1206694673); halfway between the towers' mapped facing walls; 7 m in from the outline's east-south-east edge (beyond
// the East Tower, whose east face the stacking elevation puts 15 m short of that edge); inside each tower's outline
// between its mapped core and its long face; in the podium's mapped corner toward Raffles Quay and Central Boulevard;
// inside the West Tower's mapped corner notch by the north bridge; and on the pavements of Central Boulevard and
// Commerce Street, 12 m and 6.5 m off the outline
const IOI = {
  west: [103.8511883, 1.2800075], westCore: [103.8511674, 1.2800008], eastCore: [103.8516986, 1.2796945], block: [103.8514523, 1.2795475],
  gap: [103.8514167, 1.2798549], eseDeck: [103.8521024, 1.2794434], underWest: [103.8510232, 1.2798193], underEast: [103.8517926, 1.2797944],
  bulge: [103.8512231, 1.2803243], notch: [103.8514325, 1.2801371], outsideNNE: [103.8518898, 1.2799466], outsideSSW: [103.8515204, 1.2793685]
};

test('IOI Central Boulevard Towers replaces its outline, the podium, the four-level block, both towers and their cores, and nothing else', async () => {
  const { L, info } = await siteModel('ioi-central-boulevard-towers');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), Object.values(ID).sort((a, b) => a - b));
  assert.equal(info.name, 'IOI Central Boulevard Towers');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  // the two link bridges stay the city's, as do Marina Bay Suites across Central Boulevard and Asia Square
  for (const id of [1075230984, 1206694671, 393092728, 407941850]) assert.ok(!registered.hide.includes(id), `${id} is not hidden`);
});

test('IOI Central Boulevard Towers builds on its anchor to its documented 237.9 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('ioi-central-boulevard-towers');
  assert.equal(info.height, 237.9);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 0.5, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = siteOf(L).parts.find((p) => p.id === ID.outline).ring;
  for (const axis of [0, 1]) {
    const values = outline.map((p) => p[axis]), [lo, hi] = axis ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    assert.ok(lo >= Math.min(...values) - 1.5 && hi <= Math.max(...values) + 1.5, `within the mapped outline along ${axis ? 'z' : 'x'} (${lo.toFixed(1)}..${hi.toFixed(1)})`);
  }
});

test('IOI Central Boulevard Towers: two unequal towers, the West to 237.9 m and the broad East to 100.4 m, with notched corners', async () => {
  const { kit, at } = await siteModel('ioi-central-boulevard-towers');
  const top = ([lon, lat]) => { const [x, z] = at(lon, lat); return Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1)); };
  // inside each tower its roof, a little under the louvre screen round it, which reaches the documented height
  for (const [name, where, height] of [['west', IOI.west, H.west], ['east', IOI.eastCore, H.east]]) {
    assert.ok(top(where) <= height && top(where) >= height - 2.5, `${name}: the roof at ${top(where)} m`);
    const tallest = Math.max(...kit.parts.filter((p) => p.name.startsWith(`${name}-`)).map((p) => p.y1));
    assert.ok(Math.abs(tallest - height) < 0.01, `${name}: ${tallest} m to the top, ${height} documented`);
  }
  // both towers are glass boxes over their whole mapped plans: solid at mid-height over both cores' centroids
  for (const [name, where, y] of [['West', IOI.westCore, 150], ['East', IOI.eastCore, 70]]) {
    const [x, z] = at(...where);
    assert.ok(solidOver(kit, x, z, y - 1, y + 1).some((p) => p.name.startsWith(`${name.toLowerCase()}-shaft`)), `the ${name} Tower's shaft at ${y} m`);
  }
  // the West Tower's corner toward the north bridge is cut in, as mapped, all the way up
  const [nx, nz] = at(...IOI.notch);
  assert.equal(solidOver(kit, nx, nz, H.westSoffit, 400).length, 0, 'open in the mapped corner notch');
  // each tower is a single shaft between its soffit and its crown, the West's more than four times the East's height
  for (const [name, soffit, crown] of [['west', H.westSoffit, H.westCrown], ['east', H.eastSoffit, H.eastCrown]]) {
    const shaft = kit.parts.find((p) => p.name === `${name}-shaft`);
    assert.ok(shaft && Math.abs(shaft.y0 - soffit) < 0.01 && Math.abs(shaft.y1 - crown) < 0.01, `${name}-shaft from ${shaft?.y0} to ${shaft?.y1} m`);
    assert.ok(shaft.ring.length >= 12, `${name}: the four corners notched (${shaft.ring.length} corners)`);
  }
  assert.ok(H.westCrown - H.westSoffit > 4 * (H.eastCrown - H.eastSoffit));
});

test('IOI Central Boulevard Towers: the louvred crowns are screens of blades on posts rising past the roofs', async () => {
  const { kit } = await siteModel('ioi-central-boulevard-towers');
  for (const [name, crown, top] of [['west', H.westCrown, H.west], ['east', H.eastCrown, H.east]]) {
    const blades = kit.parts.filter((p) => p.name.startsWith(`${name}-crown-blade-`));
    assert.ok(blades.length >= 40, `${name}: ${blades.length} blades`);
    for (const p of blades) assert.ok(p.y0 >= crown && p.y1 <= top + 1e-6 && p.y1 - p.y0 < 0.5, `${p.name} a thin blade in the crown`);
    assert.ok(Math.abs(Math.max(...blades.map((p) => p.y1)) - top) < 0.01, `${name}: the top blade at the tower's top`);
    const roof = kit.parts.find((p) => p.name === `${name}-roof`);
    assert.ok(roof && roof.y1 < top - 0.3 && roof.y1 > top - 3, `${name}: the roof inside the screen, under its top (${roof?.y1})`);
    const posts = kit.parts.filter((p) => p.name.startsWith(`${name}-crown-post-`));
    assert.ok(posts.length >= 12 && posts.every((p) => Math.abs(p.y0 - crown) < 0.01), `${name}: ${posts.length} posts standing on the shaft`);
  }
});

test('IOI Central Boulevard Towers: Central Green, an open planted deck between, beyond and under the towers', async () => {
  const { kit, at } = await siteModel('ioi-central-boulevard-towers');
  const top = ([lon, lat]) => { const [x, z] = at(lon, lat); return Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1)); };
  for (const [what, where] of [['between the towers', IOI.gap], ['beyond the East Tower', IOI.eseDeck], ['in the corner toward Raffles Quay', IOI.bulge]]) {
    const t = top(where);
    assert.ok(t >= H.deck && t <= H.deck + 1, `${what}: the deck at ${t} m`);
    const [x, z] = at(...where);
    assert.equal(solidOver(kit, x, z, H.deck + 1, 400).length, 0, `${what}: open to the sky`);
  }
  // under the towers, between their cores and their columns, open from the deck to the soffits; the towers over them
  for (const [what, where, soffit] of [['West', IOI.underWest, H.westSoffit], ['East', IOI.underEast, H.eastSoffit]]) {
    const [x, z] = at(...where);
    assert.equal(solidOver(kit, x, z, H.deck + 1, soffit - 1).length, 0, `under the ${what} Tower: open`);
    assert.ok(solidOver(kit, x, z, soffit - 0.5, soffit + 5).length >= 1, `the ${what} Tower over it`);
    assert.ok(solidOver(kit, x, z, H.deck - 1, H.deck).length >= 1, `the deck under it`);
  }
  // the cores come down through the sky park as the mapped grey parts
  for (const [name, where, soffit] of [['west', IOI.westCore, H.westSoffit], ['east', IOI.eastCore, H.eastSoffit]]) {
    const core = kit.parts.find((p) => p.name === `${name}-core`);
    const [x, z] = at(...where);
    assert.ok(core && covers(core.ring, x, z) && Math.abs(core.y0 - H.deck) < 0.01 && core.y1 <= soffit && core.y1 >= soffit - 1, `${name}-core from the deck to the soffit`);
  }
  // the columns: from the deck up to each tower's soffit slab
  for (const [name, soffit, count] of [['west', H.westSoffit, 16], ['east', H.eastSoffit, 18]]) {
    const columns = kit.parts.filter((p) => p.name.startsWith(`${name}-column-`));
    assert.ok(columns.length >= count, `${name}: ${columns.length} columns`);
    const slab = kit.parts.find((p) => p.name === `${name}-soffit`);
    for (const p of columns) assert.ok(Math.abs(p.y0 - H.deck) < 0.01 && Math.abs(p.y1 - slab.y0) < 0.01 && slab.y1 === soffit, `${p.name} from the deck to the soffit`);
  }
  // planted: trees on the deck, and the jogging track winding round it, 200 m long
  const trees = kit.parts.filter((p) => /^park-.*tree-crown$/.test(p.name));
  assert.ok(trees.length >= 25 && trees.every((p) => p.y0 > H.deck && p.y0 < H.deck + 5), `${trees.length} trees on the deck`);
  const track = kit.parts.filter((p) => p.name.startsWith('park-track'));
  const perimeter = (ring) => ring.reduce((s, [x, z], i) => { const [a, b] = ring[(i + 1) % ring.length]; return s + Math.hypot(a - x, b - z); }, 0);
  const length = track.reduce((s, p) => s + perimeter(p.ring) / 2, 0);
  assert.ok(track.length >= 1 && length >= 170 && length <= 260, `the track about 200 m long (${Math.round(length)} m)`);
  for (const p of track) assert.ok(p.y0 >= H.deck - 0.01 && p.y1 <= H.deck + 0.6, `${p.name} laid on the deck`);
});

test('IOI Central Boulevard Towers: the four-storey block along Commerce Street carries the Level 5 roof garden, open to the sky', async () => {
  const { kit, at } = await siteModel('ioi-central-boulevard-towers');
  const [x, z] = at(...IOI.block);
  const under = solidOver(kit, x, z, 0, 400);
  const t = Math.max(...under.map((p) => p.y1));
  assert.ok(t >= H.block && t <= H.block + 1.5, `the roof garden at ${t} m`);
  assert.equal(solidOver(kit, x, z, H.block + 1.5, 400).length, 0, 'nothing over it');
  assert.ok(kit.parts.filter((p) => /^block-.*tree-crown$/.test(p.name)).length >= 4, 'small trees in its planters');
});

test('IOI Central Boulevard Towers: solid where built, free to walk the sky park, no invisible walls round it', async () => {
  const { kit, at } = await siteModel('ioi-central-boulevard-towers');
  const { colliders } = kit.finish();
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solidAt(IOI.gap, 15) && solidAt(IOI.gap, H.deck - 0.5), 'the podium is solid under the deck');
  for (const y of [H.deck + 2, H.deck + 6, H.deck + 11, 60, 150]) assert.ok(!solidAt(IOI.gap, y), `free between the towers at ${y} m`);
  for (const y of [H.deck + 2, H.deck + 6, H.westSoffit - 1.5]) assert.ok(!solidAt(IOI.underWest, y), `free under the West Tower at ${y} m`);
  for (const y of [H.deck + 2, H.deck + 8, H.eastSoffit - 1.5]) assert.ok(!solidAt(IOI.underEast, y), `free under the East Tower at ${y} m`);
  for (const y of [H.westSoffit + 2, 150, 230]) assert.ok(solidAt(IOI.underWest, y) && solidAt(IOI.west, y), `the West Tower solid at ${y} m`);
  for (const y of [H.eastSoffit + 2, 70, 99]) assert.ok(solidAt(IOI.underEast, y), `the East Tower solid at ${y} m`);
  assert.ok(!solidAt(IOI.eastCore, 105), 'nothing over the East Tower');
  assert.ok(solidAt(IOI.westCore, 35) && solidAt(IOI.eastCore, 35), 'the cores solid at sky-park level');
  for (const y of [H.deck + 2, 60]) assert.ok(!solidAt(IOI.eseDeck, y), `free over the deck beyond the East Tower at ${y} m`);
  assert.ok(solidAt(IOI.block, 10) && !solidAt(IOI.block, H.block + 2), 'the block solid to its roof garden');
  for (const y of [2, 15, 35, 100]) assert.ok(!solidAt(IOI.outsideNNE, y) && !solidAt(IOI.outsideSSW, y), `no invisible walls on the pavements at ${y} m`);
});

test('IOI Central Boulevard Towers: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('ioi-central-boulevard-towers');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    // a podium fin is fixed to the podium's wall that starts at its foot, beside it
    const wall = /^podium-fin-/.test(p.name) && parts.find((q) => /^(podium-fins|block)$/.test(q.name) && q.bounds.minY <= p.bounds.minY + 0.01 && q.bounds.maxY >= p.bounds.maxY && overlap(p.bounds, q.bounds));
    assert.ok(under || wall, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the towers in particular: each shaft on its soffit slab, the slab on its columns, the columns on the deck
  for (const name of ['west', 'east']) {
    const shaft = kit.parts.find((p) => p.name === `${name}-shaft`), slab = kit.parts.find((p) => p.name === `${name}-soffit`);
    assert.ok(Math.abs(shaft.y0 - slab.y1) < 0.01, `${name}: the shaft on its soffit slab`);
    const columns = kit.parts.filter((p) => p.name.startsWith(`${name}-column-`));
    assert.ok(columns.every((c) => Math.abs(c.y1 - slab.y0) < 0.01), `${name}: the slab on its columns`);
  }
});

test('IOI Central Boulevard Towers: its one sign, the IOI mark, hangs on the West Tower\'s crown toward Marina Bay, under the top', async () => {
  const { kit, at } = await siteModel('ioi-central-boulevard-towers');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.equal(signs.length, 1);
  const [s] = signs;
  assert.equal(s.logo, 'ioi');
  assert.ok(s.y0 >= H.westCrown && s.y1 <= H.west - 1, `in the crown, under the top (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
  // on the east-south-east face, the one toward the East Tower and the bay: a wall behind it, facing that way, standing
  // behind all of it, within the depth of the louvre screen
  const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
  const [ex, ez] = kit.compass(122.7);
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  const host = solids.filter((p) => /^west-crown/.test(p.name) && p.walls.some((w) => w.nx * ex + w.nz * ez > 0.99 && w.y0 <= s.y0 && w.y1 >= s.y1 && mx * w.nx + mz * w.nz - w.off > 0 && mx * w.nx + mz * w.nz - w.off < 2.5));
  assert.ok(host.length, 'on the West Tower\'s crown wall facing east-south-east');
  // its south-south-west half, as photographed
  const [wx, wz] = at(...IOI.west), [sx, sz] = kit.compass(212.7);
  assert.ok((mx - wx) * sx + (mz - wz) * sz > 5, 'toward the tower\'s south-south-west end');
});

test('IOI Central Boulevard Towers stays finite, batched and free of flicker', async () => {
  const { kit } = await siteModel('ioi-central-boulevard-towers');
  assert.ok(kit.triangles > 3000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb && [c.minY, c.maxY, c.minX, c.maxX].every(Number.isFinite));
  assert.ok(footprints.some((f) => f.h >= 230), 'the map has the West Tower at its height');
});
