// js/landmark-models/six-battery-road.js
// Six Battery Road, Raffles Place, the former Standard Chartered Bank Building (P&T Group with RSP Architects
// Planners & Engineers, Meinhardt engineers; completed 1983 and opened in October 1984; the podium re-clad by DP
// Architects in 2022): OSM ways 172916311 (the site's outline, mapped as a four-storey podium) and 106193384 (the tower,
// 42 levels, 174 m). Neighbours stay the city's: the Bank of China's buildings to the east, the porte-cochère's canopy
// over the drop-off on Battery Road (way 1511182439), Singapore Land Tower, UOB Plaza and MYP Centre.
// A sheer prism of brown Baltic granite on an elongated hexagon with every corner at 120°: long faces west and east
// (45.4 m), its ends angled to the Singapore River (22.7 m) and to Battery Road (22.7 m), the short faces south-west
// and north-east (11.35 m) — four, two and one bays of 11.35 m. Each bay is a group of five panes of green-tinted glass
// in a band half a storey high, between narrow granite piers; 42 storeys of them up to 165 m, then a plain granite crown
// of two plant floors to the flat roof at 174 m. The lobbies on the river and on Battery Road are glazed two storeys
// high; a blank storey about 15–20 m up carries Standard Chartered's mark toward both. West of the tower, the podium to
// Bonham Street, re-clad in 2022 in folded, fritted, translucent glass on both frontages and over its roof's edge:
// lifted over a recessed glazed ground floor on Battery Road, down to the promenade on the river but for the linkway's
// door and the riverside pavilion; a garden on the roof inside the glass rim. In the wedges between the tower and the
// Bank of China: a five-storey granite block on the river (a tree on its roof) and a low glazed one on Battery Road.
// Heights: 174 m and 44 floors (CTBUH, Wikipedia; 42 office storeys per CapitaLand), so a storey of 3.95 m: 37 rows
// over the podium and a 9 m crown band, as the 2015 photograph from Elgin Bridge (Commons) shows them; the window groups
// measured on it and on DP Architects' riverside photographs of 2023; the podium's 22.5 m, the skin's levels and the
// river block's 19.75 m measured on DP Architects' photographs against the tower's storeys; the low east block's 6.5 m
// (night photographs of Battery Road), the folds' depths, the roof garden and the pavilion are estimated.
// See docs/six-battery-road.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Six Battery Road', height: 174 };

const ID = { outline: 172916311, tower: 106193384 };
const FACE = { w: 275, sw: 215, sse: 155, e: 95, ne: 35, nnw: 335 }; // the tower's faces' outward bearings
const BAY = 11.35; // the hexagon's unit: its sides 4, 1, 2, 4, 1 and 2 bays; a bay holds one window group
const CELL = BAY / 6; // a pane: five to a group, the sixth the pier between groups
const S3 = Math.sqrt(3) / 2;
// heights (m): the glazed lobbies; the storey with its row of windows over them; the blank storey under the first of
// the 37 rows of the shaft; the shaft's top (over the 42nd storey's windows) and the crown's roof; the parapet; the
// podium's skin from its feet on Battery Road (7.2) and on the river (4.5, the linkway's door 8.5), its folds (14.5,
// 13), its rim and the garden's deck; the granite block on the river (five of the tower's storeys) and the low glazed
// one on Battery Road
const H = {
  lobby: 11, low: 15.2, blank: 20.6, shaft: 165.1, roof: 173.2, top: 174,
  skinBattery: 7.2, foldBattery: 14.5, skinRiver: 4.5, door: 8.5, foldRiver: 13, rim: 22.5, deck: 19.5, ne: 19.75, east: 6.5
};
const STOREY = 3.95;
// the drawing (m) about the mapped tower's middle, u toward the river end along the long faces (bearing 5°), v across
// toward the east face (95°): the hexagon's corners — A the river face's west end, then clockwise F, E, D (Battery
// Road's east end), C, B. The podium follows the mapped outline's own corners (OUTLINE: each the outline's point
// furthest toward its bearing): P1 on Battery Road and P2 on the river at the Bank of China, P3 at the river and
// Bonham Street, P4 and P5 the chamfer at Bonham Street and Battery Road.
const A = [1.75 * BAY, -1.5 * S3 * BAY], F = [2.75 * BAY, 0.5 * S3 * BAY], E = [2.25 * BAY, 1.5 * S3 * BAY];
const D = [-1.75 * BAY, 1.5 * S3 * BAY], C = [-2.75 * BAY, -0.5 * S3 * BAY], B = [-2.25 * BAY, -1.5 * S3 * BAY];
const OUTLINE = { P1: 95, P2: 5, P3: 300, P4: 245, P5: 185 };
// colours from daylight photographs (Commons 2015, DP Architects 2023, CapitaLand): the brown granite, the
// green-tinted panes; the lobbies' dark glass in dark frames; the skin's frosted panes in silver joints; the roofs; the
// granite paving; the gardens; the pavilion's white roof
const COL = {
  granite: 0x7a6352, glass: 0x7aa8a4, lobby: 0x2e3c44, lobbyFrame: 0x4b4945, skin: 0xe0e6e6, skinJoint: 0xf6f7f7,
  roof: 0x8d877f, paving: 0xaca398, leaf: 0x4f7d3a, trunk: 0x6b5a48, white: 0xeef1f1
};

