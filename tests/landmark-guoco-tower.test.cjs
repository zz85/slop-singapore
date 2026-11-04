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

// --- Guoco Tower (SG-080) ---------------------------------------------------------------------------------------------
// Tanjong Pagar Centre: the 64-storey tower on the east of the podium — the offices' south block rising to the
// two-thirds setback under the residents' pergola, its south face leaning in as it rises; the Wallich Residence's north
// block on to the top, a notch between them over a lower seam; the north strip stepped back for the top 30 m; on the
// residence's south face stacks of balconies, white fins and a sawtooth of glass fins over the roof, the GuocoLand mark
// under it; the sky frame in the east face near the top. West of it, on the six-storey podium with its roof garden and
// the hotel's pool, the free-standing Sofitel; south of it, over the Urban Park, the City Room's glass canopy on its
// copper trees; on the east, the drop-off canopy.

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
const edgeDistance = (ring, x, z) => Math.min(...ring.map((a, i) => {
  const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2));
  return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t);
}));
async function guoco() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'guoco-tower');
  assert.ok(L, 'Guoco Tower has its own mapped landmark anchor');
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
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  return { kit, L, info, at, ms, ring, GEO };
}
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs and beams — fins, frames, branches —
// aside), and the same without the trees
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree|trunk/.test(p.name));
const topAt = (kit, x, z) => Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 393100845 the office part, 393100848 the Wallich Residence, 393100849 the
// podium, 393100850 the hotel) and the aerial, in the building's frame (along 84° and 354°): the residence's middle and
// its north strip; the offices' south block and 2 m in from the foot of its south face; the notch between the south
// block and the residence; the podium's roof south of the hotel, 0.8 m in from its south edge and its north-west corner;
// the hotel's middle and the gap between it and the tower; the City Room under its canopy (its middle and its corner by
// the tower's south-west corner) and the Urban Park west of it; the drop-off by the east face and 0.9 m inside that
// face at its foot
const G = {
  resMid: [103.8456733, 1.2771588], resNorth: [103.8456638, 1.2772497],
  southBlock: [103.8457019, 1.2768845], southFoot: [103.8457091, 1.2768152], notch: [103.8456890, 1.2770077],
  podium: [103.8451709, 1.2768647], podiumEdge: [103.8451833, 1.2767460], podiumNorth: [103.8449725, 1.2772075],
  sofitel: [103.8452086, 1.2771097], hotelGap: [103.8453936, 1.2771292],
  cityRoom: [103.8457950, 1.2765124], cityRoomWest: [103.8455161, 1.2766739], parkWest: [103.8452979, 1.2765144],
  dropOff: [103.8459984, 1.2769522], lobby: [103.8459689, 1.2769491]
};
// heights (m): CTBUH's architectural top; the residence's roof under its crown; the north strip's step; the offices'
// south block (the two-thirds setback); the seam; the podium; the hotel's body and CTBUH's top; the City Room's 15 m
// ceiling; the drop-off canopy
const H = { top: 283.7, roof: 280, step: 250, offices: 168, seam: 166, podium: 30, hotel: 101, hotelTop: 105.3, cityRoom: 15, dropOff: 9.5 };

test('Guoco Tower replaces its podium, office, residence and hotel parts and the stale outline under the City Room, and nothing else', async () => {
  const { L, info } = await guoco();
  // 117052184 is an untagged "public building" outline where the aerials show only the City Room canopy's glass
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [117052184, 393100845, 393100848, 393100849, 393100850]);
  assert.equal(info.name, 'Guoco Tower');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  // Maxwell Chambers, the Tanjong Pagar MRT station's ways, the roof in the park, the Peck Seah Street shophouses stay
  // the city's
  for (const id of [393100846, 117052185, 117052186, 172263091, 172892301, 172892303, 172892305]) assert.ok(!registered.hide.includes(id), `${id} stays the city's`);
});

