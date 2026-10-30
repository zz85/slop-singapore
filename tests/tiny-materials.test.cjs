const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// The tiny look's materials (js/tiny-look.js): flat Lambert stand-ins for the city's photoreal materials, swapped in
// over the scene while the look is on (pairMaterial / onlyIn / applyTinyLook), the painted-window facades and the
// pastel palettes after tinywarsaw.app.

// A stand-in for any TSL node or three.js object: every property is another one, so is what calling or constructing
// one gives, and a property assigned is kept and read back
const chain = () => new Proxy(function node() {}, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k] : k === 'then' ? undefined : chain()),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => chain(),
  construct: () => chain()
});
class Chain { constructor(o) { const c = chain(); if (o && typeof o === 'object') Object.assign(c, o); return c; } }
const THREE = { MeshLambertNodeMaterial: Chain, Color: Chain, Vector3: Chain, InstancedMesh: Chain, Sphere: Chain, Matrix4: Chain, Quaternion: Chain, Group: Chain, IcosahedronGeometry: Chain, CylinderGeometry: Chain, BufferGeometry: Chain, Float32BufferAttribute: Chain, FrontSide: 0, DoubleSide: 2 };
const tsl = new Proxy({}, { get: () => chain() });
const source = (file) => readFileSync(join(__dirname, '..', file), 'utf8');
const load = () => loadModule(source('js/tiny-look.js'), { imports: { 'three/webgpu': THREE, 'three/tsl': tsl }, filename: 'tiny-look.js' });

test('the tiny look swaps the paired materials over the scene and shows only its own objects, and back', () => {
  const { pairMaterial, onlyIn, applyTinyLook } = load();
  const photo = { userData: {} }, tiny = { userData: {} }, other = { userData: {} };
  assert.equal(pairMaterial(photo, tiny), tiny);
  const mesh = (material) => ({ isMesh: true, material, visible: true });
  const a = mesh(photo), b = mesh(other), c = mesh(photo);
  const cards = { visible: true }, blocks = { visible: false };
  onlyIn(cards, 'photo');
  onlyIn(blocks, 'tiny');
  const root = { traverse(fn) { for (const o of [a, b, c, cards, blocks]) fn(o); } };
  applyTinyLook(root, true);
  assert.equal(a.material, tiny);
  assert.equal(c.material, tiny);
  assert.equal(b.material, other, 'an unpaired material is left alone');
  assert.equal(cards.visible, false);
  assert.equal(blocks.visible, true);
  applyTinyLook(root, true);
  assert.equal(a.material, tiny, 'again: stays');
  applyTinyLook(root, false);
  assert.equal(a.material, photo);
  assert.equal(c.material, photo);
  assert.equal(b.material, other);
  assert.equal(cards.visible, true);
  assert.equal(blocks.visible, false);
});

test('the palettes: Warsaw-style pastels per kind of building, and roof colours to match', () => {
  const { TINY_PALETTES, tinyRoofColor, tinyWallColor } = load();
  for (const kind of ['glass', 'office', 'slab', 'shophouse', 'concrete', 'civic']) {
    assert.ok(Array.isArray(TINY_PALETTES[kind]) && TINY_PALETTES[kind].length >= 3, kind);
    for (const hex of TINY_PALETTES[kind]) {
      assert.ok(Number.isInteger(hex) && hex >= 0 && hex <= 0xffffff);
      // pastel: every channel light
      assert.ok((hex >> 16) >= 0xb0 && ((hex >> 8) & 0xff) >= 0xb0 && (hex & 0xff) >= 0x90, `${kind} ${hex.toString(16)}`);
    }
  }
  // the wall colour is picked by the building's tone, stable per tone
  assert.equal(tinyWallColor('glass', 0.1), tinyWallColor('glass', 0.1));
  assert.ok(TINY_PALETTES.glass.includes(tinyWallColor('glass', 0.9)));
  // roofs: terracotta on shophouses, a light warm grey elsewhere, shaded by tone
  const [r, g, b] = tinyRoofColor('shophouse', 0.5);
  assert.ok(r > g && g > b, 'terracotta');
  const [r2, g2, b2] = tinyRoofColor('office', 0.5);
  assert.ok(r2 > 0.6 && Math.abs(r2 - g2) < 0.08 && Math.abs(g2 - b2) < 0.08, 'light grey');
  assert.ok(tinyRoofColor('office', 0.0)[0] < tinyRoofColor('office', 1.0)[0], 'darker to lighter by tone');
});

test('the materials: painted-window facades in four patterns, flat ground, faceted trees', () => {
  const m = load();
  for (const pattern of ['punched', 'ribbon', 'curtain', 'strips']) {
    const facade = m.createTinyFacadeMaterial({ kind: 'office', pattern, floorHeight: 3.5, bayWidth: 3 });
    assert.ok(facade.colorNode, `${pattern} draws its own colour`);
  }
  assert.throws(() => m.createTinyFacadeMaterial({ kind: 'office', pattern: 'stripes' }), /pattern/);
  assert.throws(() => m.createTinyFacadeMaterial({ kind: 'castle', pattern: 'punched' }), /kind/);
  const flat = m.createTinyFlatMaterial(0x9c9a95);
  assert.equal(flat.color, 0x9c9a95);
  const roof = m.createTinyRoofMaterial();
  assert.ok(roof.colorNode, 'reads the roof colour baked per building (tinyColor)');
  const tree = m.createTinyTreeMaterial();
  assert.equal(tree.flatShading, true, 'faceted crowns');
  assert.ok(tree.colorNode);
  const wall = m.createTinyTileWallMaterial();
  assert.ok(wall.colorNode);
});
