const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// js/landmark-kit.js: the kit the landmark model programs (js/landmark-models/<model>.js) are written against, after
// tinywarsaw.app's: a few solids in metres about the landmark's anchor (box, prism, loft, cylinder), a few materials
// (matte, glass, a painted facade), finished into a group with colliders and footprints. The kit keeps a record of
// what it built, so a model can be checked here without three.js: its bounds, and faces that would flicker against
// each other (coplanar, same way out, overlapping).

const chain = () => new Proxy(function node() {}, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k] : k === 'then' ? undefined : chain()),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => chain(),
  construct: () => chain()
});
class Chain { constructor(o) { const c = chain(); if (o && typeof o === 'object') Object.assign(c, o); return c; } }
class Group { constructor() { this.children = []; this.position = { set: (x, y, z) => Object.assign(this.position, { x, y, z }) }; } add(...o) { this.children.push(...o); return this; } }
// a geometry that keeps what the kit emits, so the triangles can be checked
class BufferGeometry { constructor() { this.attributes = {}; } setAttribute(name, a) { this.attributes[name] = a; } computeBoundingSphere() {} }
class Float32BufferAttribute { constructor(array, itemSize) { this.array = Float32Array.from(array); this.itemSize = itemSize; } }
class Mesh { constructor(geometry, material) { this.geometry = geometry; this.material = material; } }
const THREE = { Group, Mesh, BufferGeometry, Float32BufferAttribute, MeshStandardNodeMaterial: Chain, MeshLambertNodeMaterial: Chain, MeshBasicNodeMaterial: Chain, CanvasTexture: Chain, SRGBColorSpace: 'srgb', Color: Chain, FrontSide: 0, DoubleSide: 2 };
// the triangles of a finished mesh: corners, the stored normal, the normal its winding gives, its area and centroid
const trianglesOf = (mesh) => {
  const p = mesh.geometry.attributes.position.array, n = mesh.geometry.attributes.normal.array;
  const out = [];
  for (let i = 0; i < p.length; i += 9) {
    const a = [p[i], p[i + 1], p[i + 2]], b = [p[i + 3], p[i + 4], p[i + 5]], c = [p[i + 6], p[i + 7], p[i + 8]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const g = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const L = Math.hypot(...g);
    out.push({ a, b, c, stored: [n[i], n[i + 1], n[i + 2]], normal: L ? g.map((k) => k / L) : [0, 0, 0], area: L / 2, centroid: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3] });
  }
  return out;
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// whether (x, z) lies inside a ring (crossings)
const insideRing = ([x, z], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};
const tsl = new Proxy({}, { get: () => chain() });
const paired = [];
const tinyLook = { pairMaterial: (a, b) => { paired.push([a, b]); return b; }, createTinyFlatMaterial: (hex) => new Chain({ color: hex }), blendHex: (a) => a, hexToRgb: () => [1, 1, 1] };
const source = readFileSync(join(__dirname, '../js/landmark-kit.js'), 'utf8');
const load = () => loadModule(source, { imports: { 'three/webgpu': THREE, 'three/tsl': tsl, './tiny-look.js': tinyLook }, filename: 'landmark-kit.js' });
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('explicit collision prisms keep elevated wings solid without adding visible geometry', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 100, z: -50 } });
  assert.equal(typeof kit.collisionPrism, 'function', 'models can supply collision for elevated architectural parts');
  kit.collisionPrism({ ring: [[-5,-3],[5,-3],[5,3],[-5,3]], y0: 6, y1: 34 });
  const { group, colliders, footprints } = kit.finish();
  assert.equal(group.children.length, 0, 'a collider does not add a duplicate visual surface');
  assert.equal(kit.triangles, 0);
  assert.equal(colliders.length, 1);
  assert.equal(colliders[0].minY, 6, 'clearance below the part remains open');
  assert.equal(colliders[0].maxY, 34);
  assert.equal(colliders[0].minX, 95);
  assert.equal(colliders[0].maxZ, -47);
  assert.equal(footprints[0].h, 34);
});

test('explicit collision fills an irregular roof interior while leaving its concave opening clear', () => {
  const { createKit } = load(), kit = createKit();
  kit.collisionPrism({ ring: [[0,0],[12,0],[12,4],[4,4],[4,12],[0,12]], y0: 20, y1: 21 });
  const { colliders } = kit.finish();
  const hits = (x, z) => colliders.some(({ obb: o }) => Math.abs((x-o.cx)*o.cs-(z-o.cz)*o.sn) <= o.hx && Math.abs((x-o.cx)*o.sn+(z-o.cz)*o.cs) <= o.hz);
  assert.ok(hits(2, 7) && hits(7, 2), 'both arms have solid roof interiors');
  assert.ok(!hits(8, 8), 'the courtyard opening remains clear');
});

