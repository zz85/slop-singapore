// js/landmark-models/suntec-city.js
// Suntec City (SG-215), Marina Centre (1997): four 45-storey, 181 m office towers and the 18-storey,
// 72 m Tower Five — the fingers and thumb — over the curved mall podium, the Convention & Exhibition
// Centre with its white pyramid skylights, and the Fountain of Wealth's bronze ring on four slanted
// legs in the open court. OSM maps each tall tower in three stacked tiers (to 90, 150 and 181 m, the
// photographed notch); the model builds those tiers on their mapped rings. See docs/suntec-city.md.
export const info = { name: 'Suntec City', height: 181 };

const TOWERS = [ // [label, tier to 90 m, tier 90–150 m, tier 150–181 m]
  [1, 741937829, 393090486, 172373826], [2, 741937830, 393090485, 172373825],
  [3, 741937831, 393090484, 172373827], [4, 741937832, 393090487, 393090483]];
const TOWER5 = 741937828;
const MALL = [393210508, 46595137, 492114727], MALL_LINK = 393210509, MALL_WEST = 46594818;
const CONV = 591301851;
const LEGS = [460430417, 460430418, 460430419, 460430420];

export function build(kit, site) {
  const raw = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Suntec City needs mapped part ${id}`);
    return p;
  };
  const ringOf = (id) => {
    let ring = raw(id).ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    return ring;
  };
  const centre = (ring) => ring.reduce(([x, z], p) => [x + p[0] / ring.length, z + p[1] / ring.length], [0, 0]);

  const M = {
    tower: kit.facadeMaterial({ wall: 0xafa48d, window: 0x3a4450, floorHeight: 4.02, bayWidth: 2.2, windowWidth: 0.55, windowHeight: 0.5, pattern: 'punched' }),
    mall: kit.facadeMaterial({ wall: 0x9aa09b, window: 0x2e3c44, floorHeight: 5, bayWidth: 3, pattern: 'ribbon' }),
    conv: kit.facadeMaterial({ wall: 0xd5d1c5, window: 0x46525a, floorHeight: 4, bayWidth: 3, pattern: 'punched' }),
    white: kit.material(0xf0eee6), deck: kit.material(0x9a968c), dark: kit.material(0x2c3134),
    bronze: kit.material(0xa06a30, { roughness: 0.45, metalness: 0.5 }), water: kit.glassMaterial(0x2f6d84)
  };

  // The mall podium on its mapped curved rings, its raised link and the west block; the fountain court
  // between the rings is left open
  for (const id of MALL) {
    const ring = ringOf(id);
    kit.prism({ ring, y0: -0.3, y1: 20, material: M.mall, top: M.deck, name: `mall-${id}` });
    kit.prism({ ring: kit.inset(ring, 0.4), y0: 20, y1: 20.35, material: M.deck, top: M.deck, name: `mall-deck-${id}` });
    kit.collisionPrism({ ring: kit.inset(ring, 0.5), y0: 0, y1: 20 });
  }
  // The link shares mapped edges and the 20 m roof plane with both mall rings, so it stands a step
  // inside them and a step below their caps
  const link = kit.inset(ringOf(MALL_LINK), 0.12), linkBase = raw(MALL_LINK).minHeight || 5;
  kit.prism({ ring: link, y0: linkBase, y1: 19.9, material: M.mall, top: M.deck, name: 'mall-link' });
  kit.collisionPrism({ ring: kit.inset(link, 0.3), y0: linkBase, y1: 19.9 });
  const west = ringOf(MALL_WEST);
  kit.prism({ ring: west, y0: -0.3, y1: 33, material: M.mall, top: M.deck, name: 'mall-west-block' });
  kit.collisionPrism({ ring: kit.inset(west, 0.5), y0: 0, y1: 33 });

  // The Convention & Exhibition Centre: the 28 m block and every mapped white roof pyramid
  const conv = ringOf(CONV);
  kit.prism({ ring: conv, y0: -0.3, y1: 28, material: M.conv, top: M.deck, name: 'convention-centre' });
  kit.collisionPrism({ ring: kit.inset(conv, 0.5), y0: 0, y1: 28 });
  for (const p of site.parts) {
    if (p.roofShape !== 'pyramidal') continue;
    let ring = p.ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    kit.loft({ ring, y0: 28, y1: 33, scale: 0.08, material: M.white, top: M.white, name: `conv-pyramid-${p.id}` });
  }

  // The four fingers in their three mapped tiers, and the thumb
  let signRing = null;
  for (const [n, lo, mid, hi] of TOWERS) {
    const tiers = [[ringOf(lo), -0.3, 90], [ringOf(mid), 90, 150], [ringOf(hi), 150, 181]];
    tiers.forEach(([ring, y0, y1], t) => {
      kit.prism({ ring, y0, y1, material: M.tower, top: M.deck, name: `tower-${n}-tier-${t}` });
      kit.collisionPrism({ ring: kit.inset(ring, 0.3), y0: Math.max(0, y0), y1 });
      if (n === 2 && t === 2) signRing = ring;
    });
  }
  const t5 = ringOf(TOWER5);
  kit.prism({ ring: t5, y0: -0.3, y1: 72, material: M.tower, top: M.deck, name: 'tower-5' });
  kit.collisionPrism({ ring: kit.inset(t5, 0.3), y0: 0, y1: 72 });
  // The SUNTEC crown sign photographed from the west and north in 2024
  kit.hang({ ring: signRing, top: 181, toward: 0, below: 2, text: 'SUNTEC', height: 5, color: 0x7a3b22, name: 'suntec-sign' });

  // The Fountain of Wealth: basin, four slanted legs from their mapped feet, the bronze ring at 13.8 m
  const feet = LEGS.map((id) => centre(ringOf(id)));
  const C = [0, 1].map((k) => feet.reduce((s, p) => s + p[k], 0) / feet.length);
  kit.cylinder({ x: C[0], z: C[1], y0: -0.1, y1: 0.5, r: 23, segments: 28, material: M.dark, top: M.dark, name: 'fountain-basin' });
  kit.cylinder({ x: C[0], z: C[1], y0: 0.5, y1: 0.72, r: 18, segments: 28, material: M.water, top: M.water, name: 'fountain-water' });
  kit.cylinder({ x: C[0], z: C[1], y0: 0.7, y1: 1.5, r: 2.4, segments: 12, material: M.bronze, top: M.bronze, name: 'fountain-centre' });
  const R = 10.5; // the ring's published ~66 m circumference
  feet.forEach(([fx, fz], i) => {
    const d = Math.hypot(fx - C[0], fz - C[1]) || 1, ux = (fx - C[0]) / d, uz = (fz - C[1]) / d;
    kit.beam({ from: [fx, 0.2, fz], to: [C[0] + ux * R, 13.1, C[1] + uz * R], w: 1.1, h: 1.1, material: M.bronze, name: `fountain-leg-${i}` });
  });
  // Alternate segments sit 3 cm higher so neighbouring segment caps never share a plane where they meet
  const SEG = 20, chord = 2 * R * Math.sin(Math.PI / SEG);
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2, y = 13.15 + (i % 2) * 0.03;
    const seg = kit.box({ x: C[0] + Math.cos(a) * R, z: C[1] + Math.sin(a) * R, y, w: chord, h: 1.3, d: 1.1, yaw: Math.atan2(Math.cos(a), -Math.sin(a)), material: M.bronze, top: M.bronze, name: `fountain-ring-${i}` });
    kit.collisionPrism({ ring: seg.ring, y0: y, y1: y + 1.3 });
  }
}
