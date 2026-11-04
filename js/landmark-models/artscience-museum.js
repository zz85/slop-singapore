// js/landmark-models/artscience-museum.js
// ArtScience Museum (SG-048), 10 Bayfront Avenue (Safdie Architects, opened 2011): the lotus. A round bowl lifted
// about 12.6 m over its lily pond on a core, seven dark columns, two stair towers and the glazed entrance, opening
// into ten broad petals of spheroid form with blunt cut ends: five short ones on the west, end faces glazed, and a
// rising run from the long low south-eastern petals to the tallest, 60 m (Marina Bay Sands factsheet), in the
// north; a concave dish with an oculus between them. Petal bearings and plan reaches follow relation 14314416's
// mapped slices and outline; its tagged heights run at about 0.43 of the building's, so heights are scaled to the
// documented 60 m. See docs/artscience-museum.md.
export const info = { name: 'ArtScience Museum', height: 60 };

const CORE = 827855915, COLUMNS = [827855856, 827855857, 827855858, 827855859, 827855860, 827855861, 827855862];
// [bearing, end top [reach, height], outer lip [reach, height], end width, outer and inner slope at the end (deg),
// swell of the back] — top/lip from the mapped tip slices and outline; widths and slopes from the photographs
const PETALS = [
  [18, [29, 60], [35, 55.5], 16, 100, 92, 6],
  [60, [37, 55], [42.5, 50.5], 14, 92, 84, 3],
  [96, [46, 51], [50.5, 44.5], 13.5, 65, 55, 0],
  [130, [50, 46], [53.5, 39], 13.5, 52, 42, 0],
  [166, [46, 41.5], [49.5, 34.5], 13.5, 45, 35, 0],
  [200, [30.5, 35], [31.5, 26], 12, 68, 8, 0],
  [237, [30.5, 35.3], [31.5, 26.3], 12, 68, 8, 0],
  [269, [30, 34.6], [31, 25.6], 12, 68, 8, 0],
  [303, [31, 34.9], [32, 25.9], 12, 68, 8, 0],
  [335, [32, 35.6], [33, 26.2], 12, 68, 10, 0]
];
const BOTTOM = [11.2, 12.6]; // the bowl's underside over the core [reach, height]
const DISH = [9, 29.5], OCULUS = 2.6; // the dish's rim, falling to the oculus at 27 m
const SPLIT = 21; // where the petals part from the shared bowl
const ARC = 6; // facets across a petal

// a cubic Bezier in (reach, height), sampled as a polyline that rises
const bezier = (p0, p1, p2, p3, n = 48) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
});
// the reach where a rising polyline crosses height y
const reachAt = (line, y) => {
  if (y <= line[0][1]) return line[0][0];
  for (let i = 1; i < line.length; i++) {
    const [r0, y0] = line[i - 1], [r1, y1] = line[i];
    if (y <= y1) return r0 + (r1 - r0) * (y - y0) / Math.max(1e-9, y1 - y0);
  }
  return line[line.length - 1][0];
};
const unit = (deg) => [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)];
const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };

export function build(kit, site) {
  const part = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`ArtScience Museum needs mapped part ${id}`);
    return p.ring;
  };
  const centroid = (ring) => {
    let n = ring.length;
    const f = ring[0], l = ring[n - 1];
    if (n > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) n--;
    let x = 0, z = 0;
    for (let i = 0; i < n; i++) { x += ring[i][0] / n; z += ring[i][1] / n; }
    return [x, z];
  };
  // The drawing's origin: the mapped round base's own centre (not the vertex-average anchor)
  const [cx, cz] = centroid(part(CORE));
  const at = (deg, r) => { const [dx, dz] = kit.compass(deg); return [cx + dx * r, cz + dz * r]; };
  const arc = (a0, a1, r0, r1, n = ARC) => [
    ...Array.from({ length: n + 1 }, (_, j) => at(a0 + (a1 - a0) * j / n, r1)),
    ...Array.from({ length: n + 1 }, (_, j) => at(a1 - (a1 - a0) * j / n, r0))
  ];

  const M = {
    shell: kit.material(0xd8dbd9, { roughness: 0.45, metalness: 0.25 }), // the stainless backs and sides
    white: kit.material(0xf4f2ec, { roughness: 0.6 }), // the upper faces and the cut ends
    window: kit.glassMaterial(0x3b505c),
    skylight: kit.glassMaterial(0x7e9ca8),
    oculus: kit.material(0x2a3236, { roughness: 0.8 }),
    core: kit.glassMaterial(0x34434b),
    column: kit.material(0x2a2e31, { roughness: 0.6 }),
    truss: kit.material(0xe9e9e4, { roughness: 0.55 }),
    entrance: kit.glassMaterial(0x4f6c78),
    pond: kit.material(0x2c5a5c, { roughness: 0.3, metalness: 0.15 }),
    lily: kit.material(0x4f7d3c, { roughness: 0.9 })
  };

  // The ten petals, each a stack of horizontal slices of its profile: the back from the bowl's underside out to the
  // lip, the cut end from the lip to the top, the upper face from the top back down to the dish
  PETALS.forEach(([deg, top, lip, width, outerSlope, innerSlope, swell], i) => {
    const prev = PETALS[(i + PETALS.length - 1) % PETALS.length][0], next = PETALS[(i + 1) % PETALS.length][0];
    const left = deg - ((deg - prev + 360) % 360) / 2, right = deg + ((next - deg + 360) % 360) / 2;
    const back = Math.hypot(lip[0] - BOTTOM[0], lip[1] - BOTTOM[1]), face = Math.hypot(top[0] - DISH[0], top[1] - DISH[1]);
    const o = unit(outerSlope), n = unit(innerSlope);
    const outer = bezier(BOTTOM, [BOTTOM[0] + 0.4 * back * 0.98, BOTTOM[1] + 0.4 * back * 0.2],
      [lip[0] - 0.35 * back * o[0] + swell, lip[1] - 0.35 * back * o[1]], lip);
    const inner = bezier(DISH, [DISH[0] + 0.4 * face, DISH[1] + 0.04 * face], [top[0] - 0.4 * face * n[0], top[1] - 0.4 * face * n[1]], top);
    const rOut = (y) => (y <= lip[1] ? reachAt(outer, y) : lip[0] + (top[0] - lip[0]) * (y - lip[1]) / (top[1] - lip[1]));
    const rIn = (y) => (y <= 23.9 ? 0.4 : y <= 24 ? 0.4 + (OCULUS - 0.4) * (y - 23.9) / 0.1 : y <= 27 ? OCULUS
      : y <= DISH[1] ? OCULUS + (DISH[0] - OCULUS) * (y - 27) / (DISH[1] - 27) : reachAt(inner, y));
    // the petal's bearings at a height: its full share of the bowl below SPLIT, its end's width by the lip
    const edges = (y, r) => {
      const s = smooth((y - SPLIT) / Math.max(1, lip[1] - SPLIT)), half = Math.asin(Math.min(1, width / 2 / r)) * 180 / Math.PI;
      return [left + (Math.max(left, deg - half) - left) * s, right + (Math.min(right, deg + half) - right) * s];
    };
    const ring = (y) => { const r = rOut(y), [a0, a1] = edges(y, r); return arc(a0, a1, rIn(y), r); };

    const span = top[1] - lip[1], band = [lip[1] + 0.25 * span, lip[1] + 0.75 * span];
    const levels = [BOTTOM[1], 13.5, 14.8, 16.5, 18.5, SPLIT, 23.9, 24, 27, 28.2, DISH[1], lip[1], ...band, top[1] - 0.12];
    const steps = Math.ceil((lip[1] - DISH[1]) / 3.2);
    for (let k = 1; k < steps; k++) levels.push(DISH[1] + (lip[1] - DISH[1]) * k / steps);
    const ys = [...new Set(levels.filter((y) => y >= BOTTOM[1] && y <= top[1] - 0.12).sort((a, b) => a - b))]
      .filter((y, k, all) => k === 0 || y - all[k - 1] > 0.05);
    const skylight = outerSlope > 80; // a near-level cut end is the gallery skylight, glazed whole
    for (let k = 0; k + 1 < ys.length; k++) {
      const y0 = ys[k], y1 = ys[k + 1], onEnd = y0 >= lip[1] - 1e-6, glazed = onEnd && y0 >= band[0] - 1e-6 && y1 <= band[1] + 1e-6;
      kit.loft({
        ring: ring(y0), topRing: ring(y1), y0, y1, material: M.shell, top: skylight && k + 2 === ys.length ? M.skylight : M.white,
        // walls: the outer arc (0..ARC-1), a side, the inner arc, the other side
        edgeMaterial: (w) => (w < ARC ? (skylight && onEnd ? M.skylight : glazed && w >= 1 && w < ARC - 1 ? M.window : onEnd ? M.white : null)
          : w > ARC && w < 2 * ARC + 1 ? (y1 <= 27 + 1e-6 ? M.oculus : M.white) : null),
        name: k + 2 === ys.length ? `petal-${i}-tip` : `petal-${i}-${k}`
      });
    }
    // collision in three bands from where the petal parts to its top, each over the petal's plan in that band
    for (let b = 0; b < 3; b++) {
      const y0 = SPLIT + (top[1] - SPLIT) * b / 3, y1 = SPLIT + (top[1] - SPLIT) * (b + 1) / 3;
      const probe = Array.from({ length: 7 }, (_, k) => y0 + (y1 - y0) * k / 6).filter((y) => y <= top[1] - 0.12);
      const r0 = Math.max(OCULUS, Math.min(...probe.map(rIn))), r1 = Math.max(...probe.map(rOut));
      const a = probe.map((y) => edges(y, rOut(y)));
      kit.collisionPrism({ ring: arc(Math.min(...a.map((e) => e[0])), Math.max(...a.map((e) => e[1])), r0, r1, 4), y0, y1 });
    }
  });
  // the bowl below the petals' parting, filled
  const circle = (r) => Array.from({ length: 24 }, (_, k) => at(k * 15, r));
  kit.collisionPrism({ ring: circle(17), y0: BOTTOM[1], y1: 17 });
  kit.collisionPrism({ ring: circle(25), y0: 17, y1: SPLIT });

  // Under the bowl: the glazed core, a white V truss round it, the seven mapped dark columns leaning out to the
  // bowl, the two white stair towers and the glazed entrance pavilion toward the Helix Bridge (north-east)
  kit.cylinder({ x: cx, z: cz, y0: 0, y1: 12.5, r: 6.4, segments: 16, material: M.core, top: M.core, name: 'core', outlineCollision: true });
  for (let k = 0; k < 8; k++) {
    const a = k * 45, [x0, z0] = at(a, 7.1), [x1, z1] = at(a + 22.5, 7.1), [x2, z2] = at(a + 45, 7.1);
    kit.beam({ from: [x0, 12.4, z0], to: [x1, 0.2, z1], w: 0.5, h: 0.5, material: M.truss, name: `truss-${k}-a` });
    kit.beam({ from: [x1, 0.2, z1], to: [x2, 12.4, z2], w: 0.5, h: 0.5, material: M.truss, name: `truss-${k}-b` });
  }
  COLUMNS.forEach((id, k) => {
    const [x, z] = centroid(part(id)), dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz);
    kit.beam({ from: [x, 0, z], to: [cx + dx * (r + 2.4) / r, 13.2, cz + dz * (r + 2.4) / r], w: 1.2, h: 1.2, material: M.column, name: `column-${k}` });
  });
  for (const [k, deg] of [345, 125].entries()) {
    const [x, z] = at(deg, 14.5);
    kit.cylinder({ x, z, y0: 0, y1: 14, r: 2.1, segments: 10, material: M.truss, top: M.truss, name: `stair-${k}` });
  }
  const [ux, uz] = kit.compass(45), [ex, ez] = at(45, 19);
  kit.prism({ ring: [[-6, -11], [6, -11], [6, 11], [-6, 11]].map(([u, t]) => [ex + ux * u - uz * t, ez + uz * u + ux * t]), y0: 0, y1: 10.5, material: M.entrance, top: M.shell, name: 'entrance' });

  // The lily pond round the base, widest on the south-west, paved where the entrance meets the north-east
  const pond = [];
  for (let a = 75; a <= 375; a += 10) pond.push(at(a, a >= 145 && a <= 305 ? 40 : 27));
  for (let a = 375; a >= 75; a -= 15) pond.push(at(a, 8.2));
  kit.prism({ ring: pond, y0: 0, y1: 0.35, material: M.pond, top: M.pond, name: 'pond' });
  for (let k = 0; k < 24; k++) {
    const a = 150 + ((k * 47) % 150), r = 13 + ((k * 29) % 23), [x, z] = at(a, r);
    kit.cylinder({ x, z, y0: 0.35, y1: 0.42 + (k % 4) * 0.015, r: 0.9 + (k % 3) * 0.3, segments: 7, material: M.lily, top: M.lily, name: `lily-${k}` });
  }
}