// 2-D helpers in the drawing
const add = (p, q, s = 1) => [p[0] + q[0] * s, p[1] + q[1] * s];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const len = (p) => Math.hypot(p[0], p[1]);
const unit = (p) => { const L = len(p); return [p[0] / L, p[1] / L]; };
// where the line through p along d meets the line through q along e
const meet = (p, d, q, e) => { const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / (d[0] * e[1] - d[1] * e[0]); return add(p, d, t); };

export function build(kit, site) {
  const mapped = site.parts.find((p) => p.id === ID.tower)?.ring, outline = site.parts.find((p) => p.id === ID.outline)?.ring;
  if (!mapped?.length || !outline?.length) throw new Error(`Six Battery Road needs mapped ways ${ID.tower} and ${ID.outline}`);
  const M = {
    granite: kit.material(COL.granite, { roughness: 0.55 }),
    // the window groups: five panes a storey apart in the granite, a pier the width of a sixth between groups
    pane: kit.facadeMaterial({ wall: COL.granite, window: COL.glass, floorHeight: STOREY, bayWidth: CELL, windowWidth: 0.92, windowHeight: 0.5, pattern: 'punched', roughness: 0.55 }),
    lobby: kit.facadeMaterial({ wall: COL.lobbyFrame, window: COL.lobby, floorHeight: 5.5, bayWidth: 1.8, pattern: 'curtain' }),
    // the skin: frosted, fritted panes 1.25 m wide between bright joints, no transoms
    skin: kit.facadeMaterial({ wall: COL.skinJoint, window: COL.skin, floorHeight: 40, bayWidth: 1.25, windowWidth: 0.93, pattern: 'strips', roughness: 0.4 }),
    roof: kit.material(COL.roof, { roughness: 0.9 }), paving: kit.material(COL.paving), leaf: kit.material(COL.leaf),
    trunk: kit.material(COL.trunk), white: kit.material(COL.white, { roughness: 0.5 })
  };

  // --- the frame: the mapped hexagon's middle, the long faces' bearing -------------------------------------------------
  const centre = mapped.reduce((s, p) => add(s, p, 1 / mapped.length), [0, 0]);
  const U = kit.compass(5), V = kit.compass(95);
  const P = ([u, v]) => [centre[0] + U[0] * u + V[0] * v, centre[1] + U[1] * u + V[1] * v];
  const toUV = ([x, z]) => [(x - centre[0]) * U[0] + (z - centre[1]) * U[1], (x - centre[0]) * V[0] + (z - centre[1]) * V[1]];
  const world = (ring) => ring.map(P);
  // a solid off the ground is solid to fly into as well (the ground's are by themselves, as walls)
  const solid = (part, y1 = part.y1) => { kit.collisionPrism({ ring: part.ring, y0: part.y0, y1 }); return part; };

  // the tower's end faces' direction (toward the Bank of China) and the inward normals of the river and Battery Road
  const dR = [0.5, S3], inRiver = [-S3, 0.5], inBattery = [S3, -0.5]; // bearings 65°, 155° and 335°
  // the outline's corners, and its lines along the river, Battery Road and Bonham Street: each with its direction
  // toward Bonham Street (or along it, toward Battery Road) and its normal into the site
  const outUV = outline.map(toUV);
  const extreme = (deg) => { const a = ((deg - 5) * Math.PI) / 180, d = [Math.cos(a), Math.sin(a)]; return outUV.reduce((b, p) => (p[0] * d[0] + p[1] * d[1] > b[0] * d[0] + b[1] * d[1] ? p : b)); };
  const { P1, P2, P3, P4, P5 } = Object.fromEntries(Object.entries(OUTLINE).map(([k, deg]) => [k, extreme(deg)]));
  const lineOf = (p, q, inward) => { const d = unit(sub(q, p)); let n = [-d[1], d[0]]; if (n[0] * inward[0] + n[1] * inward[1] < 0) n = [-n[0], -n[1]]; return { p, d, n, out: [-n[0], -n[1]] }; };
  const river = lineOf(P2, P3, inRiver), battery = lineOf(P1, P5, inBattery), bonham = lineOf(P3, P4, [0, 1]);
  const along = (line, d) => ({ ...line, p: add(line.p, line.n, d) }); // the line moved d m into the site
  const cross = (l, m) => meet(l.p, l.d, m.p, m.d);
  const wFace = { p: A, d: [1, 0] }, swFace = { p: C, d: [0.5, -S3] }, chamfer = { p: P4, d: unit(sub(P5, P4)) };

  // --- the tower ----------------------------------------------------------------------------------------------------------
  // its hexagon, each side cut into window groups and piers, starting at the river face's first group (so that every
  // group starts on a whole pane: the faces are whole bays long)
  const hex = [A, F, E, D, C, B];
  const ring = [], glazed = [];
  [[A, F, 2], [F, E, 1], [E, D, 4], [D, C, 2], [C, B, 1], [B, A, 4]].forEach(([p, q, n]) => {
    const d = unit(sub(q, p));
    for (let k = 0; k < n; k++) {
      ring.push(add(p, d, k * BAY + CELL / 2)); glazed.push(true);
      ring.push(add(p, d, k * BAY + 5.5 * CELL)); glazed.push(false);
    }
    ring.push(q); glazed.push(false);
  });
  const windows = (i) => (glazed[i] ? M.pane : M.granite);
  // the lobbies: the river and Battery Road faces glazed two storeys high, 0.6 m behind the faces above
  const R = 0.6 / S3;
  const base = [add(A, [-R, 0]), add(F, [-0.5, S3], R), E, add(D, [R, 0]), add(C, [0.5, -S3], R), B];
  solid(kit.prism({ ring: world(base), y0: 0, y1: H.lobby, material: M.granite, edgeMaterial: (i) => (i === 0 || i === 3 ? M.lobby : M.granite), top: M.roof, name: 'tower-base' }));
  kit.prism({ ring: world([A, F, base[1], base[0]]), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-paving-river' });
  kit.prism({ ring: world([D, C, base[4], base[3]]), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-paving-battery' });
  // a storey of windows, the blank storey, the shaft of 37 rows, the crown
  solid(kit.prism({ ring: world(ring), y0: H.lobby, y1: H.low, material: M.granite, edgeMaterial: windows, top: M.roof, name: 'tower-low' }));
  solid(kit.prism({ ring: world(hex), y0: H.low, y1: H.blank, material: M.granite, top: M.roof, name: 'tower-blank' }));
  solid(kit.prism({ ring: world(ring), y0: H.blank, y1: H.shaft, material: M.granite, edgeMaterial: windows, top: M.roof, name: 'tower-shaft' }));
  solid(kit.prism({ ring: world(hex), y0: H.shaft, y1: H.roof, material: M.granite, top: M.roof, name: 'tower-crown' }), H.top);
  // the parapet round the flat roof and the plant on it
  const hexW = world(hex), inner = kit.inset(hexW, 0.45);
  hexW.forEach((p, i) => {
    const j = (i + 1) % 6;
    kit.prism({ ring: [p, hexW[j], inner[j], inner[i]], y0: H.roof, y1: H.top, material: M.granite, top: M.granite, name: `tower-parapet-${i}` });
  });
  kit.prism({ ring: kit.inset(hexW, 7), y0: H.roof, y1: H.top - 0.1, material: M.roof, top: M.roof, name: 'tower-roof-plant' });

  // --- the podium west of the tower --------------------------------------------------------------------------------------
  // the recessed core: its glazed ground floor 4 m behind the river line and 3 m behind Battery Road's, plain granite
  // toward Bonham Street (as it was in 2015); its roof the garden's deck
  const Ar = cross(river, wFace), Cb = cross(battery, swFace); // where the frontages meet the tower
  const Ain = cross(along(river, 4), wFace), P3in = cross(along(river, 4), bonham);
  const Cin = cross(along(battery, 3), swFace), P5in = cross(along(battery, 3), chamfer);
  const core = [Ain, P3in, P4, P5in, Cin, B];
  const coreEdge = [M.lobby, M.granite, M.granite, M.lobby, M.granite, M.granite];
  solid(kit.prism({ ring: world(core), y0: 0, y1: H.deck, material: M.granite, edgeMaterial: (i) => coreEdge[i], top: M.paving, name: 'podium-core' }));
  // the walks under the skin, paved over the city's lawn
  kit.prism({ ring: world([Ar, P3, P3in, Ain]), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'podium-walk-river' });
  kit.prism({ ring: world([Cb, P5, P5in, Cin]), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'podium-walk-battery' });

  // The skin: folded glass in two rows on each frontage, the folds' points along the outline pushed out by different
  // amounts at the foot, the fold and the top of each row, so that each panel breaks into two triangles. The lower rows
  // reach back to the core; the upper ones 6 m in, over the core's edge, their tops sloping down from the rim at the
  // front to the garden's deck.
  const ends = along(bonham, 0.15); // the skin's ends kept off the core's face toward Bonham Street
  const slope = (line) => (x, z) => {
    const [u, v] = toUV([x, z]);
    const d = (u - line.p[0]) * line.n[0] + (v - line.p[1]) * line.n[1];
    return H.rim - 2.8 * Math.min(1, Math.max(0, d / 6));
  };
  // a row of skin: outer stations (points on the outline) pushed out along their normals by `foot` and `head`, the
  // inner points behind them, from y0 to y1 (a height or a sloped top)
  const row = (name, outer, normals, inner, foot, head, y0, y1) => {
    const base = [...outer.map((p, k) => add(p, normals[k], foot[k])), ...inner.slice().reverse()];
    const top = [...outer.map((p, k) => add(p, normals[k], head[k])), ...inner.slice().reverse()];
    const part = kit.loft({ ring: world(base), topRing: world(top), y0, y1, material: M.skin, top: M.skin, name: `skin-${name}` });
    kit.collisionPrism({ ring: world(base), y0, y1: typeof y1 === 'function' ? H.rim : y1 });
    return part;
  };
  const pick = (a, i, j) => a.slice(i, j + 1);
  // the river: stations from the tower to Bonham Street; the linkway's door between the second and third
  const tR = [0, 3.5, 9.5, 15, 21, 27.5, len(sub(P3, Ar))];
  const oR = tR.map((t) => add(Ar, river.d, t)), nR = tR.map(() => river.out);
  const last = tR.length - 1;
  const iR4 = oR.map((p, k) => (k === 0 ? Ain : k === last ? cross(along(river, 4), ends) : add(p, river.n, 4)));
  const iR6 = oR.map((p, k) => (k === 0 ? cross(along(river, 6), wFace) : k === last ? cross(along(river, 6), ends) : add(p, river.n, 6)));
  // (out of the outline +, into it −: folds up to 1 m proud and 1.5 m deep, tilting the facets by up to 20°)
  const riverFoot = [0.1, -1.2, 0.9, -1.0, 0.8, -1.3, 0.1], riverFold = [-1.0, 0.9, -1.4, 1.0, -1.2, 0.9, -0.6], riverHead = [0.2, -1.3, 0.8, -1.5, 0.9, -1.2, 0.1];
  row('river-low-0', pick(oR, 0, 1), pick(nR, 0, 1), pick(iR4, 0, 1), pick(riverFoot, 0, 1), pick(riverFold, 0, 1), H.skinRiver, H.foldRiver);
  const doorFoot = riverFoot.map((f, k) => f + ((H.door - H.skinRiver) / (H.foldRiver - H.skinRiver)) * (riverFold[k] - f));
  row('river-door', pick(oR, 1, 2), pick(nR, 1, 2), pick(iR4, 1, 2), pick(doorFoot, 1, 2), pick(riverFold, 1, 2), H.door, H.foldRiver);
  row('river-low-1', pick(oR, 2, last), pick(nR, 2, last), pick(iR4, 2, last), pick(riverFoot, 2, last), pick(riverFold, 2, last), H.skinRiver, H.foldRiver);
  row('river-high', oR, nR, iR6, riverFold, riverHead, H.foldRiver, slope(river));
  // Battery Road: stations from the tower to Bonham Street, round the corner's chamfer
  const tB = [0, 6, 12.5, 19, 25.5, 32, len(sub(P5, Cb))];
  const chamferOut = (() => { const n = [-chamfer.d[1], chamfer.d[0]], m = [(P3[0] + P5[0]) / 2, (P3[1] + P5[1]) / 2]; return (P4[0] - m[0]) * n[0] + (P4[1] - m[1]) * n[1] > 0 ? n : [-n[0], -n[1]]; })();
  const oB = [...tB.map((t) => add(Cb, battery.d, t)), P4], nB = [...tB.map(() => battery.out), chamferOut];
  const lastB = tB.length - 1;
  const iB3 = [...tB.map((t, k) => (k === 0 ? Cin : k === lastB ? P5in : add(oB[k], battery.n, 3))), add(P4, unit(sub(P5in, P4)), 0.15)];
  const iB6 = [...tB.map((t, k) => (k === 0 ? cross(along(battery, 6), swFace) : add(oB[k], battery.n, 6))), cross(along(battery, 6), ends)];
  const batteryFoot = [0.1, -1.1, 0.8, 0.6, -1.2, 0.9, -0.4, 0.15], batteryFold = [-0.9, 0.8, -1.3, -0.8, 1.0, -1.2, 0.6, 0.3], batteryHead = [0.15, -1.2, 0.7, 0.9, -1.4, 0.8, -0.5, 0.15];
  row('battery-low', oB, nB, iB3, batteryFoot, batteryFold, H.skinBattery, H.foldBattery);
  row('battery-high', oB, nB, iB6, batteryFold, batteryHead, H.foldBattery, slope(battery));
  // a granite parapet along Bonham Street between the skin's ends
  const bA = add(cross(along(river, 6), bonham), bonham.d, 0.1), bB = add(cross(along(battery, 6), bonham), bonham.d, -0.1);
  kit.prism({ ring: world([bA, bB, add(bB, bonham.n, 0.4), add(bA, bonham.n, 0.4)]), y0: H.deck, y1: H.deck + 1.1, material: M.granite, top: M.granite, name: 'podium-parapet' });

  // the riverside pavilion near Bonham Street: a glass box under a folded white roof, in the walk under the skin
  const sn = (s, n) => add(add(Ar, river.d, s), river.n, n);
  const pav = [sn(27.5, 0.6), sn(33.3, 0.6), sn(33.3, 3.4), sn(27.5, 3.4)];
  kit.prism({ ring: world(pav), y0: 0.32, y1: 3.0, material: M.lobby, top: M.white, name: 'pavilion-box' });
  const eave = [sn(27.2, 0.3), sn(33.6, 0.3), sn(33.6, 3.7), sn(27.2, 3.7)];
  const fold = [sn(28.6, 1.6), sn(33.0, 0.9), sn(32.0, 2.6), sn(29.2, 3.0)];
  kit.loft({ ring: world(eave), topRing: world(fold), y0: 3.0, y1: 3.8, material: M.white, top: M.white, name: 'pavilion-roof' });

  // the roof garden on the deck: beds of shrubs in granite kerbs, small trees, clear of the skin's rim
  const tree = (at, y, h, r, name) => {
    const [x, z] = P(at), around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.45, r: 0.15, segments: 5, material: M.trunk, top: M.trunk, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.4, y1: y + h * 0.65, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.65, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  };
  const bed = 0.6;
  [[16, 9, 31, 19], [26, 21.5, 43, 30], [26, 32, 37, 39]].forEach(([s0, n0, s1, n1], k) => {
    kit.prism({ ring: world([sn(s0, n0), sn(s1, n0), sn(s1, n1), sn(s0, n1)]), y0: H.deck, y1: H.deck + bed, material: M.granite, top: M.leaf, name: `roof-garden-bed-${k}` });
  });
  [[20, 13], [26.5, 16], [34, 24], [39.5, 27], [30, 35.5], [34.5, 36]].forEach(([s, n], k) => tree(sn(s, n), H.deck + bed, 4.2 + (k % 3) * 0.5, 1.5, `roof-garden-${k}`));

  // --- the wedges between the tower and the Bank of China -----------------------------------------------------------------
  // on the river: a granite block of five storeys with windows to the river, a tree on its roof
  const ne = [E, P2, F];
  solid(kit.prism({ ring: world(ne), y0: 0, y1: H.ne, material: M.granite, edgeMaterial: (i) => (i === 1 ? M.pane : M.granite), top: M.paving, name: 'ne-block' }));
  const neMid = [(E[0] + P2[0] + F[0]) / 3, (E[1] + P2[1] + F[1]) / 3], [mx, mz] = P(neMid);
  kit.cylinder({ x: mx, z: mz, y0: H.ne, y1: H.ne + 0.6, r: 1.6, segments: 8, material: M.granite, top: M.leaf, name: 'ne-planter' });
  tree(neMid, H.ne + 0.6, 4, 1.4, 'ne');
  // on Battery Road: the lobby's glazed ground floor carried on east to the Bank of China under a flat roof
  const east = [D, P1, E];
  solid(kit.prism({ ring: world(east), y0: 0, y1: H.east, material: M.granite, edgeMaterial: (i) => (i === 0 ? M.lobby : M.granite), top: M.roof, name: 'east-block' }));

  // --- signs: Standard Chartered's mark on the blank storey, toward the river and over the drive on Battery Road ------------
  const SC = LOGOS['standard-chartered'];
  const patch = (corner, toward, inward, a, b) => world([add(corner, toward, a), add(corner, toward, b), add(add(corner, toward, b), inward, 1), add(add(corner, toward, a), inward, 1)]);
  kit.hang({ ring: patch(A, dR, inRiver, 0.3, 6.3), top: H.blank, toward: FACE.nnw, below: 0.7, out: 0.15, logo: SC, height: 4.4, name: 'sign:standard-chartered-river' });
  kit.hang({ ring: patch(C, dR, inBattery, 0.5, 7.5), top: H.blank, toward: FACE.sse, below: 0.5, out: 0.15, logo: SC, height: 4.8, name: 'sign:standard-chartered-battery' });
}
