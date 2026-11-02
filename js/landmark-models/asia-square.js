// js/landmark-models/asia-square.js
// Asia Square, Marina Bay (Denton Corker Marshall, 2011 and 2013): Tower 1 (43 storeys) and Tower 2 (46 storeys,
// the Westin on its upper floors), each a bundle of blue-grey glass shards stepping up to different heights, with
// white panels thrown over the glass a storey tall and a few bays long, sparse below and crowding into a white cap
// at the top, where Citi's name hangs on Tower 1's cap and the Westin's on Tower 2's, facing the bay. OpenStreetMap maps
// the shards as eighteen building parts between 173 and 228 m; built as mapped: Tower 1 to 221 m and Tower 2 (its
// "Westin" part) to 228 m; published heights disagree on which is the taller (229 / 221 one way, 221.5 / 229 the
// other), so the mapped tops stand until the inventory settles it. A part belongs to the tower whose outline is
// nearer; the outlines, mapped with no height, are tiled by the shards and get nothing of their own. info.height is
// the mapped top, 228 m.
export const info = { name: 'Asia Square', height: 228 };

const TOWER_1 = 407941850, TOWER_2 = 407941851;
const BAY = 55; // the bay lies north-east (compass degrees)

const centre = (ring) => ring.reduce(([x, z], [px, pz]) => [x + px / ring.length, z + pz / ring.length], [0, 0]);

export function build(kit, site) {
  const P = (id) => site.parts.find((p) => p.id === id);
  // blue-grey glass under scattered white panels, Tower 1 whiter than Tower 2, both capped in white
  const glass1 = kit.facadeMaterial({ wall: 0xeeeeea, window: 0x3d5e78, floorHeight: 4.2, bayWidth: 2.4, pattern: 'scatter', scatter: { density: 0.2, top: 0.85, ramp: [165, 221], length: 3, seed: 1 } });
  const glass2 = kit.facadeMaterial({ wall: 0xeeeeea, window: 0x35546b, floorHeight: 4.0, bayWidth: 2.4, pattern: 'scatter', scatter: { density: 0.14, top: 0.6, ramp: [175, 228], length: 3, seed: 2 } });
  const white = kit.material(0xeeeeea, { roughness: 0.85, metalness: 0.02 });
  const t1 = P(TOWER_1), t2 = P(TOWER_2);
  const c1 = t1 ? centre(t1.ring) : [0, 0], c2 = t2 ? centre(t2.ring) : [0, 0];
  const shards = site.parts.filter((p) => p.id !== TOWER_1 && p.id !== TOWER_2 && p.height > 0);
  const inFirst = (p) => { const [x, z] = centre(p.ring); return Math.hypot(x - c1[0], z - c1[1]) <= Math.hypot(x - c2[0], z - c2[1]); };
  const items = shards.map((p) => {
    const first = inFirst(p);
    return { ring: p.ring, y0: p.minHeight > 0 ? p.minHeight : -0.3, y1: p.height, material: first ? glass1 : glass2, top: white, name: `${first ? 'tower1' : 'tower2'}-${p.id}` };
  });
  for (const it of kit.resolve(items)) kit.prism(it);
  // the names, hung on each tower's tallest shard's wall facing the bay, at its white cap
  const tallest = (parts) => parts.reduce((a, b) => (b.height > a.height ? b : a));
  const first = shards.filter(inFirst), second = shards.filter((p) => !inFirst(p));
  if (first.length) { const p = tallest(first); kit.hang({ ring: p.ring, top: p.height, toward: BAY, margin: 4, text: 'citi', height: 8, color: 0x004b8d, name: 'sign:citi' }); }
  if (second.length) { const p = tallest(second); kit.hang({ ring: p.ring, top: p.height, toward: BAY, margin: 4, text: 'WESTIN', height: 5.5, color: 0xffffff, name: 'sign:westin' }); }
}
