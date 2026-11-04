// js/landmark-models/wing-on-life-building.js
// Wing On Life Building (SG-084), 150 Cecil Street (James Ferrie & Partners for Wing On Life Assurance, completed
// 1975; OSM start_date 1973): Singapore's twisted-fin modernist slab. A near-blind pale-tile podium fills its
// mapped quad (way 171995555, 20 levels, 56 m — the only OSM object; no parts, no relation); inset over the podium
// roof terrace stands the office slab (~33 by 12.5 m, from the published ~390 m² plate), wrapped in twelve bands
// of precast concrete fins twisted into diamond openings over dark glass recessed behind them, each band under a
// projecting slab edge. A plain service-core bar rides the rear (south-west) face; a blank crown band with one
// ribbon window (the converted penthouse) caps it at the mapped 56 m. Far Eastern Bank Building (171995552) and
// Solitaire on Cecil (171995562) share the outline's long edges and stay the city's. The fins are drawn as
// straight diagonal blades in a W zigzag, phase-flipped band by band so the openings read as diamonds; the real
// blades are hyperbolic twists, which matters only at arm's length. See docs/wing-on-life-building.md.
export const info = { name: 'Wing On Life Building', height: 56 };

const OUTLINE = 171995555;
const PODIUM = 13, DECK = 13.3, TOWER0 = 13.8, CROWN = 52.5, TOP = 56;
// the twelve finned bands: the lowest two taller and more splayed in the photographs (the transfer to six
// columns at the fourth floor), the rest equal; they sum to the glass shaft's 38.7 m
const BANDS = [4.5, 4.0, 3.02, 3.02, 3.02, 3.02, 3.02, 3.02, 3.02, 3.02, 3.02, 3.02];

export function build(kit, site) {
  const part = site.parts.find((q) => q.id === OUTLINE);
  if (!part?.ring?.length) throw new Error(`Wing On Life Building needs mapped way ${OUTLINE}`);
  let outline = part.ring.map((pt) => [...pt]);
  const f = outline[0], l = outline[outline.length - 1];
  if (outline.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) outline = outline.slice(0, -1);

  // Local frame: u along the quad's long edge (Cecil Street runs with it), v across, origin at its centre
  let U = [1, 0], best = -1;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length], v = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(...v);
    if (len > best) { best = len; U = v.map((x) => x / len); }
  }
  const V = [-U[1], U[0]];
  let ox = 0, oz = 0;
  for (const [x, z] of outline) { ox += x / outline.length; oz += z / outline.length; }
  const toWorld = ([u, v]) => [ox + u * U[0] + v * V[0], oz + u * U[1] + v * V[1]];
  const yaw = Math.atan2(U[1], U[0]);
  const B = (u, v, y, w, h, d, material, name, top = material) => {
    const [x, z] = toWorld([u, v]);
    return kit.box({ x, z, y, w, h, d, yaw, material, top, name });
  };
  // which local side faces Cecil Street (north-east): the core bar rides the other one
  const ne = kit.compass(50);
  const vNE = (V[0] * ne[0] + V[1] * ne[1]) >= 0 ? 1 : -1;

  const M = {
    // the podium's pale small-tile skin, near blind: a narrow slit a bay
    podium: kit.facadeMaterial({ wall: 0xc2c5bf, window: 0x272c30, floorHeight: 3.25, bayWidth: 4.8, windowWidth: 0.1, windowHeight: 0.4, pattern: 'punched' }),
    concrete: kit.material(0xe6dfcc, { roughness: 0.85 }),
    glass: kit.facadeMaterial({ wall: 0x39424a, window: 0x141a1e, floorHeight: 3.22, bayWidth: 2.36, pattern: 'curtain' }),
    crown: kit.facadeMaterial({ wall: 0xd8d0ba, window: 0x2c3844, floorHeight: 3.5, bayWidth: 2.4, pattern: 'ribbon' }),
    core: kit.material(0xd8d0ba, { roughness: 0.85 }),
    deck: kit.material(0x8f8d84, { roughness: 0.9 }),
    leaf: kit.material(0x4c7d38)
  };

  // The podium over the whole mapped quad, its roof terrace and planting, the transfer slab the fins land on
  kit.prism({ ring: outline, y0: 0, y1: PODIUM, material: M.podium, top: M.deck, name: 'podium' });
  kit.prism({ ring: kit.inset(outline, 0.35), y0: PODIUM, y1: DECK, material: M.deck, top: M.deck, name: 'podium-deck' });
  B(-8, vNE * 8.4, DECK, 6, 0.7, 1.5, M.leaf, 'deck-planting-0');
  B(6, vNE * 8.4, DECK, 7, 0.7, 1.5, M.leaf, 'deck-planting-1');
  const transfer = B(0, 0, DECK, 34.4, TOWER0 - DECK, 13.9, M.concrete, 'transfer-slab');
  kit.collisionPrism({ ring: transfer.ring, y0: DECK, y1: TOWER0 });

  // The recessed glass slab and the blank crown over it; the plain service core on the rear face
  const glass = B(0, 0, TOWER0, 33, CROWN - TOWER0, 12.5, M.glass, 'tower-glass', M.deck);
  B(0, 0, CROWN, 33, TOP - CROWN, 12.5, M.crown, 'crown', M.deck);
  B(0, -vNE * 8.25, TOWER0, 18, CROWN - TOWER0 - 0.06, 4.6, M.core, 'core-bar'); // a hair under the crown, so its top never shares the glass slab's roof plane
  kit.collisionPrism({ ring: glass.ring, y0: TOWER0, y1: TOP });

  // Twelve projecting slab edges, and between them the zigzag blades: a W per band, flipped band by band so
  // the openings stack as diamonds, the glass 0.3 m behind the blades' inner faces
  const fin = (face, band, k, a, b) => kit.beam({ from: a, to: b, w: 0.5, h: 0.95, material: M.concrete, name: `fin-${face}-${band}-${k}` });
  const zigzag = (face, band, y0, y1, from, to, fixed, alongU, skip) => {
    const n = Math.max(4, Math.round((to - from) / 1.18));
    const step = (to - from) / n, flip = band % 2 === 1;
    const pt = (s, y) => { const [x, z] = alongU ? toWorld([s, fixed]) : toWorld([fixed, s]); return [x, y, z]; };
    for (let k = 0; k < n; k++) {
      const s0 = from + step * k, s1 = s0 + step;
      if (skip && skip(s0, s1)) continue;
      const lowFirst = (k % 2 === 0) !== flip;
      fin(face, band, k, pt(s0, lowFirst ? y0 : y1), pt(s1, lowFirst ? y1 : y0));
    }
  };
  let yb = TOWER0;
  BANDS.forEach((h, band) => {
    B(0, 0, yb - 0.07, 34.5, 0.65, 14.0, M.concrete, `tower-slab-${band}`);
    const y0 = yb + 0.6, y1 = yb + h;
    zigzag('ne', band, y0, y1, -16.5, 16.5, vNE * 6.75, true);
    zigzag('sw', band, y0, y1, -16.5, 16.5, -vNE * 6.75, true, (s0, s1) => s0 > -9.4 && s1 < 9.4);
    zigzag('e', band, y0, y1, -6.25, 6.25, 17.0, false);
    zigzag('w', band, y0, y1, -6.25, 6.25, -17.0, false);
    yb += h;
  });
}
