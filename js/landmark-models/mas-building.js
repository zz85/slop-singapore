// js/landmark-models/mas-building.js
// The MAS Building (SG-090), 10 Shenton Way: the headquarters of the Monetary Authority of Singapore (RSP Architects
// Planners & Engineers; built 1981–1985, refurbished 2005; 30 storeys). OSM ways 43755573 (the site's outline: the tower,
// the podium, the porte-cochère wing toward Prince Edward Road and the annex toward Springleaf Tower), 172915371 (the
// tower part, mapped at 37 levels and 102 m) and 439006507 (the four-storey podium strip along Parsi Road and Shenton
// Way). Springleaf Tower, Lumiere, EON Shenton and the Singapore Conference Hall across Shenton Way stay the city's.
// A sheer slab of terracotta tiles 46 by 66 m. Its short faces (toward Prince Edward Road, north-east, and Parsi Road,
// south-west) are frames: tiled end frames and a middle group of four piers, dark slots and window slots round a
// set-back panel, bays of close vertical louvres between, and under the crown three horizontal slats with dark gaps between them. Its
// long faces (toward Springleaf Tower, north-west, and Shenton Way, south-east) are deep louvred recesses running from
// the Parsi Road face's end frames to solid tiled ends beside the Prince Edward Road face, the crown band carried over
// them on a lattice of posts and a chord, the top storey's glass behind. The crown: a 9 m band round all four faces,
// a parapet round a deck of screened plant. Round the tower's foot on Parsi Road and Shenton Way a four-storey podium of
// polished brown granite with rounded corners, a tall portal on Shenton Way, its west end bridging the covered service
// drive; toward Prince Edward Road the porte-cochère over the drop-off, the MAS crest and name on it; toward Springleaf
// Tower a low annex where the covered drive along the north-west face ends.
// Heights: 138 m to the parapet (Timothy Tye, penang-traveltips.com: 138 m, 30 storeys), confirmed by the roof's lean in
// Esri's aerial against Springleaf Tower (165 m) and International Plaza (190 m) and by Tye's square-on photograph of the
// Prince Edward Road face (2017); CTBUH's 103.8 m and OSM's 102 m do not fit them. The crown, the slats, the podium (OSM:
// four levels) and the porte-cochère measured or estimated on photographs (Lannuzel 2009, Terence Ong 2006, Tye 2011 and
// 2017, Mrb Rafi 2023). See docs/mas-building.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'MAS Building', height: 138 };

const ID = { outline: 43755573, tower: 172915371, podium: 439006507 };
const ACROSS = 130.8, ALONG = 40.8; // u toward Shenton Way (the long faces' normal), v toward Prince Edward Road
// heights (m): the parapet, the roof deck, the crown band's foot; the slats under it on the frame faces (top to bottom,
// each [foot, top]) and the piers' tops under the lowest; where the frame faces' top glazing and the recesses' top-floor
// glass begin; the ground storey (the lobby, the drive's soffit) and the foot of the frame over the drive; the podium's
// roof, its portal's head; the porte-cochère; the annex; the lattice
const H = {
  top: 138, deck: 134, crown: 129, slats: [[124.3, 126.7], [120.5, 122.4], [116.4, 118.6]], piers: 116.4,
  glassA: 116, glassB: 119.8, ground: 7, overDrive: 7.2, podium: 19.5, portal: 13, porch: [7, 19.5], annex: 6.5, lattice: [124.5, 129], chord: 1
};
// the plan (m) on the tower part's axes about its middle: the crown's half sizes (the frame faces flush with it, their
// louvres 1 m behind); the recesses' louvre planes, 2.5 m behind the crown; where the recesses' solid ends begin (16 m
// from the north and east corners; estimated from photographs that all see them foreshortened); the frame faces' end
// frames' inner edges (the solid ends' ends on the Prince Edward Road face), and how far the Parsi Road face's end
// frames reach back into the recesses
const PLAN = { cu: 23, cv: 33, louvre: 32, recess: 20.5, strip: 17, frame: 19, frameBack: -30.3 };
// the frame faces' middle group along the face from its middle (measured on Tye's square-on photograph of the Prince Edward
// Road face, 4.9 px/m): four piers, two dark slots between the outer pairs, two narrow window slots beside the panel set
// back in the middle; the end frames 4 m wide, the louvre bays 8 m
const GROUP = { piers: [[-11, -8.4], [-6.5, -3.9], [3.9, 6.5], [8.4, 11]], slots: [[-8.4, -6.5], [6.5, 8.4]], windows: [[-3.9, -2.3], [2.3, 3.9]], panel: [-2.3, 2.3] };
// colours from daylight photographs (Tye 2017 in sun, Rafi 2023 overcast, Ong 2006): the terracotta tiles; the
// louvres' fins and the dark gaps between them; the top storeys' dark glass; the slots' dark brown; the podium's polished
// brown granite and its joints; the roof deck, the plant; the paving; planting; the MAS sign's gold
const C = {
  tile: 0xcc8467, fin: 0xbd7860, gap: 0x6e463a, glass: 0x2e3a42, slot: 0x5b3b31, granite: 0x857066, joint: 0x2f2928,
  deck: 0x6f554b, plant: 0x9d9a93, paving: 0xc2b9ae, leaf: 0x4f7d3a, gold: 0xc9a24b
};

