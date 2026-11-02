// js/landmark-models/marina-bay-financial-centre.js
// Marina Bay Financial Centre (Kohn Pedersen Fox, 2010-2013): three office towers over a four-storey podium, in
// dark blue-green glass behind pale mullions — Tower 1 (186 m, 33 storeys) and Tower 2 (245 m, 50), their crowns
// cut on a slant (Tower 1's falling east-south-east, Tower 2's west-north-west: seen from the bay they lean apart),
// and Tower 3 (239 m, 46), its crown stepping up in terraces — with Marina Bay Residences (227 m, 55 storeys), a
// slender glass tower with balcony lines and a slanted crown of its own, at the bay end of the block, and Marina
// Bay Suites (222 m, 66 storeys; its own development at 3 Central Boulevard, in the same block) in pale balcony
// bands. The tenants' names stand on the roofs as Tiny Warsaw's do: Standard Chartered on Tower 1, HSBC on Tower 2,
// DBS on Tower 3, facing the bay: Tower 3's on its flat top, Towers 1's and 2's hung on their bay walls under the
// slanted rooflines, as the real ones are.
// OpenStreetMap maps every tower at 245 m: the program uses the documented heights (Wikipedia's 245, 239, 227, 222,
// 192 m with Tower 1 at the 186 m of CTBUH). Tower 3 is built from its four mapped parts (tops 218, 238, 218 and
// 239 m) rather than its outline, so its terraces show. The complex's outline (728243729) is the underground Link
// Mall (layer -1): nothing is built for it. The unnamed 245 m way 116905047 (private, 2013) is Marina Bay Suites.
export const info = { name: 'Marina Bay Financial Centre', height: 245 };

const TOWER_1 = 116905040, TOWER_2 = 116905042, RESIDENCES = 116905045, SUITES = 116905047;
const PODIUM = 509003525;
const TOWER_3_PARTS = { 509003526: 218, 509003527: 238, 509003528: 218, 509003529: 239 };
const TOWER_3_TOP = 509003529;
const BAY = 45; // the bay lies north-east of the block (compass degrees)

export function build(kit, site) {
  const P = (id) => site.parts.find((p) => p.id === id);
  const office = kit.facadeMaterial({ wall: 0x8da0aa, window: 0x294856, floorHeight: 4.2, bayWidth: 1.6, pattern: 'curtain' });
  const homes = kit.facadeMaterial({ wall: 0xb8c4c8, window: 0x3b6579, floorHeight: 3.3, bayWidth: 2.8, pattern: 'ribbon' });
  const suites = kit.facadeMaterial({ wall: 0xd9d9d4, window: 0x4a7b96, floorHeight: 3.4, bayWidth: 3.0, pattern: 'ribbon' });
  const podium = kit.facadeMaterial({ wall: 0xb5bcc0, window: 0x294856, floorHeight: 4.5, bayWidth: 2.0, pattern: 'curtain' });
  const dark = kit.glassMaterial(0x294856);
  const items = [];
  const base = P(PODIUM);
  if (base) items.push({ ring: base.ring, y0: -0.3, y1: base.height || 19, material: podium, name: 'podium' });
  // the slanted crowns: a top falling `drop` m toward a compass bearing
  const crowns = [
    { id: TOWER_1, top: 186, drop: 16, toward: 120, material: office, name: 'tower1' },
    { id: TOWER_2, top: 245, drop: 20, toward: 300, material: office, name: 'tower2' },
    { id: RESIDENCES, top: 227, drop: 12, toward: 300, material: homes, name: 'residences' },
  ];
  for (const c of crowns) {
    const p = P(c.id);
    if (p) items.push({ ring: p.ring, y0: -0.3, y1: kit.sloped(p.ring, c.top, c.drop, c.toward), material: c.material, top: dark, name: c.name });
  }
  // Tower 3: its terraced crown, from the mapped parts
  for (const [id, top] of Object.entries(TOWER_3_PARTS)) {
    const p = P(Number(id));
    if (p) items.push({ ring: p.ring, y0: -0.3, y1: top, material: office, top: dark, name: `tower3-${id}` });
  }
  const suitesPart = P(SUITES);
  if (suitesPart) items.push({ ring: suitesPart.ring, y0: -0.3, y1: 222, material: suites, name: 'suites' });
  for (const it of kit.resolve(items)) kit.prism(it);
  // the names: Tower 3's on its flat top facing the bay; on the slanted crowns, hung on the wall facing the bay, 2 m
  // under the roofline's low end over that wall
  const t3 = P(TOWER_3_TOP);
  if (t3) { const b = kit.boxOf(t3.ring); kit.sign({ text: 'DBS', x: b.cx, z: b.cz, y: 239.6, yaw: kit.yawToward(BAY), height: 7, color: 0xe2231a, name: 'sign:dbs' }); }
  const hung = ({ ring, top, drop, toward }, { text, height, color, name }) => {
    const w = kit.wallToward(ring, BAY);
    const roof = kit.sloped(ring, top, drop, toward);
    const line = Math.min(roof(...w.a), roof(...w.b));
    kit.sign({ text, x: w.x + w.nx * 0.5, z: w.z + w.nz * 0.5, y: line - height - 2, yaw: w.yaw, height, maxWidth: w.length - 6, color, bar: false, name });
  };
  const t1 = P(TOWER_1), t2 = P(TOWER_2);
  if (t1) hung({ ring: t1.ring, ...crowns[0] }, { text: 'Standard Chartered', height: 6, color: 0x1a6aa3, name: 'sign:standard-chartered' });
  if (t2) hung({ ring: t2.ring, ...crowns[1] }, { text: 'HSBC', height: 7, color: 0xdb0011, name: 'sign:hsbc' });
}
