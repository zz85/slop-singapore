// js/landmark-models/uob-plaza.js
// UOB Plaza, Raffles Place: Plaza One (Kenzo Tange, 1992; 280 m, 66 storeys), a stack of offset square shafts that
// end as two squares superimposed at 45° (an eight-pointed star in plan); Plaza Two (1973, re-clad in 1995; 162 m,
// 38 storeys); their podium, with the banquet hall's saucer raised between the towers. Built from the mapped
// outlines and parts (site.parts: OpenStreetMap's stack of parts for both towers, made safe to draw together by
// kit.resolve) in grey granite with dark window bands, the storeys 4.2 m, the bank's name on Plaza One's roof facing
// the bay. Documented heights 280 m and 162 m; the mapped parts carry their own.
export const info = { name: 'UOB Plaza', height: 280 };

const PODIUM = 106193385;
const TOWER_1 = 335167827; // the outlines mapped with no height: drawn by their parts
const TOWER_2 = 171999282;

export function build(kit, site) {
  const granite = kit.facadeMaterial({ wall: 0x9a9b96, window: 0x2a3036, floorHeight: 4.2, bayWidth: 2.8, pattern: 'ribbon' });
  const podium = kit.facadeMaterial({ wall: 0x8f9088, window: 0x2a3036, floorHeight: 5.5, bayWidth: 3.0, pattern: 'curtain' });
  const white = kit.material(0xe9e7e0);
  const centre = (ring) => ring.reduce(([x, z], [px, pz]) => [x + px / ring.length, z + pz / ring.length], [0, 0]);
  const items = [];
  for (const p of site.parts) {
    if (p.id === PODIUM) { items.push({ ring: p.ring, y0: -0.3, y1: p.height || 33, material: podium, name: 'podium' }); continue; }
    if (p.id === TOWER_1 || p.id === TOWER_2 || !(p.height > 0)) continue;
    items.push({ ring: p.ring, y0: p.minHeight > 0 ? p.minHeight : -0.3, y1: p.height, material: granite, name: `part-${p.id}` });
  }
  for (const it of kit.resolve(items)) kit.prism(it);
  // the bank's name on Plaza One's roof: on the broadest of its highest parts (the round crown, not a star-tip
  // sliver mapped as high), facing the bay
  const tall = site.parts.filter((p) => p.height > 0 && p.id !== TOWER_1 && p.id !== TOWER_2);
  const top = Math.max(0, ...tall.map((p) => p.height));
  const crown = tall.filter((p) => p.height >= top - 1).map((p) => ({ p, b: kit.boxOf(p.ring) })).sort((u, v) => v.b.hx * v.b.hz - u.b.hx * u.b.hz)[0];
  if (crown) kit.sign({ text: 'UOB', x: crown.b.cx, z: crown.b.cz, y: crown.p.height + 0.6, yaw: kit.yawToward(135), height: 7, maxWidth: 2 * Math.min(crown.b.hx, crown.b.hz) - 2, color: 0xd71920, name: 'sign:uob' });
  // the banquet hall's saucer, between the towers above the podium
  const t1 = site.parts.find((p) => p.id === TOWER_1), t2 = site.parts.find((p) => p.id === TOWER_2);
  if (t1 && t2) {
    const [ax, az] = centre(t1.ring), [bx, bz] = centre(t2.ring);
    const x = (ax + bx) / 2, z = (az + bz) / 2;
    kit.cylinder({ x, z, y0: 33, y1: 36, r: 3, segments: 8, material: white, name: 'saucer-stem' });
    kit.cylinder({ x, z, y0: 36, y1: 42, r: 13, segments: 16, material: white, name: 'saucer' });
  }
}
