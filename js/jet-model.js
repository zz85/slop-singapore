import * as THREE from 'three/webgpu';
import { Fn, attribute, positionLocal, normalLocal, vec3, float, mix, step, fract, abs, smoothstep, sin, uv, uniform, time } from 'three/tsl';

// js/jet-model.js
// The Republic of Singapore Air Force's F-15SG Strike Eagle, low-poly for real time: built in code from its real
// dimensions (19.4 m long, 13.05 m span, 5.6 m to the fin tips), no model files to download or license.
// - One merged airframe mesh (~3,500 triangles) sharing one paint material: the radome and the tandem two-seat
//   cockpit, the boxy intakes either side of it with the Strike Eagle's conformal fuel tanks along them, the 45°
//   wings with their raked tips, the twin fins over the GE F110 engines and their nozzles, AIM-9X and AIM-120 missiles
//   on the wing pylons and the CFTs. The paint is the RSAF's two-tone grey, mottled in the shader with faint panel
//   lines, lighter underneath; vertex colours mark the parts that aren't painted (intakes, nozzles, missiles, tyres).
// - Moving parts as their own meshes: the all-moving stabilators (they follow the stick), the landing gear (folds
//   away), the afterburner plumes (additive, with shock diamonds, sized by the throttle).
// - The gold-tinted canopy, the RSAF roundel (a red disc, the lion's head in white) on the intakes and wings, the
//   serial on the fins, navigation lights and a white tail strobe.
// Body frame: forward +z, up +y, left wing +x; the origin at the jet's centre, 2.3 m over the wheels (gear down).
// createJetModel() returns { root, canopy, stabilators, gear, flames, nozzleGlow, strobe, setAfterburner(level),
// setGear(deploy), setStabilators(pitch) }.

const PAINT = [1, 1, 1]; // painted (the shader's camouflage)
const DARK = [0.035, 0.037, 0.04];
const NOZZLE = [0.33, 0.31, 0.3];
const NOZZLE_IN = [0.09, 0.08, 0.08];
const MISSILE = [0.78, 0.79, 0.78];
const SEEKER = [0.16, 0.17, 0.19];
const GEAR = [0.72, 0.73, 0.74];
const TYRE = [0.05, 0.05, 0.05];
const LIP = [0.22, 0.24, 0.26];

// ---------------------------------------------------------------------------------------------------------------------
// Geometry: indexed triangles with a colour per vertex, smoothed per part, then merged
// ---------------------------------------------------------------------------------------------------------------------
class Parts {
  constructor() { this.list = []; }
  // a part: positions [x, y, z]…, colours, triangle indices; normals smoothed within it
  add(pos, col, idx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    this.list.push(g);
  }
  /** Rings of points (each [x, y, z]), joined in order; `colors`: one per ring (or per point, as rings of colours) */
  loft(rings, colors, { closed = true } = {}) {
    const pos = [], col = [], idx = [];
    const n = rings[0].length;
    rings.forEach((ring, r) => {
      for (let k = 0; k < n; k++) {
        pos.push(...ring[k]);
        const c = Array.isArray(colors[r][0]) ? colors[r][k] : colors[r];
        col.push(...c);
      }
    });
    const segs = closed ? n : n - 1;
    for (let r = 0; r < rings.length - 1; r++) {
      for (let k = 0; k < segs; k++) {
        const a = r * n + k, b = r * n + ((k + 1) % n), c = (r + 1) * n + k, d = (r + 1) * n + ((k + 1) % n);
        idx.push(a, c, b, b, c, d);
      }
    }
    this.add(pos, col, idx);
  }
  /** A disc closing a ring (a fan from its centre) */
  cap(ring, color) {
    const pos = [], col = [], idx = [];
    const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length, s[2] + p[2] / ring.length], [0, 0, 0]);
    pos.push(...c);
    col.push(...color);
    ring.forEach((p, k) => {
      pos.push(...p);
      col.push(...color);
      idx.push(0, 1 + k, 1 + ((k + 1) % ring.length));
    });
    this.add(pos, col, idx);
  }
  merge() {
    let count = 0, indices = 0;
    for (const g of this.list) { count += g.attributes.position.count; indices += g.index.count; }
    const pos = new Float32Array(count * 3), nrm = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const idx = new Uint32Array(indices);
    let v = 0, i = 0;
    for (const g of this.list) {
      pos.set(g.attributes.position.array, v * 3);
      nrm.set(g.attributes.normal.array, v * 3);
      col.set(g.attributes.color.array, v * 3);
      const src = g.index.array;
      for (let k = 0; k < src.length; k++) idx[i + k] = src[k] + v;
      v += g.attributes.position.count;
      i += src.length;
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.computeBoundingSphere();
    return out;
  }
}

