// js/landmark-models/guoco-tower.js
// Guoco Tower, Tanjong Pagar Centre, 1 Wallich Street (SG-080; Skidmore, Owings & Merrill design architect with
// Architects 61, Arup structure; GuocoLand; completed 2016): Singapore's tallest building, 64 storeys over a six-storey
// podium, with the free-standing 21-storey Sofitel Singapore City Centre west of it on the podium and the City Room, the
// 15 m glass canopy over the Urban Park, south of it. Built from OSM ways 393100849 (the podium), 393100845 (the office
// part, the tower's whole plan), 393100848 (the Wallich Residence, its north half) and 393100850 (the hotel).
// The tower is two interlocking slabs on one 62 × 53 m plan over a lobby set back 2 m: the offices' south block, the
// podium's car park in louvres over its lobby, its south face leaning in some 4 m as it rises, stops at the two-thirds
// setback (168 m) under the residents' white pergola and pool (to 175.5 m); the north block carries the offices on to
// 165 m, a dark recessed sky band and the Wallich Residence on to the roof at 280 m, its north strip stepped back for the
// top 30 m; between the two slabs a narrower seam rises to 166 m, leaving a notch. Dark blue glass behind fine silver
// fins on the east and west faces, horizontal ledges on the south and north faces, a finer grid on the residence's ends;
// on the residence's south face four staggered stacks of balconies, white fins at its folds and a sawtooth of glass fins
// over the roof, GuocoLand's red mark under it at the west end; in the east face near the top the sky frame, a dark
// opening over a projecting tray; on the east, the drop-off canopy. The hotel's glass is banded floor by floor, its west
// end a white wall, its name in gold across the top of its south face.
// Heights: 283.7 m CTBUH's architectural top (the 290 m usually quoted is the height above sea level; CTBUH gives the
// highest occupied floor at 268.3 m); the hotel 105.3 m (CTBUH); the City Room's 15 m ceiling (SOM, Arup, GuocoLand);
// the podium 30 m (OSM, six levels); the setback and pergola (168–175.5 m), the seam (166 m), the sky band (165–172 m),
// the north step (250 m), the residence's 3.65 m floors and the sky frame (262–274 m) measured on SOM's east elevation
// photograph (a shift lens: heights at one distance scale alike). See docs/guoco-tower.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Guoco Tower', height: 283.7 };