test('a loft can follow an explicit upper ring for an outward-inclined glass facade', () => {
  const { createKit } = load(), kit = createKit();
  const ring = [[-2,-1],[2,-1],[2,1],[-2,1]];
  const topRing = [[-3,-1],[4,-1],[4,1],[-3,1]];
  const part = kit.loft({ ring, topRing, y0: 2, y1: 25, material: kit.material(0x5a8393) });
  assert.equal(part.bounds.minX, -3);
  assert.equal(part.bounds.maxX, 4);
  assert.equal(part.bounds.minZ, -1, 'only the intended facade direction tilts');
  const triangles = kit.finish().group.children.flatMap(trianglesOf);
  assert.ok(triangles.every((t) => t.area > 0 && dot(t.normal, t.stored) > 0.999));
  assert.ok(triangles.some((t) => t.normal[1] < -0.01 && Math.abs(t.normal[0]) > 0.9), 'the inclined wall has an actual tilted surface normal');
  assert.throws(() => kit.loft({ ring, topRing: [[0,0]], y1: 5 }), /topRing/);
});

test('solids about the anchor: a box, a prism, a loft and a cylinder, with their triangles and bounds', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 1000, z: -500 } });
  const m = kit.material(0xe2dfd3);
  kit.box({ x: 0, z: 0, y: 0, w: 10, h: 20, d: 6, material: m });
  assert.equal(kit.triangles, 10, 'a box on the ground: four walls and a top, no underside');
  assert.deepEqual({ ...kit.bounds() }, { minX: -5, maxX: 5, minY: 0, maxY: 20, minZ: -3, maxZ: 3 });
  kit.prism({ ring: [[20, -5], [30, -5], [30, 5], [20, 5]], y0: 0, y1: 30, material: m });
  assert.equal(kit.triangles, 10 + 8 + 2, 'a prism: its walls and its top');
  assert.equal(kit.bounds().maxY, 30);
  assert.equal(kit.bounds().maxX, 30);
  kit.loft({ ring: [[-20, -5], [-10, -5], [-10, 5], [-20, 5]], y0: 30, y1: 50, scale: 0.5, material: m });
  assert.equal(kit.triangles, 20 + 8 + 2 + 2, 'a loft up in the air: walls, the smaller top, its underside');
  assert.equal(kit.bounds().minX, -20);
  kit.cylinder({ x: 0, z: 20, y0: 0, y1: 10, r: 4, segments: 8, material: m });
  assert.equal(kit.triangles, 32 + 16 + 6, 'a cylinder: 8 walls and an 8-gon top of 6');
  assert.equal(kit.parts.length, 4);
  assert.ok(kit.parts.every((p) => p.material === m));
});

test('materials: one matte per colour, glass toward the sky, a painted facade; each paired with its tiny stand-in', () => {
  paired.length = 0;
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const a = kit.material(0x8e8f8a), b = kit.material(0x8e8f8a), c = kit.material(0x5a4e45);
  assert.equal(a, b, 'the same colour, the same material');
  assert.notEqual(a, c);
  assert.equal(paired.filter(([p]) => p === a).length, 1, 'paired once');
  const g = kit.glassMaterial(0x383e57);
  assert.ok(paired.some(([p]) => p === g));
  const f = kit.facadeMaterial({ wall: 0x8e8f8a, window: 0x3a4a56, floorHeight: 4.2, bayWidth: 2.4 });
  assert.ok(Object.hasOwn(f, 'colorNode'), 'draws its windows');
  assert.ok(paired.some(([p]) => p === f));
  assert.throws(() => kit.facadeMaterial({ wall: 0x8e8f8a, pattern: 'plaid' }), /pattern/);
});

test('flicker: faces on one plane, the same way out and overlapping, as a tower flush on its podium', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const m = kit.material(0xffffff);
  kit.box({ x: 0, z: 0, y: 0, w: 20, h: 10, d: 20, material: m, name: 'podium' });
  kit.box({ x: 0, z: 0, y: 10, w: 10, h: 40, d: 10, material: m, name: 'tower' });
  assert.equal(kit.flicker().length, 0, 'a tower set back on its podium: nothing coplanar');
  kit.box({ x: 5, z: 0, y: 5, w: 10, h: 10, d: 10, material: m, name: 'flush' });
  const pairs = kit.flicker();
  assert.ok(pairs.length >= 1, 'its +x face lies on the podium\'s +x face over 5 m of height');
  assert.ok(pairs.some(([p, q]) => [p, q].includes('podium') && [p, q].includes('flush')), JSON.stringify(pairs));
  // tops: two solids ending at one height with overlapping footprints flicker too
  const kit2 = createKit({ anchor: { x: 0, z: 0 } });
  kit2.box({ x: 0, z: 0, y: 0, w: 20, h: 10, d: 20, material: m, name: 'a' });
  kit2.box({ x: 5, z: 5, y: 2, w: 10, h: 8, d: 10, material: m, name: 'b' });
  assert.ok(kit2.flicker().some(([p, q]) => p === 'a' && q === 'b' || p === 'b' && q === 'a'));
  // a prism beside a prism sharing a wall: their shared faces look opposite ways, no flicker
  const kit3 = createKit({ anchor: { x: 0, z: 0 } });
  kit3.prism({ ring: [[0, 0], [10, 0], [10, 10], [0, 10]], y0: 0, y1: 20, material: m, name: 'left' });
  kit3.prism({ ring: [[10, 0], [20, 0], [20, 10], [10, 10]], y0: 0, y1: 30, material: m, name: 'right' });
  assert.equal(kit3.flicker().length, 0);
});

