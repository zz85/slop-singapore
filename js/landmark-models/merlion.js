// js/landmark-models/merlion.js
// SG-147 the Merlion: the 8.6 m lion-headed fish Lim Nang Seng made in 1971–72 (cement on a steel frame, unveiled 15
// September 1972 at the mouth of the Singapore River), moved in April 2002 to the tip of the new Merlion Park platform in
// front of One Fullerton, where it stands on its tiled waves on a round granite drum rising from the bay and spouts
// into Marina Bay. It faces 75° (ENE; "east" in the published accounts): the bearing of its jet to the splash on the
// aerial (Esri World Imagery) and of the side it shows to the Swissôtel The Stamford. Its 8.6 m (Roots.sg, Wikipedia) is
// taken from the foot of its waves to the top of its head; its other measures are read off photographs scaled to that
// height (side, front, three-quarter and elevated views). Behind it, 23 m west, the 2 m porcelain Merlion cub (OSM node
// 6283080658) faces the other way from its tiled rock in a granite basin and dribbles into it.
//
// The statues are built as stacks of horizontal sections round an upright axis (lofts between rings, the ring at each
// height worked out from the measured profiles, every relief on them continuous in height and round the axis so that
// the surface stays smooth): the fish's body with rows of overlapping scales, the tail rising up its front to the raised
// fin under the chin and curling into the eye near its foot; the hood of the mane with its grooves and the rounded hems
// of its tiers, the face with brow, almond eye sockets (an eyeball in each), muzzle and the open mouth with the nozzle in
// it. See docs/merlion.md.
export const info = { name: 'Merlion', height: 8.6 };

const FACING = 75, CUB_FACING = 270; // compass bearings the Merlion and the cub face
const WATER = -2.2; // the bay (js/open-city-config.js waterLevel)
const DRUM_TOP = 0.35, DRUM_R = 3.85, DRUM_AT = 0.95; // the drum's top (just above the city's lawn), radius, centre ahead of the axis
const CUB_AT = [-22.57, 1.49]; // the cub's rock, metres east and north of the anchor (OSM node 6283080658)
const CUB_FOOT = 0.6, CUB_H = 2.0, CUB_WATER = 0.4; // its rock's top, its height, its basin's water
const NOZZLE = [1.36, 6.92]; // the Merlion's nozzle: metres ahead of the axis, above the drum
const JET = [7.72, 1.09]; // its jet: m/s out along the facing and up (lands ~13 m out, as on the aerial)
const HEM = 4.12; // the mane's lowest hem: under it the fish's body, over it the head

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const bell = (x, c, w) => { const t = (x - c) / w; return t * t < 1 ? (1 - t * t) ** 2 : 0; }; // a smooth bump, 1 at c, 0 beyond ±w
const mix = (a, b, t) => a + (b - a) * t;

/** A smooth curve through [[x, y], ...] (monotone cubic), level beyond its ends */
function curve(keys) {
  const n = keys.length, xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]);
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = ys.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
/** How far out along the ray at angle th (0 straight ahead) an egg reaches: aF ahead, aB behind, b to each side */
function egg(th, aF, aB, b, n) {
  const c = Math.cos(th), s = Math.sin(th), a = c >= 0 ? aF : aB;
  if (!(a > 0) || !(b > 0)) return 0;
  return 1 / Math.pow(Math.pow(Math.abs(c) / a, n) + Math.pow(Math.abs(s) / b, n), 1 / n);
}

