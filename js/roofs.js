// js/roofs.js
// The pitched roofs a city built from OpenStreetMap raises over its extruded footprints (js/open-city-buildings.js):
// OSM roof:shape values to the five kinds built here, packed with the roof's height and orientation into one integer
// of the geodata (tools/city/build.mjs: `roof` per building), and the roof itself over the building's turned box.
// Plain arithmetic, no three.js, so the build tool and the tests share it.

const ROOF_SHAPES = { flat: 0, gabled: 1, hipped: 2, pyramidal: 3, skillion: 4 };

// OSM's roof:shape values (and the common variants) to the kind built: anything with a ridge and hips becomes
// hipped, anything that meets at a point pyramidal, the rest flat
const SHAPE_OF = {
  gabled: ROOF_SHAPES.gabled, saltbox: ROOF_SHAPES.gabled,
  hipped: ROOF_SHAPES.hipped, equal_hipped: ROOF_SHAPES.hipped, side_hipped: ROOF_SHAPES.hipped, 'half-hipped': ROOF_SHAPES.hipped,
  half_hipped: ROOF_SHAPES.hipped, 'round hipped': ROOF_SHAPES.hipped, round_hipped: ROOF_SHAPES.hipped, mansard: ROOF_SHAPES.hipped,
  round: ROOF_SHAPES.hipped, gambrel: ROOF_SHAPES.hipped,
  pyramidal: ROOF_SHAPES.pyramidal, dome: ROOF_SHAPES.pyramidal, onion: ROOF_SHAPES.pyramidal, cone: ROOF_SHAPES.pyramidal,
  skillion: ROOF_SHAPES.skillion
};
/** The kind of roof an OSM roof:shape value stands for (ROOF_SHAPES; flat for none or anything else) */
function roofShapeCode(value) {
  return (value && SHAPE_OF[String(value).trim().toLowerCase()]) || ROOF_SHAPES.flat;
}

/** One integer for the geodata: the shape (3 bits), whether the ridge runs across the long side (1), whether the roof
 *  is within the building's mapped height (1: a tagged height is the whole building, roof included), and its height
 *  in dm (0: unknown, roofHeightFor decides) */
function packRoof({ shape = 0, across = false, included = false, heightDm = 0 } = {}) {
  return (shape & 7) | (across ? 8 : 0) | (included ? 16 : 0) | (Math.max(0, Math.round(heightDm)) << 5);
}
function unpackRoof(v) {
  v = v | 0;
  return { shape: v & 7, across: !!(v & 8), included: !!(v & 16), heightDm: v >>> 5 };
}

/** A roof's height (m) when OSM gives none, from the building's short side: a third of it, between 1.2 and 6 m; a
 *  skillion a quarter, between 0.8 and 4 m */
function roofHeightFor(shape, shortSide) {
  if (shape === ROOF_SHAPES.flat) return 0;
  if (shape === ROOF_SHAPES.skillion) return Math.min(4, Math.max(0.8, shortSide / 4));
  return Math.min(6, Math.max(1.2, shortSide / 3));
}

/**
 * Where a building's roof of `shape` goes: { eave, ridge, wallTop } (m), or null for none. Within a mapped height
 * (`included`: a tagged height is the whole building) the ridge is the top and the walls stop at the eave; over
 * storeys the roof sits on top. Its height is the mapped one (dm), else a share of the short side (roofHeightFor); a
 * mapped height that is most of the building was tagged as its whole height and is replaced; a `heuristic` roof (one
 * the city adds without a mapped shape) is never more than half the building. None on a building under 2.8 m, and
 * the walls keep at least 2.5 m under the eave.
 */
function roofPlacement({ shape, included = false, heightDm = 0, top, bottom = 0, shortSide = 0, heuristic = false }) {
  if (!shape || shape === ROOF_SHAPES.flat) return null;
  const h = top - bottom;
  if (!(h >= 2.8)) return null;
  let rh = heightDm > 0 ? heightDm / 10 : roofHeightFor(shape, shortSide);
  if (heightDm > 0 && rh >= h - 2.5) rh = roofHeightFor(shape, shortSide);
  if (heuristic) rh = Math.min(rh, h / 2);
  const ridge = included ? top : top + rh;
  const eave = Math.max(bottom + 2.5, ridge - rh);
  if (ridge - eave < 0.3) return null;
  return { eave, ridge, wallTop: included ? eave : top };
}

