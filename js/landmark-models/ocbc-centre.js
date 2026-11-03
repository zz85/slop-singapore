// js/landmark-models/ocbc-centre.js
// OCBC Centre, 65 Chulia Street (I. M. Pei & Partners with BEP Akitek, Ove Arup & Partners engineers, 1976), with
// OCBC Centre East (63 Chulia Street, 1996) and OCBC Centre South (18 Church Street, 1985): OSM ways 171999325 (the
// site outline, "OCBC Bank", 16 m), 335167787 (the tower, 198 m), 325793729 and 335167802 (the "Lower Block"),
// 460431823 and 460431824 (the "Middle Block"), 460431821 and 460431822 (the "Upper Block") — the mapper's strips
// along the tower's long faces for its three stacks of offices — 407705497 (the six-level car-park podium),
// 407705487 (Centre East) and 407705501 (Centre South). Bar On Chulia (764327106), Royal One Phillip and the Yueh Hai
// Ching Temple next door stay the city's.
// "The calculator": a flat slab between two great half-round concrete cores, clad in warm grey granite. Three
// post-tensioned girders span the cores at the 4th, 20th and 35th floors, and each carries a stack of office floors
// that cantilevers out about 5.5 m beyond the cores' faces on both long sides: three boxes of grey ribbon windows
// under light spandrels, each on a deeper fascia with a dark shadow line beneath, with the girder floors between them
// recessed back to the cores' plane (the peregrine falcons nest in those recesses). The top stack ends in a floor of
// paler glass under a light band, and over it the cores and a plain crown rise to a flat roof round a sunken plant
// well; OCBC's red mark and name hang on the crown at the east end of the face to the river and at the west end of
// the face to Chinatown. At the foot the cores reach the ground, the banking hall's glass between them, and the lowest
// stack overhangs the walk along Chulia Street 16 m up. Behind it, to the south-west, the car-park podium (cars on its
// roof, cooling towers at its north-west end); to the south, Centre South, a seven-storey slab with rounded ends in
// light bands and dark ribbon windows over a granite colonnade; to the east, Centre East, beige granite with deep
// punched windows and a curved front of banded glass toward the tower.
// Heights: 198 m (Wikipedia 197.7 m, docomomo 198 m, OSM 198), the banking hall 12 m (docomomo); the stacks, the
// recessed girder floors and the crown measured from a perspective-corrected photograph from the river (2023) at a
// storey of 3.656 m, the crown checked from the Stamford (2015) and Ann Siang Hill (2023); Centre East 56 m as
// mapped; Centre South 28 m (seven storeys, published) and the podium 15.5 m (six levels, the outline's 16 m) are
// estimated. Plan as mapped, the cores drawn as true half-circles of the slab's 22.4 m width (the mapped ends bulge
// 2 m further than the roof seen from above). See docs/ocbc-centre.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'OCBC Centre', height: 198 };

