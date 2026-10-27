import assert from 'node:assert/strict';
import test from 'node:test';
import { JET, createJetState, stepJet, axes, attitude, thrustAt } from '../js/jet-flight.js';

const land = { groundAt: () => 0 };
const sea = { groundAt: () => null };

// fly for `seconds` at 120 Hz with a constant (or per-step) input, collecting events
function fly(s, input, seconds, env = land) {
  const events = [];
  const h = 1 / 120;
  for (let i = 0; i < Math.round(seconds * 120); i++) {
    const e = stepJet(s, typeof input === 'function' ? input(s, i * h) : input, h, env);
    if (e) events.push(e.event + (e.cause ? `:${e.cause}` : ''));
    if (e?.event === 'crash') break;
  }
  return events;
}
const airborne = (y = 1500, speed = 200, throttle = 0.6, heading = 0) =>
  createJetState({ y, speed, throttle, heading, onGround: false });

test('thrust: dry up to military power, the afterburner above it', () => {
  assert.equal(thrustAt(0), 0);
  assert.equal(thrustAt(JET.afterburner), JET.dryThrust);
  assert.equal(thrustAt(1), JET.wetThrust);
  assert.ok(thrustAt(1, 6000) < thrustAt(1, 0));
});

test('top speed: about Mach 1.1 in full afterburner and Mach 0.85 at military power, at low level', () => {
  const wet = airborne(800, 250, 1);
  fly(wet, { throttle: 1 }, 90);
  assert.ok(wet.speed > 360 && wet.speed < 400, `afterburner ${wet.speed.toFixed(0)} m/s`);
  const dry = airborne(800, 200, JET.afterburner);
  fly(dry, {}, 90);
  assert.ok(dry.speed > 265 && dry.speed < 300, `military ${dry.speed.toFixed(0)} m/s`);
});

test('hands off, it flies straight and level', () => {
  const s = airborne(1500, 220, 0.75, 1.2);
  fly(s, {}, 20);
  assert.ok(Math.abs(s.position.y - 1500) < 25, `altitude ${s.position.y.toFixed(1)}`);
  assert.ok(Math.abs(s.heading - 1.2) < 0.01, `heading ${s.heading}`);
  assert.ok(Math.abs(axes(s.q).bank) < 0.01);
});

test('a bank turns it the way it banks; a small bank with the stick centred levels out', () => {
  const s = airborne(1500, 200, 0.8, 0);
  fly(s, { roll: 1 }, 0.35); // ~60° right
  const bank = axes(s.q).bank;
  assert.ok(bank > 0.8 && bank < 1.3, `bank ${bank}`);
  const before = s.heading;
  fly(s, {}, 5);
  // right turn: the heading decreases (forward (sin h, cos h), right of it is -x at h = 0)
  assert.ok(s.heading < before - 0.15, `heading ${before} -> ${s.heading}`);
  assert.ok(Math.abs(s.position.y - 1500) < 60, `held its height: ${s.position.y.toFixed(0)}`);
  assert.ok(Math.abs(s.g - 1 / Math.cos(axes(s.q).bank)) < 0.25, `pulling ${s.g.toFixed(2)} g at ${axes(s.q).bank.toFixed(2)} rad`);

  const shallow = airborne(1500, 200, 0.8, 0);
  fly(shallow, { roll: 1 }, 0.08);
  fly(shallow, {}, 6);
  assert.ok(Math.abs(axes(shallow.q).bank) < 0.02, `levelled to ${axes(shallow.q).bank}`);
});

test('the stick pitches the nose, never past 9 g', () => {
  const s = airborne(3000, 250, 1);
  let peak = 0;
  fly(s, (st) => { peak = Math.max(peak, st.g); return { pitch: 1 }; }, 1.5);
  assert.ok(axes(s.q).pitch > 0.3, `nose up ${axes(s.q).pitch}`);
  assert.ok(peak <= JET.maxG + 1.2, `peak ${peak.toFixed(1)} g`);
  const d = airborne(3000, 250, 1);
  fly(d, { pitch: -1 }, 1);
  assert.ok(axes(d.q).pitch < -0.2);
});

test('a zoom climb trades speed for height; at the top it stalls and the nose falls through', () => {
  const s = airborne(1000, 160, 0);
  s.q = attitude(0, 1.3, 0); // nearly vertical, throttle idle
  let stalled = false, top = 0;
  fly(s, (st) => { stalled ||= st.stalled; top = Math.max(top, st.position.y); return {}; }, 25);
  assert.ok(stalled, 'stalled');
  assert.ok(top > 1800, `zoomed to ${top.toFixed(0)} m`);
  assert.ok(axes(s.q).pitch < 0, `nose fell to ${axes(s.q).pitch}`);
});

test('takes off from the runway in full afterburner, inside Paya Lebar\'s 3.8 km', () => {
  const s = createJetState({ heading: 0.4 });
  assert.equal(s.position.y, JET.gearHeight);
  let liftoffAt = null;
  const events = fly(s, (st) => {
    if (!st.onGround && liftoffAt === null) liftoffAt = Math.hypot(st.position.x, st.position.z);
    // stick back at rotation speed, then hold a 15° climb
    return { throttle: 1, pitch: st.speed < JET.rotateSpeed ? 0 : st.onGround ? 1 : axes(st.q).pitch < 0.25 ? 0.5 : 0 };
  }, 40);
  assert.ok(events.includes('liftoff'), events.join());
  assert.ok(liftoffAt > 200 && liftoffAt < 2500, `rolled ${liftoffAt?.toFixed(0)} m`);
  assert.ok(s.position.y > 200, `climbed to ${s.position.y.toFixed(0)} m`);
  assert.equal(s.gear, 0, 'gear up once climbing away fast');
});

test('rolls, steers and brakes on the ground', () => {
  const s = createJetState({ speed: 40 });
  fly(s, { roll: 1 }, 2);
  assert.ok(s.heading < -0.2, `steered right to ${s.heading}`);
  const before = s.speed;
  fly(s, { throttle: -1, brake: true }, 3);
  assert.ok(s.speed < before - 12, `braked ${before.toFixed(0)} -> ${s.speed.toFixed(0)}`);
});

test('lands gently with the gear down; crashes diving in, or onto the sea', () => {
  const s = airborne(60, 75, 0.35);
  s.gear = 1;
  s.q = attitude(0, -0.03, 0);
  const events = fly(s, (st) => ({ pitch: st.climbRate < -3 ? 0.4 : st.climbRate > -1 ? -0.2 : 0 }), 40);
  assert.ok(events.includes('landed'), events.join());
  assert.ok(s.onGround);

  const dive = airborne(300, 200, 0.8);
  dive.q = attitude(0, -0.6, 0);
  assert.deepEqual(fly(dive, {}, 10).slice(-1), ['crash:ground']);

  const ditch = airborne(60, 75, 0.35);
  ditch.gear = 1;
  ditch.q = attitude(0, -0.03, 0);
  assert.deepEqual(fly(ditch, {}, 40, sea).slice(-1), ['crash:water']);
});
