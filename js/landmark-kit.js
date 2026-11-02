import * as THREE from 'three/webgpu';
import { Fn, uv, float, vec3, color, mix, fract, smoothstep, fwidth } from 'three/tsl';
import { pairMaterial, createTinyFlatMaterial, blendHex } from './tiny-look.js';

// js/landmark-kit.js
// The kit the landmark model programs are written against (js/landmark-models/<model>.js, loaded by
// js/landmark-models.js for the anchors tools/city/build.mjs writes into GEO.landmarks), after tinywarsaw.app's: a
// model is a few dozen solids in metres about its anchor (x east, z south, y up from the ground) in a few colours —
// box, prism, loft, cylinder — in a matte colour, a glass, or a painted facade with a window per bay and storey; then
// finish() merges them into one mesh per material, placed at the anchor, with colliders for what stands on the
// ground and footprints for the maps. Every material is paired with its tiny-look stand-in (js/tiny-look.js), so a
// model looks right in every look. The kit keeps a record of what it built (parts, bounds, triangles) and can list
// the faces that would flicker against each other (flicker: coplanar, the same way out, overlapping), so a model
// program can be checked in node without three.js (tests/landmark-models.test.mjs).

const SKY_BLUE = 0x9db9d3;
const PATTERNS = ['punched', 'ribbon', 'curtain', 'strips'];
const band = (lo, hi, x, fw) => smoothstep(float(lo).sub(fw), float(lo).add(fw), x).mul(float(1).sub(smoothstep(float(hi).sub(fw), float(hi).add(fw), x)));

