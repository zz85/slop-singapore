// js/landmark-models/marina-bay-financial-centre.js
// Marina Bay Financial Centre (Kohn Pedersen Fox, 2010-2013): three office towers in blue-green glass behind white
// mullions — Tower 1 (186 m, 33 storeys), Tower 2 (245 m, 50) and Tower 3 (245 m, 46, its crown stepping up from
// 218 m) — with Marina Bay Residences (227 m, 55 storeys) beside them, over the four-storey podium.
// OpenStreetMap maps the named towers at 245 m each: the program uses the documented heights. Tower 3 is built from
// its four mapped parts (tops 218, 238, 218 and 239 m, the tallest raised to the documented 245) rather than its
// outline, so its stepped crown shows. The complex's outline (728243729) is the underground Link Mall (layer -1):
// hidden, nothing built. The unnamed 245 m way 116905047 south of the Residences is taken to be Marina Bay Suites
// (221 m, 66 storeys) — unverified: its mapped footprint is a 10 x 68 m blade.
export const info = { name: 'Marina Bay Financial Centre', height: 245 };

const TOWER_1 = 116905040, TOWER_2 = 116905042, TOWER_3 = 116905041, RESIDENCES = 116905045, SUITES = 116905047;
const PODIUM = 509003525, MALL = 728243729;
const TOWER_3_PARTS = { 509003526: 218, 509003527: 238, 509003528: 218, 509003529: 245 };
const HEIGHTS = { [TOWER_1]: 186, [TOWER_2]: 245, [RESIDENCES]: 227, [SUITES]: 221 };
const HOMES = new Set([RESIDENCES, SUITES]);

export function build(kit, site) {
  const office = kit.facadeMaterial({ wall: 0x9fb3bf, window: 0x2e5566, floorHeight: 4.2, bayWidth: 2.4, pattern: 'curtain' });
  const homes = kit.facadeMaterial({ wall: 0xc9cdd0, window: 0x3a5a6a, floorHeight: 3.3, bayWidth: 2.8, pattern: 'ribbon' });
  const podium = kit.facadeMaterial({ wall: 0xb8bcbf, window: 0x3a5a6a, floorHeight: 4.5, bayWidth: 3.0, pattern: 'curtain' });
  const dark = kit.glassMaterial(0x2e5566);
  const items = [];
  for (const p of site.parts) {
    if (p.id === MALL || p.id === TOWER_3) continue;
    if (p.id === PODIUM) { items.push({ ring: p.ring, y0: -0.3, y1: p.height || 19, material: podium, name: 'podium' }); continue; }
    if (TOWER_3_PARTS[p.id]) { items.push({ ring: p.ring, y0: -0.3, y1: TOWER_3_PARTS[p.id], material: office, top: dark, name: `tower3-${p.id}` }); continue; }
    if (HEIGHTS[p.id]) {
      const home = HOMES.has(p.id);
      items.push({ ring: p.ring, y0: -0.3, y1: HEIGHTS[p.id], material: home ? homes : office, top: home ? undefined : dark, name: `tower-${p.id}` });
    }
  }
  for (const it of kit.resolve(items)) kit.prism(it);
}
