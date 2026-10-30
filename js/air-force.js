import * as THREE from 'three/webgpu';
import { createJetModel } from './jet-model.js';
import { attitude } from './jet-flight.js';
import { WingtipTrails } from './jet-effects.js';

// js/air-force.js
// The RSAF's other F-15SGs (js/jet-model.js, without cockpits):
// - A wingman on the player's jet: in right echelon, 16 m off the right wing and 16 m back, a little low; on the runway
//   abreast of it, 2 m of air between the wingtips (so the chase camera sees both). It holds its place in the leader's frame, catching up a little late, so a roll or a pull
//   swings it round and back into position; when the leader crashes it flies on, and rejoins when the leader is back.
// - A flypast ordered for wherever the camera is: four jets running in level from about 6 km out ahead of the view,
//   straight towards it (passing a little to one side), low enough to be loud but clear of the tallest buildings under
//   their track, so they are watched coming the whole way; then, in front of the camera, their manoeuvre, a different
//   formation each time (FORMATIONS): a diamond's bomb burst (the lead straight up, the wings peeling left and right,
//   the slot rolling up the middle), a finger four's missing man (#3 pulls up into the sky as the others fly on over),
//   an echelon's fan break (one by one rolling into a hard turn away), a loop in line abreast, or a line astern's
//   rolls in turn and climb; in afterburner, vapour off their wingtips as they pull.
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
// The formations, each four jets: where each flies in the lead's frame (left +x, up +y, forward +z) on the run-in, and
// its part in the manoeuvre, from `short` metres short of the camera:
// { delay (s), pitch: the climb it pulls to (rad; 2π a loop), rate: how fast (rad/s), bank (rad, + right), turn
// (rad/s, + left), rolls: aileron rolls (at `roll` rad/s), ab: afterburner (0..1) }
const LOOP = 2 * Math.PI;
const FORMATIONS = {
  diamond: {
    name: 'Diamond', manoeuvre: 'bomb burst', short: 900, duration: 18,
    slots: [
      { at: [0, 0, 0], part: { pitch: 1.45, rate: 0.45 } }, // lead: straight up
      { at: [15, -2, -15], part: { pitch: 0.75, rate: 0.45, bank: -1.0, turn: 0.22 } }, // left wing: up and away left
      { at: [-15, -2, -15], part: { pitch: 0.75, rate: 0.45, bank: 1.0, turn: -0.22 } }, // right wing: away right
      { at: [0, -4, -30], part: { pitch: 1.2, rate: 0.45, roll: 2.2, rolls: Infinity } } // slot: rolling up the middle
    ]
  },
  // the fingertips of a right hand; the missing man is #3, who pulls up out of it into the sky as the others fly on
  missingMan: {
    name: 'Finger four', manoeuvre: 'missing man', short: 250, duration: 20,
    slots: [
      { at: [0, 0, 0], part: { ab: 0 } },
      { at: [13, -1, -13], part: { ab: 0 } },
      { at: [-13, -1, -13], part: { pitch: 1.5, rate: 0.35 } },
      { at: [-26, -2, -26], part: { ab: 0 } }
    ]
  },
  // in echelon right, then one by one each rolls left into a hard turn away: the fan break
  echelonBreak: {
    name: 'Echelon right', manoeuvre: 'fan break', short: 700, duration: 18,
    slots: [0, 1, 2, 3].map((k) => ({
      at: [-14 * k, -1.5 * k, -14 * k],
      part: { delay: k * 1.1, bank: -1.25, turn: 0.15, pitch: 0.12, rate: 0.2 }
    }))
  },
  // abreast, a loop together (6.8 g, 1.1 km across, in front of the camera), then on over it
  abreastLoop: {
    name: 'Line abreast', manoeuvre: 'loop', short: 1000, duration: 26,
    slots: [27, 9, -9, -27].map((x) => ({ at: [x, 0, -Math.abs(x) * 0.15], part: { pitch: LOOP, rate: 0.35 } }))
  },
  // in trail, each in turn a pair of aileron rolls, then all four up into the climb
  trailRolls: {
    name: 'Line astern', manoeuvre: 'roll and climb', short: 1300, duration: 18,
    slots: [0, 1, 2, 3].map((k) => ({
      at: [0, -3 * k, -28 * k],
      part: { delay: k * 0.7, roll: 3.4, rolls: 2, pitch: 0.9, rate: 0.25, pitchDelay: 3.5 }
    }))
  }
};
const FORMATION_IDS = Object.keys(FORMATIONS);
// m/s; the run-in's length (m); its offset to the side of the camera (m)
const FLYPAST = { speed: 190, approach: 6000, side: 90 };

class Flypast {
  constructor(group) {
    this.jets = [0, 1, 2, 3].map(() => ({ ...aiJet(group), part: {}, at: [0, 0, 0], heading: 0, pitch: 0, bank: 0, rollAngle: 0 }));
    this.trails = this.jets.map(() => new WingtipTrails(group));
    this.active = false;
    this.formation = FORMATIONS.diamond;
    this.id = null;
    this.t = 0;
    this.start = new THREE.Vector3();
    this.dir = new THREE.Vector3();
    this.tips = [new THREE.Vector3(), new THREE.Vector3()];
    this.up = new THREE.Vector3();
  }

  /** Time until the manoeuvre (s) */
  get eta() {
    return this.active ? Math.max(0, this.pullAt - this.t) : 0;
  }