/** A superellipse cross-section at z: centre (cx, cy), width w, heights above / below, squareness e (2 ellipse) */
function section(z, cx, cy, w, top, bottom, e = 2, n = 24) {
  const ring = [];
  for (let k = 0; k < n; k++) {
    const t = (k / n) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    const x = cx + (w / 2) * Math.sign(c) * Math.abs(c) ** (2 / e);
    const y = cy + (s >= 0 ? top : bottom) * Math.sign(s) * Math.abs(s) ** (2 / e);
    ring.push([x, y, z]);
  }
  return ring;
}
const mirror = (ring) => ring.map(([x, y, z]) => [-x, y, z]);
const scaleRing = (ring, k, cx, cy) => ring.map(([x, y, z]) => [cx + (x - cx) * k, cy + (y - cy) * k, z]);
const shiftRing = (ring, dz) => ring.map(([x, y, z]) => [x, y, z + dz]);

/**
 * A thin lifting surface (wing, fin, stabilator) from its planform: leading edge from `root[0]` to `tip[0]`, trailing
 * edge from `root[1]` to `tip[1]` (each [span, chord] in the surface's own 2D frame), thickness `t0` at the root to
 * `t1` at the tip; `place(span, chord, thick)` maps a point to the body frame. A biconvex section, sharp at both edges.
 */
function surface(parts, { root, tip, t0, t1, place, color = PAINT, spans = 5, chords = 9 }) {
  const top = [], bottom = [];
  for (let i = 0; i <= spans; i++) {
    const f = i / spans;
    const le = [root[0][0] + (tip[0][0] - root[0][0]) * f, root[0][1] + (tip[0][1] - root[0][1]) * f];
    const te = [root[1][0] + (tip[1][0] - root[1][0]) * f, root[1][1] + (tip[1][1] - root[1][1]) * f];
    const t = t0 + (t1 - t0) * f;
    const rowT = [], rowB = [];
    for (let j = 0; j <= chords; j++) {
      const c = j / chords;
      const s = le[0] + (te[0] - le[0]) * c, ch = le[1] + (te[1] - le[1]) * c;
      // thickest a third of the way back
      const th = t * Math.sin(Math.PI * Math.min(1, c ** 0.75));
      rowT.push(place(s, ch, th * 0.58));
      rowB.push(place(s, ch, -th * 0.42));
    }
    top.push(rowT);
    bottom.push(rowB);
  }
  // one closed loop per span station: along the top, back along the bottom (the edges shared)
  const rings = top.map((row, i) => [...row, ...bottom[i].slice(1, -1).reverse()]);
  parts.loft(rings, rings.map(() => color));
  // the tip and root closed
  parts.cap(rings[rings.length - 1], color);
  parts.cap(rings[0], color);
}

/** A cylinder along z from z0 to z1 (radius r0 -> r1) around (x, y), n sides, with its ends capped */
function tube(parts, x, y, z0, z1, r0, r1, color, n = 10, caps = [true, true], capColor = color) {
  const ring = (z, r) => Array.from({ length: n }, (_, k) => {
    const t = (k / n) * Math.PI * 2;
    return [x + Math.cos(t) * r, y + Math.sin(t) * r, z];
  });
  const a = ring(z0, r0), b = ring(z1, r1);
  parts.loft([a, b], [color, color]);
  if (caps[0]) parts.cap(a, capColor);
  if (caps[1]) parts.cap(b, capColor);
}

