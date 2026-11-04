// js/landmark-models/18-robinson.js
// 18 Robinson, 18 Robinson Road (SG-061; Kohn Pedersen Fox with Architects 61, for Tuan Sing Holdings; completed 2018–19;
// called Robinson Tower while it was designed): OSM ways 424896147 (the site's outline), 1566724026 (the ground floor),
// 1566724028, 1566724025 and 1566724021 (the podium and its 30–35 and 35–40 m bands), 1566724022 (the core under the
// tower), 1566724023 and 1566724024 (its struts' feet) and 1566724027 (the office tower).
// The site is a V between Market Street (west) and Robinson Road (east), its point to the south where the two meet. A
// faceted retail podium fills it: glass shopfronts set back under it, glass along Market Street, the atrium's tall window
// at the tip. Its Robinson Road face is folded: an upright facet of pleated perforated metal, with the framed Telegraph
// Street bay in it, under a crease falling from the tip toward the bay, and over the crease pleats leaning back to a crest
// that climbs from the tip toward the tower. Behind the crest the roof garden climbs from the tip in terraces at 30, 35
// and 40 m, a stair up the crest's inner side. Over the top deck the office tower floats on its grey core and two raking
// struts, an open sky garden under its sloping soffit: twenty storeys of sky-blue glass with white fins, the south-west
// corner folded in at the foot and at the head, the north-west corner cut back toward the top, planted loggias at the
// north-east corner over the soffit, and the crown's pale glass screen round the café and sky garden under the glass
// roof, which slopes toward 163° from 180 m at the north-west corner to 165 m. Singlife's red banner hangs on the tip.
// Heights: 180 m to the top and 150.8 m to the highest occupied floor (KPF's program section; CTBUH: 180 m, 28 floors);
// the terraces (30, 35, 40.4 m), the soffit (about 52.5–56 m), the office floors (4.93 m) and the crown's slope (OSM
// roof:direction 163, roof:height 15) from KPF's sections and the OSM parts; the wing's crease and crest from KPF's east
// elevation; the facets and the loggias estimated from photographs (Tim Griffith for KPF, 2019; Mx. Granger, March 2024)
// and the Esri aerial. See docs/18-robinson.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: '18 Robinson', height: 180 };

const ID = { outline: 424896147, ground: 1566724026, podium: 1566724028, band30: 1566724025, band35: 1566724021, core: 1566724022, footS: 1566724023, footN: 1566724024, tower: 1566724027 };
// heights (m): the ground floor's top, the podium's canopy band, the three terraces, the soffit's keel at the core and
// its edge (the tower's foot), the top of the fold at the south-west corner, the loggias' floors and top, where the north-west
// chamfer and the south-west head fold begin (and where it ends), the café and sky garden's floor (the crown's screen
// from there up), the crown's top and its fall to the south-east
const H = { ground: 7.5, canopy: 8, lower: 30, middle: 35, deck: 40.4, keel: 52.5, soffit: 56, fold: 72, loggias: [62, 72], loggiaTop: 82, chamfer: 125, chamferFull: 176, head: 125, garden: 150.8, crown: 180, crownDrop: 15, paving: 0.32 };
// the facets (m): how far the south-west corner is drawn in along the west face at the foot and at the top; how far the
// north-west chamfer runs along the north and west faces at the top; the loggias' width along the east and north faces
const FOLD = 9, HEAD = 5, CHAMFER = { north: 4.1, west: 8.6 }, LOGGIA = { east: 6, north: 5 };
// the crown's roof falls toward 163° (OSM roof:direction), from its high north-west corner
const FALL = 163;
const STOREY = 4.93; // the office floors (KPF's program section: 57.2 to 150.8 m in 19)
const RIDGE = { x: 11.3, stair: 9.4 }; // the Robinson Road wing's west side and the stair's (grid x)
// the Robinson Road wing, read off KPF's east elevation ([z along the face, height] from the tip north): the crease
// between its upright and leaning facets (30.6 m to the tip's glazed corner at z 30.2, falling to 21.4 m at z -5.2, over
// the Telegraph Street bay) and its crest (34.5 m at the tip, 41.5 m by the stair's head, 43.5 m opposite the core, 41.5 m
// at the north end); the upright facet's folds (0.3 m deep, 1.2 m apart), the leaning pleats' width and their lean
// (metres back per metre up, alternately), the glazed corner's end
const WING = {
  crease: [[37, 30.6], [30.2, 30.6], [-5.2, 21.4], [-22, 21.4]], crest: [[37, 34.5], [12.8, 41.5], [-8, 43.5], [-22, 41.5]],
  fold: 0.3, pitch: 1.2, pleat: 2.4, lean: [0.07, 0.11], corner: 30.2
};
// colours from the photographs in daylight: blue-grey reflective glass with white fins (Tim Griffith's 2019 photographs
// sample #576f89–#60768c, fins included); the podium's grey perforated metal with glass slots (#768996), teal-grey glass
// in silver mullions at the tip, along Market Street and in the Telegraph Street bay (#4d7b80 in the 2024 photograph);
// light grey stone and metal for the core, soffit and struts; a grey-green glass roof (the aerial); Singlife's red; the
// crown's screen pale, the sky and the structure seen through it
const C = {
  fin: 0xdfe4e7, glass: 0x6b91bd, facet: 0x8aa9c9, facetDark: 0x3a4e62, screen: 0xa3bbd0, mesh: 0x9aa2a8, meshGlass: 0x5f7080, mullion: 0x7d868d, darkGlass: 0x4f6c78,
  atrium: 0x5b7e86, roofGlass: 0x6d7a72, trim: 0xd6dadb, paving: 0xcac6be, green: 0x6d8f4a,
  leaf: 0x4f7f3a, red: 0xc0303a, sign: 0xffffff
};

