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

// --- 18 Robinson (SG-061) -----------------------------------------------------------------------------------------------
// A faceted glass office tower held over a terraced, faceted retail podium on a V-shaped site between Market Street and
// Robinson Road: the podium's roof garden steps up from the south tip at 30, 35 and 40 m; over the top deck the tower is
// lifted on its core and two raking struts, an open sky garden under its sloping soffit; the tower's south-west corner
// folds in at the bottom and the top, its north-west corner is cut back toward the top, and the glass crown that holds
// the rooftop garden slopes from 180 m at the north-west corner to 165 m at the south-east (toward 163°, as mapped).

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
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs and beams — struts, rails — aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
// ... and the same without the trees planted on the terraces
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree-crown|trunk/.test(p.name));
const solidTop = (kit, x, z) => Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1));
// a loft's plan at height y: its base ring blended toward its top ring (a level top's cap, or the ring the model
// records on a loft with a sloping top) as y rises
const planAt = (p, y) => {
  const top = p.topRing || p.caps[0]?.ring;
  if (p.type !== 'loft' || !top) return p.ring;
  const t = Math.min(1, Math.max(0, (y - p.y0) / (p.y1 - p.y0)));
  return p.ring.map(([x, z], i) => [x + (top[i][0] - x) * t, z + (top[i][1] - z) * t]);
};
const towerAt = (kit, x, z, y) => kit.parts.filter((p) => /^tower-/.test(p.name) && p.y0 <= y && p.y1 >= y && covers(planAt(p, y), x, z));

// Points read off the mapped rings (OSM ways 424896147, 1566724021–28) and checked on the aerial and the photographs:
// inside the tower east of its core; in the core block; on the top deck under the tower's south-east and north parts,
// clear of the core and the struts; on the middle and lower terraces; on the ridge along Robinson Road; under the
// podium's overhang at the tip and on Robinson Road; inside the tower's south-west, north-west and north-east corners;
// 3 m in from the middle of its south and north faces; and outside the site
const R = {
  tower: [103.8505597, 1.2818478], core: [103.8505033, 1.2818936],
  deck: [103.8506273, 1.2818375], deckNorth: [103.8506144, 1.2820052],
  middleTerrace: [103.8504868, 1.2817123], lowerTerrace: [103.8504595, 1.2816336], ridge: [103.850558, 1.2816254],
  overhangTip: [103.8504764, 1.2815752], overhangEast: [103.8506872, 1.2818214],
  swCorner: [103.8504456, 1.2817153], nwCorner: [103.8504637, 1.2820389], neCorner: [103.8507019, 1.2819793],
  southEdge: [103.850523, 1.2817002], northEdge: [103.8505916, 1.2820032],
  // 1.2 m in from the Robinson Road face: near the tip, and over the Telegraph Street bay
  wingTip: [103.8505531, 1.2816071], wingBay: [103.8507425, 1.2819146],
  outsideWest: [103.8503535, 1.2819764], outsideEast: [103.8506811, 1.2817188], outsideSouth: [103.8504456, 1.2815252]
};
const H = { lower: 30, middle: 35, deck: 40.4, soffit: 56, garden: 150.8, crown: 180 };

test('18 Robinson replaces its outline and the eight mapped parts, and nothing else', async () => {
  const { L, info } = await siteModel('18-robinson');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [424896147, 1566724021, 1566724022, 1566724023, 1566724024, 1566724025, 1566724026, 1566724027, 1566724028]);
  assert.equal(info.name, '18 Robinson');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  for (const id of [172000308, 172000305]) assert.ok(!registered.hide.includes(id), `neighbour ${id} stays the city's`);
});

test('18 Robinson builds on its anchor to its documented 180 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('18-robinson');
  assert.equal(info.height, 180);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(Math.abs(b.maxY - info.height) <= 1, `${b.maxY} m tall, ${info.height} documented`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  const outline = siteOf(L).parts.find((p) => p.id === 424896147).ring;
  for (const axis of [0, 1]) {
    const values = outline.map((p) => p[axis]), [lo, hi] = axis ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    assert.ok(lo >= Math.min(...values) - 1 && hi <= Math.max(...values) + 1, `within the mapped outline along ${axis ? 'z' : 'x'} (${lo.toFixed(1)}..${hi.toFixed(1)})`);
  }
});

