// js/landmark-models/capitagreen.js
// CapitaGreen, 138 Market Street (Toyo Ito & Associates with Takenaka Corporation, RSP Architects as architect of record,
// 2014, on the site of the Market Street Car Park): OSM ways 393100853 (the outline), 1566865514 (the tower),
// 1566865513 (the raised block at the north corner) and 1566865509–12 (the four posts under it).
// A 40-storey tower on a six-sided plan: a rectangle on the city grid with its east and west corners cut off by
// true north-south walls, the east one a long wall on Market Street. Its double skin reads from any distance as pale
// sea-green glass behind a dense grid of pale fins, the planters between the skins (55 % of the façade by CTBUH) a
// fine darker texture behind the glass; sky terraces several storeys tall are cut dark into its corners. At the top
// the outer skin rises past the last storey as a paler glass box under a flat white rim, round the club's deck and the
// Sky Forest's raised garden; out of it rises the wind catcher, 45 m from the deck to its tip at 242 m: a red neck
// widening into a lower funnel under a broad white collar at the rim, and from the collar a trumpet split north and
// south into two flaring petals cut off in level lips (the north one warm white outside, both signal red inside), red
// horns sweeping out east and west under the collar. At the north corner a two-storey block of planted ledges stands on
// four posts and the tower's side, 20 m over an open plaza of white wavy columns in front of the lobby.
// Heights: 242 m to the tip (CTBUH, as mapped), the highest occupied floor 197 m (CTBUH) and the wind catcher 45 m
// (CTBUH, Berkeley's Façade Map); the block and its posts as mapped (20–30 m); the deck, the garden, the cage, the
// collar and the petals scaled from the photographs from Marina Bay Sands (by the tower's 84 m width seen from there);
// the sky terraces estimated from photographs (from Lau Pa Sat, Cecil Street and the plaza) and the Esri aerial. See
// docs/capitagreen.md.
export const info = { name: 'CapitaGreen', height: 242 };