// --- the Merlion's form: profiles in metres (u ahead of the axis, v to the side) at heights h above the drum, read off
// the photographs (docs/merlion.md); each part grows out of (or sinks into) the others at the ends of its range, so that
// nothing appears or vanishes between one section and the next --------------------------------------------------------
const BODY = { // the fish: deeper than wide; its front is the tail rising to the fin
  front: curve([[0.9, 1.25], [1.11, 1.33], [1.37, 1.5], [1.73, 1.55], [2.33, 1.55], [2.93, 1.5], [3.52, 1.32], [4.1, 1.2], [5.0, 1.12], [6.2, 1.1]]),
  back: curve([[0.9, 1.05], [1.11, 1.12], [1.4, 1.35], [1.8, 1.47], [2.4, 1.52], [3.0, 1.53], [4.1, 1.5], [5.0, 1.4], [6.2, 1.0]]),
  half: curve([[0.9, 0.7], [1.11, 0.74], [1.5, 0.83], [2.5, 0.86], [3.5, 0.85], [4.1, 0.82], [5.0, 0.78], [6.2, 0.72]])
};
const FIN = { // the tail's fin raised under the chin, flat and broad at its top like two hands together
  front: curve([[3.9, 1.18], [4.12, 1.48], [4.6, 1.72], [5.0, 1.86], [5.42, 1.95], [5.58, 1.92], [5.68, 1.8], [5.75, 1.5], [5.8, 1.08]]),
  half: curve([[3.9, 0.3], [4.6, 0.32], [5.1, 0.38], [5.45, 0.42], [5.62, 0.37], [5.75, 0.2], [5.8, 0.08]])
};
const MANE = { // the hood: ahead (at its sides, behind the cheeks), behind, half its width; closing over the crown
  front: curve([[HEM, 1.12], [4.6, 1.12], [5.2, 1.08], [5.8, 0.9], [6.3, 0.5], [6.8, 0.2], [7.7, 0.12], [8.1, 0.15], [8.39, 0.22], [8.5, 0.2], [8.56, 0.12], [8.6, 0.04]]),
  back: curve([[HEM, 1.8], [5.0, 1.8], [6.0, 1.8], [7.0, 1.82], [7.71, 1.82], [8.0, 1.72], [8.2, 1.55], [8.39, 1.27], [8.5, 0.95], [8.56, 0.62], [8.6, 0.2]]),
  half: curve([[HEM, 1.22], [4.8, 1.26], [5.5, 1.31], [6.2, 1.35], [7.0, 1.36], [7.7, 1.33], [8.0, 1.26], [8.2, 1.12], [8.39, 0.9], [8.5, 0.7], [8.56, 0.5], [8.6, 0.16]])
};
const FACE = { // the skull: brow, broad cheeks, forehead
  front: curve([[5.9, 1.05], [6.1, 1.1], [6.3, 1.12], [6.7, 1.14], [7.1, 1.18], [7.5, 1.18], [7.9, 1.14], [8.05, 1.02], [8.15, 0.9], [8.3, 0.7], [8.41, 0.5], [8.5, 0.32], [8.56, 0.16], [8.6, 0.05]]),
  half: curve([[5.9, 0.72], [6.3, 0.84], [6.7, 0.98], [7.1, 1.06], [7.5, 1.07], [7.9, 1.02], [8.1, 0.95], [8.3, 0.84], [8.45, 0.64], [8.56, 0.36], [8.6, 0.12]])
};
const MUZZLE = { // the upper jaw, whisker pads and nose, sinking into the brow at its root
  front: curve([[6.68, 1.36], [6.9, 1.42], [7.12, 1.52], [7.2, 1.58], [7.3, 1.63], [7.45, 1.69], [7.6, 1.73], [7.72, 1.7], [7.82, 1.62], [7.9, 1.45], [7.98, 1.15], [8.04, 0.95]]),
  half: curve([[6.68, 0.62], [7.12, 0.64], [7.3, 0.68], [7.5, 0.66], [7.65, 0.58], [7.78, 0.48], [7.9, 0.42], [7.98, 0.38], [8.04, 0.3]])
};
const JAW = { // the lower jaw and chin
  front: curve([[6.2, 1.1], [6.3, 1.3], [6.4, 1.36], [6.55, 1.4], [6.72, 1.39]]),
  half: curve([[6.2, 0.42], [6.3, 0.52], [6.45, 0.58], [6.72, 0.6]])
};
const TIERS = [[6.45, 8.25], [5.6, 6.45], [5.1, 5.6], [HEM, 5.1]]; // the mane's tiers: hem, top
const MOUTH = { lo: 6.68, hi: 7.16, mid: 6.92, half: 0.52, back: 0.62 }; // the open mouth: its heights, half-width (to its corners), back
const EYE = { th: 31 * DEG, h: 7.9, w: 0.2, hh: 0.1 }; // the eyes either side of the nose under the brow: an almond socket
const CURL = { u: 0.42, h: 2.49, r: 0.72, hole: [0.6, 2.41, 0.22] }; // the tail's curl on each flank, the eye through it

