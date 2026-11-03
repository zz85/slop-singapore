// js/landmark-models/one-raffles-quay.js
// One Raffles Quay, 1 Raffles Quay (Kohn Pedersen Fox with Architects 61 for Hongkong Land, Keppel Land and Cheung Kong,
// 2006): OSM ways 47345006 (the site outline, tagged 44 m: the cooling plant's height), 172915345 (the North Tower),
// 172915347 (the South Tower) and 852006596 (the South Tower's roof plant). The Sail's podium (47345007) across Marina
// View Link and 6 Raffles Quay (47345004) across Raffles Quay are not part of this site.
// Two glass towers of very different heights on one block between Raffles Quay, Marina Boulevard and Marina View Link.
// The 50-storey North Tower is turned 26° off the street grid (to clear the two MRT tunnels it straddles) and is a box
// with a front blade toward Collyer Quay and Raffles Place: the blade's ends stand proud of the side faces in narrow
// recessed slots, and it rises two storeys past their parapet as the "lantern" that crowns the front façade, a glass
// screen over a space frame. At its foot an eight-storey glass lobby over a recessed ground floor, a white raking member
// across its face to Raffles Quay. The 29-storey South Tower keeps to the grid, its front blade to Raffles Quay (a slot at
// its south-west corner, a lighter screen at the top), stone piers under its glass. Both are wrapped in pale aqua-green
// glass between fine silver mullions every 1.5 m. Between them the district cooling plant stands over a covered plaza and
// the drop-off: a block of staggered bronze louvres under a glass band, on stone columns, the building's name on a
// granite water trough before it. A grey stone block with a sloping glass roof fills the corner on Marina Boulevard;
// a stone podium wraps the South Tower's south and east sides, Deutsche Bank's name on its south face.
// Heights: 245 m to the lantern's top (CTBUH, Wikipedia), 139.9 m to the South Tower's top (CTBUH); the outline's 44 m
// taken as the cooling plant's glass band; the lobbies, parapets, plant, podiums and the plaza's soffit estimated from
// photographs (Heintges' elevation from Raffles Quay, Commons 2006–2026, KPF's dusk aerial) and the Esri aerial. The
// roof plant's mapped 146 m is not used: it is over the published 139.9 m tip. See docs/one-raffles-quay.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'One Raffles Quay', height: 245 };

