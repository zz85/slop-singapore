// js/landmark-models/tokio-marine-centre.js
// Tokio Marine Centre (SG-083), 20 McCallum Street (Chan Sau Yan Associates; Web Structures; completed 2010):
// Tokio Marine's Asia headquarters, famous for its "bamboo grove" exoskeleton. The tower stands on giant
// concrete stilts over an open, landscaped ground concourse with a recessed glass lobby; a dark louvred base
// band (the third-storey carpark and sky terrace) overhangs it; above, the dark-glass office slab — its floor
// plates flaring gently larger as they rise — is wrapped in fair-faced concrete columns standing proud of the
// glazing: mostly bundled near-verticals leaning with the flare and overshooting the parapet, crossed by long
// diagonals. Replaces its single mapped outline, OSM way 171995558 (21 levels, 121 m); the OSM hexagon traces
// the enlarged upper plate, so the glass is modelled inside it. 158 Cecil Street (171995560, sharing its nodes),
// Bangkok Bank and The Clift remain the city's. Heights: roof slab 121.5 m (the structural figure; OSM 121),
// architectural top 124.5 m (CTBUH) at the roof plant. See docs/tokio-marine-centre.md.
export const info = { name: 'Tokio Marine Centre', height: 124.5 };

const OUTLINE = 171995558;
// heights (m): the canopy slab over the concourse, the dark base band, the office tower, the roof slab.
// Zone heights below the tower are estimates from the photographs; the tops are documented.
const H = { canopy: [10.2, 11.2], band: [11, 20], tower: [20, 121.5], rim: 122.3, top: 124.5 };
const GLASS_INSET = [3.4, 1.4]; // the glass plate inside the mapped outline, at the tower's foot and head (the flare)