test('Guoco Tower builds on its anchor to its documented 283.7 m, on its podium and the City Room, in a moment', async () => {
  const { kit, info, ms, ring, at } = await guoco();
  assert.equal(info.height, 283.7);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  assert.ok(Math.abs(b.maxY - H.top) <= 0.3, `${b.maxY} m tall, ${H.top} documented`);
  // everything on the mapped podium (the drop-off canopy reaching a little past its east edge) or under the City Room's
  // canopy over the park south of it
  const podium = ring(393100849);
  const room = kit.parts.find((p) => p.name === 'city-room-canopy');
  assert.ok(room, 'the City Room canopy');
  for (const p of kit.parts.filter((q) => q.type !== 'sign')) {
    const mid = [(p.bounds.minX + p.bounds.maxX) / 2, (p.bounds.minZ + p.bounds.maxZ) / 2];
    const onPodium = covers(podium, ...mid) || edgeDistance(podium, ...mid) < 2.5;
    const inRoom = covers(room.ring, ...mid) || edgeDistance(room.ring, ...mid) < 1;
    assert.ok(onPodium || inRoom, `${p.name} stands on the podium or in the City Room`);
  }
  // the City Room's canopy lies in the park, south of the podium, over the independently located middle of the room
  const [cx, cz] = at(...G.cityRoom), [wx, wz] = at(...G.cityRoomWest);
  assert.ok(!covers(podium, cx, cz) && covers(room.ring, cx, cz) && covers(room.ring, wx, wz), 'the canopy over the City Room');
});

test('Guoco Tower: the offices\' south block stops at the two-thirds setback under the pergola; the residence rises on to the top', async () => {
  const { kit, at } = await guoco();
  const [sx, sz] = at(...G.southBlock), [rx, rz] = at(...G.resMid), [nx, nz] = at(...G.resNorth), [hx, hz] = at(...G.notch);
  assert.ok(Math.abs(topAt(kit, sx, sz) - H.offices) <= 1.5, `the south block's roof deck at ${topAt(kit, sx, sz)} m`);
  assert.equal(solidOver(kit, sx, sz, H.offices + 8, 400).length, 0, 'open over the pergola');
  const pergola = kit.parts.filter((p) => /^pergola-/.test(p.name));
  assert.ok(pergola.length >= 12 && pergola.every((p) => p.bounds.minY >= H.offices - 0.5 && p.bounds.maxY <= H.offices + 8), `the pergola's frame on the roof (${pergola.length})`);
  // the residence: its roof at 280 m under the crown, its north strip stepped back 30 m lower
  assert.ok(Math.abs(topAt(kit, rx, rz) - H.roof) <= 1, `the residence's roof at ${topAt(kit, rx, rz)} m`);
  for (const y of [100, 200, 270]) assert.ok(solidOver(kit, rx, rz, y - 1, y).length, `built at ${y} m`);
  assert.ok(Math.abs(topAt(kit, nx, nz) - H.step) <= 1, `the north strip stepped at ${topAt(kit, nx, nz)} m`);
  // the notch between the south block and the residence over the lower seam: open from the seam's top
  assert.ok(Math.abs(topAt(kit, hx, hz) - H.seam) <= 1, `the seam's top at ${topAt(kit, hx, hz)} m`);
  assert.equal(solidOver(kit, hx, hz, H.seam + 1, 400).length, 0, 'the notch is open');
  // the dark sky-garden band at the residence's foot, recessed
  assert.ok(kit.parts.some((p) => p.name === 'tower-sky-band' && p.y0 >= 160 && p.y1 <= 176), 'the dark band under the residence');
});

