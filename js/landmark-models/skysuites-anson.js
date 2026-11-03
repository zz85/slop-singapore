// js/landmark-models/skysuites-anson.js
// Skysuites @ Anson (SG-117), 8 Enggor Street (P&T Consultants, 2014-15): a 71-storey, 250 m residential
// tower over a six-level podium. The near-black glass shaft is cut by full-height silver fins; at about
// four-fifths of its height The Retreat's planted sky terrace sets the paler, finely louvred upper shaft
// back behind corner columns, and the circular Vista Deck disc overhangs the plate at the top. The mapped
// parts are the podium outline 172023451 (6 levels) and the tower part 393100851 (71 levels, 250 m).
// See docs/skysuites-anson.md.
export const info = { name: 'Skysuites @ Anson', height: 250 };

const PLOT = 172023451, TOWER = 393100851;
const PODIUM = 21, RETREAT = 198, DRUM = 240, TOP = 250;

export function build(kit, site) {
  const part = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Skysuites @ Anson needs mapped part ${id}`);
    let ring = p.ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    return ring;
  };
  const plot = part(PLOT), tower = part(TOWER);

  // Local frame: u along the tower plate's long edge, v across it, origin at the plate's centre
  let U = [1, 0], best = -1;
  for (let i = 0; i < tower.length; i++) {
    const a = tower[i], b = tower[(i + 1) % tower.length], v = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(...v);
    if (len > best) { best = len; U = v.map((x) => x / len); }
  }
  const V = [-U[1], U[0]];
  let ox = 0, oz = 0;
  for (const [x, z] of tower) { ox += x / tower.length; oz += z / tower.length; }
  const toLocal = ([x, z]) => [(x - ox) * U[0] + (z - oz) * U[1], (x - ox) * V[0] + (z - oz) * V[1]];
  const toWorld = ([u, v]) => [ox + u * U[0] + v * V[0], oz + u * U[1] + v * V[1]];
  const local = tower.map(toLocal);
  const hx = Math.max(...local.map((p) => Math.abs(p[0]))), hz = Math.max(...local.map((p) => Math.abs(p[1])));
  const yaw = Math.atan2(U[1], U[0]);
  const B = (u, v, y, w, h, d, material, name) => {
    const [x, z] = toWorld([u, v]);
    return kit.box({ x, z, y, w, h, d, yaw, material, top: material, name });
  };

  const M = {
    podium: kit.facadeMaterial({ wall: 0x2a2e33, window: 0x46525e, floorHeight: 3.5, bayWidth: 2.8, pattern: 'curtain' }),
    shaft: kit.facadeMaterial({ wall: 0x23272c, window: 0x3c4a58, floorHeight: 3.45, bayWidth: 2.45, pattern: 'curtain' }),
    upper: kit.facadeMaterial({ wall: 0xb9bfc6, window: 0x39434e, floorHeight: 3.45, bayWidth: 1.2, windowWidth: 0.55, pattern: 'strips' }),
    silver: kit.material(0xc9ced4), dark: kit.material(0x23272c),
    retail: kit.glassMaterial(0x40505f), drum: kit.glassMaterial(0x4a5c6e),
    deck: kit.material(0x8b8d84), green: kit.material(0x4c7d38), green2: kit.material(0x5d8f3e)
  };

  // The six-level podium over the plot, its glass retail band, deck and the Enggor Street canopy
  kit.prism({ ring: plot, y0: -0.3, y1: PODIUM, material: M.podium, top: M.deck, name: 'podium' });
  kit.prism({ ring: kit.inset(plot, -0.06), y0: -0.3, y1: 5, material: M.retail, top: M.retail, name: 'retail-band' });
  kit.prism({ ring: kit.inset(plot, 0.3), y0: PODIUM, y1: PODIUM + 0.35, material: M.deck, top: M.deck, name: 'podium-deck' });
  kit.collisionPrism({ ring: kit.inset(plot, 0.4), y0: PODIUM, y1: PODIUM + 0.6 });
  const plotL = plot.map(toLocal);
  plotL.map((p, i) => [Math.hypot(...p), i]).sort((a, b) => b[0] - a[0]).slice(0, 2).forEach(([, i], k) => {
    const [u, v] = plotL[i].map((x) => x * 0.78);
    B(u, v, PODIUM + 0.35, 7, 0.8, 2.4, k ? M.green : M.green2, `deck-planting-${k}`);
  });
  const wall = kit.wallToward(plot, 270);
  const canopy = kit.box({ x: wall.x + wall.nx * 0.9, z: wall.z + wall.nz * 0.9, y: 4.6, w: 2.4, h: 0.35, d: 10, yaw: Math.atan2(wall.nz, wall.nx), material: M.silver, top: M.silver, name: 'entrance-canopy' });
  kit.collisionPrism({ ring: canopy.ring, y0: 4.6, y1: 4.95 });

  // The near-black lower shaft on the mapped plate, and its full-height silver fins
  kit.prism({ ring: tower, y0: PODIUM - 0.2, y1: RETREAT, material: M.shaft, top: M.deck, name: 'shaft' });
  kit.collisionPrism({ ring: tower, y0: PODIUM, y1: RETREAT });
  let finId = 0;
  for (const side of [-1, 1]) for (const u of [-10.4, -3.5, 3.5, 10.4].filter((x) => Math.abs(x) + 0.6 < hx))
    B(u, side * (hz + 0.12), PODIUM + 0.5, 0.65, RETREAT - PODIUM - 1, 0.55, M.silver, `fin-${finId++}`);
  for (const side of [-1, 1])
    B(side * (hx + 0.12), 0, PODIUM + 0.5, 0.55, RETREAT - PODIUM - 1, 1.6, M.silver, `fin-${finId++}`);

  // The Retreat: an overhanging ledge, an open planted deck ring, corner columns, the set-back upper shaft
  kit.prism({ ring: kit.inset(tower, -0.5), y0: RETREAT, y1: RETREAT + 0.6, material: M.dark, top: M.deck, name: 'retreat-ledge' });
  kit.collisionPrism({ ring: kit.inset(tower, 0.2), y0: RETREAT, y1: RETREAT + 0.8 });
  for (const su of [-1, 1]) for (const sv of [-1, 1])
    B(su * (hx - 1.7), sv * (hz - 1.7), RETREAT + 0.6, 1.3, 5.4, 1.3, M.silver, `retreat-column-${su}-${sv}`);
  for (const side of [-1, 1])
    B(0, side * (hz - 0.9), RETREAT + 0.6, 16, 0.8, 1.1, side > 0 ? M.green : M.green2, `retreat-planter-${side}`);
  const upperRing = kit.inset(tower, 2.2);
  kit.prism({ ring: upperRing, y0: RETREAT + 0.6, y1: DRUM, material: M.upper, top: M.deck, name: 'upper-shaft' });
  kit.collisionPrism({ ring: upperRing, y0: RETREAT + 0.6, y1: DRUM });

  // The Vista Deck: a glazed drum under the circular disc that overhangs the plate, capped at 250 m
  const drum = kit.cylinder({ x: ox, z: oz, y0: DRUM, y1: 246.5, r: 13.5, segments: 24, material: M.drum, top: M.drum, name: 'vista-drum' });
  kit.collisionPrism({ ring: drum.ring, y0: DRUM, y1: 246.5 });
  const disc = kit.cylinder({ x: ox, z: oz, y0: 246.5, y1: 249, r: 16.5, segments: 28, material: M.dark, top: M.dark, name: 'vista-disc' });
  const cap = kit.cylinder({ x: ox, z: oz, y0: 249, y1: TOP, r: 9, segments: 20, material: M.dark, top: M.dark, name: 'vista-cap' });
  kit.collisionPrism({ ring: disc.ring, y0: 246.5, y1: TOP });
  kit.collisionPrism({ ring: cap.ring, y0: 249, y1: TOP });
}
