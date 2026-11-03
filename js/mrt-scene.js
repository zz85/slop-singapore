import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { trackPoint } from './mrt.js';

// js/mrt-scene.js
// The MRT in the world (js/mrt.js the network and the ride): the elevated lines' viaducts on their piers across the
// island, and for a ride the train (its cars with their interiors: benches, poles, ceiling lights, sliding doors), the
// tunnel round it underground (lit every few metres), and the station it stands at (the platform, its screen doors and
// name signs; a hall underground, a canopy up on the viaduct).
//
// A car's local frame: +z forward (the way it runs), +x to its left, y up from the rail; its floor 1.1 m up. The
// platform is on its right (-x), as at an island platform between the two tracks, where the doors open.

const CAR_W = 3.2;
const FLOOR = 1.1;
const ROOF = 3.75;
const HALF_W = CAR_W / 2;
const DOORS = [-7.6, -2.55, 2.55, 7.6]; // m along a 23 m car
const DOOR_W = 1.45;
const BOGIE = 8; // m from a car's middle to its bogies

const TUBE_R = 3.1;
const TUBE_SEG = 6; // m: a tunnel ring
const TUBE_RANGE = 240; // m of tunnel kept round the train either way
const PLATFORM = 150; // m: a station's length

// Shading baked into a geometry's vertex colours (the interior & the tunnel are unlit: no sun reaches them)
function tint(geo, color, { top = 1.0, side = 0.82, bottom = 0.6 } = {}) {
  const c = new THREE.Color(color);
  const n = geo.attributes.normal;
  const col = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) {
    const ny = n.getY(i);
    const k = ny > 0.5 ? top : ny < -0.5 ? bottom : side;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function box(w, h, d, x, y, z, color, shade) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  g.translate(x, y, z);
  if (color !== undefined) tint(g, color, shade);
  return g;
}

function cyl(r, h, x, y, z, color, seg = 8) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, true).toNonIndexed();
  g.translate(x, y, z);
  if (color !== undefined) tint(g, color);
  return g;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// -------------------------------------------------------------------------------------------------------------------