export function build(kit, site) {
  const mapped = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`MAS Building needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    tile: kit.material(C.tile, { roughness: 0.7 }),
    // the louvres: fins 0.75 m apart in a 1.1 m rhythm, the dark glass between them; no line across them on the floors
    louvre: kit.facadeMaterial({ wall: C.fin, window: C.gap, floorHeight: 140, bayWidth: 1.1, windowWidth: 0.3, pattern: 'strips', roughness: 0.72 }),
    glass: kit.glassMaterial(C.glass),
    // the slots between the piers: dark brown, a dark window in each storey
    slot: kit.facadeMaterial({ wall: C.slot, window: C.glass, floorHeight: 4.4, bayWidth: 1.6, windowWidth: 0.6, windowHeight: 0.45, pattern: 'punched' }),
    // the podium's granite: a dark joint line at each storey
    granite: kit.facadeMaterial({ wall: C.granite, window: C.joint, floorHeight: 4.8, bayWidth: 250, windowWidth: 0.9995, windowHeight: 0.035, pattern: 'punched', roughness: 0.35 }),
    stone: kit.material(C.granite, { roughness: 0.35 }), deck: kit.material(C.deck, { roughness: 0.9 }), plant: kit.material(C.plant, { roughness: 0.85 }),
    paving: kit.material(C.paving), leaf: kit.material(C.leaf)
  };

  // --- the drawing: u toward Shenton Way, v toward Prince Edward Road, about the mapped tower part's middle ------------
  const U = kit.compass(ACROSS), V = kit.compass(ALONG);
  const tower = mapped(ID.tower);
  const us = tower.map(([x, z]) => x * U[0] + z * U[1]), vs = tower.map(([x, z]) => x * V[0] + z * V[1]);
  const u0 = (Math.min(...us) + Math.max(...us)) / 2, v0 = (Math.min(...vs) + Math.max(...vs)) / 2;
  const P = (u, v) => [U[0] * (u + u0) + V[0] * (v + v0), U[1] * (u + u0) + V[1] * (v + v0)];
  const ring = (pts) => pts.map(([u, v]) => P(u, v));
  // a rectangle: its walls in order toward -v (south-west), +u (south-east), +v (north-east), -u (north-west)
  const rect = (ua, va, ub, vb) => ring([[ua, va], [ub, va], [ub, vb], [ua, vb]]);
  const solid = (part) => { kit.collisionPrism({ ring: part.ring, y0: part.y0, y1: part.y1 }); return part; };
  const { cu, cv, louvre: lv, recess: ru, strip: sv, frame: fu, frameBack: fv } = PLAN;

  // the outline's ground, paved over the city's lawn
  kit.prism({ ring: kit.inset(mapped(ID.outline), -0.25), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-paving' });

  // --- the tower's body -----------------------------------------------------------------------------------------------
  // the ground storey: the lobby's glass behind the piers toward Prince Edward Road; toward Springleaf Tower cut back
  // for the covered drive from Parsi Road (OSM way 47345218) as far as the annex
  const baseRing = [[-17, -lv], [ru, -lv], [ru, lv], [-ru, lv], [-ru, -9], [-17, -9]];
  kit.prism({ ring: ring(baseRing), y0: 0, y1: H.ground, material: M.stone, edgeMaterial: (i) => (i === 2 ? M.glass : null), top: M.deck, name: 'tower-base', outlineCollision: true });
  // over it the louvred body: the louvres on every face (the frame faces' bays, the recesses) up to the frame faces' top
  // glazing; the recesses' louvres on to their top-floor glass; then glass all round to the crown
  solid(kit.prism({ ring: rect(-ru, -lv, ru, lv), y0: H.ground, y1: H.glassA, material: M.louvre, top: M.deck, name: 'tower-body' }));
  solid(kit.prism({ ring: rect(-ru, -lv, ru, lv), y0: H.glassA, y1: H.glassB, material: M.louvre, edgeMaterial: (i) => (i === 0 || i === 2 ? M.glass : null), top: M.deck, name: 'tower-top-glazing' }));
  solid(kit.prism({ ring: rect(-ru, -lv, ru, lv), y0: H.glassB, y1: H.crown - 0.05, material: M.glass, top: M.deck, name: 'tower-top-storeys' }));

  // the recesses' solid tiled ends beside the Prince Edward Road face, flush with the crown (their ends are that face's
  // end frames); at the recesses' other ends, the Parsi Road face's end frames, flush with the crown too (the west one
  // over the drive)
  kit.prism({ ring: rect(-cu, sv, -fu, cv), y0: 0, y1: H.crown, material: M.tile, top: M.tile, name: 'tower-nw-strip' });
  kit.prism({ ring: rect(fu, sv, cu, cv), y0: 0, y1: H.crown, material: M.tile, top: M.tile, name: 'tower-se-strip' });
  solid(kit.prism({ ring: rect(-cu, -cv, -fu, fv), y0: H.overDrive, y1: H.crown, material: M.tile, top: M.tile, name: 'tower-sw-frame-west' }));
  kit.prism({ ring: rect(fu, -cv, cu, fv), y0: 0, y1: H.crown, material: M.tile, top: M.tile, name: 'tower-sw-frame-south' });

  // --- the frame faces toward Prince Edward Road (ne) and Parsi Road (sw) -------------------------------------------------
  // on each a point at s along the face (from its middle) and d out from the tower's middle
  const faces = {
    ne: { at: (s, d) => [s, d], from: -fu, to: fu },
    sw: { at: (s, d) => [s, -d], from: -fu, to: fu }
  };
  for (const [face, F] of Object.entries(faces)) {
    const box = (s0, s1, d0, d1) => ring([F.at(s0, d0), F.at(s1, d0), F.at(s1, d1), F.at(s0, d1)]);
    // the middle group's piers, from the ground to the lowest slat; the dark slots and the window slots between them; the
    // panel set back
    GROUP.piers.forEach(([s0, s1], k) => kit.prism({ ring: box(s0, s1, lv - 0.2, cv), y0: 0, y1: H.piers, material: M.tile, top: M.tile, name: `tower-${face}-pier-${k}` }));
    GROUP.slots.forEach(([s0, s1], k) => kit.prism({ ring: box(s0, s1, lv - 0.1, lv + 0.15), y0: H.ground, y1: H.piers, material: M.slot, top: M.glass, name: `tower-${face}-slot-${k}` }));
    GROUP.windows.forEach(([s0, s1], k) => kit.prism({ ring: box(s0, s1, lv - 0.1, lv + 0.1), y0: H.ground, y1: H.piers, material: M.slot, top: M.glass, name: `tower-${face}-window-${k}` }));
    kit.prism({ ring: box(GROUP.panel[0], GROUP.panel[1], lv - 0.25, cv - 0.5), y0: 0, y1: H.piers, material: M.tile, top: M.tile, name: `tower-${face}-panel` });
    // the three slats under the crown, across the face from end frame to end frame, the top one flush with the piers and
    // each lower one stepped back; the dark glass behind them and in the gaps between
    H.slats.forEach(([y0, y1], k) => kit.prism({ ring: box(F.from, F.to, lv - 0.15, cv - 0.3 * k), y0, y1, material: M.tile, top: M.tile, name: `tower-${face}-slat-${k}` }));
  }

  // --- the crown: the band round all four faces, flush with the frame faces and the recesses' ends, projecting over the
  // recesses; the parapet round the deck; screened plant on the deck ---------------------------------------------------------
  const crown = kit.prism({ ring: rect(-cu, -cv, cu, cv), y0: H.crown, y1: H.deck, material: M.tile, top: M.deck, name: 'tower-crown' });
  kit.collisionPrism({ ring: crown.ring, y0: H.crown, y1: H.top });
  const RIM = 2.6;
  [[-cu, -cv, -cu + RIM, cv], [cu - RIM, -cv, cu, cv], [-cu + RIM, cv - RIM, cu - RIM, cv], [-cu + RIM, -cv, cu - RIM, -cv + RIM]].forEach(([ua, va, ub, vb], k) =>
    kit.prism({ ring: rect(ua, va, ub, vb), y0: H.deck, y1: H.top, material: M.tile, top: M.tile, name: `tower-rim-${k}` }));
  // the screens round the plant (a ring 5.5 m in from the edge, cross walls, a wall down the middle) and the plant
  const SU = 17.5, SV = 27.5, T = 0.6;
  [[-SU, -SV, -SU + T, SV], [SU - T, -SV, SU, SV], [-SU + T, SV - T, SU - T, SV], [-SU + T, -SV, SU - T, -SV + T]].forEach(([ua, va, ub, vb], k) =>
    kit.prism({ ring: rect(ua, va, ub, vb), y0: H.deck, y1: 137.2, material: M.tile, top: M.tile, name: `tower-roof-screen-${k}` }));
  [-14, 0, 14].forEach((v, k) => kit.prism({ ring: rect(-SU + 0.3, v - T / 2, SU - 0.3, v + T / 2), y0: H.deck, y1: 136.9, material: M.tile, top: M.tile, name: `tower-roof-wall-${k}` }));
  kit.prism({ ring: rect(-T / 2, -SV + 0.3, T / 2, SV - 0.3), y0: H.deck, y1: 136.7, material: M.tile, top: M.tile, name: 'tower-roof-wall-middle' });
  [[-15.5, -25.5, -2, -15.5], [2, -25.5, 15.5, -15.5], [-15.5, -12, -2, -2], [2, 2, 15.5, 12], [-15.5, 15.5, -2, 25.5], [2, 15.5, 9, 25.5]].forEach(([ua, va, ub, vb], k) =>
    kit.prism({ ring: rect(ua, va, ub, vb), y0: H.deck, y1: 136.3, material: M.plant, top: M.plant, name: `tower-roof-plant-${k}` }));

  // the lattice carrying the band over each recess: posts along its outer edge, a chord along their feet
  const [l0, l1] = H.lattice;
  const spaced = (a, b, n) => Array.from({ length: n }, (_, k) => a + ((b - a) * k) / (n - 1));
  for (const [name, s] of [['nw', -1], ['se', 1]]) {
    const chord = s < 0 ? rect(-cu, fv, -cu + 0.6, sv) : rect(cu - 0.6, fv, cu, sv);
    kit.prism({ ring: chord, y0: l0, y1: l0 + H.chord, material: M.tile, top: M.tile, name: `tower-lattice-chord-${name}` });
    kit.collisionPrism({ ring: chord, y0: l0, y1: l0 + H.chord });
    spaced(sv - 1.4, fv + 1.4, 15).forEach((v, k) => {
      const p = s < 0 ? rect(-cu + 0.1, v - 0.3, -cu + 0.7, v + 0.3) : rect(cu - 0.7, v - 0.3, cu - 0.1, v + 0.3);
      kit.prism({ ring: p, y0: l0 + 0.1, y1: l1, material: M.tile, top: M.tile, name: `tower-lattice-post-${name}-${k}` });
    });
  }

  // --- the podium: four storeys of polished granite round the tower's foot on Parsi Road and Shenton Way ---------------
  // its corner on Shenton Way and Parsi Road rounded (5 m), its end on Shenton Way rounded (3 m); on Shenton Way a tall
  // portal, the lobby's glass 2.5 m back in it; the west end bridges the covered drive, its corner rounded too (4 m)
  const PU = 31, PV = -40, IU = ru - 0.3, IV = -lv + 0.4, BRIDGE = -17.4, PORTAL = [-21, -16], PORTAL_U = 28.5;
  const arc = (cu0, cv0, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180; return [cu0 + r * Math.sin(a), cv0 - r * Math.cos(a)]; });
  const podiumPts = [
    [BRIDGE, IV], [BRIDGE, PV], ...arc(PU - 5, PV + 5, 5, 0, 90, 8), [PU, PORTAL[0]], [PORTAL_U, PORTAL[0]], [PORTAL_U, PORTAL[1]], [PU, PORTAL[1]],
    ...arc(PU - 3, 17, 3, 90, 180, 6), [IU, 20], [IU, IV]
  ];
  // the walls: the lobby's glass at the back of the portal
  const lobbyEdge = podiumPts.findIndex(([u, v]) => u === PORTAL_U && v === PORTAL[0]);
  kit.prism({ ring: ring(podiumPts), y0: 0, y1: H.podium, material: M.granite, edgeMaterial: (i) => (i === lobbyEdge ? M.glass : null), top: kit.roofMaterial(), name: 'podium', outlineCollision: true });
  solid(kit.prism({ ring: rect(PORTAL_U, PORTAL[0], PU, PORTAL[1]), y0: H.portal, y1: H.podium, material: M.granite, top: kit.roofMaterial(), name: 'podium-portal-head' }));
  solid(kit.prism({ ring: ring([[BRIDGE, PV], ...arc(-20.8, PV + 4, 4, 0, -90, 6), [-24.8, IV], [BRIDGE, IV]]), y0: H.ground, y1: H.podium, material: M.granite, top: kit.roofMaterial(), name: 'podium-west-bridge' }));
  // planting along the podium's roof at the tower's foot
  kit.prism({ ring: rect(cu + 0.15, -29, cu + 1.8, 16), y0: H.podium, y1: H.podium + 0.8, material: M.stone, top: M.leaf, name: 'podium-planter-se' });
  kit.prism({ ring: rect(-16, -cv - 1.9, 20, -cv - 0.25), y0: H.podium, y1: H.podium + 0.8, material: M.stone, top: M.leaf, name: 'podium-planter-sw' });

  // --- the porte-cochère over the drop-off toward Prince Edward Road (the outline's north-east wing, the covered drive
  // OSM way 543397711 under it): a granite block as tall as the podium bridging the drive from the tower's face to three
  // columns at its outer edge, the MAS
  // crest and name in gold on its side toward Shenton Way (Tye 2017) ----------------------------------------------------------
  const porch = solid(kit.prism({ ring: rect(-11.75, lv + 0.1, 10.16, 51), y0: H.porch[0], y1: H.porch[1], material: M.granite, top: kit.roofMaterial(), name: 'porch-canopy' }));
  [-10.9, -0.8, 9.3].forEach((u, k) => { const [x, z] = P(u, 50.2); kit.cylinder({ x, z, y0: 0, y1: H.porch[0] + 0.02, r: 0.6, segments: 12, material: M.stone, top: M.stone, name: `porch-column-${k}` }); });
  kit.hang({ ring: porch.ring, top: H.porch[1], toward: ACROSS, below: 5.6, out: 0.08, margin: 2, logo: LOGOS.mas, text: 'Monetary Authority\nof Singapore', height: 1.9, maxWidth: 5.5, color: C.gold, font: 'bold 80px Helvetica, Arial, sans-serif', name: 'sign:mas' });

  // --- the annex toward Springleaf Tower (the outline's north-west wing): low granite, a skylight, the covered drive's
  // dark opening into it at its south-west end ---------------------------------------------------------------------------
  kit.prism({ ring: rect(-38.6, -12.2, -ru - 0.2, 31.7), y0: 0, y1: H.annex, material: M.granite, edgeMaterial: (i) => (i === 0 ? M.glass : null), top: kit.roofMaterial(), name: 'annex' });
  kit.prism({ ring: rect(-34.5, 6, -29.5, 16), y0: H.annex, y1: H.annex + 0.6, material: M.glass, top: M.glass, name: 'annex-skylight' });
}