test('finished: the group at the anchor, colliders for what stands on the ground, footprints for the map', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 1000, z: -500 } });
  const m = kit.material(0xffffff);
  kit.box({ x: 10, z: 0, y: 0, w: 20, h: 30, d: 10, material: m });
  kit.prism({ ring: [[-30, -10], [-10, -10], [-10, 10], [-30, 10]], y0: 0, y1: 50, material: m });
  kit.box({ x: 10, z: 0, y: 40, w: 10, h: 5, d: 10, material: kit.material(0x222222) }); // a crown: nothing to walk into
  const { group, colliders, footprints } = kit.finish();
  assert.deepEqual([group.position.x, group.position.y, group.position.z], [1000, 0, -500]);
  assert.equal(group.children.length, 3, 'one mesh per material: the walls, the crown, the roofs');
  assert.equal(colliders.length, 2);
  const c = colliders.find((k) => near(k.minX, 1000));
  assert.ok(c && near(c.maxX, 1020) && near(c.minZ, -505) && near(c.maxZ, -495) && c.minY === 0 && c.maxY === 30, JSON.stringify(c));
  assert.ok(c.obb && near(c.obb.hx, 10) && near(c.obb.hz, 5));
  assert.equal(footprints.length, 2);
  assert.ok(footprints.every((f) => f.pts.length >= 8 && f.h > 0));
});

test('resolve: mapped parts made safe to draw together: one inside another dropped, the smaller of a flickering pair inset', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const m = kit.material(0xffffff);
  const sq = (x, z, half) => [[x - half, z - half], [x + half, z - half], [x + half, z + half], [x - half, z + half]];
  const items = [
    { ring: sq(0, 0, 20), y0: 0, y1: 100, material: m, name: 'shaft' },
    { ring: sq(0, 0, 10), y0: 50, y1: 90, material: m, name: 'inner' }, // wholly inside the shaft: dropped
    { ring: sq(10, 0, 10), y0: 100, y1: 140, material: m, name: 'upper' }, // on top, flush with the shaft's +x face: touching, no flicker
    { ring: sq(10, 0, 10), y0: 60, y1: 120, material: m, name: 'flush' } // its +x face on the shaft's over 60-100 m: inset
  ];
  const out = kit.resolve(items);
  assert.deepEqual(out.map((it) => it.name), ['shaft', 'upper', 'flush']);
  const flush = out.find((it) => it.name === 'flush');
  assert.ok(flush.ring.every(([x]) => x < 20 - 0.05), 'drawn inside the shaft face');
  assert.ok(flush.ring.every(([x]) => x > 0.05));
  for (const it of out) kit.prism(it);
  assert.equal(kit.flicker().length, 0);
});

test('what is emitted: every triangle has area, its stored normal is its winding, roofs face up, undersides down', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const walls = kit.material(0xffffff);
  kit.box({ x: 0, z: 0, y: 0, w: 10, h: 20, d: 6, material: walls, name: 'box' });
  kit.loft({ ring: [[20, -5], [30, -5], [30, 5], [20, 5]], y0: 30, y1: 50, scale: 0.5, material: walls, name: 'loft' });
  kit.cylinder({ x: 0, z: 20, y0: 0, y1: 10, r: 4, segments: 8, material: walls, name: 'drum' });
  const { group } = kit.finish();
  const roofMesh = group.children.find((m) => m.material === kit.roofMaterial());
  const wallMesh = group.children.find((m) => m.material === walls);
  assert.ok(roofMesh && wallMesh);
  const roofs = trianglesOf(roofMesh);
  assert.equal(roofs.length, 2 + 2 + 6, 'the box top, the loft top, the drum top');
  for (const t of roofs) {
    assert.ok(t.area > 0.5, 'a real triangle, not a sliver: ' + t.area);
    assert.ok(dot(t.normal, t.stored) > 0.999, 'the stored normal is the one its winding gives');
    assert.ok(t.normal[1] > 0.999, 'a roof faces up');
  }
  const wallTris = trianglesOf(wallMesh);
  assert.equal(wallTris.length, 8 + 8 + 2 + 16, 'the walls, and the loft underside');
  for (const t of wallTris) {
    assert.ok(t.area > 0.5);
    assert.ok(dot(t.normal, t.stored) > 0.999);
  }
  const under = wallTris.filter((t) => t.a[1] === 30 && t.b[1] === 30 && t.c[1] === 30);
  assert.equal(under.length, 2, 'the loft stands in the air: its underside is drawn');
  for (const t of under) assert.ok(t.normal[1] < -0.999, 'an underside faces down');
  assert.equal(kit.triangles, roofs.length + wallTris.length, 'the count is of the triangles really emitted');
});