const ID = {
  outline: 171999325, tower: 335167787, lowerSSW: 325793729, lowerNNE: 335167802,
  podium: 407705497, east: 407705487, south: 407705501
};
const STOREY = 3.656; // the offices' floor to floor; window rows lie on whole storeys from the ground
const DEPTH = 5.5; // how far the stacks cantilever beyond the cores' faces ("up to six metres", mapped 4.8–6.3)
// The three stacks: their soffits, the whole storeys of ribbon windows (from, to), and their tops (the upper stack's
// last storey in paler glass under its band)
const STACKS = [
  { name: 'lower', soffit: 4.36 * STOREY, rows: [5, 18], top: 18.52 * STOREY },
  { name: 'middle', soffit: 20.36 * STOREY, rows: [21, 34], top: 34.52 * STOREY },
  { name: 'upper', soffit: 36.1 * STOREY, rows: [37, 50], glass: 51, top: 51.79 * STOREY }
];
// heights (m): the banking hall's glass, the girder band over it, the plant well's floor, the roof; the podium, Centre
// South (and its colonnade), Centre East
const H = { hall: 12, deck: 196, roof: 198, podium: 15.5, link: 15.9, south: 28, colonnade: 4.6, east: 56, eastGlass: 16 * 3.3 };
// colours from daylight photographs: the cores' warm grey granite, the stacks' light grey spandrels and fascias
// round dark grey ribbon windows, the top floor's paler aqua glass, the hall's dark glass in light mullions; the
// podium's grey concrete round dark openings; Centre East's beige granite with dark punched windows, its curved front
// in grey-green glass between light spandrels; Centre South's light bands over dark glass; OCBC's red
const C = {
  granite: 0xd1ccc3, band: 0xd0d2cf, window: 0x505b64, glassBand: 0x93a8aa, hall: 0x4b5961, mullion: 0xa9adab,
  podium: 0xb3aea5, opening: 0x4d5155, beige: 0xcdbfab, eastWindow: 0x56666b, eastGlass: 0x809a94, eastBand: 0xd3d6d2,
  southBand: 0xdad7cf, southGlass: 0x4a565e, paving: 0xc9c3b8, dark: 0x55595b, red: 0xe01f26
};