/** A box (centre, half sizes) */
function box(parts, cx, cy, cz, hx, hy, hz, color) {
  const pos = [], col = [], idx = [];
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]]
  ];
  for (const [n, u, v] of faces) {
    const base = pos.length / 3;
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      pos.push(
        cx + (n[0] + u[0] * su + v[0] * sv) * hx,
        cy + (n[1] + u[1] * su + v[1] * sv) * hy,
        cz + (n[2] + u[2] * su + v[2] * sv) * hz
      );
      col.push(...color);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // (a box's normals are not smoothed across its corners: each face has its own vertices)
  parts.add(pos, col, idx);
}

// ---------------------------------------------------------------------------------------------------------------------
// The airframe
// ---------------------------------------------------------------------------------------------------------------------
// The wing's planform (left wing, x > 0) and where its surface is: also for the roundels on it
const WING = { root: [[1.95, 0.7], [1.95, -5.3]], tip: [[6.0, -3.15], [6.52, -4.85]], y: 0.36, t0: 0.34, t1: 0.07 };
const wingPlace = (side) => (s, ch, th) => [side * s, WING.y - (s - 1.95) * 0.018 + th, ch];

function buildAirframe() {
  const P = new Parts();

  // 1. The fuselage: radome, cockpit, the spine between the engines, out to the tail cone between the nozzles
  //    [z, width, top, bottom, centre y, squareness]
  const body = [
    [9.72, 0.03, 0.015, 0.015, -0.02, 2],
    [9.35, 0.34, 0.17, 0.17, -0.02, 2],
    [8.5, 0.78, 0.38, 0.38, 0, 2],
    [7.3, 1.1, 0.52, 0.5, 0.05, 2.1],
    [6.3, 1.26, 0.6, 0.56, 0.08, 2.2],
    [5.2, 1.34, 0.64, 0.6, 0.1, 2.5],
    [3.6, 1.4, 0.68, 0.64, 0.1, 2.8],
    [2.0, 1.46, 0.72, 0.68, 0.08, 3],
    [0.4, 1.62, 0.76, 0.72, 0.08, 3.4],
    [-1.6, 1.86, 0.72, 0.72, 0.08, 4],
    [-4.4, 2.1, 0.62, 0.64, 0.06, 4],
    [-6.8, 1.8, 0.5, 0.52, 0.04, 3.6],
    [-8.2, 1.15, 0.34, 0.36, 0.02, 3],
    [-9.05, 0.5, 0.14, 0.16, 0.02, 2.4],
    [-9.25, 0.04, 0.02, 0.02, 0.02, 2]
  ];
  P.loft(body.map(([z, w, t, b, cy, e]) => section(z, 0, cy, w, t, b, e, 24)), body.map(() => PAINT));

  // 2. Each side: the intake (its mouth dark inside a lip), along the cockpit's flank and back into the engine nacelle,
  //    and the F110's nozzle
  for (const side of [1, -1]) {
    // [z, centre x, width, top, bottom, centre y, squareness]
    const nacelle = [
      [2.8, 1.58, 1.22, 0.58, 0.7, -0.06, 7],
      [2.3, 1.64, 1.34, 0.64, 0.74, -0.04, 6],
      [0.6, 1.66, 1.4, 0.66, 0.74, -0.02, 6],
      [-1.8, 1.6, 1.44, 0.64, 0.72, 0, 5.5],
      [-4.2, 1.4, 1.46, 0.62, 0.66, 0.02, 4.5],
      [-6.3, 1.06, 1.42, 0.62, 0.62, 0.02, 3],
      [-8.1, 0.74, 1.24, 0.6, 0.6, 0.0, 2.3],
      [-8.6, 0.71, 1.17, 0.58, 0.58, 0.0, 2]
    ];
    const rings = nacelle.map(([z, cx, w, t, b, cy, e]) => section(z, side * cx, cy, w, t, b, e, 16));
    P.loft(rings, nacelle.map(() => PAINT));
    // the intake mouth: a dark lip stepping in to a dark duct face
    const [, cx0, , , , cy0] = nacelle[0];
    const lip = scaleRing(shiftRing(rings[0], -0.12), 0.84, side * cx0, cy0);
    const duct = scaleRing(shiftRing(rings[0], -0.9), 0.8, side * cx0, cy0);
    P.loft([rings[0], lip], [LIP, LIP]);
    P.loft([lip, duct], [DARK, DARK]);
    P.cap(duct, DARK);
    // the intake's splitter ramp above the mouth (the F-15's variable ramp hinges forward of it)
    box(P, side * cx0, cy0 + 0.6, 2.95, 0.6, 0.03, 0.22, PAINT);
    // the nozzle: turkey feathers tapering back, burnt metal, dark inside
    const n0 = section(-8.6, side * 0.71, 0, 1.12, 0.56, 0.56, 2, 16);
    const n1 = section(-9.55, side * 0.71, 0, 0.98, 0.49, 0.49, 2, 16);
    const n2 = scaleRing(shiftRing(n1, 0.35), 0.86, side * 0.71, 0);
    P.loft([n0, n1, n2], [NOZZLE, NOZZLE, NOZZLE_IN]);
    P.cap(n2, NOZZLE_IN);
    // the conformal fuel tank along the intake's outer flank
    const cft = [
      [2.3, 2.2, 0.16, 0.08, 0.08, -0.3, 2],
      [1.5, 2.3, 0.62, 0.36, 0.34, -0.28, 3],
      [-1.0, 2.36, 0.72, 0.42, 0.38, -0.26, 3.4],
      [-3.6, 2.2, 0.66, 0.4, 0.36, -0.24, 3],
      [-5.2, 1.86, 0.36, 0.22, 0.2, -0.22, 2.4],
      [-5.7, 1.7, 0.08, 0.05, 0.05, -0.22, 2]
    ];
    P.loft(cft.map(([z, cx, w, t, b, cy, e]) => section(z, side * cx, cy, w, t, b, e, 14)), cft.map(() => PAINT));
  }

  // 3. The wings: 45° leading edges, raked tips, a hint of anhedral
  for (const side of [1, -1]) {
    surface(P, { root: WING.root, tip: WING.tip, t0: WING.t0, t1: WING.t1, place: wingPlace(side), spans: 5, chords: 9 });
  }

  // 4. The twin fins over the engines, their tips clipped
  for (const side of [1, -1]) {
    surface(P, {
      root: [[0.55, -4.5], [0.55, -8.35]], tip: [[3.62, -7.05], [3.62, -8.15]], t0: 0.17, t1: 0.05,
      place: (s, ch, th) => [side * (1.42 + (s - 0.55) * 0.035) + th * side, s, ch], spans: 4, chords: 7
    });
    // the fin's root fairing on the nacelle
    box(P, side * 1.42, 0.5, -6.4, 0.11, 0.1, 1.9, PAINT);
  }

  // 5. Missiles: AIM-9X pairs on the wing pylons' shoulder rails, AIM-120s on the CFTs
  for (const side of [1, -1]) {
    box(P, side * 4.0, WING.y - 0.12, -2.0, 0.05, 0.12, 1.25, PAINT); // pylon
    for (const dx of [-0.24, 0.24]) {
      const x = side * 4.0 + dx;
      tube(P, x, WING.y - 0.32, 0.9, -2.0, 0.064, 0.064, MISSILE, 8, [false, true]);
      tube(P, x, WING.y - 0.32, 1.1, 0.9, 0.02, 0.064, SEEKER, 8, [false, false]);
      for (const [ax, ay] of [[1, 0], [0, 1]]) box(P, x, WING.y - 0.32, -1.8, 0.16 * ax + 0.01, 0.16 * ay + 0.01, 0.13, MISSILE);
    }
    for (const z of [0.6, -2.3]) {
      const x = side * 2.42, y = -0.66;
      tube(P, x, y, z + 1.9, z - 1.75, 0.09, 0.09, MISSILE, 8, [false, true]);
      tube(P, x, y, z + 2.15, z + 1.9, 0.025, 0.09, SEEKER, 8, [false, false]);
      for (const [ax, ay] of [[1, 0], [0, 1]]) box(P, x, y, z - 1.55, 0.21 * ax + 0.01, 0.21 * ay + 0.01, 0.16, MISSILE);
    }
  }
  // the pitot on the radome
  tube(P, 0, -0.02, 10.25, 9.6, 0.012, 0.03, LIP, 6, [true, false]);
  return P.merge();
}