// A train car's geometries, by material: { shell, stripe, dark, glass, interior, seats, light, pole }
// -------------------------------------------------------------------------------------------------------------------
function carGeometries(L, { nose = 0 } = {}) {
  const shell = [];
  const stripe = [];
  const dark = [];
  const interior = [];
  const seats = [];
  const light = [];
  const pole = [];
  const h = L / 2;
  // the sides, outside (lit) and in (unlit): below the windows, above them, and the pillars between windows & doors
  const openings = DOORS.map((d) => [d - DOOR_W / 2, d + DOOR_W / 2]);
  const spans = [];
  let at = -h + 0.6;
  for (const [a, b] of openings) { spans.push([at, a]); at = b; }
  spans.push([at, h - 0.6]);
  for (const side of [-1, 1]) {
    const x = side * HALF_W;
    // whole-length bands below and above the window line (doors cut through the lower one)
    for (const [a, b] of spans) {
      const len = b - a, mid = (a + b) / 2;
      shell.push(box(0.06, 0.95, len, x, FLOOR + 0.48, mid));
      interior.push(box(0.04, 0.95, len, x - side * 0.06, FLOOR + 0.48, mid, 0xd9dde0));
      // window pillars every ~1.9 m within the span, and a window frame under and over
      const n = Math.max(1, Math.round(len / 1.9));
      for (let k = 0; k <= n; k++) {
        const z = a + (len * k) / n;
        shell.push(box(0.07, 1.0, 0.16, x, FLOOR + 1.45, z));
        interior.push(box(0.04, 1.0, 0.14, x - side * 0.07, FLOOR + 1.45, z, 0xc9cdd2));
      }
      stripe.push(box(0.07, 0.16, len, x + side * 0.005, FLOOR + 0.88, mid));
    }
    shell.push(box(0.06, 0.75, L - 1.2, x, FLOOR + 2.32, 0));
    interior.push(box(0.04, 0.6, L - 1.2, x - side * 0.06, FLOOR + 2.25, 0, 0xe7e9ea));
    // above each doorway (the door leaves fill the rest)
    for (const [a, b] of openings) {
      shell.push(box(0.06, 0.0001, b - a, x, FLOOR + 2.0, (a + b) / 2));
      dark.push(box(0.03, 0.1, b - a + 0.12, x - side * 0.08, FLOOR + 2.0, (a + b) / 2));
    }
  }
  // roof (outside), ceiling with its two strip lights (inside), floor
  shell.push(box(CAR_W, 0.12, L - 1.2, 0, ROOF - 0.06, 0));
  shell.push(box(CAR_W - 0.6, 0.22, L - 2, 0, ROOF + 0.06, 0));
  interior.push(box(CAR_W - 0.16, 0.06, L - 1.2, 0, FLOOR + 2.48, 0, 0xeef0f1, { bottom: 0.95 }));
  for (const x of [-0.55, 0.55]) light.push(box(0.22, 0.03, L - 2.4, x, FLOOR + 2.44, 0, 0xffffff, { bottom: 1, top: 1, side: 1 }));
  interior.push(box(CAR_W - 0.1, 0.06, L - 1.2, 0, FLOOR - 0.02, 0, 0x6d7276, { top: 0.85 }));
  // under the floor: the skirt, the bogies and their wheels
  dark.push(box(CAR_W - 0.2, 0.55, L - 3, 0, FLOOR - 0.35, 0));
  for (const b of [-BOGIE, BOGIE]) {
    dark.push(box(2.4, 0.5, 2.8, 0, 0.5, b));
    for (const w of [-0.95, 0.95]) for (const s of [-0.72, 0.72]) {
      const g = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12).toNonIndexed();
      g.rotateZ(Math.PI / 2);
      g.translate(s, 0.42, b + w);
      dark.push(g);
    }
  }
  // the ends: a gangway through to the next car, or the front with its windscreen (nose > 0: the front end at +z)
  for (const end of [-1, 1]) {
    const z = end * (h - 0.6);
    if (nose && end === nose) {
      // the front: a raked windscreen over a cab front (wide, for a driverless train's view ahead)
      shell.push(box(CAR_W, 1.0, 0.1, 0, FLOOR + 0.5, z + end * 0.55));
      shell.push(box(CAR_W, 0.12, 0.7, 0, ROOF - 0.12, z + end * 0.28));
      dark.push(box(CAR_W - 0.2, 0.06, 0.06, 0, FLOOR + 1.02, z + end * 0.58));
      for (const x of [-HALF_W + 0.05, HALF_W - 0.05]) shell.push(box(0.1, 2.5, 0.7, x, FLOOR + 1.25, z + end * 0.3));
      interior.push(box(CAR_W - 0.2, 0.9, 0.06, 0, FLOOR + 0.45, z + end * 0.45, 0x2b2f33));
      stripe.push(box(CAR_W + 0.02, 0.22, 0.04, 0, FLOOR + 0.62, z + end * 0.61));
      // the headlights
      for (const x of [-1.05, 1.05]) light.push(box(0.36, 0.12, 0.04, x, FLOOR + 0.3, z + end * 0.62, 0xfff4d6, { top: 1, side: 1, bottom: 1 }));
    } else {
      for (const x of [-1.15, 1.15]) {
        shell.push(box(0.9, ROOF - FLOOR, 0.08, x, (ROOF + FLOOR) / 2, z));
        interior.push(box(0.9, 2.5, 0.04, x, FLOOR + 1.25, z - end * 0.06, 0xd9dde0));
      }
      interior.push(box(1.4, 0.4, 0.04, 0, FLOOR + 2.3, z - end * 0.06, 0xd9dde0));
      dark.push(box(1.5, 2.2, 0.6, 0, FLOOR + 1.1, z + end * 0.3)); // the gangway bellows
    }
  }
  // inside: long benches between the doors (and at the ends), the poles at each door and down the middle
  const benches = [];
  let bz = -h + 1.2;
  for (const [a, b] of openings) { benches.push([bz, a - 0.25]); bz = b + 0.25; }
  benches.push([bz, h - 1.2]);
  for (const side of [-1, 1]) {
    for (const [a, b] of benches) {
      if (b - a < 0.6) continue;
      const mid = (a + b) / 2, len = b - a;
      seats.push(box(0.46, 0.08, len, side * (HALF_W - 0.33), FLOOR + 0.44, mid, 0x2f5f9f, { top: 1 }));
      seats.push(box(0.08, 0.55, len, side * (HALF_W - 0.12), FLOOR + 0.75, mid, 0x2f5f9f));
      interior.push(box(0.3, 0.4, len, side * (HALF_W - 0.25), FLOOR + 0.2, mid, 0x9aa0a6));
    }
  }
  for (const d of DOORS) {
    for (const side of [-1, 1]) pole.push(cyl(0.022, 2.4, side * (HALF_W - 0.75), FLOOR + 1.2, d + 0.9 * side, 0xc8ccd0));
    pole.push(cyl(0.022, 2.4, 0, FLOOR + 1.2, d, 0xc8ccd0));
  }
  for (const x of [-0.6, 0.6]) pole.push(box(0.03, 0.03, L - 2, x, FLOOR + 2.1, 0, 0xc8ccd0));
  const merge = (list) => (list.length ? mergeGeometries(list, false) : null);
  return {
    shell: merge(shell), stripe: merge(stripe), dark: merge(dark), interior: merge(interior), seats: merge(seats),
    light: merge(light), pole: merge(pole)
  };
}