test('18 Robinson: the podium garden steps up from the south tip at 30, 35 and 40 m, a ridge rising along Robinson Road', async () => {
  const { kit, at } = await siteModel('18-robinson');
  // the highest solid under the sky garden (the tower over some of the terraces aside)
  const top = (where) => { const [x, z] = at(...R[where]); return Math.max(0, ...solidOver(kit, x, z, 0, 50).filter((p) => p.y1 <= 50).map((p) => p.y1)); };
  assert.ok(Math.abs(top('lowerTerrace') - H.lower) <= 0.6, `the lower terrace at the tip (${top('lowerTerrace')})`);
  assert.ok(Math.abs(top('middleTerrace') - H.middle) <= 0.6, `the middle terrace (${top('middleTerrace')})`);
  const [dx, dz] = at(...R.deck);
  assert.ok(builtOver(kit, dx, dz, H.deck - 1, H.deck).length >= 1, 'the top deck at 40 m under the tower');
  const ridge = top('ridge');
  assert.ok(ridge > H.middle - 1 && ridge < H.deck, `the ridge along Robinson Road climbs between the terraces (${ridge.toFixed(1)} m there)`);
  const ridgeParts = kit.parts.filter((p) => /^podium-ridge-/.test(p.name));
  assert.ok(ridgeParts.length >= 2 && Math.min(...ridgeParts.map((p) => p.bounds.minY)) <= H.lower + 0.5 && Math.max(...ridgeParts.map((p) => p.bounds.maxY)) >= H.deck, 'from the lower terrace up to the deck');
  assert.ok(kit.parts.some((p) => /^podium-stair/.test(p.name)), 'with the stair up beside it');
  // the Robinson Road face folded as KPF's elevation draws it: an upright facet pleated in plan, under a crease that falls
  // from the tip toward the bay; over it pleats leaning back, alternately more and less, to a crest climbing to the north
  const wing = kit.parts.find((p) => p.name === 'podium-wing');
  assert.ok(wing && wing.ring.length >= 40, `the upright facet folded in plan (${wing?.ring.length} corners)`);
  const pleats = kit.parts.filter((p) => /^podium-ridge-\d+$/.test(p.name));
  assert.ok(pleats.length >= 18 && pleats.every((p) => p.type === 'loft' && p.topRing), `leaning pleats (${pleats.length})`);
  const lean = (p) => Math.max(...p.ring.map((q) => q[0])) - Math.max(...p.topRing.map((q) => q[0]));
  assert.ok(pleats.every((p) => lean(p) >= 0.25), 'every pleat leans back from the face');
  const sorted = [...pleats].sort((a, b) => b.bounds.maxZ - a.bounds.maxZ);
  assert.ok(sorted.slice(1).some((p, k) => Math.abs(lean(p) - lean(sorted[k])) > 0.1), 'alternately more and less');
  const pleatAt = (where) => { const [x, z] = at(...R[where]); return pleats.find((p) => covers(p.ring, x, z)); };
  const [tipPleat, bayPleat] = [pleatAt('wingTip'), pleatAt('wingBay')];
  assert.ok(tipPleat.y0 >= 29 && bayPleat.y0 <= 22, `the crease falls from ${tipPleat.y0.toFixed(1)} m near the tip to ${bayPleat.y0.toFixed(1)} m over the bay`);
  assert.ok(tipPleat.bounds.maxY <= 38.5 && bayPleat.bounds.maxY >= 42.5, `the crest climbs from ${tipPleat.bounds.maxY.toFixed(1)} to ${bayPleat.bounds.maxY.toFixed(1)} m`);
  assert.ok(kit.parts.some((p) => p.name === 'podium-window' && p.type === 'loft') && kit.parts.filter((p) => /^podium-window-frame-/.test(p.name)).length === 4, 'the Telegraph Street bay, tilted in its frame');
  for (const level of ['lower', 'middle', 'deck']) {
    assert.ok(kit.parts.filter((p) => new RegExp(`^${level}-.*tree-crown$`).test(p.name)).length >= 3, `trees on the ${level} terrace`);
  }
  // the ground floor set back under the podium's overhang at the tip and along Robinson Road, paved above the lawn
  for (const where of ['overhangTip', 'overhangEast']) {
    const [x, z] = at(...R[where]);
    assert.equal(solidOver(kit, x, z, 0.5, 7).length, 0, `the ${where} walkway is open`);
    assert.ok(builtOver(kit, x, z, 8, 29).length >= 1, `the podium over the ${where} walkway`);
    assert.ok(builtOver(kit, x, z, 0, 0.5).some((p) => p.y1 >= 0.3), `paved above the city's lawn (${where})`);
  }
});