// Ear clipping over a simple polygon [[x, z], ...] (either winding): triangles as index triples
function triangulate(ring) {
  const n = ring.length;
  if (n < 3) return [];
  let area = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const idx = Array.from({ length: n }, (_, i) => i);
  if (area < 0) idx.reverse(); // counter-clockwise in (x, z)
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

// The smallest turned box holding a ring: { cx, cz, hx, hz, ux, uz } (as js/open-city-buildings.js orientedBox)
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

// The vertical walls of a ring between y0 and y1 for the flicker check: each a plane (outward normal, offset) with
// its extent along the plane and up
function wallsOf(ring, y0, y1) {
  const n = ring.length;
  let cx = 0, cz = 0;
  for (const [x, z] of ring) { cx += x; cz += z; }
  cx /= n; cz /= n;
  const walls = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % n];
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 1e-6) continue;
    let nx = (bz - az) / L, nz = -(bx - ax) / L;
    if (nx * ((ax + bx) / 2 - cx) + nz * ((az + bz) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
    const tx = -nz, tz = nx;
    const a0 = ax * tx + az * tz, a1 = bx * tx + bz * tz;
    walls.push({ nx, nz, off: ax * nx + az * nz, a0: Math.min(a0, a1), a1: Math.max(a0, a1), y0, y1 });
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
// Whether every point of ring A lies within (or on) ring B
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
  for (const w of A.walls) for (const v of B.walls) {
    if (Math.abs(w.nx * v.nx + w.nz * v.nz - 1) > 1e-6 || Math.abs(w.off - v.off) > 0.01) continue;
    if (Math.min(w.a1, v.a1) - Math.max(w.a0, v.a0) > 0.05 && Math.min(w.y1, v.y1) - Math.max(w.y0, v.y0) > 0.05) return true;
  }
  for (const c of A.caps) for (const d of B.caps) {
    if (Math.abs(c.y - d.y) <= 0.01 && ringsOverlap(c.ring, d.ring)) return true;
  }
  return false;
}
const ringArea = (ring) => { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; return Math.abs(a / 2); };

/** A kit about the anchor `{ x, z }` (world metres) of the landmark `name` */
function createKit({ anchor = { x: 0, z: 0 }, name = '' } = {}) {
  const parts = []; // what was built: { name, type, material, y0, y1, bounds, walls: [...], caps: [...] }
  const batches = new Map(); // material -> { pos, nrm, uvs }
  const materials = new Map();
  const kit = { anchor, parts, triangles: 0 };

  const batch = (material) => {
    if (!batches.has(material)) batches.set(material, { pos: [], nrm: [], uvs: [] });
    return batches.get(material);
  };
  // one flat-shaded triangle with uv in metres
  const tri = (B, a, b, c, ua, ub, uc) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const L = Math.hypot(nx, ny, nz) || 1;
    nx /= L; ny /= L; nz /= L;
    B.pos.push(...a, ...b, ...c);
    B.nrm.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    B.uvs.push(...ua, ...ub, ...uc);
    kit.triangles++;
  };
  // a quad wound to face the way `n` points (a, b, c, d around it)
  const quad = (B, pts, uvs, n) => {
    const [a, b, c] = pts;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const flip = nx * n[0] + ny * n[1] + nz * n[2] < 0;
    const P = flip ? [pts[0], pts[3], pts[2], pts[1]] : pts;
    const U = flip ? [uvs[0], uvs[3], uvs[2], uvs[1]] : uvs;
    tri(B, P[0], P[1], P[2], U[0], U[1], U[2]);
    tri(B, P[0], P[2], P[3], U[0], U[2], U[3]);
  };

  /**
   * A solid over the ring [[x, z], ...] from y0 up, its top at y1 (a function of (x, z) for a sloped top), the top
   * ring scaled toward its centre by `scale` (a loft), walls in `material` (the top in `top` material, else the same).
   * Below 0.5 m from the ground no underside is drawn. -> the part record
   */
  function solid({ ring, y0 = 0, y1, scale = 1, material, top = kit.roofMaterial(), name = '', type = 'prism' }) {
    if (!ring || ring.length < 3) throw new Error(`landmark kit: ${type} needs a ring of 3 points or more`);
    if (!(y1 > y0) && typeof y1 !== 'function') throw new Error(`landmark kit: ${type} ${name} is not taller than its base`);
    const n = ring.length;
    let cx = 0, cz = 0;
    for (const [x, z] of ring) { cx += x; cz += z; }
    cx /= n; cz /= n;
    const topRing = ring.map(([x, z]) => [cx + (x - cx) * scale, cz + (z - cz) * scale]);
    const topY = (x, z) => (typeof y1 === 'function' ? y1(x, z) : y1);
    const B = batch(material);
    const part = { name, type, material, y0, y1: -Infinity, walls: [], caps: [], ring, bounds: { minX: Infinity, maxX: -Infinity, minY: y0, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity } };
    const grow = ([x, y, z]) => { const b = part.bounds; b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x); b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y); b.minZ = Math.min(b.minZ, z); b.maxZ = Math.max(b.maxZ, z); };
    // walls: outward from the ring's centre, uv metres along the wall and up
    let along = 0;
    for (let i = 0; i < n; i++) {
      const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % n];
      const [tax, taz] = topRing[i], [tbx, tbz] = topRing[(i + 1) % n];
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 1e-6) continue;
      let nx = (bz - az) / L, nz = -(bx - ax) / L; // a normal to the edge
      const mx = (ax + bx) / 2 - cx, mz = (az + bz) / 2 - cz;
      if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; } // the one pointing away from the centre
      const ya = topY(tax, taz), yb = topY(tbx, tbz);
      const p = [[ax, y0, az], [bx, y0, bz], [tbx, yb, tbz], [tax, ya, taz]];
      quad(B, p, [[along, y0], [along + L, y0], [along + L, yb], [along, ya]], [nx, 0, nz]);
      p.forEach(grow);
      along += L;
    }
    // vertical walls recorded for the flicker check (plane: normal & offset; extents along it and up)
    if (scale === 1 && typeof y1 !== 'function') part.walls = wallsOf(ring, y0, y1);
    // the top (and, up in the air, the underside)
    const tris = triangulate(topRing);
    const T = batch(top);
    for (const [i, j, k] of tris) {
      const P = [topRing[i], topRing[j], topRing[k]].map(([x, z]) => [x, topY(x, z), z]);
      quad(T, [P[0], P[1], P[2], P[2]], [[P[0][0], P[0][2]], [P[1][0], P[1][2]], [P[2][0], P[2][2]], [P[2][0], P[2][2]]], [0, 1, 0]);
      kit.triangles--; // (the quad drew a degenerate second triangle)
      T.pos.length -= 9; T.nrm.length -= 9; T.uvs.length -= 6;
      P.forEach(grow);
    }
    if (typeof y1 !== 'function') part.caps.push({ y: y1, ring: topRing });
    if (y0 > 0.5) {
      for (const [i, j, k] of tris) {
        const P = [ring[i], ring[j], ring[k]].map(([x, z]) => [x, y0, z]);
        quad(B, [P[0], P[1], P[2], P[2]], [[P[0][0], P[0][2]], [P[1][0], P[1][2]], [P[2][0], P[2][2]], [P[2][0], P[2][2]]], [0, -1, 0]);
        kit.triangles--;
        B.pos.length -= 9; B.nrm.length -= 9; B.uvs.length -= 6;
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
  /** A prism over a ring [[x, z], ...] from y0 to y1 (y1 may be a function of (x, z): a sloped top) */
  kit.prism = ({ ring, y0 = 0, y1, material, top, name = '' }) => solid({ ring, y0, y1, material, top, name, type: 'prism' });
  /** A loft: the ring at y0, scaled toward its centre by `scale` at y1 (a taper, a setback crown, a spire at ~0) */
  kit.loft = ({ ring, y0 = 0, y1, scale = 0.5, material, top, name = '' }) => solid({ ring, y0, y1, scale, material, top, name, type: 'loft' });
  /** A cylinder about (x, z) from y0 to y1, radius r, in `segments` sides */
  kit.cylinder = ({ x = 0, z = 0, y0 = 0, y1, r, segments = 12, material, top, name = '' }) => {
    const ring = Array.from({ length: segments }, (_, i) => { const a = (i / segments) * Math.PI * 2; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; });
    return solid({ ring, y0, y1, material, top, name, type: 'cylinder' });
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
  kit.bearingDeg = 0;

  // --- materials, each paired with its tiny-look stand-in -------------------------------------------------------------
  const remember = (key, make) => {
    if (!materials.has(key)) materials.set(key, make());
    return materials.get(key);
  };
  /** A matte colour */
  kit.material = (hex, { roughness = 0.78, metalness = 0.04 } = {}) => remember(`m${hex}`, () => {
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
  /** A painted facade: the wall colour with a window per bay and storey (uv in metres: the kit's walls), in a
   *  pattern (punched, ribbon, curtain, strips); glossy panes in the photoreal looks, flat in the tiny one */
  kit.facadeMaterial = ({ wall, window = 0x3a4a56, floorHeight = 3.6, bayWidth = 2.6, windowWidth = 0.6, windowHeight = 0.55, pattern = 'punched', roughness = 0.78 } = {}) => {
    if (!PATTERNS.includes(pattern)) throw new Error(`landmark kit: unknown facade pattern "${pattern}"`);
    return remember(`f${JSON.stringify([wall, window, floorHeight, bayWidth, windowWidth, windowHeight, pattern])}`, () => {
      const panes = () => {
        const p = uv();
        const cu = fract(p.x.div(bayWidth)), cv = fract(p.y.div(floorHeight));
        const fu = fwidth(p.x.div(bayWidth)), fv = fwidth(p.y.div(floorHeight));
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
  /** The bounds of everything built, about the anchor */
  kit.bounds = () => {
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (const p of parts) for (const k of Object.keys(b)) b[k] = k.startsWith('min') ? Math.min(b[k], p.bounds[k]) : Math.max(b[k], p.bounds[k]);
    return b;
  };
  /** Pairs of parts with faces that would flicker against each other: vertical walls on one plane, the same way out,
   *  overlapping along it and in height; tops at one height with overlapping footprints */
  kit.flicker = () => {
    const out = [];
    const seen = new Set();
    const note = (a, b) => { const k = [a.name, b.name].join('|'); if (!seen.has(k)) { seen.add(k); out.push([a.name, b.name]); } };
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (flickerBetween(parts[i], parts[j])) note(parts[i], parts[j]);
    return out;
  };
  /**
   * Prisms to build (`{ ring, y0, y1, ... }`, y1 a number or a sloped top) made safe to draw together, as mapped parts
   * seldom are: one lying entirely within another (its ring inside the other's, its heights within the other's) is
   * dropped, and of two with faces that would flicker the smaller is drawn inset by `inset` m (its ring scaled
   * toward its centre), so its faces sit just inside the other's. Returns the prisms to build.
   */
  kit.resolve = (items, { inset = 0.1 } = {}) => {
    const top = (it) => (typeof it.y1 === 'function' ? Math.max(...it.ring.map(([x, z]) => it.y1(x, z))) : it.y1);
    let list = items.filter((it) => it.ring && it.ring.length >= 3);
    list = list.filter((it) => !list.some((o) => o !== it && o.y0 <= it.y0 + 1e-6 && top(o) >= top(it) - 1e-6 && ringArea(o.ring) > ringArea(it.ring) && ringWithin(it.ring, o.ring)));
    const describe = (it) => ({ walls: typeof it.y1 === 'function' ? [] : wallsOf(it.ring, it.y0, it.y1), caps: typeof it.y1 === 'function' ? [] : [{ y: it.y1, ring: it.ring }] });
    const solids = list.map((it) => ({ it, ...describe(it) }));
    // the smaller of a flickering pair drawn a little inset and a little lower (its top under the other's), once;
    // again while that uncovers new pairs
    const shrunk = new Set();
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (let i = 0; i < solids.length; i++) {
        for (let j = i + 1; j < solids.length; j++) {
          if (!flickerBetween(solids[i], solids[j])) continue;
          const small = ringArea(solids[i].it.ring) <= ringArea(solids[j].it.ring) ? solids[i] : solids[j];
          if (shrunk.has(small)) continue;
          shrunk.add(small);
          changed = true;
          const ring = small.it.ring;
          let cx = 0, cz = 0;
          for (const [x, z] of ring) { cx += x; cz += z; }
          cx /= ring.length; cz /= ring.length;
          const r = Math.min(...ring.map(([x, z]) => Math.hypot(x - cx, z - cz))) || 1;
          const f = Math.max(0.5, 1 - inset / r);
          small.it = { ...small.it, ring: ring.map(([x, z]) => [cx + (x - cx) * f, cz + (z - cz) * f]), y1: typeof small.it.y1 === 'function' ? small.it.y1 : small.it.y1 - inset };
          Object.assign(small, describe(small.it));
        }
      }
      if (!changed) break;
    }
    return solids.map((sol) => sol.it);
  };

  /** Merges what was built into one mesh per material in a group at the anchor; colliders (js/open-city-buildings.js
   *  obbCollider) for every part standing on the ground, and their footprints for the maps */
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
    for (const p of parts) {
      if (p.y0 > 0.5) continue;
      const box = orientedBox(p.ring);
      if (box) {
        const cx = box.cx + anchor.x, cz = box.cz + anchor.z;
        const ex = Math.abs(box.ux) * box.hx + Math.abs(box.uz) * box.hz;
        const ez = Math.abs(box.uz) * box.hx + Math.abs(box.ux) * box.hz;
        colliders.push({ minX: cx - ex, maxX: cx + ex, minZ: cz - ez, maxZ: cz + ez, minY: p.y0, maxY: p.y1, obb: { cx, cz, hx: box.hx, hz: box.hz, cs: box.ux, sn: -box.uz } });
      }
      footprints.push({ pts: Float32Array.from(p.ring.flatMap(([x, z]) => [x + anchor.x, z + anchor.z])), h: p.y1 });
    }
    return { group, colliders, footprints };
  };

  return kit;
}

export { createKit, triangulate, orientedBox };
