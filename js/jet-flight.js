// js/jet-flight.js
// The F-15SG's flight model: arcade, but built on the numbers that make a fighter feel like one. No three.js, so it
// runs (and is tested) anywhere. World frame as the rest of the city: x, y up, z; a heading h points along
// (sin h, 0, cos h). The jet's body: forward +z, up +y, left wing +x; its attitude a unit quaternion [x, y, z, w].
//
// - Speed along the nose from thrust (dry up to military power, then afterburner), drag that grows with the square of
//   speed (more with the gear or the speed brake out, and from pulling hard), and gravity along the climb: a zoom climb
//   trades speed for height and a dive gives it back. Full afterburner tops out at Mach 1.1 at sea level, military
//   power at about Mach 0.85.
// - Pitch and roll from the stick. Pitch rate is bounded by the stick, by 9 g at speed and by elevator authority when
//   slow; roll at up to 200°/s. Banking turns the jet as lift would (a level, coordinated turn), so A/D alone fly it
//   round a corner and the stick tightens the turn; a small bank with the stick centred levels itself.
// - Below the stall it mushes: the nose drops and it sinks until it has flying speed again.
// - On the ground: nosewheel steering, rotate at 140 knots with the stick back, lift off above 150; brakes with the
//   throttle closed. It lands on any land with the gear down, the wings near level and a descent under 7 m/s; anything
//   else, or water, or a building, is a crash.

const G = 9.81;