// The door leaves of a car's side (-1 right, 1 left): 2 per doorway, each moving off its doorway's middle
function doorGeometry() {
  const g = box(DOOR_W / 2 - 0.02, 2.0, 0.04, 0, FLOOR + 1.0, 0);
  g.rotateY(Math.PI / 2);
  return g;
}

class MrtTrain {
  constructor(scene, line) {
    this.line = line;
    this.group = new THREE.Group();
    this.group.name = `MRT ${line.id}`;
    const colour = new THREE.Color(line.colour);
    this.mats = {
      shell: new THREE.MeshStandardNodeMaterial({ color: 0xe9ecef, roughness: 0.35, metalness: 0.55 }),
      stripe: new THREE.MeshStandardNodeMaterial({ color: colour, roughness: 0.4, metalness: 0.2 }),
      dark: new THREE.MeshStandardNodeMaterial({ color: 0x1c1f22, roughness: 0.8 }),
      interior: new THREE.MeshBasicNodeMaterial({ vertexColors: true }),
      seats: new THREE.MeshBasicNodeMaterial({ vertexColors: true }),
      light: new THREE.MeshBasicNodeMaterial({ color: 0xffffff }),
      pole: new THREE.MeshBasicNodeMaterial({ vertexColors: true }),
      door: new THREE.MeshStandardNodeMaterial({ color: 0xd5d9dc, roughness: 0.35, metalness: 0.5 })
    };
    this.mats.shell.side = THREE.DoubleSide;
    this.mats.door.side = THREE.DoubleSide;
    const L = line.carLength;
    const front = carGeometries(L, { nose: 1 });
    const middle = carGeometries(L);
    const back = carGeometries(L, { nose: -1 });
    const doorGeo = doorGeometry();
    this.cars = [];
    for (let i = 0; i < line.cars; i++) {
      const geos = i === 0 ? front : i === line.cars - 1 ? back : middle;
      const car = new THREE.Group();
      for (const [k, g] of Object.entries(geos)) {
        if (!g) continue;
        const m = new THREE.Mesh(g, this.mats[k]);
        m.castShadow = k === 'shell' || k === 'dark';
        m.receiveShadow = k === 'shell';
        car.add(m);
      }
      // the doors: each doorway's two leaves either side, on both sides
      const doors = [];
      for (const side of [-1, 1]) for (const d of DOORS) for (const half of [-1, 1]) {
        const leaf = new THREE.Mesh(doorGeo, this.mats.door);
        leaf.position.set(side * (HALF_W - 0.02), 0, d + half * (DOOR_W / 4));
        leaf.userData = { side, d, half };
        car.add(leaf);
        doors.push(leaf);
      }
      car.userData.doors = doors;
      this.group.add(car);
      this.cars.push(car);
    }
    this.open = 0;
    scene.add(this.group);
    this._a = {};
    this._b = {};
  }

