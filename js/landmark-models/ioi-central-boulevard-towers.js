// js/landmark-models/ioi-central-boulevard-towers.js
// IOI Central Boulevard Towers, 2 Central Boulevard, Marina Bay (SG-045; CallisonRTKL with Architects 61 for IOI
// Properties, completed in 2024): OSM ways 1206694672 (the site outline) and 725993952 (its duplicate, "Central
// Square"), 1075230981 (the six-storey podium), 1206694673 (the four-storey block along Commerce Street), 1075230983 and
// 1075230982 (the West and East Towers) and 1075230987 and 1075230986 (the towers' cores where they come down through the
// sky park). The two link bridges (1075230984, 1206694671) stay the city's.
// Two unequal glass towers stand on columns over Central Green, the sky park planted on the podium's roof: the slender
// 48-storey West Tower at the Raffles Quay end and the broad, 16-storey East Tower toward Marina View, both curtain walls
// of pale, silvery sky-blue glass under a bright silver spandrel band at every floor (the mullions too fine to show at a
// distance), their four corners cut in as notches striped by fins, crowned by a pale cap of louvre blades on posts round
// the plant floors, three storeys tall and rising past the roof; IOI's mark on the West Tower's crown toward the bay. Under the towers the deck runs on between the columns and the cores' grey enclosures; a teal jogging
// track loops through lawns and trees between and beyond the towers, past a dark glass pavilion. The podium: a recessed
// glass ground floor behind piers, silver fins over the car park storeys, a band of green glass at the office floors;
// the four-storey block along Commerce Street carries the Level 5 roof garden.
// Heights: the West Tower 237.9 m and 48 storeys, the East Tower 100.4 m and 16 (CTBUH); the deck (30 m), the soffits
// (42.5 and 45 m), the crowns (from 225.7 and 88.3 m) and the podium's bands measured on the owner's stacking elevation,
// whose plan widths match the mapped rings to a metre; the plans' notches and columns from the owner's typical floor
// plans; the East Tower's east face (15 m short of the mapped podium edge) from the elevation and the Esri aerial.
// See docs/ioi-central-boulevard-towers.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'IOI Central Boulevard Towers', height: 237.9 };

const ID = { outline: 1206694672, west: 1075230983, westCore: 1075230987, eastCore: 1075230986 };
// heights (m): the shopfronts' top under the podium, the fins' top (the Level 5 slab), the block's roof garden, the
// sky park's deck and its railing; each tower's soffit (under a slab 0.8 m deep), the top of its office floors (where
// the crown begins) and its top
const H = {
  shop: 4.8, fins: 20.6, block: 20.3, deck: 30, rail: 1.1, slab: 0.8,
  westSoffit: 42.5, westCrown: 225.7, westTop: 237.9,
  eastSoffit: 45, eastCrown: 88.3, eastTop: 100.4
};
// The drawing (m): u along the outline's long walls toward Marina View (east-south-east), v across toward Commerce
// Street, as the mapped rings give them (their vertices projected on the outline's longest edge). The site: the outline
// less the four-storey block (the podium), the block, and the ground floor's line (the outline, the bridge's step left out)
const PODIUM = [[-57.66, 33.45], [-11.85, 33.5], [-11.67, 19.89], [96.54, 20.11], [96.92, -23.9], [-11.1, -24.12], [-11.12, -25.32],
  [-17.52, -25.32], [-17.45, -27.22], [-46.27, -34.04], [-62.81, -36.67], [-62.82, -12.87], [-57.26, -9.26]];
const BLOCK = [[-11.85, 33.5], [90.36, 33.52], [90.44, 20.1], [-11.67, 19.89]];
const GROUND = [[-57.66, 33.45], [90.36, 33.52], [90.44, 20.1], [96.54, 20.11], [96.92, -23.9], [-17.5, -24.12], [-17.45, -27.22],
  [-46.27, -34.04], [-62.81, -36.67], [-62.82, -12.87], [-57.26, -9.26]];
