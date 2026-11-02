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
const THREE = { Group, Mesh: Chain, BufferGeometry: Chain, Float32BufferAttribute: Chain, MeshStandardNodeMaterial: Chain, MeshLambertNodeMaterial: Chain, Color: Chain, FrontSide: 0, DoubleSide: 2 };
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
