// js/landmark-models/gb-building.js
// GB Building (SG-075), 143 Cecil Street at McCallum Street (Kenzo Tange / Tange Associates, 1985): a diagonal
// slab across the corner — a three-storey light-panel podium with two dark ribbon bands over a recessed glass
// ground floor, and at its north-east end the office tower floating over a recessed transfer level: two solid
// panel storeys (a thin grey stripe between them), then twenty horizontally banded glass floors between blank
// off-white end walls, under a plain parapet. Replaces OSM ways 504809533 (the outline), 326926543 (the tower
// part, mapped 28 levels / 73 m) and 1566584725 (the three-level podium part toward Robinson Road); Oxley Tower
// and the Robinson Road neighbours remain the city's.
// Height: modelled at 93 m, an estimate. The only published figure, 240 ft (73 m), is marked "Unconfirmed" by
// SkyscraperPage and cannot fit the building — 26-28 storeys with a 7.9 m lobby and the open transfer level at
// 73 m would mean under 2.8 m a floor. The photographs show about twenty glass bands over the solid base band;
// twenty office floors at 3.3 m over podium, void and solid band give 93 m. See docs/gb-building.md.
export const info = { name: 'GB Building', height: 93 };

const ID = { outline: 504809533, tower: 326926543, podium: 1566584725 };
// heights (m, estimated from the photographs and the published makeup): the recessed ground floor, the podium's
// roof, the transfer void, the solid panel band (its grey stripe between), the glass shaft, the parapet
const H = { ground: 5.4, podium: 13, void: [13, 17.5], solid: [17.5, 24.5], stripe: [20.7, 21.4], glass: [24.5, 90.5], top: 93 };
const C = { panel: 0xe8e6e0, stripe: 0x9aa0a4, glass: 0x1d2c3f, spandrel: 0xeef0ec, slot: 0x1a242e, podiumBand: 0x141a20, lobby: 0xaebfb8, stone: 0xd9d7d2, paving: 0xc2b9ae, leaf: 0x4f7d3a };

