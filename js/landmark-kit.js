import * as THREE from 'three/webgpu';
import { Fn, uv, float, color, mix, fract, floor, step, hash, smoothstep, fwidth, mod, max, abs } from 'three/tsl';
import { pairMaterial, createTinyFlatMaterial, blendHex } from './tiny-look.js';

// js/landmark-kit.js
// The kit the landmark model programs are written against (js/landmark-models/<model>.js, loaded by
// js/landmark-models.js for the anchors tools/city/build.mjs writes into GEO.landmarks), after tinywarsaw.app's: a
// model is a few dozen solids in metres about its anchor (x east, z south, y up from the ground) in a few colours —
// box, prism, loft, cylinder — in a matte colour, a glass, or a painted facade with a window per bay and storey, and
// signs with a tenant's name painted on them hung on the towers' crowns, as Tiny Warsaw's towers carry logos; then
// finish() merges them into one mesh per material, placed at the anchor, with colliders for what stands on the
// ground and footprints for the maps. Every material is paired with its tiny-look stand-in (js/tiny-look.js), so a
// model looks right in every look. The kit keeps a record of what it built (parts, bounds, triangles) and can list
// the faces that would flicker against each other (flicker: coplanar, the same way out, overlapping), and make the
// mapped parts a model builds from safe to draw together (resolve), so a model program can be checked in node
// without three.js (tests/landmark-kit.test.cjs, tests/landmark-models.test.cjs).

const SKY_BLUE = 0x9db9d3;
const PATTERNS = ['punched', 'ribbon', 'curtain', 'strips', 'scatter', 'honeycomb'];
const band = (lo, hi, x, fw) => smoothstep(float(lo).sub(fw), float(lo).add(fw), x).mul(float(1).sub(smoothstep(float(hi).sub(fw), float(hi).add(fw), x)));

// --- rings [[x, z], ...] ----------------------------------------------------------------------------------------------
const signedArea = (ring) => { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; return a / 2; };
const ringArea = (ring) => Math.abs(signedArea(ring));
/** The outward unit normal [nx, nz] of each edge (i to i + 1) of a ring, from the way the ring is wound */
function outwardNormals(ring) {
  const s = signedArea(ring) >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length];
    const L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
/** The ring moved inward by d m: each edge offset along its outward normal, the corners where neighbouring offset
 *  edges meet (a sharp corner keeps to a short mitre) */