  /** Stand the train with its front at s along `track` */
  place(track, front) {
    const L = this.line.carLength;
    const a = this._a, b = this._b;
    for (let i = 0; i < this.cars.length; i++) {
      const mid = front - (i + 0.5) * L;
      // (on its two bogies, so it rounds a curve as a car does)
      trackPoint(track, mid + BOGIE, a);
      trackPoint(track, mid - BOGIE, b);
      const car = this.cars[i];
      car.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
      car.rotation.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ');
    }
  }

  /** The doors on the platform side (right, -x) open by `k` (0 shut, 1 open) */
  setDoors(k) {
    if (Math.abs(k - this.open) < 1e-4) return;
    this.open = k;
    for (const car of this.cars) {
      for (const leaf of car.userData.doors) {
        const { side, d, half } = leaf.userData;
        const slide = side < 0 ? k * (DOOR_W / 2 - 0.05) : 0;
        leaf.position.z = d + half * (DOOR_W / 4 + slide);
        leaf.position.x = side * (HALF_W - 0.02 + (side < 0 ? k * 0.04 : 0));
      }
    }
  }

  dispose() {
    this.group.removeFromParent();
    const seen = new Set();
    this.group.traverse((o) => { if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); } });
    for (const m of Object.values(this.mats)) m.dispose();
  }
}

// -------------------------------------------------------------------------------------------------------------------
// The tunnel round the train: rings along the track wherever it runs below the ground, near the train
// -------------------------------------------------------------------------------------------------------------------
class MrtTunnel {
  constructor(scene) {
    const n = Math.ceil((TUBE_RANGE * 2) / TUBE_SEG) + 2;
    const ring = new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUBE_SEG + 0.05, 20, 1, true).toNonIndexed();
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 1.7, 0);
    // (grimy concrete: darker below, a little lighter up the walls)
    const pos = ring.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) - 1.7;
      const k = 0.035 + 0.018 * (y / TUBE_R) + (Math.abs(pos.getZ(i)) < 0.3 ? -0.012 : 0);
      col[i * 3] = k; col[i * 3 + 1] = k * 1.02; col[i * 3 + 2] = k * 1.05;
    }
    ring.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.MeshBasicNodeMaterial({ vertexColors: true, side: THREE.BackSide });
    this.rings = new THREE.InstancedMesh(ring, mat, n);
    // the track bed, a walkway along one side, cable trays, and a light every other ring
    const bits = mergeGeometries([
      box(2.8, 0.3, TUBE_SEG, 0, -0.15, 0, 0x0b0b0b),
      box(0.06, 0.16, TUBE_SEG, -0.72, 0.08, 0, 0x50565c),
      box(0.06, 0.16, TUBE_SEG, 0.72, 0.08, 0, 0x50565c),
      box(0.9, 0.12, TUBE_SEG, 2.3, 0.9, 0, 0x16181a),
      box(0.12, 0.5, TUBE_SEG, -2.55, 2.4, 0, 0x202326)
    ]);
    this.bits = new THREE.InstancedMesh(bits, new THREE.MeshBasicNodeMaterial({ vertexColors: true }), n);
    this.lamps = new THREE.InstancedMesh(box(0.5, 0.14, 0.14, 0, 0, 0), new THREE.MeshBasicNodeMaterial({ color: 0xfff1cf }), n);
    for (const m of [this.rings, this.bits, this.lamps]) {
      m.frustumCulled = false;
      m.count = 0;
      scene.add(m);
    }
    this.n = n;
    this._p = {};
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler(0, 0, 0, 'YXZ');
    this._v = new THREE.Vector3();
    this._one = new THREE.Vector3(1, 1, 1);
  }

  /** Rings round s along track (where it's underground), and none within `gaps` (stations: [s0, s1]) */
  update(track, s, gaps = []) {
    let n = 0, lamps = 0;
    const p = this._p;
    if (track) {
      const s0 = Math.floor((s - TUBE_RANGE) / TUBE_SEG) * TUBE_SEG;
      for (let a = s0; a <= s + TUBE_RANGE && n < this.n; a += TUBE_SEG) {
        if (a < 0 || a > track.length) continue;
        if (gaps.some(([g0, g1]) => a > g0 && a < g1)) continue;
        trackPoint(track, a, p);
        if (p.y > -2.2) continue; // above ground (a portal's ramp out)
        this._e.set(-Math.asin(Math.max(-1, Math.min(1, p.dy))), Math.atan2(p.dx, p.dz), 0);
        this._q.setFromEuler(this._e);
        this._m.compose(this._v.set(p.x, p.y, p.z), this._q, this._one);
        this.rings.setMatrixAt(n, this._m);
        this.bits.setMatrixAt(n, this._m);
        if (Math.round(a / TUBE_SEG) % 2 === 0) {
          // (on the wall to the left, at head height)
          this._m.compose(this._v.set(p.x + p.dz * 2.75, p.y + 2.9, p.z - p.dx * 2.75), this._q, this._one);
          this.lamps.setMatrixAt(lamps++, this._m);
        }
        n++;
      }
    }
    this.rings.count = this.bits.count = n;
    this.lamps.count = lamps;
    for (const m of [this.rings, this.bits, this.lamps]) m.instanceMatrix.needsUpdate = true;
    return n;
  }

  dispose() {
    for (const m of [this.rings, this.bits, this.lamps]) { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); }
  }
}