// The rows of scales (about 0.5 m across and 0.27 m a row on the Merlion, as in the side photographs: 2.5 to a radian of
// the body), every other row half a scale over: each scale a fan rising toward its scalloped lower edge, which rolls
// over in a lip `lip` m deep onto the scale under it. The uppermost scale reaching a point shows (the greatest of the
// rows near it), so the relief is continuous everywhere, creased only where scales meet. 0..depth
function scales(h, th, rowH, depth, lip = 0.05) {
  const top0 = 4.3, k0 = Math.floor((top0 - h) / rowH);
  let best = 0;
  for (let k = k0 - 1; k <= k0 + 1; k++) {
    const sx = th * 2.5 + (k & 1) * 0.5, x = sx - Math.floor(sx), round = Math.sin(Math.PI * x);
    const edge = rowH * (0.72 + 0.5 * round), down = top0 - k * rowH - h; // how far below the row's line
    if (down < -0.3 * rowH) continue;
    const dome = depth * (0.7 + 0.3 * round);
    const t = (down + 0.3 * rowH) / (edge + 0.3 * rowH);
    const v = down <= edge ? dome * (0.85 * smoothstep(0, 1, t) + 0.15 * smoothstep(0, 0.2, t)) : dome * (1 - smoothstep(edge, edge + lip, down));
    if (v > best) best = v;
  }
  return best;
}
// the body's surface relief where the ray at th meets it at (u, v): the scales, the tail's smooth band up the front, and
// on each flank the curl (a raised disc with a spiral and a rim), the bowl of its eye, and the ribbed fan of its fin
function bodyRelief(h, th, u, v, rowH) {
  const av = Math.abs(v);
  let r = scales(h, th, rowH, 0.06);
  // the band up the front, a groove along each side of it
  const band = smoothstep(1.45, 1.65, h) * (1 - smoothstep(HEM + 0.05, HEM + 0.3, h)) * smoothstep(0, 0.2, u);
  r = mix(r, 0.035 * (1 - smoothstep(0.24, 0.31, av)) - 0.025 * bell(av, 0.34, 0.05), band * (1 - smoothstep(0.32, 0.42, av)));
  const side = smoothstep(0.25, 0.45, av) * (1 - smoothstep(HEM - 0.1, HEM + 0.1, h));
  if (side > 0) {
    const d = Math.hypot(u - CURL.u, h - CURL.h), rho = d / CURL.r, phi = Math.atan2(h - CURL.h, u - CURL.u);
    const [hu, hh, hr] = CURL.hole, dh = Math.hypot(u - hu, h - hh);
    const spiral = 0.5 + 0.5 * Math.cos(TAU * (rho * 2.2 - phi / TAU)); // continuous through the angle's wrap
    const eye = -0.32 * (1 - smoothstep(0.55 * hr, hr, dh)) + 0.035 * bell(dh, hr + 0.04, 0.06); // the bowl and its rim
    const disc = 0.06 + 0.05 * bell(rho, 0.94, 0.1) - 0.05 * spiral ** 4 * smoothstep(0.35, 0.5, rho) + eye;
    const fanArc = phi / DEG, fan = 0.04 - 0.035 * (0.5 + 0.5 * Math.cos(TAU * fanArc / 8)) ** 3;
    const inDisc = (1 - smoothstep(0.92, 1.04, rho)) * side;
    const inFan = smoothstep(14, 24, fanArc) * (1 - smoothstep(76, 86, fanArc)) * smoothstep(0.95, 1.06, rho) * (1 - smoothstep(1.55, 1.75, rho)) * smoothstep(0.05, 0.2, u) * side;
    r = mix(mix(r, fan, inFan), disc, inDisc);
  }
  return r;
}
// how far the mane's flap juts out at h along the ray at |th| = at: most just over a tier's hem (the edge rolling under
// in a quarter round 5 cm high), nothing at its top; the upper tiers step down the back of the hood only, the lowest
// (the cape) all round from the lappets by the chest
function flare(h, at) {
  for (const [hem, top] of TIERS) {
    if (h < hem - 1e-9 || h >= top) continue;
    const reach = hem === HEM ? smoothstep(35 * DEG, 60 * DEG, at) : 0.8 * smoothstep(122 * DEG, 144 * DEG, at);
    const t = clamp01((h - hem) / 0.05), lip = Math.sqrt(t * (2 - t));
    return 0.13 * reach * lip * Math.pow(1 - (h - hem) / (top - hem), 1.6);
  }
  return 0;
}

/**
 * The Merlion's section at height h (above the drum) along the rays `angles`: how far out each ray meets it, and
 * whether it is dark there (within the open mouth, at the nostrils). `mane: false` leaves the hood off (the body's
 * last section, under the hem)
 */