function insetRing(ring, d) {
  const n = ring.length;
  const N = outwardNormals(ring);
  const out = [];
  for (let i = 0; i < n; i++) {
    const h = (i + n - 1) % n;
    const [px, pz] = ring[i];
    // the two offset edges through this corner: the one before (h) and the one after (i)
    const [hx, hz] = N[h], [ix, iz] = N[i];
    const [ax, az] = ring[h], [bx, bz] = ring[(i + 1) % n];
    const p1 = [ax - hx * d, az - hz * d], u = [px - ax, pz - az];
    const p2 = [px - ix * d, pz - iz * d], v = [bx - px, bz - pz];
    const cross = u[0] * v[1] - u[1] * v[0];
    let q;
    if (Math.abs(cross) < 1e-9) q = [px - ix * d, pz - iz * d];
    else {
      const t = ((p2[0] - p1[0]) * v[1] - (p2[1] - p1[1]) * v[0]) / cross;
      q = [p1[0] + u[0] * t, p1[1] + u[1] * t];
    }
    // a very sharp corner: no long mitre, just the corner moved in along the two normals' mean
    if (Math.hypot(q[0] - px, q[1] - pz) > 4 * d) {
      const mx = hx + ix, mz = hz + iz, L = Math.hypot(mx, mz) || 1;
      q = [px - (mx / L) * d, pz - (mz / L) * d];
    }
    out.push(q);
  }
  return out;
}
// Ear clipping over a simple polygon (either winding): triangles as index triples
function triangulate(ring) {
  const n = ring.length;
  if (n < 3) return [];
  const idx = Array.from({ length: n }, (_, i) => i);
  if (signedArea(ring) < 0) idx.reverse(); // counter-clockwise in (x, z)
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= -1e-9 && cross(b, c, p) >= -1e-9 && cross(c, a, p) >= -1e-9;
  const out = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cross(ring[a], ring[b], ring[c]) <= 1e-9) continue; // reflex
      let ear = true;
      for (const k of idx) if (k !== a && k !== b && k !== c && inside(ring[k], ring[a], ring[b], ring[c])) { ear = false; break; }
      if (!ear) continue;
      out.push([a, b, c]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break; // degenerate: fan the rest
  }
  if (idx.length >= 3) for (let i = 1; i + 1 < idx.length; i++) out.push([idx[0], idx[i], idx[i + 1]]);
  return out;
}
// The smallest turned box holding a ring: { cx, cz, hx, hz, ux, uz, area } (as js/open-city-buildings.js orientedBox)
function orientedBox(ring) {
  let best = null;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % n];
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 1e-6) continue;
    const ux = (bx - ax) / L, uz = (bz - az) / L;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of ring) {
      const a = x * ux + z * uz, b = -x * uz + z * ux;
      if (a < a0) a0 = a; if (a > a1) a1 = a; if (b < b0) b0 = b; if (b > b1) b1 = b;
    }
    const area = (a1 - a0) * (b1 - b0);
    if (!best || area < best.area - 1e-9) {
      const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
      best = { cx: ca * ux - cb * uz, cz: ca * uz + cb * ux, hx: (a1 - a0) / 2, hz: (b1 - b0) / 2, ux, uz, area };
    }
  }
  return best;
}
// An oriented box collider as js/open-city-buildings.js obbCollider
const obbCollider = (cx, cz, hx, hz, ux, uz, minY, maxY) => {
  const ex = Math.abs(ux) * hx + Math.abs(uz) * hz;
  const ez = Math.abs(uz) * hx + Math.abs(ux) * hz;
  return { minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez, minY, maxY, obb: { cx, cz, hx, hz, cs: ux, sn: -uz } };
};
// The vertical walls of a ring from y0 up to its top (a height, or a function of (x, z)) for the flicker check: each
// a plane (outward normal, offset) with its extent along the plane and up
function wallsOf(ring, y0, top) {
  const N = outwardNormals(ring);
  const topY = (x, z) => (typeof top === 'function' ? top(x, z) : top);
  const walls = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length];
    if (Math.hypot(bx - ax, bz - az) < 1e-6) continue;
    const [nx, nz] = N[i];
    const tx = -nz, tz = nx;
    const a0 = ax * tx + az * tz, a1 = bx * tx + bz * tz;
    walls.push({ nx, nz, off: ax * nx + az * nz, a0: Math.min(a0, a1), a1: Math.max(a0, a1), y0, y1: Math.max(topY(ax, az), topY(bx, bz)) });
  }
  return walls;
}
// Where a point lies against a ring (convex or not: crossings): 'in', 'on' (within 1 cm of an edge) or 'out'
function pointInRing([x, z], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    const L = Math.hypot(xj - xi, zj - zi) || 1;
    const d = Math.abs((xj - xi) * (zi - z) - (xi - x) * (zj - zi)) / L;
    const t = ((x - xi) * (xj - xi) + (z - zi) * (zj - zi)) / (L * L);
    if (d < 0.01 && t > -1e-6 && t < 1 + 1e-6) return 'on';
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c ? 'in' : 'out';
}
const ringWithin = (A, B) => A.every((p) => pointInRing(p, B) !== 'out');
// Whether two rings share any area: a point of one strictly inside the other, or the same ring (neighbours sharing
// an edge do not)
function ringsOverlap(A, B) {
  if (A.some((p) => pointInRing(p, B) === 'in') || B.some((p) => pointInRing(p, A) === 'in')) return true;
  return A.length === B.length && A.every((p) => pointInRing(p, B) === 'on') && B.every((p) => pointInRing(p, A) === 'on');
}
// Whether two solids (walls, caps) have faces that would flicker: walls on one plane the same way out, overlapping
// along it and in height; tops at one height sharing area
function flickerBetween(A, B) {
  // Detailed landmarks have thousands of small, spatially separate mouldings and window frames. Reject their
  // disjoint bounds before comparing individual planes; keep 1 cm for the coplanarity tolerance below. The
  // resolve() descriptions have no bounds and continue through the exact checks unchanged.
  if (A.bounds && B.bounds) {
    for (const axis of ['X', 'Y', 'Z']) {
      if (A.bounds[`max${axis}`] < B.bounds[`min${axis}`] - 0.01 || B.bounds[`max${axis}`] < A.bounds[`min${axis}`] - 0.01) return false;
    }
  }
  for (const w of A.walls) for (const v of B.walls) {
    if (Math.abs(w.nx * v.nx + w.nz * v.nz - 1) > 1e-6 || Math.abs(w.off - v.off) > 0.01) continue;
    if (Math.min(w.a1, v.a1) - Math.max(w.a0, v.a0) > 0.05 && Math.min(w.y1, v.y1) - Math.max(w.y0, v.y0) > 0.05) return true;
  }
  for (const c of A.caps) for (const d of B.caps) if (Math.abs(c.y - d.y) <= 0.01 && ringsOverlap(c.ring, d.ring)) return true;
  return false;
}