test('Guoco Tower: the south block\'s south face leans in as it rises, and the tower is solid up its height', async () => {
  const { kit, at } = await guoco();
  const { colliders } = kit.finish();
  const solid = (where, y) => { const [, , x, z] = at(...G[where]); return colliderAt(colliders, x, y, z); };
  assert.ok(solid('southFoot', 40) && !solid('southFoot', 160), 'the south face 2 m further in near its top than at its foot');
  const block = kit.parts.find((p) => p.name === 'tower-south-block');
  assert.ok(block && block.type === 'loft', 'the south block is a loft');
  // the pergola stands on the leaning face's top: its south posts 4–6 m north of the face's foot (2–4 m north of the
  // point 2 m in from it)
  const [fx, fz] = at(...G.southFoot), [bx, bz] = at(...G.southBlock);
  const north = [bx - fx, bz - fz], L = Math.hypot(...north), n = [north[0] / L, north[1] / L];
  const southPosts = kit.parts.filter((p) => /^pergola-post-s/.test(p.name));
  assert.ok(southPosts.length >= 4, 'posts along the south edge');
  for (const p of southPosts) {
    const off = ((p.bounds.minX + p.bounds.maxX) / 2 - fx) * n[0] + ((p.bounds.minZ + p.bounds.maxZ) / 2 - fz) * n[1];
    assert.ok(off >= 2 && off <= 4, `${p.name} ${off.toFixed(1)} m north of the point 2 m in from the face's foot`);
  }
  for (const y of [20, 100, 160]) assert.ok(solid('southBlock', y), `the south block solid at ${y} m`);
  assert.ok(!solid('southBlock', 190), 'nothing over the pergola');
  for (const y of [20, 120, 200, 275]) assert.ok(solid('resMid', y), `the residence solid at ${y} m`);
  assert.ok(solid('resNorth', 240) && !solid('resNorth', 260), 'the north strip stops at its step');
  assert.ok(solid('notch', 150) && !solid('notch', 172) && !solid('notch', 220), 'the notch is free to fly into');
});

test('Guoco Tower: the residence\'s south face — balcony stacks, white fins, the sawtooth crown and the GuocoLand mark under it', async () => {
  const { kit, ring } = await guoco();
  const home = ring(393100848);
  const stacks = kit.parts.filter((p) => /^balcony-/.test(p.name));
  assert.ok(stacks.length >= 8, `${stacks.length} balcony stacks`);
  assert.ok(new Set(stacks.map((p) => Math.round(p.y0))).size >= 4, 'staggered from column to column');
  for (const p of stacks) assert.ok(p.y0 >= 172 && p.y1 <= H.roof - 15, `${p.name} on the residence's floors`);
  // the sawtooth: glass fins standing on the roof's south edge, each rising to the architectural top at one end
  const teeth = kit.parts.filter((p) => /^crown-tooth-/.test(p.name));
  assert.ok(teeth.length >= 6, `${teeth.length} teeth`);
  for (const p of teeth) {
    assert.ok(Math.abs(p.y0 - H.roof) < 0.01 && Math.abs(p.bounds.maxY - H.top) <= 0.05, `${p.name} from the roof to the top`);
    assert.equal(typeof p.y1, 'number');
  }
  const fins = kit.parts.filter((p) => /^crown-fin-/.test(p.name));
  assert.ok(fins.length >= teeth.length, 'a white fin at every fold');
  for (const p of fins) assert.ok(p.bounds.maxY <= H.top + 0.01 && p.bounds.minY >= 230, `${p.name} down the face from the top`);
  // the screens round the other three sides of the crown
  assert.ok(kit.parts.filter((p) => /^crown-screen-/.test(p.name)).length >= 3, 'screens round the crown');
  // the GuocoLand mark: on the residence's south face, near its west end, under the roofline
  const signs = kit.parts.filter((p) => p.type === 'sign');
  const mark = signs.find((s) => s.name === 'sign:guocoland');
  assert.ok(mark && mark.logo === 'guocoland', 'the GuocoLand mark');
  const [mx, mz] = [(mark.ring[0][0] + mark.ring[1][0]) / 2, (mark.ring[0][1] + mark.ring[1][1]) / 2];
  assert.ok(edgeDistance(home, mx, mz) < 1, 'hung on the residence');
  assert.ok(mark.y1 <= H.roof && mark.y0 >= H.roof - 14, `under the roofline (${mark.y0.toFixed(1)}–${mark.y1.toFixed(1)})`);
  const corners = home.map(([x, z]) => Math.hypot(x - mx, z - mz)).sort((a, b) => a - b);
  assert.ok(corners[0] < 16, `near a corner of the residence (${corners[0].toFixed(1)} m)`);
});

