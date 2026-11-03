// js/landmark-models/the-sail.js
// The Sail @ Marina Bay, 2 & 6 Marina Boulevard (NBBJ, design by Peter Pran and Timothy Johnson, with Team Design
// Architects, for City Developments and AIG; 2008): OSM ways 325793771 (Marina Bay Tower, the taller one on Marina
// Boulevard), 325793747 (Central Park Tower, toward Central Boulevard and the park), 47345007 (the car-park
// podium with the club deck, and the bridge from the deck to Marina Bay Tower) and 1201220123 (a stray three-node sliver
// named "The Sail" inside Marina Bay Tower: nothing of its own to build). Marina Bay Suites next door stays the city's.
// Two residential towers, each two curved leaves meeting at a pale vertical seam: a glass sail, its leading edge bowed
// out at mid-height like a sail full of wind, and a pale leaf of white aluminium panels, windows and vertical fins.
// Marina Bay Tower is a crescent along Marina Boulevard, its convex face to the bay; its glass leaf at the east-south-east
// end rises past the roof into a pointed tip of glass on an open frame, 245 m up over the leading edge, its top sloping
// down 16 m toward the seam; the pale leaf's roof is flat and lower, and a white boom crosses the seam high on the
// bay face. Central Park Tower is a lens on the grid's other axis; its pale leaf's roof rises toward the glass bow at
// the north-north-east end, whose leading edge curves back from mid-height as it rises and ends in a glass crown sloping
// up to a level ridge at 215 m over the seam. Between them a drop-off plaza stays open; west and south of them the
// car-park podium, louvred grey with a white-balconied block of flats at its south corner under a white wing, carries
// the club deck at 25 m (tennis courts, pools, palms and white shades), joined to Marina Bay Tower by a glass bridge
// over the drive.
// Heights: 245 m and 215 m (CTBUH, Wikipedia; as mapped) and the podium's 25 m (as mapped; 26 m in NBBJ's sections);
// the roofs, the tip's fall, the leading edges' bow and recession, the seams and the boom scaled from NBBJ's sections
// (ArchDaily) and photographs from the bay, Marina Bay Sands and the Merlion. See docs/the-sail.md.
export const info = { name: 'The Sail @ Marina Bay', height: 245 };

const ID = { bay: 325793771, park: 325793747, podium: 47345007 };
const GRID = 121.8; // the city's grid (compass degrees): Marina Bay Tower's straight south-west wall runs along it
// heights (m): the lobby band; Marina Bay Tower's glass leaf roof, its tip, how far back from the leading edge the tip's
// top falls to the roof, the pale leaf's roof at the seam and at its far end, the boom; Central Park Tower's bow (glass to
// its crown, the crown's ridge, where its leading edge starts to curve back), its pale leaf's roof at the seam and at
// its far end; the podium, the bridge (deck underside, floor, roof) and the wing over the flats
const H = {
  lobby: 9,
  bayRoof: 229, tip: 245, tipBack: 26, bayPale: 227, bayPaleEnd: 223, boom: 192,
  parkGlass: 203, ridge: 215, leech: 110, parkPale: 209, parkPaleEnd: 199,
  podium: 25, bridge: [24.3, 25, 28.4], wing: [30.4, 33.2]
};
// where the seams stand: the share of each tower's length from its leading (glass) end
const SEAM = { bay: 0.44, park: 0.4 };
// the leading edges: Marina Bay Tower's bows out (m along its length, measured from its mapped end: 5 m short at the
// ground, full at 120 m, 3 m short at the roof); Central Park Tower's curves back 10 m from 110 m to its glass top
const BOW = { base: 5, full: 120, top: 3, recede: 10 };
const STOREY = 3.2; // the flats' floor to floor
// colours from daylight photographs (Commons 2012, ArchDaily/NBBJ): blue-grey glass in light aluminium frames, the pale
// leaves white panels and fins with grey-blue windows, the tips paler glass over a white frame with the sky through
// it; the lobbies dark glass; the podium's dark grey louvres, the flats' white balconies; white seams, boom and wing
const C = {
  glass: 0x82a3b3, frame: 0xcfd7d9, paleWall: 0xdfe3e2, paleWindow: 0x6b818b, crownGlass: 0x87a3ae, crownFrame: 0xe2e7e8,
  lobbyGlass: 0x3d525a, lobbyFrame: 0x9aa6a8, louvre: 0x959da0, louvreGap: 0x5d676c, flats: 0xe0e3e2, flatsWindow: 0x6f8892,
  white: 0xeceeec, paving: 0xcfcbc1, green: 0x5f8f4e, leaf: 0x4b7a37, pool: 0x4fa3c9, court: 0xa8483d
};