test('18 Robinson: the tower is lifted over an open sky garden on its core and two raking struts, under a sloping soffit', async () => {
  const { kit, at } = await siteModel('18-robinson');
  for (const where of ['deck', 'deckNorth']) {
    const [x, z] = at(...R[where]);
    assert.equal(solidOver(kit, x, z, H.deck + 0.6, 48).length, 0, `the sky garden is open under the tower (${where})`);
    assert.ok(builtOver(kit, x, z, 60, 120).length >= 1, `the tower over it (${where})`);
  }
  const [cx, cz] = at(...R.core);
  const core = solidOver(kit, cx, cz, H.deck + 1, H.soffit - 1);
  assert.ok(core.some((p) => p.name === 'core' && p.y0 <= H.deck + 0.01 && p.y1 >= 50), 'the core carries the tower from the deck');
  const struts = kit.parts.filter((p) => /^strut-/.test(p.name));
  assert.equal(struts.length, 2, 'two raking struts');
  for (const s of struts) {
    assert.ok(Math.abs(s.bounds.minY - H.deck) < 1.3 && s.bounds.maxY >= H.soffit, `${s.name} from the deck into the tower`);
    const [[fx, fz], [tx, tz]] = s.ring;
    assert.ok(Math.hypot(tx - fx, tz - fz) > 3, `${s.name} rakes outward`);
  }
  // the soffit: a funnel from the tower's edge down to the core
  const soffit = kit.parts.find((p) => p.name === 'soffit');
  assert.ok(soffit && soffit.bounds.minY >= 51.5 && soffit.bounds.minY <= 54.5 && Math.abs(soffit.bounds.maxY - H.soffit) < 0.01, 'the soffit slopes from 56 m at the tower\'s edge to about 53 m at the core');
  const shaft = kit.parts.filter((p) => /^tower-/.test(p.name)).sort((a, b) => a.y0 - b.y0);
  assert.ok(Math.abs(shaft[0].y0 - H.soffit) < 0.01 && shaft.every((p, k) => k === 0 || Math.abs(p.y0 - shaft[k - 1].y1) < 0.01 || p.y0 === shaft[k - 1].y1), 'the shaft rises unbroken from the soffit');
});

