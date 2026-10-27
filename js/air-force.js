import * as THREE from 'three/webgpu';
import { createJetModel } from './jet-model.js';
import { attitude } from './jet-flight.js';
import { WingtipTrails } from './jet-effects.js';

// js/air-force.js
// The RSAF's other F-15SGs (js/jet-model.js, without cockpits):
// - A wingman on the player's jet: in right echelon, 16 m off the right wing and 16 m back, a little low; on the runway
//   abreast of it, 2 m of air between the wingtips (so the chase camera sees both). It holds its place in the leader's frame, catching up a little late, so a roll or a pull
//   swings it round and back into position; when the leader crashes it flies on, and rejoins when the leader is back.
// - A flypast ordered for wherever the camera is: four jets in a diamond (lead, left and right wing, slot) running in
//   level from about 6 km out ahead of the view, straight towards it (passing a little to one side), low enough to be
//   loud but clear of the tallest buildings under their track, so they are watched coming the whole way; then, about
//   900 m short (climbing into the view, not over it), a bomb burst in front of the camera: all four in afterburner, the lead pulling straight up, the wings
//   peeling left and right, the slot rolling up the middle, vapour off their wingtips; and on over the top.
// The jets are heard through js/audio-sources.js (`aircraft`) and drawn on the radar and map (`contacts`).
// createAirForce(scene, controllers) returns { group, aircraft, contacts, setWingman(on), wingman, orderFlypast(camera),
// flypast: { active, eta }, update(dt, elapsed) }.

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const qArray = [0, 0, 0, 1];

function aiJet(group) {
  const model = createJetModel({ cockpit: false });
  model.root.traverse((o) => {
    if (o.isMesh && !o.material.transparent && !o.material.isMeshBasicNodeMaterial) o.castShadow = true;
  });
  model.root.visible = false;
  model.setGear(0);
  group.add(model.root);
  return {
    model,
    pos: model.root.position,
    q: model.root.quaternion,
    // what js/audio-sources.js hears
    sound: { active: false, x: 0, y: 0, z: 0, speed: 0, throttle: 0, heading: 0, gain: 1 },
    contact: { visible: false, x: 0, z: 0, heading: 0 }
  };
}

function syncOutputs(j, speed, throttle, heading) {
  const s = j.sound;
  s.active = j.model.root.visible;
  s.x = j.pos.x; s.y = j.pos.y; s.z = j.pos.z;
  s.speed = speed;
  s.throttle = throttle;
  s.heading = heading;
  const c = j.contact;
  c.visible = s.active;
  c.x = j.pos.x; c.z = j.pos.z;
  c.heading = heading;
}

// ---------------------------------------------------------------------------------------------------------------------
// The wingman
// ---------------------------------------------------------------------------------------------------------------------
const ECHELON = new THREE.Vector3(-16, -2, -16); // (body frame: left +x, so the right wing is -x)
const ON_RUNWAY = new THREE.Vector3(-15, 0, 2);

class Wingman {
  constructor(group) {
    this.jet = aiJet(group);
    this.jet.sound.gain = 0.7;
    this.enabled = false;
    this.fresh = true;
    this.vel = new THREE.Vector3();
    this.lastLead = new THREE.Vector3();
    this.leadVelocity = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.leadQ = new THREE.Quaternion();
    this.offset = new THREE.Vector3();
  }

  setEnabled(on) {
    this.enabled = !!on;
    this.fresh = true;
    this.jet.model.root.visible = this.enabled;
    if (!this.enabled) syncOutputs(this.jet, 0, 0, 0);
  }