// -------------------------------------------------------------------------------------------------------------------
// A station's platform at a stop: underground, a hall round it; up on the viaduct, a deck and a canopy
// -------------------------------------------------------------------------------------------------------------------
function stationSign(station, line, codes) {
  return canvasTexture(1024, 192, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.fillStyle = line.colour;
    ctx.fillRect(0, 0, 1024, 26);
    // the station's codes, in their lines' colours
    let x = 34;
    ctx.font = '700 56px Inter, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    for (const c of codes) {
      const w = ctx.measureText(c.code).width + 36;
      ctx.fillStyle = c.colour;
      ctx.beginPath();
      ctx.roundRect(x, 60, w, 92, 46);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(c.code, x + 18, 108);
      x += w + 14;
    }
    ctx.fillStyle = '#1b1f23';
    ctx.font = '700 80px Inter, Arial, sans-serif';
    ctx.fillText(station.name, x + 22, 108);
  });
}

class MrtStation {
  constructor(scene, net, track, stop) {
    this.group = new THREE.Group();
    this.group.name = `MRT station ${stop.station.name}`;
    const p = trackPoint(track, stop.s, {});
    this.underground = p.y < -3;
    this.s0 = stop.s - PLATFORM / 2;
    this.s1 = stop.s + PLATFORM / 2;
    const H = PLATFORM;
    const geos = { hall: [], floor: [], psd: [], light: [] };
    // (local frame as a car's: the platform on the right, -x; the other track across to the left, +x)
    const edge = HALF_W + 0.15; // the platform's edge from the track's centre
    geos.floor.push(box(8, FLOOR, H, -edge - 4, FLOOR / 2, 0, 0x8b9196, { top: 1 }));
    geos.floor.push(box(0.3, 0.02, H, -edge - 0.45, FLOOR + 0.01, 0, 0xf0c21a, { top: 1 })); // the yellow line
    // platform screen doors: full height underground, half height up on the viaduct; a frame by each car's doorway
    const psdH = this.underground ? 2.4 : 1.6;
    for (let z = -H / 2; z <= H / 2; z += 1.9) geos.psd.push(box(0.08, psdH, 0.08, -edge - 0.05, FLOOR + psdH / 2, z, 0x707a82));
    geos.psd.push(box(0.12, 0.25, H, -edge - 0.05, FLOOR + psdH, 0, 0x37414a));
    if (this.underground) {
      // the hall: walls across the tracks, a ceiling with its lights, pillars down the platform
      geos.hall.push(box(0.4, 7, H, -edge - 8.2, 3.5, 0, 0xc8c3b8));
      geos.hall.push(box(0.4, 7, H, edge + 4.8, 3.5, 0, 0x9ea4a8));
      geos.hall.push(box(13.5, 0.4, H, -1.8, 6.4, 0, 0xd8d6d0, { bottom: 0.9 }));
      geos.hall.push(box(14, 0.4, H, -1.8, -0.4, 0, 0x2a2b2c));
      for (const z of [-H / 2, H / 2]) geos.hall.push(box(13.5, 7, 0.4, -1.8, 3.5, z, 0x8c9094));
      for (let z = -H / 2 + 8; z < H / 2; z += 12) geos.hall.push(box(0.8, 5.6, 0.8, -edge - 5, FLOOR + 2.8, z, 0xe3dfd5));
      for (let z = -H / 2 + 3; z < H / 2; z += 4) {
        geos.light.push(box(0.25, 0.04, 2.6, -edge - 2.5, 6.18, z, 0xffffff, { bottom: 1, top: 1, side: 1 }));
        geos.light.push(box(0.25, 0.04, 2.6, -edge - 6, 6.18, z, 0xffffff, { bottom: 1, top: 1, side: 1 }));
      }
      // the far wall's advertising panels, lit
      for (let z = -H / 2 + 10; z < H / 2 - 6; z += 14) geos.light.push(box(0.05, 1.6, 5, edge + 4.55, 2.6, z, [0x3d7bd8, 0xd8573d, 0x4cae6e, 0xe0b23a][Math.abs(Math.round(z)) % 4], { side: 0.9 }));
    } else {
      // up on the viaduct: the deck under both tracks and the platform, its canopy on columns
      geos.hall.push(box(18, 1.2, H, -2.5, -0.65, 0, 0xa7a59f));
      for (let z = -H / 2 + 6; z < H / 2; z += 12) geos.hall.push(box(0.4, 4.6, 0.4, -edge - 6.5, FLOOR + 2.3, z, 0xd0d2d4));
      geos.hall.push(box(20, 0.35, H + 4, -2.5, FLOOR + 4.9, 0, 0xc9cbcc, { bottom: 0.7 }));
      for (let z = -H / 2 + 3; z < H / 2; z += 4) geos.light.push(box(0.25, 0.04, 2.6, -edge - 3, FLOOR + 4.7, z, 0xffffff, { bottom: 1, top: 1, side: 1 }));
    }
    const lit = this.underground ? (o) => new THREE.MeshBasicNodeMaterial(o) : (o) => new THREE.MeshStandardNodeMaterial({ roughness: 0.85, ...o });
    this.mats = [];
    for (const [k, list] of Object.entries(geos)) {
      if (!list.length) continue;
      const mat = k === 'light' ? new THREE.MeshBasicNodeMaterial({ vertexColors: true }) : lit({ vertexColors: true });
      this.mats.push(mat);
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.receiveShadow = !this.underground;
      mesh.castShadow = !this.underground && k === 'hall';
      this.group.add(mesh);
    }
    // name signs down the platform, facing the train
    const codes = (stop.station.codes || []).map((c) => {
      const l = net.lines.find((ln) => c.startsWith(ln.code)) || (c.startsWith('CG') ? net.lines.find((ln) => ln.id === 'EWL') : c.startsWith('CE') ? net.lines.find((ln) => ln.id === 'CCL') : null);
      return { code: c, colour: l ? l.colour : '#888888' };
    });
    this.signTex = stationSign(stop.station, track.line, codes);
    const signMat = new THREE.MeshBasicNodeMaterial({ map: this.signTex });
    this.mats.push(signMat);
    const signGeo = new THREE.PlaneGeometry(4.2, 0.8);
    for (let z = -H / 2 + 14; z < H / 2 - 8; z += 24) {
      const sign = new THREE.Mesh(signGeo, signMat);
      if (this.underground) {
        // on the far wall across the track, read from the train through its windows
        sign.position.set(edge + 4.5, 3.2, z);
        sign.rotation.y = -Math.PI / 2;
      } else {
        sign.position.set(-edge - 4.5, FLOOR + 3.6, z);
        sign.rotation.y = Math.PI / 2;
      }
      this.group.add(sign);
      // and over the platform, both ways
      const over = new THREE.Mesh(signGeo, signMat);
      over.position.set(-edge - 3, FLOOR + (this.underground ? 3.9 : 3.8), z + 6);
      over.scale.setScalar(0.7);
      this.group.add(over);
      const back = over.clone();
      back.rotation.y = Math.PI;
      back.position.z += 0.02;
      this.group.add(back);
    }
    this.signGeo = signGeo;
    this.group.position.set(p.x, p.y, p.z);
    this.group.rotation.set(0, Math.atan2(p.dx, p.dz), 0);
    scene.add(this.group);
    this.station = stop.station;
  }