test('Guoco Tower: the sky frame opens in the east face near the top, its tray solid', async () => {
  const { kit } = await guoco();
  const { colliders } = kit.finish();
  const opening = kit.parts.find((p) => p.name === 'crown-sky-frame');
  const tray = kit.parts.find((p) => p.name === 'crown-sky-tray');
  assert.ok(opening && opening.y0 >= 258 && opening.y1 <= 276 && opening.y1 - opening.y0 >= 8, 'a dark opening two or three storeys tall');
  assert.ok(tray && Math.abs(tray.y1 - opening.y0) < 0.05, 'the tray at its foot');
  const [x, z] = [(tray.bounds.minX + tray.bounds.maxX) / 2, (tray.bounds.minZ + tray.bounds.maxZ) / 2];
  assert.ok(colliderAt(colliders, x + kit.anchor.x, tray.y1 - 0.3, z + kit.anchor.z), 'the tray stops a descent');
});

test('Guoco Tower: the podium — the set-back ground storey, the car park, the roof garden and the hotel\'s pool', async () => {
  const { kit, at } = await guoco();
  const { colliders } = kit.finish();
  const [px, pz, pwx, pwz] = at(...G.podium), [ex, ez, ewx, ewz] = at(...G.podiumEdge), [qx, qz] = at(...G.podiumNorth);
  assert.ok(Math.abs(topAt(kit, px, pz) - H.podium) <= 1, `the podium's roof at ${topAt(kit, px, pz)} m`);
  assert.equal(solidOver(kit, px, pz, H.podium + 1.5, 400).length, 0, 'open over the pool deck');
  assert.ok(Math.abs(topAt(kit, qx, qz) - H.podium) <= 1.5, 'the roof at the north-west corner');
  assert.ok(kit.parts.some((p) => p.name === 'podium-pool'), 'the hotel\'s pool on the roof');
  assert.ok(kit.parts.filter((p) => /^podium-roof-\d+-tree-crown$/.test(p.name)).length >= 6, 'trees in the roof garden');
  assert.equal(solidOver(kit, ex, ez, 0.5, 6).length, 0, 'the ground storey set back under the podium\'s edge');
  assert.ok(!colliderAt(colliders, ewx, 3, ewz) && colliderAt(colliders, ewx, 15, ewz), 'walk under, the car park above');
  assert.ok(colliderAt(colliders, pwx, 20, pwz) && !colliderAt(colliders, pwx, 40, pwz), 'the podium solid to its roof');
});

test('Guoco Tower: the Sofitel stands free on the podium to 105.3 m, its name on the south face under its top', async () => {
  const { kit, at, ring } = await guoco();
  const { colliders } = kit.finish();
  const [sx, sz, swx, swz] = at(...G.sofitel), [gx, gz, gwx, gwz] = at(...G.hotelGap);
  assert.ok(Math.abs(topAt(kit, sx, sz) - H.hotel) <= 1, `the hotel's roof at ${topAt(kit, sx, sz)} m`);
  const hotel = kit.parts.filter((p) => /^hotel-/.test(p.name));
  assert.ok(Math.abs(Math.max(...hotel.map((p) => p.bounds.maxY)) - H.hotelTop) <= 0.05, 'its crown to 105.3 m');
  assert.ok(Math.min(...hotel.map((p) => p.bounds.minY)) >= H.podium - 0.05, 'standing on the podium');
  assert.equal(solidOver(kit, gx, gz, H.podium + 1.5, 400).length, 0, 'a gap between the hotel and the tower');
  for (const y of [50, 100]) assert.ok(colliderAt(colliders, swx, y, swz), `the hotel solid at ${y} m`);
  assert.ok(!colliderAt(colliders, gwx, 60, gwz), 'the gap is free');
  const name = kit.parts.find((p) => p.name === 'sign:sofitel');
  assert.ok(name, 'the Sofitel name');
  const [mx, mz] = [(name.ring[0][0] + name.ring[1][0]) / 2, (name.ring[0][1] + name.ring[1][1]) / 2];
  assert.ok(edgeDistance(ring(393100850), mx, mz) < 1.5, 'on the hotel\'s wall');
  assert.ok(name.y1 <= H.hotelTop && name.y0 >= H.hotel - 6, `under its top (${name.y0.toFixed(1)}–${name.y1.toFixed(1)})`);
  assert.deepEqual(Array.from(kit.parts.filter((p) => p.type === 'sign'), (s) => s.name).sort(), ['sign:guocoland', 'sign:sofitel']);
});

