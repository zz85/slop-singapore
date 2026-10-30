const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// The tiny look (?look=tiny): Slop Singapore lit and graded the way tinywarsaw.app is, a flat painted-sky look where
// the hemisphere light is as strong as the sun, there is no image-based lighting, no tone mapping and no bloom.
// js/lighting.js TIME_PRESETS.tiny and js/post-processing.js LOOKS.tiny are the two halves of one preset.

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
}
class Color { constructor(hex) { this.hex = hex; } }
const THREE = { Vector3, Color, NoToneMapping: 0, ACESFilmicToneMapping: 4, NeutralToneMapping: 7 };
// every TSL import is a function; none is called while the modules load
const tsl = new Proxy({}, { get: () => () => ({}) });
const source = (file) => readFileSync(join(__dirname, '..', file), 'utf8');

const lighting = loadModule(source('js/lighting.js'), {
  imports: {
    'three/webgpu': THREE,
    'three/tsl': tsl,
    'three/addons/objects/SkyMesh.js': { SkyMesh: class {} },
    'three/addons/lights/SunLight.js': { SunLight: class {} },
    'three/addons/lights/SunLightNode.js': { SunLightNode: class {} },
    './tsl-materials.js': { cityUniforms: {} }
  },
  filename: 'lighting.js'
});
const post = loadModule(source('js/post-processing.js'), {
  imports: { 'three/webgpu': THREE, 'three/tsl': tsl, 'three/addons/tsl/display/BloomNode.js': { bloom: () => ({}) } },
  filename: 'post-processing.js'
});

test('the tiny look: a flat preset, lit as Tiny Warsaw is', () => {
  const p = lighting.TIME_PRESETS.tiny;
  assert.ok(p, 'TIME_PRESETS.tiny');
  assert.equal(p.id, 'tiny');
  assert.equal(p.flat, true, 'a painted gradient sky, no image-based lighting');
  assert.equal(p.sunIntensity, p.hemiIntensity, 'the hemisphere light as strong as the sun: shadows about 2:1, not 10:1');
  assert.ok(p.sunIntensity >= 1.5 && p.sunIntensity <= 2.5, `sun ${p.sunIntensity}: Tiny Warsaw's 1.9 / 1.95 with no tone mapper`);
  assert.equal(p.envIntensity, 0, 'no IBL');
  assert.equal(p.interiorGlow, 0, 'no lit rooms by day');
  assert.equal(p.roadWetness, 0, 'bone-dry matte roads');
  assert.equal(p.canyonBounce, 0);
  assert.equal(p.nightFactor, 0);
  for (const id of ['golden', 'midday', 'twilight', 'midnight']) assert.ok(!lighting.TIME_PRESETS[id].flat, `${id} keeps the physical sky`);
});

test('the tiny look: no tone mapping, no bloom, no split toning; the others keep the filmic pipeline', () => {
  const look = post.LOOKS.tiny;
  assert.ok(look, 'LOOKS.tiny');
  assert.equal(look.toneMapping, THREE.NoToneMapping);
  assert.equal(look.bloom, 0);
  assert.equal(look.contrast, 1.0);
  assert.equal(look.toning, 0, 'no cool-shadow / warm-highlight split');
  assert.equal(look.reflections, 0, 'no screen-space reflections');
  assert.deepEqual([...look.balance], [1, 1, 1]); // (spread: the module runs in its own vm context, so the Array prototypes differ)
  assert.ok(look.vignette > 0.12, 'a stronger vignette, as the miniature has');
  assert.deepEqual(Object.keys(post.LOOKS).sort(), Object.keys(lighting.TIME_PRESETS).sort(), 'every time of day has a look and vice versa');
  for (const [id, l] of Object.entries(post.LOOKS)) {
    if (id === 'tiny') continue;
    assert.equal(l.toneMapping ?? THREE.ACESFilmicToneMapping, THREE.ACESFilmicToneMapping, `${id} tone mapping`);
    assert.equal(l.toning ?? 1, 1, `${id} split toning`);
    assert.equal(l.vignette ?? 0.12, 0.12, `${id} vignette`);
    assert.equal(l.reflections ?? 0.5, 0.5, `${id} reflections`);
  }
});

test('the Tiny look is offered in the time-of-day switch', () => {
  const html = source('index.html');
  assert.match(html, /<button id="time-tiny" class="time-btn" data-time="tiny"/);
});