  get pullAt() { return (FLYPAST.approach - this.formation.short) / FLYPAST.speed; }

  // run in towards (ox, oz) along the unit direction (dx, dz) at height `altitude`, from FLYPAST.approach out, in
  // formation `id`
  begin(ox, oz, dx, dz, altitude, id = 'diamond') {
    this.id = id;
    this.formation = FORMATIONS[id] || FORMATIONS.diamond;
    this.active = true;
    this.t = 0;
    this.dir.set(dx, 0, dz);
    this.start.set(ox - dx * FLYPAST.approach, altitude, oz - dz * FLYPAST.approach);
    const heading = Math.atan2(dx, dz);
    this.jets.forEach((j, k) => {
      const slot = this.formation.slots[k];
      j.at = slot.at;
      j.part = slot.part;
      j.heading = heading;
      j.pitch = j.bank = j.rollAngle = 0;
      j.model.root.visible = true;
      j.model.setGear(0);
    });
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
    if (this.t >= pull + this.formation.duration) {
      this.end();
      return;
    }
    if (this.t < pull) {
      // in formation: along the run-in line, each in its place
      const lead = _v.copy(this.start).addScaledVector(this.dir, v * this.t);
      attitude(this.jets[0].heading, 0, 0, qArray);
      _q.set(qArray[0], qArray[1], qArray[2], qArray[3]);
      for (const j of this.jets) {
        j.pos.set(...j.at).applyQuaternion(_q).add(lead);
        j.q.copy(_q);
        j.model.setAfterburner(0);
        syncOutputs(j, v, 0.75, j.heading);
      }
    } else {
      // the manoeuvre: each its own part, from its own moment
      const since = this.t - pull;
      this.jets.forEach((j, k) => {
        const b = j.part;
        const into = since - (b.delay || 0);
        let pulling = 0;
        if (into > 0) {
          const rate = b.rate || 0.4;
          const before = j.pitch;
          if (into > (b.pitchDelay || 0)) j.pitch += Math.max(-rate * dt, Math.min(rate * dt, (b.pitch || 0) - j.pitch));
          pulling = Math.abs(j.pitch - before) / dt;
          j.bank += ((b.bank || 0) - j.bank) * (1 - Math.exp(-dt * 2.5));
          j.heading += (b.turn || 0) * Math.min(1, into) * dt;
          if (b.roll) j.rollAngle = Math.min((b.rolls ?? Infinity) * 2 * Math.PI, j.rollAngle + b.roll * dt * Math.min(1, into * 2));
        }
        const cp = Math.cos(j.pitch);
        j.pos.x += Math.sin(j.heading) * cp * v * dt;
        j.pos.y += Math.sin(j.pitch) * v * dt;
        j.pos.z += Math.cos(j.heading) * cp * v * dt;
        attitude(j.heading, j.pitch, j.bank + j.rollAngle, qArray);
        j.q.set(qArray[0], qArray[1], qArray[2], qArray[3]);
        const ab = into > 0 ? (b.ab ?? 1) * Math.min(1, into * 2) : 0;
        j.model.setAfterburner(ab);
        j.model.setStabilators(pulling > 0.05 ? 0.8 : 0.1);
        syncOutputs(j, v, into > 0 && (b.ab ?? 1) > 0 ? 1 : 0.75, j.heading);
        // vapour off the wingtips while it pulls (or turns hard): the g above about 4
        const g = (pulling * v + Math.abs((b.turn || 0) * (into > 0 ? 1 : 0)) * v) / 9.81 + 1;
        this.tips[0].set(6.45, 0.3, -4.4).applyQuaternion(j.q).add(j.pos);
        this.tips[1].set(-6.45, 0.3, -4.4).applyQuaternion(j.q).add(j.pos);
        this.up.set(0, 1, 0).applyQuaternion(j.q);
        this.trails[k].update(dt, this.tips, this.up, Math.max(0, Math.min(0.8, (g - 4) / 2.5)));
      });
    }
    for (const j of this.jets) j.model.strobe.visible = ((elapsed + j.at[0] * 0.03) % 1.3) < 0.07;
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
     * (the camera's right, looking along (fx, fz) with y up, is (-fz, fx)), its manoeuvre in front of it. `id`: the
     * formation (FORMATIONS), or else one picked at random, never the last one flown. Returns the seconds until the
     * manoeuvre.
     */
    orderFlypast(camera, id = null) {
      if (!FORMATIONS[id]) {
        const others = FORMATION_IDS.filter((f) => f !== flypast.id);
        id = others[Math.floor(Math.random() * others.length)];
      }
      const look = camera.getWorldDirection(new THREE.Vector3());
      let fx = look.x, fz = look.z;
      const L = Math.hypot(fx, fz) || 1;
      fx /= L; fz /= L;
      const ox = camera.position.x - fz * FLYPAST.side, oz = camera.position.z + fx * FLYPAST.side;
      const altitude = clearAltitude(ox, oz, -fx, -fz, -FLYPAST.approach, 1500);
      flypast.begin(ox, oz, -fx, -fz, altitude, id);
      return flypast.eta;
    },
    update(dt, elapsed) {
      wingman.update(dt, elapsed, controllers.entities.jet);
      flypast.update(dt, elapsed);
    }
  };
}

export { createAirForce, FLYPAST, FORMATIONS };
