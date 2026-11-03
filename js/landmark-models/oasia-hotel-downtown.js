// js/landmark-models/oasia-hotel-downtown.js
// Oasia Hotel Downtown (SG-115), 100 Peck Seah Street (WOHA, 2016): a 27-storey tower wrapped in a red
// aluminium mesh with creepers, built as full-height service cores in its four rounded corners (each a green
// facade in WOHA's plans) with L-shaped floors stacked between sky terraces. Each stratum is one tall
// framed opening: the enclosed L fills two faces from terrace deck to terrace deck while the opposite corner
// stays open as a sky garden, and the L flips corner at every terrace (offices east+north, guestrooms
// south+west, club rooms east+north again, as WOHA's 7th-11th, 13th-20th and 22nd-25th plans show). The
// mesh continues over the 27th-storey roof terrace as an open-topped crown ring curving inward, so the
// rooftop pools stay visible from above. Terrace decks at about 26, 70, 114 and 144 m and the 190 m top
// are scaled from WOHA's published section (1:900, whose width matches the mapped footprint); the total
// is the documented 190.15 m. The mapped outline is OSM way 393100847 (27 levels, mapped 193 m).
// See docs/oasia-hotel-downtown.md.
export const info = { name: 'Oasia Hotel Downtown', height: 190 };

const OUTLINE = 393100847;
const DECKS = [26, 70, 114, 144]; // 6th, 12th, 21st and 27th storey sky terraces, scaled from the section
const TOP = 190;
const DEPTH = 18; // an L leg's depth from its face, from the typical-floor plans
const CORNER = 13; // a corner core's reach along each face from its corner
// label, deck, next deck, the corner the L wraps [east/west sign on u, south/north sign on v]
const STRATA = [
  ['offices', DECKS[0], DECKS[1], [1, -1]],
  ['guestrooms', DECKS[1], DECKS[2], [-1, 1]],
  ['club', DECKS[2], DECKS[3], [1, -1]]
];