  update(dt, elapsed, lead) {
    const j = this.jet;
    if (!this.enabled || !lead || !(dt > 0)) return;
    const s = lead.flight;
    const L = lead.position;
    // where the leader went this frame (a teleport or a respawn is not a velocity)
    const moved = _v.subVectors(L, this.lastLead).length();
    const jumped = this.fresh || moved > Math.max(60, 400 * dt);
    if (!jumped) this.leadVelocity.copy(_v).divideScalar(dt);
    this.lastLead.copy(L);

    if (lead.crashed > 0) {
      // the leader is down: fly on as we were, levelling off
      j.pos.addScaledVector(this.vel, dt);
      this.vel.y *= Math.exp(-dt);
      j.pos.y = Math.max(j.pos.y, 60);
    } else {
      this.leadQ.set(s.q[0], s.q[1], s.q[2], s.q[3]);
      // in echelon in the air, beside and behind on the runway (the gear's travel blends between the two)
      this.offset.copy(ECHELON).lerp(ON_RUNWAY, s.onGround ? 1 : Math.min(1, s.gear) * 0.6);
      const target = this.target.copy(this.offset).applyQuaternion(this.leadQ).add(L);
      if (jumped && (this.fresh || target.distanceTo(j.pos) > 300)) {
        // a fresh start, or the leader is somewhere else now: in place at once
        j.pos.copy(target);
        j.q.copy(this.leadQ);
        this.vel.set(0, 0, 0);
      } else {
        // carried along with the leader, easing into its place; turning to its attitude a little late
        if (!jumped) {
          this.vel.copy(this.leadVelocity);
          j.pos.addScaledVector(this.vel, dt);
        }
        j.pos.lerp(target, 1 - Math.exp(-dt * 2.2));
        j.q.slerp(this.leadQ, 1 - Math.exp(-dt * 4));
      }
      this.fresh = false;
    }
    j.pos.y = Math.max(j.pos.y, 2.3);
    const m = j.model;
    m.setGear(lead.crashed > 0 ? 0 : s.gear);
    m.setAfterburner(lead.crashed > 0 ? 0.3 : s.afterburner);
    m.setStabilators(lead.stick || 0);
    m.strobe.visible = ((elapsed + 0.45) % 1.3) < 0.07;
    const speed = this.vel.length();
    syncOutputs(j, speed, lead.crashed > 0 ? 0.8 : s.throttle, Math.atan2(this.vel.x, this.vel.z) || lead.heading);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The flypast
// ---------------------------------------------------------------------------------------------------------------------
// The diamond, in the lead's frame (left +x, up +y, forward +z), and each jet's part in the bomb burst
const DIAMOND = [
  { at: [0, 0, 0], burst: { pitch: 1.45, turn: 0, bank: 0, roll: 0 } }, // lead: straight up
  { at: [15, -2, -15], burst: { pitch: 0.75, turn: 0.22, bank: -1.0, roll: 0 } }, // left wing: up and away left
  { at: [-15, -2, -15], burst: { pitch: 0.75, turn: -0.22, bank: 1.0, roll: 0 } }, // right wing: up and away right
  { at: [0, -4, -30], burst: { pitch: 1.2, turn: 0, bank: 0, roll: 2.2 } } // slot: rolling up the middle
];
// m/s; the run-in's length and how far short of the camera the burst starts (m); its offset to the side (m); how long
// the burst is watched (s)
const FLYPAST = { speed: 190, approach: 6000, short: 900, side: 90, burst: 18 };

class Flypast {
  constructor(group) {
    this.jets = DIAMOND.map((d) => ({ ...aiJet(group), part: d, heading: 0, pitch: 0, bank: 0, rollAngle: 0 }));
    this.trails = this.jets.map(() => new WingtipTrails(group));
    this.active = false;
    this.t = 0;
    this.start = new THREE.Vector3();
    this.dir = new THREE.Vector3();
    this.tips = [new THREE.Vector3(), new THREE.Vector3()];
    this.up = new THREE.Vector3();
  }

  /** Time until the bomb burst (s) */
  get eta() {
    return this.active ? Math.max(0, this.pullAt - this.t) : 0;
  }

  get pullAt() { return (FLYPAST.approach - FLYPAST.short) / FLYPAST.speed; }

  // run in towards (ox, oz) along the unit direction (dx, dz) at height `altitude`, from FLYPAST.approach out
  begin(ox, oz, dx, dz, altitude) {
    this.active = true;
    this.t = 0;
    this.dir.set(dx, 0, dz);
    this.start.set(ox - dx * FLYPAST.approach, altitude, oz - dz * FLYPAST.approach);
    const heading = Math.atan2(dx, dz);
    for (const j of this.jets) {
      j.heading = heading;
      j.pitch = j.bank = j.rollAngle = 0;
      j.model.root.visible = true;
      j.model.setGear(0);
    }
    for (const t of this.trails) t.clear();
  }

  end() {
    this.active = false;
    for (const j of this.jets) {
      j.model.root.visible = false;
      syncOutputs(j, 0, 0, 0);
    }
    for (const t of this.trails) t.clear();
  }

  update(dt, elapsed) {
    if (!this.active || !(dt > 0)) return;
    this.t += dt;
    const pull = this.pullAt;
    const v = FLYPAST.speed;
    if (this.t >= pull + FLYPAST.burst) {
      this.end();
      return;
    }
    if (this.t < pull) {
      // in formation: the lead along the run-in line, the others in their places around it
      const lead = _v.copy(this.start).addScaledVector(this.dir, v * this.t);
      attitude(this.jets[0].heading, 0, 0, qArray);
      _q.set(qArray[0], qArray[1], qArray[2], qArray[3]);
      for (const j of this.jets) {
        j.pos.set(...j.part.at).applyQuaternion(_q).add(lead);
        j.q.copy(_q);
        j.model.setAfterburner(0);
        syncOutputs(j, v, 0.75, j.heading);
      }
    } else {
      // the bomb burst: each its own way, in afterburner
      const into = this.t - pull;
      this.jets.forEach((j, k) => {
        const b = j.part.burst;
        j.pitch += Math.max(-0.5 * dt, Math.min(0.5 * dt, b.pitch - j.pitch));
        j.bank += (b.bank - j.bank) * (1 - Math.exp(-dt * 2));
        j.heading += b.turn * dt;
        j.rollAngle += b.roll * dt * Math.min(1, into);
        const cp = Math.cos(j.pitch);
        j.pos.x += Math.sin(j.heading) * cp * v * dt;
        j.pos.y += Math.sin(j.pitch) * v * dt;
        j.pos.z += Math.cos(j.heading) * cp * v * dt;
        attitude(j.heading, j.pitch, j.bank + j.rollAngle, qArray);
        j.q.set(qArray[0], qArray[1], qArray[2], qArray[3]);
        j.model.setAfterburner(Math.min(1, into * 2));
        j.model.setStabilators(into < 4 ? 0.8 : 0.2);
        syncOutputs(j, v, 1, j.heading);
        // vapour off the wingtips as they pull
        this.tips[0].set(6.45, 0.3, -4.4).applyQuaternion(j.q).add(j.pos);
        this.tips[1].set(-6.45, 0.3, -4.4).applyQuaternion(j.q).add(j.pos);
        this.up.set(0, 1, 0).applyQuaternion(j.q);
        this.trails[k].update(dt, this.tips, this.up, into < 3.5 ? 0.8 : 0);
      });
    }
    for (const j of this.jets) j.model.strobe.visible = ((elapsed + j.part.at[0] * 0.03) % 1.3) < 0.07;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
function createAirForce(scene, controllers) {
  const group = new THREE.Group();
  group.name = 'AirForce';
  scene.add(group);
  const wingman = new Wingman(group);
  const flypast = new Flypast(group);
  const all = [wingman.jet, ...flypast.jets];

  /** Clear above the buildings along a line: the tallest under it (within 80 m) + 90 m, at least 180 m */
  function clearAltitude(ox, oz, dx, dz, from, to) {
    let top = 0;
    for (let s = from; s <= to; s += 100) {
      for (const c of controllers.nearColliders(ox + dx * s, oz + dz * s, 80)) top = Math.max(top, c.maxY || 0);
    }
    return Math.min(600, Math.max(180, top + 90));
  }

  return {
    group,
    wingman,
    flypast,
    // for js/audio-sources.js and the maps
    aircraft: all.map((j) => j.sound),
    contacts: all.map((j) => j.contact),
    setWingman(on) { wingman.setEnabled(on); },
    /**
     * A flypast for where the camera is: running in from out ahead of it, straight towards it, a little to its right
     * (the camera's right, looking along (fx, fz) with y up, is (-fz, fx)), the bomb burst in front of it. Returns the
     * seconds until the burst.
     */
    orderFlypast(camera) {
      const look = camera.getWorldDirection(new THREE.Vector3());
      let fx = look.x, fz = look.z;
      const L = Math.hypot(fx, fz) || 1;
      fx /= L; fz /= L;
      const ox = camera.position.x - fz * FLYPAST.side, oz = camera.position.z + fx * FLYPAST.side;
      const altitude = clearAltitude(ox, oz, -fx, -fz, -FLYPAST.approach, 1500);
      flypast.begin(ox, oz, -fx, -fz, altitude);
      return flypast.eta;
    },
    update(dt, elapsed) {
      wingman.update(dt, elapsed, controllers.entities.jet);
      flypast.update(dt, elapsed);
    }
  };
}

export { createAirForce, FLYPAST, DIAMOND };