test('walls face outward on a concave ring, whichever way round the ring is given', () => {
  const { createKit } = load();
  const L = [[0, 0], [20, 0], [20, 10], [10, 10], [10, 20], [0, 20]];
  for (const ring of [L, [...L].reverse()]) {
    const kit = createKit({ anchor: { x: 0, z: 0 } });
    const m = kit.material(0xffffff);
    kit.prism({ ring, y0: 0, y1: 15, material: m, name: 'L' });
    const { group } = kit.finish();
    const wallMesh = group.children.find((o) => o.material === m);
    const tris = trianglesOf(wallMesh).filter((t) => Math.abs(t.normal[1]) < 1e-6);
    assert.equal(tris.length, 12, 'six walls of two');
    for (const t of tris) {
      const out = [t.centroid[0] + t.normal[0] * 0.1, t.centroid[2] + t.normal[2] * 0.1];
      const inn = [t.centroid[0] - t.normal[0] * 0.1, t.centroid[2] - t.normal[2] * 0.1];
      assert.ok(!insideRing(out, ring) && insideRing(inn, ring), 'a wall faces out of the ring: ' + JSON.stringify(t.normal));
    }
  }
});

test('inset: every edge moves inward by the distance, on a concave ring too', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const L = [[0, 0], [20, 0], [20, 10], [10, 10], [10, 20], [0, 20]];
  const inset = kit.inset(L, 0.1);
  assert.equal(inset.length, L.length);
  // each new edge lies 0.1 m inside the old one, along the old edge's own outward normal
  for (let i = 0; i < L.length; i++) {
    const [ax, az] = L[i], [bx, bz] = L[(i + 1) % L.length];
    const len = Math.hypot(bx - ax, bz - az);
    const nx = (bz - az) / len, nz = -(bx - ax) / len; // (this ring is wound so that this is outward)
    for (const [px, pz] of [inset[i], inset[(i + 1) % L.length]]) {
      const d = (px - ax) * nx + (pz - az) * nz;
      assert.ok(Math.abs(d + 0.1) < 1e-6, 'edge ' + i + ' moved ' + d);
    }
  }
  assert.ok(insideRing(inset[3], L) && insideRing(inset[0], L));
});

test('a sloped slab against a podium is seen by flicker and resolve, and triangles and concave footprints get wall colliders', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 100, z: 200 } });
  const m = kit.material(0xffffff);
  const podium = [[0, 0], [40, 0], [40, 30], [0, 30]];
  const slab = [[0, 0], [15, 0], [15, 30], [0, 30]]; // sharing the podium's west wall
  kit.prism({ ring: podium, y0: 0, y1: 26, material: m, name: 'podium' });
  kit.prism({ ring: slab, y0: 0, y1: kit.sloped(slab, 200, 30, 0), material: m, name: 'slab' });
  assert.ok(kit.flicker().some(([a, b]) => [a, b].includes('slab')), 'the slab\'s walls are vertical planes even under a sloped top');
  const kit2 = createKit({ anchor: { x: 0, z: 0 } });
  const items = kit2.resolve([{ ring: podium, y0: 0, y1: 26, material: m, name: 'podium' }, { ring: slab, y0: 0, y1: kit2.sloped(slab, 200, 30, 0), material: m, name: 'slab' }]);
  for (const it of items) kit2.prism(it);
  assert.equal(kit2.flicker().length, 0, 'the slab drawn inset from the podium wall');
  // colliders: a rectangle is one turned box; a triangle or a concave footprint, thin boxes along its walls
  const kit3 = createKit({ anchor: { x: 0, z: 0 } });
  kit3.prism({ ring: podium, y0: 0, y1: 26, material: m, name: 'rect' });
  kit3.prism({ ring: [[60, 0], [100, 0], [60, 40]], y0: 0, y1: 100, material: m, name: 'tri' });
  kit3.prism({ ring: [[0, 60], [20, 60], [20, 70], [10, 70], [10, 80], [0, 80]], y0: 0, y1: 15, material: m, name: 'L' });
  const { colliders } = kit3.finish();
  assert.equal(colliders.length, 1 + 3 + 6);
  const thin = colliders.filter((c) => c.obb.hz <= 0.4 + 1e-9);
  assert.equal(thin.length, 9, 'a thin box along every wall of the triangle and the L');
});

test('resolve: a pair that both got inset (one because of a third part) is inset again until clear', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const m = kit.material(0xffffff);
  // the tower A, a taller part B sharing two of A's edges (not within it, so kept), and a bigger wing D whose east
  // face lies on A's east face the same way out (so A, the smaller of that pair, is inset too, back onto B's inset faces)
  const A = [[0, 0], [40, 0], [40, 40], [0, 40]];
  const B = [[0, 0], [20, 0], [20, 20], [0, 20]];
  const D = [[15, -20], [40, -20], [40, 60], [15, 60]];
  const items = kit.resolve([
    { ring: A, y0: 0, y1: 245, material: m, name: 'A' },
    { ring: B, y0: 0, y1: 250, material: m, name: 'B' },
    { ring: D, y0: 0, y1: 300, material: m, name: 'D' }
  ]);
  assert.equal(items.length, 3, 'none is inside another');
  for (const it of items) kit.prism(it);
  assert.equal(kit.flicker().length, 0, JSON.stringify(kit.flicker()));
});