export function build(kit, site) {
  const mapped = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`GB Building needs mapped way ${id}`);
    let ring = p.ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    return ring;
  };
  const outline = mapped(ID.outline), tower = mapped(ID.tower);
  mapped(ID.podium); // replaced with the outline: the podium is drawn over the whole footprint, as built

  const M = {
    panel: kit.material(C.panel, { roughness: 0.6 }),
    stripe: kit.material(C.stripe, { roughness: 0.5 }),
    // the shaft's stripes: a dark vision band over a bright spandrel each 3.3 m floor, fine mullions only
    shaft: kit.facadeMaterial({ wall: C.spandrel, window: C.glass, floorHeight: 3.3, bayWidth: 1.5, pattern: 'ribbon', roughness: 0.45 }),
    slot: kit.glassMaterial(C.slot),
    // the podium's two long dark ribbons in the light panels
    podium: kit.facadeMaterial({ wall: 0xe3e1da, window: C.podiumBand, floorHeight: 3.8, bayWidth: 2.2, pattern: 'ribbon', roughness: 0.55 }),
    lobby: kit.facadeMaterial({ wall: 0x6a7076, window: C.lobby, floorHeight: 5.4, bayWidth: 1.6, windowWidth: 0.9, pattern: 'strips' }),
    stone: kit.material(C.stone, { roughness: 0.6 }), paving: kit.material(C.paving), leaf: kit.material(C.leaf), deck: kit.material(0x8f8d84, { roughness: 0.9 })
  };
  // each ring edge by length and run: along the slab (the broad faces) or across it (ends and returns)
  const edges = (ring) => ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1];
    return { len: Math.hypot(dx, dz), along: Math.abs(dz) > Math.abs(dx), a: p, b: q, dx, dz };
  });
  const solid = (part, y0 = part.y0, y1 = part.y1) => { kit.collisionPrism({ ring: part.ring, y0, y1 }); return part; };
  // boxes on a mapped ring's own axes (kit.boxOf): u along its longest side, v across
  const frameBox = (ob) => (u, v, y, w, h, d, material, name) =>
    kit.box({ x: ob.cx + u * ob.ux - v * ob.uz, z: ob.cz + u * ob.uz + v * ob.ux, y, w, h, d, yaw: Math.atan2(ob.uz, ob.ux), material, top: material, name });

  // --- the ground: paving, the recessed glass lobby and the columns carrying the podium over the walkway --------
  kit.prism({ ring: kit.inset(outline, -0.25), y0: 0, y1: 0.3, material: M.paving, top: M.paving, name: 'base-paving' });
  kit.prism({ ring: kit.inset(outline, 2.4), y0: 0, y1: H.ground, material: M.lobby, top: M.deck, name: 'ground-lobby', outlineCollision: true });
  const centroid = outline.reduce((s, p) => [s[0] + p[0] / outline.length, s[1] + p[1] / outline.length], [0, 0]);
  let col = 0;
  for (const e of edges(outline)) {
    if (!e.along || e.len < 15) continue;
    let nx = e.dz / e.len, nz = -e.dx / e.len;
    const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2;
    if (nx * (centroid[0] - mx) + nz * (centroid[1] - mz) < 0) { nx = -nx; nz = -nz; }
    for (let d = 4; d < e.len - 3; d += 8.2) {
      kit.box({ x: e.a[0] + (e.dx / e.len) * d + nx * 0.55, z: e.a[1] + (e.dz / e.len) * d + nz * 0.55, y: 0, w: 0.9, h: H.ground, d: 0.9, yaw: Math.atan2(e.dz, e.dx), material: M.stone, top: M.stone, name: `walkway-column-${col++}` });
    }
  }
  // the north-east end wall brought to the ground at the Cecil/McCallum corner, the name low on it
  const neEdge = edges(tower).find((e) => !e.along && e.len >= 9 && e.a[1] < centroid[1]);
  const finMid = [(neEdge.a[0] + neEdge.b[0]) / 2, (neEdge.a[1] + neEdge.b[1]) / 2];
  const fin = kit.box({ x: finMid[0], z: finMid[1] + 0.8, y: 0, w: neEdge.len - 0.3, h: H.podium - 0.1, d: 1.1, yaw: Math.atan2(neEdge.dz, neEdge.dx), material: M.panel, top: M.panel, name: 'ne-end-wall' }); // kept a hair inside the mapped end's sides and face, which the podium shares
  kit.hang({ ring: fin.ring, top: 4.6, toward: 35, below: 1.3, out: 0.12, margin: 3, text: 'GB BUILDING', height: 0.6, maxWidth: 6.5, color: 0x2b2f33, name: 'sign:gb-building' });

  // --- the podium: light panels, dark ribbons on the long faces, its roof deck and planting ----------------------
  const podiumEdges = edges(outline);
  kit.prism({
    ring: outline, y0: H.ground, y1: H.podium, material: M.panel, top: M.deck, name: 'podium', outlineCollision: true,
    edgeMaterial: (i) => (podiumEdges[i].along && podiumEdges[i].len >= 15 ? M.podium : M.panel)
  });
  kit.prism({ ring: kit.inset(outline, 0.3), y0: H.podium, y1: H.podium + 0.25, material: M.deck, top: M.deck, name: 'podium-deck' });
  kit.collisionPrism({ ring: kit.inset(outline, 0.4), y0: H.podium, y1: H.podium + 0.3 });
  const OB = kit.boxOf(outline), oBox = frameBox(OB);
  oBox(10, -5, H.podium + 0.25, 12, 0.7, 2, M.leaf, 'podium-planter-0');
  oBox(10, 5, H.podium + 0.25, 12, 0.7, 2, M.leaf, 'podium-planter-1');

  // --- the transfer void: the tower carried over the podium roof on its core and columns --------------------------
  const TB = kit.boxOf(tower), tBox = frameBox(TB);
  solid(tBox(0, 0, H.void[0], 9, H.void[1] - H.void[0], 7, M.panel, 'void-core'));
  let vc = 0;
  for (const su of [-11, 11]) for (const sv of [-7, 7]) solid(tBox(su, sv, H.void[0], 0.9, H.void[1] - H.void[0], 0.9, M.stone, `void-column-${vc++}`));

  // --- the tower: the solid band and its stripe, the banded glass between blank ends, the parapet ---------------
  kit.prism({ ring: tower, y0: H.solid[0], y1: H.solid[1], material: M.panel, top: M.panel, name: 'tower-solid' });
  kit.prism({ ring: kit.inset(tower, -0.07), y0: H.stripe[0], y1: H.stripe[1], material: M.stripe, top: M.stripe, name: 'tower-solid-stripe' });
  const towerEdges = edges(tower);
  kit.prism({
    ring: tower, y0: H.glass[0], y1: H.glass[1], material: M.shaft, top: M.deck, name: 'tower-shaft',
    edgeMaterial: (i) => (towerEdges[i].len >= 15 ? M.shaft : (!towerEdges[i].along && towerEdges[i].len >= 9 ? M.panel : M.slot))
  });
  kit.prism({ ring: kit.inset(tower, 0.55), y0: H.glass[1], y1: H.top, material: M.panel, top: M.deck, name: 'tower-crown' });
  kit.collisionPrism({ ring: tower, y0: H.solid[0], y1: H.top });
}
