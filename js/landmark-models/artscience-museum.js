// js/landmark-models/artscience-museum.js
// ArtScience Museum (SG-048), 10 Bayfront Avenue (Safdie Architects, opened 2011): the lotus of ten white
// finger-like petals generated from spheroids, progressing in height around a circular base — the tallest
// fingertip 60 m above ground (Marina Bay Sands factsheet) — seemingly floating over its giant lily pond.
// The mapped parts are relation 14314416's 63 member ways: the pond outline 261191086, the round base
// 827855915 (r ≈ 11 m), the bowl 827855929 and some fifty petal slices whose tagged heights (12–26 m)
// run at roughly half the documented building; they are used here only for the fingers' bearings, reaches
// and height progression, scaled to the documented 60 m. See docs/artscience-museum.md.
export const info = { name: 'ArtScience Museum', height: 60 };

const OUTLINE = 261191086, CORE = 827855915;
// [bearing (true, deg), fingertip height (m), fingertip distance from the centre (m)] — bearings and reaches
// clustered from the mapped slices, heights scaled from their progression (see the notes)
const PETALS = [
  [18, 60, 30], [61, 55, 38], [98, 51, 45], [140, 46, 44], [178, 42, 44],
  [212, 38, 29], [238, 36, 29], [269, 35, 28], [296, 33, 32], [322, 32, 30]
];
const BASE_Y = 8; // where the fingers leave the bowl

export function build(kit, site) {
  const part = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`ArtScience Museum needs mapped part ${id}`);
    let ring = p.ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    return ring;
  };
  const outline = part(OUTLINE), coreRing = part(CORE);
  // The drawing's origin: the mapped round base's own centre (not the vertex-average anchor)
  let cx = 0, cz = 0;
  for (const [x, z] of coreRing) { cx += x / coreRing.length; cz += z / coreRing.length; }
  const circle = (r, seg = 28, phase = 0) => Array.from({ length: seg }, (_, i) => {
    const a = phase + (i / seg) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });

  const M = {
    deck: kit.material(0xb9b0a0, { roughness: 0.9 }),
    pond: kit.material(0x2f6f73, { roughness: 0.35, metalness: 0.15 }),
    lily: kit.material(0x4d7d3a, { roughness: 0.9 }),
    white: kit.material(0xf1ede3, { roughness: 0.55 }),
    bowl: kit.material(0xe2dccd, { roughness: 0.65 }),
    glass: kit.glassMaterial(0x3d5566),
    skylight: kit.glassMaterial(0x8fb0bc)
  };

  // The pond deck on the mapped outline, the lily pond about the base, and a scatter of lily pads
  kit.prism({ ring: outline, y0: -0.2, y1: 0.8, material: M.deck, top: M.deck, name: 'pond-deck' });
  kit.cylinder({ x: cx, z: cz, y0: 0.8, y1: 0.95, r: 31, segments: 36, material: M.pond, top: M.pond, name: 'pond' });
  const lilies = [[14, 40], [19, 95], [24, 150], [17, 205], [27, 232], [21, 282], [15, 318], [26, 8], [22, 66],
    [28, 122], [16, 172], [25, 262], [18, 340], [29, 190], [13, 130], [23, 300]];
  lilies.forEach(([r, deg], i) => {
    const [dx, dz] = kit.compass(deg);
    kit.cylinder({ x: cx + dx * r, z: cz + dz * r, y0: 0.95, y1: 1.03, r: 0.9 + (i % 3) * 0.25, segments: 7, material: M.lily, top: M.lily, name: `lily-${i}` });
  });

  // The round base on its mapped ring, the flaring bowl the fingers spring from, and the glazed entrance
  // toward the Shoppes link (south-east)
  kit.prism({ ring: coreRing, y0: -0.2, y1: 12.5, material: M.white, top: M.bowl, name: 'round-base' });
  kit.collisionPrism({ ring: circle(10.6, 24), y0: 0, y1: 12.5 }); // the round drum's interior, filled
  kit.loft({ ring: circle(11.5), topRing: circle(20.5), y0: 5, y1: 13.5, material: M.bowl, top: M.bowl, name: 'bowl' });
  kit.collisionPrism({ ring: circle(20, 24), y0: 6, y1: 13.5 });
  kit.cylinder({ x: cx, z: cz, y0: 13.5, y1: 13.75, r: 2.5, segments: 12, material: M.glass, top: M.glass, name: 'bowl-centre' });
  const [edx, edz] = kit.compass(150);
  kit.box({ x: cx + edx * 14, z: cz + edz * 14, y: 0, w: 14, h: 5.5, d: 5.4, yaw: kit.yawToward(150), material: M.glass, top: M.white, name: 'entrance' });

  // The ten fingers: ellipse rings along a spine that leans outward as it rises and tapers to the
  // fingertip, whose cap is the gallery skylight
  const T = [0, 0.36, 0.7, 1];
  PETALS.forEach(([deg, tipY, tipR], i) => {
    const dir = kit.compass(deg), tang = [-dir[1], dir[0]];
    const s = 0.82 + 0.3 * (tipY / 60);
    const A = [6.2, 6.8, 5.2, 2.6], B = [5.2, 6.1, 4.9, 2.3];
    const level = (t, k) => {
      const r = 5 + (tipR - 5) * Math.pow(t, 1.3);
      const ox = cx + dir[0] * r, oz = cz + dir[1] * r;
      return Array.from({ length: 10 }, (_, j) => {
        const a = (j / 10) * Math.PI * 2, u = Math.cos(a) * A[k] * s, v = Math.sin(a) * B[k] * s;
        return [ox + dir[0] * u + tang[0] * v, oz + dir[1] * u + tang[1] * v];
      });
    };
    for (let k = 0; k < 3; k++) {
      kit.loft({
        ring: level(T[k], k), topRing: level(T[k + 1], k + 1),
        y0: BASE_Y + (tipY - BASE_Y) * T[k], y1: BASE_Y + (tipY - BASE_Y) * T[k + 1],
        material: M.white, top: k === 2 ? M.skylight : M.white,
        name: k === 2 ? `petal-${i}-tip` : `petal-${i}-${k}`
      });
    }
    // collision over the finger's swept plan, bowl to fingertip; the pond between the fingers stays open
    const w0 = 4.4 * s, w1 = 2.2 * s;
    const P = (r, w) => [cx + dir[0] * r + tang[0] * w, cz + dir[1] * r + tang[1] * w];
    kit.collisionPrism({ ring: [P(4, w0), P(tipR - 2, w1), P(tipR + 2.5, 0), P(tipR - 2, -w1), P(4, -w0)], y0: BASE_Y, y1: tipY });
  });
}
