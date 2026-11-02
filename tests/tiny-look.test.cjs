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
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
}
// A stand-in for any TSL node, light, sky or material: every property is another one, so is what calling or
// constructing one gives, and a property assigned (a uniform's .value, a light's .intensity) is kept and read back
const chain = () => new Proxy(function node() {}, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k] : k === 'then' ? undefined : chain()),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => chain(),
  construct: () => chain()
});
class Chain { constructor() { return chain(); } }
const THREE = {
  Vector3, Color: Chain, FogExp2: Chain, HemisphereLight: Chain, Scene: Chain, PMREMGenerator: Chain,
  NoToneMapping: 0, ACESFilmicToneMapping: 4, NeutralToneMapping: 7
};
const tsl = new Proxy({}, { get: () => chain() });
const source = (file) => readFileSync(join(__dirname, '..', file), 'utf8');

const lighting = loadModule(source('js/lighting.js'), {
  imports: {
    'three/webgpu': THREE,
    'three/tsl': tsl,
    'three/addons/objects/SkyMesh.js': { SkyMesh: Chain },
    'three/addons/lights/SunLight.js': { SunLight: Chain },
    'three/addons/lights/SunLightNode.js': { SunLightNode: Chain },
    './tsl-materials.js': { cityUniforms: chain() }
  },
  filename: 'lighting.js'
});
const post = loadModule(source('js/post-processing.js'), {
  imports: {
    'three/webgpu': THREE,
    'three/tsl': tsl,
    'three/addons/tsl/display/BloomNode.js': { bloom: chain },
    'three/addons/tsl/display/GaussianBlurNode.js': { gaussianBlur: chain }
  },
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
  // the filmic looks leave those to the defaults: ACES, full split toning, the subtle vignette, half-strength SSR
  const D = post.LOOK_DEFAULTS;
  assert.deepEqual({ ...D }, { toning: 1, vignette: 0.12, reflections: 0.5, toneMapping: THREE.ACESFilmicToneMapping });
  for (const [id, l] of Object.entries(post.LOOKS)) {
    if (id === 'tiny') continue;
    for (const k of Object.keys(D)) assert.ok(!(k in l), `${id} leaves ${k} to the default`);
  }
});

test('grading for a look: the tiny look turns the tone mapper off and the SSR to 0, the others get it back', () => {
  const renderer = { toneMapping: null, toneMappingExposure: 0 };
  const grade = post.createPostProcessing(renderer, chain(), chain());
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping, 'golden at first');
  assert.ok(grade.outputNode && grade.tiltShiftNode, 'the plain and the tilt-shift output graphs');
  const tiny = grade.applyPreset('tiny');
  assert.equal(renderer.toneMapping, THREE.NoToneMapping);
  assert.equal(tiny.reflections, 0);
  assert.equal(tiny.bloom, 0);
  const golden = grade.applyPreset('golden');
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
  assert.deepEqual([golden.toning, golden.vignette, golden.reflections, golden.bloom], [1, 0.12, 0.5, 0.24]);
  assert.equal(grade.applyPreset('nonsense').exposure, golden.exposure, 'an unknown look: the golden hour');
});

test('lighting for a look: the tiny look paints the sky and puts the environment light out, the others undo it', () => {
  const scene = { add() {}, fog: null, background: null, environment: null, environmentIntensity: 1 };
  const L = new lighting.LightingSystem(scene, null);
  assert.equal(L.activePresetId, 'golden');
  assert.equal(L.uFlatSky.value, 0, 'the physical sky by default');
  assert.equal(scene.environmentIntensity, lighting.TIME_PRESETS.golden.envIntensity);
  L.applyPreset('tiny');
  assert.equal(L.activePresetId, 'tiny');
  assert.equal(L.uFlatSky.value, 1, 'the painted sky');
  assert.equal(scene.environmentIntensity, 0, 'no image-based light');
  assert.equal(L.sunLight.intensity, L.hemiLight.intensity, 'hemisphere as strong as the sun');
  L.applyPreset('midday');
  assert.equal(L.uFlatSky.value, 0);
  assert.equal(scene.environmentIntensity, lighting.TIME_PRESETS.midday.envIntensity);
  assert.equal(L.sunLight.intensity, lighting.TIME_PRESETS.midday.sunIntensity);
  L.applyPreset('nonsense');
  assert.equal(L.activePresetId, 'golden', 'an unknown look: the golden hour');
});

test('the Tiny look is offered in the time-of-day switch, the map view among the cameras', () => {
  const html = source('index.html');
  assert.match(html, /<button id="time-tiny" class="time-btn" data-time="tiny"/);
  const cameras = html.slice(html.indexOf('id="camera-popover"'), html.indexOf('<!-- Full-Screen'));
  assert.match(cameras, /<div class="pop-title">Free<\/div>\s*<button id="cam-map" class="pop-item cam-btn" data-camera="map"/);
});