// The stabilators (both, about their common hinge at the pivot's origin) and the gear (folding up into the belly)
function buildStabilators() {
  const P = new Parts();
  for (const side of [1, -1]) {
    surface(P, {
      root: [[1.95, 1.2], [1.95, -1.4]], tip: [[4.3, -0.75], [4.3, -1.45]], t0: 0.13, t1: 0.04,
      place: (s, ch, th) => [side * s, th - (s - 1.95) * 0.02, ch], spans: 3, chords: 6
    });
  }
  return P.merge();
}

function buildGear() {
  const P = new Parts();
  // geometry hangs from y = 0 (the pivot, under the belly) down to the ground at y = -1.75 (2.3 m below the centre)
  // the nose gear under the cockpit, the mains (a wheel each) under the intakes
  const legs = [[0, 5.0, 0.32, 0.17], [1.38, -1.35, 0.5, 0.26], [-1.38, -1.35, 0.5, 0.26]];
  for (const [x, z, r, w] of legs) {
    const hub = -1.75 + r;
    // strut
    box(P, x, hub / 2 + 0.05, z, 0.07, -hub / 2, 0.07, GEAR);
    // wheel: a short cylinder across x
    const n = 14;
    const ring = (dx, rr) => Array.from({ length: n }, (_, k) => {
      const t = (k / n) * Math.PI * 2;
      return [x + dx, hub + Math.sin(t) * rr, z + Math.cos(t) * rr];
    });
    const a = ring(-w / 2, r), b = ring(w / 2, r);
    P.loft([a, b], [TYRE, TYRE]);
    P.cap(a, GEAR);
    P.cap(b, GEAR);
  }
  return P.merge();
}

