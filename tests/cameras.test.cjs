const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

const source = readFileSync(join(__dirname, '../js/cameras.js'), 'utf8');

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { return this.set(v.x, v.y, v.z); }
  add(v) { return this.set(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return this.set(this.x - v.x, this.y - v.y, this.z - v.z); }
  subVectors(a, b) { return this.copy(a).sub(b); }
  lerp(v, t) { return this.set(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t, this.z + (v.z - this.z) * t); }
}

class PerspectiveCamera {
  constructor(fov, aspect) {
    this.fov = fov;
    this.aspect = aspect;
    this.position = new Vector3();
    this.target = new Vector3();
  }
  updateProjectionMatrix() {}
  lookAt(v) { this.target.copy(v); }
}

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) || []) listener(event);
    }
  };
}

function cameraHarness(entity = {
  position: new Vector3(0, 0, 100), heading: 0, speed: 0, type: 'car',
  chaseDistance: 6.9, chaseHeight: 2.12, cameraTargetOffset: new Vector3(0, 1, 0)
}) {
  const window = eventTarget();
  const document = { ...eventTarget(), hidden: false };
  const canvas = { ...eventTarget(), style: {} };
  const controls = eventTarget();
  const captured = new Set();
  canvas.setPointerCapture = (id) => captured.add(id);
  canvas.hasPointerCapture = (id) => captured.has(id);
  canvas.releasePointerCapture = (id) => {
    captured.delete(id);
    canvas.dispatch('lostpointercapture', { pointerId: id });
  };
  window.innerWidth = 1600;
  window.innerHeight = 900;
  const { CameraSystem, CAMERA_PRESETS, headTarget, HEAD } = loadModule(source, {
    globals: { window, document },
    imports: { 'three/webgpu': { Vector3, PerspectiveCamera }, './landmarks.js': {} }
  });
  const camera = new CameraSystem(canvas, { getActiveEntity: () => entity });
  return {
    camera, canvas, controls, window, document, captured, entity, headTarget, HEAD, CAMERA_PRESETS,
    pointer(target, type, id, x, y = 0, pointerType = 'touch', button = 0) {
      const event = {
        pointerId: id, clientX: x, clientY: y, pointerType, button,
        prevented: false, preventDefault() { this.prevented = true; }
      };
      // Captured pointers keep reaching the canvas after moving over the controls.
      (captured.has(id) ? canvas : target).dispatch(type, event);
      window.dispatch(type, event);
      return event;
    }
  };
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
}

test('UI touches neither move nor release an active canvas orbit', () => {
  const h = cameraHarness();
  assert.equal(h.canvas.style.touchAction, 'none');
  h.pointer(h.controls, 'pointerdown', 1, 20);
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  assert.equal(h.captured.has(1), false);
  assert.equal(h.captured.has(2), true);

  h.pointer(h.controls, 'pointermove', 1, 300);
  close(h.camera.orbitYawOffset, 0);
  h.pointer(h.controls, 'pointerup', 1, 300);
  assert.equal(h.camera.isDragging, true);
  h.pointer(h.controls, 'pointermove', 2, 110);
  close(h.camera.orbitYawOffset, -0.065);
  h.pointer(h.controls, 'pointerup', 2, 110);
  assert.equal(h.camera.isDragging, false);
});

test('two canvas touches pinch without orbiting and one remaining touch resumes smoothly', () => {
  const h = cameraHarness();
  h.pointer(h.canvas, 'pointerdown', 1, 0);
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  h.pointer(h.canvas, 'pointermove', 2, 200);
  close(h.camera.zoomMultiplier, 0.5);
  close(h.camera.orbitYawOffset, 0);
  close(h.camera.orbitPitchOffset, 0.09);
  h.pointer(h.canvas, 'pointermove', 1, 100);
  close(h.camera.zoomMultiplier, 1);
  h.pointer(h.canvas, 'pointerup', 2, 200);
  h.pointer(h.canvas, 'pointermove', 1, 110);
  close(h.camera.orbitYawOffset, -0.065);
  close(h.camera.zoomMultiplier, 1);
});