function form(h, angles, { rowH = 0.27, gape = 1, mane = true } = {}) {
  const N = angles.length, r = new Array(N).fill(0), dark = new Array(N).fill(0);
  const bF = BODY.front(h), bB = BODY.back(h), bW = BODY.half(h);
  const finOn = h >= 3.9 && h <= 5.8, fF = FIN.front(h), fW = FIN.half(h);
  const maneOn = mane && h >= HEM - 1e-9, mF = MANE.front(h), mB = MANE.back(h), mW = MANE.half(h);
  const faceOn = h >= 5.9, sF = FACE.front(h), sW = FACE.half(h);
  const muzOn = h >= 6.68 && h <= 8.04, jawOn = h >= 6.2 && h <= 6.72;
  const mouth = h > MOUTH.lo && h < MOUTH.hi ? gape * MOUTH.half * Math.cbrt(Math.max(0, 1 - Math.abs((h - MOUTH.mid) / ((MOUTH.hi - MOUTH.lo) / 2)) ** 3)) : 0;
  const chest = 1 - smoothstep(6.05, 6.35, h); // how far the hood stays open over the chest
  for (let k = 0; k < N; k++) {
    const th = angles[k], c = Math.cos(th), s = Math.sin(th), at = Math.abs(th);
    let out = 0, dk = 0;
    // the fish (the scales hidden under the mane do no harm)
    if (h <= 6.2) {
      const rb = egg(th, bF, bB, bW, 2.2);
      out = rb + bodyRelief(h, th, rb * c, rb * s, rowH);
    }
    if (finOn) {
      let rf = egg(th, fF, 0.3, fW, 2.4);
      rf -= 0.05 * bell(rf * s, 0, 0.09) * smoothstep(4.5, 4.75, h); // the crease between its two lobes
      out = Math.max(out, rf);
    }
    if (maneOn) {
      let rm = egg(th, mF, mB, mW, 2.7);
      // open over the chest between the lappets: cut back to 0.8 m ahead, eased in across the lappets' inner edges
      if (c > 0) rm = mix(rm, Math.min(rm, 0.8 / c), chest * (1 - smoothstep(0.5, 0.68, Math.abs(rm * s))));
      rm += flare(h, at);
      // the broad grooves down the hood, 20° apart, a deeper one down the middle of its back
      rm -= smoothstep(55 * DEG, 70 * DEG, at) * (0.04 * (0.5 + 0.5 * Math.cos(TAU * at / (20 * DEG))) ** 3 + 0.03 * bell(at, Math.PI, 8 * DEG));
      out = Math.max(out, rm);
    }
    if (faceOn) {
      let rs = egg(th, sF, 0.9, sW, 2.3), fd = 0;
      if (muzOn) {
        // the muzzle: square-cut whisker pads, the broad nose on top with its nostrils
        let rz = egg(th, MUZZLE.front(h), 0.3, MUZZLE.half(h), 3.4);
        rz += 0.05 * bell(h, 7.7, 0.14) * (1 - smoothstep(0, 16 * DEG, at));
        if (rz > rs) { rs = rz; if (h > 7.59 && h < 7.63 && at > 4 * DEG && at < 12 * DEG) fd = 1; }
      }
      if (jawOn) rs = Math.max(rs, egg(th, JAW.front(h), 0.3, JAW.half(h), 3));
      // the brow, a ridge over the eyes and across the nose's root
      rs += 0.1 * bell(h, 8.08, 0.12) * smoothstep(58 * DEG, 44 * DEG, at);
      // the eyes' almond sockets under it (an eyeball sits in each), their lids a little raised round them
      const ex = (at - EYE.th) * 1.08 / EYE.w, ey = (h - EYE.h) / (EYE.hh * (1 - 0.35 * Math.min(1, ex * ex)));
      const q = ex * ex + ey * ey;
      rs += -0.085 * (1 - smoothstep(0.3, 1, q)) + 0.02 * bell(q, 1.1, 0.35);
      if (rs > out) { out = rs; dk = fd; }
    }
    // the open mouth: everything ahead of its throat cut away between its corners, so the jaws gape seen from the
    // side too (its teeth are built on the jaws)
    if (mouth > 0 && c > MOUTH.back / Math.hypot(MOUTH.back, mouth) && out * c > MOUTH.back) { out = MOUTH.back / c; dk = 1; }
    r[k] = Math.max(0.02, out);
    dark[k] = dk;
  }
  return { r, dark };
}

// rays round the axis, `a` of them drawn toward the front (the face) from behind
const rays = (N, a) => Array.from({ length: N }, (_, k) => { const t = -1 + (2 * k) / N; return Math.PI * ((1 - a) * t + a * t * t * t); });
// heights through `breaks`, filled in no further apart than step(h), and no two closer than gap0 (sections' tops
// within 1 cm of each other would count as flickering)
function heights(breaks, step, gap0 = 0.015) {
  const hs = [];
  for (const h of [...breaks].sort((a, b) => a - b)) if (!hs.length || h - hs.at(-1) >= gap0) hs.push(h);
  const out = [hs[0]];
  for (let i = 1; i < hs.length; i++) {
    const gap = hs[i] - hs[i - 1], n = Math.ceil(gap / step(hs[i - 1]) - 1e-9);
    for (let j = 1; j <= n; j++) out.push(hs[i - 1] + (gap * j) / n);
  }
  return out;
}
// where the sections fall: the body every 6.5 cm (5 cm across the curl's eye); the head every 9 cm up the hood and the
// fin, 5 cm through the face, with breaks at the hems (and the rounds of their edges), the fin's top, the chin, the
// lips, the nostrils, the eyes and the brow
const BODY_BREAKS = [0.9, 1.11, 2.1, 2.75, HEM];
const bodyStep = (h) => (h >= 2.1 && h < 2.75 ? 0.05 : 0.065);
const HEAD_BREAKS = [HEM, HEM + 0.02, HEM + 0.05, 5.1, 5.12, 5.15, 5.6, 5.62, 5.65, 5.8, 5.9, 6.2, 6.3, 6.45, 6.47, 6.5, MOUTH.lo, 6.697, 6.76,
  6.84, NOZZLE[1], 7.0, 7.08, 7.143, MOUTH.hi, 7.25, 7.35, 7.45, 7.57, 7.61, 7.65, 7.72, 7.8, 7.85, 7.9, 7.95, 8.0, 8.06, 8.12, 8.2, 8.3, 8.39,
  8.48, 8.55, 8.6];
const headStep = (h) => (h < 6.1 ? 0.09 : 0.05);

