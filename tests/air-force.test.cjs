const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

const read = (file) => readFileSync(join(__dirname, '..', file), 'utf8');
const flight = loadModule(read('js/jet-flight.js'), { globals: { Math, Number }, filename: 'jet-flight.js' });

// Just enough of three.js's vectors and quaternions for js/air-force.js
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  add(v) { return this.set(this.x + v.x, this.y + v.y, this.z + v.z); }
  subVectors(a, b) { return this.set(a.x - b.x, a.y - b.y, a.z - b.z); }
  addScaledVector(v, k) { return this.set(this.x + v.x * k, this.y + v.y * k, this.z + v.z * k); }
  divideScalar(k) { return this.set(this.x / k, this.y / k, this.z / k); }
  length() { return Math.hypot(this.x, this.y, this.z); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  lerp(v, t) { return this.set(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t, this.z + (v.z - this.z) * t); }
  applyQuaternion(q) {
    const out = flight.qRotate([q.x, q.y, q.z, q.w], this.x, this.y, this.z);
    return this.set(out[0], out[1], out[2]);
  }
}
class Quaternion {
  constructor() { this.set(0, 0, 0, 1); }
  set(x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; return this; }
  copy(q) { return this.set(q.x, q.y, q.z, q.w); }
  slerp(q, t) {
    // (normalised lerp: close enough here)
    const d = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w < 0 ? -1 : 1;
    this.set(this.x + (q.x * d - this.x) * t, this.y + (q.y * d - this.y) * t, this.z + (q.z * d - this.z) * t, this.w + (q.w * d - this.w) * t);
    const L = Math.hypot(this.x, this.y, this.z, this.w);
    return this.set(this.x / L, this.y / L, this.z / L, this.w / L);
  }
}
class Group {
  constructor() { this.children = []; }
  add(o) { this.children.push(o); }
}
const model = () => ({
  root: { position: new Vector3(), quaternion: new Quaternion(), visible: true, traverse() {} },
  strobe: { visible: false },
  setGear() {}, setAfterburner(level) { this.ab = level; }, setStabilators() {}
});

const { createAirForce, FLYPAST, DIAMOND } = loadModule(read('js/air-force.js'), {
  imports: {
    'three/webgpu': { Vector3, Quaternion, Group },
    './jet-model.js': { createJetModel: model },
    './jet-flight.js': flight,
    './jet-effects.js': { WingtipTrails: class { clear() {} update() {} } }
  },
  globals: { Math, Number },
  filename: 'air-force.js'
});

function airForce(colliders = []) {
  const jet = {
    position: new Vector3(0, 2.3, 0), heading: 0, crashed: 0, stick: 0,
    flight: { q: flight.attitude(0), onGround: true, gear: 1, afterburner: 0, throttle: 0 }
  };
  const controllers = { entities: { jet }, nearColliders: (x, z, r) => colliders.filter((c) => Math.hypot(c.x - x, c.z - z) < r + 20) };
  return { af: createAirForce({ add() {} }, controllers), jet };
}
const camera = (x, y, z, dx, dz) => ({ position: new Vector3(x, y, z), getWorldDirection: (v) => v.set(dx, -0.2, dz) });
const run = (af, seconds, dt = 1 / 60, each = () => {}) => {
  for (let t = 0; t < seconds; t += dt) { each(t); af.update(dt, t); }
};

test('a flypast runs in from straight ahead of the view, in a diamond, and bursts in front of the camera', () => {
  const { af } = airForce();
  const eta = af.orderFlypast(camera(100, 2, 200, 0, 1)); // looking along +z: its right is -x
  assert.ok(Math.abs(eta - (FLYPAST.approach - FLYPAST.short) / FLYPAST.speed) < 1e-9);
  const [lead, left, right, slot] = af.flypast.jets;
  af.update(1 / 60, 0);
  assert.ok(af.flypast.jets.every((j) => j.model.root.visible && j.sound.active && j.contact.visible));
  // 6 km out ahead, a little to the right, coming towards the camera, at least 180 m up
  assert.ok(Math.abs(lead.pos.z - (200 + FLYPAST.approach)) < 5 && Math.abs(lead.pos.x - (100 - FLYPAST.side)) < 1);
  assert.ok(Math.abs(Math.abs(lead.heading) - Math.PI) < 1e-9, 'heading for the camera');
  assert.ok(lead.pos.y >= 180);
  // the diamond: wings either side and back, the slot behind, all lower than the lead
  const along = (j) => (j.pos.x - lead.pos.x) * Math.sin(lead.heading) + (j.pos.z - lead.pos.z) * Math.cos(lead.heading);
  assert.ok(Math.abs(along(left) + 15) < 0.01 && Math.abs(along(right) + 15) < 0.01 && Math.abs(along(slot) + 30) < 0.01);
  assert.ok(left.pos.y < lead.pos.y && slot.pos.y < left.pos.y);
  // the burst starts 900 m short of the camera, in front of it
  run(af, eta - 1 / 60);
  assert.ok(Math.abs(lead.pos.z - (200 + FLYPAST.short)) < 10, `pulls at z ${lead.pos.z.toFixed(0)}`);
  assert.ok(af.flypast.eta < 0.1);
});