const ID = { outline: 47345006, north: 172915345, south: 172915347, plant: 852006596 };
// heights (m): the North Tower's recessed ground floor, its eight-storey lobby, its roof deck, the side faces' parapet,
// the roof plant and its core, the lantern's top; the South Tower's lobby, the top of the car-park bands on its south and
// east faces, its roof deck, parapet, plant and its blade's top; the cooling plant's soffit over the plaza, its louvred
// block and its glass band; the podium, the Marina Boulevard block and its glass roof; the canopies
const H = {
  ntGround: 6, ntLobby: 38, ntRoof: 232, ntParapet: 236.5, ntPlant: 240, ntCore: 242.5, lantern: 245,
  stLobby: 10, stBands: 56, stRoof: 134, stParapet: 137.5, stPlant: 139, stTop: 139.9,
  dcpSoffit: 12, dcpTop: 40, dcpGlass: 44, podium: 22, block: 24, blockRoof: 30.8, canopy: 5.6, paving: 0.32
};
const STOREY = 4.6; // the office floors' floor to floor (the North Tower's 42 office storeys between 38 m and 232 m)
// colours from daylight photographs: pale aqua-green glass between fine pale silver mullions (a hairline each storey);
// the lantern and lobby glass lighter, in larger pale frames; grey louvre bands; the plant behind fine grey louvres; dark
// bronze louvres with light edges; light grey stone; polished dark granite and the recessed ground floor's dark glass
const C = {
  glass: 0x6cb5a7, mullion: 0xd9e1df, paleGlass: 0x9dd0c6, paleFrame: 0xe2e8e6, band: 0xa7aca9, louvre: 0x8e9694,
  louvreGap: 0x5d6766, alu: 0xe6e9e7, bronze: 0x6b5847, stone: 0xbcb8af, dark: 0x354346, paving: 0xcfc9bc, green: 0x5e8c46,
  name: 0xeceae4, deutsche: 0x0018a8
};

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const area = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return s / 2; };
// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  const s = area(ring) >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// Where a ring's edges cross the line z = value (or x = value): the least or greatest x (or z) of the crossings
function crossing(ring, axis, value, most) {
  const k = axis === 'z' ? 1 : 0, o = 1 - k, hits = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    if ((a[k] - value) * (b[k] - value) <= 0 && a[k] !== b[k]) hits.push(a[o] + ((b[o] - a[o]) * (value - a[k])) / (b[k] - a[k]));
  });
  if (!hits.length) throw new Error(`One Raffles Quay: nothing crosses ${axis} = ${value}`);
  return most ? Math.max(...hits) : Math.min(...hits);
}
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`One Raffles Quay needs mapped way ${id}`);
    return p.ring;
  };
  // the mapped point of a ring nearest to (x, z) in the city frame about the anchor (x toward 121.8°, the street grid's
  // east; z toward 211.8°), within 3 m: the drawing's corners are the mapped ones
  const near = (r, x, z, what) => {
    let best = null, d = Infinity;
    for (const p of r) { const k = Math.hypot(p[0] - x, p[1] - z); if (k < d) { d = k; best = p; } }
    if (d > 3) throw new Error(`One Raffles Quay: ${what} is not where it is mapped (${d.toFixed(1)} m off)`);
    return best;
  };
  const M = {
    // the curtain wall: aqua-green glass between fine mullions, a hairline each storey
    glass: kit.facadeMaterial({ wall: C.mullion, window: C.glass, floorHeight: STOREY, bayWidth: 1.5, windowWidth: 0.86, pattern: 'strips' }),
    // the lanterns and the lobby: lighter glass in larger pale frames
    pale: kit.facadeMaterial({ wall: C.paleFrame, window: C.paleGlass, floorHeight: 2.3, bayWidth: 1.5, pattern: 'curtain' }),
    // the South Tower's car-park storeys: a grey louvre band under each ribbon of glass
    bands: kit.facadeMaterial({ wall: C.band, window: C.glass, floorHeight: STOREY, bayWidth: 1.5, pattern: 'ribbon' }),
    // plant screens and the stone blocks' louvred panels: fine grey louvres
    louvre: kit.facadeMaterial({ wall: C.louvre, window: C.louvreGap, floorHeight: 0.7, bayWidth: 3, pattern: 'ribbon' }),
    alu: kit.material(C.alu, { roughness: 0.4, metalness: 0.3 }), bronze: kit.material(C.bronze, { roughness: 0.6, metalness: 0.25 }),
    stone: kit.material(C.stone), dark: kit.glassMaterial(C.dark), paving: kit.material(C.paving), green: kit.material(C.green, { roughness: 0.95 }),
    roof: kit.roofMaterial()
  };

  // --- the drawing: the mapped rings and their corners ------------------------------------------------------------------
  const outline = ring(ID.outline), north = ring(ID.north), south = ring(ID.south), plant = ring(ID.plant);
  // the North Tower: the front blade's corners (west, north), the slots' inner corners behind them, the side faces' ends
  // at the slots, the east and south corners
  const T = {
    e: near(north, 35.5, -64.3, "the North Tower's east corner"), eneEnd: near(north, 4.8, -79.5, "the North Tower's east slot"),
    slotN: near(north, 3.8, -77.5, "the North Tower's north slot"), n: near(north, -0.6, -81.6, "the North Tower's north corner"),
    w: near(north, -25.1, -31.6, "the North Tower's west corner"), slotW: near(north, -19.4, -30.6, "the North Tower's west slot"),
    wswEnd: near(north, -19.8, -29.3, "the North Tower's west slot's end"), s: near(north, 10.4, -14.0, "the North Tower's south corner")
  };
  const blade = [T.w, T.n, T.slotN, T.slotW]; // the front blade, 5.7 m deep
  const body = [T.wswEnd, T.s, T.e, T.eneEnd]; // the body behind it
  const towerN = [T.w, T.n, T.eneEnd, T.e, T.s, T.wswEnd]; // both, the slots filled
  // the South Tower: its corners, and the slot cut into its south face 3 m from the south-west corner
  const S = {
    nw: near(south, -26.5, 8.7, "the South Tower's north-west corner"), sw: near(south, -26.6, 57.4, "the South Tower's south-west corner"),
    se: near(south, 22.9, 60.7, "the South Tower's south-east corner"), ne: near(south, 21.4, 9.5, "the South Tower's north-east corner")
  };
  const towerS = [S.nw, S.sw, S.se, S.ne];
  const NS = normalsOf(towerS);
  const along = [(S.se[0] - S.sw[0]) / dist(S.sw, S.se), (S.se[1] - S.sw[1]) / dist(S.sw, S.se)], inward = [-NS[1][0], -NS[1][1]];
  const slot = (a, b) => [S.sw[0] + along[0] * a + inward[0] * b, S.sw[1] + along[1] * a + inward[1] * b];
  const southRing = [S.nw, S.sw, slot(3, 0), slot(3, 1.2), slot(4.2, 1.2), slot(4.2, 0), S.se, S.ne];
  const qn = lerp(S.nw, S.ne, 3 / dist(S.nw, S.ne));
  const bladeS = [S.nw, S.sw, slot(3, 0), qn]; // the front blade to Raffles Quay, 3 m deep
  const bodyS = [qn, slot(4.2, 0), S.se, S.ne];
  // the street lines: the South Tower's west face (Raffles Quay), the North Tower's south corner, the site's east edge
  const eastAt = (z) => crossing(outline, 'z', z, true);

  // --- the North Tower ----------------------------------------------------------------------------------------------------
  const slotWall = (r) => (i) => (dist(r[i], r[(i + 1) % r.length]) < 2.5 ? M.alu : null); // the slots' short returns, light
  // the ground floor, recessed 2.5 m under the lobby; the lobby's eight storeys of glass, lighter on the front; the shaft
  kit.prism({ ring: kit.inset(towerN, 2.5), y0: 0, y1: H.ntGround, material: M.dark, top: M.paving, name: 'north-ground' });
  const front = (i) => (north[i] === T.w && north[(i + 1) % north.length] === T.n) || (north[i] === T.n && north[(i + 1) % north.length] === T.w);
  kit.prism({ ring: north, y0: H.ntGround, y1: H.ntLobby, material: M.glass, edgeMaterial: (i) => (front(i) ? M.pale : slotWall(north)(i)), top: M.roof, name: 'north-lobby' });
  kit.prism({ ring: north, y0: H.ntLobby, y1: H.ntRoof, material: M.glass, edgeMaterial: slotWall(north), name: 'north-shaft' });
  kit.collisionPrism({ ring: towerN, y0: H.ntGround, y1: H.ntRoof });
  // the white raking member across the lobby's face to Raffles Quay, from the ground at its north end to the south corner
  // at the lobby's top (seen from Raffles Quay and inside the lobby), standing 0.2 m off the glass
  const NN = normalsOf(north), iw = north.indexOf(T.wswEnd), [wx, wz] = NN[iw];
  const rake = (t, y, off) => { const [x, z] = lerp(T.wswEnd, T.s, t); return [x + wx * off, y, z + wz * off]; };
  kit.beam({ from: rake(0.06, 1.3, 0.8), to: rake(0.95, H.ntLobby - 1, 0.8), w: 1.2, h: 3, material: M.alu, name: 'north-rake' });

  // the crown: the front blade rises as the lantern, a glass screen over a space frame (its top as the aerial shows it, a
  // band of louvres along the front), past the side faces' glass parapet round the roof deck; the plant on the deck
  kit.prism({ ring: blade, y0: H.ntRoof, y1: H.lantern, material: M.pale, edgeMaterial: slotWall(blade), top: M.louvre, name: 'north-lantern' });
  kit.collisionPrism({ ring: blade, y0: H.ntRoof, y1: H.lantern });
  const parapetIn = kit.inset(body, 0.6);
  for (let i = 0; i < 3; i++) {
    kit.prism({ ring: [body[i], body[i + 1], parapetIn[i + 1], parapetIn[i]], y0: H.ntRoof, y1: H.ntParapet, material: M.glass, top: M.alu, name: `north-parapet-${i}` });
  }
  kit.collisionPrism({ ring: body, y0: H.ntRoof, y1: H.ntParapet });
  kit.prism({ ring: kit.inset(body, 4.5), y0: H.ntRoof, y1: H.ntPlant, material: M.louvre, name: 'north-plant' });
  kit.prism({ ring: kit.inset(body, 11), y0: H.ntPlant, y1: H.ntCore, material: M.stone, name: 'north-plant-core' });

  // --- the South Tower ----------------------------------------------------------------------------------------------------
  // the lobby behind stone piers, the glass from 10 m: the car-park storeys' louvre bands on the south and east faces
  // (the slot's returns light), the offices over them
  kit.prism({ ring: kit.inset(towerS, 2), y0: 0, y1: H.stLobby, material: M.dark, top: M.paving, name: 'south-lobby' });
  const NSr = normalsOf(southRing), dir = (deg) => kit.compass(deg);
  const faces = (deg) => (i) => { const d = dir(deg); return NSr[i][0] * d[0] + NSr[i][1] * d[1] > 0.9; };
  const banded = (i) => {
    const L = dist(southRing[i], southRing[(i + 1) % southRing.length]);
    return L < 2.5 ? M.alu : L > 4 && (faces(211.8)(i) || faces(121.8)(i)) ? M.bands : null;
  };
  kit.prism({ ring: southRing, y0: H.stLobby, y1: H.stBands, material: M.glass, edgeMaterial: banded, top: M.roof, name: 'south-shaft-low' });
  kit.prism({ ring: southRing, y0: H.stBands, y1: H.stRoof, material: M.glass, edgeMaterial: slotWall(southRing), name: 'south-shaft' });
  kit.collisionPrism({ ring: towerS, y0: H.stLobby, y1: H.stRoof });
  // stone piers about every 7.7 m along the faces to Raffles Quay and to the plaza, flush with the glass over them
  const piers = (i, label) => {
    const a = towerS[i], b = towerS[(i + 1) % 4], [nx, nz] = NS[i];
    const L = dist(a, b), n = Math.max(1, Math.round(L / 7.7)), yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    for (let k = 0; k <= n - (label === 'north' ? 1 : 0); k++) {
      const [x, z] = lerp(a, b, Math.min(0.985, Math.max(0.015, k / n)));
      kit.box({ x: x - nx * 0.6, z: z - nz * 0.6, y: 0, w: 1.2, h: H.stLobby, d: 1.2, yaw, material: M.stone, top: M.stone, name: `south-pier-${label}-${k}` });
    }
  };
  piers(0, 'west');
  piers(3, 'north');
  // the crown: the blade's lighter screen to the top, the glass parapet round the deck, the plant behind it (on its
  // mapped plan, kept under the published top)
  kit.prism({ ring: bladeS, y0: H.stRoof, y1: H.stTop, material: M.pale, edgeMaterial: slotWall(bladeS), top: M.alu, name: 'south-lantern' });
  kit.collisionPrism({ ring: bladeS, y0: H.stRoof, y1: H.stTop });
  const parapetS = kit.inset(bodyS, 0.5);
  for (let i = 1; i < 4; i++) {
    const j = (i + 1) % 4;
    kit.prism({ ring: [bodyS[i], bodyS[j], parapetS[j], parapetS[i]], y0: H.stRoof, y1: H.stParapet, material: M.glass, top: M.alu, name: `south-parapet-${i}` });
  }
  kit.collisionPrism({ ring: bodyS, y0: H.stRoof, y1: H.stParapet });
  kit.prism({ ring: plant, y0: H.stRoof, y1: H.stPlant, material: M.louvre, name: 'south-plant' });

  // --- the district cooling plant over the plaza and the drop-off --------------------------------------------------------
  // from 1.5 m behind the South Tower's face to Raffles Quay to a metre inside the site's east edge, from the South
  // Tower's north face to the North Tower's south corner
  const zN = T.s[1] + 0.5, dcpW = S.nw[0] + 1.5;
  const onNorthFace = (x) => lerp(S.nw, S.ne, (x - S.nw[0]) / (S.ne[0] - S.nw[0]))[1];
  const dcp = [[dcpW, zN], [eastAt(zN) - 1, zN], [eastAt(S.ne[1]) - 1, S.ne[1]], S.ne, [dcpW, onNorthFace(dcpW)]];
  kit.prism({ ring: dcp, y0: H.dcpSoffit, y1: H.dcpTop, material: M.bronze, top: M.roof, name: 'plant-block' });
  kit.collisionPrism({ ring: dcp, y0: H.dcpSoffit, y1: H.dcpGlass });
  // the louvres' light edges, staggered row by row along the three open faces
  const ND = normalsOf(dcp);
  [[0, 'north'], [1, 'east'], [4, 'west']].forEach(([i, label]) => {
    const a = dcp[i], b = dcp[(i + 1) % dcp.length], L = dist(a, b), [nx, nz] = ND[i], t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    let n = 0;
    for (let row = 0, y = H.dcpSoffit + 0.9; y < H.dcpTop - 0.6; row++, y += 0.95) {
      for (let s = 0.4 + hash(row, i, 1) * 7; s < L - 1.8;) {
        const len = Math.min(L - 0.4 - s, 3 + hash(row, n, i, 2) * 8);
        const p = [a[0] + t[0] * s + nx * 0.17, a[1] + t[1] * s + nz * 0.17], q = [a[0] + t[0] * (s + len) + nx * 0.17, a[1] + t[1] * (s + len) + nz * 0.17];
        if (len > 1.2) kit.beam({ from: [p[0], y, p[1]], to: [q[0], y, q[1]], w: 0.3, h: 0.14, material: M.stone, name: `plant-louvre-${label}-${n++}` });
        s += len + 1.5 + hash(row, n, i, 3) * 7;
      }
    }
  });
  // the glass band round its top, and the cooling towers inside it: grey cells under dark fan stacks
  const dcpIn = kit.inset(dcp, 1), dcpIn2 = kit.inset(dcp, 1.4);
  dcp.forEach((_, i) => {
    const j = (i + 1) % dcp.length;
    kit.prism({ ring: [dcpIn[i], dcpIn[j], dcpIn2[j], dcpIn2[i]], y0: H.dcpTop, y1: H.dcpGlass, material: M.pale, top: M.alu, name: `plant-glass-${i}` });
  });
  const cells = 6, cx0 = dcpW + 5, cx1 = eastAt(0) - 6, cz = (zN + onNorthFace(0)) / 2;
  for (let k = 0; k < cells; k++) {
    const x = cx0 + ((cx1 - cx0) * (k + 0.5)) / cells, w = (cx1 - cx0) / cells - 1.2;
    kit.box({ x, z: cz, y: H.dcpTop, w, h: 3, d: Math.min(w, 13), material: M.louvre, top: M.roof, name: `plant-cell-${k}` });
    kit.cylinder({ x, z: cz, y0: H.dcpTop + 3, y1: H.dcpTop + 3.8, r: Math.min(w, 13) * 0.36, segments: 12, material: M.dark, top: M.dark, name: `plant-fan-${k}` });
  }
  // the stone columns under it, clear of the drop-off's lane, and the glass canopy along its front to Raffles Quay
  const colsX = [dcpW + 1.2, -7, 9, eastAt(0) - 10], colsZ = [zN + 1.6, onNorthFace(0) - 7.5];
  colsX.forEach((x, a) => colsZ.forEach((z, b) => kit.box({ x, z, y: H.paving, w: 1.4, h: H.dcpSoffit - H.paving, d: 1.4, material: M.stone, top: M.stone, name: `plaza-column-${a}-${b}` })));
  const canopyAt = (r, label) => {
    kit.prism({ ring: r, y0: H.canopy, y1: H.canopy + 0.3, material: M.alu, top: M.pale, name: `canopy-${label}` });
    kit.collisionPrism({ ring: r, y0: H.canopy, y1: H.canopy + 0.3 });
  };
  // the plaza's on its front columns; the South Tower's on its piers, 3.4 m out from its face to Raffles Quay
  const [x0, x1, z0, z1] = [dcpW - 4.2, colsX[0] - 0.7, zN + 0.3, onNorthFace(dcpW) - 0.3];
  canopyAt([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 'plaza');
  const ca = lerp(S.nw, S.sw, 1 / dist(S.nw, S.sw)), cb = lerp(S.nw, S.sw, 1 - 2 / dist(S.nw, S.sw)), [cnx, cnz] = NS[0];
  canopyAt([ca, cb, [cb[0] + cnx * 3.4, cb[1] + cnz * 3.4], [ca[0] + cnx * 3.4, ca[1] + cnz * 3.4]], 'south-tower');

  // --- the plaza: the granite water trough with the name on Raffles Quay, the bamboo garden behind it ---------------------
  const westAt = (z) => crossing(outline, 'z', z, false);
  const tz = (zN + onNorthFace(dcpW)) / 2, tx = westAt(tz) + 1.8;
  const trough = kit.box({ x: tx, z: tz, y: 0, w: 2.4, h: 1.1, d: 15, material: M.dark, top: M.dark, name: 'plaza-trough' });
  kit.hang({ ring: trough.ring, top: 1.1, toward: 301.8, below: 0.15, out: 0.03, margin: 1.5, text: 'ONE RAFFLES QUAY', height: 0.75, color: C.name, font: '500 110px Helvetica, Arial, sans-serif', name: 'sign:one-raffles-quay' });
  const bed = [[dcpW + 5, tz - 5], [dcpW + 13, tz - 5], [dcpW + 13, tz + 5], [dcpW + 5, tz + 5]];
  kit.prism({ ring: bed, y0: 0, y1: 0.7, material: M.stone, top: M.green, name: 'plaza-bamboo-bed' });
  for (let k = 0; k < 8; k++) {
    const x = dcpW + 6.3 + (k % 2) * 3.4 + hash(k, 4) * 1.6, z = tz - 3.8 + Math.floor(k / 2) * 2.4 + hash(k, 5) * 0.8;
    kit.cylinder({ x, z, y0: 0.7, y1: 6.5 + hash(k, 6) * 3, r: 0.45, segments: 5, material: M.green, top: M.green, name: `plaza-bamboo-${k}` });
  }

  // --- the block on Marina Boulevard: grey stone, a louvred panel on its street face, a glass roof rising to the tower ----
  const northAt = (x) => crossing(outline, 'x', x, false);
  const corner = [eastAt(northAt(T.e[0]) + 1.5) - 1.5, northAt(T.e[0]) + 1.5];
  const block = [T.eneEnd, [T.eneEnd[0], northAt(T.eneEnd[0]) + 1.5], corner, [corner[0], T.e[1]], T.e];
  kit.prism({ ring: block, y0: 0, y1: H.block, material: M.stone, top: M.stone, name: 'block' });
  kit.collisionPrism({ ring: block, y0: 0, y1: H.block });
  const roof = kit.inset(block, 0.8);
  kit.prism({ ring: roof, y0: H.block, y1: kit.sloped(roof, H.blockRoof, H.blockRoof - H.block - 0.2, 58), material: M.pale, top: M.pale, name: 'block-roof' });
  const NB = normalsOf(block), [ba, bb] = [block[1], block[2]], [bnx, bnz] = NB[1];
  const panel = [lerp(ba, bb, 0.12), lerp(ba, bb, 0.88)].map(([x, z]) => [x + bnx * 0.25, z + bnz * 0.25]);
  kit.prism({ ring: [lerp(ba, bb, 0.12), lerp(ba, bb, 0.88), panel[1], panel[0]], y0: 3, y1: H.block - 3.5, material: M.louvre, top: M.stone, name: 'block-panel' });

  // --- the podium round the South Tower's south and east faces, Deutsche Bank's name on its south face -------------------
  const inner = kit.inset(outline, 1);
  const cornerSE = near(inner, 31.4, 77.6, "the site's south-east corner"), southPts = inner.filter((p) => p !== cornerSE && p[0] > 0 && p[1] > 50);
  const xW = 0, onSouthFace = lerp(S.sw, S.se, (xW - S.sw[0]) / (S.se[0] - S.sw[0]));
  const podium = [onSouthFace, S.se, S.ne, [eastAt(S.ne[1]) - 1, S.ne[1]], cornerSE, ...southPts.sort((a, b) => b[0] - a[0]), [xW, crossing(inner, 'x', xW, true)]];
  kit.prism({ ring: podium, y0: 0, y1: H.podium, material: M.stone, top: M.roof, name: 'podium' });
  kit.collisionPrism({ ring: podium, y0: 0, y1: H.podium });
  // the name in blue near the top of its longest south face, the mark (the slash in a square) to its right
  const NP = normalsOf(podium);
  let k = -1, best = 0;
  podium.forEach((a, i) => { const b = podium[(i + 1) % podium.length], d = kit.compass(211.8); if (NP[i][0] * d[0] + NP[i][1] * d[1] > 0.9 && dist(a, b) > best) { best = dist(a, b); k = i; } });
  if (k < 0) throw new Error('One Raffles Quay: the podium has no south face');
  const fa = podium[k], fb = podium[(k + 1) % podium.length], [pnx, pnz] = NP[k], yaw = Math.atan2(pnx, pnz);
  // a dark louvred panel in the stone frame under the name, as on the Marina Boulevard block
  const pa = lerp(fa, fb, 0.06), pb = lerp(fa, fb, 0.94);
  kit.prism({ ring: [pa, pb, [pb[0] + pnx * 0.25, pb[1] + pnz * 0.25], [pa[0] + pnx * 0.25, pa[1] + pnz * 0.25]], y0: 3, y1: H.podium - 4.2, material: M.louvre, top: M.stone, name: 'podium-panel' });
  const [rx, rz] = [Math.cos(yaw), -Math.sin(yaw)]; // the sign's right
  const west = rx * (fb[0] - fa[0]) + rz * (fb[1] - fa[1]) < 0 ? fb : fa; // the face's left end, seen from the street
  const at = (s) => [west[0] + rx * s + pnx * 0.3, west[1] + rz * s + pnz * 0.3];
  const [sx, sz] = at(7.5);
  const text = kit.sign({ text: 'Deutsche Bank', x: sx, z: sz, yTop: H.podium - 1, yaw, height: 1.8, maxWidth: 12, color: C.deutsche, font: '500 110px Helvetica, Arial, sans-serif', name: 'sign:deutsche-bank' });
  const right = text.ring.reduce((m, [x, z]) => (x * rx + z * rz > m[0] * rx + m[1] * rz ? [x, z] : m));
  const markH = text.y1 - text.y0;
  kit.sign({ logo: LOGOS['deutsche-bank'], x: right[0] + rx * (0.6 + markH / 2), z: right[1] + rz * (0.6 + markH / 2), y: text.y0, yaw, height: markH, name: 'sign:deutsche-bank-mark' });

  // --- the ground: paved over the site above the city's lawn, trees on the forecourt along Raffles Quay -------------------
  kit.prism({ ring: kit.inset(outline, 0.3), y0: 0, y1: H.paving, material: M.paving, top: M.paving, name: 'paving' });
  const tree = (x, z, h, r, label) => {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: H.paving, y1: H.paving + h * 0.42, r: 0.22, segments: 5, material: M.stone, top: M.stone, name: `${label}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: H.paving + h * 0.36, y1: H.paving + h * 0.64, material: M.green, top: M.green, name: `${label}-tree-crown` });
    kit.loft({ ring: around(r), y0: H.paving + h * 0.64, y1: H.paving + h, scale: 0.35, material: M.green, top: M.green, name: `${label}-tree-crown-top` });
  };
  [-76, -66, -56, -46].forEach((z, i) => tree(westAt(z) + 3, z, 8 + hash(i, 7) * 2, 2.6, `forecourt-${i}`));
  [-18, -9].forEach((x, i) => tree(x, northAt(x) + 3.5, 8 + hash(i, 8) * 2, 2.6, `forecourt-north-${i}`));
}