/**
 * The roof over a building's turned box `{ cx, cz, hx, hz, ux, uz }` (half sizes hx along (ux, uz), hz across; as
 * js/open-city-buildings.js orientedBox gives it), from its `eave` height up to its `ridge`. The ridge runs along the
 * longer side unless `across`. Returns { positions: [x, y, z, ... three per vertex, triangles], ends: [per triangle,
 * true on the vertical faces (gable ends, a skillion's sides and high wall)] }, every triangle wound counter-clockwise
 * seen from outside; null for a flat roof.
 */
function pitchedRoof({ shape, box, eave, ridge, across = false }) {
  if (!shape || shape === ROOF_SHAPES.flat) return null;
  const { cx, cz, ux, uz } = box;
  // the ridge axis A (half-length L) and the axis across it B (half-width W): the box's own, or turned a quarter
  const along = (box.hx >= box.hz) !== !!across;
  const A = along ? [ux, uz] : [-uz, ux];
  const B = along ? [-uz, ux] : [-ux, -uz];
  const L = along ? box.hx : box.hz;
  const W = along ? box.hz : box.hx;
  const P = (a, b, y) => [cx + a * A[0] + b * B[0], y, cz + a * A[1] + b * B[1]];
  const e = eave, r = ridge;
  const faces = []; // [polygon of [x, y, z], vertical]
  if (shape === ROOF_SHAPES.gabled) {
    faces.push([[P(-L, -W, e), P(L, -W, e), P(L, 0, r), P(-L, 0, r)], false]);
    faces.push([[P(-L, W, e), P(L, W, e), P(L, 0, r), P(-L, 0, r)], false]);
    faces.push([[P(L, -W, e), P(L, W, e), P(L, 0, r)], true]);
    faces.push([[P(-L, -W, e), P(-L, W, e), P(-L, 0, r)], true]);
  } else if (shape === ROOF_SHAPES.hipped || shape === ROOF_SHAPES.pyramidal) {
    const s = shape === ROOF_SHAPES.pyramidal ? 0 : Math.max(0, L - W); // the ridge's half-length
    if (s > 1e-6) {
      faces.push([[P(-L, -W, e), P(L, -W, e), P(s, 0, r), P(-s, 0, r)], false]);
      faces.push([[P(-L, W, e), P(L, W, e), P(s, 0, r), P(-s, 0, r)], false]);
      faces.push([[P(L, -W, e), P(L, W, e), P(s, 0, r)], false]);
      faces.push([[P(-L, -W, e), P(-L, W, e), P(-s, 0, r)], false]);
    } else {
      const apex = P(0, 0, r);
      faces.push([[P(-L, -W, e), P(L, -W, e), apex], false]);
      faces.push([[P(L, -W, e), P(L, W, e), apex], false]);
      faces.push([[P(L, W, e), P(-L, W, e), apex], false]);
      faces.push([[P(-L, W, e), P(-L, -W, e), apex], false]);
    }
  } else if (shape === ROOF_SHAPES.skillion) {
    // the high side at +W
    faces.push([[P(-L, -W, e), P(L, -W, e), P(L, W, r), P(-L, W, r)], false]);
    faces.push([[P(L, -W, e), P(L, W, e), P(L, W, r)], true]);
    faces.push([[P(-L, -W, e), P(-L, W, e), P(-L, W, r)], true]);
    faces.push([[P(-L, W, e), P(L, W, e), P(L, W, r), P(-L, W, r)], true]);
  } else {
    return null;
  }
  // fans, each triangle turned to wind counter-clockwise seen from outside (its normal away from the heart of the
  // building under the eaves)
  const heart = [cx, e - 0.5, cz];
  const positions = [];
  const ends = [];
  for (const [poly, vertical] of faces) {
    for (let k = 1; k + 1 < poly.length; k++) {
      let [p0, p1, p2] = [poly[0], poly[k], poly[k + 1]];
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const mx = (p0[0] + p1[0] + p2[0]) / 3 - heart[0], my = (p0[1] + p1[1] + p2[1]) / 3 - heart[1], mz = (p0[2] + p1[2] + p2[2]) / 3 - heart[2];
      if (nx * mx + ny * my + nz * mz < 0) [p1, p2] = [p2, p1];
      positions.push(...p0, ...p1, ...p2);
      ends.push(vertical);
    }
  }
  return { positions, ends };
}

export { ROOF_SHAPES, roofShapeCode, packRoof, unpackRoof, roofHeightFor, roofPlacement, pitchedRoof };