test('a sloped top follows a compass bearing in the city\'s turned frame', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  kit.bearingDeg = 31.8;
  const th = (31.8 * Math.PI) / 180;
  const [nx, nz] = kit.compass(0);
  assert.ok(Math.abs(nx + Math.sin(th)) < 1e-9 && Math.abs(nz + Math.cos(th)) < 1e-9, 'north in the turned frame');
  // a square part whose top falls 10 m toward the east: the corner farthest east is the lowest, the farthest west the highest
  const ring = [[-10, -10], [10, -10], [10, 10], [-10, 10]];
  const top = kit.sloped(ring, 100, 10, 90);
  const [ex, ez] = kit.compass(90);
  const along = ([x, z]) => x * ex + z * ez;
  const east = ring.reduce((a, b) => (along(b) > along(a) ? b : a));
  const west = ring.reduce((a, b) => (along(b) < along(a) ? b : a));
  assert.ok(Math.abs(top(...east) - 90) < 1e-9 && Math.abs(top(...west) - 100) < 1e-9);
});

test('a rooftop sign: a cut-out panel reading right from both sides, on a bar, outside the bounds and the flicker check', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const m = kit.material(0xffffff);
  kit.box({ x: 0, z: 0, y: 0, w: 40, h: 200, d: 30, material: m, name: 'tower' });
  const before = kit.triangles;
  const sign = kit.sign({ text: 'citi', x: 0, z: 0, y: 200.6, yaw: Math.PI / 2, width: 24, height: 6, color: 0x003b70, bar: 0x55595c });
  assert.equal(sign.type, 'sign');
  assert.equal(kit.triangles, before + 4 + 12, 'a quad each way, and the bar (in the air: with its underside)');
  assert.equal(sign.material.alphaTest, 0.5, 'cut out, not blended');
  assert.ok(!Object.hasOwn(sign.material, 'transparent'), 'not in the transparent pass');
  assert.equal(kit.sign({ text: 'citi', x: 0, z: 0, y: 200.6, yaw: Math.PI / 2, color: 0x003b70, bar: 0x55595c }).material, sign.material, 'one material per text and colour');
  assert.equal(kit.bounds().maxY, 200, 'a sign does not count toward the building');
  assert.ok(Math.abs(kit.bounds({ signs: true }).maxY - 206.6) < 1e-9);
  assert.equal(kit.flicker().length, 0);
  const { group, colliders } = kit.finish();
  assert.equal(colliders.length, 1, 'nothing to walk into on a roof');
  const signMesh = group.children.find((o) => o.material === sign.material);
  const tris = trianglesOf(signMesh);
  assert.equal(tris.length, 8, 'two quads a sign (yaw 90°: facing +x and back), two signs');
  assert.equal(tris.filter((t) => t.normal[0] > 0.999).length, 4, 'the fronts face +x');
  assert.equal(tris.filter((t) => t.normal[0] < -0.999).length, 4, 'the backs face -x');
  // the text reads left to right on both faces: u = 0 at the viewer's left (+z in front of a +x face, -z behind it)
  const uvs = signMesh.geometry.attributes.uv.array;
  tris.forEach((t, k) => {
    const corners = [t.a, t.b, t.c].map((p, i) => ({ z: p[2], u: uvs[k * 6 + i * 2] }));
    const left = corners.find((c) => c.u === 0), right = corners.find((c) => c.u === 1);
    assert.ok(left && right, 'u spans the panel');
    assert.ok(t.normal[0] > 0 ? left.z > right.z : left.z < right.z, 'reads right from ' + (t.normal[0] > 0 ? 'the front' : 'the back'));
  });
  assert.throws(() => kit.sign({ x: 0, z: 0, y: 1 }), /text/);
  assert.throws(() => kit.sign({ text: 'citi', x: 0, z: 0 }), /height y/);
  // no bar unless asked; a sign wider than maxWidth shrinks, keeping its shape; yTop places its top edge
  const hung = kit.sign({ text: 'Standard Chartered', x: 50, z: 0, yTop: 150, height: 6, maxWidth: 30 });
  assert.ok(Math.abs(hung.bounds.maxX - hung.bounds.minX - 30) < 1e-9, 'capped at the wall');
  const natural = 6 * 0.62 * 'Standard Chartered'.length;
  assert.ok(near(hung.bounds.maxY - hung.bounds.minY, 6 * 30 / natural), 'the height scaled with the width');
  assert.ok(near(hung.bounds.maxY, 150), 'its top at yTop');
  assert.ok(!kit.parts.some((p) => p.name === hung.name + ':bar'), 'no bar');
  // no width given: as wide as the text (no canvas in node: 0.62 m per letter and metre of height)
  const wide = kit.sign({ text: 'WESTIN', x: 100, z: 0, y: 200.6, height: 5 });
  assert.ok(Math.abs(wide.bounds.maxX - wide.bounds.minX - 5 * 0.62 * 6) < 1e-9, 'width from the text');
});