test('the bomb burst: in afterburner, the lead straight up, the wings away to each side, then gone', () => {
  const { af } = airForce();
  af.orderFlypast(camera(0, 2, 0, 0, 1));
  const [lead, left, right, slot] = af.flypast.jets;
  run(af, af.flypast.eta + 6);
  assert.ok(lead.pos.y > 180 + 600, `the lead pulls up to ${lead.pos.y.toFixed(0)} m`);
  assert.ok(lead.model.ab > 0.9, 'in afterburner');
  const h = lead.heading;
  const side = (j) => (j.pos.x - lead.pos.x) * Math.cos(h) - (j.pos.z - lead.pos.z) * Math.sin(h);
  assert.ok(side(left) > 150 && side(right) < -150, `left ${side(left).toFixed(0)}, right ${side(right).toFixed(0)}`);
  assert.ok(Math.abs(side(slot)) < 20);
  run(af, FLYPAST.burst);
  assert.equal(af.flypast.active, false);
  assert.ok(af.flypast.jets.every((j) => !j.model.root.visible && !j.sound.active));
  assert.equal(DIAMOND.length, 4);
});

test('a flypast stays clear of the tallest building under its track', () => {
  // a 290 m tower on the run-in line, 3 km out
  const { af } = airForce([{ x: -FLYPAST.side, z: 3000, maxY: 290 }]);
  af.orderFlypast(camera(0, 2, 0, 0, 1));
  af.update(1 / 60, 0);
  assert.equal(af.flypast.jets[0].pos.y, 380);
});

test('the wingman parks beside the jet, then holds right echelon in the air', () => {
  const { af, jet } = airForce();
  af.setWingman(true);
  af.update(1 / 60, 0);
  const w = af.wingman.jet;
  assert.ok(w.model.root.visible);
  // on the runway: abreast, 15 m to the right (-x at heading 0)
  assert.ok(Math.abs(w.pos.x + 15) < 0.01 && Math.abs(w.pos.z - 2) < 0.01, `(${w.pos.x}, ${w.pos.z})`);
  // airborne at 200 m/s along +z
  jet.flight.onGround = false;
  jet.flight.gear = 0;
  jet.position.y = 500;
  run(af, 8, 1 / 60, () => { jet.position.z += 200 / 60; });
  assert.ok(Math.abs(w.pos.x + 16) < 0.5, `x ${w.pos.x.toFixed(2)}`);
  assert.ok(Math.abs(w.pos.z - (jet.position.z - 16)) < 1.5, `${(w.pos.z - jet.position.z).toFixed(1)} m behind`);
  assert.ok(Math.abs(w.pos.y - 498) < 0.5);
  assert.ok(Math.abs(w.sound.speed - 200) < 1);
  // the leader goes down: the wingman flies on
  jet.crashed = 3;
  const z = w.pos.z;
  run(af, 1);
  assert.ok(w.pos.z > z + 190, 'carried on');
  // it respawns 3 km away: the wingman is in place at once
  jet.crashed = 0;
  jet.position.set(0, 450, 3000 + z);
  af.update(1 / 60, 10);
  assert.ok(Math.abs(w.pos.x + 16) < 0.01 && Math.abs(w.pos.z - (jet.position.z - 16)) < 0.01);
  af.setWingman(false);
  assert.ok(!w.model.root.visible && !w.sound.active);
});