// --- plan helpers (points [x, z] about the anchor) -----------------------------------------------------------------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unit = (a) => { const L = Math.hypot(a[0], a[1]) || 1; return [a[0] / L, a[1] / L]; };
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const centroid = (r) => r.reduce(([x, z], p) => [x + p[0] / r.length, z + p[1] / r.length], [0, 0]);
// a piecewise-linear profile [[z, value], ...] (z falling) as a function of z, level beyond its ends
const profile = (pts) => (z) => {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
    if (z >= zb) return ya + (yb - ya) * clamp01((za - z) / (za - zb));
  }
  return pts[pts.length - 1][1];
};
// The part of a polygon of points [x, y, z] at or above the height h
function clipAbove(poly, h) {
  const out = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    if (p[1] >= h) out.push(p);
    if ((p[1] >= h) !== (q[1] >= h)) { const t = (h - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, h, p[2] + (q[2] - p[2]) * t]); }
  });
  return out;
}
// The part of a ring where p·d is at least t: one side of a straight cut
function cut(ring, d, t) {
  const s = (p) => dot(p, d) - t, out = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], sa = s(a), sb = s(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) out.push(lerp(a, b, sa / (sa - sb)));
  });
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05; });
}
// ... the side of the line through a and b that holds the point `keep`
function side(ring, a, b, keep) {
  const d = unit(sub(b, a)), n = [-d[1], d[0]], t = dot(a, n);
  return dot(keep, n) >= t ? cut(ring, n, t) : cut(ring, mul(n, -1), -t);
}
function inside([x, z], r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
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

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`18 Robinson needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    // the fins a bay apart, no floor lines (a storey taller than the tower: the kit's strips draw one at each storey's
    // foot), as the photographs show the white fins and the glass, not the slabs
    tower: kit.facadeMaterial({ wall: C.glass, window: C.fin, floorHeight: STOREY, bayWidth: 1.5, windowWidth: 0.26, windowHeight: 0.66, pattern: 'punched', roughness: 0.32 }),
    // the folds' facets: the same fins over glass that reflects otherwise — the street at the foot, the sky at the head
    facetDark: kit.facadeMaterial({ wall: C.facetDark, window: C.fin, floorHeight: STOREY, bayWidth: 1.5, windowWidth: 0.26, windowHeight: 0.66, pattern: 'punched', roughness: 0.32 }),
    facet: kit.facadeMaterial({ wall: C.facet, window: C.fin, floorHeight: STOREY, bayWidth: 1.5, windowWidth: 0.26, windowHeight: 0.66, pattern: 'punched', roughness: 0.32 }),
    // the crown's screen: the fins carried on unbroken over pale glass, a transom every two storeys
    screen: kit.facadeMaterial({ wall: C.fin, window: C.screen, floorHeight: 2 * STOREY, bayWidth: 1.5, windowWidth: 0.78, pattern: 'strips', roughness: 0.35 }),
    mesh: kit.facadeMaterial({ wall: C.mesh, window: C.meshGlass, floorHeight: 5.5, bayWidth: 2.4, windowWidth: 0.3, pattern: 'strips', roughness: 0.6 }),
    west: kit.facadeMaterial({ wall: C.mullion, window: C.darkGlass, floorHeight: 5.5, bayWidth: 1.6, windowWidth: 0.88, pattern: 'strips', roughness: 0.5 }),
    // the rooftop garden's glass roof: grey-green panes (the garden under them) in thin white frames, as the aerial shows
    roofGlass: kit.facadeMaterial({ wall: C.fin, window: C.roofGlass, floorHeight: 6, bayWidth: 6, windowWidth: 0.95, pattern: 'strips', roughness: 0.4 }),
    atrium: kit.glassMaterial(C.atrium), trim: kit.material(C.trim, { roughness: 0.45, metalness: 0.3 }),
    paving: kit.material(C.paving), green: kit.material(C.green), leaf: kit.material(C.leaf), red: kit.material(C.red, { roughness: 0.7 })
  };
  const compass = (deg) => kit.compass(deg);
  // a podium wall's finish by the way it faces: glass in silver mullions at the tip (south-south-west, the atrium's
  // window) and along Market Street (west), grey metal and glass slots elsewhere; `riser` edges (between terraces) glazed
  const finish = (r, riser = () => false) => {
    const N = normalsOf(r), tip = compass(195), west = compass(271);
    return (i) => (riser(r[i], r[(i + 1) % r.length]) ? M.atrium : dot(N[i], tip) > 0.9 || dot(N[i], west) > 0.8 ? M.west : null);
  };
  const onLine = (a, b) => (p, q) => [p, q].every((s) => Math.abs((s[0] - a[0]) * (b[1] - a[1]) - (s[1] - a[1]) * (b[0] - a[0])) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) < 0.05);

  const outline = ring(ID.outline), ground = ring(ID.ground), podium = ring(ID.podium);
  const band30 = ring(ID.band30), band35 = ring(ID.band35), core = ring(ID.core), tower = ring(ID.tower);
  // the terraces' edges: the 30–35 m band's south edge (r0 on the west face, r1, r2 on Robinson Road), the 35–40 m band's
  // (s0, s1, s2), found as the band rings' points off the podium's outline
  const offOutline = (r) => r.filter(([x, z]) => !podium.some((p) => Math.hypot(p[0] - x, p[1] - z) < 0.3));
  const r30 = offOutline(band30), r35 = offOutline(band35);
  if (r30.length !== 3 || r35.length !== 3) throw new Error('18 Robinson: the terraces are not where they are mapped');
  const byX = (a, b) => a[0] - b[0];
  const [r0, r1, r2] = [...r30].sort(byX), [s0, s1, s2] = [...r35].sort(byX);
  const tipPoint = centroid(podium.filter(([, z]) => z > 30)); // a point in the tip
  const northPoint = [0, -15];

  // --- the ground floor, its paving and the podium ----------------------------------------------------------------------
  kit.prism({ ring: outline, y0: 0, y1: H.paving, material: M.paving, top: M.paving, name: 'podium-paving' });
  kit.prism({ ring: ground, y0: H.paving, y1: H.ground, material: M.atrium, top: M.paving, name: 'podium-ground' });
  kit.collisionPrism({ ring: ground, y0: 0, y1: H.ground });
  // the podium over the shopfronts: a silver band at its foot, then five storeys of retail to the lower terrace; west of
  // the wing's line (x 11.3) the main body and the two bands over it, their south edges the glazed risers between the
  // terraces; east of it the folded Robinson Road wing (below)
  kit.prism({ ring: podium, y0: H.ground, y1: H.canopy, material: M.trim, top: M.trim, name: 'podium-canopy' });
  kit.collisionPrism({ ring: podium, y0: H.ground, y1: H.lower });
  const westOf = (r) => cut(r, [-1, 0], -RIDGE.x);
  const bodyW = westOf(podium), band30W = westOf(band30), band35W = westOf(band35);
  kit.prism({ ring: bodyW, y0: H.canopy, y1: H.lower, material: M.mesh, edgeMaterial: finish(bodyW), top: M.paving, name: 'podium-body' });
  kit.prism({ ring: band30W, y0: H.lower, y1: H.middle, material: M.mesh, edgeMaterial: finish(band30W, onLine(r0, r1)), top: M.paving, name: 'podium-band-30' });
  kit.collisionPrism({ ring: band30W, y0: H.lower, y1: H.middle });
  kit.prism({ ring: band35W, y0: H.middle, y1: H.deck, material: M.mesh, edgeMaterial: finish(band35W, (p, q) => onLine(s0, s1)(p, q) || onLine(s1, s2)(p, q)), top: M.paving, name: 'podium-band-35' });
  kit.collisionPrism({ ring: band35W, y0: H.middle, y1: H.deck });

  // --- the Robinson Road wing: the podium east of x 11.3, its face folded as KPF's east elevation draws it ----------------
  // an upright facet, the perforated metal folded in plan, up to the crease; over it pleats leaning back, alternately more
  // and less, to the crest; the corner at the tip glazed to the crest; the Telegraph Street bay (below) in the upright facet
  const crease = profile(WING.crease), crest = profile(WING.crest);
  const wing = cut(podium, [1, 0], RIDGE.x);
  const wingN = normalsOf(wing);
  const eastI = wingN.findIndex((n) => dot(n, compass(122)) > 0.95);
  const innerI = wing.findIndex((p, i) => Math.abs(p[0] - RIDGE.x) < 0.01 && Math.abs(wing[(i + 1) % wing.length][0] - RIDGE.x) < 0.01);
  if (eastI < 0 || innerI < 0) throw new Error('18 Robinson: the Robinson Road face is not where it is mapped');
  const eA = wing[eastI], eB = wing[(eastI + 1) % wing.length];
  const eastX = (z) => eA[0] + (eB[0] - eA[0]) * ((z - eA[1]) / (eB[1] - eA[1])); // the face line's x at z
  const zNorth = Math.min(eA[1], eB[1]);
  // the face's corners: straight from the tip to the glazed corner's end, then folded, a fold every pitch; and on the
  // inner side corners where the crease bends, so that the wing's top follows it
  const folds = [];
  for (let z = WING.corner, j = 0; z > zNorth + 0.6; z -= WING.pitch, j++) folds.push([eastX(z) - (j % 2 ? WING.fold : 0), z]);
  const innerBends = [WING.crease[1][0], WING.crease[2][0]].map((z) => [RIDGE.x, z]);
  const falls = (i) => wing[i][1] > wing[(i + 1) % wing.length][1];
  const inOrder = (i, pts) => [...pts].sort((a, b) => (falls(i) ? b[1] - a[1] : a[1] - b[1]));
  const wingA = [];
  wing.forEach((p, i) => {
    wingA.push(p);
    if (i === eastI) wingA.push(...inOrder(i, folds));
    if (i === innerI) wingA.push(...inOrder(i, innerBends));
  });
  const wingFinish = finish(wingA);
  const glazedCorner = (p, q) => Math.min(p[1], q[1]) >= WING.corner - 0.01 && [p, q].every((r) => Math.abs(r[0] - eastX(r[1])) < 0.02);
  kit.prism({ ring: wingA, y0: H.canopy, y1: (x, z) => crease(z), material: M.mesh, edgeMaterial: (i) => (glazedCorner(wingA[i], wingA[(i + 1) % wingA.length]) ? M.west : wingFinish(i)), top: M.trim, name: 'podium-wing' });
  // the leaning pleats: each from just behind the upright facet's inner folds, its foot at the crease (the rest inside
  // the upright facet), its outer face drawn back to the crest by its lean; the inner side upright over the terraces and
  // the stair; their silver tops the crest
  const back = WING.fold + 0.03;
  const pullIn = (p, q) => { const d = unit(sub(q, p)); return add(p, mul(d, back / Math.max(0.2, Math.abs(d[0])))); };
  const wingIn = wing.map((p, i) => {
    if (i === eastI) return pullIn(p, wing[(i + wing.length - 1) % wing.length]);
    if (i === (eastI + 1) % wing.length) return pullIn(p, wing[(i + 1) % wing.length]);
    return p;
  });
  const zTop = Math.max(...wing.map((p) => p[1]));
  for (let za = zTop + 0.05, k = 0; za > zNorth + 0.3; za -= WING.pleat, k++) {
    const zb = Math.max(zNorth - 0.05, za - WING.pleat);
    const r = cut(cut(wingIn, [0, 1], zb), [0, -1], -za);
    if (r.length < 3) continue;
    const y0 = Math.min(crease(Math.min(za, zTop)), crease(zb)) - 0.05;
    const rise = crest((za + zb) / 2) - y0, outerX = Math.max(...r.map((p) => p[0]));
    const d = Math.min(outerX - RIDGE.x - 0.6, Math.max(0.3, WING.lean[k % 2] * rise));
    const outer = (p) => p[0] > outerX - 0.45;
    const tr = r.map((p) => (outer(p) ? [p[0] - d, p[1]] : p));
    const N = normalsOf(r);
    const glazed = Math.min(za, zTop) > WING.corner + 0.5;
    const pleat = kit.loft({ ring: r, topRing: tr, y0, y1: (x, z) => crest(z), material: M.mesh,
      edgeMaterial: (i) => (dot(N[i], compass(195)) > 0.9 || (glazed && dot(N[i], compass(122)) > 0.9) ? M.west : null), top: M.trim, name: `podium-ridge-${k}` });
    pleat.topRing = tr; // (for the tests: its top's plan, which a sloping top leaves out of the record)
    const low = Math.min(...r.map(([, z]) => crest(z)));
    if (low > Math.max(y0, H.lower) + 0.5) kit.collisionPrism({ ring: r, y0: Math.max(y0, H.lower), y1: low });
  }
  // the tip's frame: white posts up its two corners
  const tipFace = (() => {
    const N = normalsOf(podium), d = compass(195);
    const i = N.findIndex((n) => dot(n, d) > 0.9);
    return { a: podium[i], b: podium[(i + 1) % podium.length], n: N[i] };
  })();
  for (const [k, p] of [tipFace.a, tipFace.b].entries()) {
    const q = add(p, mul(tipFace.n, 0.35));
    kit.beam({ from: [q[0], H.canopy, q[1]], to: [q[0], p[0] > RIDGE.x ? crease(p[1]) : H.lower, q[1]], w: 0.7, h: 0.7, material: M.trim, name: `podium-tip-post-${k}` });
  }

  // --- the stair up the wing's inner side, from the lower terrace to the deck -------------------------------------------
  const deckZ = s2[1];
  const southOf = (r, a, b) => side(r, a, b, tipPoint), northOf = (r, a, b) => side(r, a, b, northPoint);
  // the stair: from the lower terrace up the wing's inner side to the deck, a white stringer and handrail on its open side
  const stairBottom = 31, stairTop = (x, z) => H.lower + (H.deck - H.lower) * clamp01((stairBottom - z) / (stairBottom - deckZ));
  const stairStrip = cut(cut(podium, [1, 0], RIDGE.stair), [-1, 0], -RIDGE.x);
  const stairTip = cut(southOf(stairStrip, r0, r1), [0, -1], -stairBottom), stairMiddle = southOf(northOf(stairStrip, r0, r1), s1, s2);
  kit.prism({ ring: stairTip, y0: H.lower, y1: (x, z) => Math.max(H.lower + 0.05, stairTop(x, z)), material: M.trim, top: M.paving, name: 'podium-stair-tip' });
  kit.prism({ ring: stairMiddle, y0: H.middle, y1: stairTop, material: M.trim, top: M.paving, name: 'podium-stair-middle' });
  kit.collisionPrism({ ring: stairMiddle, y0: H.middle, y1: H.middle + 0.5 });
  const railX = RIDGE.stair + 0.12;
  const railAt = (z) => [railX, stairTop(railX, z) + 1.05, z];
  kit.beam({ from: railAt(stairBottom - 0.3), to: railAt(deckZ + 0.4), w: 0.12, h: 0.12, material: M.trim, name: 'podium-stair-rail' });

  // --- terraces: planting, trees, glass balustrades, the glazed pavilion ----------------------------------------------
  // A tree: a short trunk under a crown that widens then closes (a planter under it on a terrace)
  function tree(x, z, y, h, r, name, { planter = true } = {}) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    let base = y;
    if (planter) { kit.cylinder({ x, z, y0: y, y1: y + 0.5, r: Math.max(0.9, r * 0.7), segments: 6, material: M.green, top: M.green, name: `${name}-planter` }); base = y + 0.5; }
    kit.cylinder({ x, z, y0: base, y1: base + h * 0.42, r: Math.max(0.16, r * 0.1), segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: base + h * 0.36, y1: base + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: base + h * 0.64, y1: base + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
  // A glass balustrade along the edge a→b, `inset` m inside it (toward `toward`), 1.1 m tall, its ends kept short
  function balustrade(a, b, y, toward, name, inset = 0.25) {
    const d = unit(sub(b, a)), L = Math.hypot(b[0] - a[0], b[1] - a[1]) - 0.5;
    if (L < 0.5) return;
    let n = [-d[1], d[0]];
    if (dot(sub(toward, a), n) < 0) n = mul(n, -1);
    const c = add(lerp(a, b, 0.5), mul(n, inset));
    kit.box({ x: c[0], z: c[1], y, w: L, h: 1.1, d: 0.1, yaw: Math.atan2(d[1], d[0]), material: M.atrium, top: M.trim, name });
  }
  // the lower terrace at the tip: trees in round planters, a planted bed along Market Street, glass round its edges
  for (const [k, [x, z]] of [[0.3, 29.5], [5.8, 27.2], [6.6, 32.8], [4.2, 35.6]].entries()) tree(x, z, H.lower, 6.5, 1.7, `lower-${k}`);
  const westEdge = (() => { const N = normalsOf(podium), w = compass(271); const i = N.findIndex((n) => dot(n, w) > 0.8); return [podium[i], podium[(i + 1) % podium.length]]; })();
  const westAt = (z) => { const [a, b] = westEdge; return lerp(a, b, (z - a[1]) / (b[1] - a[1])); };
  balustrade(westAt(r0[1] + 0.3), tipFace.b[1] > tipFace.a[1] ? tipFace.b : tipFace.a, H.lower, tipPoint, 'lower-balustrade-west');
  balustrade(tipFace.a, lerp(tipFace.a, tipFace.b, 0.45), H.lower, tipPoint, 'lower-balustrade-tip');
  // the middle terrace: trees, and the glazed pavilion with its pointed roof by the stair
  for (const [k, [x, z]] of [[-3.5, 20.5], [4.5, 21.5], [0.2, 17.9]].entries()) tree(x, z, H.middle, 5.6 + 0.4 * k, 1.7, `middle-${k}`);
  balustrade(westAt(s0[1] + 0.3), westAt(r0[1] - 0.3), H.middle, [0, 20], 'middle-balustrade-west');
  const pav = [[3.6, 14.6], [8.4, 14.6], [8.4, 18.2], [3.6, 18.2]];
  kit.prism({ ring: pav, y0: H.middle, y1: H.middle + 3.2, material: M.atrium, top: M.trim, name: 'middle-pavilion' });
  kit.loft({ ring: pav, topRing: [[3.6, 16.4], [8.4, 16.4], [8.4, 16.4], [3.6, 16.4]], y0: H.middle + 3.2, y1: H.middle + 4.6, material: M.atrium, top: M.trim, name: 'middle-pavilion-roof' });
  kit.collisionPrism({ ring: pav, y0: H.middle, y1: H.middle + 3.2 });
  // the top deck: trees round the core under the tower, palms along the wing's crest, glass along its edge
  for (const [k, [x, z]] of [[6.8, 10.3], [10, -19], [-10, -12], [-15, -8], [2, -16]].entries()) tree(x, z, H.deck, 6.4, 1.8, `deck-${k}`);
  for (const [k, [x, z]] of [[9.5, -1.5], [9.5, -11.5], [9.5, -15.3]].entries()) tree(x, z, H.deck, 7.5, 1.6, `deck-palm-${k}`, { planter: false });
  balustrade(lerp(s0, s1, 0.04), s1, H.deck, northPoint, 'deck-balustrade-0');
  balustrade(s1, [RIDGE.stair - 0.2, s1[1] + (s2[1] - s1[1]) * ((RIDGE.stair - 0.2 - s1[0]) / (s2[0] - s1[0]))], H.deck, northPoint, 'deck-balustrade-1');

  // --- the core, the struts and the soffit ------------------------------------------------------------------------------
  const C0 = centroid(core);
  kit.prism({ ring: core, y0: H.deck, y1: H.soffit - 0.5, material: M.paving, top: M.paving, name: 'core' });
  // the vertical gardens on its south and east faces, under the soffit
  for (const [label, deg] of [['south', 196], ['east', 113]]) {
    const w = kit.wallToward(core, deg), L = w.length - 2;
    kit.box({ x: w.x + w.nx * 0.2, z: w.z + w.nz * 0.2, y: H.deck + 5, w: L, h: H.keel - 0.4 - (H.deck + 5), d: 0.3, yaw: Math.atan2(-w.nx, w.nz), material: M.leaf, top: M.leaf, name: `core-garden-${label}` });
  }
  kit.collisionPrism({ ring: core, y0: H.deck, y1: H.soffit });
  // the struts: from their mapped feet on the deck, raking outward (the south one toward Robinson Road and the tip, the
  // north one toward Far East Financial) up into the tower
  for (const [label, id, lean] of [['south', ID.footS, [3, 1.5]], ['north', ID.footN, [-0.5, -7]]]) {
    const f = centroid(ring(id)), t = add(f, lean), top = H.soffit + 1;
    kit.beam({ from: [f[0], H.deck - 0.2, f[1]], to: [t[0], top, t[1]], w: 2.2, h: 2.2, material: M.trim, name: `strut-${label}` });
    for (let k = 0; k < 3; k++) {
      const y0 = H.deck + (k * (H.soffit - H.deck)) / 3, y1 = H.deck + ((k + 1) * (H.soffit - H.deck)) / 3;
      const c = lerp(f, t, ((y0 + y1) / 2 - H.deck) / (top - H.deck));
      kit.collisionPrism({ ring: [[c[0] - 1.1, c[1] - 1.1], [c[0] + 1.1, c[1] - 1.1], [c[0] + 1.1, c[1] + 1.1], [c[0] - 1.1, c[1] + 1.1]], y0, y1 });
    }
  }

  // --- the tower ------------------------------------------------------------------------------------------------------------
  // its mapped plan: the west face on Market Street (P0–P1), the south face (P1–P2), the Robinson Road face (P2–P3), the
  // east face (P4–P5), the north face (P5–P6) and a short chamfer at the north-west corner (P6–P0)
  if (tower.length !== 7) throw new Error('18 Robinson: the tower is not mapped as expected');
  const [P0, P1, P2, P3, P4, P5, P6] = tower;
  const alongWest = unit(sub(P1, P0)), alongNorth = unit(sub(P5, P6));
  // the crown's roof: down toward 163°, from 180 m at the north-west corner to 165 m at the south-east
  const fall = compass(FALL);
  const tHigh = Math.min(...tower.map((p) => dot(p, fall))), tLow = Math.max(...tower.map((p) => dot(p, fall)));
  const roof = (x, z) => H.crown - H.crownDrop * clamp01((dot([x, z], fall) - tHigh) / (tLow - tHigh));
  const headTop = roof(...P1);
  // the plan at a height: the south-west corner drawn in along the west face below the fold and toward the top, the
  // north-west chamfer widening from 100 m; with the loggias' notch at the north-east corner
  const planAt = (y, { notch = false } = {}) => {
    const g = clamp01((y - H.chamfer) / (H.chamferFull - H.chamfer));
    const foot = y < H.fold ? FOLD * (1 - clamp01((y - H.soffit) / (H.fold - H.soffit))) : 0;
    const head = HEAD * clamp01((y - H.head) / (headTop - H.head));
    const p0 = add(P0, mul(alongWest, CHAMFER.west * g)), p6 = add(P6, mul(alongNorth, CHAMFER.north * g));
    const p1 = sub(P1, mul(alongWest, foot + head));
    const corner = notch ? [add(P5, mul(unit(sub(P4, P5)), LOGGIA.east)), add(add(P5, mul(unit(sub(P4, P5)), LOGGIA.east)), mul(unit(sub(P6, P5)), LOGGIA.north)), add(P5, mul(unit(sub(P6, P5)), LOGGIA.north))] : [P5];
    return [p0, p1, P2, P3, P4, ...corner, p6];
  };
  const reversed = (r) => [...r].reverse();
  // the foot: the soffit, a funnel of grey from the tower's edge down to the core it rests on
  const foot = planAt(H.soffit);
  kit.loft({ ring: foot.map((p) => lerp(p, C0, 0.8)), topRing: foot, y0: H.keel, y1: H.soffit, material: M.trim, top: M.trim, name: 'soffit' });
  kit.collisionPrism({ ring: foot.map((p) => lerp(p, C0, 0.35)), y0: H.keel + 0.45 * (H.soffit - H.keel), y1: H.soffit });
  kit.collisionPrism({ ring: foot, y0: H.soffit - 0.7, y1: H.soffit });
  // the shaft in bands: the fold at the south-west corner (its facet a loft; the ring run backwards, so that each wall's
  // diagonal follows the fold's crease), the loggias' notch over it, straight offices, the north-west chamfer widening,
  // then the head fold and the crown
  const [l0, l1] = H.loggias;
  kit.loft({ ring: reversed(planAt(H.soffit)), topRing: reversed(planAt(l0)), y0: H.soffit, y1: l0, material: M.tower, top: M.green, name: 'tower-fold-0' });
  const notched = (y) => reversed(planAt(y, { notch: true }));
  // (the reversed notched ring runs P6, n3, n2, n1, P4 …: its walls 1 and 2 are the loggias' inner walls, dark glass)
  kit.loft({ ring: notched(l0), topRing: notched(H.fold), y0: l0, y1: H.fold, material: M.tower, edgeMaterial: (i) => (i === 1 || i === 2 ? M.west : null), top: M.paving, name: 'tower-fold-1' });
  // (the forward notched ring's walls 5 and 6 are the loggias' inner walls)
  kit.prism({ ring: planAt(H.fold, { notch: true }), y0: H.fold, y1: H.loggiaTop, material: M.tower, edgeMaterial: (i) => (i === 5 || i === 6 ? M.west : null), top: M.paving, name: 'tower-loggias' });
  kit.prism({ ring: planAt(H.loggiaTop), y0: H.loggiaTop, y1: H.chamfer, material: M.tower, top: M.paving, name: 'tower-shaft' });
  // (the forward ring's wall 6, from P6 to P0, is the north-west chamfer, catching the sky as the head fold does)
  const chamferGlass = (i) => (i === 6 ? M.facet : null);
  // the head: one loft from where the folds begin to the sloping glass roof over the rooftop garden, its plan at the top
  // taken where the roof meets each corner; its south wall's diagonal runs from the south-west corner at 125 m to the
  // south-east corner at the roof, so the wall folds along it exactly as the real head does (the facet over the crease
  // leaning in, the triangle under it upright)
  const crownTop = planAt(H.head).map((p, i) => planAt(roof(...p))[i]);
  const head = kit.loft({ ring: planAt(H.head), topRing: crownTop, y0: H.head, y1: roof, material: M.tower, edgeMaterial: chamferGlass, top: M.roofGlass, name: 'tower-head' });
  head.topRing = crownTop; // (for the tests: the plan at its top, which a sloping top leaves out of the record)
  // the roof's white frame round its edge, on the walls' tops
  crownTop.forEach((a, i) => {
    const b = crownTop[(i + 1) % crownTop.length], d = unit(sub(b, a)), inward = mul([-d[1], d[0]], dot([-d[1], d[0]], sub(centroid(crownTop), a)) > 0 ? 0.45 : -0.45);
    const p = add(a, inward), q = add(b, inward);
    kit.beam({ from: [p[0], roof(...p) + 0.15, p[1]], to: [q[0], roof(...q) + 0.15, q[1]], w: 0.9, h: 0.6, material: M.trim, name: `roof-rim-${i}` });
  });
  // the crown: the glass screen round the café and sky garden, from the top office floor (150.8 m) to the roof, the fins
  // over pale glass with the sky and the structure seen through it, lighter than the offices: a thin skin 4 cm proud of
  // the head's walls above that floor — one panel on each upright, flat wall; on the two that fold (the south face over
  // the head fold, the north-west chamfer) one on each of the wall's triangles, as the kit draws a wall (base, next base,
  // next top; base, next top, top), so that it follows them exactly
  const headBase = planAt(H.head), headMid = centroid(headBase), screenFoot = planAt(H.garden);
  const skinOn = (b0, b1, t0, t1, h, name) => {
    const o = mul(h, 0.04), inward = mul(h, -0.3);
    kit.loft({ ring: [add(b0, o), add(b1, o), add(b1, inward), add(b0, inward)], topRing: [add(t0, o), add(t1, o), add(t1, inward), add(t0, inward)], y0: H.garden, y1: (x, z) => roof(x, z) - 0.06, material: M.screen, top: M.screen, name });
  };
  headBase.forEach((a, w) => {
    const b = headBase[(w + 1) % headBase.length], ta = crownTop[w], tb = crownTop[(w + 1) % headBase.length];
    const A0 = [a[0], H.head, a[1]], B0 = [b[0], H.head, b[1]], A1 = [ta[0], roof(...ta), ta[1]], B1 = [tb[0], roof(...tb), tb[1]];
    // an upright flat wall: all four corners on the base's line in plan
    const along = unit(sub(b, a)), off = (p) => Math.abs((p[0] - a[0]) * along[1] - (p[1] - a[1]) * along[0]);
    if (off(ta) < 0.02 && off(tb) < 0.02) {
      let h = [along[1], -along[0]];
      if (dot(h, sub(lerp(a, b, 0.5), headMid)) < 0) h = mul(h, -1);
      skinOn(screenFoot[w], screenFoot[(w + 1) % headBase.length], ta, tb, h, `crown-screen-${w}`);
      return;
    }
    [[A0, B0, B1], [A0, B1, A1]].forEach((tri, t) => {
      const poly = clipAbove(tri, H.garden), n = poly.length;
      const base = poly.map((p, j) => j).filter((j) => Math.abs(poly[j][1] - H.garden) < 1e-6);
      if (n < 3 || base.length !== 2) return;
      let [j0, j1] = base;
      if ((j0 + 1) % n !== j1) [j0, j1] = [j1, j0];
      const tops = [];
      for (let j = (j1 + 1) % n; j !== j0; j = (j + 1) % n) tops.push(poly[j]);
      if (!tops.length) return;
      const u = [tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]], v = [tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]];
      const nh = [u[1] * v[2] - u[2] * v[1], u[0] * v[1] - u[1] * v[0]];
      if (Math.hypot(...nh) < 1e-6) return;
      let h = unit(nh);
      if (dot(h, sub([(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][2] + tri[1][2] + tri[2][2]) / 3], headMid)) < 0) h = mul(h, -1);
      const flat = (p) => [p[0], p[2]];
      skinOn(flat(poly[j0]), flat(poly[j1]), flat(tops[tops.length - 1]), flat(tops[0]), h, `crown-screen-${w}-${t}`);
    });
  });
  // the foot fold's facet: a thin skin on its exact plane (through the south-east corner and the drawn-in south-west
  // corner at the soffit, and the full corner at the fold's top), 4 cm proud of the shaft's walls, whose diagonals run
  // just inside it; dark glass, reflecting the street, as in the photographs
  const facet = (base, apex, y0, y1, material, name) => {
    const [a, b] = base;
    const u = [b[0] - a[0], 0, b[1] - a[1]], v = [apex[0] - a[0], y1 - y0, apex[1] - a[1]];
    let h = unit([u[1] * v[2] - u[2] * v[1], u[0] * v[1] - u[1] * v[0]]);
    if (dot(h, sub(lerp(a, b, 0.5), centroid(tower))) < 0) h = mul(h, -1);
    const o = mul(h, 0.04), i = mul(h, -0.5);
    return kit.loft({ ring: [add(a, o), add(b, o), add(b, i), add(a, i)], topRing: [add(apex, o), add(apex, o), add(apex, i), add(apex, i)], y0, y1, material, top: material, name });
  };
  facet([P2, sub(P1, mul(alongWest, FOLD))], P1, H.soffit, H.fold - 0.05, M.facetDark, 'facet-foot');
  // collision: the foot drawn in, the loggias open, the shaft to the crown's low side, then strips up the roof's slope
  kit.collisionPrism({ ring: planAt(H.soffit), y0: H.soffit, y1: l0 });
  kit.collisionPrism({ ring: planAt(l0, { notch: true }), y0: l0, y1: H.loggiaTop });
  kit.collisionPrism({ ring: tower, y0: H.loggiaTop, y1: H.chamfer });
  // (over the chamfer's start, each band within the plan at its top, as the chamfer and the head fold draw it in)
  const low = H.crown - H.crownDrop, mid = (H.chamfer + low) / 2;
  kit.collisionPrism({ ring: planAt(mid), y0: H.chamfer, y1: mid });
  kit.collisionPrism({ ring: planAt(low), y0: mid, y1: low });
  const ts = crownTop.map((p) => dot(p, fall)), t0 = Math.min(...ts), span = Math.max(...ts) - t0;
  for (let k = 0; k < 3; k++) {
    const piece = cut(cut(crownTop, fall, t0 + (span * k) / 4), mul(fall, -1), -(t0 + (span * (k + 1)) / 4));
    const top = Math.min(...piece.map(([x, z]) => roof(x, z)));
    if (piece.length >= 3 && top > low + 0.5) kit.collisionPrism({ ring: piece, y0: low, y1: top });
  }
  // the roof: a slot along the west side where the window-cleaning crane parks, its white arm in it
  const slotC = [-5, 2], half = 7.8, wide = 1.8; // read off the aerial
  const across = [alongWest[1], -alongWest[0]];
  const slot = [add(add(slotC, mul(alongWest, -half)), mul(across, -wide)), add(add(slotC, mul(alongWest, half)), mul(across, -wide)), add(add(slotC, mul(alongWest, half)), mul(across, wide)), add(add(slotC, mul(alongWest, -half)), mul(across, wide))];
  kit.prism({ ring: slot, y0: Math.min(...slot.map(([x, z]) => roof(x, z))) - 0.6, y1: (x, z) => roof(x, z) + 0.12, material: M.west, top: M.west, name: 'roof-slot' });
  const arm = (t) => { const p = add(slotC, mul(alongWest, t)); return [p[0], roof(...p) + 0.47, p[1]]; };
  kit.beam({ from: arm(-half + 1), to: arm(half - 2.5), w: 0.7, h: 0.7, material: M.trim, name: 'roof-crane' });

  // --- the loggias at the north-east corner ------------------------------------------------------------------------------
  const n1 = add(P5, mul(unit(sub(P4, P5)), LOGGIA.east)), n3 = add(P5, mul(unit(sub(P6, P5)), LOGGIA.north)), n2 = add(n1, sub(n3, P5));
  const pocket = [P5, n1, n2, n3];
  kit.prism({ ring: kit.inset(pocket, 0.03), y0: l1 - 0.45, y1: l1, material: M.paving, top: M.green, name: 'loggia-slab' });
  for (const [k, y] of [l0, l1].entries()) {
    const c = lerp(lerp(P5, n2, 0.55), n1, 0.15);
    tree(c[0], c[1], y, 4.2, 1.3, `loggia-${k}`, { planter: false });
    balustrade(lerp(P5, n1, 0.06), lerp(P5, n1, 0.94), y, n2, `loggia-${k}-balustrade-east`, 0.2);
    balustrade(lerp(P5, n3, 0.06), lerp(P5, n3, 0.94), y, n2, `loggia-${k}-balustrade-north`, 0.2);
  }

  // --- the podium's Robinson Road window, facing Telegraph Street -----------------------------------------------------------
  // a tall glazed bay standing out in a heavy silver frame on the podium's east face, clear teal-grey glass, its south
  // side upright, its north side leaning out toward the top (as photographed down Telegraph Street on 19 April 2024)
  const east = (() => { const N = normalsOf(podium), d = compass(122); const i = N.findIndex((n) => dot(n, d) > 0.95); return { a: podium[i], b: podium[(i + 1) % podium.length], n: N[i] }; })();
  const eastAt = (z, out) => { const t = (z - east.a[1]) / (east.b[1] - east.a[1]); return add(lerp(east.a, east.b, t), mul(east.n, out)); };
  // (KPF's east elevation: 15 m wide at the north end of the face, from the podium's foot to the crease; its glass tilted
  // out toward the top in its frame)
  const win = { zN: -19.6, zS: -4.6, lean: 1.5, y0: 8.6, y1: crease(-5.2), out: [0.5, 1.3] };
  const zLean = win.zN - win.lean;
  kit.loft({ ring: [eastAt(win.zN, 0.06), eastAt(win.zS, 0.06), eastAt(win.zS, win.out[0]), eastAt(win.zN, win.out[0])], topRing: [eastAt(zLean, 0.06), eastAt(win.zS, 0.06), eastAt(win.zS, win.out[1]), eastAt(zLean, win.out[1])], y0: win.y0, y1: win.y1, material: M.west, top: M.trim, name: 'podium-window' });
  const fr = (z, y) => { const p = eastAt(z, (y < (win.y0 + win.y1) / 2 ? win.out[0] : win.out[1]) - 0.3); return [p[0], y, p[1]]; };
  for (const [k, [a, b]] of [[fr(win.zN, win.y0), fr(win.zS, win.y0)], [fr(win.zS, win.y0), fr(win.zS, win.y1)], [fr(win.zS, win.y1), fr(zLean, win.y1)], [fr(zLean, win.y1), fr(win.zN, win.y0)]].entries()) {
    kit.beam({ from: a, to: b, w: 1, h: 1, material: M.trim, name: `podium-window-frame-${k}` });
  }

  // --- the sign: Singlife's red banner on the tip's glass, its white mark over its name --------------------------------
  const tipWall = kit.wallToward(podium, 195);
  kit.box({ x: tipWall.x + tipWall.nx * 0.15, z: tipWall.z + tipWall.nz * 0.15, y: 20.2, w: 8.4, h: 9.2, d: 0.2, yaw: Math.atan2(-tipWall.nx, tipWall.nz), material: M.red, top: M.red, name: 'sign-panel' });
  kit.hang({ ring: podium, top: H.lower, toward: 195, below: 1.7, out: 0.32, margin: 3, logo: LOGOS.singlife, height: 4.6, name: 'sign:singlife-mark' });
  kit.hang({ ring: podium, top: H.lower, toward: 195, below: 7, out: 0.32, margin: 3, text: 'Singlife', height: 1.6, maxWidth: 4.8, color: C.sign, font: '500 110px "Segoe UI", Helvetica, Arial, sans-serif', name: 'sign:singlife' });
}