export function build(kit, site) {
  const mapped = site.parts.find((p) => p.id === OUTLINE);
  if (!mapped?.ring?.length) throw new Error(`Oasia Hotel Downtown needs mapped outline ${OUTLINE}`);
  let ring = mapped.ring.map((p) => [...p]);
  const f = ring[0], l = ring[ring.length - 1];
  if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);

  // Local frame: u toward true east along a mapped edge, v toward true south, origin at the footprint's centre
  const east = kit.compass(90), south = kit.compass(180);
  let edge = [1, 0], best = -1;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], v = [b[0] - a[0], b[1] - a[1]];
    const d = v[0] * east[0] + v[1] * east[1];
    if (Math.abs(d) > best) { best = Math.abs(d); edge = d > 0 ? v : v.map((x) => -x); }
  }
  const el = Math.hypot(...edge), E = edge.map((x) => x / el);
  let S = [-E[1], E[0]];
  if (S[0] * south[0] + S[1] * south[1] < 0) S = S.map((x) => -x);
  let cx = 0, cz = 0;
  for (const [x, z] of ring) { cx += x / ring.length; cz += z / ring.length; }
  const proj = ([x, z]) => [(x - cx) * E[0] + (z - cz) * E[1], (x - cx) * S[0] + (z - cz) * S[1]];
  const raw = ring.map(proj);
  const us = raw.map((p) => p[0]), vs = raw.map((p) => p[1]);
  const ou = (Math.min(...us) + Math.max(...us)) / 2, ov = (Math.min(...vs) + Math.max(...vs)) / 2;
  const hx = (Math.max(...us) - Math.min(...us)) / 2, hz = (Math.max(...vs) - Math.min(...vs)) / 2;
  const ox = cx + ou * E[0] + ov * S[0], oz = cz + ou * E[1] + ov * S[1];
  const toLocal = ([x, z]) => [(x - ox) * E[0] + (z - oz) * E[1], (x - ox) * S[0] + (z - oz) * S[1]];
  const toWorld = ([u, v]) => [ox + u * E[0] + v * S[0], oz + u * E[1] + v * S[1]];
  const ringL = ring.map(toLocal);
  const insetL = (d) => kit.inset(ring, d).map(toLocal);
  const W = (poly) => poly.map(toWorld);
  // How far each face stays flat: its longest mapped edge (the corners are rounded, radius ~12 m, so the
  // flat stretch is only about 21.5 m and its ends are where panels, strands and signs must stop)
  const flat = {};
  for (let i = 0; i < ringL.length; i++) {
    const a = ringL[i], b = ringL[(i + 1) % ringL.length];
    const du = b[0] - a[0], dv = b[1] - a[1], len = Math.hypot(du, dv);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const offer = (face, at, lo, hi) => { if (!flat[face] || len > flat[face].len) flat[face] = { lo, hi, at, len }; };
    if (Math.abs(dv) < 0.6 && mid[1] > hz - 1.2) offer('south', mid[1], Math.min(a[0], b[0]), Math.max(a[0], b[0]));
    if (Math.abs(dv) < 0.6 && mid[1] < -hz + 1.2) offer('north', mid[1], Math.min(a[0], b[0]), Math.max(a[0], b[0]));
    if (Math.abs(du) < 0.6 && mid[0] > hx - 1.2) offer('east', mid[0], Math.min(a[1], b[1]), Math.max(a[1], b[1]));
    if (Math.abs(du) < 0.6 && mid[0] < -hx + 1.2) offer('west', mid[0], Math.min(a[1], b[1]), Math.max(a[1], b[1]));
  }

  // Clip a convex local polygon by another convex local polygon (the footprint is a rounded square)
  const area2 = (p) => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1]; return a; };
  function clip(poly, clipPoly) {
    const s = Math.sign(area2(clipPoly)) || 1;
    let out = poly;
    for (let i = 0; i < clipPoly.length && out.length; i++) {
      const a = clipPoly[i], b = clipPoly[(i + 1) % clipPoly.length];
      const inside = (p) => s * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= -1e-9;
      const next = [];
      for (let j = 0; j < out.length; j++) {
        const p = out[j], q = out[(j + 1) % out.length], pin = inside(p), qin = inside(q);
        if (pin) next.push(p);
        if (pin !== qin) {
          const dp = s * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
          const dq = s * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]));
          const t = dp / (dp - dq);
          next.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
        }
      }
      out = next;
    }
    return out;
  }
  const rect = (u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const cornerCap = (su, sv, reach = CORNER, poly = ringL) => clip(poly,
    rect(su > 0 ? hx - reach : -hx - 2, sv > 0 ? hz - reach : -hz - 2, su > 0 ? hx + 2 : -hx + reach, sv > 0 ? hz + 2 : -hz + reach));

  const M = {
    // the mesh's vertical panels, in the mixed reds, orange, pink and near-white of the photographs
    meshTones: [0xb3312c, 0xc85a34, 0xa82a33, 0xb3312c, 0xd77a6a, 0xc8503a, 0xb3312c, 0xe3b7a4].map((c) => kit.material(c)),
    rooms: kit.facadeMaterial({ wall: 0x8f7f74, window: 0x2c3438, floorHeight: 3.6, bayWidth: 2.4, pattern: 'ribbon' }),
    core: kit.facadeMaterial({ wall: 0x668548, window: 0x354d26, floorHeight: 4.5, bayWidth: 1.5, windowWidth: 0.5, pattern: 'strips' }),
    dark: kit.material(0x2e3134), deck: kit.material(0x8b8d84),
    green: kit.material(0x3f7031), green2: kit.material(0x5d8f3e),
    pool: kit.glassMaterial(0x2f7f9f)
  };
  const prismL = (poly, y0, y1, material, name, top = material) =>
    poly.length >= 3 ? kit.prism({ ring: W(poly), y0, y1, material, top, name }) : null;
  const B = (u, v, y, w, h, d, material, name) => {
    const [x, z] = toWorld([u, v]);
    return kit.box({ x, z, y, w, h, d, yaw: Math.atan2(E[1], E[0]), material, top: material, name });
  };
  const C = (u, v, y0, y1, r, material, name, segments = 10) => {
    const [x, z] = toWorld([u, v]);
    return kit.cylinder({ x, z, y0, y1, r, segments, material, top: material, name });
  };
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const tone = (i) => M.meshTones[Math.abs(Math.floor(rnd(i * 3.7 + 11) * 17)) % M.meshTones.length];

  // The mesh on one enclosed face: vertical panels in mixed tones, only where the face is flat
  function meshFace(face, y0, y1, seed) {
    const { lo, hi, at } = flat[face];
    for (let col = 0, a = lo + 0.7; a <= hi - 0.7; a += 1.55, col++) {
      const mat = tone(seed + col * 7), name = `mesh-${face}-${Math.round(y0)}-${col}`;
      if (face === 'south') B(a, at - 0.05, y0, 1.35, y1 - y0, 0.35, mat, name);
      else if (face === 'north') B(a, at + 0.05, y0, 1.35, y1 - y0, 0.35, mat, name);
      else if (face === 'east') B(at - 0.05, a, y0, 0.35, y1 - y0, 1.35, mat, name);
      else B(at + 0.05, a, y0, 0.35, y1 - y0, 1.35, mat, name);
    }
  }
  // Creepers as vertical strands hanging on the mesh, kept on the flat stretch of each face
  function strandsFace(face, y0, y1, seed, density = 0.55) {
    const { lo, hi, at } = flat[face];
    for (let col = 0, a = lo + 0.5; a <= hi - 0.5; a += 1.5, col++) {
      const r = rnd(seed + col * 13.7);
      if (r > density) continue;
      const len = (0.35 + r * 0.75) * (y1 - y0), y = y1 - len, out = 0.3 + (col % 3) * 0.06;
      const mat = col % 2 ? M.green : M.green2, name = `creeper-${face}-${Math.round(y0)}-${col}`;
      if (face === 'south') B(a, at + out, y, 0.8, len, 0.25, mat, name);
      else if (face === 'north') B(a, at - out, y, 0.8, len, 0.25, mat, name);
      else if (face === 'east') B(at + out, a, y, 0.25, len, 0.8, mat, name);
      else B(at - out, a, y, 0.25, len, 0.8, mat, name);
    }
  }
  // Creepers following the rounded corners themselves, sampled along the mapped perimeter
  function cornerStrands(y0, y1, seed) {
    let idx = 0;
    for (let i = 0; i < ringL.length; i++) {
      const a = ringL[i], b = ringL[(i + 1) % ringL.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 1.8));
      const du = (b[0] - a[0]) / len, dv = (b[1] - a[1]) / len;
      for (let k = 0; k < n; k++, idx++) {
        const t = (k + 0.5) / n, u = a[0] + (b[0] - a[0]) * t, v = a[1] + (b[1] - a[1]) * t;
        if (!(Math.abs(u) > hx - 14.5 && Math.abs(v) > hz - 14.5)) continue;
        let nx = dv, nz = -du;
        if (nx * u + nz * v < 0) { nx = -nx; nz = -nz; }
        const [x, z] = toWorld([u + nx * 0.2, v + nz * 0.2]);
        const dir = [E[0] * du + S[0] * dv, E[1] * du + S[1] * dv];
        for (let c = 0; c < 4; c++) {
          const r = rnd(seed + idx * 7.3 + c * 31.7);
          if (r > 0.78) continue;
          const chunk = (y1 - y0) / 4, h = chunk * (0.55 + r * 0.5);
          kit.box({ x, z, y: y0 + chunk * (c + 1) - h - 0.15, w: 1.1, h, d: 0.28, yaw: Math.atan2(dir[1], dir[0]), material: (idx + c) % 2 ? M.green : M.green2, top: M.green, name: `corner-creeper-${idx}-${c}` });
        }
      }
    }
  }

  // Four full-height corner cores, their outer faces the green facade of the plans
  for (const su of [-1, 1]) for (const sv of [-1, 1]) {
    const cap = cornerCap(su, sv);
    prismL(cap, -0.3, DECKS[3], M.core, `corner-core-${su}-${sv}`, M.deck);
    kit.collisionPrism({ ring: W(cap), y0: 0, y1: DECKS[3] });
  }
  cornerStrands(2, DECKS[3], 501);

  // Base (ground to the 6th-storey terrace): full footprint behind mesh on all four faces
  kit.prism({ ring: kit.inset(ring, 1.0), y0: -0.3, y1: DECKS[0], material: M.rooms, top: M.deck, name: 'base' });
  kit.collisionPrism({ ring: kit.inset(ring, 0.4), y0: 0, y1: DECKS[0] });
  for (const [i, face] of ['south', 'north', 'east', 'west'].entries()) {
    meshFace(face, 0.5, DECKS[0], 100 + i * 37);
    strandsFace(face, 8, DECKS[0], 200 + i * 41);
  }
  const southCentre = (flat.south.lo + flat.south.hi) / 2;
  B(southCentre, hz - 0.4, 0, 16, 5, 1.2, M.core, 'lobby');
  const canopy = B(southCentre, hz + 0.6, 5.2, 18, 0.4, 2.6, M.meshTones[0], 'entrance-canopy');
  kit.collisionPrism({ ring: canopy.ring, y0: 5.2, y1: 5.6 });

  // Terrace decks across the footprint at every sky-terrace level
  for (const deck of DECKS) {
    kit.prism({ ring: kit.inset(ring, 0.18), y0: deck - 0.15, y1: deck + 0.55, material: M.deck, top: M.deck, name: `deck-${deck}` });
    kit.collisionPrism({ ring: kit.inset(ring, 0.4), y0: deck - 0.1, y1: deck + 0.8 });
  }

  // Each stratum: an L of enclosed floors from deck to deck, the opposite corner open as its sky garden
  const roomsRing = insetL(1.0);
  for (const [label, y0, y1, [su, sv]] of STRATA) {
    const vLeg = clip(roomsRing, rect(-hx + CORNER, sv > 0 ? hz - DEPTH : -hz - 2, hx - CORNER, sv > 0 ? hz + 2 : -hz + DEPTH));
    const uLeg = clip(roomsRing, rect(su > 0 ? hx - DEPTH : -hx - 2, sv > 0 ? -hz + CORNER : -hz + DEPTH, su > 0 ? hx + 2 : -hx + DEPTH, sv > 0 ? hz - DEPTH : hz - CORNER));
    for (const [leg, legName] of [[vLeg, 'v'], [uLeg, 'u']]) {
      prismL(leg, y0 + 0.55, y1, M.rooms, `${label}-leg-${legName}`, M.deck);
      kit.collisionPrism({ ring: W(leg), y0, y1 });
    }
    const faces = [sv > 0 ? 'south' : 'north', su > 0 ? 'east' : 'west'];
    faces.forEach((face, i) => {
      meshFace(face, y0 + 0.5, y1, y0 * 3 + i * 53);
      strandsFace(face, y0 + 4, y1, y0 * 5 + i * 61, 0.6);
    });
    const ou = -su, ov = -sv; // the open corner
    if (label === 'guestrooms') {
      B(ou * 8, ov * 8, y0 + 0.55, 14, 0.5, 14, M.green2, `${label}-lawn`);
    } else {
      B(ou * 9, ov * 7, y0 + 0.55, 5, 0.5, 18, M.pool, `${label}-pool-water`);
      B(ou * 16, ov * -4, y0 + 0.55, 4, 0.7, 6, M.green, `${label}-planting-0`);
      B(ou * -3, ov * 16, y0 + 0.55, 7, 0.7, 3, M.green2, `${label}-planting-1`);
    }
    [[17, 8], [8, 17], [16, -3]].forEach(([tu, tv], i) =>
      C(ou * tu, ov * tv, y0 + 0.5, y0 + 3.8, 1.8, M.green2, `${label}-tree-${i}`));
  }

  // The 27th-storey roof terrace inside the crown: restaurant pavilion, pools along the north and south
  // faces and the corner lifts, as the 27th-storey plan lays them out
  const ROOF = DECKS[3];
  prismL([[0, -8.5], [8.5, 0], [0, 8.5], [-8.5, 0]], ROOF + 0.55, ROOF + 3.4, M.rooms, 'roof-restaurant', M.deck);
  kit.collisionPrism({ ring: W([[0, -8.5], [8.5, 0], [0, 8.5], [-8.5, 0]]), y0: ROOF + 0.55, y1: ROOF + 3.4 });
  B(0, -(hz - 5), ROOF + 0.55, 20, 0.5, 5, M.pool, 'roof-pool-north-water');
  B(0, hz - 5, ROOF + 0.55, 20, 0.5, 5, M.pool, 'roof-pool-water');
  for (const su of [-1, 1]) for (const sv of [-1, 1])
    prismL(cornerCap(su, sv, 8), ROOF + 0.4, ROOF + 3.6, M.core, `roof-lift-${su}-${sv}`, M.deck);
  [[12, 0], [-12, 0], [0, 12], [0, -12]].forEach(([u, v], i) =>
    C(u, v, ROOF + 0.5, ROOF + 4.2, 1.9, M.green2, `roof-tree-${i}`));

  // The crown: an open-topped mesh ring following the whole rounded footprint, curving inward toward
  // the top (insets growing with height, as the section's profile does), in vertical mixed-tone panels
  const crownLevels = [[ROOF, 0], [156, 0.25], [168, 0.9], [180, 2.2], [TOP, 3.5]];
  const outerAt = crownLevels.map(([, d]) => insetL(d));
  const innerAt = crownLevels.map(([, d]) => insetL(d + 0.55));
  const lerpPt = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let segId = 0;
  for (let band = 0; band + 1 < crownLevels.length; band++) {
    let perimSeg = 0; // a panel keeps its tone up the whole crown, as the real vertical panels do
    for (let i = 0; i < ringL.length; i++) {
      const j = (i + 1) % ringL.length;
      const edgeLen = Math.hypot(outerAt[0][j][0] - outerAt[0][i][0], outerAt[0][j][1] - outerAt[0][i][1]);
      const n = Math.max(1, Math.round(edgeLen / 2.2));
      for (let k = 0; k < n; k++, segId++, perimSeg++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const quad = (L) => [lerpPt(outerAt[L][i], outerAt[L][j], t0), lerpPt(outerAt[L][i], outerAt[L][j], t1),
          lerpPt(innerAt[L][i], innerAt[L][j], t1), lerpPt(innerAt[L][i], innerAt[L][j], t0)];
        kit.loft({ ring: W(quad(band)), topRing: W(quad(band + 1)), y0: crownLevels[band][0], y1: crownLevels[band + 1][0], material: tone(perimSeg), top: M.meshTones[0], name: `crown-${band}-${segId}` });
      }
    }
  }
  // Crown collision follows the ring in three height bands at the taper's own insets; the middle stays open
  for (const [level, y0, y1] of [[0, ROOF, 168], [2, 168, 180], [3, 180, TOP]]) {
    for (let i = 0; i < ringL.length; i++) {
      const j = (i + 1) % ringL.length;
      kit.collisionPrism({ ring: W([outerAt[level][i], outerAt[level][j], innerAt[level][j], innerAt[level][i]]), y0, y1 });
    }
  }

  // The hotel's name hung on the club floors' enclosed faces, sized to the wall it sits on
  kit.hang({ ring, top: ROOF, toward: 90, text: 'oasia hotel', height: 5, color: 0xffffff, name: 'sign:oasia-east' });
  kit.hang({ ring, top: ROOF, toward: 0, text: 'oasia hotel', height: 5, color: 0xffffff, name: 'sign:oasia-north' });
}

