// js/landmark-models/marina-bay-financial-centre.js
// Marina Bay Financial Centre (Kohn Pedersen Fox, 2010-2013): three office towers in blue-green glass behind white
// mullions — Tower 1 (186 m, 33 storeys), Tower 2 (245 m, 50) and Tower 3 (245 m, 46) — with Marina Bay Residences
// (227 m, 55 storeys) and Marina Bay Suites (221 m, 66) beside them, over the podium and the Link Mall.
// OpenStreetMap maps all five at 245 m: the program uses the documented heights, and gives the unnamed parts
// (218-239 m, the towers' crowns and setbacks) to whichever tower stands nearest, no taller than it. info.height is
// Tower 2's 245 m.
export const info = { name: 'Marina Bay Financial Centre', height: 245 };

const TOWER_1 = 116905040, TOWER_2 = 116905042, TOWER_3 = 116905041, RESIDENCES = 116905045, SUITES = 116905047;
const PODIUM = 509003525, MALL = 728243729;
const HEIGHTS = { [TOWER_1]: 186, [TOWER_2]: 245, [TOWER_3]: 245, [RESIDENCES]: 227, [SUITES]: 221 };
const HOMES = new Set([RESIDENCES, SUITES]);

const centre = (ring) => ring.reduce(([x, z], [px, pz]) => [x + px / ring.length, z + pz / ring.length], [0, 0]);

export function build(kit, site) {
  const office = kit.facadeMaterial({ wall: 0x9fb3bf, window: 0x2e5566, floorHeight: 4.2, bayWidth: 2.4, pattern: 'curtain' });
  const homes = kit.facadeMaterial({ wall: 0xc9cdd0, window: 0x3a5a6a, floorHeight: 3.3, bayWidth: 2.8, pattern: 'ribbon' });
  const podium = kit.facadeMaterial({ wall: 0xb8bcbf, window: 0x3a5a6a, floorHeight: 4.5, bayWidth: 3.0, pattern: 'curtain' });
  const dark = kit.glassMaterial(0x2e5566);
  const towers = Object.keys(HEIGHTS).map((id) => site.parts.find((p) => p.id === Number(id))).filter(Boolean);
  const items = [];
  for (const p of site.parts) {
    if (p.id === PODIUM) { items.push({ ring: p.ring, y0: -0.3, y1: p.height || 19, material: podium, name: 'podium' }); continue; }
    if (p.id === MALL) { items.push({ ring: p.ring, y0: -0.3, y1: p.height || 35, material: podium, name: 'mall' }); continue; }
    if (!(p.height > 0)) continue;
    if (HEIGHTS[p.id]) {
      const home = HOMES.has(p.id);
      items.push({ ring: p.ring, y0: -0.3, y1: HEIGHTS[p.id], material: home ? homes : office, top: home ? undefined : dark, name: `tower-${p.id}` });
      continue;
    }
    // an unnamed part: the nearest tower's, and never above it
    const [x, z] = centre(p.ring);
    let near = towers[0], best = Infinity;
    for (const t of towers) { const [tx, tz] = centre(t.ring); const d = Math.hypot(x - tx, z - tz); if (d < best) { best = d; near = t; } }
    const home = near && HOMES.has(near.id);
    const cap = near ? HEIGHTS[near.id] : 245;
    items.push({ ring: p.ring, y0: p.minHeight > 0 ? p.minHeight : -0.3, y1: Math.min(p.height, cap), material: home ? homes : office, top: dark, name: `part-${p.id}` });
  }
  for (const it of kit.resolve(items)) kit.prism(it);
}