export function build(kit, site) {
  const part = site.parts.find((q) => q.id === OUTLINE);
  if (!part?.ring?.length) throw new Error(`Tokio Marine Centre needs mapped way ${OUTLINE}`);
  let ring = part.ring.map((pt) => [...pt]);
  const f = ring[0], l = ring[ring.length - 1];
  if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
  const centroid = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const M = {
    concrete: kit.material(0xc6c0b2, { roughness: 0.8 }),
    // dark full-height glazing: near-black panes in a muted grey frame, one slab line a (tall) office floor
    glass: kit.facadeMaterial({ wall: 0x595f64, window: 0x1b2126, floorHeight: 5.64, bayWidth: 5.6, pattern: 'curtain', roughness: 0.35 }),
    lobby: kit.glassMaterial(0x2a343a),
    band: kit.facadeMaterial({ wall: 0x232629, window: 0x0f1214, floorHeight: 0.9, bayWidth: 3, pattern: 'ribbon' }),
    black: kit.material(0x191c1f, { roughness: 0.7 }),
    deck: kit.material(0x8f8d84, { roughness: 0.9 }), plant: kit.material(0x9aa0a2, { roughness: 0.85 }),
    paving: kit.material(0xb7b3aa), leaf: kit.material(0x4c7d38)
  };

  // --- the open concourse: paving, planting, the stilts and their branches, the recessed lobby -----------------
  kit.prism({ ring: kit.inset(ring, -0.3), y0: 0, y1: 0.3, material: M.paving, top: M.paving, name: 'base-paving' });
  ring.forEach((v, k) => {
    const d = [centroid[0] - v[0], centroid[1] - v[1]], len = Math.hypot(...d), u = d.map((x) => x / len);
    const px = v[0] + u[0] * 2.4, pz = v[1] + u[1] * 2.4;
    kit.box({ x: px, z: pz, y: 0, w: 1.7, h: H.canopy[1] - 0.06, d: 1.7, yaw: Math.atan2(u[1], u[0]), material: M.concrete, top: M.concrete, name: `stilt-${k}` });
    if (k % 2 === 0) kit.beam({ from: [px, 6, pz], to: [px + u[0] * 4.5, H.canopy[0], pz + u[1] * 4.5], w: 1.1, h: 1.1, material: M.concrete, name: `branch-${k}` });
  });
  [1, 3, 4].forEach((k) => {
    const v = ring[k];
    kit.cylinder({ x: centroid[0] + (v[0] - centroid[0]) * 0.62, z: centroid[1] + (v[1] - centroid[1]) * 0.62, y0: 0.3, y1: 1.0, r: 1.6, segments: 10, material: M.leaf, top: M.leaf, name: `concourse-planter-${k}` });
  });
  kit.prism({ ring: kit.inset(ring, 6), y0: 0, y1: 8.5, material: M.lobby, top: M.black, name: 'lobby', outlineCollision: true });

  // --- the dark base band on its overhanging canopy slab, the sky terrace on it ----------------------------------
  kit.prism({ ring: kit.inset(ring, 0.2), y0: H.canopy[0], y1: H.canopy[1], material: M.black, top: M.black, name: 'base-canopy' });
  kit.prism({ ring: kit.inset(ring, 0.8), y0: H.band[0], y1: H.band[1], material: M.band, top: M.deck, name: 'base-band' });
  kit.collisionPrism({ ring: kit.inset(ring, 0.8), y0: H.canopy[0], y1: H.band[1] });
  kit.prism({ ring: kit.inset(ring, 2.5), y0: H.band[1], y1: H.band[1] + 0.5, material: M.concrete, top: M.leaf, name: 'sky-terrace' });

  // --- the flared glass tower, its rim and plant ------------------------------------------------------------------
  kit.loft({ ring: kit.inset(ring, GLASS_INSET[0]), topRing: kit.inset(ring, GLASS_INSET[1]), y0: H.tower[0], y1: H.tower[1], material: M.glass, top: M.deck, name: 'tower-glass' });
  // collision in three steps inside the flare, so nothing descends through the roof or the upper floors
  kit.collisionPrism({ ring: kit.inset(ring, 3.4), y0: H.tower[0], y1: 55 });
  kit.collisionPrism({ ring: kit.inset(ring, 2.7), y0: 55, y1: 90 });
  kit.collisionPrism({ ring: kit.inset(ring, 2.0), y0: 90, y1: H.tower[1] });
  kit.prism({ ring: kit.inset(ring, 1.3), y0: H.tower[1], y1: H.rim, material: M.concrete, top: M.concrete, name: 'roof-rim' });
  kit.collisionPrism({ ring: kit.inset(ring, 1.6), y0: H.tower[1], y1: H.rim });
  const plant = kit.prism({ ring: kit.inset(ring, 10), y0: H.tower[1], y1: H.top, material: M.plant, top: M.deck, name: 'roof-plant' });
  kit.collisionPrism({ ring: plant.ring, y0: H.tower[1], y1: H.top });

  // --- the exoskeleton: uprights leaning with the flare, proud of the glass, and long diagonals crossing them ---
  const glassInsetAt = (y) => GLASS_INSET[0] + (GLASS_INSET[1] - GLASS_INSET[0]) * ((y - H.tower[0]) / (H.tower[1] - H.tower[0]));
  let up = 0, diag = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 4) continue;
    let nx = dz / len, nz = -dx / len;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (nx * (centroid[0] - mx) + nz * (centroid[1] - mz) < 0) { nx = -nx; nz = -nz; } // inward
    const at = (s, y) => [a[0] + (dx / len) * s + nx * (glassInsetAt(y) - 0.55), y, a[1] + (dz / len) * s + nz * (glassInsetAt(y) - 0.55)];
    const stations = [];
    for (let s = 2.2; s < len - 2; s += 3.4 + rnd(i * 17.3 + s) * 2.2) stations.push(s);
    stations.forEach((s, k) => {
      kit.beam({ from: at(s, H.tower[0]), to: at(s, H.tower[1] + 0.5 + rnd(i * 31.7 + k * 7.9) * 1.3), w: 1.9, h: 1.1, material: M.concrete, name: `exo-up-${up++}` });
    });
    if (stations.length >= 5) {
      kit.beam({ from: at(stations[0], H.tower[0]), to: at(stations[3], 80), w: 1.1, h: 1.6, material: M.concrete, name: `exo-diag-${diag++}` });
      kit.beam({ from: at(stations[3], H.tower[0]), to: at(stations[0], 80), w: 1.1, h: 1.6, material: M.concrete, name: `exo-diag-${diag++}` });
      kit.beam({ from: at(stations[1], 55), to: at(stations[4], H.tower[1]), w: 1.1, h: 1.6, material: M.concrete, name: `exo-diag-${diag++}` });
    }
  }

  // --- the name screen at the McCallum Street entrance (the building's only sign) -----------------------------------
  let south = null, bestZ = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), mz = (a[1] + b[1]) / 2;
    if (len >= 20 && mz > bestZ) { bestZ = mz; south = { a, b, len }; }
  }
  const smx = (south.a[0] + south.b[0]) / 2, smz = (south.a[1] + south.b[1]) / 2;
  const toC = [centroid[0] - smx, centroid[1] - smz], dLen = Math.hypot(...toC);
  const panel = kit.box({
    x: smx + toC[0] / dLen * 1.6, z: smz + toC[1] / dLen * 1.6, y: 0.3, w: 6, h: 4.5, d: 0.6,
    yaw: Math.atan2(south.b[1] - south.a[1], south.b[0] - south.a[0]), material: M.black, top: M.black, name: 'sign-panel'
  });
  kit.hang({ ring: panel.ring, top: 4.8, toward: 190, below: 0.5, out: 0.12, margin: 1.2, text: 'TOKIO\nMARINE\nCENTRE', height: 2.4, color: 0xffffff, name: 'sign:tokio-marine' });
}