test('extra fingers are ignored and coincident pinch points keep zoom finite', () => {
  const h = cameraHarness();
  h.pointer(h.canvas, 'pointerdown', 1, 0);
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  h.pointer(h.canvas, 'pointerdown', 3, 300);
  h.pointer(h.canvas, 'pointermove', 3, 500);
  close(h.camera.zoomMultiplier, 1);
  h.pointer(h.canvas, 'pointermove', 2, 0);
  h.pointer(h.canvas, 'pointermove', 2, 10);
  assert.equal(Number.isFinite(h.camera.zoomMultiplier), true);
  h.pointer(h.canvas, 'pointerup', 3, 500);
  assert.equal(h.camera.isDragging, true);
});

for (const interruption of ['pointercancel', 'lostpointercapture', 'blur', 'hidden']) {
  test(`${interruption} ends capture without a stuck drag or jump on the next gesture`, () => {
    const h = cameraHarness();
    h.pointer(h.canvas, 'pointerdown', 1, 0);
    h.pointer(h.canvas, 'pointermove', 1, 10);
    if (interruption === 'blur' || interruption === 'hidden') h.pointer(h.canvas, 'pointerdown', 3, 100);
    if (interruption === 'blur') h.window.dispatch('blur');
    else if (interruption === 'hidden') {
      h.document.hidden = true;
      h.document.dispatch('visibilitychange');
    } else if (interruption === 'lostpointercapture') h.canvas.releasePointerCapture(1);
    else h.pointer(h.canvas, interruption, 1, 10);
    assert.equal(h.camera.isDragging, false);
    assert.equal(h.captured.size, 0);
    h.pointer(h.canvas, 'pointermove', 1, 500);
    close(h.camera.orbitYawOffset, -0.065);
    h.pointer(h.canvas, 'pointerdown', 2, 600);
    h.pointer(h.canvas, 'pointermove', 2, 610);
    close(h.camera.orbitYawOffset, -0.13);
  });
}

test('cancelling one pinch pointer leaves the other ready for orbit', () => {
  const h = cameraHarness();
  h.pointer(h.canvas, 'pointerdown', 1, 0);
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  h.pointer(h.canvas, 'pointermove', 1, 20);
  h.pointer(h.canvas, 'pointercancel', 2, 100);
  assert.equal(h.camera.isDragging, true);
  h.pointer(h.canvas, 'pointermove', 1, 30);
  close(h.camera.orbitYawOffset, -0.065);
});