export function build(kit) {
  const M = {
    white: kit.material(0xe9e8e2, { roughness: 0.62 }),
    dark: kit.material(0x3a2a27, { roughness: 0.85 }), // the mouth's shadow, the irises (dark reddish brown), nostrils
    blue: kit.material(0x24479a, { roughness: 0.35, metalness: 0.08 }),
    sky: kit.material(0x5d93d0, { roughness: 0.35, metalness: 0.08 }),
    tile: kit.material(0xdbe6ee, { roughness: 0.35, metalness: 0.06 }),
    granite: kit.material(0xa39b8d, { roughness: 0.92 }),
    pale: kit.material(0xcdc8bd, { roughness: 0.85 }),
    wet: kit.material(0x5e5f55, { roughness: 0.95 }),
    basin: kit.material(0x4a4c4e, { roughness: 0.5 }),
    water: kit.glassMaterial(0x3d575c)
  };
  const E = kit.compass(90), N = kit.compass(0);
  // a frame round a statue: (u ahead, v to its right) about its axis at `o` -> [x, z] about the anchor
  const frame = (o, deg) => {
    const U = kit.compass(deg), V = kit.compass(deg + 90);
    const at = (u, v) => [o[0] + u * U[0] + v * V[0], o[1] + u * U[1] + v * V[1]];
    return { U, V, at, ring: (pts) => pts.map(([u, v]) => at(u, v)), toLocal: (x, z) => [(x - o[0]) * U[0] + (z - o[1]) * U[1], (x - o[0]) * V[0] + (z - o[1]) * V[1]] };
  };
  const ovalRing = (aF, aB, b, n, count) => Array.from({ length: count }, (_, k) => { const th = (k / count) * TAU - Math.PI; const r = egg(th, aF, aB, b, n); return [r * Math.cos(th), r * Math.sin(th)]; });

  /**
   * A statue from its sections: `levels` [[y, h], ...] (where each section stands, and the height of the form it takes
   * there), each ring scaled by (uS, vS): the body's lofts on `bodyN` rays up to the hem, the head's on `headN` (more,
   * for the face) from the hem; the mouth and nostrils dark. -> the heights of each run's sections
   */
  const sculpt = (F, levels, { bodyN, headN, uS = 1, vS = 1, rowH, gape, prefix }) => {
    const runs = { body: [], head: [] };
    for (const [part, n, a, lv] of [['body', bodyN, 0.1, levels.filter(([, h]) => h <= HEM + 1e-9)], ['head', headN, 0.25, levels.filter(([, h]) => h >= HEM - 1e-9)]]) {
      const angles = rays(n, a);
      const rings = lv.map(([y, h]) => { const { r, dark } = form(h, angles, { rowH, gape, mane: part === 'head' }); return { y, h, dark, ring: F.ring(r.map((rr, k) => [rr * Math.cos(angles[k]) * uS, rr * Math.sin(angles[k]) * vS])) }; });
      for (let i = 0; i + 1 < rings.length; i++) {
        const a0 = rings[i], b = rings[i + 1];
        const shade = (k) => { const j = (k + 1) % n; return (a0.dark[k] && a0.dark[j]) || (b.dark[k] && b.dark[j]) ? M.dark : M.white; };
        // the caps that meet the mouth's floor and palate at the lips dark too, so that they cannot show through them
        const gaping = (q) => q && q.h > MOUTH.lo && q.h < MOUTH.hi;
        const roof = !gaping(a0) && gaping(rings[i - 1]), floor = !gaping(b) && gaping(rings[i + 2]);
        kit.loft({ ring: a0.ring, topRing: b.ring, y0: a0.y, y1: b.y, material: roof ? M.dark : M.white, edgeMaterial: shade, top: floor ? M.dark : M.white, name: `${prefix}-${part}-${i}` });
      }
      runs[part] = rings.map((q) => q.y);
    }
    return runs;
  };

  /**
   * A ball (an eyeball, the dark ball at the bottom of the curl's eye) about (u, v) at height yc, R across and Ry high, in
   * the frame F scaled by (uS, vS): lofts between rings set between the host run's sections (`host`), so that no two tops
   * share a height; its face toward `gaze` (an angle in the frame) painted `iris` within ±`spread`
   */
  const ball = (F, { u, v, yc, R, Ry, uS = 1, vS = 1, host, material, iris = null, gaze = 0, spread = 0, name }) => {
    const lo = yc - 0.94 * Ry, hi = yc + 0.94 * Ry, mids = host.slice(1).map((y, i) => (y + host[i]) / 2);
    let levels = [lo, ...mids.filter((y) => y > lo + 0.012 && y < hi - 0.012), hi].filter((y) => host.every((h) => Math.abs(h - y) > 0.012));
    // a ball smaller than the sections are apart: between the two midpoints nearest its middle
    if (levels.length < 2) levels = [...mids].sort((a, b) => Math.abs(a - yc) - Math.abs(b - yc)).slice(0, 2).sort((a, b) => a - b);
    const ringAt = (y) => { const rr = R * Math.sqrt(Math.max(0.0025, 1 - ((y - yc) / Ry) ** 2)); return F.ring(Array.from({ length: 14 }, (_, k) => { const p = (k / 14) * TAU; return [(u + rr * Math.cos(p)) * uS, (v + rr * Math.sin(p)) * vS]; })); };
    for (let i = 0; i + 1 < levels.length; i++) {
      const y0 = levels[i], y1 = levels[i + 1], mid = Math.abs((y0 + y1) / 2 - yc) < 0.6 * Ry;
      const paint = iris && mid ? (k) => { const p = ((k + 0.5) / 14) * TAU, d = Math.atan2(Math.sin(p - gaze), Math.cos(p - gaze)); return Math.abs(d) < spread ? iris : null; } : undefined;
      kit.loft({ ring: ringAt(y0), topRing: ringAt(y1), y0, y1, material, edgeMaterial: paint, top: material, name: `${name}-${i}` });
    }
  };
  // the eyes of a statue: an eyeball in each almond socket, its front just inside the lids; `scale` (uS, vS) and `yAt`
  // (the height in the frame of a Merlion's height) place them on the cub as on the Merlion
  const eyes = (F, prefix, host, { uS = 1, vS = 1, yAt, ry = 1, iris = M.dark, material = M.white }) => {
    const rf = egg(EYE.th, FACE.front(EYE.h), 0.9, FACE.half(EYE.h), 2.3) - 0.12;
    for (const side of [-1, 1]) {
      ball(F, { u: rf * Math.cos(EYE.th), v: side * rf * Math.sin(EYE.th), yc: yAt(EYE.h), R: 0.11, Ry: 0.11 * ry, uS, vS, host, material, iris, gaze: side * (EYE.th - 8 * DEG), spread: 40 * DEG, name: `${prefix}-head-eye-${side < 0 ? 'left' : 'right'}` });
    }
  };
  // the dark ball at the bottom of each curl's eye, showing as a round dark hole within its rim
  const curlEyes = (F, prefix, host, { uS = 1, vS = 1, yAt, ry = 1 }) => {
    const [hu, hh] = CURL.hole, th = Math.atan2(0.81, hu), r0 = Math.hypot(hu, 0.81) + 0.06 - 0.32 + 0.11 - 0.24;
    for (const side of [-1, 1]) ball(F, { u: r0 * Math.cos(th), v: side * r0 * Math.sin(th), yc: yAt(hh), R: 0.24, Ry: 0.24 * ry, uS, vS, host, material: M.dark, name: `${prefix}-body-curl-eye-${side < 0 ? 'left' : 'right'}` });
  };
  // its ears, pricked up at the top corners of the face, their feet in the hood
  const ears = (F, y0, y1, uS, vS, prefix) => {
    for (const side of [-1, 1]) {
      const shape = [[-0.2, -0.05], [-0.1, -0.09], [0.12, -0.09], [0.22, -0.04], [0.2, 0.06], [0.08, 0.1], [-0.12, 0.1], [-0.21, 0.05]];
      const base = shape.map(([u, v]) => [(0.06 + u) * uS, side * (0.76 + v) * vS]);
      const tip = shape.map(([u, v]) => [(0.04 + u * 0.22) * uS, side * (0.8 + v * 0.3) * vS]);
      kit.loft({ ring: F.ring(base), topRing: F.ring(tip), y0, y1, material: M.white, top: M.white, name: `${prefix}-head-ear-${side < 0 ? 'left' : 'right'}` });
    }
  };

  // --- the Merlion ------------------------------------------------------------------------------------------------------
  const MF = frame([0, 0], FACING);
  // the granite drum out of the bay: a wet course at the water, three courses of blocks, the coping the waves stand on
  const drumAt = MF.at(DRUM_AT, 0);
  kit.cylinder({ x: drumAt[0], z: drumAt[1], y0: WATER, y1: -1.45, r: DRUM_R, segments: 48, material: M.wet, top: M.wet, name: 'merlion-drum' });
  for (let i = 0; i < 3; i++) {
    const y0 = -1.45 + i * 0.55;
    kit.cylinder({ x: drumAt[0], z: drumAt[1], y0, y1: y0 + 0.03, r: DRUM_R - 0.03, segments: 48, material: M.granite, top: M.granite, name: `merlion-drum-joint-${i}` });
    kit.cylinder({ x: drumAt[0], z: drumAt[1], y0: y0 + 0.03, y1: y0 + 0.55, r: DRUM_R, segments: 48, material: M.granite, top: M.granite, name: `merlion-drum-course-${i}` });
  }
  kit.cylinder({ x: drumAt[0], z: drumAt[1], y0: 0.2, y1: DRUM_TOP, r: DRUM_R + 0.07, segments: 48, material: M.pale, top: M.pale, name: 'merlion-drum-coping' });
  kit.collisionPrism({ ring: ovalRing(DRUM_R, DRUM_R, DRUM_R, 2, 24).map(([u, v]) => MF.at(u + DRUM_AT, v)), y0: WATER, y1: DRUM_TOP });

  // the waves it rises from: bands of blue and white tiles running its length, each narrower and higher than the one
  // under it, swelling behind it and cresting ahead of it, and a row of tiled balls along their front
  const crest = curve([[-2.9, 0.8], [-1.8, 1.2], [-0.9, 1.15], [0, 1.22], [1.0, 1.3], [1.8, 1.5], [2.5, 1.72], [3.0, 1.38], [3.35, 0.5]]);
  const bands = [M.blue, M.tile, M.sky, M.blue, M.tile, M.sky, M.blue];
  bands.forEach((material, k) => {
    const aF = 3.35 - 0.06 * k, aB = 2.85 - 0.08 * k, b = 1.95 - 0.15 * k, rise = Math.pow((k + 1) / bands.length, 0.8);
    kit.loft({ ring: MF.ring(ovalRing(aF, aB, b, 3, 52)), topRing: MF.ring(ovalRing(aF - 0.06, aB - 0.06, b - 0.06, 3, 52)), y0: DRUM_TOP,
      y1: (x, z) => DRUM_TOP + 0.15 + rise * (crest(MF.toLocal(x, z)[0]) - 0.15), material, top: material, name: `merlion-wave-${k}` });
  });
  for (let i = 0; i < 9; i++) {
    const th = (-64 + 16 * i) * DEG, rr = egg(th, 3.35, 2.85, 1.95, 3) + 0.14;
    const [x, z] = MF.at(rr * Math.cos(th), rr * Math.sin(th)), material = i % 2 ? M.tile : M.sky;
    const bead = (r) => ovalRing(r, r, r, 2, 12).map(([u, v]) => [x + u, z + v]);
    kit.loft({ ring: bead(0.1), topRing: bead(0.2), y0: DRUM_TOP, y1: DRUM_TOP + 0.12, material, top: material, name: `merlion-wave-ball-${i}` });
    kit.loft({ ring: bead(0.2), topRing: bead(0.17), y0: DRUM_TOP + 0.12, y1: DRUM_TOP + 0.24, material, top: material, name: `merlion-wave-ball-${i}-mid` });
    kit.loft({ ring: bead(0.17), topRing: bead(0.05), y0: DRUM_TOP + 0.24, y1: DRUM_TOP + 0.38, material, top: material, name: `merlion-wave-ball-${i}-top` });
  }

  // the statue: its sections from inside the waves to the crown, its eyes, the eyes of its curls, its ears and teeth
  const bigLevels = [...heights(BODY_BREAKS, bodyStep), ...heights(HEAD_BREAKS, headStep).slice(1)].map((h) => [DRUM_TOP + h, h]);
  const big = sculpt(MF, bigLevels, { bodyN: 72, headN: 80, rowH: 0.27, prefix: 'merlion' });
  const bigY = (h) => DRUM_TOP + h;
  eyes(MF, 'merlion', big.head, { yAt: bigY });
  curlEyes(MF, 'merlion', big.body, { yAt: bigY });
  ears(MF, DRUM_TOP + 8.2, DRUM_TOP + 8.6, 1, 1, 'merlion');
  const tooth = (u, v, root, tip, w, name) => {
    const ring = (s) => MF.ring([[u - w * s, v - w * 0.8 * s], [u + w * s, v - w * 0.8 * s], [u + w * s, v + w * 0.8 * s], [u - w * s, v + w * 0.8 * s]]);
    const [y0, y1, r0, r1] = tip < root ? [tip, root, 0.15, 1] : [root, tip, 1, 0.15];
    kit.loft({ ring: ring(r0), topRing: ring(r1), y0: DRUM_TOP + y0, y1: DRUM_TOP + y1, material: M.white, top: M.white, name: `merlion-head-tooth-${name}` });
  };
  for (const side of [-1, 1]) {
    tooth(1.36, side * 0.33, 7.22, 6.98, 0.06, `fang-upper-${side}`);
    tooth(1.24, side * 0.35, 6.62, 6.84, 0.055, `fang-lower-${side}`);
    tooth(1.48, side * 0.12, 7.22, 7.1, 0.045, `upper-${side}`);
  }
  // the nozzle in its mouth, and the jet from it out over the bay
  const ny = DRUM_TOP + NOZZLE[1], throat = MF.at(MOUTH.back - 0.02, 0), mouth = MF.at(NOZZLE[0], 0);
  kit.beam({ from: [throat[0], ny, throat[1]], to: [mouth[0], ny, mouth[1]], w: 0.17, h: 0.17, material: M.pale, name: 'merlion-nozzle' });
  kit.jet({ from: [mouth[0], ny, mouth[1]], velocity: [MF.U[0] * JET[0], JET[1], MF.U[1] * JET[0]], floor: WATER, width: 0.3, name: 'merlion-jet' });
  // solid to walk into: the body, and the head over it
  kit.collisionPrism({ ring: MF.ring(ovalRing(1.5, 1.45, 0.85, 2.2, 20)), y0: DRUM_TOP, y1: DRUM_TOP + HEM });
  kit.collisionPrism({ ring: MF.ring(ovalRing(1.7, 1.85, 1.3, 2.4, 20)), y0: DRUM_TOP + HEM, y1: DRUM_TOP + 8.6 });

  // --- the cub ------------------------------------------------------------------------------------------------------------
  const cubAt = [CUB_AT[0] * E[0] + CUB_AT[1] * N[0], CUB_AT[0] * E[1] + CUB_AT[1] * N[1]];
  const CF = frame(cubAt, CUB_FACING);
  // its granite basin (a rim round the water, a curb round the rim; each a ring cut through at the back by a hair-line
  // slit, so that it can be one prism) and the tiled rock in it
  const annulus = (outer, inner) => [...outer, ...[...inner].reverse()];
  const loop = (aF, b, count) => Array.from({ length: count + 1 }, (_, k) => { const th = Math.PI + 0.002 + (k / count) * (TAU - 0.004); const r = egg(th, aF, aF, b, 2.6); return [r * Math.cos(th), r * Math.sin(th)]; });
  kit.prism({ ring: CF.ring(annulus(loop(1.75, 2.05, 56), loop(1.45, 1.75, 56))), y0: 0, y1: 0.32, material: M.pale, top: M.pale, name: 'cub-basin-curb' });
  kit.prism({ ring: CF.ring(annulus(loop(1.45, 1.75, 56), loop(1.25, 1.55, 56))), y0: 0, y1: 0.45, material: M.basin, top: M.basin, name: 'cub-basin-rim' });
  kit.prism({ ring: CF.ring(ovalRing(1.23, 1.23, 1.53, 2.6, 48)), y0: 0, y1: CUB_WATER, material: M.water, top: M.water, name: 'cub-basin-water' });
  const rock = (a, b) => [[a, -0.6 * b], [0.6 * a, -b], [-0.6 * a, -b], [-a, -0.6 * b], [-a, 0.6 * b], [-0.6 * a, b], [0.6 * a, b], [a, 0.6 * b]];
  kit.loft({ ring: CF.ring(rock(0.5, 0.55)), topRing: CF.ring(rock(0.46, 0.45)), y0: 0, y1: CUB_FOOT, material: M.blue, top: M.blue, name: 'cub-base' });
  // the cub: the Merlion's form, 2 m tall on its rock, its face set lower under a taller crown (as its photographs
  // show), at 0.315 of the Merlion's depth and 0.26 of its width; its sections where the Merlion's fall on it
  const toBig = (hc) => 1.11 + 7.49 * piecewise(hc / CUB_H);
  const cubLevels = heights([...BODY_BREAKS, ...HEAD_BREAKS].map(fromBig).filter((h) => h >= 0), (h) => (h < fromBig(HEM) ? 0.04 : 0.05), 0.011).map((hc) => [CUB_FOOT + hc, toBig(hc)]);
  const cubY = (h) => CUB_FOOT + fromBig(h);
  const cub = sculpt(CF, cubLevels, { bodyN: 30, headN: 40, uS: 0.315, vS: 0.26, rowH: 0.36, gape: 0.6, prefix: 'cub' });
  eyes(CF, 'cub', cub.head, { uS: 0.315, vS: 0.26, yAt: cubY, ry: 0.5, iris: null, material: M.blue }); // its eyes dark blue glass
  curlEyes(CF, 'cub', cub.body, { uS: 0.315, vS: 0.26, yAt: cubY, ry: 0.27 });
  ears(CF, CUB_FOOT + fromBig(8.25), CUB_FOOT + CUB_H, 0.315, 0.26, 'cub');
  const cy = CUB_FOOT + fromBig(NOZZLE[1]);
  const cubMouth = CF.at(NOZZLE[0] * 0.315, 0), cubBack = CF.at(MOUTH.back * 0.315 - 0.01, 0);
  kit.beam({ from: [cubBack[0], cy, cubBack[1]], to: [cubMouth[0], cy, cubMouth[1]], w: 0.045, h: 0.045, material: M.pale, name: 'cub-nozzle' });
  kit.jet({ from: [cubMouth[0], cy, cubMouth[1]], velocity: [CF.U[0] * 0.95, -0.5, CF.U[1] * 0.95], floor: CUB_WATER, width: 0.07, name: 'cub-jet' });
  kit.collisionPrism({ ring: CF.ring(ovalRing(0.45, 0.45, 0.3, 2, 12)), y0: CUB_FOOT, y1: CUB_FOOT + CUB_H });
}

// the cub's heights against the Merlion's, as fractions of each figure above its foot: the hems alike (0.41, 0.40), the
// chin, nose and eyes lower on the cub (0.66, 0.77 against 0.69, 0.87)
const CUB_MAP = [[0, 0], [0.41, 0.402], [0.66, 0.69], [0.77, 0.866], [1, 1]];
function piecewise(f) {
  for (let i = 1; i < CUB_MAP.length; i++) if (f <= CUB_MAP[i][0]) { const [a0, b0] = CUB_MAP[i - 1], [a1, b1] = CUB_MAP[i]; return b0 + (b1 - b0) * (f - a0) / (a1 - a0); }
  return 1;
}
function fromBig(h) {
  const f = (h - 1.11) / 7.49;
  for (let i = 1; i < CUB_MAP.length; i++) if (f <= CUB_MAP[i][1]) { const [a0, b0] = CUB_MAP[i - 1], [a1, b1] = CUB_MAP[i]; return CUB_H * (a0 + (a1 - a0) * (f - b0) / (b1 - b0)); }
  return CUB_H;
}
