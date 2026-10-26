import * as THREE from 'three/webgpu';

// js/island-signals.js
// The island's traffic lights (js/island-roads.js signals) beyond the detailed city: a pole at the kerb by each way
// into a signalised junction or crossing, its head facing the traffic coming, showing the phase that traffic has (the
// lit lamp: red at the top, amber, green at the bottom). Only the ones within SIGNAL_DRAW m of the camera are drawn,
// re-picked as the camera moves; their lamps follow the cycle every frame.

const SIGNAL_DRAW = 420; // m
const MAX_HEADS = 360;
const KERB = 1.2; // m beyond the kerbside lane's edge
const POLE_H = 4.2, HEAD_Y = 3.55, LAMP_DY = 0.36;
const COLOURS = { red: new THREE.Color(1, 0.12, 0.06), amber: new THREE.Color(1, 0.62, 0.05), green: new THREE.Color(0.12, 1, 0.45) };
const LAMP_SLOT = { red: 1, amber: 0, green: -1 };

function createIslandSignals(scene, { keepLeft = true } = {}) {
  const group = new THREE.Group();
  group.name = 'IslandSignals';
  scene.add(group);
  const dark = new THREE.MeshStandardNodeMaterial({ color: 0x2a2e33, roughness: 0.6, metalness: 0.4 });
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, POLE_H, 6).translate(0, POLE_H / 2, 0), dark, MAX_HEADS);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 1.18, 0.3), dark, MAX_HEADS);
  const lamp = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 6).scale(1, 1, 0.5), new THREE.MeshBasicNodeMaterial({ color: 0xffffff }), MAX_HEADS);
  for (const m of [pole, head, lamp]) {
    // one instance far below the ground until the first update, so the loading screen compiles their pipelines
    m.count = 1;
    m.instanceMatrix.array.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1000, 0, 1]);
    m.frustumCulled = false;
    group.add(m);
  }
  pole.castShadow = head.castShadow = true;
  lamp.setColorAt(0, COLOURS.green);

  let roads = null;
  let heads = []; // [{ signal, group, x, z, yaw }] near the camera
  let pickedAt = null;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const ONE = new THREE.Vector3(1, 1, 1);
  const p = {};

  // Every way into every signal: where its pole stands (at the stop line, beyond the kerbside lane on the side the
  // traffic keeps to) and the way its head faces (towards the traffic)
  function placeApproaches() {
    for (const signal of roads.signals) {
      for (const a of signal.approaches) {
        const lanes = a.road.oneway ? a.road.lanes : Math.max(1, Math.floor(a.road.lanes / 2));
        const edge = a.road.oneway ? (a.road.lanes / 2) * roads.LANE : lanes * roads.LANE;
        const side = keepLeft ? 1 : -1;
        roads.pose(a.road, a.dir, a.dir > 0 ? a.s : a.road.len - a.s, (edge + KERB) * side, p);
        a.x = p.x;
        a.z = p.z;
        a.yaw = Math.atan2(-p.dx, -p.dz); // facing back down the road
      }
    }
  }

  function pick(cam) {
    heads = [];
    for (const signal of roads.signals) {
      if (Math.abs(signal.x - cam.x) > SIGNAL_DRAW || Math.abs(signal.z - cam.z) > SIGNAL_DRAW) continue;
      if (Math.hypot(signal.x - cam.x, signal.z - cam.z) > SIGNAL_DRAW) continue;
      for (const a of signal.approaches) heads.push({ signal, group: a.group, x: a.x, z: a.z, yaw: a.yaw, d: Math.hypot(a.x - cam.x, a.z - cam.z) });
    }
    heads.sort((a, b) => a.d - b.d);
    heads.length = Math.min(heads.length, MAX_HEADS);
    // poles & heads don't move: written once per pick
    heads.forEach((h, i) => {
      q.setFromAxisAngle(up, h.yaw);
      m4.compose(pos.set(h.x, 0, h.z), q, ONE);
      pole.setMatrixAt(i, m4);
      m4.compose(pos.set(h.x, HEAD_Y, h.z), q, ONE);
      head.setMatrixAt(i, m4);
    });
    pole.count = head.count = lamp.count = heads.length;
    pole.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
    pickedAt = { x: cam.x, z: cam.z };
  }

  function update(camera, time) {
    if (!roads) return;
    const cam = camera.position;
    if (!pickedAt || Math.hypot(cam.x - pickedAt.x, cam.z - pickedAt.z) > 60) pick(cam);
    // the lit lamp: up for red, middle for amber, down for green, just in front of the head
    heads.forEach((h, i) => {
      const phase = roads.phase(h.signal, h.group, time);
      q.setFromAxisAngle(up, h.yaw);
      const fx = Math.sin(h.yaw) * 0.16, fz = Math.cos(h.yaw) * 0.16;
      m4.compose(pos.set(h.x + fx, HEAD_Y + LAMP_SLOT[phase] * LAMP_DY, h.z + fz), q, ONE);
      lamp.setMatrixAt(i, m4);
      lamp.setColorAt(i, COLOURS[phase]);
    });
    lamp.instanceMatrix.needsUpdate = true;
    if (lamp.instanceColor) lamp.instanceColor.needsUpdate = true;
  }

  return {
    group,
    get count() { return heads.length; },
    update,
    setRoads(r) {
      roads = r;
      placeApproaches();
      pickedAt = null;
    }
  };
}

export { createIslandSignals };