test('the scatter facade: one material per throw, its options in the memo key; an unknown pattern throws', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const a = kit.facadeMaterial({ wall: 0xe8e8e4, window: 0x3f5f78, pattern: 'scatter', scatter: { density: 0.2, top: 0.8, ramp: [150, 220] } });
  assert.ok(Object.hasOwn(a, 'colorNode'), 'painted in a node');
  assert.equal(kit.facadeMaterial({ wall: 0xe8e8e4, window: 0x3f5f78, pattern: 'scatter', scatter: { density: 0.2, top: 0.8, ramp: [150, 220] } }), a, 'the same throw: the same material');
  assert.notEqual(kit.facadeMaterial({ wall: 0xe8e8e4, window: 0x3f5f78, pattern: 'scatter', scatter: { density: 0.2, top: 0.8, ramp: [150, 220], seed: 2 } }), a, 'another seed: another material');
  assert.notEqual(kit.facadeMaterial({ wall: 0xe8e8e4, window: 0x3f5f78, pattern: 'scatter' }), a, 'the defaults: another material');
  assert.throws(() => kit.facadeMaterial({ wall: 0xffffff, pattern: 'confetti' }), /unknown facade pattern/);
});

test('wallToward: the wall of a ring facing a bearing best, for a sign hung under the roofline', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  kit.bearingDeg = 0;
  const ring = [[-20, -10], [20, -10], [20, 10], [-20, 10]];
  const north = kit.wallToward(ring, 0); // north is -z in an unturned frame
  assert.ok(near(north.x, 0) && near(north.z, -10) && near(north.nx, 0) && near(north.nz, -1), JSON.stringify(north));
  assert.equal(north.length, 40);
  assert.ok(near(Math.abs(north.yaw), Math.PI), 'facing -z');
  const east = kit.wallToward([...ring].reverse(), 90); // either winding
  assert.ok(near(east.x, 20) && near(east.nx, 1) && east.length === 20, JSON.stringify(east));
  const turned = kit.wallToward(ring, 20); // within 45° of north: still the long north wall
  assert.ok(near(turned.z, -10) && turned.length === 40);
  assert.throws(() => kit.wallToward([[0, 0]], 0), /edge/);
});

test('hang: a sign on the wall facing the bay under the roofline, or on the face of a round crown', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  kit.bearingDeg = 0;
  const m = kit.material(0xffffff);
  const ring = [[-20, -10], [20, -10], [20, 10], [-20, 10]];
  kit.prism({ ring, y0: 0, y1: 200, material: m, name: 'tower' });
  const s = kit.hang({ ring, top: 200, toward: 0, text: 'DBS', height: 7 }); // the north wall (-z), 40 m long
  assert.ok(near(s.bounds.maxY, 198.5) && near(s.bounds.maxY - s.bounds.minY, 7), 'its top 1.5 m under the roofline');
  assert.ok(near(s.bounds.minZ, -10.4) && near(s.bounds.maxZ, -10.4), '0.4 m off the wall');
  assert.ok(s.bounds.minX > -17 && s.bounds.maxX < 17, 'within the wall less the margin');
  // a slanted crown: under the roofline's low end over that wall
  const roof = kit.sloped(ring, 200, 10, 90); // falling east: 200 at x = -20, 190 at x = 20
  const t = kit.hang({ ring, top: roof, toward: 0, text: 'HSBC', height: 7, below: 2 });
  assert.ok(near(t.bounds.maxY, 188), 'under the low end (190) by 2');
  // a round crown: no wall long enough, so on its face toward the bearing, within its width
  const round = Array.from({ length: 24 }, (_, i) => [15 * Math.cos((i / 24) * 2 * Math.PI), 15 * Math.sin((i / 24) * 2 * Math.PI)]);
  const u = kit.hang({ ring: round, top: 280, toward: 90, text: 'UOB', height: 7 }); // east: +x
  assert.ok(near(u.bounds.minX, 15.4) && near(u.bounds.maxX, 15.4), 'on the east face: ' + JSON.stringify(u.bounds));
  assert.ok(u.bounds.maxZ - u.bounds.minZ <= 18 + 1e-9, 'no wider than 60% of the crown');
  assert.ok(near(u.bounds.maxY, 278.5));
  assert.equal(kit.flicker().length, 0);
  assert.throws(() => kit.hang({ top: 10, toward: 0, text: 'x' }), /ring/);
});

