// js/landmark-models/ocean-financial-centre.js
// Ocean Financial Centre, 10 Collyer Quay (Pelli Clarke Pelli with Architects 61 for Keppel Land, 2011): OSM ways
// 172915346 (the outline), 46595387 (the 43-storey tower, 245 m, roof:shape=skillion falling toward 240°, 30 m),
// 1566589608 (the lower slab, 195 m), 1566589605 and 1566589606 (the car-park podium along The Arcade) and 1566589607
// (the plaza canopy). The Arcade next door (171999284 and its parts) is not part of this site.
// The tower is a sail in plan: a flatter face toward Raffles Place and the plaza, a strongly bowed one along Collyer
// Quay, a narrow end toward the bay and a straight one toward the south-west. A lower slab wraps its plaza face and its
// south-west end. Pale aqua glass is banded every storey by light aluminium spandrels; the narrow end carries vertical
// fins; the crown is a screen of lighter glass whose top curves down 30 m from the bay end to the south-west end, over
// four storeys of gardens and a roof of solar panels. Under the tower a colonnade of thick polished stainless columns
// stands before the lobby's pale louvred glass over beige stone, with a taxi drop-off behind the columns along Collyer
// Quay and the building's name on a black granite plinth in front of them. A triangular canopy of white and stained
// glass on a steel frame, dipping like a cocktail glass to one white column, roofs the plaza between the tower and the
// podium, whose faces to the plaza and to Raffles Place are the green wall. Keppel's name hangs on the crown toward the
// bay and toward Raffles Place (ANZ's, on the bay end until ANZ moved to Marina One in October 2026, is left off).
// Heights: 245 m (Wikipedia, CTBUH), the slab's 195 m and the crown's 30 m fall as mapped (the fall checked against
// photographs from the bay), the canopy 27 m (Architects 61) to 42 m (Pelli Clarke Pelli) high; the podium's levels as
// mapped; the lobby, columns, louvred plant floors, crown depth and the canopy's folds are estimated from photographs and
// the Esri aerial. See docs/ocean-financial-centre.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Ocean Financial Centre', height: 245 };