// the towers: the West's centre and half sizes fitted to its mapped ring, the East's from its mapped west-north-west
// corners and the elevation's east face; the corner notches (along u, along v) from the floor plans and the rings
const WEST = { u0: -56.05, u1: -11.45, v0: -27.29, v1: 33.51, nu: 6.6, nv: 1.95 };
const EAST = { u0: 13.9, u1: 82.0, v0: -24.08, v1: 19.95, nu: 3.2, nv: 3.0 };
// columns under each tower (from the floor plans): a column's size, its centre in from each face, and the positions
// along the long and short faces (about the tower's middle)
const WEST_COLUMNS = { size: 1.7, inLong: 2.1, inShort: 1.5, long: [-22.5, -13.4, -4.5, 4.6, 13.5, 22.6], short: [-8.9, 0, 8.9] };
const EAST_COLUMNS = { size: 1.6, in: 1.6, long: [-26.2, -17.1, -8.1, 1.0, 10.0, 19.0, 28.1], west: [-15.8, -6.8, 6.8, 15.9], east: [-6.8, 6.8] };
// colours from the daylight photographs (IOI Properties 2024–25): the towers' pale, silvery sky-blue glass (the East
// Tower's face averages #afc6d9 with its bands in the masthead, the lightest tower in the view); the notches' fins over
// dark glass; the silver of the floor bands, the crowns' louvres, posts and railings, and the paler grey of the plant
// floors behind the louvres; the columns' light stone; the podium's silver fins over dark glass and its green office
// glass; the shopfronts; the sky park's lawns, trees, paving and teal track
const C = {
  glass: 0x92bbe6, fin: 0xd3d7da, finGlass: 0x34465a, louvre: 0xe1e5e8, crownWall: 0xc9cdd1, dark: 0x4f5559, stone: 0xb8b6af,
  podiumFin: 0xc9ced1, podiumFinGlass: 0x515f67, bandFrame: 0x8e9a9c, bandGlass: 0x466e6e, shop: 0x34434b,
  lawn: 0x7fa94a, leaf: 0x4b7a37, paving: 0xd6d3cb, track: 0x4f9f96
};

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`IOI Central Boulevard Towers needs mapped way ${id}`);
    return p.ring;
  };
  const outline = ring(ID.outline);
  const M = {
    // the broad faces' glass: clear between the floor bands (built as solids), with no visible mullions at a distance;
    // a matte-ish glaze rather than the kit's dark metallic glass, which reads navy in daylight without reflections
    glass: kit.material(C.glass, { roughness: 0.3, metalness: 0.18 }), crownWall: kit.material(C.crownWall, { roughness: 0.6, metalness: 0.1 }),
    notch: kit.facadeMaterial({ wall: C.fin, window: C.finGlass, floorHeight: 4.6, bayWidth: 2, pattern: 'ribbon' }),
    fins: kit.facadeMaterial({ wall: C.podiumFin, window: C.podiumFinGlass, floorHeight: 3.9, bayWidth: 1.2, windowWidth: 0.66, pattern: 'strips' }),
    band: kit.facadeMaterial({ wall: C.bandFrame, window: C.bandGlass, floorHeight: 4.7, bayWidth: 1.5, windowWidth: 0.92, pattern: 'strips' }),
    louvre: kit.material(C.louvre, { roughness: 0.5, metalness: 0.3 }), dark: kit.material(C.dark), stone: kit.material(C.stone),
    shop: kit.glassMaterial(C.shop), lawn: kit.material(C.lawn), leaf: kit.material(C.leaf), paving: kit.material(C.paving), track: kit.material(C.track)
  };

  // --- the drawing's axes from the outline's longest edge, its origin from the West Tower's mapped extremes ----------------
  let U = [1, 0], longest = 0;
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L > longest) { longest = L; U = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; }
  });
  if (U[0] < 0) U = [-U[0], -U[1]];
  const V = [-U[1], U[0]];
  const along = (p, a) => p[0] * a[0] + p[1] * a[1];
  const westRing = ring(ID.west), us = westRing.map((p) => along(p, U)), vs = westRing.map((p) => along(p, V));
  const du = (Math.min(...us) + Math.max(...us) - WEST.u0 - WEST.u1) / 2, dv = (Math.min(...vs) + Math.max(...vs) - WEST.v0 - WEST.v1) / 2;
  const P = (u, v) => [U[0] * (u + du) + V[0] * (v + dv), U[1] * (u + du) + V[1] * (v + dv)];
  const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  const poly = (pts) => pts.map(([u, v]) => P(u, v));
  // the faces' compass bearings: u's (the east-south-east face) and the others a quarter turn on
  const bearing = 90 + kit.bearingDeg + (Math.atan2(U[1], U[0]) * 180) / Math.PI;
  // a block in the drawing; one off the ground solid to fly into as well
  const block = (name, [u0, v0, u1, v1], y0, y1, material, top = material, solid = true) => {
    const part = kit.prism({ ring: rect(u0, v0, u1, v1), y0, y1, material, top, name });
    if (solid && y0 > 0.5) kit.collisionPrism({ ring: part.ring, y0, y1 });
    return part;
  };
  // a tree: a short trunk under a crown that widens then closes
  const tree = (u, v, y, h, r, name) => {
    const [x, z] = P(u, v), around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.45, r: 0.18, segments: 5, material: M.dark, top: M.dark, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.4, y1: y + h * 0.65, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.65, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  };
  // a railing along the edges of a drawing polygon (those for which keep(i) holds), at the height y
  const railing = (name, pts, y, keep = () => true) => pts.forEach((a, i) => {
    if (!keep(i)) return;
    const b = pts[(i + 1) % pts.length], [ax, az] = P(...a), [bx, bz] = P(...b);
    kit.beam({ from: [ax, y + H.rail / 2, az], to: [bx, y + H.rail / 2, bz], w: 0.12, h: H.rail, material: M.louvre, name: `${name}-${i}` });
  });

  // --- the podium: a glass ground floor recessed behind piers, silver fins to Level 5, green glass to the deck ---------------
  const ground = kit.inset(poly(GROUND), 1.2);
  kit.prism({ ring: ground, y0: 0, y1: H.shop, material: M.shop, top: M.shop, name: 'podium-base' });
  kit.collisionPrism({ ring: ground, y0: 0, y1: H.shop });
  // whether a drawing point lies inside a drawing polygon; an edge's unit direction and its inward normal
  const inside = (pts, [u, v]) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [a, b] = pts[i], [p, q] = pts[j];
      if ((b > v) !== (q > v) && u < ((p - a) * (v - b)) / (q - b) + a) c = !c;
    }
    return c;
  };
  const edge = (pts, i) => {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { a, L, t, n: inside(pts, [mid[0] - t[1], mid[1] + t[0]]) ? [-t[1], t[0]] : [t[1], -t[0]] };
  };
  // the piers along the ground floor's line, about 9 m apart, 0.55 m inside it (clear of the recessed glass)
  GROUND.forEach((_, i) => {
    const { a, L, t, n } = edge(GROUND, i), m = Math.round(L / 9);
    for (let k = 1; k < m; k++) {
      const s = (k * L) / m, cu = a[0] + t[0] * s + n[0] * 0.55, cv = a[1] + t[1] * s + n[1] * 0.55;
      kit.prism({ ring: rect(cu - 0.45, cv - 0.45, cu + 0.45, cv + 0.45), y0: 0, y1: H.shop, material: M.stone, top: M.stone, name: `podium-pier-${i}-${k}` });
    }
  });
  // the silver fins on the street faces from Level 2 to Level 5, 0.6 m deep, every 2.4 m (the painted ones between),
  // clear of the bridges' landings
  const fins = (label, pts, edges, y1) => edges.forEach((i) => {
    const { a, L, t, n } = edge(pts, i), m = Math.floor(L / 2.4);
    for (let k = 0; k < m; k++) {
      const s = ((k + 0.5) * L) / m, at = (ds, o) => [a[0] + t[0] * (s + ds) - n[0] * o, a[1] + t[1] * (s + ds) - n[1] * o];
      const [cu] = at(0, 0);
      if (Math.abs(n[1]) > 0.9 && cu > -14.2 && cu < -0.2) continue; // the bridges' landings
      kit.prism({ ring: poly([at(-0.18, 0), at(0.18, 0), at(0.18, 0.6), at(-0.18, 0.6)]), y0: H.shop, y1, material: M.louvre, top: M.louvre, name: `podium-fin-${label}-${i}-${k}` });
    }
  });
  fins('p', PODIUM, [0, 3, 4, 6, 8, 9, 10, 11, 12], H.fins - 0.1);
  fins('b', BLOCK, [0, 1], H.block - 0.1);
  kit.prism({ ring: poly(PODIUM), y0: H.shop, y1: H.fins, material: M.fins, top: M.fins, name: 'podium-fins' });
  kit.prism({ ring: poly(PODIUM), y0: H.fins, y1: H.deck, material: M.band, top: M.paving, name: 'podium-offices' });
  kit.collisionPrism({ ring: poly(PODIUM), y0: H.shop, y1: H.deck });
  kit.prism({ ring: poly(BLOCK), y0: H.shop, y1: H.block, material: M.fins, top: M.paving, name: 'block' });
  kit.collisionPrism({ ring: poly(BLOCK), y0: H.shop, y1: H.block });
  // dark glass round the link bridges' landings at Level 2: on the north face between the towers, on the block's south face
  block('podium-portal-north', [-10.9, -24.4, -2.6, -24.05], H.shop, 9.6, M.shop, M.shop, false);
  block('podium-portal-south', [-11.6, 33.45, -1.0, 33.8], H.shop, 9.6, M.shop, M.shop, false);
  // the deck's glass railing along all its edges; the block's along its open south and east edges
  railing('park-rail', PODIUM, H.deck);
  railing('block-rail', BLOCK, H.block, (i) => i === 0 || i === 1);

  // --- a tower: soffit slab, shaft with notched corners, the louvred crown round the plant floors, the roof ----------------
  // the plan with its four corners cut in by (nu, nv): edges 0, 3, 6, 9 are the main faces (north, east, south, west)
  const notched = ({ u0, v0, u1, v1, nu, nv }) => [
    [u0 + nu, v0], [u1 - nu, v0], [u1 - nu, v0 + nv], [u1, v0 + nv], [u1, v1 - nv], [u1 - nu, v1 - nv],
    [u1 - nu, v1], [u0 + nu, v1], [u0 + nu, v1 - nv], [u0, v1 - nv], [u0, v0 + nv], [u0 + nu, v0 + nv]
  ];
  const tower = (name, T, soffit, crown, top, floors) => {
    const plan = poly(notched(T));
    const faces = (i) => (i % 3 === 0 ? M.glass : M.notch);
    kit.prism({ ring: plan, y0: soffit - H.slab, y1: soffit, material: M.dark, top: M.dark, name: `${name}-soffit` });
    kit.prism({ ring: plan, y0: soffit, y1: crown, material: M.glass, edgeMaterial: faces, top: M.dark, name: `${name}-shaft` });
    kit.collisionPrism({ ring: plan, y0: soffit - H.slab, y1: top });
    // the plant floors behind the screen, 1.2 m in (the notches' faces striped on up), pale grey so that the crown reads
    // as a light cap over the glass, as photographed; the roof on them
    const roofY = top - 1.4;
    kit.prism({ ring: kit.inset(plan, 1.2), y0: crown, y1: roofY, material: M.crownWall, edgeMaterial: (i) => (i % 3 === 0 ? M.crownWall : M.notch), top: M.dark, name: `${name}-crown-wall` });
    kit.prism({ ring: kit.inset(plan, 1.5), y0: roofY, y1: roofY + 0.3, material: M.stone, top: M.stone, name: `${name}-roof` });
    const { u0, v0, u1, v1, nu, nv } = T;
    const sides = [
      { key: 'n', from: [u0 + nu, v0], to: [u1 - nu, v0], out: [0, -1] }, { key: 'e', from: [u1, v0 + nv], to: [u1, v1 - nv], out: [1, 0] },
      { key: 's', from: [u0 + nu, v1], to: [u1 - nu, v1], out: [0, 1] }, { key: 'w', from: [u0, v0 + nv], to: [u0, v1 - nv], out: [-1, 0] }
    ];
    const span = (side, s0, s1, o0, o1) => {
      const t = side.to[0] !== side.from[0] ? [1, 0] : [0, 1], o = side.out;
      const at = (s, k) => [side.from[0] + t[0] * s + o[0] * k, side.from[1] + t[1] * s + o[1] * k];
      const [a, b] = [at(s0, o0), at(s1, o1)];
      return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
    };
    // the floor bands: a bright silver spandrel 0.6 m tall and 0.15 m proud at every floor of each main face, the clear
    // glass between them (the notches keep their fins); 0.1 m short of the notches' corners
    const storey = (crown - soffit) / floors;
    for (const side of sides) {
      const L = Math.hypot(side.to[0] - side.from[0], side.to[1] - side.from[1]);
      for (let k = 1; k < floors; k++) {
        const y = soffit + k * storey;
        block(`${name}-band-${side.key}-${k}`, span(side, 0.1, L - 0.1, 0.15, -0.05), y - 0.25, y + 0.35, M.louvre, M.louvre, false);
      }
    }
    // the screen on each main face: sixteen blades from 0.35 m proud of the glass back to the plant wall, the top one at
    // the tower's top, carried on posts 0.42 m proud, about 6 m apart, standing on the shaft
    const BLADES = 16, BLADE = 0.3, step = (top - BLADE - (crown + 0.45)) / (BLADES - 1);
    for (const side of sides) {
      const L = Math.hypot(side.to[0] - side.from[0], side.to[1] - side.from[1]);
      for (let k = 0; k < BLADES; k++) {
        const y1 = top - (BLADES - 1 - k) * step;
        block(`${name}-crown-blade-${side.key}-${k}`, span(side, 0, L, 0.35, -1.2), y1 - BLADE, y1, M.louvre, M.louvre, false);
      }
      const n = Math.max(2, Math.round(L / 6));
      for (let j = 1; j < n; j++) block(`${name}-crown-post-${side.key}-${j}`, span(side, (j * L) / n - 0.15, (j * L) / n + 0.15, 0.42, -1.15), crown, top - 0.05, M.louvre, M.louvre, false);
    }
    return { plan, roofY };
  };
  const west = tower('west', WEST, H.westSoffit, H.westCrown, H.westTop, 41);
  const east = tower('east', EAST, H.eastSoffit, H.eastCrown, H.eastTop, 9);
  // the roofs: a plant box on the West's; on the East's a green roof with rows of solar panels along its south side, as
  // the aerial shows it
  block('west-roof-plant', [-38, -6, -29, 12], west.roofY + 0.3, west.roofY + 1.0, M.louvre, M.louvre, false);
  kit.prism({ ring: rect(EAST.u0 + 6, EAST.v0 + 6, EAST.u1 - 6, EAST.v1 - 6), y0: east.roofY + 0.3, y1: east.roofY + 0.4, material: M.leaf, top: M.leaf, name: 'east-roof-green' });
  for (let k = 0; k < 6; k++) block(`east-roof-pv-${k}`, [40 + k * 6.5, EAST.v1 - 5.5, 45 + k * 6.5, EAST.v1 - 2.5], east.roofY + 0.3, east.roofY + 0.75, M.dark, M.dark, false);

  // --- the columns from the deck to each soffit slab, and the cores' enclosures (the mapped grey parts) -------------------
  const column = (name, u, v, s, soffit) => block(name, [u - s / 2, v - s / 2, u + s / 2, v + s / 2], H.deck, soffit - H.slab, M.stone);
  {
    const c = WEST_COLUMNS, cu = (WEST.u0 + WEST.u1) / 2, cv = (WEST.v0 + WEST.v1) / 2;
    c.short.forEach((s, k) => {
      column(`west-column-n-${k}`, cu + s, WEST.v0 + c.inShort, c.size, H.westSoffit);
      column(`west-column-s-${k}`, cu + s, WEST.v1 - c.inShort, c.size, H.westSoffit);
    });
    c.long.forEach((s, k) => {
      column(`west-column-w-${k}`, WEST.u0 + c.inLong, cv + s, c.size, H.westSoffit);
      column(`west-column-e-${k}`, WEST.u1 - c.inLong, cv + s, c.size, H.westSoffit);
    });
  }
  {
    const c = EAST_COLUMNS, cu = (EAST.u0 + EAST.u1) / 2, cv = (EAST.v0 + EAST.v1) / 2;
    c.long.forEach((s, k) => {
      column(`east-column-n-${k}`, cu + s, EAST.v0 + c.in, c.size, H.eastSoffit);
      column(`east-column-s-${k}`, cu + s, EAST.v1 - c.in, c.size, H.eastSoffit);
    });
    c.west.forEach((s, k) => column(`east-column-w-${k}`, EAST.u0 + c.in, cv + s, c.size, H.eastSoffit));
    c.east.forEach((s, k) => column(`east-column-e-${k}`, EAST.u1 - c.in, cv + s, c.size, H.eastSoffit));
  }
  for (const [name, id, soffit] of [['west-core', ID.westCore, H.westSoffit], ['east-core', ID.eastCore, H.eastSoffit]]) {
    kit.prism({ ring: ring(id), y0: H.deck, y1: soffit - H.slab, material: M.fins, top: M.dark, name });
    kit.collisionPrism({ ring: ring(id), y0: H.deck, y1: soffit - H.slab });
  }

  // --- Central Green: lawns, the jogging track, trees, the pavilion and the meeting pods on the deck ----------------------
  const lawn = (name, pts) => kit.prism({ ring: poly(pts), y0: H.deck, y1: H.deck + 0.12, material: M.lawn, top: M.lawn, name: `park-lawn-${name}` });
  // a lawn's outline: a rectangle with its corners rounded (as the as-built lawns' soft edges), up to 3 m
  const box = (u0, v0, u1, v1) => {
    const r = Math.min(3, 0.45 * Math.min(u1 - u0, v1 - v0)), out = [];
    for (const [cu, cv, a0] of [[u1 - r, v0 + r, -90], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180]]) {
      for (let k = 0; k <= 3; k++) { const a = ((a0 + 30 * k) * Math.PI) / 180; out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]); }
    }
    return out;
  };
  lawn('gap', box(-10.2, -22.2, 3.8, 17.8));
  lawn('gap-east', box(7.3, -16.6, 13.2, 11));
  lawn('end', [[83, -1], [84, -3.6], [88.6, -4.4], [88.6, -14.5], [89.6, -16.3], [91.2, -15.2], [91.2, 9.2], [89.6, 11], [85, 11.2], [83, 9.2]]);
  lawn('east-north', box(21, -17.3, 66, -10.4));
  lawn('east-south', box(21, 6.6, 78, 11.6));
  lawn('west-west', box(-52.5, -22, -43.3, 28));
  lawn('west-east', box(-23.6, -22, -15.2, 28));
  lawn('west-north', box(-41.5, -24, -25.5, -21.8));
  lawn('west-south', box(-41.5, 26.3, -25.5, 30.8));
  lawn('corner', [[-60, -34], [-46.5, -31.6], [-36, -29.1], [-36, -28.3], [-60, -28.3]]);
  // the track, 2.2 m wide, in two halves meeting on its straight runs between the towers and at the east end: out under
  // the East Tower's north side, round the end of the deck, back under its south side
  const band = (name, pts, w = 2.2) => {
    const normal = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]; };
    const left = [], right = [];
    pts.forEach((p, i) => {
      let n;
      if (i === 0) n = normal(p, pts[1]);
      else if (i === pts.length - 1) n = normal(pts[i - 1], p);
      else { const a = normal(pts[i - 1], p), b = normal(p, pts[i + 1]), m = [a[0] + b[0], a[1] + b[1]], L = Math.hypot(...m), c = (m[0] * a[0] + m[1] * a[1]) / L; n = [m[0] / L / c, m[1] / L / c]; }
      left.push([p[0] + n[0] * w / 2, p[1] + n[1] * w / 2]);
      right.push([p[0] - n[0] * w / 2, p[1] - n[1] * w / 2]);
    });
    kit.prism({ ring: poly([...left, ...right.reverse()]), y0: H.deck, y1: H.deck + 0.16, material: M.track, top: M.track, name: `park-track-${name}` });
  };
  band('north', [[5.5, -2], [5.5, -14], [8, -18.8], [14, -19.9], [66, -19.9], [72, -19.6], [89.5, -19.3], [92.4, -16], [92.4, -2]]);
  band('south', [[92.4, -2], [92.4, 9], [90.5, 14], [85, 16.1], [20, 16.1], [12, 15.5], [7.5, 12], [5.5, 6], [5.5, -2]]);
  // the trees, in the lawns between and beyond the towers, round the cores under them and in the corner terrace
  const TREES = [
    [-7, -18], [-1, -14], [-7, -8], [0, -4], [-6, 3], [1, 9], [-7, 13], [0, 15.5], [10.3, -12], [10.3, 0], [10.3, 8],
    [85.5, -1], [89.5, 3], [85.5, 8], [90, -11], [89.6, 9.8],
    [26, -13.8], [36, -13.8], [46, -13.8], [56, -13.8], [64, -13.8], [28, 9.1], [40, 9.1], [52, 9.1], [64, 9.1], [75, 9.1],
    [-48, -18], [-48, -6], [-48, 6], [-48, 18], [-19.5, -16], [-19.5, -4], [-19.5, 8], [-19.5, 20], [-38, 28.6], [-29, 28.6], [-37, -22.9], [-30, -22.9],
    [-55, -31.6], [-48, -30.6], [-41, -29.6]
  ];
  TREES.forEach(([u, v], k) => tree(u, v, H.deck + 0.12, 5.2 + ((k * 7) % 5) * 0.45, 1.5 + ((k * 3) % 4) * 0.15, `park-tree-${k}`));
  // the dark glass pavilion under the East Tower's north-east corner, out past its east face; the meeting pods with
  // white roofs at the deck's west edge under the West Tower
  block('park-pavilion', [72, -17, 88, -6], H.deck, H.deck + 5.2, M.shop, M.dark);
  for (const [k, v] of [3.1, 12.2, 21.4].entries()) {
    block(`park-pod-${k}`, [-57.0, v - 1.4, -55.0, v + 1.4], H.deck, H.deck + 2.6, M.shop, M.shop);
    block(`park-pod-${k}-roof`, [-57.2, v - 1.6, -54.8, v + 1.6], H.deck + 2.6, H.deck + 2.85, M.louvre, M.louvre, false);
  }

  // --- the Level 5 roof garden on the four-storey block: three long planters with small trees ------------------------------
  [[-6, 22], [26, 56], [60, 86]].forEach(([a, b], k) => {
    block(`block-bed-${k}`, [a, 24.5, b, 29], H.block, H.block + 0.6, M.stone, M.leaf, false);
    tree(a + (b - a) * 0.3, 26.75, H.block + 0.6, 4.2, 1.3, `block-bed-${k}-a`);
    tree(a + (b - a) * 0.72, 26.75, H.block + 0.6, 4.6, 1.4, `block-bed-${k}-b`);
  });

  // --- IOI's mark on the West Tower's crown, toward the bay, in the south half of its east face ------------------------------
  kit.hang({ ring: rect(WEST.u1 - 1.2, 10.4, WEST.u1 + 0.35, 28.4), top: H.westTop, toward: bearing, below: 3.5, out: 0.25, margin: 0.5, logo: LOGOS.ioi, height: 6.2, name: 'sign:ioi' });
}
