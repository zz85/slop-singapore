import * as THREE from 'three/webgpu';
import { Fn, attribute, clamp, color, cos, float, fract, length, mix, mrt, sin, smoothstep, time, uv, vec2, vec3, vec4 } from 'three/tsl';

// js/fountain-jets.js
// The water a landmark's fountains throw (kit.jet in js/landmark-kit.js records each jet: its nozzle, velocity, the
// water it falls into and its flight time): each jet is a stream of drops leaving the nozzle in turn and falling on
// its arc, breaking up as they fall, and a splash of drops thrown up where it lands. Camera-facing sprites whose
// places the shader works out from the time, as the steam stacks' in js/tsl-materials.js, so nothing is updated per
// frame. Drawn the same in both looks: white water, a little blue where it thins.

const G = 9.81;
const STREAM_DROPS_PER_SECOND = 220, SPRAY_DROPS_PER_SECOND = 160, SPLASH_DROPS = 110;

// a repeatable 0..1 per drop
const hash = (k) => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/**
 * One mesh of sprites for all the jets (kit.jets: { from, velocity, floor, width, time }), in the coordinates they
 * were recorded in (about the landmark's anchor), so it goes in the landmark's group. `sceneMRT`: the scene renders
 * into normal & reflection buffers as well as colour (js/main.js), which the sprites must then leave as they were.
 */
function buildFountainJets(jets, { sceneMRT = false } = {}) {
  const drops = [];
  jets.forEach((jet, j) => {
    // the stream: drops evenly spaced along one flight, each a little off the line as the jet breaks up
    const n = Math.round(Math.min(600, Math.max(60, jet.time * STREAM_DROPS_PER_SECOND)));
    for (let k = 0; k < n; k++) {
      drops.push({ from: jet.from, velocity: jet.velocity, phase: k / n, time: jet.time, seed: hash(j * 997 + k), size: jet.width, kind: 0, spread: 0.2, opacity: 0.85 });
    }
    // the spray it frays into: finer, fainter drops on the same arc, thrown wider as they fall (a curtain round the
    // stream's lower half, not a string of beads)
    const m = Math.round(Math.min(400, jet.time * SPRAY_DROPS_PER_SECOND));
    for (let k = 0; k < m; k++) {
      drops.push({ from: jet.from, velocity: jet.velocity, phase: hash(j * 953 + k * 13 + 5), time: jet.time, seed: hash(j * 947 + k), size: jet.width * 0.55, kind: 0, spread: 0.75, opacity: 0.4 });
    }
    // the splash: a broad, low burst where the stream lands, drops thrown out more than up, each falling back in its
    // own time
    const [lx, lz] = jet.lands, speed = Math.hypot(...jet.velocity);
    for (let k = 0; k < SPLASH_DROPS; k++) {
      const a = hash(j * 991 + k * 3 + 1) * Math.PI * 2, up = (0.2 + 0.8 * hash(j * 983 + k * 5 + 2)) * Math.min(3.2, speed * 0.3);
      const out = (0.6 + 2.2 * hash(j * 977 + k * 7 + 3)) * Math.min(1, speed / 6);
      drops.push({ from: [lx, jet.floor + 0.05, lz], velocity: [Math.cos(a) * out, up, Math.sin(a) * out], phase: hash(j * 971 + k * 11 + 4), time: 2 * up / G + 0.05, seed: hash(j * 967 + k), size: jet.width * 1.6, kind: 1, spread: 0.15, opacity: 0.55 });
    }
  });

  const count = drops.length;
  const fromArr = new Float32Array(count * 3), velArr = new Float32Array(count * 3), dropArr = new Float32Array(count * 4), lookArr = new Float32Array(count * 4);
  drops.forEach((d, i) => {
    fromArr.set(d.from, i * 3);
    velArr.set(d.velocity, i * 3);
    dropArr.set([d.phase, d.time, d.seed, d.size], i * 4);
    lookArr.set([d.kind, d.spread, d.opacity, 0], i * 4);
  });
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.setAttribute('aJetFrom', new THREE.InstancedBufferAttribute(fromArr, 3));
  geometry.setAttribute('aJetVelocity', new THREE.InstancedBufferAttribute(velArr, 3));
  geometry.setAttribute('aJetDrop', new THREE.InstancedBufferAttribute(dropArr, 4));
  geometry.setAttribute('aJetLook', new THREE.InstancedBufferAttribute(lookArr, 4));
  const mesh = new THREE.Mesh(geometry, createJetMaterial(sceneMRT));
  mesh.count = count;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.name = 'FountainJets';
  return mesh;
}

function createJetMaterial(sceneMRT) {
  const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  // transparent sprites leave the scene's normal & reflection buffers as they were, as the steam does (without those
  // buffers, as in tools/landmark-preview.html, this would leave the shader with no output at all)
  if (sceneMRT) mat.mrtNode = mrt({ normal: vec4(0, 0, 0, 0), metalRough: vec4(0, 0, 0, 0) });
  const from = attribute('aJetFrom', 'vec3'), velocity = attribute('aJetVelocity', 'vec3');
  const drop = attribute('aJetDrop', 'vec4'); // x: phase, y: flight time s, z: seed, w: size m
  const look = attribute('aJetLook', 'vec4'); // x: 0 stream / 1 splash, y: spread m/s, z: opacity
  // each drop flies its arc once per flight time, in turn with the others
  const life = fract(drop.x.add(time.div(drop.y)));

  mat.positionNode = Fn(() => {
    const t = life.mul(drop.y).toVar();
    const fall = vec3(0, t.mul(t).mul(-G / 2), 0);
    const s = drop.z.mul(6.2832);
    // a jet holds together as a rope out of the nozzle and frays into spray as it falls: off the line by t²
    const wander = vec3(sin(s.mul(7).add(t.mul(3.1))), cos(s.mul(5).add(t.mul(2.3))).mul(0.6), cos(s.mul(3).add(t.mul(2.7)))).mul(look.y.mul(t).mul(t));
    return from.add(velocity.mul(t)).add(fall).add(wander);
  })();

  mat.scaleNode = Fn(() => {
    const grow = mix(mix(float(1), float(1.4), life.mul(life)), mix(float(0.6), float(1.5), life), look.x);
    const s = drop.w.mul(grow);
    return vec2(s, s);
  })();

  mat.colorNode = mix(color(0xd7e9f2), color(0xffffff), smoothstep(0.7, 0.0, life));

  mat.opacityNode = Fn(() => {
    const disc = smoothstep(0.5, 0.16, length(uv().sub(0.5)));
    const fade = smoothstep(0.0, 0.03, life).mul(float(1).sub(smoothstep(0.86, 1.0, life)));
    return clamp(disc.mul(fade).mul(look.z), 0, 1);
  })();
  return mat;
}

export { buildFountainJets };