const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  const s = area(ring) >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// A run of a ring's points rounded by corner cutting (Chaikin), its ends kept: a polygonal curve made smooth
function smooth(points, passes = 2) {
  let p = points;
  for (let k = 0; k < passes; k++) {
    const out = [p[0]];
    for (let i = 0; i + 1 < p.length; i++) {
      const [a, b] = [p[i], p[i + 1]];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`OCBC Centre needs mapped way ${id}`);
    return p.ring;
  };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // --- the drawing: u along the slab toward its east end (bearing 116°), v across it toward Chulia Street and the
  // river (26°), metres from the slab's middle; taken from the four corners where the cores' faces meet the stacks'
  // mapped strips ------------------------------------------------------------------------------------------------------
  const tower = ring(ID.tower);
  const shared = (strip) => tower.filter((p) => strip.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3));
  const ssw = shared(ring(ID.lowerSSW)), nne = shared(ring(ID.lowerNNE));
  if (ssw.length !== 2 || nne.length !== 2) throw new Error('OCBC Centre: the stacks\' strips do not meet the tower where they are mapped');
  const corners = [...ssw, ...nne];
  const C0 = corners.reduce(([x, z], p) => [x + p[0] / 4, z + p[1] / 4], [0, 0]);
  const U = kit.compass(116), V = kit.compass(26);
  const du = (p) => (p[0] - C0[0]) * U[0] + (p[1] - C0[1]) * U[1], dv = (p) => (p[0] - C0[0]) * V[0] + (p[1] - C0[1]) * V[1];
  const S = corners.reduce((s, p) => s + Math.abs(du(p)) / 4, 0); // half the straight length between the cores
  const R = corners.reduce((s, p) => s + Math.abs(dv(p)) / 4, 0); // half the slab's width: the cores' radius
  if (Math.abs(S - 19.1) > 1.5 || Math.abs(R - 11.2) > 1) throw new Error(`OCBC Centre: the slab is not where it is mapped (${S.toFixed(1)} by ${R.toFixed(1)})`);
  const P = (u, v) => [C0[0] + U[0] * u + V[0] * v, C0[1] + U[1] * u + V[1] * v];
  const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  // the cores' half-circles: the east one from its south tangent round to its north one, the west one back
  const SEG = 16;
  const arc = (end, inner = true) => {
    const pts = [];
    for (let k = inner ? 1 : 0; k <= (inner ? SEG - 1 : SEG); k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / SEG;
      pts.push(end > 0 ? P(S + R * Math.cos(a), R * Math.sin(a)) : P(-S - R * Math.cos(a), -R * Math.sin(a)));
    }
    return pts;
  };
  const stadium = [P(-S, -R), P(S, -R), ...arc(1), P(S, R), P(-S, R), ...arc(-1)];
  const halfDisc = (end) => arc(end, false);

  const M = {
    granite: kit.material(C.granite, { roughness: 0.7 }),
    band: kit.material(C.band, { roughness: 0.6 }),
    // the stacks: a ribbon of windows a storey, eleven bays across the slab, light spandrels between
    stack: kit.facadeMaterial({ wall: C.band, window: C.window, floorHeight: STOREY, bayWidth: (2 * S) / 11, windowWidth: 0.9, windowHeight: 0.42, pattern: 'punched' }),
    glassBand: kit.facadeMaterial({ wall: C.band, window: C.glassBand, floorHeight: STOREY, bayWidth: S / 11, windowWidth: 0.92, pattern: 'strips' }),
    hall: kit.facadeMaterial({ wall: C.mullion, window: C.hall, floorHeight: H.hall / 3, bayWidth: 2.4, pattern: 'curtain' }),
    podium: kit.facadeMaterial({ wall: C.podium, window: C.opening, floorHeight: H.podium / 6, bayWidth: 8, pattern: 'ribbon' }),
    beige: kit.facadeMaterial({ wall: C.beige, window: C.eastWindow, floorHeight: 3.3, bayWidth: 3.2, windowWidth: 0.42, windowHeight: 0.46, pattern: 'punched' }),
    eastGlass: kit.facadeMaterial({ wall: C.eastBand, window: C.eastGlass, floorHeight: 3.3, bayWidth: 1.6, pattern: 'ribbon' }),
    south: kit.facadeMaterial({ wall: C.southBand, window: C.southGlass, floorHeight: 3.9, bayWidth: 1.8, pattern: 'ribbon' }),
    paving: kit.material(C.paving), dark: kit.material(C.dark), roof: kit.roofMaterial()
  };

  // --- the tower ------------------------------------------------------------------------------------------------------
  // The foot: the cores to the ground, and between them the banking hall's glass a metre inside their faces
  for (const end of [1, -1]) kit.prism({ ring: halfDisc(end), y0: 0, y1: H.hall, material: M.granite, top: M.granite, name: `tower-core-foot-${end > 0 ? 'east' : 'west'}` });
  kit.prism({ ring: rect(-S, -R + 1, S, R - 1), y0: 0, y1: H.hall, material: M.hall, top: M.granite, name: 'tower-hall' });
  // the slab over it: the cores and the girder floors between the stacks in granite to the plant well's floor, and
  // the roof round the well: the two ends and the strips along the faces, up to the roof
  kit.prism({ ring: stadium, y0: H.hall, y1: H.deck, material: M.granite, top: M.dark, name: 'tower-slab' });
  const well = { u: 13, v: 4.5 };
  const roofPieces = [
    rect(-S, well.v, S, R), rect(-S, -R, S, -well.v),
    [P(well.u, -well.v), P(S, -well.v), P(S, -R), ...arc(1), P(S, R), P(S, well.v), P(well.u, well.v)],
    [P(-well.u, well.v), P(-S, well.v), P(-S, R), ...arc(-1), P(-S, -R), P(-S, -well.v), P(-well.u, -well.v)]
  ];
  roofPieces.forEach((r, k) => kit.prism({ ring: r, y0: H.deck, y1: H.roof, material: M.granite, top: M.roof, name: `tower-roof-${k}` }));
  // plant in the well, below the roofline: two long air-handling housings and four fans
  for (const [u, v, w, d, h] of [[-6.5, -1.2, 9, 5.6, 1.6], [6.5, 1.2, 9, 5.6, 1.6], [0, 0, 2.5, 7.5, 1.1]]) {
    const r = rect(u - w / 2, v - d / 2, u + w / 2, v + d / 2);
    kit.prism({ ring: r, y0: H.deck, y1: H.deck + h, material: M.band, top: M.band, name: `tower-plant-${u}` });
  }
  for (const [u, v] of [[-9, 3.2], [-4, 3.2], [4, -3.2], [9, -3.2]]) {
    const [x, z] = P(u, v);
    kit.cylinder({ x, z, y0: H.deck, y1: H.deck + 0.9, r: 0.8, segments: 10, material: M.band, top: M.dark, name: `tower-fan-${u}` });
  }
  // solid to fly into: the middle of the slab exactly, the cores' half-circles strip by strip
  kit.collisionPrism({ ring: rect(-S, -R, S, R), y0: H.hall, y1: H.roof });
  for (const end of [1, -1]) kit.collisionPrism({ ring: halfDisc(end), y0: H.hall, y1: H.roof });

  // The stacks: on each long face (+1 toward the river, -1 toward Chinatown) three boxes cantilevered DEPTH m out
  // from the cores' faces (reaching 0.2 m into the slab), each a deeper fascia under its storeys of ribbon windows and
  // a lighter band over them (the upper one's last storey paler glass), a ledge along each sill
  const faces = [{ side: 1, label: 'nne' }, { side: -1, label: 'ssw' }];
  for (const { side, label } of faces) {
    // a box across the face from v0 to v1 (outward), front edge first, its wall's uv starting at the west end
    const box = (v0, v1, grow = 0) => {
      const [a, b] = [side * (R - v0), side * (R + v1)];
      return side > 0 ? [P(-S - grow, b), P(S + grow, b), P(S + grow, a), P(-S - grow, a)] : [P(S + grow, b), P(-S - grow, b), P(-S - grow, a), P(S + grow, a)];
    };
    const body = box(0.2, DEPTH), proud = box(0.2, DEPTH + 0.12, 0.12), recess = box(0.2, DEPTH - 0.7);
    for (const st of STACKS) {
      const [r0, r1] = st.rows.map((k) => k * STOREY);
      const base = `stack-${label}-${st.name}`;
      // under it, the cantilevered floor's dark recessed edge 1 m deep with the brackets' ends, a bay apart: the dark
      // line that marks each stack's foot from afar
      kit.prism({ ring: recess, y0: st.soffit, y1: st.soffit + 1, material: M.dark, top: M.dark, name: `${base}-soffit` });
      for (let k = 0; k <= 11; k++) {
        const u = -S + 0.3 + ((2 * S - 0.6) * k) / 11, [ax, az] = P(u, side * (R + DEPTH - 0.75)), [bx, bz] = P(u, side * (R + DEPTH - 0.05));
        kit.beam({ from: [ax, st.soffit + 0.52, az], to: [bx, st.soffit + 0.52, bz], w: 0.4, h: 0.94, material: M.band, name: `${base}-bracket-${k}` });
      }
      kit.prism({ ring: proud, y0: st.soffit + 1, y1: r0, material: M.band, top: M.band, name: `${base}-fascia` });
      kit.prism({ ring: body, y0: r0, y1: r1, material: M.stack, top: M.band, name: `${base}-offices` });
      let y = r1;
      if (st.glass) {
        kit.prism({ ring: body, y0: r1, y1: st.glass * STOREY, material: M.glassBand, top: M.band, name: `${base}-glass` });
        y = st.glass * STOREY;
      }
      kit.prism({ ring: proud, y0: y, y1: st.top, material: M.band, top: M.roof, name: `${base}-band` });
      // a light ledge along each sill, 0.3 m proud of the windows
      const [fa, fb] = [proud[0], proud[1]].map((p) => [p[0] + V[0] * side * 0.03, p[1] + V[1] * side * 0.03]);
      for (let k = st.rows[0]; k < st.rows[1]; k++) {
        const yl = (k + 0.16) * STOREY;
        kit.beam({ from: [fa[0], yl, fa[1]], to: [fb[0], yl, fb[1]], w: 0.3, h: 0.36, material: M.band, name: `${base}-ledge-${k}` });
      }
      kit.collisionPrism({ ring: proud, y0: st.soffit, y1: st.top });
    }
  }

  // OCBC's mark and name on the crown, as the photographs from the river and from Ann Siang Hill show them (2023): on
  // the face to the river toward its east end, on the face to Chinatown toward its west end, each from just inside the
  // stack's end about 14.6 m along, under the roofline
  for (const { side, label } of faces) {
    const [u0, u1] = side > 0 ? [3, 18.6] : [-18.6, -3];
    const r = side > 0 ? [P(u1, R), P(u0, R), P(u0, R - 1), P(u1, R - 1)] : [P(u0, -R), P(u1, -R), P(u1, -R + 1), P(u0, -R + 1)];
    kit.hang({ ring: r, top: H.roof, toward: side > 0 ? 26 : 206, below: 0.6, out: 0.15, margin: 0.4, logo: LOGOS.ocbc, text: 'OCBC', height: 5.2, color: C.red, name: `sign:ocbc-${label}` });
  }

  // --- the foot along Chulia Street: the walk under the lowest stack, paved above the city's lawn -------------------
  kit.prism({ ring: rect(-S, R - 0.95, S, R + DEPTH), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-walk' });

  // --- the podium: the car park on the south-west, joined to the tower's foot under the stack on that side ---------
  const podium = ring(ID.podium);
  kit.prism({ ring: podium, y0: 0, y1: H.podium, material: M.podium, top: M.paving, name: 'podium' });
  kit.collisionPrism({ ring: podium, y0: 0, y1: H.podium }); // solid to land on, not only walled
  // under the south-west stack, from inside the hall's glass to over the podium's edge
  kit.prism({ ring: rect(-S, -R - DEPTH - 0.8, S, -R + 1), y0: 0, y1: H.link, material: M.podium, top: M.roof, name: 'podium-link' });
  // its roof, as the aerial shows it: the parked cars' deck along the stacks' line, a block of cooling-tower cells at
  // the far north-west end, a round tank beside them. Placed from the podium's long edge on that line (s along it from
  // its west end, t inward)
  const PN = normalsOf(podium);
  const longest = podium.reduce((best, a, i) => { const b = podium[(i + 1) % podium.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); return L > best.L ? { i, L } : best; }, { i: 0, L: 0 });
  const ea = podium[longest.i], eb = podium[(longest.i + 1) % podium.length];
  if (Math.abs(dv(ea) + R + DEPTH) > 2.5 || Math.abs(dv(eb) + R + DEPTH) > 2.5) throw new Error('OCBC Centre: the podium does not meet the stacks\' line where it is mapped');
  const westEnd = du(ea) < du(eb) ? ea : eb, eastEnd = westEnd === ea ? eb : ea;
  const inward = [-PN[longest.i][0], -PN[longest.i][1]];
  const along = [(eastEnd[0] - westEnd[0]) / longest.L, (eastEnd[1] - westEnd[1]) / longest.L];
  const Q = (s, t) => [westEnd[0] + along[0] * s + inward[0] * t, westEnd[1] + along[1] * s + inward[1] * t];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const [s, t] = [1.8 + a * 4.5, 17.5 + b * 4.5];
    kit.prism({ ring: [Q(s, t), Q(s + 4.1, t), Q(s + 4.1, t + 4.1), Q(s, t + 4.1)], y0: H.podium, y1: H.podium + 3.2, material: M.band, top: M.dark, name: `podium-cooling-${a}-${b}` });
  }
  {
    const [x, z] = Q(23, 21.5);
    kit.cylinder({ x, z, y0: H.podium, y1: H.podium + 4.5, r: 2.3, segments: 14, material: M.band, top: M.band, name: 'podium-tank' });
  }
  // a few cars parked in two rows on the deck
  const yawAlong = Math.atan2(along[1], along[0]);
  for (let k = 0; k < 10; k++) {
    const [x, z] = Q(4 + (k % 5) * 5.2 + (k > 4 ? 2.4 : 0), k > 4 ? 9 : 3.6);
    kit.box({ x, z, y: H.podium, w: 1.8, h: 1.45, d: 4.4, yaw: yawAlong, material: k % 3 ? M.band : M.dark, top: k % 3 ? M.band : M.dark, name: `podium-car-${k}` });
  }

  // --- Centre South: a seven-storey slab with rounded ends, light bands over dark ribbon windows on a granite
  // colonnade ------------------------------------------------------------------------------------------------------------
  const south = ring(ID.south);
  kit.prism({ ring: kit.inset(south, 1.6), y0: 0, y1: H.colonnade, material: M.hall, top: M.granite, name: 'south-ground' });
  kit.prism({ ring: south, y0: H.colonnade, y1: H.south, material: M.south, top: M.roof, name: 'south' });
  kit.collisionPrism({ ring: south, y0: H.colonnade, y1: H.south });
  // the colonnade: square granite piers under the edge, about every 6.5 m
  const piers = kit.inset(south, 0.55);
  let run = 1.5, n = 0;
  piers.forEach((a, i) => {
    const b = piers[(i + 1) % piers.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (; run < L; run += 6.5) {
      const [x, z] = lerp(a, b, run / L);
      kit.box({ x, z, y: 0, w: 0.9, h: H.colonnade, d: 0.9, yaw: Math.atan2(b[1] - a[1], b[0] - a[0]), material: M.granite, top: M.granite, name: `south-pier-${n++}` });
    }
    run -= L;
  });
  kit.prism({ ring: kit.inset(south, 8), y0: H.south, y1: H.south + 1.6, material: M.band, top: M.band, name: 'south-plant' });

  // --- Centre East: beige granite with deep punched windows, its curved front of banded glass toward the tower --------
  let eastRing = ring(ID.east);
  // the curved front: the mapped run from the north end's west corner (level with the stacks' face on Chulia Street)
  // round the block's north-west corner to where it meets the podium's notch, facing the tower's east core 6 m away;
  // rounded, the rest of the ring as mapped
  const nearest = (r, u, v, what) => {
    let best = -1, d = Infinity;
    r.forEach((p, i) => { const k = Math.hypot(du(p) - u, dv(p) - v); if (k < d) { d = k; best = i; } });
    if (d > 3) throw new Error(`OCBC Centre: ${what} is not where it is mapped (${d.toFixed(1)} m off)`);
    return best;
  };
  let iS = nearest(eastRing, 56.8, 17.8, 'Centre East\'s north-west corner'), iE = nearest(eastRing, 36, -12.8, 'Centre East\'s south end of its curve');
  if ((iE - iS + eastRing.length) % eastRing.length > eastRing.length / 2) {
    eastRing = [...eastRing].reverse();
    [iS, iE] = [eastRing.length - 1 - iS, eastRing.length - 1 - iE];
  }
  const count = ((iE - iS + eastRing.length) % eastRing.length) + 1;
  const curve = smooth(Array.from({ length: count }, (_, k) => eastRing[(iS + k) % eastRing.length]));
  const rest = Array.from({ length: eastRing.length - count }, (_, k) => eastRing[(iE + 1 + k) % eastRing.length]);
  const east = [...curve, ...rest];
  const curved = curve.length - 1; // the walls 0 .. curved - 1 are the curved front
  // sixteen storeys of the curved glass, under two of beige granite all round (the river photograph's crown)
  kit.prism({ ring: east, y0: 0, y1: H.eastGlass, material: M.beige, edgeMaterial: (i) => (i < curved ? M.eastGlass : null), top: M.roof, name: 'east' });
  kit.prism({ ring: east, y0: H.eastGlass, y1: H.east, material: M.beige, top: M.roof, name: 'east-crown' });
  kit.collisionPrism({ ring: east, y0: 0, y1: H.east });
  // its plant: a low housing in the middle of the roof, along the block
  const ob = kit.boxOf(east);
  kit.box({ x: ob.cx, z: ob.cz, y: H.east, w: 2 * ob.hx * 0.42, h: 1.8, d: 2 * ob.hz * 0.4, yaw: Math.atan2(ob.uz, ob.ux), material: M.band, top: M.band, name: 'east-plant' });
}