// The part of a ring where p·d is at least t (or, `below`, at most t): one side of a straight cut
function cut(ring, [dx, dz], t, below = false) {
  const s = ([x, z]) => (below ? t - (x * dx + z * dz) : x * dx + z * dz - t);
  const out = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], sa = s(a), sb = s(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) { const k = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  });
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05; });
}
const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  const s = area(ring) >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// Whether a point lies inside a ring, and how far it is from the ring's edges
function inside([x, z], r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
}
function clearance([x, z], r) {
  let d = Infinity;
  r.forEach((a, i) => {
    const b = r[(i + 1) % r.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / L2));
    d = Math.min(d, Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t));
  });
  return d;
}
const centroid = (r) => {
  let cx = 0, cz = 0, a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    a += f; cx += (r[j][0] + r[i][0]) * f; cz += (r[j][1] + r[i][1]) * f;
  }
  return [cx / (3 * a), cz / (3 * a)];
};
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };
// The ring with its gently turning runs (the curved faces, mapped as a few long chords) rounded: each edge between two
// vertices that turn less than `maxTurn` is split into `k` along a Catmull-Rom curve through its neighbours; edges at
// sharp corners keep straight
function smooth(ring, k = 3, maxTurn = 0.45) {
  const n = ring.length, at = (i) => ring[(i + n) % n];
  const turn = (i) => {
    const [a, b, c] = [at(i - 1), at(i), at(i + 1)];
    const u = Math.atan2(b[1] - a[1], b[0] - a[0]), v = Math.atan2(c[1] - b[1], c[0] - b[0]);
    return Math.abs(Math.atan2(Math.sin(v - u), Math.cos(v - u)));
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const p1 = at(i), p2 = at(i + 1);
    out.push(p1);
    const g1 = turn(i) < maxTurn, g2 = turn(i + 1) < maxTurn;
    if (!g1 && !g2) continue;
    // a sharp end continues the edge straight on
    const p0 = g1 ? at(i - 1) : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
    const p3 = g2 ? at(i + 2) : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    for (let j = 1; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  return out;
}

// The ring turned to start at the last of its points on a seam (`onSeam`) before its outer walls: the first wall runs
// from the seam outward
function fromSeam(ring, onSeam) {
  const n = ring.length;
  for (let i = 0; i < n; i++) if (onSeam(ring[i]) && !onSeam(ring[(i + 1) % n])) return [...ring.slice(i), ...ring.slice(0, i)];
  return ring;
}

export function build(kit, site) {
  const mapped = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`The Sail needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    // the glass sails: blue-grey glass a panel wide between thin light frames and a hairline each storey
    glass: kit.facadeMaterial({ wall: C.frame, window: C.glass, floorHeight: STOREY, bayWidth: 1.5, windowWidth: 0.84, pattern: 'strips' }),
    // the pale leaves: white panels and fins between grey-blue windows, as vertical stripes
    pale: kit.facadeMaterial({ wall: C.paleWall, window: C.paleWindow, floorHeight: STOREY, bayWidth: 1.6, windowWidth: 0.42, pattern: 'strips' }),
    // the tips: paler glass over a white frame
    crown: kit.facadeMaterial({ wall: C.crownFrame, window: C.crownGlass, floorHeight: 2.4, bayWidth: 2.4, pattern: 'curtain' }),
    lobby: kit.facadeMaterial({ wall: C.lobbyFrame, window: C.lobbyGlass, floorHeight: H.lobby, bayWidth: 3, pattern: 'curtain' }),
    louvre: kit.facadeMaterial({ wall: C.louvre, window: C.louvreGap, floorHeight: 3, bayWidth: 4, pattern: 'ribbon' }),
    flats: kit.facadeMaterial({ wall: C.flats, window: C.flatsWindow, floorHeight: STOREY, bayWidth: 3.2, windowWidth: 0.7, windowHeight: 0.6, pattern: 'punched' }),
    white: kit.material(C.white, { roughness: 0.5 }), paving: kit.material(C.paving), green: kit.material(C.green),
    leaf: kit.material(C.leaf), pool: kit.material(C.pool, { roughness: 0.2 }), court: kit.material(C.court)
  };

  // --- the drawing: u along the grid toward Marina View (east-south-east, the city's x), v across it toward the park
  // (south-south-west, the city's z), metres about the anchor ---------------------------------------------------------------
  const U = kit.compass(GRID), V = kit.compass(GRID + 90);
  const dot = (p, a) => p[0] * a[0] + p[1] * a[1];
  const D = (p) => [dot(p, U), dot(p, V)];
  const P = (u, v) => [U[0] * u + V[0] * v, U[1] * u + V[1] * v];
  const span = (r, a) => [Math.min(...r.map((p) => dot(p, a))), Math.max(...r.map((p) => dot(p, a)))];

  // --- Marina Bay Tower ---------------------------------------------------------------------------------------------------
  // the crescent: its convex face to the bay (low v), the straight wall to the plaza (high v); the glass leaf at the
  // east-south-east end (high u), the pale leaf beyond the seam toward Marina View Link
  const bayRaw = mapped(ID.bay), bay = smooth(bayRaw);
  const [bu0, bu1] = span(bayRaw, U), [bv0, bv1] = span(bayRaw, V);
  const bSeam = bu1 - SEAM.bay * (bu1 - bu0), bLen = bu1 - bSeam;
  // the glass leaf's leading edge: how far short of its mapped end it is at a height
  const short = (y) => (y <= BOW.full ? BOW.base * (1 - y / BOW.full) ** 2 : BOW.top * ((y - BOW.full) / (H.bayRoof - BOW.full)) ** 2);
  const sail = (r, y) => { const f = (bLen - short(y)) / bLen; return r.map((p) => { const du = dot(p, U) - bSeam; return du > 0 ? [p[0] + U[0] * du * (f - 1), p[1] + U[1] * du * (f - 1)] : p; }); };
  const bayGlass = cut(bay, U, bSeam), bayPale = cut(bay, U, bSeam, true);
  // the glass leaf, lofted band by band so its leading edge bows; the lobby's dark glass at its foot. The kit lays a
  // façade's pattern along a ring from its first point, so the leaf is lofted in two halves (the bay face's and the
  // plaza face's) each starting at the fixed seam: the mullions stay over each other band to band and drift only
  // toward the moving edge, as the real panels follow their floor plates
  const bayMid = (bv0 + bv1) / 2, onBaySeam = (p) => Math.abs(dot(p, U) - bSeam) < 0.01;
  const bayHalves = [cut(bayGlass, V, bayMid, true), cut(bayGlass, V, bayMid)].map((r) => fromSeam(r, onBaySeam));
  const BAY_LEVELS = [0, H.lobby, ...Array.from({ length: 36 }, (_, k) => 15 + k * 6), H.bayRoof];
  for (let k = 0; k + 1 < BAY_LEVELS.length; k++) {
    const [y0, y1] = [BAY_LEVELS[k], BAY_LEVELS[k + 1]];
    bayHalves.forEach((r, h) => kit.loft({ ring: sail(r, y0), topRing: sail(r, y1), y0, y1, material: k ? M.glass : M.lobby, top: y1 === H.bayRoof ? kit.roofMaterial() : M.glass, name: `bay-glass-${h}-${k}` }));
  }
  // the pale leaf, its roof falling a little toward its far end
  kit.prism({ ring: bayPale, y0: 0, y1: H.lobby, material: M.lobby, top: M.pale, name: 'bay-pale-lobby' });
  kit.prism({ ring: bayPale, y0: H.lobby, y1: kit.sloped(bayPale, H.bayPale, H.bayPale - H.bayPaleEnd, GRID + 180), material: M.pale, name: 'bay-pale' });
  // solid to fly into: the glass leaf within its narrowest (its foot), the pale leaf to its roof's low end
  const bayGlassRaw = cut(bayRaw, U, bSeam), bayPaleRaw = cut(bayRaw, U, bSeam, true);
  kit.collisionPrism({ ring: sail(bayGlassRaw, 0), y0: 0, y1: H.bayRoof });
  kit.collisionPrism({ ring: bayPaleRaw, y0: 0, y1: H.bayPaleEnd });

  // The tip: from the glass leaf's roof the sail rises to a point over its leading edge, its top falling back 16 m to
  // the roof toward the seam and its sides leaning in from the bay face and from the inner part of the roof
  const roofRing = sail(bayGlass, H.bayRoof);
  const tipFoot = cut(cut(roofRing, U, Math.max(...roofRing.map((p) => dot(p, U))) - H.tipBack), V, bv1 - 0.4 * (bv1 - bv0), true);
  const tc = centroid(tipFoot), lead = tipFoot.reduce((a, p) => (dot(p, U) > dot(a, U) ? p : a));
  let apex = [tc[0] + (lead[0] - tc[0]) * 0.85, tc[1] + (lead[1] - tc[1]) * 0.85];
  if (!inside(apex, tipFoot)) apex = tc;
  kit.loft({ ring: tipFoot, topRing: tipFoot.map((p) => [apex[0] + (p[0] - apex[0]) * 0.02, apex[1] + (p[1] - apex[1]) * 0.02]), y0: H.bayRoof, y1: H.tip, material: M.crown, top: M.crown, name: 'crown-bay-tip' });
  kit.collisionPrism({ ring: tipFoot, y0: H.bayRoof, y1: H.bayRoof + 6 });

  // The seam on the bay face: a white mast from the ground to the pale leaf's roof, and the boom across it high up
  const seamAt = (() => {
    // where the seam meets the convex face: the crossing of u = seam with the ring at the lowest v, and that edge
    let best = null;
    bay.forEach((a, i) => {
      const b = bay[(i + 1) % bay.length], ua = dot(a, U) - bSeam, ub = dot(b, U) - bSeam;
      if ((ua >= 0) === (ub >= 0)) return;
      const t = ua / (ua - ub), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      if (!best || dot(p, V) < dot(best.p, V)) best = { p, i };
    });
    const [nx, nz] = normalsOf(bay)[best.i], a = bay[best.i], b = bay[(best.i + 1) % bay.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    if (dot(t, U) > 0) t = [-t[0], -t[1]]; // pointing toward the pale leaf
    return { p: best.p, n: [nx, nz], t };
  })();
  const { p: sp, n: sn, t: st } = seamAt;
  kit.box({ x: sp[0] + sn[0] * 0.15, z: sp[1] + sn[1] * 0.15, y: 0, w: 2.6, h: H.bayPale + 0.5, d: 0.7, yaw: Math.atan2(st[1], st[0]), material: M.white, top: M.white, name: 'bay-seam' });
  const boomAt = (s) => [sp[0] + sn[0] * 0.75 + st[0] * s, H.boom, sp[1] + sn[1] * 0.75 + st[1] * s];
  kit.beam({ from: boomAt(-7), to: boomAt(13), w: 0.6, h: 0.9, material: M.white, name: 'bay-boom' });

  // At its foot the lobby stands back under the leading edge's overhang, roofed by a glass skylight at 7 m from the
  // lobby's wall out to the tower's mapped end, on white posts; along Marina Boulevard under the pale leaf a glass
  // canopy 3.5 m deep on white posts shelters the landscaped walk
  const skylight = cut(bayGlassRaw, U, bu1 - BOW.base - 1.2);
  kit.prism({ ring: skylight, y0: 7, y1: 7.4, material: M.white, top: M.crown, name: 'bay-skylight' });
  kit.collisionPrism({ ring: skylight, y0: 7, y1: 7.4 });
  const sc = centroid(skylight);
  const stands = [];
  for (const p of skylight) {
    const q = [p[0] + (sc[0] - p[0]) * 0.15, p[1] + (sc[1] - p[1]) * 0.15];
    if (dot(q, U) < bu1 - BOW.base + 0.4 || stands.some((r) => Math.hypot(r[0] - q[0], r[1] - q[1]) < 4)) continue;
    kit.cylinder({ x: q[0], z: q[1], y0: 0, y1: 7.02, r: 0.22, segments: 6, material: M.white, top: M.white, name: `bay-skylight-post-${stands.length}` });
    stands.push(q);
  }
  const walkSide = bayPale.map((p, i) => i).filter((i) => dot(bayPale[i], V) < bv0 + 9 && dot(bayPale[i], U) > bu0 + 3);
  if (walkSide.length >= 3) {
    const PN = normalsOf(bayPale), nv = (i) => { const h = (i + bayPale.length - 1) % bayPale.length, [ax, az] = PN[h], [bx, bz] = PN[i], L = Math.hypot(ax + bx, az + bz) || 1; return [(ax + bx) / L, (az + bz) / L]; };
    const off = (i, d) => { const [nx, nz] = nv(i); return [bayPale[i][0] + nx * d, bayPale[i][1] + nz * d]; };
    const canopy = [...walkSide.map((i) => off(i, -0.2)), ...walkSide.map((i) => off(i, 3.5)).reverse()];
    kit.prism({ ring: canopy, y0: 6, y1: 6.35, material: M.white, top: M.crown, name: 'bay-canopy' });
    kit.collisionPrism({ ring: canopy, y0: 6, y1: 6.35 });
    let last = null;
    walkSide.forEach((i, k) => {
      const p = off(i, 3.2);
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 8 && k < walkSide.length - 1) return;
      kit.cylinder({ x: p[0], z: p[1], y0: 0, y1: 6.02, r: 0.16, segments: 6, material: M.white, top: M.white, name: `bay-canopy-post-${k}` });
      last = p;
    });
  }

  // --- Central Park Tower -------------------------------------------------------------------------------------------------
  // the lens on the grid's other axis: its glass bow at the north-north-east end (low v), toward Marina Bay Tower; the
  // pale leaf beyond the seam toward the park
  const parkRaw = mapped(ID.park), park = smooth(parkRaw);
  const [pv0, pv1] = span(parkRaw, V);
  const pSeam = pv0 + SEAM.park * (pv1 - pv0), pLen = pSeam - pv0;
  const recede = (y) => (y <= H.leech ? 0 : BOW.recede * ((y - H.leech) / (H.parkGlass - H.leech)) ** 2);
  const bow = (r, y) => { const g = (pLen - recede(y)) / pLen; return r.map((p) => { const dv = dot(p, V) - pSeam; return dv < 0 ? [p[0] + V[0] * dv * (g - 1), p[1] + V[1] * dv * (g - 1)] : p; }); };
  const parkGlass = cut(park, V, pSeam, true), parkPale = cut(park, V, pSeam);
  // lofted as the bay tower's glass leaf, in two halves (east and west) from the seam; straight up to where the leading
  // edge starts to curve back
  const [pu0, pu1] = span(parkRaw, U), onParkSeam = (p) => Math.abs(dot(p, V) - pSeam) < 0.01;
  const parkHalves = [cut(parkGlass, U, (pu0 + pu1) / 2, true), cut(parkGlass, U, (pu0 + pu1) / 2)].map((r) => fromSeam(r, onParkSeam));
  const PARK_LEVELS = [0, H.lobby, H.leech, ...Array.from({ length: 15 }, (_, k) => 116 + k * 6), H.parkGlass];
  for (let k = 0; k + 1 < PARK_LEVELS.length; k++) {
    const [y0, y1] = [PARK_LEVELS[k], PARK_LEVELS[k + 1]];
    parkHalves.forEach((r, h) => kit.loft({ ring: bow(r, y0), topRing: bow(r, y1), y0, y1, material: k ? M.glass : M.lobby, top: M.glass, name: `park-glass-${h}-${k}` }));
  }
  // the crown over the bow: paler glass on its frame, from the bow's top up to a level ridge over the seam
  const crownFoot = bow(parkGlass, H.parkGlass);
  kit.prism({ ring: crownFoot, y0: H.parkGlass, y1: kit.sloped(crownFoot, H.ridge, H.ridge - H.parkGlass, GRID - 90), material: M.crown, top: M.crown, name: 'crown-park' });
  // the pale leaf, its roof rising toward the bow
  kit.prism({ ring: parkPale, y0: 0, y1: H.lobby, material: M.lobby, top: M.pale, name: 'park-pale-lobby' });
  kit.prism({ ring: parkPale, y0: H.lobby, y1: kit.sloped(parkPale, H.parkPale, H.parkPale - H.parkPaleEnd, GRID + 90), material: M.pale, name: 'park-pale' });
  const parkGlassRaw = cut(parkRaw, V, pSeam, true), parkPaleRaw = cut(parkRaw, V, pSeam);
  kit.collisionPrism({ ring: parkGlassRaw, y0: 0, y1: H.leech });
  kit.collisionPrism({ ring: bow(parkGlassRaw, H.parkGlass), y0: H.leech, y1: H.parkGlass + 4 });
  kit.collisionPrism({ ring: parkPaleRaw, y0: 0, y1: H.parkPaleEnd });

  // --- the podium -----------------------------------------------------------------------------------------------------------
  // Places on the podium, its deck and the plaza are read off NBBJ's club-level plan and the mapped rings, in metres about
  // Marina Bay Tower's mapped east-south-east point (as the anchor puts it now, at u 28.4, v -38.3), so they follow the rings
  const ref = bayRaw.reduce((a, p) => (dot(p, U) > dot(a, U) ? p : a)), [du, dv] = [dot(ref, U) - 28.4, dot(ref, V) + 38.3];
  const Q = (u, v) => P(u + du, v + dv);
  const rect = (u0, v0, u1, v1) => [Q(u0, v0), Q(u1, v0), Q(u1, v1), Q(u0, v1)];
  // The mapped podium reaches Marina Bay Tower by a neck 3.4 m wide: the bridge from the club deck over the drive. The
  // podium is the rest of it; the bridge stands on its ends, the drive open under it
  const podiumAll = mapped(ID.podium);
  const nearBay = podiumAll.map((p) => dot(p, V) < bv1 + 3);
  const first = nearBay.findIndex((b, i) => b && !nearBay[(i + podiumAll.length - 1) % podiumAll.length]);
  if (first < 0 || nearBay.every(Boolean)) throw new Error('The Sail: the bridge is not where it is mapped');
  const neck = [];
  for (let i = first; nearBay[i % podiumAll.length]; i++) neck.push(i % podiumAll.length);
  const before = podiumAll[(neck[0] + podiumAll.length - 1) % podiumAll.length], after = podiumAll[(neck.at(-1) + 1) % podiumAll.length];
  const bridge = [before, ...neck.map((i) => podiumAll[i]), after];
  const podium = podiumAll.filter((_, i) => !neck.includes(i));
  // its walls: grey louvres over the car park, the white balconies of the flats at the south corner (beyond the
  // park tower's south end, toward the park), shopfronts under both
  const flatsWall = (i) => { const a = podium[i], b = podium[(i + 1) % podium.length], [mu, mv] = D([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return mu - du > 10 && mv - dv > 26 ? M.flats : M.louvre; };
  kit.prism({ ring: podium, y0: 0, y1: 5, material: M.lobby, top: M.louvre, name: 'base-podium-shops' });
  kit.prism({ ring: podium, y0: 5, y1: H.podium, material: M.louvre, edgeMaterial: flatsWall, top: M.paving, name: 'base-podium' });
  kit.collisionPrism({ ring: podium, y0: 0, y1: H.podium });
  // the bridge: a floor slab on the podium's edge and the tower's wall, a glass room on it, a white roof
  const [, bRoom, bRoof] = H.bridge;
  kit.prism({ ring: bridge, y0: H.bridge[0], y1: bRoom, material: M.white, top: M.paving, name: 'base-bridge-floor' });
  kit.prism({ ring: kit.inset(bridge, 0.15), y0: bRoom, y1: bRoof - 0.4, material: M.lobby, top: M.white, name: 'base-bridge-glass' });
  kit.prism({ ring: bridge, y0: bRoof - 0.4, y1: bRoof, material: M.white, top: M.white, name: 'base-bridge-roof' });
  kit.collisionPrism({ ring: bridge, y0: H.bridge[0], y1: bRoof });

  // --- the club deck on the podium, the flats' wing and the plaza ---------------------------------------------------------
  const deck = H.podium;
  // planters round the deck's edge, but where the deck meets the park tower or the bridge
  const outer = kit.inset(podium, 0.4), inner = kit.inset(podium, 2.4);
  podium.forEach((a, i) => {
    const j = (i + 1) % podium.length, b = podium[j];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 3) return;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (clearance(mid, parkRaw) < 1 || clearance(mid, bridge) < 1) return;
    const q = [outer[i], outer[j], inner[j], inner[i]];
    if (Math.abs(area(q)) < 2) return;
    kit.prism({ ring: q, y0: deck, y1: deck + 0.6, material: M.paving, top: M.green, name: `base-deck-planter-${i}` });
  });
  // two tennis courts side by side in the car park's west part, green in a red surround
  const courts = rect(-40, 14, -10.5, 47);
  kit.prism({ ring: courts, y0: deck, y1: deck + 0.12, material: M.court, top: M.court, name: 'base-deck-courts' });
  for (const [u0, u1] of [[-38, -26.5], [-24, -12.5]]) kit.prism({ ring: rect(u0, 18.5, u1, 42.5), y0: deck + 0.12, y1: deck + 0.16, material: M.green, top: M.green, name: `base-deck-court-${u0}` });
  // the main pool curving along the deck's edge over the plaza, the lap pool beside the park tower, the small pool on
  // the flats
  const in3 = kit.inset(podium, 3.2), in10 = kit.inset(podium, 10), in12 = kit.inset(podium, 12.5);
  const plazaSide = podium.map((_, i) => i).filter((i) => { const [u, v] = D(podium[i]); return v - dv < 8 && u - du > -32 && u - du < 10; });
  const mainPool = [...plazaSide.map((i) => in3[i]), ...plazaSide.map((i) => in10[i]).reverse()];
  kit.prism({ ring: mainPool, y0: deck, y1: deck + 0.1, material: M.paving, top: M.pool, name: 'base-deck-pool-main' });
  const lapPool = rect(-1, 20, 9, 44), aquaPool = rect(14.5, 37, 22, 45);
  kit.prism({ ring: lapPool, y0: deck, y1: deck + 0.1, material: M.paving, top: M.pool, name: 'base-deck-pool-lap' });
  kit.prism({ ring: aquaPool, y0: deck, y1: deck + 0.1, material: M.paving, top: M.pool, name: 'base-deck-pool-aqua' });
  // palms along the pools and white shades by them, clear of the courts, the pools, the planters and the towers
  const pools = [mainPool, lapPool, aquaPool], walk = kit.inset(podium, 2.8);
  const clear = (p, d) => inside(p, walk) && clearance(p, parkRaw) > d && !inside(p, courts) && clearance(p, courts) > 1 && pools.every((r) => !inside(p, r) && clearance(p, r) > 1.2);
  function palm(x, z, y, h, name) {
    kit.cylinder({ x, z, y0: y, y1: y + h - 0.6, r: 0.22, segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    const star = Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5, rr = i % 2 ? 1.1 : 3.2; return [x + Math.cos(a) * rr, z + Math.sin(a) * rr]; });
    kit.loft({ ring: star.map(([px, pz]) => [x + (px - x) * 0.25, z + (pz - z) * 0.25]), topRing: star, y0: y + h - 1.4, y1: y + h, material: M.leaf, top: M.leaf, name: `${name}-palm-crown` });
  }
  // a white shade: a square sail on a post
  function shade(x, z, y, name) {
    kit.cylinder({ x, z, y0: y, y1: y + 2.6, r: 0.08, segments: 4, material: M.white, top: M.white, name: `${name}-post` });
    const sq = [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]].map(([a, b]) => [x + a, z + b]);
    kit.loft({ ring: sq, y0: y + 2.55, y1: y + 3.4, scale: 0.08, material: M.white, top: M.white, name: `${name}-shade` });
  }
  const planted = [];
  const plant = (p, h, name) => { if (clear(p, 3.5) && planted.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 4)) { palm(p[0], p[1], deck, h, name); planted.push(p); } };
  let n = 0;
  // along the main pool's inner side, along the lap pool's west side, round the courts and the deck's edge
  for (const i of plazaSide) plant(in12[i], 7 + 2 * hash(i, 1), `base-deck-${n++}`);
  for (let v = 22; v <= 42; v += 5) plant(Q(-3.4, v), 6.5 + 2 * hash(v, 2), `base-deck-${n++}`);
  for (const [u, v] of [[-35, 8], [-43, 12], [-43, 24], [-43, 36], [-44, 46], [-30, 50], [-18, 50], [-6, 49], [5, 49], [12, 31]]) plant(Q(u, v), 6.5 + 2.5 * hash(u, v), `base-deck-${n++}`);
  for (const [u, v] of [[11.2, 24.5], [11.2, 29.5], [11.2, 34.5], [-8, 9], [-16, 7.5], [-24, 7.5], [-4, 16], [3, 15.5]]) {
    const p = Q(u, v);
    if (clear(p, 2) && planted.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 3.4)) { shade(p[0], p[1], deck, `base-deck-${n++}`); planted.push(p); }
  }

  // the flats' white wing: a white roof over their terrace, rising toward the park tower, on posts from the deck
  const lobe = kit.inset(cut(cut(podium, U, 13 + du), V, 36.5 + dv), 1.2);
  if (lobe.length >= 3 && Math.abs(area(lobe)) > 40) {
    const [w0, w1] = H.wing;
    kit.prism({ ring: lobe, y0: w0, y1: kit.sloped(lobe, w1, w1 - w0 - 0.5, GRID + 90), material: M.white, top: M.white, name: 'base-wing' });
    kit.collisionPrism({ ring: lobe, y0: w0, y1: w0 + 0.5 });
    const lc = centroid(lobe);
    lobe.filter((p, i) => { const q = lobe[(i + 1) % lobe.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 2; })
      .map((p) => [lc[0] + (p[0] - lc[0]) * 0.78, lc[1] + (p[1] - lc[1]) * 0.78])
      .forEach((p, k) => kit.cylinder({ x: p[0], z: p[1], y0: deck, y1: w0 + 0.05, r: 0.35, segments: 8, material: M.white, top: M.white, name: `base-wing-post-${k}` }));
  }

  // the plaza: the drive and drop-off between the bay tower's straight wall, the park tower and the podium's curved
  // edge, open to the sky and paved over the city's lawn (under the bridge too); it stops short of Marina View
  const plaza = [[-29, -22], [13, -21.9], [19.4, -23.5], [22.2, -29.6], [27, -29.6], [36.4, -10.8], [17.4, -10.8], [14.5, -4.5], [12.9, 4.3],
    [12.7, 10.3], [8.7, 6.95], [-1.4, -1], [-13.4, -5.25], [-17, -5.9], [-29.2, -5.9], [-38, -3], [-37.6, -23.5], [-31.5, -23.5], [-31.5, -22.3]].map(([u, v]) => Q(u, v));
  kit.prism({ ring: plaza, y0: 0, y1: 0.32, material: M.paving, top: M.paving, name: 'base-plaza' });
  // the water feature by the drop-off, and trees in the beds between the towers toward Marina View
  kit.prism({ ring: rect(0, -10, 7, -6.5), y0: 0.32, y1: 0.5, material: M.paving, top: M.pool, name: 'base-plaza-water' });
  for (const [k, [u, v]] of [[24.5, -23.5], [30.5, -17.5]].entries()) {
    const [x, z] = Q(u, v), h = 6 + 2 * hash(k, 7), r = 2.3;
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: 0.32, y1: 0.32 + h * 0.42, r: 0.2, segments: 5, material: M.paving, top: M.paving, name: `base-plaza-${k}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: 0.32 + h * 0.36, y1: 0.32 + h * 0.64, material: M.leaf, top: M.leaf, name: `base-plaza-${k}-tree-crown` });
    kit.loft({ ring: around(r), y0: 0.32 + h * 0.64, y1: 0.32 + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `base-plaza-${k}-tree-crown-top` });
  }
}
