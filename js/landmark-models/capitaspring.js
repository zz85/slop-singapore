// js/landmark-models/capitaspring.js
// CapitaSpring, 88 Market Street (BIG – Bjarke Ingels Group with Carlo Ratti Associati; RSP Architects; completed
// November 2021): OSM ways 694047464 (the site's outline, building=office), 1157548671 (the podium, building:part, eight
// levels, the same outline) and 1157548672 (the tower, building:part, 51 levels from level 8, 280 m).
// The site is the old Golden Shoe car park: a strip about 20 m wide along Market Street from Chulia Street, widening at
// its south end into the tower's five-sided plot on Church Street. The podium fills the whole outline: two levels of
// hawker centre along the narrow tail, five of car park, its roof a garden with the residents' lap pool. At the south
// end it is lifted 18 m off the ground over the City Room, the sheltered public hall that opens onto the park made of
// the closed end of Market Street. The tower stands on the five-sided plot: eight storeys of serviced residences
// (Citadines), the Green Oasis (levels 17–20: four open storeys of planted terraces winding round the core), 29 storeys
// of offices, a plant storey and the Sky Garden on the roof, round the restaurant pavilion. Silver aluminium fins 1.5 m
// apart run from top to bottom of every face over near-black navy glass; where the gardens are they part like hair, in
// lens-shaped openings, and over the roof they carry on as a lattice screen of fins over slats, a lighter band opened
// by teardrop openings near the top. CapitaLand's name hangs under the crown toward Church Street and Market Street, Citadines' over the City Room.
// Heights: 280 m (CapitaLand's fact sheet, Wikipedia) and the City Room's 18 m (CapitaLand); the levels' uses from the
// fact sheet; the podium roof (47 m), the Green Oasis (73.5–104 m) and the crown's screen (from 252 m) measured on
// photographs from Market Street and Telok Ayer Street; the Sky Garden floor (259 m) estimated. See
// docs/capitaspring.md.
export const info = { name: 'CapitaSpring', height: 280 };

const ID = { outline: 694047464, podium: 1157548671, tower: 1157548672 };
// heights (m): the City Room's soffit, the tail's set-back ground storey, the podium roof, the Green Oasis between the
// residences and the offices, the offices' top, the Sky Garden floor over the plant storey, the restaurant pavilion,
// the fins' top
const H = { cityRoom: 18, shopfront: 6, podium: 47, oasis: 73.5, oasisTop: 104, offices: 252, garden: 259, pavilion: 267, crown: 280 };
const BAY = 1.5; // the fins' spacing along the walls
const STOREY = 5.8; // the podium's storeys (its painted floor lines)
const FIN = 0.36; // a fin's section
const OUT = 0.24; // a fin's axis off the wall line (its inner face 6 cm off the glass)
const CITY_ROOM_DEPTH = 16; // how far the City Room reaches under the tower from its south-east face
// the five faces of the tower (compass bearings of their outward normals)
const FACE = { nw: 328, sw: 240, se: 158, e: 90, ne: 53 };
// colours from the photographs in daylight: bright anodised silver fins over near-black navy glass, strongly striped;
// the crown's lattice the same fins over slats with the sky and the garden between (a lighter blue-grey); terracotta
// slab edges and soffits in the Green Oasis and the terraced beds of the Sky Garden; a grey pavilion on the roof
const C = {
  fin: 0xe2e6e8, glass: 0x141c29, screen: 0x7f93a8, terracotta: 0xb4705a, white: 0xe6e6e2, green: 0x6d8f4a,
  leaf: 0x4a7a38, paving: 0xcfcbc2, pool: 0x5cb8cf, sign: 0xffffff
};
const SLAT = 1.2; // the crown's slats' spacing