const ID = { outline: 172915346, tower: 46595387, slab: 1566589608, podium: 1566589605, podiumStrip: 1566589606, canopy: 1566589607 };
const AXIS = 62; // the tower's length, from its south-west end to its bay end (compass degrees)
// heights (m): the crown (its top at the bay end, its fall, the glass screen's depth there and at the south-west end),
// the slab, the base (lobby, its stone foot, louvred plant band; the name's plinth), the mid-height plant floors, the
// podium, the canopy
const H = {
  top: 245, fall: 30, crownNE: 24, crownSW: 4,
  slab: 191, parapet: 195,
  lobby: 12, stone: 3.8, plant: 25, plinth: 1.6, midPlant: 105, midPlantTop: 111,
  shops: 5, podium: 16, podiumStrip: 20, passageWall: 20, link: [14, 21],
  canopyLow: 27, canopyHigh: 40, canopyNode: 25
};
const STOREY = 4.6; // the offices' floor to floor, one spandrel band each
// colours from daylight photographs: pale aqua glass between light aluminium spandrels (the crown's screen the same
// bands over lighter glass, the sky showing through), dark blue solar panels, the green wall, the base's light
// grey-green louvred glass over beige stone behind bright polished stainless columns, black granite, the canopy's white
// lattice over panes of red, blue and yellow among frosted white
const C = {
  glass: 0x9cc4c1, spandrel: 0xd5dedc, crownGlass: 0xb9d4d4, pv: 0x24375a, pvFrame: 0x9aa1a4,
  garden: 0x6a9a3c, granite: 0x1f2223, stainless: 0xdfe2e1, louvre: 0xccd8d5, louvreGap: 0xbcd0cd, white: 0xf0f1ee,
  paving: 0xcdc4b3, lattice: 0xf3f4f1, frosted: 0xd8e3e3, red: 0xdc4a2c, blue: 0x2a80cf, yellow: 0xe8c22e, name: 0xf4f4f0
};

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
// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const s = a >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// The plane h = a x + b z + c through three points [x, z] at heights h
function plane([A, B, Cc], [hA, hB, hC]) {
  const det = A[0] * (B[1] - Cc[1]) - A[1] * (B[0] - Cc[0]) + (B[0] * Cc[1] - Cc[0] * B[1]);
  const a = (hA * (B[1] - Cc[1]) - A[1] * (hB - hC) + (hB * Cc[1] - hC * B[1])) / det;
  const b = (A[0] * (hB - hC) - hA * (B[0] - Cc[0]) + (B[0] * hC - Cc[0] * hB)) / det;
  return { a, b, c: hA - a * A[0] - b * A[1] };
}
// Whether a point lies inside a ring
function inside([x, z], r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
}
// How far inside a triangle a point is: the least of its barycentric weights (negative outside)
function within([x, z], [A, B, Cc]) {
  const d = (B[1] - Cc[1]) * (A[0] - Cc[0]) + (Cc[0] - B[0]) * (A[1] - Cc[1]);
  const l1 = ((B[1] - Cc[1]) * (x - Cc[0]) + (Cc[0] - B[0]) * (z - Cc[1])) / d;
  const l2 = ((Cc[1] - A[1]) * (x - Cc[0]) + (A[0] - Cc[0]) * (z - Cc[1])) / d;
  return Math.min(l1, l2, 1 - l1 - l2);
}

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Ocean Financial Centre needs mapped way ${id}`);
    return p.ring;
  };
  // A point given in metres east and north of the anchor, and the mapped point of a ring nearest to one (within 3 m:
  // the drawing's corners are the mapped ones)
  const E = kit.compass(90), N = kit.compass(0);
  const P = (e, n) => [E[0] * e + N[0] * n, E[1] * e + N[1] * n];
  const near = (r, e, n, what) => {
    const [x, z] = P(e, n);
    let best = null, d = Infinity;
    for (const p of r) { const k = Math.hypot(p[0] - x, p[1] - z); if (k < d) { d = k; best = p; } }
    if (d > 3) throw new Error(`Ocean Financial Centre: ${what} is not where it is mapped (${d.toFixed(1)} m off)`);
    return best;
  };
  const indexOf = (r, p) => r.findIndex((q) => q === p);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // the tower's axes: u along it toward the bay end, v across it toward the plaza
  const U = kit.compass(AXIS), V = kit.compass(AXIS - 90);
  const u = (p) => p[0] * U[0] + p[1] * U[1], v = (p) => p[0] * V[0] + p[1] * V[1];

  const M = {
    office: kit.facadeMaterial({ wall: C.spandrel, window: C.glass, floorHeight: STOREY, bayWidth: 1.5, pattern: 'ribbon' }),
    crown: kit.facadeMaterial({ wall: C.spandrel, window: C.crownGlass, floorHeight: STOREY, bayWidth: 1.5, pattern: 'ribbon' }),
    pv: kit.facadeMaterial({ wall: C.pvFrame, window: C.pv, floorHeight: 1.8, bayWidth: 2.4, pattern: 'curtain' }),
    // light grey-green glass over fine horizontal louvres: the lobby, the plant floors, the podium's screens
    louvre: kit.facadeMaterial({ wall: C.louvre, window: C.louvreGap, floorHeight: 0.6, bayWidth: 1.5, pattern: 'ribbon' }),
    lattice: kit.facadeMaterial({ wall: C.lattice, window: C.frosted, floorHeight: 2.6, bayWidth: 2.6, pattern: 'curtain' }),
    // the canopy's underside: frosted white panes with coloured ones among them, a colour a strip
    panes: [[C.red, 3], [C.blue, 7], [C.yellow, 11]].map(([wall, seed]) => kit.facadeMaterial({ wall, window: C.lattice, floorHeight: 1.8, bayWidth: 1.8, pattern: 'scatter', scatter: { density: 0.28, top: 0.28, length: 1, seed } })),
    garden: kit.material(C.garden, { roughness: 0.95 }), granite: kit.glassMaterial(C.granite),
    stainless: kit.material(C.stainless, { roughness: 0.3, metalness: 0.2 }), white: kit.material(C.white, { roughness: 0.5 }),
    // the paving, the beige stone at the lobby's foot, and the roofs out of sight
    paving: kit.material(C.paving)
  };

  // --- the drawing: mapped rings and the corners taken from them -------------------------------------------------------
  const tower = ring(ID.tower), slab = ring(ID.slab), outline = ring(ID.outline);
  const podium = ring(ID.podium), strip = ring(ID.podiumStrip), canopyRing = ring(ID.canopy);
  const us = tower.map(u), uMin = Math.min(...us), uMax = Math.max(...us);
  // the crown: 245 m at the bay end, curving down 30 m to the south-west end (flat at first, steepest at the end), as
  // the photographs from the bay show it; the offices under it stop 24 m down at the bay end, 4 m at the other
  const t = (x, z) => Math.min(1, Math.max(0, (uMax - (x * U[0] + z * U[1])) / (uMax - uMin)));
  const top = (x, z) => H.top - H.fall * t(x, z) ** 1.5;
  const shaftTop = (x, z) => top(x, z) - (H.crownNE + (H.crownSW - H.crownNE) * t(x, z));
  // tower and slab together: the outline from the slab's west corner round the bowed face to the slab's end by the podium
  const slabWest = near(outline, -41.6, -12.9, "the slab's west corner"), slabEnd = near(outline, 2.9, 10.3, "the slab's north-east end");
  const footprint = [];
  for (let i = indexOf(outline, slabWest), k = 0; k < outline.length; i = (i + 1) % outline.length, k++) {
    footprint.push(outline[i]);
    if (outline[i] === slabEnd) break;
  }
  // the bowed face is the far side of the tower from the plaza: check the walk went that way round
  if (Math.min(...footprint.map(v)) > Math.min(...tower.map(v)) + 1) throw new Error('Ocean Financial Centre: the footprint missed the bowed face');

  // --- the base: the lobby behind thick stainless columns, the louvred plant floors over it ----------------------------
  // the lobby wall stands 5 m in (beige stone to 3.8 m, louvred glass over it), and on the Collyer Quay side behind the
  // taxi drop-off under the bowed face
  const vSE = Math.min(...tower.map(v));
  const lobby = cut(kit.inset(footprint, 5), V, vSE + 11);
  kit.prism({ ring: lobby, y0: 0, y1: H.stone, material: M.paving, top: M.paving, name: 'lobby-stone' });
  kit.prism({ ring: lobby, y0: H.stone, y1: H.lobby, material: M.louvre, top: M.paving, name: 'lobby' });
  // the columns: polished stainless, 1.8 m round, 2.4 m in from the faces about every 8.5 m, all round under the tower
  // and the slab
  const colonnade = kit.inset(footprint, 2.4);
  let along = 4, n = 0;
  colonnade.forEach((a, i) => {
    const b = colonnade[(i + 1) % colonnade.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (; along < L; along += 8.5) {
      const [x, z] = lerp(a, b, along / L);
      kit.cylinder({ x, z, y0: 0, y1: H.lobby + 0.2, r: 0.9, segments: 16, material: M.stainless, top: M.stainless, name: `column-${n++}` });
    }
    along -= L;
  });
  kit.prism({ ring: footprint, y0: H.lobby, y1: H.plant, material: M.louvre, top: M.paving, name: 'plant-floors' });
  // the building's name in white on a black granite plinth before the columns at the middle of the bowed face, between
  // the drop-off and Collyer Quay: a straight block 14 m long on the face's edge that looks most squarely onto the quay,
  // its ends within the face's curve, the lettering a hair proud of its street face
  const Nf0 = normalsOf(footprint);
  const quay = footprint.reduce((best, p, i) => (-(Nf0[i][0] * V[0] + Nf0[i][1] * V[1]) > -(Nf0[best][0] * V[0] + Nf0[best][1] * V[1]) ? i : best), 0);
  const quayMid = lerp(footprint[quay], footprint[(quay + 1) % footprint.length], 0.5);
  const plinth = kit.box({ x: quayMid[0] + V[0] * 0.85, z: quayMid[1] + V[1] * 0.85, y: 0, w: 14, h: H.plinth, d: 0.8, yaw: Math.atan2(U[1], U[0]), material: M.granite, top: M.granite, name: 'plinth' });
  kit.hang({ ring: plinth.ring, top: H.plinth, toward: AXIS + 90, below: 0.2, out: 0.04, margin: 3, text: 'Ocean Financial Centre', height: 1.2, color: C.name, font: '500 110px "Segoe UI", Helvetica, Arial, sans-serif', name: 'sign:ocean-financial-centre' });

  // --- the shafts: tower and slab as one up to the slab's roof, a louvred plant band at mid-height --------------------
  kit.prism({ ring: footprint, y0: H.plant, y1: H.midPlant, material: M.office, top: M.paving, name: 'shaft-low' });
  kit.prism({ ring: footprint, y0: H.midPlant, y1: H.midPlantTop, material: M.louvre, top: M.paving, name: 'plant-mid' });
  kit.prism({ ring: footprint, y0: H.midPlantTop, y1: H.slab, material: M.office, top: M.garden, name: 'shaft-slab' });
  kit.collisionPrism({ ring: footprint, y0: H.lobby, y1: H.slab });
  // the slab's glass parapet, on its faces clear of the tower (those whose outside is not inside the tower)
  const Ns = normalsOf(slab), slabIn = kit.inset(slab, 0.4);
  slab.forEach((a, i) => {
    const j = (i + 1) % slab.length, mid = lerp(a, slab[j], 0.5);
    if (Math.hypot(slab[j][0] - a[0], slab[j][1] - a[1]) < 1 || inside([mid[0] + Ns[i][0] * 0.6, mid[1] + Ns[i][1] * 0.6], tower)) return;
    kit.prism({ ring: [a, slab[j], slabIn[j], slabIn[i]], y0: H.slab, y1: H.parapet, material: M.crown, top: M.white, name: `slab-parapet-${i}` });
  });

  // --- the tower over the slab, its crown --------------------------------------------------------------------------------
  kit.prism({ ring: tower, y0: H.slab, y1: shaftTop, material: M.office, top: M.garden, name: 'tower' });
  // the crown's glass screen, 0.3 m proud of the offices' wall and lapping over its top, piece by piece round the ring,
  // each piece's foot on a storey line (inside a spandrel band, where the screen's bands and the offices' meet unseen)
  const screenOut = kit.inset(tower, -0.3), screenIn = kit.inset(tower, 0.35);
  tower.forEach((a, i) => {
    const j = (i + 1) % tower.length;
    if (Math.hypot(tower[j][0] - a[0], tower[j][1] - a[1]) < 0.5) return;
    const y0 = Math.floor((Math.min(shaftTop(...a), shaftTop(...tower[j])) - 1) / STOREY) * STOREY;
    kit.prism({ ring: [screenOut[i], screenOut[j], screenIn[j], screenIn[i]], y0, y1: top, material: M.crown, top: M.white, name: `crown-screen-${i}` });
  });
  // inside it: the garden storeys, set 4 m in, roofed with solar panels a storey under the screen's top (clear of the
  // narrow bay end)
  const inner = cut(kit.inset(tower, 4), U, uMax - 6, true);
  const innerTop = (x, z) => Math.max(top(x, z) - 3, shaftTop(x, z) + 2);
  kit.prism({ ring: inner, y0: Math.min(...inner.map((p) => shaftTop(...p))) - 1, y1: innerTop, material: M.crown, top: M.pv, name: 'crown-gardens' });
  // white steel trusses across the gardens' well, from the screen's top to the solar roof's edge, about every 5 m
  let run = 2.5;
  screenIn.forEach((a, i) => {
    const b = screenIn[(i + 1) % screenIn.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (; run < L; run += 5) {
      // straight across to the solar roof's edge: the nearest point of its ring's edges
      const p = lerp(a, b, run / L);
      let q = inner[0], d = Infinity;
      inner.forEach((r, k) => {
        const s = inner[(k + 1) % inner.length], ex = s[0] - r[0], ez = s[1] - r[1], l2 = ex * ex + ez * ez || 1;
        const f = Math.max(0, Math.min(1, ((p[0] - r[0]) * ex + (p[1] - r[1]) * ez) / l2)), c = [r[0] + ex * f, r[1] + ez * f];
        const k2 = Math.hypot(c[0] - p[0], c[1] - p[1]);
        if (k2 < d) { d = k2; q = c; }
      });
      if (d > 8) continue;
      kit.beam({ from: [p[0], top(...p) - 0.4, p[1]], to: [q[0], innerTop(...q) - 0.2, q[1]], w: 0.35, h: 0.5, material: M.white, name: `crown-truss-${i}-${Math.round(run)}` });
    }
    run -= L;
  });
  // the window-cleaning crane on the solar roof, its boom along the tower toward the south-west, as the aerial shows it
  const ic = inner.reduce(([x, z], p) => [x + p[0] / inner.length, z + p[1] / inner.length], [0, 0]);
  const onAxis = (p, s) => [p[0] + U[0] * s, p[1] + U[1] * s];
  const base = Math.min(innerTop(...onAxis(ic, -2.5)), innerTop(...onAxis(ic, 2.5))) - 0.3, head = onAxis(ic, 3), jib = onAxis(ic, -20);
  // (kept under the screen's top, as nothing shows over the crown in the photographs)
  kit.box({ x: ic[0], z: ic[1], y: base, w: 3, h: 3.2, d: 5, yaw: Math.atan2(-U[0], U[1]), material: M.white, top: M.white, name: 'crane' });
  kit.beam({ from: [head[0], base + 3, head[1]], to: [jib[0], innerTop(...jib) + 1, jib[1]], w: 0.5, h: 0.7, material: M.white, name: 'crane-boom' });
  // solid to fly into up to the crown's top, in slices along the slope
  for (let k = 0; k < 6; k++) {
    const lo = uMin + ((uMax - uMin) * k) / 6, hi = uMin + ((uMax - uMin) * (k + 1)) / 6;
    const r = cut(cut(tower, U, lo), U, hi, true);
    if (r.length >= 3) kit.collisionPrism({ ring: r, y0: H.slab, y1: Math.min(...r.map((p) => top(...p))) });
  }
  // white vertical fins on the narrow ends toward the bay: the tower's, the full height of the tower, and the slab's,
  // up to its roof
  const fins = (a, b, [nx, nz], count, y1, label) => {
    for (let k = 1; k <= count; k++) {
      const [x, z] = lerp(a, b, k / (count + 1));
      kit.box({ x: x + nx * 0.4, z: z + nz * 0.4, y: H.plant, w: 0.3, h: y1(x, z) - H.plant, d: 0.8, yaw: Math.atan2(-nx, nz), material: M.white, top: M.white, name: `${label}-${k}` });
    }
  };
  const Nt = normalsOf(tower);
  const bayEnd = tower.findIndex((a, i) => Nt[i][0] * U[0] + Nt[i][1] * U[1] > 0.9);
  if (bayEnd < 0) throw new Error('Ocean Financial Centre: no bay end on the tower ring');
  fins(tower[bayEnd], tower[(bayEnd + 1) % tower.length], Nt[bayEnd], 4, (x, z) => top(x, z) - 0.6, 'bay-fin');
  const slabTip = indexOf(footprint, slabEnd), Nf = normalsOf(footprint), tipFrom = footprint[(slabTip - 1 + footprint.length) % footprint.length];
  fins(tipFrom, slabEnd, Nf[(slabTip - 1 + footprint.length) % footprint.length], 3, () => H.slab, 'slab-fin');

  // --- the signs: Keppel's on the crown toward the bay and toward Raffles Place ----------------------------------------
  // (ANZ's mark stood on the bay end until ANZ moved to Marina One on 19 October 2026.) Each hangs on a chord of the
  // crown's screen, pushed out past the face's bulge between its ends (the shorter way round the ring from one to the
  // other)
  const chord = (i, j) => {
    if ((j - i + screenOut.length) % screenOut.length > screenOut.length / 2) [i, j] = [j, i];
    const a = screenOut[i], b = screenOut[j], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L; // one side; turned outward below
    const c = tower.reduce(([x, z], p) => [x + p[0] / tower.length, z + p[1] / tower.length], [0, 0]);
    const s = (a[0] - c[0]) * nx + (a[1] - c[1]) * nz > 0 ? 1 : -1;
    let bulge = 0;
    for (let k = i; k !== j; k = (k + 1) % screenOut.length) bulge = Math.max(bulge, ((screenOut[k][0] - a[0]) * nx + (screenOut[k][1] - a[1]) * nz) * s);
    const out = [s * nx * bulge, s * nz * bulge], mid = lerp(a, b, 0.5);
    return { ring: [[a[0] + out[0], a[1] + out[1]], [b[0] + out[0], b[1] + out[1]], [mid[0] - s * nx * 8, mid[1] - s * nz * 8]], toward: (Math.atan2(s * nx * E[0] + s * nz * E[1], s * nx * N[0] + s * nz * N[1]) * 180) / Math.PI };
  };
  const ix = (e, nn, what) => indexOf(tower, near(tower, e, nn, what));
  const bowed = chord(ix(38.3, -5.5, 'the bowed face near the bay end'), ix(28.4, -17, 'the bowed face'));
  kit.hang({ ...bowed, top, below: 2.5, out: 0.4, margin: 3, logo: LOGOS.keppel, height: 4, name: 'sign:keppel-bay' });
  const plaza = chord(ix(24, 8, 'the plaza face'), ix(37, 8.7, 'the bay end'));
  kit.hang({ ...plaza, top, below: 2.5, out: 0.4, margin: 2, logo: LOGOS.keppel, height: 3.6, name: 'sign:keppel-raffles-place' });

  // --- the podium: shops under the car park, the green wall on its faces to Raffles Place and the plaza ---------------
  // (the shopfronts white-framed glass)
  kit.prism({ ring: kit.inset(podium, 1.5), y0: 0, y1: H.shops, material: M.lattice, top: M.paving, name: 'podium-shops' });
  kit.prism({ ring: podium, y0: H.shops, y1: H.podium, material: M.louvre, top: M.paving, name: 'podium' });
  kit.prism({ ring: strip, y0: H.podium, y1: H.podiumStrip, material: M.louvre, top: M.paving, name: 'podium-strip' });
  kit.collisionPrism({ ring: podium, y0: 0, y1: H.podium });
  kit.collisionPrism({ ring: strip, y0: H.podium, y1: H.podiumStrip });
  // the link over the way from the plaza to Collyer Quay, between the slab's end and the podium
  const podiumSW = near(podium, -24.9, 22.7, "the podium's south-west corner"), podiumSE = near(podium, 17.2, 9, "the podium's south-east corner");
  const linkRing = [slabEnd, near(outline, 6.8, 12.4, 'the link by the podium'), podiumSE, near(outline, 6.3, 4.3, 'the link by the tower')];
  kit.prism({ ring: linkRing, y0: H.link[0], y1: H.link[1], material: M.louvre, top: M.paving, name: 'link' });
  kit.collisionPrism({ ring: linkRing, y0: H.link[0], y1: H.link[1] });

  // --- the canopy: three glass facets folded down to a white column, as a cocktail glass on its stem --------------------
  // its corners as mapped (north over the podium's face to Raffles Place, south-west at the slab's corner, east over the
  // podium), its low point where the photographs and the aerial put the column: on the podium's west face carried on
  // 6.5 m past its corner, so the fold to the north corner runs along the top of the green wall
  const cN = near(canopyRing, -36.8, 41.5, "the canopy's north corner"), cSW = near(canopyRing, -41.6, -12.9, "the canopy's south-west corner");
  const cE = near(canopyRing, 21, 19.8, "the canopy's east corner");
  const podiumNW = near(podium, -39.9, 46.4, "the podium's north-west corner");
  const wd = [podiumSW[0] - podiumNW[0], podiumSW[1] - podiumNW[1]], wl = Math.hypot(...wd);
  const node = [podiumSW[0] + (wd[0] / wl) * 6.5, podiumSW[1] + (wd[1] / wl) * 6.5];
  const facets = [
    { tri: [node, cN, cSW], h: [H.canopyNode, H.canopyHigh, H.canopyLow], name: 'west' },
    { tri: [node, cSW, cE], h: [H.canopyNode, H.canopyLow, H.canopyLow], name: 'south' },
    { tri: [node, cE, cN], h: [H.canopyNode, H.canopyLow, H.canopyHigh], name: 'north' }
  ].map((f) => ({ ...f, plane: plane(f.tri, f.h) }));
  // the canopy's height over a point: the plane of the facet it lies in (or nearest to)
  const canopyAt = (x, z) => {
    let best = facets[0], w = -Infinity;
    for (const f of facets) { const k = within([x, z], f.tri); if (k > w) { w = k; best = f; } }
    return best.plane.a * x + best.plane.b * z + best.plane.c;
  };
  // each facet in strips along its level lines, flat underneath and sloped on top: a stepped soffit under a smooth roof,
  // the strips' coloured panes red, blue and yellow in turn, so the colours mix across the underside
  for (const [fi, f] of facets.entries()) {
    const { a, b, c } = f.plane, s = Math.hypot(a, b), g = [a / s, b / s];
    const levels = f.tri.map((p) => p[0] * g[0] + p[1] * g[1]), lo = Math.min(...levels), hi = Math.max(...levels);
    const w = Math.min(4, 0.7 / s), bands = Math.max(1, Math.ceil((hi - lo) / w));
    for (let k = 0; k < bands; k++) {
      const l0 = lo + ((hi - lo) * k) / bands, l1 = lo + ((hi - lo) * (k + 1)) / bands;
      const r = cut(cut(f.tri, g, l0), g, l1, true);
      if (r.length < 3) continue;
      const y0 = s * l0 + c - 0.35;
      kit.prism({ ring: r, y0, y1: (x, z) => a * x + b * z + c, material: M.panes[(k + fi) % 3], top: M.lattice, name: `canopy-${f.name}-${k}` });
      kit.collisionPrism({ ring: r, y0, y1: s * l1 + c });
    }
  }
  // dark steel edges round it, white ribs along the folds, the white column under the fold's foot
  const at = (p, dy = 0) => [p[0], canopyAt(...p) + dy, p[1]];
  for (const [p, q, label] of [[cN, cSW, 'west'], [cSW, cE, 'south-east'], [cE, cN, 'north']]) {
    kit.beam({ from: at(p, 0.1), to: at(q, 0.1), w: 0.8, h: 1.3, material: M.louvre, name: `canopy-edge-${label}` });
  }
  for (const [q, label] of [[cN, 'north'], [cSW, 'south-west'], [cE, 'east']]) {
    kit.beam({ from: at(node, -0.3), to: at(q, -0.3), w: 0.7, h: 1.4, material: M.white, name: `canopy-fold-${label}` });
  }
  kit.box({ x: node[0], z: node[1], y: 0, w: 3, h: H.canopyNode - 0.3, d: 3, yaw: Math.atan2(-U[0], U[1]), material: M.white, top: M.white, name: 'canopy-column' });
  // posts from the podium's roof to the canopy's north edge
  for (const k of [0.2, 0.45, 0.7]) {
    const [x, z] = lerp(cE, cN, k);
    kit.beam({ from: [x, H.podium, z], to: [x, canopyAt(x, z) - 0.3, z], w: 0.6, h: 0.6, material: M.white, name: `canopy-post-${k}` });
  }
  // the green wall: on the podium's faces to Raffles Place (north of its corner, up to the canopy's fold) and to the
  // plaza (up to the canopy, then along the way to Collyer Quay at the podium's height), 0.3 m proud of the car park,
  // in pieces 4 m long or less so that its top follows the canopy's folds
  const Np = normalsOf(podium);
  const greenWall = (p, q, i, topY, name) => {
    const [nx, nz] = Np[i], o = 0.3, d = 0.9, pieces = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 4);
    for (let k = 0; k < pieces; k++) {
      const a = lerp(p, q, k / pieces), b = lerp(p, q, (k + 1) / pieces);
      const r = [[a[0] + nx * o, a[1] + nz * o], [b[0] + nx * o, b[1] + nz * o], [b[0] - nx * (d - o), b[1] - nz * (d - o)], [a[0] - nx * (d - o), a[1] - nz * (d - o)]];
      // (its foot a hair over the car park's soffit, so their undersides do not meet)
      kit.prism({ ring: r, y0: H.shops + 0.05, y1: topY, material: M.garden, top: M.garden, name: `${name}-${k}` });
      kit.collisionPrism({ ring: r, y0: H.shops, y1: typeof topY === 'function' ? Math.min(...r.map((pt) => topY(...pt))) : topY });
    }
  };
  const iW = indexOf(podium, podiumNW), iS = indexOf(podium, podiumSW), iP = (iS + 1) % podium.length;
  if (podium[(iW + 1) % podium.length] !== podiumSW || podium[iP] !== podiumSE) throw new Error("Ocean Financial Centre: the podium's faces are not where they are mapped");
  const underCanopy = (x, z) => canopyAt(x, z) - 0.3;
  greenWall(cN, podiumSW, iW, underCanopy, 'green-wall-raffles-place');
  greenWall(podiumSW, near(outline, 6.8, 12.4, 'the link by the podium'), iS, underCanopy, 'green-wall-plaza');
  greenWall(podiumSE, podium[(iP + 1) % podium.length], iP, H.passageWall, 'green-wall-passage');

  // --- the ground: paved over the whole site, above the city's lawn --------------------------------------------------
  kit.prism({ ring: kit.inset(outline, 0.3), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'paving' });
}
