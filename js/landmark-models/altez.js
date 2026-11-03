// js/landmark-models/altez.js
// Altez (SG-116), 16 Enggor Street (RSP Architects, 2014): a 62-storey, 250 m residential tower over a low
// podium filling its plot. The shaft is a dark blue-grey curtain wall whose two broad faces carry the
// photographs' signature: silver-framed bay windows projecting in an irregular scatter over the floor grid.
// A paler glazed crown, inset a step, sits under a thin white cornice. The mapped parts are the plot/podium
// outline 172023443 (10 m) and the tower part 393100852 (62 levels, 250 m from 10 m). See docs/altez.md.
export const info = { name: 'Altez', height: 250 };

const PLOT = 172023443, TOWER = 393100852;
const PODIUM = 10, CROWN = 236, TOP = 250;

export function build(kit, site) {
  const part = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Altez needs mapped part ${id}`);
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
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const M = {
    podium: kit.facadeMaterial({ wall: 0x565d63, window: 0x2e3840, floorHeight: 3.3, bayWidth: 3.0, pattern: 'curtain' }),
    shaft: kit.facadeMaterial({ wall: 0x707a83, window: 0x2b3644, floorHeight: 3.8, bayWidth: 2.95, pattern: 'curtain' }),
    crown: kit.facadeMaterial({ wall: 0xd4d9de, window: 0x46586a, floorHeight: 3.6, bayWidth: 2.4, pattern: 'ribbon' }),
    silver: kit.material(0xd8dde2), bayGlass: kit.glassMaterial(0x33414f),
    deck: kit.material(0x8b8d84), green: kit.material(0x4c7d38), pool: kit.glassMaterial(0x2f7f9f),
    dark: kit.material(0x2e3134)
  };

  // Podium over the whole plot to its mapped 10 m, a deck slab on top, and the Enggor Street canopy
  kit.prism({ ring: plot, y0: -0.3, y1: PODIUM, material: M.podium, top: M.deck, name: 'podium' });
  kit.prism({ ring: kit.inset(plot, 0.3), y0: PODIUM, y1: PODIUM + 0.35, material: M.deck, top: M.deck, name: 'podium-deck' });
  kit.collisionPrism({ ring: kit.inset(plot, 0.4), y0: PODIUM, y1: PODIUM + 0.6 });
  const wall = kit.wallToward(plot, 270);
  const canopy = kit.box({ x: wall.x + wall.nx * 0.9, z: wall.z + wall.nz * 0.9, y: 4.6, w: 2.4, h: 0.4, d: 10, yaw: Math.atan2(wall.nz, wall.nx), material: M.silver, top: M.silver, name: 'entrance-canopy' });
  kit.collisionPrism({ ring: canopy.ring, y0: 4.6, y1: 5.0 });

  // Pool and planting on the podium deck, at the plot's far end from the tower
  const plotL = plot.map(toLocal);
  const pc = [0, 1].map((k) => plotL.reduce((s, p) => s + p[k], 0) / plotL.length);
  const dl = Math.hypot(...pc) || 1, dir = pc.map((x) => x / dl);
  const reach = Math.max(dl, 24);
  const pu = Math.max(Math.min(...plotL.map((p) => p[0])) + 8, Math.min(Math.max(...plotL.map((p) => p[0])) - 8, dir[0] * reach));
  const pv = Math.max(Math.min(...plotL.map((p) => p[1])) + 5, Math.min(Math.max(...plotL.map((p) => p[1])) - 5, dir[1] * reach));
  B(pu, pv, PODIUM + 0.35, 12, 0.5, 5, M.pool, 'podium-pool-water');
  B(pu, pv + 5.5, PODIUM + 0.35, 10, 0.7, 2.2, M.green, 'deck-planting-0');
  B(pu, pv - 5.5, PODIUM + 0.35, 10, 0.7, 2.2, M.green, 'deck-planting-1');

  // The shaft on the mapped tower plate, from the podium to the crown
  kit.prism({ ring: tower, y0: PODIUM - 0.2, y1: CROWN, material: M.shaft, top: M.deck, name: 'shaft' });
  kit.collisionPrism({ ring: tower, y0: PODIUM, y1: CROWN });

  // The scattered projecting bays: a silver frame standing proud of each broad face, its dark glass front a
  // step in front of the frame's face, on a deterministic scatter over the floor and bay grid
  const cols = [-11.8, -5.9, 0, 5.9, 11.8].filter((u) => Math.abs(u) + 2.4 < hx);
  let bayId = 0;
  for (const side of [-1, 1]) {
    for (let row = 0, y = 14; y + 3 <= CROWN - 2; y += 3.87, row++) {
      for (let col = 0; col < cols.length; col++) {
        if (rnd(row * 31.7 + col * 7.3 + (side > 0 ? 101 : 7)) > 0.30) continue;
        B(cols[col], side * (hz + 0.18), y, 4.2, 2.9, 0.6, M.silver, `bay-frame-${bayId}`);
        B(cols[col], side * (hz + 0.26), y + 0.35, 3.5, 2.2, 0.66, M.bayGlass, `bay-glass-${bayId}`);
        bayId++;
      }
    }
  }
  // Plain silver fins on the narrow faces
  for (const side of [-1, 1]) for (const v of [-4.5, 4.5])
    B(side * (hx + 0.15), v, 12, 0.55, CROWN - 14, 1.8, M.silver, `fin-${side}-${v}`);

  // The pale glazed crown, its white cornice and the roof plant to the documented 250 m
  kit.prism({ ring: kit.inset(tower, 0.7), y0: CROWN, y1: 247, material: M.crown, top: M.deck, name: 'crown' });
  kit.collisionPrism({ ring: kit.inset(tower, 0.7), y0: CROWN, y1: 247 });
  kit.prism({ ring: kit.inset(tower, -0.4), y0: 247, y1: 248.6, material: M.silver, top: M.silver, name: 'cornice' });
  B(0, 0, 248.6, 11, TOP - 248.6, 9, M.dark, 'roof-plant');
  kit.collisionPrism({ ring: tower, y0: 247, y1: TOP });
}