// ---------------------------------------------------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------------------------------------------------
// The RSAF's two-tone grey: a darker grey mottled with a lighter one on the upper surfaces, lighter underneath, faint
// panel lines; parts coloured otherwise (vertex colour not white) keep their colour
function paintMaterial() {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.62, metalness: 0.08, side: THREE.DoubleSide });
  const evaluate = Fn(() => {
    const tint = attribute('color', 'vec3');
    const painted = step(0.98, tint.x.min(tint.y).min(tint.z));
    const p = positionLocal;
    // soft-edged blobs of the lighter grey, a few metres across
    const blob = sin(p.x.mul(0.9).add(sin(p.z.mul(0.45)).mul(1.8))).mul(sin(p.z.mul(0.62).add(sin(p.x.mul(0.7)).mul(1.3))));
    const camo = smoothstep(0.05, 0.25, blob);
    const upper = mix(vec3(0.16, 0.18, 0.2), vec3(0.27, 0.29, 0.31), camo);
    const under = vec3(0.33, 0.35, 0.37);
    const grey = mix(under, upper, smoothstep(-0.55, 0.1, normalLocal.y));
    // panel lines across the fuselage and wings
    const lineZ = smoothstep(0.0, 0.02, abs(fract(p.z.mul(0.85)).sub(0.5)).sub(0.47).negate());
    const lineX = smoothstep(0.0, 0.02, abs(fract(p.x.mul(1.1)).sub(0.5)).sub(0.47).negate()).mul(step(1.9, abs(p.x)));
    const lines = float(1).sub(lineZ.max(lineX).mul(0.18));
    return mix(tint, grey.mul(lines), painted);
  });
  m.colorNode = evaluate();
  return m;
}

function canopyMaterial() {
  // gold-tinted, glossy: mostly the sky's reflection
  return new THREE.MeshStandardNodeMaterial({ color: 0x4d4532, roughness: 0.08, metalness: 0.55, side: THREE.DoubleSide });
}

// An afterburner plume: hot white at the nozzle through orange to nothing, with shock diamonds, flickering
function flameMaterial(level) {
  const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const t = uv().y;
  const core = mix(vec3(1.0, 0.92, 0.8), vec3(1.0, 0.42, 0.08), smoothstep(0.05, 0.6, t));
  const blue = mix(vec3(0.45, 0.6, 1.0), core, smoothstep(0.0, 0.18, t));
  const diamonds = sin(t.mul(34.0)).mul(0.5).add(0.5).pow(3).mul(0.6).mul(float(1).sub(t));
  const flicker = sin(time.mul(53.0).add(t.mul(9.0))).mul(0.08).add(0.92);
  const fade = float(1).sub(t).pow(1.6);
  m.colorNode = blue.mul(fade.add(diamonds)).mul(flicker).mul(level).mul(1.6);
  return m;
}