const JET = {
  gearHeight: 2.3, // m from the wheels to the model's origin (the jet's centre), gear down
  bellyHeight: 1.05, // m from its belly to the origin, gear up
  stallSpeed: 62, // m/s (~120 kt): below it the nose drops and it sinks
  rotateSpeed: 72, // m/s (~140 kt): the nose can come up on the runway
  liftoffSpeed: 78, // m/s (~150 kt)
  maxPitchRate: 0.5, // rad/s
  maxG: 9,
  maxRollRate: 3.4, // rad/s (~200°/s)
  dryThrust: 7, // m/s² at military power (throttle 0.8): thrust over the jet's weight, ~0.7 g
  wetThrust: 12.5, // m/s² at full afterburner: ~1.25 g, enough to accelerate straight up
  afterburner: 0.8, // throttle above which the afterburner lights
  drag: 8.8e-5, // per metre: drag = drag · v²
  turnBleed: 0.035, // speed lost to pulling: per (rad/s of pitch) · (m/s)
  gearDrag: 0.8, // extra share of drag with the gear down
  speedBrake: 1.6, // extra share of drag with the speed brake out
  rolling: 0.25, // m/s² on the runway
  wheelBrake: 5.5, // m/s²
  throttleRate: 0.55, // per second
  ceiling: 9000, // m
  thrustLapse: 12000 // m: thrust falls off with height, to nothing at this altitude
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------------------------------------------------
// Quaternions ([x, y, z, w]) and the vectors they turn
// ---------------------------------------------------------------------------------------------------------------------
function qMul(a, b, out = [0, 0, 0, 1]) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  out[0] = aw * bx + ax * bw + ay * bz - az * by;
  out[1] = aw * by - ax * bz + ay * bw + az * bx;
  out[2] = aw * bz + ax * by - ay * bx + az * bw;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
function qAxis(x, y, z, angle, out = [0, 0, 0, 1]) {
  const s = Math.sin(angle / 2);
  out[0] = x * s; out[1] = y * s; out[2] = z * s; out[3] = Math.cos(angle / 2);
  return out;
}
function qNormalize(q) {
  const L = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  q[0] /= L; q[1] /= L; q[2] /= L; q[3] /= L;
  return q;
}
/** v turned by q, into out ([x, y, z]) */
function qRotate(q, x, y, z, out = [0, 0, 0]) {
  const [qx, qy, qz, qw] = q;
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  out[0] = x + qw * tx + qy * tz - qz * ty;
  out[1] = y + qw * ty + qz * tx - qx * tz;
  out[2] = z + qw * tz + qx * ty - qy * tx;
  return out;
}
/** The attitude at heading h, pitched up by `pitch` (rad) and rolled right by `roll` (rad) */
function attitude(h, pitch = 0, roll = 0, out = [0, 0, 0, 1]) {
  qAxis(0, 1, 0, h, out);
  qMul(out, qAxis(1, 0, 0, -pitch, _t), out);
  return qNormalize(qMul(out, qAxis(0, 0, 1, roll, _t), out));
}
const _t = [0, 0, 0, 1], _r = [0, 0, 0, 1];
const _f = [0, 0, 0], _u = [0, 0, 0], _l = [0, 0, 0];

// turn q about its own (body) axis, or about a world axis
function turnBody(q, x, y, z, angle) {
  if (angle) qNormalize(qMul(q, qAxis(x, y, z, angle, _r), q));
}
function turnWorld(q, x, y, z, angle) {
  if (angle) qNormalize(qMul(qAxis(x, y, z, angle, _r), q.slice(), q));
}

/** The jet's axes and attitude angles: forward, up, left (world vectors), heading, pitch (climb) & bank (right +) */
function axes(q) {
  qRotate(q, 0, 0, 1, _f);
  qRotate(q, 0, 1, 0, _u);
  qRotate(q, 1, 0, 0, _l);
  return {
    forward: _f, up: _u, left: _l,
    pitch: Math.asin(clamp(_f[1], -1, 1)),
    bank: Math.atan2(_l[1], _u[1]),
    horizontal: Math.hypot(_f[0], _f[2])
  };
}

/** Thrust (m/s²) at a throttle setting (0..1): dry up to military power, then the afterburner */
function thrustAt(throttle, altitude = 0) {
  const t = clamp(throttle, 0, 1);
  const a = t <= JET.afterburner ? (t / JET.afterburner) * JET.dryThrust
    : JET.dryThrust + ((t - JET.afterburner) / (1 - JET.afterburner)) * (JET.wetThrust - JET.dryThrust);
  return a * clamp(1 - Math.max(0, altitude) / JET.thrustLapse, 0.05, 1);
}

/** How hard a bank turns the jet (tan of the bank, as a level turn needs; easing off inverted) */
function turnFactor(bank) {
  const c = Math.cos(bank), s = Math.sin(bank);
  const k = c > 0.25 ? s / c : s * 4 * clamp((c + 0.25) / 0.5, 0, 1);
  return clamp(k, -5, 5);
}

/** A fresh jet: parked (onGround) at (x, y, z) facing heading h, or flying at `speed` */
function createJetState({ x = 0, y = JET.gearHeight, z = 0, heading = 0, speed = 0, onGround = true, throttle = 0 } = {}) {
  return {
    position: { x, y, z },
    q: attitude(heading),
    heading,
    speed,
    throttle,
    sink: 0, // m/s downward, when stalled
    onGround,
    groundPitch: 0, // the nose up on the runway (rad)
    gear: onGround ? 1 : 0, // 0 up .. 1 down
    g: 1, // load factor, for the HUD
    pitchRate: 0,
    rollRate: 0,
    climbRate: 0,
    afterburner: 0, // 0..1 how lit it is
    stalled: false,
    speedBrake: false
  };
}

/**
 * Advance the jet by h seconds.
 * input: { pitch: -1..1 (+ nose up), roll: -1..1 (+ right), throttle: -1..1 (+ more), brake: bool }
 * env: { groundAt(x, z) -> height of the land there, or null over water }
 * Returns null, or { event: 'landed' | 'liftoff' | 'crash', cause }.
 */
function stepJet(s, input, h, env = {}) {
  if (!(h > 0)) return null;
  const pitchIn = clamp(Number(input.pitch) || 0, -1, 1);
  const rollIn = clamp(Number(input.roll) || 0, -1, 1);
  s.throttle = clamp(s.throttle + (Number(input.throttle) || 0) * JET.throttleRate * h, 0, 1);
  // the speed brake (in the air) or the wheel brakes (on the ground): holding throttle-down with it closed
  s.speedBrake = !!input.brake && s.throttle <= 0;
  s.afterburner += ((s.throttle > JET.afterburner ? (s.throttle - JET.afterburner) / (1 - JET.afterburner) : 0) - s.afterburner) * (1 - Math.exp(-h * 6));
  const p = s.position;
  const ground = env.groundAt ? env.groundAt(p.x, p.z) : 0;
  const groundY = ground ?? 0;
  const thrust = thrustAt(s.throttle, p.y);
  let v = s.speed;
  let event = null;

  if (s.onGround) {
    // Rolling on the gear: steer the nosewheel, the stick lifts the nose once fast enough, lifts off with the nose up
    s.gear = 1;
    const steer = 0.45 * clamp(1 - v / 90, 0.08, 1);
    s.heading -= rollIn * steer * h;
    const nose = v > JET.rotateSpeed ? Math.max(0, pitchIn) * 0.22 : 0;
    s.groundPitch = clamp(s.groundPitch + (nose ? nose * h : -0.15 * h), 0, 0.26);
    const drag = JET.drag * v * v * (1 + JET.gearDrag);
    const brake = s.speedBrake ? JET.wheelBrake : 0;
    v = Math.max(0, v + (thrust - drag - (v > 0 ? JET.rolling + brake : 0)) * h);
    p.x += Math.sin(s.heading) * v * h;
    p.z += Math.cos(s.heading) * v * h;
    p.y = groundY + JET.gearHeight;
    attitude(s.heading, s.groundPitch, 0, s.q);
    s.pitchRate = s.rollRate = s.climbRate = s.sink = 0;
    s.g = 1;
    s.stalled = false;
    if (v > JET.liftoffSpeed && s.groundPitch > 0.1) {
      s.onGround = false;
      p.y += 0.05;
      event = { event: 'liftoff' };
    } else if (ground === null) {
      event = { event: 'crash', cause: 'water' };
    }
    s.speed = v;
    return event;
  }

  // In the air
  const q = s.q;
  const pitchAuthority = clamp((v - 30) / 70, 0.15, 1);
  const pitchRate = pitchIn * Math.min(JET.maxPitchRate, (JET.maxG * G) / Math.max(v, 1)) * pitchAuthority;
  const rollRate = rollIn * JET.maxRollRate * clamp((v - 20) / 80, 0.25, 1);
  turnBody(q, 1, 0, 0, -pitchRate * h); // nose up: about the right wing
  turnBody(q, 0, 0, 1, rollRate * h); // right roll: the left wing up
  let a = axes(q);
  // a small bank with the stick centred levels itself
  if (!rollIn && Math.abs(a.bank) < 0.45 && a.up[1] > 0) turnBody(q, 0, 0, 1, -a.bank * Math.min(1, 1.4 * h));
  // lift turns a banked jet (about the world's vertical: right bank, heading decreasing)
  const turnRate = -(G / Math.max(v, 55)) * turnFactor(a.bank) * a.horizontal * clamp(v / JET.stallSpeed, 0, 1);
  turnWorld(q, 0, 1, 0, turnRate * h);
  // stalled: the nose falls through
  const stall = clamp(1 - v / JET.stallSpeed, 0, 1);
  a = axes(q);
  if (stall > 0) {
    // about the horizontal axis across the nose, towards the ground
    const ax = a.forward[2], az = -a.forward[0];
    const L = Math.hypot(ax, az);
    if (L > 1e-4) turnWorld(q, ax / L, 0, az / L, stall * 1.6 * h * Math.min(1, L * 4));
    else turnBody(q, 1, 0, 0, stall * 1.6 * h); // straight up: over the top
    a = axes(q);
  }
  // speed: thrust, drag (more with the gear or speed brake, and while pulling), gravity along the climb
  const dragShare = 1 + s.gear * JET.gearDrag + (s.speedBrake ? JET.speedBrake : 0);
  const accel = thrust - JET.drag * v * v * dragShare - JET.turnBleed * Math.abs(pitchRate) * v - G * a.forward[1];
  v = Math.max(0, v + accel * h);
  s.sink = stall > 0 ? Math.min(60, s.sink + G * stall * h) : s.sink * Math.exp(-h * 2.5);
  const f = a.forward;
  p.x += f[0] * v * h;
  p.y += (f[1] * v - s.sink) * h;
  p.z += f[2] * v * h;
  if (p.y > JET.ceiling) p.y = JET.ceiling;
  if (a.horizontal > 1e-3) s.heading = Math.atan2(f[0], f[2]);
  s.speed = v;
  s.pitchRate = pitchRate;
  s.rollRate = rollRate;
  s.climbRate = f[1] * v - s.sink;
  s.stalled = stall > 0.05;
  // load factor along the jet's up: gravity's share, the bank's turn (1 / cos bank in a level turn) and the pull
  const n = a.up[1] + (Math.abs(turnRate) * v * Math.abs(Math.sin(a.bank)) + pitchRate * v) / G;
  s.g += (clamp(n, -3, 12) - s.g) * (1 - Math.exp(-h * 8));
  // the gear: down low and slow, up once climbing away fast
  const agl = p.y - groundY;
  const wantGear = agl < 250 && v < 115 ? 1 : agl > 30 && v > 95 ? 0 : (s.gear > 0.5 ? 1 : 0);
  s.gear = clamp(s.gear + Math.sign(wantGear - s.gear) * h / 2.5, 0, 1);

  // touching down, or hitting the ground
  const contact = s.gear > 0.9 ? JET.gearHeight : JET.bellyHeight;
  if (p.y - groundY <= contact) {
    const gentle = ground !== null && s.gear > 0.9 && s.climbRate > -7 && Math.abs(a.bank) < 0.3
      && a.pitch > -0.12 && a.pitch < 0.35 && a.up[1] > 0;
    if (gentle) {
      s.onGround = true;
      s.groundPitch = clamp(a.pitch, 0, 0.26);
      p.y = groundY + JET.gearHeight;
      s.sink = 0;
      attitude(s.heading, s.groundPitch, 0, s.q);
      event = { event: 'landed' };
    } else {
      p.y = groundY + contact;
      event = { event: 'crash', cause: ground === null ? 'water' : 'ground' };
    }
  }
  return event;
}

export { JET, G, createJetState, stepJet, thrustAt, turnFactor, attitude, axes, qMul, qAxis, qRotate, qNormalize };
