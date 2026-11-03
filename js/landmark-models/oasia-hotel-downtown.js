// js/landmark-models/oasia-hotel-downtown.js
// Oasia Hotel Downtown, 100 Peck Seah Street (WOHA, 2016): a 27-storey tower wrapped in a red aluminium
// mesh with creepers growing over it, its floors stacked as strata each served by an open sky terrace
// (levels 6, 12, 21 and the level-27 roof terrace), the terraces flipping from face to face as the
// enclosed core jumps corner, and the mesh continuing above the roof as a hollow arched crown screen
// (documented 42.9 m of crown over a 190.15 m building; the mapped outline, OSM way 393100847, says
// 193 m and 27 levels). Strata heights below are estimates from the documented total, the crown height
// and photographs, not surveyed elevations: enclosed blocks 0-23, 41-64, 82-112 and 127-147 m, open
// terraces between them, the roof deck at 147 m and the vault top at 190 m. See docs/oasia-hotel-downtown.md.
export const info = { name: 'Oasia Hotel Downtown', height: 190 };

const OUTLINE = 393100847;
const BLOCKS = [[0, 23], [41, 64], [82, 112], [127, 147]];
// label, deck, soffit, core corner: NW cores leave the south/east faces open, SE cores the north/west
const TERRACES = [['terrace6', 23, 41, 'NW'], ['terrace12', 64, 82, 'SE'], ['terrace21', 112, 127, 'NW']];
const ROOF = 147, CROWN_WALL_TOP = 166, TOP = 190;

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
  // The mesh panel on one face: the part of the footprint within 0.65 m of that face's flat stretch
  const facePanel = (face) => clip(ringL, {
    south: rect(-hx - 2, hz - 0.65, hx + 2, hz + 2), north: rect(-hx - 2, -hz - 2, hx + 2, -hz + 0.65),
    east: rect(hx - 0.65, -hz - 2, hx + 2, hz + 2), west: rect(-hx - 2, -hz - 2, -hx + 0.65, hz + 2)
  }[face]);

  const M = {
    // The mesh screen itself (terraces, crown, canopy): close red vertical strips over dark red
    mesh: kit.facadeMaterial({ wall: 0xb8352c, window: 0x6e2430, floorHeight: 4.5, bayWidth: 1.6, windowWidth: 0.45, pattern: 'strips' }),
    mesh2: kit.facadeMaterial({ wall: 0xc8503a, window: 0x77303a, floorHeight: 4.5, bayWidth: 1.9, windowWidth: 0.45, pattern: 'strips' }),
    // The enclosed floors seen through the mesh: dark windows in a red-orange grid, alternating tones per block
    block: kit.facadeMaterial({ wall: 0xc23b2e, window: 0x2a2f36, floorHeight: 3.9, bayWidth: 2.2, pattern: 'curtain' }),
    block2: kit.facadeMaterial({ wall: 0xcf5a34, window: 0x2a2f36, floorHeight: 3.9, bayWidth: 2.5, pattern: 'curtain' }),
    core: kit.facadeMaterial({ wall: 0x7a3a34, window: 0x222b33, floorHeight: 3.9, bayWidth: 2.8, pattern: 'curtain' }),
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

  // Creeper patches and green-wrapped corners over a height band of the four faces
  function creepers(y0, y1, tag, density) {
    for (const [fi, face] of ['south', 'north', 'east', 'west'].entries()) {
      for (let col = 0; col < 6; col++) {
        const a = -12.5 + col * 5, off = (col % 3) * 0.05;
        for (let row = 0, y = y0 + 3.5; y < y1 - 2.5; y += 7, row++) {
          const r = rnd(fi * 733 + col * 71 + row * 17 + Math.round(y0));
          if (r > density) continue;
          const h = 3.5 + r * 3, mat = (col + row) % 2 ? M.green : M.green2, name = `${tag}-creeper-${face}-${col}-${row}`;
          if (face === 'south') B(a, hz - 0.02 + off, y, 4.4, h, 0.3, mat, name);
          else if (face === 'north') B(a, -hz + 0.02 - off, y, 4.4, h, 0.3, mat, name);
          else if (face === 'east') B(hx - 0.02 + off, a, y, 0.3, h, 4.4, mat, name);
          else B(-hx + 0.02 - off, a, y, 0.3, h, 4.4, mat, name);
        }
      }
    }
    for (const su of [-1, 1]) for (const sv of [-1, 1])
      C(su * (hx - 5.2), sv * (hz - 5.2), y0 + 0.12, y1 - 0.12, 2.3, M.green, `${tag}-corner-green-${su}-${sv}`);
  }

  // Enclosed strata: the full mapped footprint behind the red mesh
  BLOCKS.forEach(([y0, y1], i) => {
    kit.prism({ ring, y0: i === 0 ? -0.3 : y0, y1, material: i % 2 ? M.block2 : M.block, top: M.deck, name: `block-${i + 1}` });
    kit.collisionPrism({ ring: kit.inset(ring, 0.4), y0: Math.max(0, y0), y1 });
    creepers(i === 0 ? 8 : y0 + 1, y1, `block-${i + 1}`, 0.62);
  });

  // Street front: a dark lobby band under a thin canopy on the Peck Seah (south) face
  B(0, hz - 0.4, 0, 16, 5, 1.2, M.core, 'lobby');
  const canopy = B(0, hz + 0.6, 5.2, 18, 0.4, 2.6, M.mesh, 'entrance-canopy');
  kit.collisionPrism({ ring: canopy.ring, y0: 5.2, y1: 5.6 });

  // Sky terraces: a deck across the footprint, the enclosed core at the back corner, mesh panels only
  // on the core's two faces, the other two faces open under the next block's soffit
  for (const [label, deck, top, corner] of TERRACES) {
    kit.prism({ ring: kit.inset(ring, 0.18), y0: deck - 0.15, y1: deck + 0.55, material: M.deck, top: M.deck, name: `${label}-deck` });
    kit.collisionPrism({ ring: kit.inset(ring, 0.4), y0: deck - 0.1, y1: deck + 0.8 });
    const coreRect = corner === 'NW' ? rect(-hx - 2, -hz - 2, 3, 3) : rect(-3, -3, hx + 2, hz + 2);
    const core = clip(insetL(2.3), coreRect);
    prismL(core, deck - 0.1, top, M.core, `${label}-core`, M.deck);
    kit.collisionPrism({ ring: W(core), y0: deck, y1: top });
    for (const face of corner === 'NW' ? ['north', 'west'] : ['south', 'east']) {
      const panel = facePanel(face);
      prismL(panel, deck + 0.55, top, M.mesh, `${label}-skin-${face}`);
      kit.collisionPrism({ ring: W(panel), y0: deck + 0.55, y1: top });
    }
    const cs = corner === 'NW' ? 1 : -1; // the open corner is opposite the core
    for (const [su, sv] of [[cs, cs], [cs, -cs], [-cs, cs]])
      B(su * (hx - 5.5), sv * (hz - 5.5), deck + 0.55, 0.9, top - deck - 0.55, 0.9, M.dark, `${label}-post-${su}-${sv}`);
    B(cs * 10, cs * 12, deck + 0.55, 14, 0.5, 6, M.pool, `${label}-pool-water`);
    [[14, 4, 5, 3], [5, 17, 3, 5], [-14, 10, 5, 3]].forEach(([u, v, w, d], i) =>
      B(cs * u, cs * v, deck + 0.55, w, 0.7, d, i % 2 ? M.green2 : M.green, `${label}-planting-${i}`));
    [[16, 16], [16, -8], [-8, 16]].forEach(([u, v], i) =>
      C(cs * u, cs * v, deck + 0.5, deck + 3.6, 1.8, M.green2, `${label}-tree-${i}`));
  }

  // The level-27 roof terrace inside the crown: deck, small plant core, pool and trees
  kit.prism({ ring: kit.inset(ring, 0.18), y0: ROOF - 0.15, y1: ROOF + 0.55, material: M.deck, top: M.deck, name: 'roof-deck' });
  kit.collisionPrism({ ring: kit.inset(ring, 0.4), y0: ROOF - 0.1, y1: ROOF + 0.8 });
  const roofCore = clip(insetL(2.3), rect(-hx - 2, -hz - 2, -6, -6));
  prismL(roofCore, ROOF + 0.4, ROOF + 6, M.core, 'roof-core', M.deck);
  kit.collisionPrism({ ring: W(roofCore), y0: ROOF + 0.4, y1: ROOF + 6 });
  B(9, 10, ROOF + 0.55, 15, 0.5, 6.5, M.pool, 'roof-pool-water');
  [[15, -10, 6, 3], [-12, 14, 5, 3]].forEach(([u, v, w, d], i) =>
    B(u, v, ROOF + 0.55, w, 0.7, d, i % 2 ? M.green2 : M.green, `roof-planting-${i}`));
  [[16, 16], [-15, -14], [2, -17]].forEach(([u, v], i) =>
    C(u, v, ROOF + 0.5, ROOF + 4, 1.9, M.green2, `roof-tree-${i}`));

  // The crown: straight mesh screen walls, then the barrel-vault shell (ridge east-west, ends open)
  for (const face of ['south', 'north', 'east', 'west']) {
    const panel = facePanel(face);
    prismL(panel, ROOF + 0.5, CROWN_WALL_TOP, M.mesh, `crown-screen-${face}`);
    kit.collisionPrism({ ring: W(panel), y0: ROOF + 0.5, y1: CROWN_WALL_TOP });
  }
  creepers(ROOF + 1, ROOF + 11, 'crown', 0.35);
  const archY = (v) => CROWN_WALL_TOP + Math.sqrt(Math.max(0, hz * hz - v * v)) * ((TOP - CROWN_WALL_TOP) / hz);
  const vaultClip = insetL(0.18), strips = 8;
  for (let k = 0; k < strips; k++) {
    const v0 = -hz + (2 * hz * k) / strips, v1 = -hz + (2 * hz * (k + 1)) / strips;
    const poly = clip(rect(-hx - 2, v0, hx + 2, v1), vaultClip);
    if (poly.length < 3) continue;
    kit.prism({
      ring: W(poly), y0: Math.min(archY(v0), archY(v1)) - 0.85,
      y1: (x, z) => archY(toLocal([x, z])[1]), material: M.mesh2, top: M.mesh, name: `crown-vault-${k}`
    });
  }
  // Conservative collision for the vault top only, kept inside its footprint; the curved flanks are
  // left to the screen-wall colliders below them (documented simplification)
  kit.collisionPrism({ ring: W(rect(-hx + 4, -6, hx - 4, 6)), y0: 185, y1: TOP });
  const rod = (u, v, y, tv, ty, name) => kit.loft({
    ring: W(rect(u - 0.18, v - 0.18, u + 0.18, v + 0.18)), topRing: W(rect(u - 0.18, tv - 0.18, u + 0.18, tv + 0.18)),
    y0: y, y1: ty, material: M.dark, top: M.dark, name
  });
  for (const su of [-1, 1]) {
    rod(su * (hx - 2.5), -hz + 5, CROWN_WALL_TOP + 1, -0.4, TOP - 4.5, `crown-truss-${su}-n`);
    rod(su * (hx - 2.5), hz - 5, CROWN_WALL_TOP + 1, 0.4, TOP - 4.9, `crown-truss-${su}-s`);
  }

  // The hotel's name, as photographed on the south and west faces under the crown: placed on the flat
  // face centres at its photographed size (kit.hang would clamp it to one short segment of the ring)
  for (const [face, [u, v], n] of [['south', [0, hz + 0.55], S], ['west', [-hx - 0.55, 0], [-E[0], -E[1]]]]) {
    const [x, z] = toWorld([u, v]);
    kit.sign({ text: 'oasia hotel', x, z, yTop: ROOF - 1.5, yaw: Math.atan2(n[0], n[1]), width: 28, height: 4.5, color: 0xffffff, name: `sign:oasia-${face}` });
  }
}