// The roundel (a red disc, the lion's head in white) and the serial, drawn once onto a small texture
function decalTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 128);
  // roundel: red disc, white lion's head facing right (a maned head: a ring of spikes, the face, the jaw)
  g.fillStyle = '#d4202b';
  g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  for (let k = 0; k <= 22; k++) {
    const t = (k / 22) * Math.PI * 1.55 + Math.PI * 0.55;
    const r = k % 2 ? 30 : 40;
    g.lineTo(58 + Math.cos(t) * r, 66 + Math.sin(t) * r);
  }
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(66, 30); g.quadraticCurveTo(96, 34, 98, 56); g.lineTo(104, 66); g.lineTo(96, 70);
  g.quadraticCurveTo(94, 90, 74, 98); g.lineTo(60, 88); g.closePath();
  g.fill();
  g.fillStyle = '#d4202b';
  g.beginPath(); g.arc(82, 52, 4, 0, Math.PI * 2); g.fill();
  // the serial (low-vis dark grey), on the right half
  g.fillStyle = 'rgba(40,44,48,0.95)';
  g.font = '700 46px Arial, Helvetica, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('8301', 192, 44);
  g.font = '700 26px Arial, Helvetica, sans-serif';
  g.fillText('RSAF', 192, 94);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Decal quads: [centre, normal-ish axes u (right on the decal) & v (up on it), size, which half of the texture]