const ID = { tower: 1566865514, block: 1566865513, posts: [1566865509, 1566865510, 1566865511, 1566865512] };
const GRID = 121.8; // the tower's south-west wall, toward Market Street (compass degrees): the city grid
const ROSE = -10; // the wind catcher's turn from the compass (degrees), as the aerial shows: petals north and south, horns east and west
const STOREY = 4.75; // from the lobby's top to the Sky Forest, 38 storeys
// heights (m): the lobby, the raised block's soffit and roof; the roof deck (38 storeys over the lobby) and the Sky
// Forest's raised garden on it; the cage's glass and its white rim; the restaurant's box; the wind catcher's lower
// funnel, the white collar it carries at the rim, and the tips of the south and north petals rising from the collar
const H = {
  lobby: 20, block: 20, blockTop: 30.4, roof: 20 + 38 * STOREY, garden: 204.5, glass: 218.8, cage: 221, rim: 221.6, box: 210,
  funnel: 212, collar: 222, collarTop: 223.8, south: 239.8, tip: 242
};
// the sky terraces cut into the corners: which corner (the low or high end of the drawing's u and v), how far along
// u and v, and from which storey to which over the lobby
const TERRACES = [
  { corner: ['lo', 'lo'], size: [12, 7], storeys: [3, 6] }, // over the raised block, at the north corner
  { corner: ['lo', 'hi'], size: [18, 9], storeys: [12, 15] }, // the west corner
  { corner: ['lo', 'hi'], size: [14, 10], storeys: [23, 26] },
  { corner: ['hi', 'lo'], size: [7, 42], storeys: [24, 27] } // the east corner, over Market Street
];
// colours from the photographs in daylight and at dusk: pale sea-green glass behind a dense grid of pale grey-white
// fins (the outer skin's frame), the planting a fine mid-green texture behind the glass; the cage's glass paler still
// in pale frames under a white rim; the lobby's dark glass in grey mullions; the wind catcher signal red and warm
// white, red inside; the club's pool blue on the aerial
const C = {
  glass: 0x8fb2b5, planted: 0x7b9a5e, cageGlass: 0xa3c2c4, cageFrame: 0xe4eae8, lobbyGlass: 0x3c5159, lobbyFrame: 0x9ba7a9,
  recess: 0x47514f, fin: 0xe2e7e5, red: 0xc8202e, white: 0xece8e0, green: 0x6a8b47, leaf: 0x4b7a37, paving: 0xcfcbc1,
  pool: 0x4f9fc4
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
const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  const s = area(ring) >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// A ring with each edge moved inward by its own distance (0 keeps it where it is)
function offsetRing(ring, d) {
  const n = ring.length, N = normalsOf(ring);
  const lines = ring.map((a, i) => ({ n: N[i], c: a[0] * N[i][0] + a[1] * N[i][1] - d[i] }));
  return ring.map((p, i) => {
    const A = lines[(i + n - 1) % n], B = lines[i], det = A.n[0] * B.n[1] - A.n[1] * B.n[0];
    if (Math.abs(det) < 1e-9) return [p[0] - B.n[0] * d[i], p[1] - B.n[1] * d[i]];
    return [(A.c * B.n[1] - A.n[1] * B.c) / det, (A.n[0] * B.c - A.c * B.n[0]) / det];
  });
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
const centroid = (r) => {
  let cx = 0, cz = 0, a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    a += f; cx += (r[j][0] + r[i][0]) * f; cz += (r[j][1] + r[i][1]) * f;
  }
  return [cx / (3 * a), cz / (3 * a)];
};
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`CapitaGreen needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    // the double skin: pale glass with the planting behind it as a fine, sparse scatter of mid-green a bay wide and a
    // storey tall (and a planter's line each storey), thinning toward the top; the fins in front of it are built
    glass: kit.facadeMaterial({ wall: C.planted, window: C.glass, floorHeight: STOREY, bayWidth: 1.5, pattern: 'scatter', scatter: { density: 0.26, top: 0.16, ramp: [40, 200], length: 1, seed: 7 } }),
    // the cage: the outer skin's paler glass in a tight grid of frames, rails 1.25 m apart and mullions 1.5 m
    cage: kit.facadeMaterial({ wall: C.cageFrame, window: C.cageGlass, floorHeight: 1.25, bayWidth: 1.5, pattern: 'curtain' }),
    lobby: kit.facadeMaterial({ wall: C.lobbyFrame, window: C.lobbyGlass, floorHeight: 10, bayWidth: 3, pattern: 'curtain' }),
    recess: kit.material(C.recess), fin: kit.material(C.fin, { roughness: 0.5, metalness: 0.2 }),
    red: kit.material(C.red, { roughness: 0.4 }), white: kit.material(C.white, { roughness: 0.55 }),
    green: kit.material(C.green), leaf: kit.material(C.leaf), paving: kit.material(C.paving), pool: kit.material(C.pool, { roughness: 0.2 })
  };

  // --- the drawing: u along the grid toward Market Street (the city's x), v across it away from the raised block (the
  // city's z), metres from the tower's mapped extremes: independent of the anchor ----------------------------------------
  const tower = ring(ID.tower);
  const U = kit.compass(GRID), V = kit.compass(GRID + 90);
  const dot = (p, a) => p[0] * a[0] + p[1] * a[1];
  const u0 = Math.min(...tower.map((p) => dot(p, U))), v0 = Math.min(...tower.map((p) => dot(p, V)));
  const uMax = Math.max(...tower.map((p) => dot(p, U))) - u0, vMax = Math.max(...tower.map((p) => dot(p, V))) - v0;
  const P = (u, v) => [U[0] * (u + u0) + V[0] * (v + v0), U[1] * (u + u0) + V[1] * (v + v0)];
  const D = (p) => [dot(p, U) - u0, dot(p, V) - v0];
  // the part of a ring on one side of u = value or v = value ('<' or '>')
  const clip = (r, axis, value, keep) => cut(r, axis === 'u' ? U : V, value + (axis === 'u' ? u0 : v0), keep === '<');
  const yOf = (s) => H.lobby + s * STOREY;

  // the tower's walls, each cut into pieces about 16 m long: a zone of the façade is one piece a few storeys tall
  const towerN = normalsOf(tower);
  const walls = tower.map((a, i) => {
    const b = tower[(i + 1) % tower.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, L, n: towerN[i], pieces: Math.max(1, Math.round(L / 16)) };
  });
  const fine = walls.flatMap((w) => Array.from({ length: w.pieces }, (_, k) => [w.a[0] + ((w.b[0] - w.a[0]) * k) / w.pieces, w.a[1] + ((w.b[1] - w.a[1]) * k) / w.pieces]));
  // which wall of the tower (and which piece of it) a segment lies on, or null for a cut inside the plan
  const wallOf = (p, q) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    for (const [i, w] of walls.entries()) {
      const ex = w.b[0] - w.a[0], ez = w.b[1] - w.a[1], t = ((m[0] - w.a[0]) * ex + (m[1] - w.a[1]) * ez) / (w.L * w.L);
      if (t < -1e-6 || t > 1 + 1e-6) continue;
      if (Math.hypot(w.a[0] + ex * t - m[0], w.a[1] + ez * t - m[1]) < 0.05) return { i, piece: Math.min(w.pieces - 1, Math.floor(t * w.pieces)) };
    }
    return null;
  };
  // the façade's walls in the double skin's glass; where a sky terrace is cut into the plan, its dark inner walls
  const skin = (r, i) => (wallOf(r[i], r[(i + 1) % r.length]) ? M.glass : M.recess);
  // The part of a ring outside a sky terrace's box at a corner: a ring less a box is two convex pieces, the one beyond
  // the box's u and the one beside it short of its v
  const terraceBox = (t) => {
    const [cu, cv] = t.corner, [su, sv] = t.size;
    return { u: cu === 'lo' ? [su, '<'] : [uMax - su, '>'], v: cv === 'lo' ? [sv, '<'] : [vMax - sv, '>'] };
  };
  const flip = (k) => (k === '<' ? '>' : '<');
  const less = (r, t) => {
    const b = terraceBox(t);
    const beyond = clip(r, 'u', b.u[0], flip(b.u[1]));
    const beside = clip(clip(r, 'u', b.u[0], b.u[1]), 'v', b.v[0], flip(b.v[1]));
    return [beyond, beside].filter((p) => p.length >= 3 && Math.abs(area(p)) > 1);
  };
  const within = (r, t) => { const b = terraceBox(t); return clip(clip(r, 'u', b.u[0], b.u[1]), 'v', b.v[0], b.v[1]); };

  // --- the tower ----------------------------------------------------------------------------------------------------------
  // The lobby: tall glass from the ground to the raised block's soffit, in four pieces so that each one's collider
  // keeps to it (the cut corners take wall-hugging colliders, the rest a box)
  // the corners' cuts: where the east one leaves the north-east wall, where the west one leaves the north-west wall and
  // where it meets the south-west wall
  const chamferE = Math.max(...tower.filter((p) => D(p)[1] < 1).map((p) => D(p)[0]));
  const chamferW = Math.max(...tower.filter((p) => D(p)[0] < 1).map((p) => D(p)[1]));
  const westEnd = Math.min(...tower.filter((p) => D(p)[1] > vMax - 1).map((p) => D(p)[0]));
  const lobbyPieces = [
    clip(fine, 'u', chamferE, '>'),
    clip(clip(fine, 'u', westEnd, '<'), 'v', chamferW, '>'),
    clip(clip(fine, 'u', westEnd, '<'), 'v', chamferW, '<'),
    clip(clip(fine, 'u', westEnd, '>'), 'u', chamferE, '<')
  ].filter((p) => p.length >= 3 && Math.abs(area(p)) > 1);
  lobbyPieces.forEach((r, k) => kit.prism({ ring: r, y0: 0, y1: H.lobby, material: M.lobby, top: M.green, name: `base-lobby-${k}` }));
  // Solid to fly into: the kit takes a ring that nearly fills its box as the whole box, which here would wall off the
  // pavement outside the cut corners; so the plan is cut along the corners' ends into rectangles (their boxes exact)
  // and the corners' triangles (filled strip by strip)
  const chamferES = Math.min(...tower.filter((p) => D(p)[0] > uMax - 1).map((p) => D(p)[1])); // where the east cut meets the south-east wall
  const solidify = (r, y0, y1) => {
    let cells = [r];
    for (const [axis, value] of [['u', westEnd], ['u', chamferE], ['v', chamferW], ['v', chamferES]]) {
      cells = cells.flatMap((q) => [clip(q, axis, value, '<'), clip(q, axis, value, '>')]);
    }
    for (const q of cells) if (q.length >= 3 && Math.abs(area(q)) > 0.5) kit.collisionPrism({ ring: q, y0, y1 });
  };
  // the storeys over it, band by band: three storeys at a time, split where a sky terrace begins or ends
  const breaks = new Set([0, 38]);
  for (let s = 3; s < 38; s += 3) breaks.add(s);
  for (const t of TERRACES) t.storeys.forEach((s) => breaks.add(s));
  const bands = [...breaks].sort((a, b) => a - b);
  for (let k = 0; k + 1 < bands.length; k++) {
    const [s0, s1] = [bands[k], bands[k + 1]];
    let pieces = [fine];
    for (const t of TERRACES) if (t.storeys[0] <= s0 && s1 <= t.storeys[1]) pieces = pieces.flatMap((r) => less(r, t));
    pieces.forEach((r, j) => {
      kit.prism({ ring: r, y0: yOf(s0), y1: yOf(s1), material: M.recess, edgeMaterial: (i) => skin(r, i), top: M.green, name: `tower-${s0}-${j}` });
      solidify(r, yOf(s0), yOf(s1));
    });
  }
  // the lobby too is solid to fly into, all through
  solidify(fine, 0, H.lobby);

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name, sides = 7) {
    const around = (rr) => Array.from({ length: sides }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / sides) * rr, z + Math.sin((i * 2 * Math.PI) / sides) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.1), segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
  // A palm: a tall thin trunk under a flat star of fronds
  function palm(x, z, y, h, name) {
    kit.cylinder({ x, z, y0: y, y1: y + h - 0.6, r: 0.22, segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    const star = Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5, rr = i % 2 ? 1.1 : 3.2; return [x + Math.cos(a) * rr, z + Math.sin(a) * rr]; });
    kit.loft({ ring: star.map(([px, pz]) => [x + (px - x) * 0.25, z + (pz - z) * 0.25]), topRing: star, y0: y + h - 1.4, y1: y + h, material: M.leaf, top: M.leaf, name: `${name}-palm-crown` });
  }

  // The sky terraces: dark walls where they are cut into the plan (above), a planted floor, the frame at the façade line
  // (a column at each end and every 8 m, a slab edge each storey between floor and ceiling) and a tree
  TERRACES.forEach((t, k) => {
    const r = within(fine, t), [y0, y1] = t.storeys.map(yOf);
    const N = normalsOf(r);
    r.forEach((a, i) => {
      const b = r[(i + 1) % r.length];
      if (!wallOf(a, b)) return;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 8)), [nx, nz] = N[i];
      const at = (f) => [a[0] + (b[0] - a[0]) * f - nx * 0.45, a[1] + (b[1] - a[1]) * f - nz * 0.45];
      for (let j = 0; j <= n; j++) {
        const [x, z] = at(Math.min(Math.max(j / n, 0.02), 0.98));
        kit.beam({ from: [x, y0, z], to: [x, y1, z], w: 0.8, h: 0.8, material: M.white, name: `tower-terrace-${k}-column-${i}-${j}` });
      }
      for (let s = t.storeys[0] + 1; s < t.storeys[1]; s++) {
        const [ax, az] = at(0), [bx, bz] = at(1);
        kit.beam({ from: [ax, yOf(s) - 0.35, az], to: [bx, yOf(s) - 0.35, bz], w: 0.6, h: 0.6, material: M.white, name: `tower-terrace-${k}-slab-${i}-${s}` });
      }
    });
    const [cx, cz] = centroid(r);
    tree(cx, cz, y0, 6, 2.2, `tower-terrace-${k}`);
  });

  // --- the outer skin's fins: pale, every 1.5 m round the tower, standing out square to their walls, from the lobby's
  // top (from the raised block's roof where it stands against the tower) past the roof deck to the cage's rim; not
  // across the sky terraces, where their own concrete frame shows ---------------------------------------------------------
  const block = ring(ID.block);
  const inTerrace = (p, t) => {
    const b = terraceBox(t), [du, dv] = D(p);
    const ok = ([value, keep], x) => (keep === '<' ? x <= value + 0.01 : x >= value - 0.01);
    return ok(b.u, du) && ok(b.v, dv);
  };
  walls.forEach((w, i) => {
    const t = [(w.b[0] - w.a[0]) / w.L, (w.b[1] - w.a[1]) / w.L], [nx, nz] = w.n;
    // a fin's depth along its wall's normal (the city's x or z), its thickness along the wall; square on the cut corners
    const [fw, fh] = Math.abs(nx) > 0.9 ? [0.6, 0.28] : Math.abs(nz) > 0.9 ? [0.28, 0.6] : [0.4, 0.4];
    const n = Math.max(1, Math.round(w.L / 1.5));
    for (let j = 0; j < n; j++) {
      const s = ((j + 0.5) * w.L) / n, foot = [w.a[0] + t[0] * s, w.a[1] + t[1] * s];
      const [x, z] = [foot[0] + nx * 0.32, foot[1] + nz * 0.32];
      const gaps = TERRACES.filter((tt) => inTerrace(foot, tt)).map((tt) => tt.storeys.map(yOf)).sort((a, b) => a[0] - b[0]);
      let y = inside([x, z], block) ? H.blockTop : H.lobby, k = 0;
      for (const [g0, g1] of [...gaps, [H.cage, H.cage]]) {
        if (g0 > y + 0.5) kit.beam({ from: [x, y, z], to: [x, g0, z], w: fw, h: fh, material: M.fin, name: `tower-fin-${i}-${j}-${k++}` });
        y = Math.max(y, g1);
      }
    }
  });

  // --- the crown: the Sky Forest in its cage, the restaurant's box, the wind catcher --------------------------------------
  // The cage: the outer skin carried up past the roof deck, its paler glass in a tight grid of frames just inside the
  // fins from the deck to 2 m under the top, two rails across the open band over it, and a flat white rim on the fins
  const band = (d0, d1) => { const a = kit.inset(tower, d0), b = kit.inset(tower, d1); return tower.map((_, i) => { const j = (i + 1) % tower.length; return [a[i], a[j], b[j], b[i]]; }); };
  band(0.15, 0.3).forEach((q, i) => kit.prism({ ring: q, y0: H.roof, y1: H.glass, material: M.cage, top: M.fin, name: `crown-cage-glass-${i}` }));
  band(-0.8, 1.4).forEach((q, i) => {
    kit.prism({ ring: q, y0: H.cage, y1: H.rim, material: M.white, top: M.white, name: `crown-cage-rim-${i}` });
    kit.collisionPrism({ ring: q, y0: H.cage, y1: H.rim });
  });
  const railLine = kit.inset(tower, 0.05);
  railLine.forEach((a, i) => {
    const b = railLine[(i + 1) % railLine.length];
    for (const y of [219.6, 220.4]) kit.beam({ from: [a[0], y, a[1]], to: [b[0], y, b[1]], w: 0.18, h: 0.18, material: M.fin, name: `crown-cage-rail-${i}-${y}` });
  });

  // the Sky Forest: a raised garden in white concrete walls over the middle of the deck (the club's pool beside it
  // along the south-west wall), as the photograph from Marina Bay Sands shows it over the deck's lower terraces
  const garden = clip(kit.inset(tower, 7), 'v', vMax - 11.5, '<');
  kit.prism({ ring: garden, y0: H.roof, y1: H.garden, material: M.white, top: M.green, name: 'crown-garden' });
  kit.collisionPrism({ ring: garden, y0: H.roof, y1: H.garden });
  // the wind catcher's axis: a little west of the plan's middle, as the aerial shows its petals
  const [mx, mz] = centroid(tower), west = kit.compass(270);
  const c = [mx + west[0] * 3, mz + west[1] * 3];
  // the restaurant: a white box on the deck beside the wind catcher's neck, rising through the garden
  const toE = kit.compass(ROSE + 90), toN = kit.compass(ROSE);
  const boxAt = (a, b) => [c[0] + toE[0] * a + toN[0] * b, c[1] + toE[1] * a + toN[1] * b];
  const box = [boxAt(-1.5, -7.5), boxAt(12, -7.5), boxAt(12, 7.5), boxAt(-1.5, 7.5)];
  kit.prism({ ring: box, y0: H.roof, y1: H.box, material: M.white, top: M.paving, name: 'crown-restaurant' });
  kit.collisionPrism({ ring: box, y0: H.roof, y1: H.box });

  // The wind catcher. A red neck from the deck widens in a curve into the lower funnel under a broad white collar at
  // the cage's rim; from the collar the two tall petals flare as one trumpet split north and south, each wrapping half
  // way round and cut off in a level lip (the north one white outside, the south one red; both red inside); two red
  // horns spring from the lower funnel and sweep out east and west under the collar and past it
  const around = (r, n = 16) => Array.from({ length: n }, (_, i) => { const a = ((i + 0.5) * 2 * Math.PI) / n; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
  const NECK = [[H.roof, 3.0], [H.funnel, 2.8], [215.5, 3.5], [218.5, 5.0], [220.6, 7.0], [H.collar + 0.3, 9.4]];
  for (let k = 0; k + 1 < NECK.length; k++) {
    const [[y0, r0], [y1, r1]] = [NECK[k], NECK[k + 1]];
    kit.loft({ ring: around(r0), y0, y1, scale: r1 / r0, material: M.red, top: M.red, name: `crown-neck-${k}` });
  }
  kit.loft({ ring: around(9, 24), y0: H.collar, y1: H.collar + 0.9, scale: 12.5 / 9, material: M.white, top: M.white, name: 'crown-collar-under' });
  kit.loft({ ring: around(12.5, 24), y0: H.collar + 0.9, y1: H.collarTop, scale: 10.5 / 12.5, material: M.white, top: M.white, name: 'crown-collar' });
  kit.collisionPrism({ ring: around(3.2), y0: H.roof, y1: 216 });
  kit.collisionPrism({ ring: around(6), y0: 216, y1: H.collar });
  kit.collisionPrism({ ring: around(12.5), y0: H.collar, y1: H.collarTop });
  // the petals: shells 0.45 m thick, each an arc of 184° about the axis (the two overlapping a little to the east and
  // west, the south one outside: it starts wider and grows faster), their radius growing with the square of the height
  // over the collar (as the photographs' edges curve), lofted in five rings for a smooth flare
  const SPAN = 92, T = 0.45, K = 8, STEPS = [0, 0.3, 0.5, 0.68, 0.84, 1];
  for (const p of [{ name: 'north', deg: ROSE, top: H.tip, r0: 4.2, r1: 15.5, outer: M.white }, { name: 'south', deg: ROSE + 180, top: H.south, r0: 4.9, r1: 15, outer: M.red }]) {
    const y0 = H.collarTop - 0.2, r0 = p.r0;
    const at = (f) => ({ y: y0 + (p.top - y0) * f, r: r0 + (p.r1 - r0) * f * f });
    const arc = (r) => Array.from({ length: K + 1 }, (_, k) => { const d = kit.compass(p.deg - SPAN + (2 * SPAN * k) / K); return [c[0] + d[0] * r, c[1] + d[1] * r]; });
    const shell = ({ r }) => [...arc(r), ...arc(r + T).reverse()];
    for (let k = 0; k + 1 < STEPS.length; k++) {
      const lo = at(STEPS[k]), hi = at(STEPS[k + 1]);
      kit.loft({ ring: shell(lo), topRing: shell(hi), y0: lo.y, y1: hi.y, material: p.outer, edgeMaterial: (i) => (i < K ? M.red : p.outer), top: p.outer, name: `crown-petal-${p.name}-${k}` });
    }
    // to fly into: the petal's plan, from its foot on the collar to its lip
    kit.collisionPrism({ ring: [...arc(r0), ...arc(p.r1 + T).reverse()], y0, y1: p.top });
  }
  for (const [name, deg] of [['east', ROSE + 90], ['west', ROSE + 270]]) {
    const d = kit.compass(deg);
    const pts = [4, 7.2, 10.2, 12.8, 15, 17].map((r) => { const f = (r - 4) / 13; return [c[0] + d[0] * r, 216.5 + 7.5 * f * f, c[1] + d[1] * r]; });
    [3.6, 3, 2.3, 1.6, 0.9].forEach((w, k) => kit.beam({ from: pts[k], to: pts[k + 1], w, h: 0.4, material: M.red, name: `crown-horn-${name}-${k}` }));
  }

  // the club's pool along the south-west wall, open to the sky inside the cage (blue on the aerial), in a paved surround
  const rect = (ua, va, ub, vb) => [P(ua, va), P(ub, va), P(ub, vb), P(ua, vb)];
  const poolDeck = rect(10.5, vMax - 10.5, 37.5, vMax - 1.6);
  kit.prism({ ring: poolDeck, y0: H.roof, y1: H.roof + 0.15, material: M.paving, top: M.paving, name: 'crown-pool-deck' });
  kit.prism({ ring: rect(12, vMax - 9, 36, vMax - 3.1), y0: H.roof, y1: H.roof + 0.2, material: M.paving, top: M.pool, name: 'crown-pool' });
  // the Sky Forest's trees: on the raised garden and on the deck's terraces round it, clear of the garden's walls, the
  // restaurant, the pool, the neck and the cage
  const deck = kit.inset(tower, 3);
  for (let a = -40, i = 0; a < 40; a += 7, i++) {
    for (let b = -40, j = 0; b < 40; b += 7, j++) {
      const [x, z] = [c[0] + U[0] * (a + (hash(i, j, 11) - 0.5) * 3) + V[0] * (b + (hash(i, j, 12) - 0.5) * 3), c[1] + U[1] * (a + (hash(i, j, 11) - 0.5) * 3) + V[1] * (b + (hash(i, j, 12) - 0.5) * 3)];
      if (!inside([x, z], deck) || clearance([x, z], deck) < 1 || Math.hypot(x - c[0], z - c[1]) < 6.5) continue;
      if (inside([x, z], box) || clearance([x, z], box) < 2 || inside([x, z], poolDeck) || clearance([x, z], poolDeck) < 2) continue;
      const onGarden = inside([x, z], garden);
      if (clearance([x, z], garden) < (onGarden ? 1.8 : 2.8)) continue;
      const h = 4.5 + 2.5 * hash(i, j, 13);
      tree(x, z, onGarden ? H.garden : H.roof, h, h * 0.36, `crown-forest-${i}-${j}`);
    }
  }

  // --- the base: the raised block on its posts over the plaza --------------------------------------------------------------
  // the block's wall against the tower stays on it; the others take the glass 1.1 m in behind the planted ledges
  const onTower = block.map((a, i) => !!wallOf(a, block[(i + 1) % block.length]));
  const glass = offsetRing(block, onTower.map((t) => (t ? 0 : 1.1)));
  for (const [y0, y1, kind] of [[H.block, 21.3, 'ledge'], [21.3, 25.2, 'glass'], [25.2, 26, 'ledge'], [26, 29.6, 'glass'], [29.6, H.blockTop, 'ledge']]) {
    if (kind === 'ledge') kit.prism({ ring: block, y0, y1, material: M.white, top: M.green, name: `base-block-ledge-${y0}` });
    else kit.prism({ ring: glass, y0, y1, material: M.lobby, top: M.white, name: `base-block-glass-${y0}` });
  }
  kit.collisionPrism({ ring: block, y0: H.block, y1: H.blockTop });
  // the four posts under its outer edge, as mapped, to its soffit
  for (const id of ID.posts) kit.prism({ ring: ring(id), y0: 0, y1: H.block, material: M.white, top: M.white, name: `base-post-${id}` });
  // the plaza: paved up to the tower, planted beds along Cecil Street and Market Street with palms in them, the white
  // wavy columns among the posts and before the lobby, palms on the block's roof garden
  kit.prism({ ring: offsetRing(block, onTower.map((t) => (t ? 0 : 0.2))), y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-plaza' });
  const BN = normalsOf(block);
  const bed = (i, f0, f1, width, label) => {
    const a = block[i], b = block[(i + 1) % block.length], [nx, nz] = BN[i];
    const at = (f, d) => [a[0] + (b[0] - a[0]) * f - nx * d, a[1] + (b[1] - a[1]) * f - nz * d];
    const r = [at(f0, 0.6), at(f1, 0.6), at(f1, 0.6 + width), at(f0, 0.6 + width)];
    kit.prism({ ring: r, y0: 0.32, y1: 0.8, material: M.paving, top: M.green, name: `base-bed-${label}` });
    for (let k = 0; k < 3; k++) {
      const [x, z] = at(f0 + ((f1 - f0) * (k + 0.5)) / 3, 0.6 + width / 2);
      palm(x, z, 0.8, 8.5 + 2 * hash(i, k, 5), `base-bed-${label}-${k}`);
    }
  };
  // the block's edges: the one on the tower, Market Street's (east), the posts' (north-east) and Cecil Street's (west)
  const towardTower = onTower.indexOf(true);
  const edgeFacing = (deg) => { const d = kit.compass(deg); return BN.reduce((best, n, i) => (n[0] * d[0] + n[1] * d[1] > BN[best][0] * d[0] + BN[best][1] * d[1] ? i : best), 0); };
  const eastEdge = edgeFacing(90), westEdge = edgeFacing(GRID + 180);
  if (towardTower < 0 || eastEdge === towardTower || westEdge === towardTower) throw new Error('CapitaGreen: the raised block is not where it is mapped');
  bed(eastEdge, 0.2, 0.8, 2.6, 'market-street');
  bed(westEdge, 0.12, 0.7, 2.6, 'cecil-street');
  const posts = ID.posts.map((id) => centroid(ring(id)));
  const roomy = (p) => inside(p, kit.inset(block, 3.2)) && posts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 2);
  let n = 0;
  for (const [u, v] of [[4.5, -15], [7, -11.5], [11.5, -16], [12.5, -8.5], [17.5, -15.5], [19, -10.5], [23.5, -13.5], [9, -4], [15, -3.5], [21, -5], [26.5, -5.5], [6.5, -7], [26, -9.5], [3.5, -3.5]]) {
    const [x, z] = P(u, v);
    if (!roomy([x, z])) continue;
    // a slow wave up to the soffit, swaying one way then the other in a plane of its own
    const a = 2 * Math.PI * hash(u, v, 1), phase = 2 * Math.PI * hash(u, v, 2), STEPS = 6;
    const bend = Array.from({ length: STEPS + 1 }, (_, k) => {
      const sway = 0.7 * Math.sin(phase + (k * 1.7 * Math.PI) / STEPS) * Math.sin((k * Math.PI) / STEPS);
      return [x + Math.cos(a) * sway, 0.32 + ((H.block - 0.32) * k) / STEPS, z + Math.sin(a) * sway];
    });
    for (let k = 0; k < STEPS; k++) kit.beam({ from: bend[k], to: bend[k + 1], w: 0.6, h: 0.6, material: M.white, name: `base-column-${n}-${k}` });
    n++;
  }
  const roofGarden = kit.inset(block, 3.5);
  for (const [k, [u, v]] of [[5, -14], [12, -15], [19, -14], [8, -6], [16, -7], [24, -6]].entries()) {
    const p = P(u, v);
    if (inside(p, roofGarden)) palm(p[0], p[1], H.blockTop, 6 + 1.5 * hash(k, 9), `base-roof-${k}`);
  }

  // the name over the lobby on the south-east wall, as the photographs show it: small, in green letters on the glass
  const se = walls.find((w) => dot(w.n, U) > 0.99);
  kit.hang({ ring: [se.a, se.b, [mx, mz]], top: H.lobby, toward: GRID, below: 4.5, text: 'CAPITAGREEN', height: 1.6, color: 0x4d9a3e, name: 'sign:capitagreen' });
}
