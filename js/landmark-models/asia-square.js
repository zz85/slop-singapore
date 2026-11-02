// js/landmark-models/asia-square.js
// Asia Square, Marina Bay (Denton Corker Marshall, 2011 and 2013): Tower 1 (43 storeys) and Tower 2 (46 storeys,
// the Westin on its upper floors), each a bundle of dark glass shards stepping up to different heights, which
// OpenStreetMap maps as eighteen building parts between 173 and 228 m. Built as mapped: Tower 1 to 221 m and
// Tower 2 (its "Westin" part) to 228 m; published heights disagree on which is the taller (229 / 221 one way,
// 221.5 / 229 the other), so the mapped tops stand until the inventory settles it. The program builds every part in
// the tower's glass (a part belongs to the tower whose outline is nearer); the outlines, mapped with no height, are
// tiled by the shards and get nothing of their own. info.height is the mapped top, 228 m.
export const info = { name: 'Asia Square', height: 228 };

const TOWER_1 = 407941850, TOWER_2 = 407941851;

const centre = (ring) => ring.reduce(([x, z], [px, pz]) => [x + px / ring.length, z + pz / ring.length], [0, 0]);

export function build(kit, site) {
  const P = (id) => site.parts.find((p) => p.id === id);
  const glass1 = kit.facadeMaterial({ wall: 0x4e5a63, window: 0x1f2a33, floorHeight: 4.2, bayWidth: 2.4, windowWidth: 0.7, pattern: 'strips' });
  const glass2 = kit.facadeMaterial({ wall: 0x5d6971, window: 0x25313a, floorHeight: 4.0, bayWidth: 2.4, windowWidth: 0.7, pattern: 'strips' });
  const dark = kit.glassMaterial(0x27323a);
  const t1 = P(TOWER_1), t2 = P(TOWER_2);
  const c1 = t1 ? centre(t1.ring) : [0, 0], c2 = t2 ? centre(t2.ring) : [0, 0];
  const items = [];
  for (const p of site.parts) {
    if (p.id === TOWER_1 || p.id === TOWER_2 || !(p.height > 0)) continue;
    const [x, z] = centre(p.ring);
    const first = Math.hypot(x - c1[0], z - c1[1]) <= Math.hypot(x - c2[0], z - c2[1]);
    items.push({ ring: p.ring, y0: p.minHeight > 0 ? p.minHeight : -0.3, y1: p.height, material: first ? glass1 : glass2, top: dark, name: `${first ? 'tower1' : 'tower2'}-${p.id}` });
  }
  for (const it of kit.resolve(items)) kit.prism(it);
}