test('18 Robinson: the faceted tower — the south-west corner folds in at the foot and the head, the north-west is cut back at the top', async () => {
  const { kit, at } = await siteModel('18-robinson');
  const [sx, sz] = at(...R.swCorner), [nx, nz] = at(...R.nwCorner), [ex, ez] = at(...R.neCorner);
  assert.equal(towerAt(kit, sx, sz, 57).length, 0, 'the south-west corner is folded in at the tower\'s foot');
  assert.ok(towerAt(kit, sx, sz, 95).length >= 1, 'and full-height above the fold');
  assert.ok(towerAt(kit, nx, nz, 110).length >= 1, 'the north-west corner stands full lower down');
  assert.equal(towerAt(kit, nx, nz, 150).length, 0, 'and is cut back toward the top');
  // the corners' facets are lofted (inclined) faces, not steps
  // the crown: a lighter glass screen from the top office floor to the roof, on every face
  const screen = kit.parts.filter((p) => /^crown-screen-/.test(p.name));
  assert.ok(screen.length >= 7 && screen.every((p) => Math.abs(p.y0 - H.garden) < 0.01 && p.bounds.maxY > 164), `the crown's screen above 150.8 m (${screen.length} pieces)`);
  for (const name of ['tower-fold', 'tower-head']) assert.ok(kit.parts.some((p) => p.name.startsWith(name) && p.type === 'loft'), `${name}: an inclined facet`);
  assert.ok(kit.parts.some((p) => p.name === 'facet-foot' && p.type === 'loft'), 'the facet of the fold at the foot');
  // the planted loggias at the north-east corner over the soffit
  assert.equal(towerAt(kit, ex, ez, 66).length, 0, 'a planted loggia open at the north-east corner');
  assert.ok(towerAt(kit, ex, ez, 90).length >= 1, 'the offices over it');
  assert.ok(kit.parts.filter((p) => /^loggia-.*tree-crown$/.test(p.name)).length >= 2, 'trees in the loggias');
  // the crown: a sloping glass top, 180 m at the north-west corner, 165 m at the south-east
  const { colliders } = kit.finish();
  const solid = (where, y) => { const [, , x, z] = at(...R[where]); return colliderAt(colliders, x, y, z); };
  assert.ok(solid('northEdge', 175) && !solid('northEdge', 181), 'the crown\'s high north side reaches about 177 m in its middle');
  assert.ok(solid('southEdge', 163) && !solid('southEdge', 171), 'its south side about 167 m');
});

test('18 Robinson: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('18-robinson');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    assert.ok(under, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
});

test('18 Robinson: its sign, Singlife\'s mark and name, hangs on the podium\'s south tip under the terrace', async () => {
  const { kit } = await siteModel('18-robinson');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.deepEqual(Array.from(signs, (s) => s.name).sort(), ['sign:singlife', 'sign:singlife-mark']);
  const panel = kit.parts.find((p) => p.name === 'sign-panel');
  assert.ok(panel, 'on its red panel');
  const tip = kit.parts.find((p) => p.name === 'podium-body');
  const edge = (ring, x, z) => Math.min(...ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2));
    return Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t);
  }));
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    assert.ok(edge(tip.ring, mx, mz) < 1, `${s.name} on the podium's wall`);
    assert.ok(s.y1 <= H.lower && s.y0 >= panel.bounds.minY - 0.01 && s.y1 <= panel.bounds.maxY + 0.01, `${s.name} on the panel, under the terrace (${s.y0.toFixed(1)}–${s.y1.toFixed(1)} m)`);
  }
});

test('18 Robinson stays finite, batched and free of flicker; solid where built, open in the sky garden and on the pavement', async () => {
  const { kit, at } = await siteModel('18-robinson');
  assert.ok(kit.triangles > 2000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solid = (where, y) => { const [, , x, z] = at(...R[where]); return colliderAt(colliders, x, y, z); };
  assert.ok(solid('tower', 3) && solid('tower', 20) && solid('tower', 38) && solid('tower', 100) && solid('tower', 150), 'the podium and the tower are solid up their height');
  assert.ok(solid('core', 45), 'the core is solid');
  assert.ok(solid('lowerTerrace', 20) && solid('middleTerrace', 33) && solid('deck', 39), 'the terraces stop a descent');
  assert.ok(!solid('lowerTerrace', 31.5) && !solid('middleTerrace', 36.5), 'the air over them does not');
  assert.ok(!solid('deck', 45) && !solid('deckNorth', 45), 'the sky garden is open to fly into');
  assert.ok(solid('deck', 60) && solid('deckNorth', 60), 'the tower over it is solid');
  assert.ok(!solid('overhangTip', 3) && !solid('overhangEast', 3) && solid('overhangTip', 15), 'the walkways under the overhang are clear');
  assert.ok(!solid('neCorner', 66), 'the loggias are open');
  for (const y of [3, 40, 100]) for (const where of ['outsideWest', 'outsideEast', 'outsideSouth']) assert.ok(!solid(where, y), `nothing invisible ${where} at ${y} m`);
  assert.ok(footprints.some((f) => f.h >= 160), 'the map has the tower at its height');
});