test('Guoco Tower: the City Room is open under its 15 m glass canopy on copper trees, the drop-off under its canopy', async () => {
  const { kit, at } = await guoco();
  const { colliders } = kit.finish();
  for (const where of ['cityRoom', 'cityRoomWest']) {
    const [x, z, wx, wz] = at(...G[where]);
    assert.equal(solidOver(kit, x, z, 0.5, H.cityRoom - 0.2).length, 0, `the City Room is open (${where})`);
    assert.ok(solidOver(kit, x, z, H.cityRoom, H.cityRoom + 0.6).some((p) => p.name === 'city-room-canopy'), `the canopy over it (${where})`);
    assert.ok(builtOver(kit, x, z, 0, 1).some((p) => p.y0 <= 0.01 && p.y1 >= 0.3), `paved above the city's lawn (${where})`);
    assert.ok(!colliderAt(colliders, wx, 5, wz) && colliderAt(colliders, wx, H.cityRoom + 0.3, wz), `walk under, the canopy solid (${where})`);
  }
  // the Urban Park west of it stays open: no canopy, nothing built
  const [ox, oz, owx, owz] = at(...G.parkWest);
  assert.equal(builtOver(kit, ox, oz, 0, 400).length, 0, 'the park west of the City Room is open');
  assert.ok(!colliderAt(colliders, owx, 3, owz) && !colliderAt(colliders, owx, 15.3, owz), 'and free');
  const trunks = kit.parts.filter((p) => /^city-room-tree-\d+$/.test(p.name));
  const branches = kit.parts.filter((p) => /^city-room-tree-\d+-branch-/.test(p.name));
  assert.ok(trunks.length >= 6 && branches.length >= trunks.length * 3, `${trunks.length} copper trees, ${branches.length} branches`);
  assert.ok(branches.every((p) => p.bounds.maxY <= H.cityRoom + 0.05), 'the branches reach up to the canopy');
  const [dx, dz, dwx, dwz] = at(...G.dropOff), [lx, lz, lwx, lwz] = at(...G.lobby);
  assert.equal(solidOver(kit, dx, dz, 0.5, H.dropOff - 0.2).length, 0, 'drive under the drop-off canopy');
  assert.ok(solidOver(kit, dx, dz, H.dropOff, H.dropOff + 0.6).some((p) => p.name === 'tower-drop-off-canopy'), 'the canopy over it');
  assert.ok(!colliderAt(colliders, dwx, 3, dwz) && colliderAt(colliders, dwx, H.dropOff + 0.3, dwz), 'solid canopy, clear drive');
  assert.equal(solidOver(kit, lx, lz, 0.5, 11).length, 0, 'the lobby set back under the east face');
  assert.ok(colliderAt(colliders, lwx, 40, lwz) && !colliderAt(colliders, lwx, 4, lwz), 'the tower over the set-back lobby');
});

test('Guoco Tower: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await guoco();
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  // the City Room's canopy on its branches, the drop-off canopy on its columns
  const room = kit.parts.find((p) => p.name === 'city-room-canopy');
  assert.ok(kit.parts.some((p) => /-branch-/.test(p.name) && Math.abs(p.bounds.maxY - room.y0) < 0.05), 'the canopy on its branches');
  const drop = kit.parts.find((p) => p.name === 'tower-drop-off-canopy');
  assert.ok(kit.parts.filter((p) => /^tower-drop-off-column-/.test(p.name) && Math.abs(p.y1 - drop.y0) < 0.05).length >= 2, 'the drop-off canopy on its columns');
});

test('Guoco Tower stays finite, batched and free of flicker; the map has its masses at their heights', async () => {
  const { kit } = await guoco();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  assert.ok(footprints.some((f) => f.h >= 279), 'the tower at its height');
  assert.ok(footprints.some((f) => f.h >= 100 && f.h <= 106), 'the hotel at its height');
});
