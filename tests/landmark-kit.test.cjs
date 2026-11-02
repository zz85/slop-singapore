const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
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
  const sign = kit.sign({ text: 'citi', x: 0, z: 0, y: 200.6, yaw: Math.PI / 2, width: 24, height: 6, color: 0x003b70 });
  assert.equal(sign.type, 'sign');
  assert.equal(kit.triangles, before + 4 + 12, 'a quad each way, and the bar (in the air: with its underside)');
  assert.equal(sign.material.alphaTest, 0.5, 'cut out, not blended');
  assert.ok(!Object.hasOwn(sign.material, 'transparent'), 'not in the transparent pass');
  assert.equal(kit.sign({ text: 'citi', x: 0, z: 0, y: 200.6, yaw: Math.PI / 2, color: 0x003b70 }).material, sign.material, 'one material per text and colour');
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
  // a sign hung on a wall: no bar, its width capped by the wall
  const hung = kit.sign({ text: 'Standard Chartered', x: 50, z: 0, y: 150, height: 6, maxWidth: 30, bar: false });
  assert.ok(Math.abs(hung.bounds.maxX - hung.bounds.minX - 30) < 1e-9, 'capped at the wall');
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