test('a sign with a logo: the mark left of the name, or alone, or beside a name on two lines', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const mark = { id: 'mark', aspect: 2, draw() {} };
  const wide = (p) => p.bounds.maxX - p.bounds.minX; // facing +z: the panel runs along x
  const named = kit.sign({ text: 'HSBC', logo: mark, x: 0, z: 0, y: 100, height: 6 });
  const plain = kit.sign({ text: 'HSBC', x: 0, z: 0, y: 100, height: 6 });
  assert.equal(named.logo, 'mark');
  assert.equal(plain.logo, null);
  assert.equal(named.name, 'sign:HSBC');
  assert.notEqual(named.material, plain.material, 'a logo: another material');
  assert.equal(kit.sign({ text: 'HSBC', logo: mark, x: 5, z: 0, y: 120 }).material, named.material, 'one material per text, colour and logo');
  assert.ok(wide(named) > wide(plain), 'the mark widens the sign');
  const alone = kit.sign({ logo: mark, x: 0, z: 0, y: 100, height: 6 });
  assert.equal(alone.name, 'sign:mark', 'named after its logo');
  assert.ok(wide(alone) > 6 && wide(alone) < wide(named), 'as wide as the mark: ' + wide(alone));
  // a name on two lines beside the mark: narrower than on one, and as wide as its longer line
  const two = kit.sign({ text: 'standard\nchartered', logo: mark, x: 0, z: 0, y: 100, height: 10 });
  const one = kit.sign({ text: 'standard chartered', logo: mark, x: 0, z: 0, y: 100, height: 10 });
  assert.ok(wide(two) < wide(one), `${wide(two)} < ${wide(one)}`);
  assert.ok(wide(kit.sign({ text: 'chartered\nstandard', logo: mark, x: 0, z: 0, y: 100, height: 10 })) === wide(two), 'the longer line sets the width');
  assert.throws(() => kit.sign({ x: 0, z: 0, y: 1 }), /text or a logo/);
  assert.equal(kit.hang({ ring: [[-20, -10], [20, -10], [20, 10], [-20, 10]], top: 200, toward: 180, logo: mark, height: 5 }).logo, 'mark', 'hang passes the logo on');
});

test("the tenants' marks paint themselves inside their box, in their colours", async () => {
  const { LOGOS } = await import(pathToFileURL(join(__dirname, '../js/landmark-logos.js')).href);
  globalThis.Path2D ??= class { constructor(d) { this.d = d; } };
  const colours = { hsbc: ['#ffffff', '#db0011'], dbs: ['#e1251b', '#ffffff'], 'standard-chartered': ['#38d200', '#0473ea'], keppel: ['#55595c', '#ffffff', '#c8102e'] };
  // the marks drawn from Commons paths: their drawings' width and height in its units, scaled to the box's height
  const drawings = { 'standard-chartered': [68.92, 109.4], keppel: [501, 167] };
  assert.deepEqual(Object.keys(LOGOS).sort(), Object.keys(colours).sort());
  for (const [key, logo] of Object.entries(LOGOS)) {
    assert.equal(logo.id, key);
    // a context recording each fill: its colour, and its corners on the canvas (a polygon) or its path (Path2D)
    let at = [0, 0, 1], path = [];
    const fills = [];
    const ctx = {
      fillStyle: '#000000',
      translate(x, y) { at = [at[0] + x * at[2], at[1] + y * at[2], at[2]]; },
      scale(s) { at = [at[0], at[1], at[2] * s]; },
      beginPath() { path = []; },
      moveTo(x, y) { path.push([at[0] + x * at[2], at[1] + y * at[2]]); },
      lineTo(x, y) { this.moveTo(x, y); },
      closePath() {},
      fill(p) { fills.push({ colour: this.fillStyle, points: p ? null : path, scale: at[2], origin: [at[0], at[1]] }); }
    };
    const [x, y, h] = [20, 30, 104], w = Math.ceil(h * logo.aspect);
    logo.draw(ctx, x, y, w, h);
    assert.ok(fills.length >= 2, key);
    assert.deepEqual([...new Set(fills.map((f) => f.colour))].sort(), [...colours[key]].sort(), `${key} in its colours`);
    for (const f of fills) {
      if (f.points) {
        for (const [px, py] of f.points) assert.ok(px >= x - 1e-9 && px <= x + w + 1e-9 && py >= y - 1e-9 && py <= y + h + 1e-9, `${key}: ${px}, ${py} inside its box`);
        continue;
      }
      // a path: the Commons drawing scaled to the box's height, within its width
      const [dw, dh] = drawings[key];
      assert.ok(near(f.origin[0], x) && near(f.origin[1], y) && near(f.scale * dh, h) && f.scale * dw <= w + 1e-9, key);
    }
  }
});

test('the honeycomb facade: a hexagon per bay and storey, pointed or flat-topped, its frame in the memo key', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const pointed = kit.facadeMaterial({ wall: 0xe6e8e6, window: 0x50606a, pattern: 'honeycomb', bayWidth: 3.5, floorHeight: 6 });
  assert.ok(Object.hasOwn(pointed, 'colorNode'), 'painted in a node');
  assert.equal(kit.facadeMaterial({ wall: 0xe6e8e6, window: 0x50606a, pattern: 'honeycomb', bayWidth: 3.5, floorHeight: 6 }), pointed);
  const flat = kit.facadeMaterial({ wall: 0xe6e8e6, window: 0x50606a, pattern: 'honeycomb', bayWidth: 3.5, floorHeight: 6, honeycomb: { flat: true } });
  assert.notEqual(flat, pointed, 'flat-topped hexagons: another material');
  assert.notEqual(kit.facadeMaterial({ wall: 0xe6e8e6, window: 0x50606a, pattern: 'honeycomb', bayWidth: 3.5, floorHeight: 6, honeycomb: { frame: 0.14 } }), pointed, 'a heavier frame: another material');
});