function buildDecals() {
  const pos = [], uvs = [], idx = [];
  const quad = (c, u, v, w, h, half) => {
    const base = pos.length / 3;
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      pos.push(c[0] + u[0] * su * w / 2 + v[0] * sv * h / 2, c[1] + u[1] * su * w / 2 + v[1] * sv * h / 2,
        c[2] + u[2] * su * w / 2 + v[2] * sv * h / 2);
      uvs.push(half * 0.5 + (su + 1) * 0.25, (sv + 1) * 0.5);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // the intakes' flanks (roundel, the nose to the right of it seen from that side)
  quad([2.37, 0.18, 1.6], [0, 0, -1], [0, 1, 0], 0.72, 0.72, 0);
  quad([-2.37, 0.18, 1.6], [0, 0, 1], [0, 1, 0], 0.72, 0.72, 0);
  // the top of the left wing & under the right one
  const wy = (x, z, top) => WING.y - (x - 1.95) * 0.018 + (top ? 1 : -1) * 0.22 * (WING.t0 + (WING.t1 - WING.t0) * ((x - 1.95) / 4.57));
  quad([4.4, wy(4.4, -3.4, true) + 0.012, -3.4], [-1, 0, 0], [0, 0, 1], 1.0, 1.0, 0);
  quad([-4.4, wy(4.4, -3.4, false) - 0.012, -3.4], [-1, 0, 0], [0, 0, -1], 1.0, 1.0, 0);
  // the serial on the fins' outer faces
  for (const side of [1, -1]) {
    const x = side * (1.42 + 1.6 * 0.035 + 0.06);
    quad([x, 2.0, -7.2], [0, 0, -side], [0, 1, 0], 1.3, 0.65, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildCanopy() {
  const P = new Parts();
  // [z, width, height above the sill, sill y]: the windscreen, the front and rear seats' bubble, faired into the spine
  const s = [
    [6.05, 0.26, 0.04, 0.6], [5.55, 0.78, 0.36, 0.6], [4.8, 0.98, 0.56, 0.6], [3.4, 1.02, 0.66, 0.62],
    [2.0, 0.98, 0.64, 0.64], [1.0, 0.8, 0.5, 0.68], [0.25, 0.42, 0.24, 0.72], [-0.2, 0.08, 0.03, 0.74]
  ];
  const n = 16;
  const rings = s.map(([z, w, h, y]) => Array.from({ length: n + 1 }, (_, k) => {
    const t = (k / n) * Math.PI;
    const c = Math.cos(t), sn = Math.sin(t);
    return [(w / 2) * Math.sign(c) * Math.abs(c) ** (2 / 2.6), y + h * sn ** (2 / 2.6), z];
  }));
  P.loft(rings, rings.map(() => [1, 1, 1]), { closed: false });
  return P.merge();
}

function buildFlame() {
  // a lathe from the nozzle (v = 0) to the tip (v = 1), 1 m long along -z (scaled to the plume's length)
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(0.44 * (1 - t) ** 0.7 * (1 + 0.15 * Math.sin(t * Math.PI)), t));
  }
  const g = new THREE.LatheGeometry(pts, 14);
  g.rotateX(-Math.PI / 2);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------
function createJetModel() {
  const root = new THREE.Group();
  root.name = 'F15SG';
  const paint = paintMaterial();

  const airframe = new THREE.Mesh(buildAirframe(), paint);
  airframe.name = 'F15SG_airframe';
  root.add(airframe);

  const canopy = new THREE.Mesh(buildCanopy(), canopyMaterial());
  canopy.name = 'F15SG_canopy';
  root.add(canopy);

  const decals = new THREE.Mesh(buildDecals(), new THREE.MeshStandardNodeMaterial({
    map: decalTexture(), alphaTest: 0.5, roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide
  }));
  decals.name = 'F15SG_markings';
  root.add(decals);

  const stabilators = new THREE.Group();
  stabilators.position.set(0, 0.02, -7.8);
  stabilators.add(new THREE.Mesh(buildStabilators(), paint));
  root.add(stabilators);

  const gear = new THREE.Group();
  gear.position.set(0, -0.55, 0);
  gear.add(new THREE.Mesh(buildGear(), paint));
  root.add(gear);

  // afterburner plumes: one geometry, two meshes; and the nozzles' glow
  const abLevel = uniform(0);
  const flameGeo = buildFlame();
  const flameMat = flameMaterial(abLevel);
  const flames = new THREE.Group();
  for (const x of [0.71, -0.71]) {
    const f = new THREE.Mesh(flameGeo, flameMat);
    f.position.set(x, 0, -9.35);
    f.castShadow = f.receiveShadow = false;
    f.frustumCulled = false;
    flames.add(f);
  }
  flames.visible = false;
  root.add(flames);
  const glowMat = new THREE.MeshBasicNodeMaterial({ color: 0xff7a2a });
  glowMat.colorNode = vec3(1.0, 0.45, 0.12).mul(abLevel.mul(2.2).add(0.12));
  const nozzleGlow = new THREE.Group();
  const disc = new THREE.CircleGeometry(0.4, 14);
  disc.rotateY(Math.PI);
  for (const x of [0.71, -0.71]) {
    const d = new THREE.Mesh(disc, glowMat);
    d.position.set(x, 0, -9.18);
    nozzleGlow.add(d);
  }
  root.add(nozzleGlow);

  // navigation lights: red on the left (port) wingtip, green on the right, white strobe on the tail
  const light = (color, x, y, z, r = 0.07) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicNodeMaterial({ color }));
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  };
  light(0xff2b2b, 6.5, WING.y - 0.07, -4.1);
  light(0x22ff66, -6.5, WING.y - 0.07, -4.1);
  const strobe = light(0xffffff, 1.5, 3.62, -7.7, 0.08);

  return {
    root,
    canopy,
    stabilators,
    gear,
    flames,
    nozzleGlow,
    strobe,
    setAfterburner(level) {
      abLevel.value = level;
      flames.visible = level > 0.02;
      // the plume lengthens with the afterburner's stage
      for (const f of flames.children) f.scale.set(1, 1, 2.2 + level * 4.2);
    },
    setGear(deploy) {
      gear.visible = deploy > 0.02;
      gear.scale.set(1, Math.max(0.02, deploy), 1);
    },
    // the stabilators follow the stick (back: leading edges down, the nose comes up)
    setStabilators(pitch) {
      stabilators.rotation.x = Math.max(-0.35, Math.min(0.35, pitch * 0.3));
    }
  };
}

export { createJetModel };