test('mouse orbit and wheel zoom retain their behavior and bounds', () => {
  const h = cameraHarness();
  h.pointer(h.canvas, 'pointerdown', 1, 0, 0, 'mouse', 2);
  assert.equal(h.camera.isDragging, false);
  h.pointer(h.canvas, 'pointerdown', 1, 0, 0, 'mouse');
  h.pointer(h.canvas, 'pointermove', 1, 10, 20, 'mouse');
  close(h.camera.orbitYawOffset, -0.065);
  close(h.camera.orbitPitchOffset, 0.19);
  h.pointer(h.canvas, 'pointerup', 1, 10, 20, 'mouse');
  let prevented = false;
  h.canvas.dispatch('wheel', { deltaY: 100, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  close(h.camera.zoomMultiplier, 1.1);
  h.canvas.dispatch('wheel', { deltaY: -10000, preventDefault() {} });
  close(h.camera.zoomMultiplier, 0.45);
  h.canvas.dispatch('wheel', { deltaY: 10000, preventDefault() {} });
  close(h.camera.zoomMultiplier, 2.4);
});

for (const preset of ['chase', 'observatory', 'drone']) {
  test(`teleport after driving, orbiting and ${preset} snaps to a fresh chase view`, () => {
    const h = cameraHarness();
    h.entity.speed = 45;
    for (let i = 0; i < 180; i++) h.camera.update(1 / 60, i / 60);
    assert.ok(h.camera.smoothedSpeed > 44);
    h.pointer(h.canvas, 'pointerdown', 1, 0);
    h.pointer(h.canvas, 'pointermove', 1, 200, 80);
    h.pointer(h.canvas, 'pointerup', 1, 200, 80);
    h.canvas.dispatch('wheel', { deltaY: 1000, preventDefault() {} });
    h.camera.setCameraPreset(preset, true);
    h.camera.update(1 / 60, 4);

    h.entity.position.set(-200, 20, 5300);
    h.entity.heading = -Math.PI / 2;
    h.entity.speed = 0;
    h.camera.resetForTeleport();
    const fresh = cameraHarness(h.entity).camera;
    assert.equal(h.camera.activePresetId, 'chase');
    assert.equal(h.camera.camera.fov, fresh.camera.fov);
    // Compare arrival, follow re-anchoring, and movement after arrival, including a change in height.
    for (let i = 0; i < 3; i++) {
      if (i === 2) h.entity.position.set(-205, 23, 5304);
      h.camera.update(1 / 60, 5 + i / 60);
      fresh.update(1 / 60, 5 + i / 60);
      for (const field of ['currentPos', 'currentLookAt']) {
        for (const axis of ['x', 'y', 'z']) close(h.camera[field][axis], fresh[field][axis]);
      }
      for (const axis of ['x', 'y', 'z']) {
        close(h.camera.camera.position[axis], fresh.camera.position[axis]);
        close(h.camera.camera.target[axis], fresh.camera.target[axis]);
      }
    }
  });
}

test('teleport releases every camera pointer and ignores old gestures before accepting a new drag', () => {
  const h = cameraHarness();
  h.pointer(h.canvas, 'pointerdown', 1, 0);
  h.pointer(h.canvas, 'pointermove', 1, 20, 40);
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  h.pointer(h.canvas, 'pointermove', 2, 200);
  assert.equal(h.captured.size, 2);
  h.camera.resetForTeleport();
  assert.equal(h.captured.size, 0);
  assert.equal(h.camera.isDragging, false);
  assert.equal(h.camera.userOrbitTimer, 0);
  for (const id of [1, 2]) {
    h.pointer(h.canvas, 'pointermove', id, 500, 500);
    h.pointer(h.canvas, 'pointerup', id, 500, 500);
  }
  close(h.camera.orbitYawOffset, 0);
  close(h.camera.orbitPitchOffset, 0.09);
  close(h.camera.zoomMultiplier, 1);
  h.pointer(h.canvas, 'pointerdown', 3, 600);
  h.pointer(h.canvas, 'pointermove', 3, 610);
  close(h.camera.orbitYawOffset, -0.065);
  assert.equal(h.camera.isDragging, true);
});

test('the Crazy Taxi cockpit sits on the driver\'s side, widens with speed, leans out of turns and jolts on a crash', () => {
  const h = cameraHarness();
  const { camera: sys, entity } = h;
  let rolled = 0;
  sys.camera.rotateZ = (a) => { rolled = a; };
  sys.driverSide = 1; // driving on the left: the wheel on the right
  sys.setCameraPreset('taxi', true);
  const dt = 1 / 60;
  sys.update(dt, 0);
  // heading 0 faces +z, so the right is -x
  assert.ok(sys.camera.position.x < -0.3 && sys.camera.position.x > -0.45, `on the right (${sys.camera.position.x})`);
  assert.ok(Math.abs(sys.camera.position.y - 1.32) < 0.02, 'at seated eye height');
  const fov0 = sys.camera.fov;

  // at speed: wider, and leaning out of a left turn (heading rising)
  entity.speed = 30;
  for (let i = 0; i < 180; i++) {
    entity.heading += 0.4 * dt;
    entity.position.z += Math.cos(entity.heading) * entity.speed * dt;
    entity.position.x += Math.sin(entity.heading) * entity.speed * dt;
    sys.update(dt, i * dt);
  }
  assert.ok(sys.camera.fov > fov0 + 12, `wider at speed (${sys.camera.fov.toFixed(1)}°)`);
  assert.ok(rolled < -0.04, `leans out of the turn (${rolled.toFixed(3)})`);
  const lookYaw = Math.atan2(sys.camera.target.x - sys.camera.position.x, sys.camera.target.z - sys.camera.position.z);
  assert.ok(lookYaw > entity.heading + 0.05, 'looks into the turn ahead of the cab');

  // a crash: 30 m/s to 5 in a frame
  entity.speed = 5;
  sys.update(dt, 4);
  assert.ok(sys.taxi.jolt > 0.3, `jolted (${sys.taxi.jolt.toFixed(2)})`);
  for (let i = 0; i < 120; i++) sys.update(dt, 4 + i * dt);
  assert.ok(sys.taxi.jolt < 0.01, 'and settles');

  // the other presets get their own field of view back
  sys.setCameraPreset('chase', true);
  assert.equal(sys.camera.fov, 56);
});

test('in the cockpit the mouse aims the pilot\'s head without a click: eyes front in the middle, round at the edges', () => {
  const h = cameraHarness();
  const { headTarget, HEAD } = h;
  const t = headTarget(0, 0);
  close(t.yaw, 0); close(t.pitch, 0);
  // a quiet zone round the middle
  close(headTarget(0.1, -0.1).yaw, 0);
  // left of the screen: the head turns left (+), right: right; to 130° at the edges
  assert.ok(headTarget(-0.5, 0).yaw > 0.3 && headTarget(0.5, 0).yaw < -0.3);
  close(headTarget(-1, 0).yaw, HEAD.yaw);
  assert.ok(headTarget(-0.5, 0).yaw < HEAD.yaw * 0.5, 'further out, further round (an easing curve)');
  // up the screen: up, to 60°; down: down, less far (the glareshield)
  close(headTarget(0, -1).pitch, HEAD.up);
  close(headTarget(0, 1).pitch, -HEAD.down);

  // hovering only works while looking from the cockpit, and a mouse drag there aims rather than orbits
  h.pointer(h.canvas, 'pointermove', 1, 0, 450, 'mouse');
  close(h.camera.head.target.yaw, 0);
  h.camera.head.active = true;
  h.pointer(h.canvas, 'pointermove', 1, 0, 450, 'mouse');
  close(h.camera.head.target.yaw, HEAD.yaw);
  h.pointer(h.canvas, 'pointerdown', 1, 0, 450, 'mouse');
  h.pointer(h.canvas, 'pointermove', 1, 1600, 450, 'mouse');
  close(h.camera.head.target.yaw, -HEAD.yaw);
  close(h.camera.orbitYawOffset, 0);
  h.pointer(h.canvas, 'pointerup', 1, 1600, 450, 'mouse');
  // a touch still drags the view round
  h.pointer(h.canvas, 'pointerdown', 2, 100);
  h.pointer(h.canvas, 'pointermove', 2, 110);
  close(h.camera.orbitYawOffset, -0.065);
  // the mouse off the page: eyes front
  h.document.dispatch('mouseout', { relatedTarget: null });
  close(h.camera.head.target.yaw, 0);
});

test('the Crazy Taxi cam turns its head with the mouse, no click, and only while it is the camera', () => {
  const h = cameraHarness();
  const { camera: sys, HEAD } = h;
  sys.camera.rotateZ = () => {};
  sys.driverSide = 1;
  const dt = 1 / 60;
  const lookYaw = () => Math.atan2(sys.camera.target.x - sys.camera.position.x, sys.camera.target.z - sys.camera.position.z);
  // on the chase camera the mouse does nothing
  sys.update(dt, 0);
  h.pointer(h.canvas, 'pointermove', 1, 0, 450, 'mouse');
  close(sys.head.target.yaw, 0);
  sys.setCameraPreset('taxi', true);
  sys.update(dt, 0);
  assert.equal(sys.head.active, true);
  close(lookYaw(), 0);
  // the mouse to the left edge: the head turns left (+), easing round, out of the driver's window
  h.pointer(h.canvas, 'pointermove', 1, 0, 450, 'mouse');
  sys.update(dt, dt);
  assert.ok(sys.head.yaw > 0 && sys.head.yaw < 0.3, `starts turning (${sys.head.yaw.toFixed(2)})`);
  for (let i = 0; i < 90; i++) sys.update(dt, i * dt);
  assert.ok(Math.abs(sys.head.yaw - HEAD.yaw) < 0.02, `turned (${sys.head.yaw.toFixed(2)})`);
  assert.ok(Math.abs(lookYaw() - HEAD.yaw) < 0.05, `looking ${lookYaw().toFixed(2)} rad round`);
  // up the screen: the head tilts up
  h.pointer(h.canvas, 'pointermove', 1, 800, 0, 'mouse');
  for (let i = 0; i < 90; i++) sys.update(dt, i * dt);
  assert.ok(sys.camera.target.y - sys.camera.position.y > 20, 'looking up');
  // back to the chase camera: eyes front, the mouse no longer turning it
  sys.setCameraPreset('chase', true);
  sys.update(dt, 0);
  assert.equal(sys.head.active, false);
  close(sys.head.target.yaw, 0);
  h.pointer(h.canvas, 'pointermove', 1, 0, 450, 'mouse');
  close(sys.head.target.yaw, 0);
});

test('the map view: a free camera over the city that the mouse pans, orbits and zooms, following no one', () => {
  const h = cameraHarness();
  const { camera, canvas, entity } = h;
  assert.ok(h.CAMERA_PRESETS.some((p) => p.id === 'map' && p.category === 'free'), 'a free camera, not a follow or scenic one');
  camera.setCameraPreset('map', true);
  camera.update(1 / 60, 0);
  // picked: over where the player is, looking down at it from well above the rooftops
  close(camera.currentLookAt.x, entity.position.x);
  close(camera.currentLookAt.z, entity.position.z);
  assert.ok(camera.currentPos.y > 150, `${camera.currentPos.y} m up`);
  const distance0 = camera.map.distance;
  // the player drives off: the view stays where it was
  entity.position.set(300, 0, -400);
  for (let i = 0; i < 60; i++) camera.update(1 / 60, i / 60);
  close(camera.currentLookAt.x, 0);
  close(camera.currentLookAt.z, 100);
  // a left drag pans across the ground: dragged 100 px left, the city slides left, so the view looks further east (+x)
  h.pointer(canvas, 'pointerdown', 1, 800, 450, 'mouse', 0);
  h.pointer(canvas, 'pointermove', 1, 700, 450, 'mouse', 0);
  h.pointer(canvas, 'pointerup', 1, 700, 450, 'mouse', 0);
  for (let i = 0; i < 240; i++) camera.update(1 / 60, 1 + i / 60);
  assert.ok(camera.currentLookAt.x > 5, `looks ${camera.currentLookAt.x} m east`);
  close(camera.currentLookAt.y, 0);
  close(camera.map.distance, distance0);
  // dragged 100 px down, the ground slides down the screen: the camera moves forward, the way it faces along the
  // ground (-sin yaw, -cos yaw), as driving forward does
  const ax = camera.map.target.x, az = camera.map.target.z;
  h.pointer(canvas, 'pointerdown', 1, 800, 450, 'mouse', 0);
  h.pointer(canvas, 'pointermove', 1, 800, 550, 'mouse', 0);
  h.pointer(canvas, 'pointerup', 1, 800, 550, 'mouse', 0);
  const mx = camera.map.target.x - ax, mz = camera.map.target.z - az;
  assert.ok(mx * -Math.sin(camera.map.yaw) + mz * -Math.cos(camera.map.yaw) > 5, `moved (${mx}, ${mz}) for yaw ${camera.map.yaw}`);
  assert.ok(Math.abs(mx * Math.cos(camera.map.yaw) - mz * Math.sin(camera.map.yaw)) < 1e-9, 'straight ahead, not sideways');
  close(camera.orbitYawOffset, 0, 'the chase orbit left alone');
  // a right drag orbits about the same spot: round with a sideways drag, up and over or down to the ground with a
  // vertical one, within bounds
  const yaw0 = camera.map.yaw, pitch0 = camera.map.pitch;
  const tx = camera.map.target.x, tz = camera.map.target.z;
  h.pointer(canvas, 'pointerdown', 2, 800, 450, 'mouse', 2);
  assert.equal(camera.isDragging, true, 'the right button drags the map view');
  h.pointer(canvas, 'pointermove', 2, 900, 450, 'mouse', 2);
  assert.notEqual(camera.map.yaw, yaw0);
  close(camera.map.pitch, pitch0);
  h.pointer(canvas, 'pointermove', 2, 900, 5000, 'mouse', 2);
  assert.ok(camera.map.pitch >= 0.3 && camera.map.pitch <= 1.5, `pitch ${camera.map.pitch}`);
  h.pointer(canvas, 'pointerup', 2, 900, 5000, 'mouse', 2);
  close(camera.map.target.x, tx);
  close(camera.map.target.z, tz);
  // the wheel zooms in and out, within bounds, and leaves the chase zoom alone
  canvas.dispatch('wheel', { deltaY: -300, preventDefault() {} });
  assert.ok(camera.map.distance < distance0, 'wheel up: closer');
  canvas.dispatch('wheel', { deltaY: 100000, preventDefault() {} });
  assert.ok(camera.map.distance <= 6000 && camera.map.distance > 1000, `far: ${camera.map.distance}`);
  canvas.dispatch('wheel', { deltaY: -100000, preventDefault() {} });
  assert.ok(camera.map.distance >= 20 && camera.map.distance < 100, `near: ${camera.map.distance}`);
  close(camera.zoomMultiplier, 1);
  // two fingers apart: closer too
  const near = camera.map.distance;
  canvas.dispatch('wheel', { deltaY: 3000, preventDefault() {} });
  const mid = camera.map.distance;
  assert.ok(mid > near);
  h.pointer(canvas, 'pointerdown', 10, 700, 450);
  h.pointer(canvas, 'pointerdown', 11, 900, 450);
  h.pointer(canvas, 'pointermove', 11, 1000, 450);
  assert.ok(camera.map.distance < mid, 'pinched out: closer');
  h.pointer(canvas, 'pointerup', 10, 700, 450);
  h.pointer(canvas, 'pointerup', 11, 1000, 450);
  // the camera sits at that distance from the spot it looks at, above it
  for (let i = 0; i < 240; i++) camera.update(1 / 60, 6 + i / 60);
  const dx = camera.currentPos.x - camera.currentLookAt.x, dy = camera.currentPos.y - camera.currentLookAt.y, dz = camera.currentPos.z - camera.currentLookAt.z;
  assert.ok(Math.abs(Math.hypot(dx, dy, dz) - camera.map.distance) < 1e-6);
  assert.ok(dy > 0);
  // back on the chase camera the right button is nothing again, and picking the map view again starts over the player
  camera.setCameraPreset('chase', true);
  camera.update(1 / 60, 10);
  h.pointer(canvas, 'pointerdown', 3, 0, 0, 'mouse', 2);
  assert.equal(camera.isDragging, false);
  camera.setCameraPreset('map', true);
  camera.update(1 / 60, 11);
  close(camera.currentLookAt.x, 300);
  close(camera.currentLookAt.z, -400);
});