  dispose() {
    this.group.removeFromParent();
    this.group.traverse((o) => { if (o.geometry && o.geometry !== this.signGeo) o.geometry.dispose(); });
    this.signGeo.dispose();
    this.signTex.dispose();
    for (const m of this.mats) m.dispose();
  }
}

// -------------------------------------------------------------------------------------------------------------------
// The viaducts: a deck under each elevated stretch of each track, on a pier every ~30 m
// -------------------------------------------------------------------------------------------------------------------
function buildViaducts(scene, net) {
  const decks = [];
  const piers = [];
  const p = {};
  const q = {};
  for (const t of net.tracks) {
    // (each line's other way runs alongside on the same viaduct: piers under one of the two)
    const piered = t.index % 2 === 0;
    let since = 0;
    for (let s = 0; s < t.length; s += 12) {
      const e = Math.min(t.length, s + 12);
      trackPoint(t, s, p);
      trackPoint(t, e, q);
      if (p.y < 2.5 || q.y < 2.5) { since = 30; continue; }
      decks.push([(p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2, Math.atan2(q.x - p.x, q.z - p.z), Math.hypot(q.x - p.x, q.z - p.z), Math.atan2(q.y - p.y, Math.hypot(q.x - p.x, q.z - p.z))]);
      since += 12;
      if (piered && since >= 30) {
        since = 0;
        piers.push([p.x + p.dz * -1.8, p.y, p.z - p.dx * -1.8]);
      }
    }
  }
  const group = new THREE.Group();
  group.name = 'MRT viaducts';
  const concrete = new THREE.MeshStandardNodeMaterial({ color: 0xb7b4ad, roughness: 0.9 });
  const deckGeo = new THREE.BoxGeometry(4.4, 1.5, 1);
  deckGeo.translate(0, -0.85, 0);
  const deck = new THREE.InstancedMesh(deckGeo, concrete, Math.max(1, decks.length));
  const m = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  decks.forEach(([x, y, z, yaw, len, pitch], i) => {
    euler.set(-pitch, yaw, 0);
    quat.setFromEuler(euler);
    deck.setMatrixAt(i, m.compose(v.set(x, y, z), quat, sc.set(1, 1, len + 0.1)));
  });
  deck.count = decks.length;
  const pierGeo = new THREE.BoxGeometry(2.2, 1, 1.6);
  pierGeo.translate(0, -0.5, 0);
  const pier = new THREE.InstancedMesh(pierGeo, concrete, Math.max(1, piers.length));
  piers.forEach(([x, y, z], i) => {
    // (from under the deck down to the ground, and a little into it)
    const h = y - 1.6 + 1;
    pier.setMatrixAt(i, m.compose(v.set(x, y - 1.6, z), quat.identity(), sc.set(1, h, 1)));
  });
  pier.count = piers.length;
  for (const o of [deck, pier]) {
    o.castShadow = o.receiveShadow = true;
    o.computeBoundingSphere();
    group.add(o);
  }
  scene.add(group);
  return { group, decks: decks.length, piers: piers.length };
}

export { MrtTrain, MrtTunnel, MrtStation, buildViaducts, FLOOR, HALF_W, DOORS, PLATFORM };