// The part of a ring where p·d is at least t (or, `below`, at most t): one side of a straight cut
function cut(ring, [dx, dz], t, below = false) {
  const s = ([x, z]) => (below ? t - (x * dx + z * dz) : x * dx + z * dz - t);
  const out = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], sa = s(a), sb = s(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) { const k = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  });
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05; });
}
// Whether a point lies inside a ring, and how far it is from the ring's edges
function inside([x, z], r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
}
function clearance([x, z], r) {
  let d = Infinity;
  r.forEach((a, i) => {
    const b = r[(i + 1) % r.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2));
    d = Math.min(d, Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t));
  });
  return d;
}
// The outward unit normal of each edge of a ring, from its winding
function normalsOf(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const s = a >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
const centroid = (r) => r.reduce(([x, z], p) => [x + p[0] / r.length, z + p[1] / r.length], [0, 0]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// Where a ray from c along the angle th leaves a ring
function rayOut(r, c, th) {
  const dx = Math.cos(th), dz = Math.sin(th);
  let best = Infinity;
  r.forEach((a, i) => {
    const b = r[(i + 1) % r.length], ex = b[0] - a[0], ez = b[1] - a[1];
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-9) return;
    const t = ((a[0] - c[0]) * ez - (a[1] - c[1]) * ex) / den, u = ((a[0] - c[0]) * dz - (a[1] - c[1]) * dx) / den;
    if (t > 1e-6 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.min(best, t);
  });
  return [c[0] + dx * best, c[1] + dz * best];
}
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

// The walls of a ring as a path: each edge with its outward normal and where it starts along the ring (as the kit lays
// a facade's bays: metres from the ring's first point), so fins can be set on the painted ones
function pathOf(ring) {
  const N = normalsOf(ring), segs = [];
  let s0 = 0;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1e-6) return;
    segs.push({ i, a, b, n: N[i], L, s0, t: [(b[0] - a[0]) / L, (b[1] - a[1]) / L] });
    s0 += L;
  });
  return { ring, segs, length: s0 };
}
// The segment at a distance U along a path (round the ring), and the point there `out` m off the wall
function segAt(path, U) {
  const u = ((U % path.length) + path.length) % path.length;
  return path.segs.find((s) => u >= s.s0 && u < s.s0 + s.L) || path.segs[path.segs.length - 1];
}
function pathAt(path, U, out = 0) {
  const u = ((U % path.length) + path.length) % path.length, s = segAt(path, u), k = Math.min(s.L, Math.max(0, u - s.s0));
  return [s.a[0] + s.t[0] * k + s.n[0] * out, s.a[1] + s.t[1] * k + s.n[1] * out];
}
// The signed distance from b to a along a closed path (the shorter way round)
const along = (path, a, b) => { let d = a - b; d -= Math.round(d / path.length) * path.length; return d; };
// A lens opening's half-width at height y: 0 at its tips, `w` (a little less) across its middle, pointed top and bottom
const lensWidth = (l, y) => (Math.abs(y - l.y) >= l.h ? 0 : 0.92 * l.w * Math.cos((Math.PI / 2) * ((y - l.y) / l.h)));
// How far lens openings push a fin at U along the path sideways at height y: the fins within a lens's half-width are
// pressed out toward its edges, bunching there, the nearer the middle the further
function parted(path, U, y, lenses) {
  let d = 0;
  for (const l of lenses) {
    const o = along(path, U, l.U), a = Math.abs(o), W = lensWidth(l, y);
    if (a >= l.w || W <= 0) continue;
    d += (o >= 0 ? 1 : -1) * (W + a * (1 - W / l.w)) - o;
  }
  return d;
}

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`CapitaSpring needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    // the fins painted a bay apart over the glass where they run straight, a fifth of each bay (the dark glass dominates
    // at a distance, as in the photographs): on the tower without floor lines (the kit's strips pattern draws one at the foot of each
    // `floorHeight`, so a storey taller than the tower leaves only the fins), on the podium with the car park's and
    // hawker centre's storeys
    facade: kit.facadeMaterial({ wall: C.fin, window: C.glass, floorHeight: 400, bayWidth: BAY, windowWidth: 0.8, pattern: 'strips', roughness: 0.6 }),
    podium: kit.facadeMaterial({ wall: C.fin, window: C.glass, floorHeight: STOREY, bayWidth: BAY, windowWidth: 0.8, pattern: 'strips', roughness: 0.6 }),
    // the crown's lattice: the same fins a bay apart over thin slats, the sky and the garden seen between (the fins
    // dominate, as in the photographs; the slats are hairlines)
    screen: kit.facadeMaterial({ wall: C.fin, window: C.screen, floorHeight: SLAT, bayWidth: BAY, windowWidth: 0.66, pattern: 'strips', roughness: 0.5 }),
    fin: kit.material(C.fin, { roughness: 0.38, metalness: 0.45 }), glass: kit.glassMaterial(C.glass),
    terracotta: kit.material(C.terracotta), white: kit.material(C.white, { roughness: 0.6 }), green: kit.material(C.green),
    leaf: kit.material(C.leaf), paving: kit.material(C.paving), pool: kit.material(C.pool, { roughness: 0.2 }), roof: kit.roofMaterial()
  };

  // --- the plan: the tower's five faces and the pieces of the outline around it --------------------------------------
  const tower = ring(ID.tower), outline = ring(ID.outline);
  const N = normalsOf(tower);
  const face = (deg) => {
    const d = kit.compass(deg);
    let best = 0;
    N.forEach((n, i) => { if (n[0] * d[0] + n[1] * d[1] > N[best][0] * d[0] + N[best][1] * d[1]) best = i; });
    return { i: best, a: tower[best], b: tower[(best + 1) % tower.length], n: N[best], t: tower[best][0] * N[best][0] + tower[best][1] * N[best][1] };
  };
  const NE = face(FACE.ne), NW = face(FACE.nw), SE = face(FACE.se);
  // the tail along Market Street: the outline beyond the tower's north-east face; the sliver along its north-west face;
  // the round south end beyond its south-east face
  const tail = cut(outline, NE.n, NE.t);
  const rest = cut(outline, NE.n, NE.t, true);
  const sliver = cut(rest, NW.n, NW.t);
  const roundEnd = cut(cut(rest, NW.n, NW.t, true), SE.n, SE.t);
  // the tower's south end over the City Room, and the rest of its plot
  const towerSouth = cut(tower, SE.n, SE.t - CITY_ROOM_DEPTH);
  const towerNorth = cut(tower, SE.n, SE.t - CITY_ROOM_DEPTH, true);
  if (tail.length < 4 || roundEnd.length < 4 || towerSouth.length < 4) throw new Error('CapitaSpring: the outline is not where it is mapped');
  // an edge of a piece lying on one of the cuts (shared with the tower or another piece)
  const onCut = (r, i, cuts) => {
    const a = r[i], b = r[(i + 1) % r.length];
    return cuts.some((c) => Math.abs(a[0] * c.n[0] + a[1] * c.n[1] - c.t) < 0.05 && Math.abs(b[0] * c.n[0] + b[1] * c.n[1] - c.t) < 0.05);
  };
  const southCut = { n: SE.n, t: SE.t - CITY_ROOM_DEPTH };

  // --- fins ----------------------------------------------------------------------------------------------------------
  // Fins on a path from y0 to y1, one every `step` (a bay: on the facade's painted ones) where `keep(U, seg)` holds (U
  // along the path), each bent round the lens openings it meets; `only` the bent ones
  function fins(path, y0, y1, lenses, name, { keep = () => true, only = false, step = BAY, steps = 8 } = {}) {
    for (let U = 0, k = 0; U < path.length - 0.3; U += step, k++) {
      const seg = segAt(path, U);
      if (!keep(U, seg)) continue;
      const near = lenses.filter((l) => Math.abs(along(path, U, l.U)) < l.w && l.y + l.h > y0 && l.y - l.h < y1);
      if (only && !near.length) continue; // only the bent fins (the straight ones are painted)
      const ys = [y0, y1];
      for (const l of near) for (let j = 0; j <= steps; j++) { const y = l.y - l.h + (2 * l.h * j) / steps; if (y > y0 + 0.2 && y < y1 - 0.2) ys.push(y); }
      ys.sort((p, q) => p - q);
      const pts = ys.filter((y, j) => j === 0 || y - ys[j - 1] > 0.05).map((y) => { const [x, z] = pathAt(path, U + parted(path, U, y, near), OUT); return [x, y, z]; });
      for (let j = 0; j + 1 < pts.length; j++) kit.beam({ from: pts[j], to: pts[j + 1], w: FIN, h: FIN, material: M.fin, name: `${name}-fin-${k}-${j}` });
    }
  }
  // A band of fin-coloured trim along a path's segments at height y (the slab edge the fins are fixed to)
  function band(path, y, name, { keep = () => true, depth = 0.6, h = 0.5, out = 0.3 } = {}) {
    path.segs.forEach((s, j) => {
      if (!keep(s)) return;
      const a = [s.a[0] + s.n[0] * out, y, s.a[1] + s.n[1] * out], b = [s.b[0] + s.n[0] * out, y, s.b[1] + s.n[1] * out];
      kit.beam({ from: a, to: b, w: depth, h, material: M.fin, name: `${name}-band-${j}` });
    });
  }
  // Lens openings along the faces of a path between heights: each face (a segment at least `min` long) gets a run of
  // them, `w` half-width (a range), a gap of straight fins between, centred about `y` with half-height `h` (ranges)
  function lensesOn(path, { min, w, gap, y, h, margin = 2, seed }) {
    const out = [];
    path.segs.forEach((s, j) => {
      if (s.L < min) return;
      let u = s.s0 + margin + hash(seed, j, 7) * gap[1];
      for (let k = 0; ; k++) {
        const hw = w[0] + (w[1] - w[0]) * hash(seed, j, k, 1);
        const c = u + hw;
        if (c + hw > s.s0 + s.L - margin) break;
        out.push({ U: c, w: hw, y: y[0] + (y[1] - y[0]) * hash(seed, j, k, 2), h: h[0] + (h[1] - h[0]) * hash(seed, j, k, 3), seg: s });
        u = c + hw + gap[0] + (gap[1] - gap[0]) * hash(seed, j, k, 4);
      }
    });
    return out;
  }
  // The dark opening behind a lens on a wall (or the planting in one at the top of a wall): thin slices stepping with
  // its width, just proud of the painted fins, within the wall's height
  function opening(path, l, name, { slices = 6, material = M.glass, top = Infinity } = {}) {
    const s = l.seg, [x, z] = pathAt(path, l.U, 0.06), yaw = Math.atan2(s.t[1], s.t[0]);
    for (let j = 0; j < slices; j++) {
      // (an arch from the ground: from the paving up; a lens at the top of the wall: to its top)
      const ya = Math.max(0.32, l.y - l.h + (2 * l.h * j) / slices), yb = Math.min(top, l.y - l.h + (2 * l.h * (j + 1)) / slices);
      if (yb - ya < 0.3) continue;
      const W = Math.min(lensWidth(l, ya), lensWidth(l, yb), lensWidth(l, (ya + yb) / 2)) * 2 - FIN;
      if (W < 0.4) continue;
      kit.box({ x, z, y: ya, w: W, h: yb - ya, d: 0.1, yaw, material, top: material, name: `${name}-opening-${j}` });
    }
  }

  // --- the podium ----------------------------------------------------------------------------------------------------
  const PAVING = 0.32; // above the city's lawn in the block
  // the tail: glass shopfronts set back under it on the ground storey, the car park and hawker centre over them to the
  // roof garden; paved under its overhang
  kit.prism({ ring: tail, y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: 'podium-tail-paving' });
  kit.prism({ ring: kit.inset(tail, 2.2), y0: 0, y1: H.shopfront, material: M.glass, top: M.roof, name: 'podium-tail-shopfront' });
  kit.prism({ ring: tail, y0: H.shopfront, y1: H.podium, material: M.podium, top: M.green, name: 'podium-tail' });
  kit.collisionPrism({ ring: tail, y0: H.shopfront, y1: H.podium });
  // the sliver along the tower's north-west face, solid to the roof
  kit.prism({ ring: sliver, y0: 0, y1: H.podium, material: M.podium, top: M.green, name: 'podium-sliver' });
  // the round south end and the tower's south end, lifted over the City Room: paved under a white soffit
  for (const [r, label] of [[roundEnd, 'podium-round-end'], [towerSouth, 'podium-over-city-room']]) {
    kit.prism({ ring: r, y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: `${label}-paving` });
    kit.prism({ ring: r, y0: H.cityRoom - 0.4, y1: H.cityRoom, material: M.white, top: M.white, name: `${label}-soffit` });
    kit.prism({ ring: r, y0: H.cityRoom, y1: H.podium, material: M.podium, top: label === 'podium-round-end' ? M.green : M.roof, name: label });
    kit.collisionPrism({ ring: r, y0: H.cityRoom - 0.4, y1: H.podium });
  }
  // the rest of the tower's plot down to the ground: the lobbies, glazed toward the City Room
  const lobbyFace = towerNorth.findIndex((p, i) => onCut(towerNorth, i, [southCut]));
  kit.prism({ ring: towerNorth, y0: 0, y1: H.podium, material: M.podium, edgeMaterial: (i) => (i === lobbyFace ? M.glass : null), top: M.roof, name: 'podium-lobbies' });
  // the City Room's columns, carrying the tower's south end
  const cr = centroid(towerSouth), cre = centroid(roundEnd);
  for (const [k, p] of [lerp(cr, towerSouth[0], 0.45), lerp(cr, cre, 0.5), lerp(cre, cr, 0.1)].entries()) {
    kit.cylinder({ x: p[0], z: p[1], y0: PAVING, y1: H.cityRoom - 0.4, r: 0.8, segments: 12, material: M.white, top: M.white, name: `city-room-column-${k}` });
  }

  // the fins round the podium: lenses on the long faces (the car park's openings), with the fins bent round them over
  // dark openings; along the top, fins parting over the planting of the roof garden; at the foot of the tower's Church
  // Street and Market Street faces pointed arches over the glazed lobbies; the fins down to the ground under the tail's
  // overhang; round the City Room, its tall pointed arches
  const cuts = [{ n: NE.n, t: NE.t }, { n: NW.n, t: NW.t }, { n: SE.n, t: SE.t }, southCut];
  const podiumWalls = [[tail, H.shopfront, 'podium-tail'], [towerNorth, PAVING, 'podium-lobbies'], [sliver, PAVING, 'podium-sliver']];
  for (const [r, y0, label] of podiumWalls) {
    const path = pathOf(r);
    const outer = (l) => !onCut(r, l.seg.i, cuts);
    const lenses = lensesOn(path, { min: 12, w: [1.2, 2.2], gap: [3.5, 9], y: [20, 30], h: [6, 10], margin: 3, seed: label.length })
      .filter((l) => outer(l) && l.y - l.h > y0 + 2 && l.y + l.h < H.podium - 8.5);
    const planted = lensesOn(path, { min: 9, w: [2.2, 3.2], gap: [5, 13], y: [H.podium, H.podium], h: [6.5, 8.2], margin: 2.5, seed: label.length + 3 }).filter(outer);
    const arches = r !== towerNorth ? [] : lensesOn(path, { min: 12, w: [1.8, 2.6], gap: [7, 13], y: [0, 0], h: [9, 12], margin: 4, seed: 9 }).filter(outer);
    fins(path, y0, H.podium, [...lenses, ...planted, ...arches], label, { only: true, steps: 6 });
    [...lenses, ...arches].forEach((l, k) => opening(path, l, `${label}-${k}`));
    planted.forEach((l, k) => opening(path, l, `${label}-planted-${k}`, { material: M.green, top: H.podium - 0.05, slices: 4 }));
  }
  const tailPath = pathOf(tail);
  fins(tailPath, PAVING, H.shopfront, [], 'podium-tail-ground', { keep: (U, s) => !onCut(tail, s.i, cuts), step: 2 * BAY });
  for (const [r, label] of [[roundEnd, 'city-room-south'], [towerSouth, 'city-room']]) {
    const path = pathOf(r);
    const outer = path.segs.filter((s) => !onCut(r, s.i, cuts));
    const span = outer.reduce((m, s) => m + s.L, 0);
    // one arch in the middle of each run of outer walls: the round end's south face, and the Church Street and Market
    // Street sides of the tower's end
    const runs = [];
    for (const s of outer) { const last = runs[runs.length - 1]; if (last && Math.abs(last.end - s.s0) < 0.01) last.end = s.s0 + s.L; else runs.push({ start: s.s0, end: s.s0 + s.L }); }
    const arches = runs.filter((g) => g.end - g.start > 8).map((g) => ({ U: (g.start + g.end) / 2, w: Math.min(4.6, (g.end - g.start) * 0.28), y: 0, h: 14.5, seg: segAt(path, (g.start + g.end) / 2) }));
    if (span > 0) fins(path, PAVING, H.cityRoom, arches, label, { keep: (U, s) => !onCut(r, s.i, cuts), steps: 7 });
    band(path, H.cityRoom - 0.25, label, { keep: (s) => !onCut(r, s.i, cuts) });
  }

  // the podium roof: a parapet, the residents' lap pool on a deck along the tail's Market Street side, trees, and the
  // round end's garden with its ring path
  for (const [r, label] of [[tail, 'tail'], [roundEnd, 'round-end'], [sliver, 'sliver']]) {
    const inner = kit.inset(r, 0.35);
    r.forEach((a, i) => {
      const b = r[(i + 1) % r.length];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.5 || onCut(r, i, cuts)) return;
      kit.prism({ ring: [a, b, inner[(i + 1) % r.length], inner[i]], y0: H.podium, y1: H.podium + 1.2, material: M.fin, top: M.fin, name: `podium-parapet-${label}-${i}` });
    });
  }
  // (the tail's Market Street side runs due north from the tower's east corner for 41 m before it bends)
  const north = kit.compass(0), east = kit.compass(90), corner = NE.a[0] * east[0] + NE.a[1] * east[1] > NE.b[0] * east[0] + NE.b[1] * east[1] ? NE.a : NE.b;
  const P = (e, n) => [corner[0] + east[0] * e + north[0] * n, corner[1] + east[1] * e + north[1] * n]; // east and north of it
  const rect = (e0, n0, e1, n1) => [P(e0, n0), P(e1, n0), P(e1, n1), P(e0, n1)];
  const deck = rect(-9, 10, -2.5, 38), pool = rect(-7.2, 12, -4.6, 36);
  kit.prism({ ring: deck, y0: H.podium, y1: H.podium + 0.1, material: M.paving, top: M.paving, name: 'podium-pool-deck' });
  kit.prism({ ring: pool, y0: H.podium, y1: H.podium + 0.14, material: M.pool, top: M.pool, name: 'podium-pool' });

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.1), segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
  // Trees on a grid `step` m apart over a ring, jittered, clear of its edges and of the rings in `avoid`
  function plant(r, y, step, h, avoid, label) {
    const xs = r.map((p) => p[0]), zs = r.map((p) => p[1]);
    let n = 0;
    for (let x = Math.min(...xs) + step / 2, i = 0; x < Math.max(...xs); x += step, i++) {
      for (let z = Math.min(...zs) + step / 2, j = 0; z < Math.max(...zs); z += step, j++) {
        const p = [x + (hash(i, j, 1) - 0.5) * step * 0.5, z + (hash(i, j, 2) - 0.5) * step * 0.5];
        const rr = h * (0.3 + 0.06 * hash(i, j, 3));
        if (!inside(p, r) || clearance(p, r) < rr + 1) continue;
        if (avoid.some((a) => inside(p, a) || clearance(p, a) < rr + 0.8)) continue;
        tree(p[0], p[1], y, h * (0.85 + 0.3 * hash(i, j, 4)), rr, `${label}-${n++}`);
      }
    }
  }
  plant(tail, H.podium, 8, 6, [deck], 'podium-tail');
  // the round end's garden: a lawn disc with a ring path, two trees by the tower
  const rc = lerp(centroid(roundEnd), [(SE.a[0] + SE.b[0]) / 2, (SE.a[1] + SE.b[1]) / 2], 0.25);
  const disc = (rr) => Array.from({ length: 16 }, (_, i) => [rc[0] + Math.cos((i * Math.PI) / 8) * rr, rc[1] + Math.sin((i * Math.PI) / 8) * rr]);
  kit.prism({ ring: disc(3.4), y0: H.podium, y1: H.podium + 0.08, material: M.paving, top: M.paving, name: 'podium-round-end-path' });
  kit.prism({ ring: disc(2.4), y0: H.podium, y1: H.podium + 0.14, material: M.green, top: M.green, name: 'podium-round-end-lawn' });
  for (const [k, f] of [[0, 0.22], [1, 0.78]].values()) {
    const p = lerp(lerp(SE.a, SE.b, f), centroid(roundEnd), 0.35);
    tree(p[0], p[1], H.podium, 6, 1.9, `podium-round-end-${k}`);
  }

  // --- the tower -------------------------------------------------------------------------------------------------------
  const towerPath = pathOf(tower);
  // the serviced residences over the podium, the Green Oasis's floor on top
  kit.prism({ ring: tower, y0: H.podium, y1: H.oasis, material: M.facade, top: M.green, name: 'tower-residences' });
  kit.collisionPrism({ ring: tower, y0: H.podium, y1: H.oasis });
  // where the tower rises out of the podium's roof garden its fins flare out at the foot onto the roof, like roots
  const roofs = [tail, roundEnd, sliver];
  for (let U = 0, k = 0; U < towerPath.length - 0.3; U += BAY, k++) {
    const foot = pathAt(towerPath, U, OUT + 2), mid = pathAt(towerPath, U, OUT + 0.75), top = pathAt(towerPath, U, OUT);
    if (!roofs.some((r) => inside(foot, r) && clearance(foot, r) > 0.6)) continue;
    kit.beam({ from: [foot[0], H.podium, foot[1]], to: [mid[0], H.podium + 2.6, mid[1]], w: FIN, h: FIN, material: M.fin, name: `tower-foot-fin-${k}-0` });
    kit.beam({ from: [mid[0], H.podium + 2.6, mid[1]], to: [top[0], H.podium + 7, top[1]], w: FIN, h: FIN, material: M.fin, name: `tower-foot-fin-${k}-1` });
  }
  // the offices over the Green Oasis, under a terracotta soffit; the plant storey behind the crown's fins, the Sky
  // Garden's floor on it
  kit.prism({ ring: tower, y0: H.oasisTop - 0.6, y1: H.oasisTop, material: M.terracotta, top: M.terracotta, name: 'tower-oasis-soffit' });
  kit.prism({ ring: tower, y0: H.oasisTop, y1: H.offices, material: M.facade, top: M.paving, name: 'tower-offices' });
  kit.collisionPrism({ ring: tower, y0: H.oasisTop - 0.6, y1: H.offices });
  const plantRing = kit.inset(tower, 1.0);
  kit.prism({ ring: plantRing, y0: H.offices, y1: H.garden, material: M.glass, top: M.paving, name: 'tower-plant-storey' });
  kit.collisionPrism({ ring: plantRing, y0: H.offices, y1: H.garden });

  // the Green Oasis: four storeys open behind the parted fins, the core (glazed rooms round it) and a ring of white
  // columns carrying the offices, terraces winding round the core a storey apart with terracotta edges, planted, with
  // trees
  const c0 = centroid(tower), core = kit.inset(tower, 13), edge = kit.inset(tower, 1.2);
  kit.prism({ ring: core, y0: H.oasis, y1: H.oasisTop - 0.6, material: M.glass, top: M.white, name: 'oasis-core' });
  kit.collisionPrism({ ring: core, y0: H.oasis, y1: H.oasisTop - 0.6 });
  const colRing = kit.inset(tower, 2.35);
  colRing.forEach((a, i) => {
    const b = colRing[(i + 1) % colRing.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 10));
    for (let k = 0; k < n; k++) {
      const p = lerp(a, b, k / n);
      kit.cylinder({ x: p[0], z: p[1], y0: H.oasis, y1: H.oasisTop - 0.6, r: 0.55, segments: 10, material: M.white, top: M.white, name: `oasis-column-${i}-${k}` });
    }
  });
  const WEDGES = 30, TERRACES = [{ y: 81.2, from: 0.05, span: 0.62 }, { y: 88.8, from: 0.4, span: 0.6 }, { y: 96.4, from: 0.74, span: 0.58 }];
  let treeCount = 0;
  TERRACES.forEach(({ y, from, span }, level) => {
    for (let j = 0; j < WEDGES; j++) {
      const f0 = j / WEDGES, rel = (((f0 - from) % 1) + 1) % 1;
      if (rel >= span) continue;
      const ta = (j / WEDGES) * 2 * Math.PI, tb = ((j + 1) / WEDGES) * 2 * Math.PI;
      // how far out the terrace reaches toward the fins: a wavy edge
      const reach = (th) => 0.5 + 0.45 * (0.5 + 0.5 * Math.sin(3 * th + level * 1.7));
      const ca = rayOut(core, c0, ta), cb = rayOut(core, c0, tb);
      const oa = lerp(ca, rayOut(edge, c0, ta), reach(ta)), ob = lerp(cb, rayOut(edge, c0, tb), reach(tb));
      const r = [ca, cb, ob, oa];
      kit.prism({ ring: r, y0: y - 1.1, y1: y, material: M.terracotta, top: M.green, name: `oasis-terrace-${level}-${j}` });
      kit.collisionPrism({ ring: r, y0: y - 1.1, y1: y });
      if (j % 3 === level % 3 && rel > 0.05 && rel < span - 0.05) {
        const p = lerp(lerp(ca, cb, 0.5), lerp(oa, ob, 0.5), 0.6);
        tree(p[0], p[1], y, 4.6, 1.5, `oasis-${treeCount++}`);
      }
    }
  });
  // trees on the Green Oasis's floor, between the core and the fins
  for (let j = 0; j < 8; j++) {
    const th = ((j + 0.5) / 8) * 2 * Math.PI, p = lerp(rayOut(core, c0, th), rayOut(edge, c0, th), 0.45);
    tree(p[0], p[1], H.oasis, 6.2, 1.8, `oasis-floor-${j}`);
  }
  // the fins across the Green Oasis, fixed to the slab edges top and bottom, parted in lenses round all five faces
  const oasisLenses = lensesOn(towerPath, { min: 10, w: [3.0, 4.6], gap: [0.3, 1.8], y: [85, 92], h: [9.5, 14.2], margin: 1.2, seed: 17 });
  fins(towerPath, H.oasis, H.oasisTop - 0.6, oasisLenses, 'oasis', { steps: 8 });
  band(towerPath, H.oasis, 'oasis-bottom');
  band(towerPath, H.oasisTop - 0.3, 'oasis-top');

  // --- the crown: the Sky Garden in a screen of fins and slats --------------------------------------------------------
  // the restaurant and plant pavilion in the middle; terraced beds spiralling up round it, terracotta-walled, in a garden
  const pavilion = kit.inset(tower, 11), bedEdge = kit.inset(tower, 3.6);
  kit.prism({ ring: pavilion, y0: H.garden, y1: H.pavilion, material: M.roof, top: M.roof, name: 'sky-garden-pavilion' });
  kit.collisionPrism({ ring: pavilion, y0: H.garden, y1: H.pavilion });
  kit.prism({ ring: kit.inset(pavilion, 6), y0: H.pavilion, y1: H.pavilion + 1.4, material: M.glass, top: M.glass, name: 'sky-garden-pavilion-roof' });
  const pc = centroid(pavilion), BEDS = 20;
  for (let j = 0; j < BEDS; j++) {
    if (j % 5 === 4) continue; // the paths up between them
    const ta = (j / BEDS) * 2 * Math.PI + 0.4, tb = ((j + 1) / BEDS) * 2 * Math.PI + 0.4;
    const ia = rayOut(pavilion, pc, ta), ib = rayOut(pavilion, pc, tb);
    const r = [ia, ib, lerp(ib, rayOut(bedEdge, pc, tb), 0.92), lerp(ia, rayOut(bedEdge, pc, ta), 0.92)];
    // each a step up from the last, on a grey base under a terracotta lip
    const top = H.garden + 1 + (j / BEDS) * 4.6;
    if (top - 0.7 > H.garden + 0.1) kit.prism({ ring: r, y0: H.garden, y1: top - 0.7, material: M.roof, top: M.roof, name: `sky-garden-bed-base-${j}` });
    kit.prism({ ring: r, y0: Math.max(H.garden, top - 0.7), y1: top, material: M.terracotta, top: M.green, name: `sky-garden-bed-${j}` });
    kit.collisionPrism({ ring: r, y0: H.garden, y1: top });
    if (j % 4 === 1) { const p = lerp(lerp(ia, ib, 0.5), lerp(r[2], r[3], 0.5), 0.5); tree(p[0], p[1], top, 3.2, 1.1, `sky-garden-${j}`); }
  }
  // the screen: the shaft's fins carry on up past the offices to 280 m over slats, a lattice painted on both faces of a
  // thin panel (seen from the street and from the garden) in line with the shaft's own fins, cut a slat's row at a time
  // round the teardrop openings at the top of every face; real fins only where they bend round the openings and where
  // they bow out at the corners; held by a band at the foot and a ring beam on top
  const crownLenses = lensesOn(towerPath, { min: 10, w: [1.9, 2.5], gap: [5, 8], y: [267.5, 269], h: [8.2, 9.2], margin: 3, seed: 5 });
  const screen = { y0: H.offices + 0.25, y1: H.crown - 0.5, back: 0.05, mid: 0.2, front: 0.35, corner: 0.35 };
  // A piece of the panel along a face from ua to ub (along the path), as two thin slabs back to back: the outer one's
  // ring starts on its hidden inner face far enough along that its outer face begins at its place in the bays, so the
  // fins painted on it fall on the shaft's own; the inner one's likewise for its face toward the garden, which runs
  // the other way
  const mod = (v) => ((v % BAY) + BAY) % BAY;
  const panel = (s, ua, ub) => {
    const P = (u, off) => [s.a[0] + s.t[0] * (u - s.s0) + s.n[0] * off, s.a[1] + s.t[1] * (u - s.s0) + s.n[1] * off];
    const side = screen.front - screen.mid, L = ub - ua, d = mod(ua - side), e = mod(-ub - side);
    const outer = d > 0.05 && d < L - 0.05 ? [P(ua + d, screen.mid), P(ua, screen.mid), P(ua, screen.front), P(ub, screen.front), P(ub, screen.mid)]
      : [P(ua, screen.front), P(ub, screen.front), P(ub, screen.mid), P(ua, screen.mid)];
    const inner = e > 0.05 && e < L - 0.05 ? [P(ub - e, screen.mid), P(ub, screen.mid), P(ub, screen.back), P(ua, screen.back), P(ua, screen.mid)]
      : [P(ub, screen.back), P(ua, screen.back), P(ua, screen.mid), P(ub, screen.mid)];
    return [outer, inner];
  };
  towerPath.segs.forEach((s, j) => {
    const lenses = crownLenses.filter((l) => l.seg === s).sort((p, q) => p.U - q.U);
    const u0 = s.s0 + screen.corner, u1 = s.s0 + s.L - screen.corner;
    // rows: below the openings, a slat apart through them, above them
    const rows = [];
    if (lenses.length) {
      const lo = Math.floor(Math.min(...lenses.map((l) => l.y - l.h)) / SLAT) * SLAT, hi = Math.ceil(Math.max(...lenses.map((l) => l.y + l.h)) / SLAT) * SLAT;
      rows.push([screen.y0, lo]);
      for (let y = lo; y < hi - 1e-6; y += SLAT) rows.push([y, Math.min(y + SLAT, screen.y1)]);
      rows.push([hi, screen.y1]);
    } else rows.push([screen.y0, screen.y1]);
    rows.filter(([a, b]) => b - a > 0.05).forEach(([a, b], r) => {
      // the stretches of the face clear of the openings at the row's middle
      const pieces = [];
      let from = u0;
      for (const l of lenses) {
        const W = lensWidth(l, (a + b) / 2);
        if (W <= 0) continue;
        if (l.U - W > from + 0.2) pieces.push([from, l.U - W]);
        from = Math.max(from, l.U + W);
      }
      if (u1 > from + 0.2) pieces.push([from, u1]);
      pieces.forEach(([ua, ub], k) => panel(s, ua, ub).forEach((ring, f) => kit.prism({ ring, y0: a, y1: b, material: M.screen, top: M.fin, name: `crown-screen-${j}-${r}-${k}-${f}` })));
    });
  });
  fins(towerPath, screen.y0, screen.y1, crownLenses, 'crown', { only: true, steps: 6 });
  band(towerPath, H.offices, 'crown-bottom');
  band(towerPath, H.crown - 0.25, 'crown-top', { h: 0.5, depth: 0.7, out: OUT });
  // the corner fins bowing out a little, over the screen's ends
  towerPath.segs.forEach((s, j) => {
    const prev = towerPath.segs[(j + towerPath.segs.length - 1) % towerPath.segs.length];
    const bx = s.n[0] + prev.n[0], bz = s.n[1] + prev.n[1], bl = Math.hypot(bx, bz) || 1;
    const P = (off, y) => [s.a[0] + (bx / bl) * off, y, s.a[1] + (bz / bl) * off];
    const pts = [P(OUT, screen.y0), P(OUT + 0.55, screen.y0 + 7), P(OUT + 0.8, (screen.y0 + screen.y1) / 2), P(OUT + 0.55, screen.y1 - 7), P(OUT, screen.y1)];
    for (let k = 0; k + 1 < pts.length; k++) kit.beam({ from: pts[k], to: pts[k + 1], w: 0.5, h: 0.5, material: M.fin, name: `crown-corner-fin-${j}-${k}` });
  });

  // --- signs ------------------------------------------------------------------------------------------------------------
  // CapitaLand's name in white at the top of the offices, under the crown, toward Church Street and toward Market Street;
  // Citadines' over the City Room on the round end
  const CL_FONT = '600 110px "Segoe UI", Helvetica, Arial, sans-serif';
  kit.hang({ ring: tower, top: H.offices, toward: FACE.sw, below: 0.8, out: 0.5, text: 'CapitaLand', height: 4.4, maxWidth: 26, color: C.sign, font: CL_FONT, name: 'sign:capitaland-sw' });
  kit.hang({ ring: tower, top: H.offices, toward: FACE.e, below: 0.8, out: 0.5, text: 'CapitaLand', height: 4.4, maxWidth: 24, color: C.sign, font: CL_FONT, name: 'sign:capitaland-e' });
  kit.hang({ ring: roundEnd, top: H.podium, toward: FACE.se, below: H.podium - 21.2, out: 0.5, text: 'citadines', height: 2, color: C.sign, font: '500 110px "Segoe UI", Helvetica, Arial, sans-serif', name: 'sign:citadines' });
}