const ID = { podium: 393100849, offices: 393100845, residence: 393100848, hotel: 393100850 };
// heights (m): the tower's lobby; the podium's set-back ground storey, its car park and its glass top storey; the
// offices of the north block, the dark sky band, the seam, the south block's roof and the pergola over it; the north
// strip's step, the roof and the crown's top; the sky frame; the hotel's body and top; the City Room's canopy and the
// drop-off canopy
const H = {
  lobby: 18, retail: 6.5, carpark: 26, podium: 30, northOffices: 165, band: 172, seam: 166, offices: 168, pergola: 175.5,
  step: 250, roof: 280, top: 283.7, frame: 262, frameTop: 274, hotel: 101, hotelTop: 105.3, cityRoom: 15, dropOff: 9.5
};
const FLOOR = 3.65; // the residence's floors (31½ of them from the sky band to the top on SOM's elevation photograph)
const TAPER = 4.2; // how far the south block's south face leans in between the lobby and its roof
const SEAM = 7.8; // the seam's depth (along the plan's north) between the south block and the residence
const NORTH_STEP = 5.5; // how far the north strip steps back for the top 30 m
const PAVING = 0.32; // above the city's lawn in the block
// The City Room's canopy: as wide as the tower (SOM's aerial photograph), from 1.5 m off the tower's south face to its
// south edge 48 m south of that face (Esri's aerial): 63.7 × 46.8 m, the 3,000 m² SOM gives
const ROOM_GAP = 1.5, ROOM_DEPTH = 46.8;
// colours from the daylight photographs: dark blue glass behind fine silver fins and ledges; the balconies' dark
// recesses with pale slab edges; the podium's grey and white louvres; white frames, the hotel's white end wall; the
// City Room's dark solar glass on copper-brown trees; GuocoLand's red; the Sofitel's gold letters
const C = {
  fin: 0xc8d0d8, glass: 0x22395a, hotelGlass: 0x2c4866, grid: 0xb6c1cb, gridGlass: 0x284364, slab: 0xa9b2ba, recess: 0x1c2633,
  louvre: 0xc9cfcb, louvreGap: 0x6c7470, white: 0xe4e6e3, dark: 0x26313c, green: 0x5f8a45, paving: 0xcdc8bd,
  copper: 0x9a6440, pool: 0x5fb6cc, gold: 0xf2cf7a
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

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Guoco Tower needs mapped way ${id}`);
    return p.ring;
  };
  // the plan's frame: u along 84° (the long sides' bearing), v along 354°
  const U = kit.compass(84), V = kit.compass(354);
  const P = (u, v) => [u * U[0] + v * V[0], u * U[1] + v * V[1]];
  const uvOf = ([x, z]) => [x * U[0] + z * U[1], x * V[0] + z * V[1]];
  const extent = (r) => { const q = r.map(uvOf); return { u0: Math.min(...q.map((p) => p[0])), u1: Math.max(...q.map((p) => p[0])), v0: Math.min(...q.map((p) => p[1])), v1: Math.max(...q.map((p) => p[1])) }; };
  // a rectangle in the plan's frame, its edges in turn south (v0), east (u1), north (v1), west (u0)
  const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  const S = 0, E = 1, N = 2, W = 3;
  const faces = (m) => (i) => m[i] ?? null; // a material per edge of a rect

  const M = {
    // fine silver fins 1.5 m apart over the glass, with no floor lines: the kit's strips pattern draws a band of the wall
    // colour at the foot of every `floorHeight`, 6 % of it tall, so a 300 m one leaves the glass clear from 18 m (the
    // lobby's top) to 291 m
    fins: kit.facadeMaterial({ wall: C.fin, window: C.glass, floorHeight: 300, bayWidth: 1.5, windowWidth: 0.86, pattern: 'strips', roughness: 0.6 }),
    // the ledge at every floor over the glass, faint mullions between
    ledges: kit.facadeMaterial({ wall: C.fin, window: C.glass, floorHeight: 4.2, bayWidth: 3, windowWidth: 0.94, pattern: 'strips', roughness: 0.6 }),
    // the hotel's glass: a pale slab edge across every floor and nothing else
    hotel: kit.facadeMaterial({ wall: C.fin, window: C.hotelGlass, floorHeight: 3.7, bayWidth: 40, windowWidth: 0.995, pattern: 'strips', roughness: 0.6 }),
    // the residence's finer grid of mullions and transoms
    grid: kit.facadeMaterial({ wall: C.grid, window: C.gridGlass, floorHeight: FLOOR, bayWidth: 1.6, windowWidth: 0.86, pattern: 'strips', roughness: 0.6 }),
    // the balconies: dark recesses between pale slab edges
    balcony: kit.facadeMaterial({ wall: C.slab, window: C.recess, floorHeight: FLOOR, bayWidth: 40, windowWidth: 0.995, pattern: 'strips' }),
    // the podium's grey and white louvres, finely scattered
    louvres: kit.facadeMaterial({ wall: C.louvre, window: C.louvreGap, floorHeight: 1.6, bayWidth: 0.8, pattern: 'scatter', scatter: { density: 0.45, top: 0.45, ramp: [0, 1], length: 2, seed: 7 } }),
    white: kit.material(C.white, { roughness: 0.6 }), glass: kit.glassMaterial(C.dark), green: kit.material(C.green),
    paving: kit.material(C.paving), copper: kit.material(C.copper, { roughness: 0.6, metalness: 0.3 }),
    pool: kit.material(C.pool, { roughness: 0.2 }), roof: kit.roofMaterial()
  };

  // --- the plan ------------------------------------------------------------------------------------------------------
  const T = extent(ring(ID.offices)); // the tower's whole plan
  const resRing = ring(ID.residence).map(uvOf).sort((a, b) => a[1] - b[1]);
  const vR = (resRing[0][1] + resRing[1][1]) / 2; // the residence's south face
  const vSeam = vR - SEAM; // the south block's north face
  const vNt = T.v1 - NORTH_STEP; // the top 30 m's north face
  const hotelPlan = extent(ring(ID.hotel));
  const podium = ring(ID.podium);
  const podiumWest = cut(podium, U, T.u0, true), towerSite = cut(podium, U, T.u0);
  if (podiumWest.length < 3 || towerSite.length < 3 || vSeam - T.v0 < 12) throw new Error('Guoco Tower: the parts are not where they are mapped');

  // --- the podium (west of the tower): the set-back ground storey, the car park in louvres, the glass top storey and
  // its roof garden; the hotel's pool deck on it south of the hotel ------------------------------------------------------
  kit.prism({ ring: podiumWest, y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: 'podium-paving' });
  kit.prism({ ring: kit.inset(podiumWest, 2.5), y0: 0, y1: H.retail, material: M.glass, top: M.roof, name: 'podium-retail' });
  kit.prism({ ring: podiumWest, y0: H.retail, y1: H.carpark, material: M.louvres, top: M.roof, name: 'podium-car-park' });
  kit.prism({ ring: podiumWest, y0: H.carpark, y1: H.podium, material: M.fins, top: M.green, name: 'podium-glass-storey' });
  kit.collisionPrism({ ring: podiumWest, y0: H.retail, y1: H.podium });
  const P0 = extent(podiumWest);
  const deck = rect(hotelPlan.u0 + 3, P0.v0 + 6, hotelPlan.u1 - 4, hotelPlan.v0 - 3);
  kit.prism({ ring: deck, y0: H.podium, y1: H.podium + 0.15, material: M.paving, top: M.paving, name: 'podium-deck' });
  kit.prism({ ring: rect(hotelPlan.u0 + 7, P0.v0 + 9, hotelPlan.u1 - 12, P0.v0 + 15), y0: H.podium, y1: H.podium + 0.25, material: M.pool, top: M.pool, name: 'podium-pool' });

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.1), segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.green, top: M.green, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.green, top: M.green, name: `${name}-tree-crown-top` });
  }
  // the roof garden: trees along the podium's south edge and in the strip west of the hotel
  const garden = [[P0.u0 + 5, P0.v0 + 3.2], [T.u0 - 36.5, P0.v0 + 3.2], [T.u0 - 25.5, P0.v0 + 2.8], [T.u0 - 14.5, P0.v0 + 3], [T.u0 - 4.5, P0.v0 + 3.4],
    [P0.u0 + 5, T.v0 + 17.7], [P0.u0 + 4.5, T.v0 + 32.7], [P0.u0 + 5, T.v0 + 46.7]];
  garden.forEach(([u, v], k) => { const [x, z] = P(u, v); tree(x, z, H.podium, 6, 2, `podium-roof-${k}`); });

  // --- the Sofitel: a free-standing glass slab on the podium, banded floor by floor, its west end a white wall rising
  // into the crown; the crown a screen round the roof with the name on its south face ---------------------------------------
  const hu1 = hotelPlan.u1 - 1; // its east face drawn a little in from the tower
  const hotel = rect(hotelPlan.u0, hotelPlan.v0, hu1, hotelPlan.v1);
  kit.prism({ ring: hotel, y0: H.podium, y1: H.hotel, material: M.hotel, edgeMaterial: faces({ [W]: M.white }), top: M.roof, name: 'hotel-body' });
  kit.collisionPrism({ ring: hotel, y0: H.podium, y1: H.hotel });
  kit.prism({ ring: rect(hotelPlan.u0, hotelPlan.v0, hotelPlan.u0 + 0.8, hotelPlan.v1), y0: H.hotel, y1: H.hotelTop, material: M.white, top: M.white, name: 'hotel-wall-w' });
  kit.prism({ ring: rect(hotelPlan.u0 + 0.8, hotelPlan.v0, hu1, hotelPlan.v0 + 0.4), y0: H.hotel, y1: H.hotelTop, material: M.hotel, top: M.white, name: 'hotel-screen-s' });
  kit.prism({ ring: rect(hotelPlan.u0 + 0.8, hotelPlan.v1 - 0.4, hu1, hotelPlan.v1), y0: H.hotel, y1: H.hotelTop, material: M.hotel, top: M.white, name: 'hotel-screen-n' });
  kit.prism({ ring: rect(hu1 - 0.4, hotelPlan.v0 + 0.4, hu1, hotelPlan.v1 - 0.4), y0: H.hotel, y1: H.hotelTop, material: M.hotel, top: M.white, name: 'hotel-screen-e' });

  // --- the tower ---------------------------------------------------------------------------------------------------
  // its paving, the lobby set back 2 m under the east, south and north faces, the drop-off canopy on the east
  kit.prism({ ring: towerSite, y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: 'tower-paving' });
  kit.prism({ ring: rect(T.u0 + 0.1, T.v0 + 2, T.u1 - 2, T.v1 - 2), y0: 0, y1: H.lobby, material: M.glass, top: M.roof, name: 'tower-lobby' });
  const drop = rect(T.u1, T.v0 + 5, T.u1 + 3.9, vSeam - 1);
  kit.prism({ ring: drop, y0: H.dropOff, y1: H.dropOff + 0.6, material: M.roof, top: M.roof, name: 'tower-drop-off-canopy' });
  kit.collisionPrism({ ring: drop, y0: H.dropOff, y1: H.dropOff + 0.6 });
  for (const [k, v] of [T.v0 + 6.5, vSeam - 2.5].entries()) {
    const [x, z] = P(T.u1 + 3.3, v);
    kit.cylinder({ x, z, y0: PAVING, y1: H.dropOff, r: 0.3, segments: 8, material: M.white, top: M.white, name: `tower-drop-off-column-${k}` });
  }
  // the offices' south block: over the lobby the podium's car park in its louvres (toward the City Room and the hotel),
  // glass toward the drop-off; then the offices, the south face leaning in as it rises, ledges across it, fins on its
  // ends
  const southBase = rect(T.u0, T.v0, T.u1, vSeam);
  kit.prism({ ring: southBase, y0: H.lobby, y1: H.podium, material: M.louvres, edgeMaterial: faces({ [E]: M.fins }), top: M.roof, name: 'tower-south-base' });
  kit.collisionPrism({ ring: southBase, y0: H.lobby, y1: H.podium });
  const southTop = [P(T.u0, T.v0 + TAPER), P(T.u1, T.v0 + TAPER), P(T.u1, vSeam), P(T.u0, vSeam)];
  kit.loft({ ring: southBase, topRing: southTop, y0: H.podium, y1: H.offices, material: M.fins, edgeMaterial: faces({ [S]: M.ledges }), top: M.paving, name: 'tower-south-block' });
  const mid = H.podium + (H.offices - H.podium) / 2;
  kit.collisionPrism({ ring: southBase, y0: H.podium, y1: mid });
  kit.collisionPrism({ ring: rect(T.u0, T.v0 + TAPER * 0.52, T.u1, vSeam), y0: mid, y1: H.offices });
  // the seam between the slabs, set back from the east and west faces, up to 166 m
  const seam = rect(T.u0 + 1.5, vSeam, T.u1 - 1.5, vR);
  kit.prism({ ring: seam, y0: H.lobby, y1: H.seam, material: M.fins, top: M.roof, name: 'tower-seam' });
  kit.collisionPrism({ ring: seam, y0: H.lobby, y1: H.seam });
  // the north block: offices to 165 m, the dark sky band set back over them, the residence to 250 m, then the top 30 m
  // stepped back on the north
  const north = rect(T.u0, vR, T.u1, T.v1), band = kit.inset(north, 1.2), top = rect(T.u0, vR, T.u1, vNt);
  kit.prism({ ring: north, y0: H.lobby, y1: H.northOffices, material: M.fins, edgeMaterial: faces({ [N]: M.ledges }), top: M.roof, name: 'tower-north-offices' });
  kit.collisionPrism({ ring: north, y0: H.lobby, y1: H.northOffices });
  kit.prism({ ring: band, y0: H.northOffices, y1: H.band, material: M.glass, top: M.roof, name: 'tower-sky-band' });
  kit.collisionPrism({ ring: band, y0: H.northOffices, y1: H.band });
  kit.prism({ ring: north, y0: H.band, y1: H.step, material: M.grid, edgeMaterial: faces({ [S]: M.ledges, [N]: M.ledges }), top: M.roof, name: 'tower-residence' });
  kit.collisionPrism({ ring: north, y0: H.band, y1: H.step });
  kit.prism({ ring: top, y0: H.step, y1: H.roof, material: M.grid, edgeMaterial: faces({ [S]: M.ledges, [N]: M.ledges }), top: M.roof, name: 'tower-top' });
  kit.collisionPrism({ ring: top, y0: H.step, y1: H.roof });

  // the residents' pergola on the south block's roof: posts along its south and north edges, a white frame over them,
  // the pool and planters on the deck under it
  const vSt = T.v0 + TAPER; // the south face's top
  const span = 8, us = Array.from({ length: span + 1 }, (_, i) => T.u0 + 0.5 + ((T.u1 - T.u0 - 1) * i) / span);
  const beam = (from, to, w, h, name, material = M.white) => kit.beam({ from, to, w, h, material, name });
  const at3 = (u, v, y) => { const [x, z] = P(u, v); return [x, y, z]; };
  us.forEach((u, i) => {
    beam(at3(u, vSt + 0.5, H.offices), at3(u, vSt + 0.5, H.pergola), 0.4, 0.4, `pergola-post-s-${i}`);
    beam(at3(u, vSeam - 0.5, H.offices), at3(u, vSeam - 0.5, H.pergola), 0.4, 0.4, `pergola-post-n-${i}`);
    beam(at3(u, vSt + 0.5, H.pergola - 0.3), at3(u, vSeam - 0.5, H.pergola - 0.3), 0.5, 0.6, `pergola-rafter-${i}`);
  });
  for (const [k, v] of [vSt + 0.5, vSeam - 0.5].entries()) beam(at3(us[0], v, H.pergola - 0.3), at3(us[span], v, H.pergola - 0.3), 0.5, 0.6, `pergola-beam-${k}`);
  kit.prism({ ring: rect(T.u0 + 8, vSt + 3, T.u1 - 8, vSt + 7), y0: H.offices, y1: H.offices + 0.25, material: M.pool, top: M.pool, name: 'office-roof-pool' });
  for (const [k, [u0, u1]] of [[T.u0 + 3, T.u0 + 6], [T.u1 - 6, T.u1 - 3]].entries()) {
    kit.prism({ ring: rect(u0, vSt + 2.5, u1, vSeam - 2.5), y0: H.offices, y1: H.offices + 0.6, material: M.green, top: M.green, name: `office-roof-planter-${k}` });
  }

  // the residence's south face: four stacks of balconies, each broken twice, the breaks stepping up from column to
  // column; slots of recessed balconies down the middle of its east and west faces
  const COL = 11, GAP = (T.u1 - T.u0 - 3 - 4 * COL) / 3;
  for (let k = 0; k < 4; k++) {
    const u0 = T.u0 + 1.5 + k * (COL + GAP), breaks = [196 + 6 * k, 232 + 6 * k];
    let y = H.band + 3, j = 0;
    for (const b of [...breaks, 252]) {
      const y1 = Math.min(b, 252);
      if (y1 - y >= 5) {
        const r = rect(u0, vR - 1.6, u0 + COL, vR);
        kit.prism({ ring: r, y0: y, y1, material: M.balcony, top: M.white, name: `balcony-${k}-${j++}` });
        kit.collisionPrism({ ring: r, y0: y, y1 });
      }
      y = b + 7;
    }
  }
  const vMid = (vR + T.v1) / 2;
  kit.prism({ ring: rect(T.u1, vMid - 1.5, T.u1 + 0.15, vMid + 1.5), y0: H.band + 4, y1: 258, material: M.balcony, top: M.white, name: 'tower-slot-e' });
  kit.prism({ ring: rect(T.u0 - 0.15, vMid - 1.5, T.u0, vMid + 1.5), y0: H.band + 4, y1: 258, material: M.balcony, top: M.white, name: 'tower-slot-w' });

  // --- the crown -----------------------------------------------------------------------------------------------------
  // the sawtooth: eight glass fins standing on the roof's south edge, each rising from 281.4 m at its west end to the top
  // at its east end; a white fin at every fold, down the face to the balconies' tops (or, in the gaps between the stacks
  // and at the corners, further)
  const TEETH = 8, w = (T.u1 - T.u0) / TEETH;
  for (let k = 0; k < TEETH; k++) {
    const r = rect(T.u0 + k * w, vR, T.u0 + (k + 1) * w, vR + 0.45);
    kit.prism({ ring: r, y0: H.roof, y1: kit.sloped(r, H.top, H.top - H.roof - 1.4, 264), material: M.fins, top: M.white, name: `crown-tooth-${k}` });
  }
  const finFoot = [240, 253, 232, 253, 236, 253, 234, 253, 240];
  for (let k = 0; k <= TEETH; k++) {
    const u = T.u0 + k * w, u0 = Math.max(T.u0, u - 0.35), u1 = Math.min(T.u1, u + 0.35);
    kit.prism({ ring: rect(k === TEETH ? T.u1 - 0.7 : u0, vR - 0.6, k === 0 ? T.u0 + 0.7 : u1, vR), y0: finFoot[k], y1: H.top, material: M.white, top: M.white, name: `crown-fin-${k}` });
  }
  // the screens round the other three sides, the grid carried on past the roof
  kit.prism({ ring: rect(T.u1 - 0.4, vR + 0.45, T.u1, vNt), y0: H.roof, y1: H.top, material: M.grid, top: M.white, name: 'crown-screen-e' });
  kit.prism({ ring: rect(T.u0 + 0.4, vNt - 0.4, T.u1 - 0.4, vNt), y0: H.roof, y1: H.top, material: M.ledges, top: M.white, name: 'crown-screen-n' });
  kit.prism({ ring: rect(T.u0, vR + 0.45, T.u0 + 0.4, vNt), y0: H.roof, y1: H.top, material: M.grid, top: M.white, name: 'crown-screen-w' });
  // the sky frame: a dark opening three storeys tall across most of the east face, a white tray projecting at its foot
  // with a glass balustrade, a white lintel over it
  const vc = (vR + vNt) / 2;
  kit.prism({ ring: rect(T.u1, vc - 7.25, T.u1 + 0.15, vc + 7.25), y0: H.frame, y1: H.frameTop, material: M.glass, top: M.glass, name: 'crown-sky-frame' });
  const tray = rect(T.u1, vc - 7.75, T.u1 + 2.4, vc + 7.75);
  kit.prism({ ring: tray, y0: H.frame - 0.9, y1: H.frame, material: M.white, top: M.white, name: 'crown-sky-tray' });
  kit.collisionPrism({ ring: tray, y0: H.frame - 0.9, y1: H.frame });
  kit.prism({ ring: rect(T.u1 + 2.2, vc - 7.75, T.u1 + 2.4, vc + 7.75), y0: H.frame, y1: H.frame + 1.1, material: M.glass, top: M.glass, name: 'crown-sky-balustrade' });
  kit.prism({ ring: rect(T.u1, vc - 7.75, T.u1 + 0.6, vc + 7.75), y0: H.frameTop, y1: H.frameTop + 0.8, material: M.white, top: M.white, name: 'crown-sky-lintel' });

  // --- the City Room: the solar glass canopy at 15 m over the paved room, on copper trees each branching four ways,
  // copper rafters and a fascia round it ----------------------------------------------------------------------------------
  const ROOM = { u0: T.u0 - 1, u1: T.u1 + 1, v0: T.v0 - ROOM_GAP - ROOM_DEPTH, v1: T.v0 - ROOM_GAP };
  const room = rect(ROOM.u0, ROOM.v0, ROOM.u1, ROOM.v1);
  kit.prism({ ring: room, y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: 'city-room-paving' });
  kit.prism({ ring: room, y0: H.cityRoom, y1: H.cityRoom + 0.6, material: M.glass, top: M.glass, name: 'city-room-canopy' });
  kit.collisionPrism({ ring: room, y0: H.cityRoom, y1: H.cityRoom + 0.6 });
  const TRUNK = 8, BRANCH = 0.5;
  let t = 0;
  for (let i = 0; i < 3; i++) for (const v of [ROOM.v0 + 8, (ROOM.v0 + ROOM.v1) / 2, ROOM.v1 - 8]) {
    const u = ROOM.u0 + ((i + 0.5) * (ROOM.u1 - ROOM.u0)) / 3, [x, z] = P(u, v), name = `city-room-tree-${t++}`;
    kit.cylinder({ x, z, y0: PAVING, y1: TRUNK, r: 0.55, segments: 10, material: M.copper, top: M.copper, name });
    [[-5.5, -4.5], [5.5, -4.5], [5.5, 4.5], [-5.5, 4.5]].forEach(([du, dv], j) => {
      // each branch up to the canopy's underside, its top edge just touching it
      const [ex, ez] = P(u + du, v + dv), level = Math.hypot(ex - x, ez - z) / Math.hypot(ex - x, H.cityRoom - TRUNK, ez - z);
      kit.beam({ from: [x, TRUNK, z], to: [ex, H.cityRoom - (level * BRANCH) / 2, ez], w: BRANCH, h: BRANCH, material: M.copper, name: `${name}-branch-${j}` });
    });
  }
  const fascia = H.cityRoom + 0.45;
  room.forEach((a, i) => { const b = room[(i + 1) % 4]; kit.beam({ from: [a[0], fascia, a[1]], to: [b[0], fascia, b[1]], w: 0.5, h: 0.8, material: M.copper, name: `city-room-fascia-${i}` }); });
  for (let k = 1; k < 10; k++) {
    const u = ROOM.u0 + (k * (ROOM.u1 - ROOM.u0)) / 10, [ax, az] = P(u, ROOM.v0), [bx, bz] = P(u, ROOM.v1);
    kit.beam({ from: [ax, H.cityRoom + 0.75, az], to: [bx, H.cityRoom + 0.75, bz], w: 0.35, h: 0.3, material: M.copper, name: `city-room-rafter-${k}` });
  }

  // --- signs -----------------------------------------------------------------------------------------------------------
  // GuocoLand's red mark near the top of the residence's south face at its west end, between the corner fin and the next
  const wall = kit.wallToward(top, 174);
  const [mx, mz] = P(T.u0 + w / 2, vR - 0.35);
  kit.sign({ logo: LOGOS.guocoland, x: mx, z: mz, yTop: H.roof - 1, yaw: wall.yaw, height: 5.6, name: 'sign:guocoland' });
  // the Sofitel's name in gold capitals across the top of its south face
  kit.hang({ ring: hotel, top: H.hotelTop, toward: 174, below: 0.5, out: 0.3, text: 'S  O  F  I  T  E  L', height: 4.4, maxWidth: 34, color: C.gold, font: '700 110px "Century Gothic", Futura, "Segoe UI", sans-serif', name: 'sign:sofitel' });
}