/** A kit about the anchor `{ x, z }` (world metres) of the landmark `name` */
function createKit({ anchor = { x: 0, z: 0 }, name = '' } = {}) {
  const parts = []; // what was built: { name, type, material, y0, y1, ring, bounds, walls, caps }
  const collisionParts = []; // explicit altitude-aware volumes, without render geometry
  const batches = new Map(); // material -> { pos, nrm, uvs }
  const materials = new Map();
  const kit = { anchor, parts, triangles: 0, bearingDeg: 0 };

  const batch = (material) => {
    if (!batches.has(material)) batches.set(material, { pos: [], nrm: [], uvs: [] });
    return batches.get(material);
  };
  // one flat-shaded triangle wound to face the way `n` points, with uv in metres; nothing for a sliver
  const triangle = (B, a, b, c, ua, ub, uc, n) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const L = Math.hypot(nx, ny, nz);
    if (L < 1e-6) return;
    nx /= L; ny /= L; nz /= L;
    if (nx * n[0] + ny * n[1] + nz * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; nx = -nx; ny = -ny; nz = -nz; }
    B.pos.push(...a, ...b, ...c);
    B.nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    B.uvs.push(...ua, ...ub, ...uc);
    kit.triangles++;
  };

  /**
   * A solid over the ring [[x, z], ...] from y0 up, its top at y1 (a function of (x, z) for a sloped top), the top
   * ring scaled toward its centre by `scale` (a loft), walls in `material` (or, wall by wall, in what
   * `edgeMaterial(i)` gives for the wall from point i to i + 1, when it gives one) and the top in `top` (the roof
   * grey unless named). Below 0.5 m from the ground no underside is drawn. -> the part record
   */
  function solid({ ring, y0 = 0, y1, scale = 1, upperRing, material, edgeMaterial, top = kit.roofMaterial(), name = '', type = 'prism' }) {
    if (!ring || ring.length < 3) throw new Error(`landmark kit: ${type} needs a ring of 3 points or more`);
    if (!(y1 > y0) && typeof y1 !== 'function') throw new Error(`landmark kit: ${type} ${name} is not taller than its base`);
    const n = ring.length;
    if (upperRing && (upperRing.length !== n || upperRing.some((p) => p.length !== 2 || !p.every(Number.isFinite)))) throw new Error('landmark kit: loft topRing needs one finite point per base point');
    let cx = 0, cz = 0;
    for (const [x, z] of ring) { cx += x; cz += z; }
    cx /= n; cz /= n;
    const topRing = upperRing || ring.map(([x, z]) => [cx + (x - cx) * scale, cz + (z - cz) * scale]);
    const topY = (x, z) => (typeof y1 === 'function' ? y1(x, z) : y1);
    const N = outwardNormals(ring);
    const B = batch(material);
    const part = { name, type, material, y0, y1: -Infinity, ring, walls: [], caps: [], bounds: { minX: Infinity, maxX: -Infinity, minY: y0, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity } };
    const grow = ([x, y, z]) => { const b = part.bounds; b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); b.minZ = Math.min(b.minZ, z); b.maxZ = Math.max(b.maxZ, z); };
    // walls: outward by the ring's winding, uv metres along the wall and up
    let along = 0;
    for (let i = 0; i < n; i++) {
      const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % n];
      const [tax, taz] = topRing[i], [tbx, tbz] = topRing[(i + 1) % n];
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 1e-6) continue;
      const [nx, nz] = N[i];
      const ya = topY(tax, taz), yb = topY(tbx, tbz);
      const p0 = [ax, y0, az], p1 = [bx, y0, bz], p2 = [tbx, yb, tbz], p3 = [tax, ya, taz];
      const nrm = [nx, 0, nz];
      const W = edgeMaterial ? batch(edgeMaterial(i) || material) : B;
      triangle(W, p0, p1, p2, [along, y0], [along + L, y0], [along + L, yb], nrm);
      triangle(W, p0, p2, p3, [along, y0], [along + L, yb], [along, ya], nrm);
      [p0, p1, p2, p3].forEach(grow);
      along += L;
    }
    if (scale === 1 && !upperRing) part.walls = wallsOf(ring, y0, y1);
    // the top (and, up in the air, the underside)
    const tris = triangulate(topRing);
    const T = batch(top);
    for (const [i, j, k] of tris) {
      const P = [topRing[i], topRing[j], topRing[k]].map(([x, z]) => [x, topY(x, z), z]);
      triangle(T, P[0], P[1], P[2], [P[0][0], P[0][2]], [P[1][0], P[1][2]], [P[2][0], P[2][2]], [0, 1, 0]);
      P.forEach(grow);
    }
    if (typeof y1 !== 'function') part.caps.push({ y: y1, ring: topRing });
    if (y0 > 0.5) {
      for (const [i, j, k] of tris) {
        const P = [ring[i], ring[j], ring[k]].map(([x, z]) => [x, y0, z]);
        triangle(B, P[0], P[1], P[2], [P[0][0], P[0][2]], [P[1][0], P[1][2]], [P[2][0], P[2][2]], [0, -1, 0]);
      }
    }
    part.y1 = part.bounds.maxY;
    parts.push(part);
    return part;
  }

  /** A box: centre (x, z), bottom y, size w (x) by h (y) by d (z), turned `yaw` radians about y */
  kit.box = ({ x = 0, z = 0, y = 0, w, h, d, yaw = 0, material, top, name = '' }) => {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    const ring = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([px, pz]) => [x + px * c - pz * s, z + px * s + pz * c]);
    return solid({ ring, y0: y, y1: y + h, material, top, name, type: 'box' });
  };
  /** A prism over a ring [[x, z], ...] from y0 to y1 (y1 may be a function of (x, z): a sloped top, kit.sloped) */
  kit.prism = ({ ring, y0 = 0, y1, material, edgeMaterial, top, name = '' }) => solid({ ring, y0, y1, material, edgeMaterial, top, name, type: 'prism' });
  /** A collision/map volume without visible geometry, for wings, bridges or roofs above the ground cutoff. */
  kit.collisionPrism = ({ ring, y0 = 0, y1 }) => {
    if (!ring || ring.length < 3 || ring.some((p) => p.length !== 2 || !p.every(Number.isFinite)) || !Number.isFinite(y0) || !Number.isFinite(y1) || y1 <= y0) {
      throw new Error('landmark kit: collisionPrism needs a finite ring and heights y1 > y0');
    }
    collisionParts.push({ ring: ring.map((p) => [...p]), y0, y1, filled: true });
  };
  /** A loft: scale the base ring at y1, or supply a corresponding topRing for a translated/inclined facade. */
  kit.loft = ({ ring, topRing, y0 = 0, y1, scale = 0.5, material, edgeMaterial, top, name = '' }) => solid({ ring, upperRing: topRing, y0, y1, scale, material, edgeMaterial, top, name, type: 'loft' });
  /** A cylinder about (x, z) from y0 to y1, radius r, in `segments` sides */
  kit.cylinder = ({ x = 0, z = 0, y0 = 0, y1, r, segments = 12, material, top, name = '' }) => {
    const ring = Array.from({ length: segments }, (_, i) => { const a = (i / segments) * Math.PI * 2; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; });
    return solid({ ring, y0, y1, material, top, name, type: 'cylinder' });
  };
  /**
   * A beam: a box `w` wide and `h` deep from the point `from` [x, y, z] to `to` — a sloped rafter, a brace, a post —
   * its width level and its depth square to it. Structure in the bounds, but neither flicker-checked (no wall or top
   * lies on another's plane) nor anything to walk into. -> the part record
   */
  kit.beam = ({ from, to, w = 0.3, h = 0.3, material, name = '' }) => {
    const t = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const L = Math.hypot(t[0], t[1], t[2]);
    if (!(L > 1e-6)) throw new Error(`landmark kit: beam ${name} needs a length`);
    t[0] /= L; t[1] /= L; t[2] /= L;
    // across: level and square to the beam (east-west for a post); up: square to both, upward
    const level = Math.hypot(t[0], t[2]);
    const a = level > 1e-6 ? [-t[2] / level, 0, t[0] / level] : [1, 0, 0];
    let u = [a[1] * t[2] - a[2] * t[1], a[2] * t[0] - a[0] * t[2], a[0] * t[1] - a[1] * t[0]];
    if (u[1] < 0 || (u[1] === 0 && level <= 1e-6 && u[2] < 0)) u = u.map((v) => -v);
    const corner = (p, sa, su) => [0, 1, 2].map((k) => p[k] + a[k] * sa * w / 2 + u[k] * su * h / 2);
    const [f00, f10, f11, f01] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, su]) => corner(from, sa, su));
    const [t00, t10, t11, t01] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, su]) => corner(to, sa, su));
    const B = batch(material);
    const quad = (p, q, r, s, n) => { triangle(B, p, q, r, [0, 0], [1, 0], [1, 1], n); triangle(B, p, r, s, [0, 0], [1, 1], [0, 1], n); };
    quad(f10, t10, t11, f11, a);
    quad(t00, f00, f01, t01, a.map((v) => -v));
    quad(f01, f11, t11, t01, u);
    quad(f00, t00, t10, f10, u.map((v) => -v));
    quad(t00, t01, t11, t10, t);
    quad(f00, f10, f11, f01, t.map((v) => -v));
    const all = [f00, f10, f11, f01, t00, t10, t11, t01];
    const bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const [x, y, z] of all) {
      bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
      bounds.minZ = Math.min(bounds.minZ, z); bounds.maxZ = Math.max(bounds.maxZ, z);
    }
    const part = { name, type: 'beam', material, y0: bounds.minY, y1: bounds.maxY, ring: [[from[0], from[2]], [to[0], to[2]]], walls: [], caps: [], bounds };
    parts.push(part);
    return part;
  };
  /** A sloped top for prism(): y1 at the high side, dropping `drop` m toward the compass direction `deg` across the ring */
  kit.sloped = (ring, y1, drop, deg) => {
    const [dx, dz] = kit.compass(deg);
    let lo = Infinity, hi = -Infinity;
    for (const [x, z] of ring) { const t = x * dx + z * dz; lo = Math.min(lo, t); hi = Math.max(hi, t); }
    const span = Math.max(1e-6, hi - lo);
    return (x, z) => y1 - drop * ((x * dx + z * dz - lo) / span);
  };
  /** The world direction [dx, dz] of a compass bearing in degrees (0 north, 90 east) in this city's turned frame */
  kit.compass = (deg) => {
    const th = (kit.bearingDeg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
    const a = (deg * Math.PI) / 180, e = Math.sin(a), n = Math.cos(a);
    return [e * c - n * s, -(e * s + n * c)];
  };
  /** The yaw (radians, for sign() and box()) that faces a compass bearing in this city's frame */
  kit.yawToward = (deg) => { const [dx, dz] = kit.compass(deg); return Math.atan2(dx, dz); };
  /** A ring moved inward by d m (insetRing) */
  kit.inset = insetRing;
  /** The smallest turned box holding a ring: { cx, cz, hx, hz, ux, uz } (half sizes hx along (ux, uz), hz across) */
  kit.boxOf = orientedBox;

  /**
   * A sign: `text` painted in `color` on a see-through panel `height` m tall (and `width` wide: as wide as the
   * painted text unless given; a sign wider than `maxWidth` is scaled down to it, keeping its shape) with its bottom
   * at `y` (or its top at `yTop`) at (x, z), facing `yaw` (radians; 0 faces +z, south), the text reading right from
   * the back too; on a low bar in `bar` colour when one is given (a sign standing on a roof — hang() is the usual
   * way). A `vertical` sign runs its text down the panel instead, the letters' tops to the right (as a hotel's name
   * down the edge of a tower): the panel is then `height` m across and `width` (capped at `maxWidth`) tall. The
   * letters are drawn on a canvas in a browser; in node the panel stands blank. Text with line breaks ('\n') runs on
   * as many lines. A `logo` (as js/landmark-logos.js gives them: { id, aspect, draw(ctx, x, y, w, h) }) is painted
   * left of the text, a little taller than its letters (or than its lines), or fills the panel with no text. Signs are
   * decoration: left out of bounds() unless asked, and of the flicker check. -> the part record
   */
  kit.sign = ({ text = '', logo = null, x = 0, z = 0, y, yTop, yaw = 0, width, maxWidth = Infinity, height = 6, vertical = false, color = 0xffffff, bar = false, font = 'bold 110px Helvetica, Arial, sans-serif', name = '' }) => {
    if (!text && !logo) throw new Error('landmark kit: a sign needs its text or a logo');
    const label = text || logo.id;
    if (!Number.isFinite(y) && !Number.isFinite(yTop)) throw new Error(`landmark kit: sign ${label} needs its height y (or yTop)`);
    const material = signMaterial(text, color, font, logo);
    if (!(width > 0)) width = height * (signAspect.get(material) || guessAspect(text, logo));
    if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
    const across = vertical ? height : width, up = vertical ? width : height; // the panel along the wall and up it
    if (!Number.isFinite(y)) y = yTop - up;
    const nx = Math.sin(yaw), nz = Math.cos(yaw); // the face
    const rx = Math.cos(yaw), rz = -Math.sin(yaw); // its right
    const B = batch(material);
    const bl = [x - rx * across / 2, y, z - rz * across / 2], br = [x + rx * across / 2, y, z + rz * across / 2];
    const tr = [br[0], y + up, br[2]], tl = [bl[0], y + up, bl[2]];
    // u along the text, v from the letters' feet to their tops: at the viewer's bottom left, bottom right, top right
    // and top left corners (a vertical sign's text starting at the top, its feet to the left)
    const [p, q, r, t] = vertical ? [[1, 0], [1, 1], [0, 1], [0, 0]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
    triangle(B, bl, br, tr, p, q, r, [nx, 0, nz]);
    triangle(B, bl, tr, tl, p, r, t, [nx, 0, nz]);
    // the back: the same panel facing the other way, its corners swapped left for right, so the text is not mirrored
    triangle(B, br, bl, tl, p, q, r, [-nx, 0, -nz]);
    triangle(B, br, tl, tr, p, r, t, [-nx, 0, -nz]);
    const part = { name: name || `sign:${label}`, type: 'sign', logo: logo?.id ?? null, material, y0: y, y1: y + up, ring: [[bl[0], bl[2]], [br[0], br[2]]], walls: [], caps: [], bounds: { minX: Math.min(bl[0], br[0]), maxX: Math.max(bl[0], br[0]), minY: y, maxY: y + up, minZ: Math.min(bl[2], br[2]), maxZ: Math.max(bl[2], br[2]) } };
    parts.push(part);
    if (bar !== false && bar !== null) kit.box({ x, z, y: y - 0.6, w: across, h: 0.6, d: 0.8, yaw, material: kit.material(bar), name: `${part.name}:bar` });
    return part;
  };
  /**
   * A sign hung on a building's crown, as the real ones are: on the wall of `ring` facing compass `toward` best,
   * `out` m off it, its top `below` m under the roofline (`top` a height, or a function of (x, z) for a slanted
   * crown: the roofline's low end over that wall), no wider than the wall less `margin`. A crown too round or
   * many-sided for a wall that long (under 8 m) takes the sign on its face toward the bearing, within its width.
   * The rest as sign(). -> the part record
   */
  kit.hang = ({ ring, top, toward, below = 1.5, out = 0.4, margin = 6, ...sign }) => {
    if (!ring || ring.length < 3) throw new Error(`landmark kit: hang ${sign.text || sign.logo?.id || ''} needs a ring`);
    const w = kit.wallToward(ring, toward);
    const line = typeof top === 'function' ? Math.min(top(...w.a), top(...w.b)) : top;
    if (w.length - margin >= 8) {
      return kit.sign({ ...sign, x: w.x + w.nx * out, z: w.z + w.nz * out, yTop: line - below, yaw: w.yaw, maxWidth: Math.min(sign.maxWidth ?? Infinity, w.length - margin), bar: false });
    }
    const [dx, dz] = kit.compass(toward), rx = -dz, rz = dx; // along the bearing, and across it
    let hi = -Infinity, lo = Infinity, cLo = Infinity, cHi = -Infinity;
    for (const [px, pz] of ring) { const t = px * dx + pz * dz, c = px * rx + pz * rz; hi = Math.max(hi, t); lo = Math.min(lo, t); cLo = Math.min(cLo, c); cHi = Math.max(cHi, c); }
    const c = (cLo + cHi) / 2, t = hi + out;
    const crown = typeof top === 'function' ? Math.min(...ring.map(([px, pz]) => top(px, pz))) : top;
    return kit.sign({ ...sign, x: c * rx + t * dx, z: c * rz + t * dz, yTop: crown - below, yaw: Math.atan2(dx, dz), maxWidth: Math.min(sign.maxWidth ?? Infinity, (cHi - cLo) * 0.6), bar: false });
  };
  /**
   * The wall of a ring that faces a compass bearing best — the longest of those within 45° of it, else the one
   * turned nearest: { x, z } its midpoint, nx, nz its outward normal, yaw (for sign()), length, and its ends a, b
   */
  kit.wallToward = (ring, deg) => {
    const [dx, dz] = kit.compass(deg);
    const N = outwardNormals(ring);
    let best = null;
    ring.forEach(([ax, az], i) => {
      const [bx, bz] = ring[(i + 1) % ring.length];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 1e-6) return;
      const [nx, nz] = N[i];
      const dot = nx * dx + nz * dz;
      const score = dot > 0.7 ? 10 + length : dot;
      if (!best || score > best.score) best = { score, x: (ax + bx) / 2, z: (az + bz) / 2, nx, nz, yaw: Math.atan2(nx, nz), length, a: [ax, az], b: [bx, bz] };
    });
    if (!best) throw new Error('landmark kit: wallToward needs a ring with an edge');
    return best;
  };
  // the sign's canvas (px): its height, the text's lines a line apart down its middle, and the logo's box left of them
  // (a little taller than the letters; the panel less a margin for a logo alone or beside lines), padded 20 each side
  const signLayout = (text, logo) => {
    const lines = text ? text.split('\n') : [], line = 118;
    const H = lines.length > 1 ? lines.length * line + 42 : 160;
    const L = logo ? (lines.length === 1 ? 104 : H - 24) : 0;
    return { lines, line, H, L, lw: logo ? Math.ceil(L * logo.aspect) : 0, gap: logo && lines.length ? 36 : 0 };
  };
  // the panel's width over its height without a canvas (in node): 0.62 of the height a letter
  const guessAspect = (text, logo) => {
    if (!logo && !text.includes('\n')) return 0.62 * text.length;
    const { lines, H, lw, gap } = signLayout(text, logo);
    return (40 + lw + gap + 0.62 * 160 * Math.max(0, ...lines.map((l) => l.length))) / H;
  };
  // the text (and logo) as a texture on a cut-out material (alpha-tested, so neither sorted nor drawn twice as a
  // transparent one would be; and its tiny-look stand-in), one per text, colour and logo
  const signAspect = new Map(); // material -> the painted panel's width over its height
  const signMaterial = (text, color, font, logo) => remember(`s${text}:${color}:${font}:${logo?.id ?? ''}`, () => {
    const options = { alphaTest: 0.5 };
    if (typeof document !== 'undefined') {
      const { lines, line, H, L, lw, gap } = signLayout(text, logo);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = font;
      const w = 40 + lw + gap + Math.ceil(Math.max(0, ...lines.map((l) => ctx.measureText(l).width)));
      canvas.width = Math.max(64, w);
      canvas.height = H;
      if (logo) {
        ctx.save();
        logo.draw(ctx, 20, (H - L) / 2, lw, L);
        ctx.restore();
      }
      ctx.font = font;
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      ctx.textBaseline = 'middle';
      lines.forEach((l, i) => ctx.fillText(l, 20 + lw + gap, H / 2 + (i - (lines.length - 1) / 2) * line));
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      options.map = map;
      options.aspect = canvas.width / canvas.height;
    }
    const aspect = options.aspect; delete options.aspect;
    const m = new THREE.MeshBasicNodeMaterial(options);
    if (aspect) signAspect.set(m, aspect);
    m.name = `landmark.sign.${text || logo.id}`;
    const tiny = new THREE.MeshLambertNodeMaterial(options);
    tiny.name = `tinyLandmark.sign.${text || logo.id}`;
    pairMaterial(m, tiny);
    return m;
  });

  // --- materials, each paired with its tiny-look stand-in -------------------------------------------------------------
  const remember = (key, make) => {
    if (!materials.has(key)) materials.set(key, make());
    return materials.get(key);
  };
  /** A matte colour */
  kit.material = (hex, { roughness = 0.78, metalness = 0.04 } = {}) => remember(`m${hex}:${roughness}:${metalness}`, () => {
    const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness, metalness });
    m.name = `landmark.${hex.toString(16)}`;
    pairMaterial(m, createTinyFlatMaterial(hex));
    return m;
  });
  /** The roofs' matte light grey: what every top is unless a solid names its own `top` material */
  kit.roofMaterial = () => kit.material(0xb9b5ac, { roughness: 0.9, metalness: 0.02 });
  /** Glass: dark and glossy; flat and a little toward the sky in the tiny look, as Tiny Warsaw's */
  kit.glassMaterial = (hex) => remember(`g${hex}`, () => {
    const m = new THREE.MeshStandardNodeMaterial({ color: hex, roughness: 0.22, metalness: 0.55 });
    m.name = `landmark.glass.${hex.toString(16)}`;
    pairMaterial(m, createTinyFlatMaterial(blendHex(hex, SKY_BLUE, 0.3)));
    return m;
  });
  /**
   * A painted facade: the wall colour with a window per bay and storey (uv in metres: the kit's walls), in a pattern
   * (punched, ribbon, curtain, strips, or scatter: glass with strips of the wall colour thrown over it a storey tall
   * and `scatter.length` bays long, a share `scatter.density` of the storeys' cells, rising to `scatter.top` between
   * the heights `scatter.ramp` (metres above the ground), seeded by `scatter.seed`; or honeycomb: a hexagon of glass
   * in a frame of the wall colour `honeycomb.frame` of a cell thick each side, a bay wide and a storey apart in rows,
   * every other row half a bay over — pointed at top and bottom; or, `honeycomb.flat`, a storey tall and a bay apart
   * in columns, every other column half a storey up — flat at top and bottom); glossy panes in the photoreal looks,
   * flat in the tiny one
   */
  kit.facadeMaterial = ({ wall, window = 0x3a4a56, floorHeight = 3.6, bayWidth = 2.6, windowWidth = 0.6, windowHeight = 0.55, pattern = 'punched', roughness = 0.78, scatter = null, honeycomb = null } = {}) => {
    if (!PATTERNS.includes(pattern)) throw new Error(`landmark kit: unknown facade pattern "${pattern}"`);
    const thrown = pattern === 'scatter' ? { density: 0.22, top: 0.22, ramp: [0, 1], length: 3, seed: 1, ...(scatter || {}) } : null;
    const hex = pattern === 'honeycomb' ? { flat: false, frame: 0.08, ...(honeycomb || {}) } : null;
    return remember(`f${JSON.stringify([wall, window, floorHeight, bayWidth, windowWidth, windowHeight, pattern, roughness, thrown, hex])}`, () => {
      const panes = () => {
        const p = uv();
        const cu = fract(p.x.div(bayWidth)), cv = fract(p.y.div(floorHeight));
        const fu = fwidth(p.x.div(bayWidth)), fv = fwidth(p.y.div(floorHeight));
        if (pattern === 'honeycomb') {
          // two square lattices (1 by √3, the second half a cell over and up) make the hexagons' centres: the nearer
          // one's offset, folded into a quadrant, gives the distance in from the hexagon's edge (0 on it, ½ at the
          // centre); a flat-topped honeycomb is the pointed one with the wall's axes swapped
          const across = hex.flat ? p.y.div(floorHeight) : p.x.div(bayWidth);
          const along = (hex.flat ? p.x.div(bayWidth) : p.y.div(floorHeight)).mul(0.8660254);
          const ax = mod(across, 1).sub(0.5), az = mod(along, 1.7320508).sub(0.8660254);
          const bx = mod(across.sub(0.5), 1).sub(0.5), bz = mod(along.sub(0.8660254), 1.7320508).sub(0.8660254);
          const nearA = step(ax.mul(ax).add(az.mul(az)), bx.mul(bx).add(bz.mul(bz)));
          const gx = abs(mix(bx, ax, nearA)), gz = abs(mix(bz, az, nearA));
          const inward = float(0.5).sub(max(gx.mul(0.5).add(gz.mul(0.8660254)), gx));
          const fw = fwidth(inward);
          return smoothstep(float(hex.frame).sub(fw), float(hex.frame).add(fw), inward);
        }
        if (pattern === 'scatter') {
          const stripWidth = bayWidth * thrown.length;
          const row = floor(p.y.div(floorHeight));
          const shift = hash(row.add(thrown.seed * 7919)).mul(stripWidth); // each storey's strips start elsewhere
          const su = p.x.add(shift).div(stripWidth);
          const cell = hash(row.mul(1031).add(floor(su).mul(17)).add(thrown.seed * 104729));
          const share = mix(float(thrown.density), float(thrown.top), smoothstep(float(thrown.ramp[0]), float(thrown.ramp[1]), p.y));
          const strip = step(cell, share).mul(band(0.04, 0.96, fract(su), fwidth(su))).mul(band(0.08, 0.92, cv, fv));
          return float(1).sub(strip).mul(band(0.05, 0.97, cv, fv)); // glass but for the strips, a hairline per storey
        }
        if (pattern === 'punched') return band((1 - windowWidth) / 2, (1 + windowWidth) / 2, cu, fu).mul(band(0.28, 0.28 + windowHeight, cv, fv));
        if (pattern === 'ribbon') return band(0.3, 0.82, cv, fv).mul(float(1).sub(band(0.0, 0.035, cu, fu)));
        if (pattern === 'curtain') return band(0.12, 0.88, cu, fu).mul(band(0.16, 0.84, cv, fv));
        return band((1 - windowWidth) / 2, (1 + windowWidth) / 2, cu, fu).mul(band(0.06, 0.97, cv, fv));
      };
      const m = new THREE.MeshStandardNodeMaterial({ roughness, metalness: 0.04 });
      m.name = `landmark.facade.${pattern}`;
      m.colorNode = Fn(() => mix(color(wall), color(window), panes()))();
      m.roughnessNode = Fn(() => mix(float(roughness), float(0.2), panes()))();
      m.metalnessNode = Fn(() => mix(float(0.04), float(0.5), panes()))();
      const tiny = new THREE.MeshLambertNodeMaterial();
      tiny.name = `tinyLandmark.facade.${pattern}`;
      tiny.colorNode = Fn(() => mix(color(wall), color(blendHex(window, SKY_BLUE, 0.3)), panes()))();
      pairMaterial(m, tiny);
      return m;
    });
  };

  // --- records ---------------------------------------------------------------------------------------------------------
  /** The bounds of everything built, about the anchor (the signs and their bars left out unless `signs`) */
  kit.bounds = ({ signs = false } = {}) => {
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const p of parts) {
      if (!signs && (p.type === 'sign' || p.name.endsWith(':bar'))) continue;
      for (const k of Object.keys(b)) b[k] = k.startsWith('min') ? Math.min(b[k], p.bounds[k]) : Math.max(b[k], p.bounds[k]);
    }
    return b;
  };
  /** Pairs of parts (by name, or index) with faces that would flicker against each other: vertical walls on one
   *  plane, the same way out, overlapping along it and in height; tops at one height sharing area */
  kit.flicker = () => {
    const out = [];
    const label = (p) => p.name || `#${parts.indexOf(p)}`;
    const checked = parts.filter((p) => p.type !== 'sign' && !p.name.endsWith(':bar')); // decoration is not checked
    for (let i = 0; i < checked.length; i++) for (let j = i + 1; j < checked.length; j++) if (flickerBetween(checked[i], checked[j])) out.push([label(checked[i]), label(checked[j])]);
    return out;
  };
  /**
   * Prisms to build (`{ ring, y0, y1, ... }`, y1 a height or a sloped top) made safe to draw together, as mapped parts
   * seldom are: one lying entirely within another (its ring inside the other's, its heights within the other's) is
   * dropped, and of two with faces that would flicker the smaller is drawn `inset` m inward (its edges moved in) and
   * as much lower, so its faces sit just inside the other's; again while that uncovers new pairs (a part is inset up
   * to three times: once more when another inset brought a neighbour back onto its faces). Returns the prisms to build.
   */
  kit.resolve = (items, { inset = 0.1 } = {}) => {
    const top = (it) => (typeof it.y1 === 'function' ? Math.max(...it.ring.map(([x, z]) => it.y1(x, z))) : it.y1);
    let list = items.filter((it) => it.ring && it.ring.length >= 3);
    list = list.filter((it) => !list.some((o) => o !== it && o.y0 <= it.y0 + 1e-6 && top(o) >= top(it) - 1e-6 && ringArea(o.ring) > ringArea(it.ring) && ringWithin(it.ring, o.ring)));
    const describe = (it) => ({ walls: wallsOf(it.ring, it.y0, it.y1), caps: typeof it.y1 === 'function' ? [] : [{ y: it.y1, ring: it.ring }] });
    const solids = list.map((it) => ({ it, ...describe(it) }));
    const shrunk = new Map(); // how often each has been inset
    for (let pass = 0; pass < 6; pass++) {
      let changed = false;
      for (let i = 0; i < solids.length; i++) {
        for (let j = i + 1; j < solids.length; j++) {
          if (!flickerBetween(solids[i], solids[j])) continue;
          const small = ringArea(solids[i].it.ring) <= ringArea(solids[j].it.ring) ? solids[i] : solids[j];
          if ((shrunk.get(small) || 0) >= 3) continue;
          shrunk.set(small, (shrunk.get(small) || 0) + 1);
          changed = true;
          const y1 = small.it.y1;
          small.it = { ...small.it, ring: insetRing(small.it.ring, inset), y1: typeof y1 === 'function' ? (x, z) => y1(x, z) - inset : y1 - inset };
          Object.assign(small, describe(small.it));
        }
      }
      if (!changed) break;
    }
    return solids.map((sol) => sol.it);
  };

  /** Merges what was built into one mesh per material in a group at the anchor; colliders (js/open-city-buildings.js
   *  obbCollider) for ground parts and explicit collision prisms — one turned box where the footprint nearly fills it, else
   *  a thin box along each wall — and their footprints for the maps */
  kit.finish = () => {
    const group = new THREE.Group();
    group.name = `Landmark_${name}`;
    group.position.set(anchor.x, 0, anchor.z);
    for (const [material, B] of batches) {
      if (!B.pos.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uvs, 2));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, material);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.name = `Landmark_${name}`;
      group.add(mesh);
    }
    const colliders = [], footprints = [];
    for (const p of [...parts.filter((p) => p.y0 <= 0.5 && p.type !== 'sign' && p.type !== 'beam'), ...collisionParts]) {
      const box = orientedBox(p.ring);
      if (box && ringArea(p.ring) > box.area * 0.85) {
        colliders.push(obbCollider(box.cx + anchor.x, box.cz + anchor.z, box.hx, box.hz, box.ux, box.uz, p.y0, p.y1));
      } else {
        const N = outwardNormals(p.ring);
        for (let i = 0; i < p.ring.length; i++) {
          const [ax, az] = p.ring[i], [bx, bz] = p.ring[(i + 1) % p.ring.length];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 0.4) continue;
          const [nx, nz] = N[i];
          colliders.push(obbCollider((ax + bx) / 2 - nx * 0.4 + anchor.x, (az + bz) / 2 - nz * 0.4 + anchor.z, L / 2, 0.4, (bx - ax) / L, (bz - az) / L, p.y0, p.y1));
        }
        if (p.filled && box) {
          // Fill explicit volumes with scanline strips, so aircraft cannot descend through roof interiors. The
          // 2 m bands approximate the boundary to within 1 m; separate crossing pairs preserve concave openings.
          // Split at every vertex height as well, avoiding a strip that bridges a change in polygon topology.
          const local = p.ring.map(([x, z]) => [x * box.ux + z * box.uz, -x * box.uz + z * box.ux]);
          const rows = [...new Set(local.map((q) => q[1]))].sort((a, b) => a - b);
          for (let row = 0; row + 1 < rows.length; row++) {
            const count = Math.max(1, Math.ceil((rows[row + 1] - rows[row]) / 2));
            const height = (rows[row + 1] - rows[row]) / count;
            for (let band = 0; band < count; band++) {
              const v = rows[row] + (band + 0.5) * height, crosses = [];
              for (let i = 0, j = local.length - 1; i < local.length; j = i++) {
                const [ax, az] = local[j], [bx, bz] = local[i];
                if ((az > v) !== (bz > v)) crosses.push(ax + (bx - ax) * (v - az) / (bz - az));
              }
              crosses.sort((a, b) => a - b);
              for (let i = 0; i + 1 < crosses.length; i += 2) {
                const u = (crosses[i] + crosses[i + 1]) / 2, half = (crosses[i + 1] - crosses[i]) / 2;
                if (half < 1e-6 || height < 1e-6) continue;
                colliders.push(obbCollider(u * box.ux - v * box.uz + anchor.x, u * box.uz + v * box.ux + anchor.z, half, height / 2, box.ux, box.uz, p.y0, p.y1));
              }
            }
          }
        }
      }
      footprints.push({ pts: Float32Array.from(p.ring.flatMap(([x, z]) => [x + anchor.x, z + anchor.z])), h: p.y1 });
    }
    return { group, colliders, footprints };
  };

  return kit;
}

export { createKit, triangulate, orientedBox, insetRing, outwardNormals };