test('a prism can give each wall its own material: a concave face in one, the flat ends in another', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const face = kit.material(0xe6e8e6), ends = kit.material(0x9aa0a4), roof = kit.material(0x7a8a6a);
  const ring = [[-10, -5], [10, -5], [10, 5], [-10, 5]];
  const part = kit.prism({ ring, y0: 0, y1: 30, material: ends, top: roof, edgeMaterial: (i) => (i === 0 ? face : null), name: 'tower' });
  assert.equal(part.walls.length, 4, 'its walls still recorded for the flicker check');
  const { group } = kit.finish();
  const count = (m) => trianglesOf(group.children.find((o) => o.material === m)).length;
  assert.equal(count(face), 2, 'the first wall in its own material');
  assert.equal(count(ends), 6, 'the other three in the solid\'s');
  assert.equal(count(roof), 2, 'the top in its own');
});

test('a beam: a sloped box between two points, its faces outward, structure in the bounds but nothing to walk into', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const m = kit.material(0x55595c);
  const before = kit.triangles;
  const rafter = kit.beam({ from: [0, 200, -10], to: [0, 212, 30], w: 0.4, h: 0.6, material: m, name: 'rafter' });
  assert.equal(kit.triangles, before + 12, 'six faces');
  assert.equal(rafter.type, 'beam');
  assert.ok(rafter.bounds.minY < 200 && rafter.bounds.maxY > 212 && near(rafter.bounds.maxX - rafter.bounds.minX, 0.4), JSON.stringify(rafter.bounds));
  kit.beam({ from: [5, 0, 0], to: [5, 10, 0], w: 0.3, h: 0.3, material: m, name: 'post' }); // straight up
  assert.ok(near(kit.bounds().maxY, rafter.bounds.maxY), 'counted in the bounds');
  assert.equal(kit.flicker().length, 0);
  assert.throws(() => kit.beam({ from: [0, 0, 0], to: [0, 0, 0], material: m }), /length/);
  const { group, colliders } = kit.finish();
  assert.equal(colliders.length, 0, 'a post or a rafter is nothing to walk into');
  const tris = trianglesOf(group.children[0]);
  assert.equal(tris.length, 24);
  for (const [i, t] of tris.entries()) {
    assert.ok(t.area > 0 && dot(t.normal, t.stored) > 0.999, 'stored normal is the winding');
    const beam = i < 12 ? { from: [0, 200, -10], to: [0, 212, 30] } : { from: [5, 0, 0], to: [5, 10, 0] };
    const mid = beam.from.map((v, k) => (v + beam.to[k]) / 2);
    assert.ok(dot(t.normal, t.centroid.map((v, k) => v - mid[k])) > 0, 'faces out of the beam');
  }
});

test('a vertical sign: the text running down a narrow panel, reading right from both sides', () => {
  const { createKit } = load();
  const kit = createKit({ anchor: { x: 0, z: 0 } });
  const sign = kit.sign({ text: 'andaz', x: 0, z: 0, yTop: 170, yaw: Math.PI / 2, height: 2.4, width: 11, vertical: true, color: 0x3a3d40 });
  assert.ok(near(sign.bounds.maxY, 170) && near(sign.bounds.minY, 159), 'as tall as the text runs');
  assert.ok(near(sign.bounds.maxZ - sign.bounds.minZ, 2.4), 'as wide as the letters are tall');
  const tall = kit.sign({ text: 'andaz', x: 10, z: 0, y: 0, yaw: Math.PI / 2, height: 2, vertical: true, maxWidth: 4 });
  assert.ok(near(tall.bounds.maxY - tall.bounds.minY, 4) && near(tall.bounds.maxZ - tall.bounds.minZ, 2 * 4 / (2 * 0.62 * 5)), 'a run longer than maxWidth shrinks, keeping its shape');
  const { group } = kit.finish();
  const mesh = group.children.find((o) => o.material === sign.material);
  const uvs = mesh.geometry.attributes.uv.array;
  trianglesOf(mesh).slice(0, 4).forEach((t, k) => {
    const corners = [t.a, t.b, t.c].map((p, i) => ({ y: p[1], z: p[2], u: uvs[k * 6 + i * 2], v: uvs[k * 6 + i * 2 + 1] }));
    const start = corners.filter((c) => c.u === 0), end = corners.filter((c) => c.u === 1);
    assert.ok(start.length && end.length && start.every((c) => end.every((d) => c.y > d.y)), 'the text starts at the top');
    // the letters' tops toward the viewer's right: -z in front of a +x face, +z behind it
    const tops = corners.filter((c) => c.v === 1), feet = corners.filter((c) => c.v === 0);
    assert.ok(tops.length && feet.length && tops.every((c) => feet.every((d) => (t.normal[0] > 0 ? c.z < d.z : c.z > d.z))), 'reads right from ' + (t.normal[0] > 0 ? 'the front' : 'the back'));
  });
});
