// js/landmark-models/marina-bay-financial-centre.js
// Marina Bay Financial Centre (Kohn Pedersen Fox with DCA Architects, 2010-2012): OSM ways 116905040 (Tower 1),
// 116905042 (Tower 2), 116905041 (Tower 3's outline) and 509003526–29 (its parts), 116905045 (Marina Bay Residences),
// 509003525 (the podium: the block less the towers), 116905047 (mapped as a 245 m building, but the residences' lap pool
// on their podium deck) and 728243729 (Marina Bay Link Mall, underground: nothing is built for it).
// Four towers stand at the corners of the block around an open middle, KPF's "city park": Tower 1 (192 m, Standard
// Chartered) on the corner of Marina Boulevard and Straits View, Tower 2 (245 m, HSBC) on Straits View, Tower 3 (239 m,
// DBS) on Central Boulevard and Marina Way, and Marina Bay Residences (227 m) on Marina Boulevard and Marina Way. Each is
// two or three slabs of blue glass slid past one another at different heights, the tops cut on a slant: Tower 1's glazed
// crown falls south-east to its lower slab on the bay side, the Residences' glass crown north-west to their balconied
// slab, Tower 2's top west-north-west to its west slab. Podium wings in stone over glass shopfronts line Marina
// Boulevard and Central Boulevard, and the residences stand on a pool deck along Marina Way. Marina Bay Suites is not in
// this block: it stands across Straits View (way 393092728) and is left to the city.
// Heights: Wikipedia's list of the tallest buildings (245, 239, 227 and 192 m) and Tower 3's parts as mapped (239, 238,
// 218, 218 m); the lower slabs, the crowns' fall, the podium wings and the plaza are estimated from photographs (from
// Marina Bay Sands, the Merlion, Swissôtel The Stamford, the Promontory) and the aerial. See
// docs/marina-bay-financial-centre.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Marina Bay Financial Centre', height: 245 };

const ID = { tower1: 116905040, tower2: 116905042, residences: 116905045, pool: 116905047, podium: 509003525 };
const TOWER_3 = { 509003529: 239, 509003527: 238, 509003526: 218, 509003528: 218 }; // its parts' mapped heights (m)
const ALONG = 121.8; // Marina Boulevard toward Marina Way: the block's grid (compass degrees)
const BAY = ALONG - 90; // across it, toward the bay
// heights (m): the towers' tops, where their glass crowns begin and how far their tops fall; the podium wings
const H = {
  tower1: 192, tower1Crown: 164, tower1Fall: 18, tower1Low: 138,
  tower2: 245, tower2Fall: 8, tower2Middle: 205, tower2West: 165,
  residences: 227, residencesCrown: 199, residencesFall: 24, residencesLow: 195,
  deck: 18, boulevard: 13, central: 19, shopfront: 5.5
};
// colours from the photographs: the offices' cobalt glass banded by lighter spandrels a storey apart, Tower 1's crown a
// lighter screen in a pale grid, the Residences' greener glass between thin mullions over white balcony edges
const C = {
  glass: 0x284f89, spandrel: 0x5a84b4, crownGlass: 0x3c6aa3, crownFrame: 0x9fb8d0, resGlass: 0x2b77ad, resFrame: 0x86b4d4,
  balcony: 0xe4ebef, balconyGlass: 0x2f6b9e, stone: 0xd6d2c8, slit: 0x56707e, shop: 0x4c6c7c, paving: 0xcdc9c0,
  green: 0x6f9150, leaf: 0x4d7a3a, white: 0xe9ebe8, pool: 0x5cb8cf, sign: 0xf4f7f9
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
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Marina Bay Financial Centre needs mapped way ${id}`);
    return p.ring;
  };
  const M = {
    office: kit.facadeMaterial({ wall: C.spandrel, window: C.glass, floorHeight: 4.5, bayWidth: 1.6, pattern: 'ribbon' }),
    residences: kit.facadeMaterial({ wall: C.resFrame, window: C.resGlass, floorHeight: 3.4, bayWidth: 1.5, pattern: 'strips', windowWidth: 0.86 }),
    // the balconies: glass with a white slab edge each storey (a scatter of no strips)
    balcony: kit.facadeMaterial({ wall: C.balcony, window: C.balconyGlass, floorHeight: 3.4, bayWidth: 3.2, pattern: 'scatter', scatter: { density: 0, top: 0 } }),
    stone: kit.facadeMaterial({ wall: C.stone, window: C.slit, floorHeight: 4.5, bayWidth: 3.2, pattern: 'strips', windowWidth: 0.3 }),
    // Tower 1's crown: a screen of lighter glass in a pale grid, over the roof as well
    crown: kit.facadeMaterial({ wall: C.crownFrame, window: C.crownGlass, floorHeight: 4.5, bayWidth: 3, pattern: 'strips', windowWidth: 0.84 }),
    shop: kit.glassMaterial(C.shop), roof: kit.roofMaterial(),
    paving: kit.material(C.paving), green: kit.material(C.green), leaf: kit.material(C.leaf), white: kit.material(C.white, { roughness: 0.5 }),
    pool: kit.material(C.pool, { roughness: 0.2 })
  };
  // A ring split across the compass bearing `deg` at `share` of its depth along it: [the part behind, the part ahead]
  const split = (r, deg, share) => {
    const d = kit.compass(deg), t = r.map(([x, z]) => x * d[0] + z * d[1]);
    const at = Math.min(...t) + share * (Math.max(...t) - Math.min(...t));
    return [cut(r, d, at, true), cut(r, d, at)];
  };
  // A slab from the ground to its top (a height, or a sloped top), solid all the way up (to a sloped top's low edge)
  const slab = (r, top, material, name) => {
    kit.prism({ ring: r, y0: -0.3, y1: top, material, top: M.roof, name });
    kit.collisionPrism({ ring: r, y0: 0, y1: typeof top === 'function' ? Math.min(...r.map(([x, z]) => top(x, z))) : top });
  };
  // A glass crown over a slab, its top cut on a slant
  const crown = (r, y0, top, material, name) => {
    kit.prism({ ring: r, y0, y1: top, material, top: material, name });
    kit.collisionPrism({ ring: r, y0, y1: Math.min(...r.map(([x, z]) => top(x, z))) });
  };

  // --- the towers -------------------------------------------------------------------------------------------------------
  // Tower 1: the tall slab under the glazed crown, and the lower one slid out past it toward the bay and the plaza,
  // wrapping its north and east faces (the mapped outline's notched corners)
  const [t1West, t1East] = split(ring(ID.tower1), 110, 0.7);
  const [t1Tall, t1North] = split(t1West, 20, 0.84);
  const t1Top = kit.sloped(t1Tall, H.tower1, H.tower1Fall, 125);
  slab(t1Tall, H.tower1Crown, M.office, 'tower1');
  crown(t1Tall, H.tower1Crown, t1Top, M.crown, 'tower1-crown');
  slab(t1East, H.tower1Low, M.office, 'tower1-low-east');
  slab(t1North, H.tower1Low, M.office, 'tower1-low-north');
  // Tower 2: the tall slab on the Central Boulevard side, a middle one toward Tower 1, a lower one on Straits View
  const [t2West, t2Rest] = split(ring(ID.tower2), ALONG, 0.27);
  const [t2Tall, t2Middle] = split(t2Rest, BAY, 0.5);
  const t2Top = kit.sloped(t2Tall, H.tower2, H.tower2Fall, ALONG + 180);
  slab(t2Tall, t2Top, M.office, 'tower2');
  slab(t2Middle, kit.sloped(t2Middle, H.tower2Middle, 4, ALONG + 180), M.office, 'tower2-middle');
  slab(t2West, kit.sloped(t2West, H.tower2West, 3, ALONG + 180), M.office, 'tower2-west');
  // Tower 3: its four mapped parts, the terraces of its top
  const t3 = kit.resolve(Object.entries(TOWER_3).map(([id, top]) => ({ ring: ring(Number(id)), y0: -0.3, y1: top, material: M.office, top: M.roof, name: `tower3-${id}` })));
  for (const it of t3) {
    kit.prism(it);
    kit.collisionPrism({ ring: it.ring, y0: 0, y1: it.y1 });
  }
  // Marina Bay Residences: the tall glass slab on Marina Way under its crown, the balconied one toward the pool deck
  const [resLow, resTall] = split(ring(ID.residences), 145, 0.5);
  slab(resTall, H.residencesCrown, M.residences, 'residences');
  crown(resTall, H.residencesCrown, kit.sloped(resTall, H.residences, H.residencesFall, 325), M.residences, 'residences-crown');
  slab(resLow, H.residencesLow, M.balcony, 'residences-low');

  // The tenants' signs, hung on the crowns' walls as the real ones are, in white beside their marks: Standard
  // Chartered's mark and two-line name low on Tower 1's crown toward the bay, the mark alone toward Marina Bay Sands;
  // HSBC's hexagon and name on Tower 2 toward the bay; DBS's red square and name on Tower 3 toward the bay and Marina Bay
  // Sands
  const t3Ring = (id) => t3.find((it) => it.name === `tower3-${id}`).ring;
  const SC = LOGOS['standard-chartered'], SC_FONT = '600 110px "Segoe UI", Helvetica, Arial, sans-serif';
  const DBS_FONT = 'bold 110px Georgia, "Times New Roman", serif';
  kit.hang({ ring: t1Tall, top: t1Top, toward: BAY, below: 3, text: 'standard\nchartered', logo: SC, height: 10, color: C.sign, font: SC_FONT, name: 'sign:standard-chartered' });
  kit.hang({ ring: t1Tall, top: t1Top, toward: ALONG, below: 2.5, logo: SC, height: 6.5, name: 'sign:standard-chartered-east' });
  kit.hang({ ring: t2Tall, top: t2Top, toward: BAY, below: 3, text: 'HSBC', logo: LOGOS.hsbc, height: 6.5, color: C.sign, name: 'sign:hsbc' });
  kit.hang({ ring: t3Ring(509003529), top: TOWER_3[509003529], toward: BAY, below: 3, text: 'DBS', logo: LOGOS.dbs, height: 5.5, color: C.sign, font: DBS_FONT, name: 'sign:dbs' });
  kit.hang({ ring: t3Ring(509003527), top: TOWER_3[509003527], toward: ALONG, below: 3, text: 'DBS', logo: LOGOS.dbs, height: 5.5, color: C.sign, font: DBS_FONT, name: 'sign:dbs-east' });

  // --- the podium and the plaza ------------------------------------------------------------------------------------------
  // The drawing: u along Marina Boulevard toward Marina Way, v toward the bay, metres from the podium's extremes (its
  // outline is the block less the towers) — independent of the anchor and of the city's grid bearing
  const podium = ring(ID.podium);
  const E = kit.compass(ALONG), N = kit.compass(BAY);
  const U = (p) => p[0] * E[0] + p[1] * E[1], V = (p) => p[0] * N[0] + p[1] * N[1];
  const uo = Math.min(...podium.map(U)), vo = Math.min(...podium.map(V));
  const P = (u, v) => [E[0] * (u + uo) + N[0] * (v + vo), E[1] * (u + uo) + N[1] * (v + vo)];
  const Q = (u, v, y) => { const [x, z] = P(u, v); return [x, y, z]; };
  // the part of a ring within the drawing's bounds (null: unbounded)
  const within = (r, u0, u1, v0, v1) => {
    let out = r;
    if (u0 != null) out = cut(out, E, u0 + uo);
    if (u1 != null) out = cut(out, E, u1 + uo, true);
    if (v0 != null) out = cut(out, N, v0 + vo);
    if (v1 != null) out = cut(out, N, v1 + vo, true);
    return out;
  };
  const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.1), segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
  // Trees on a grid `step` m apart over a ring, jittered, clear of its edges and of the rings in `avoid`
  function plant(r, y, step, h, avoid, label) {
    const us = r.map(U), vs = r.map(V);
    let n = 0;
    for (let u = Math.min(...us) - uo + step / 2, i = 0; u < Math.max(...us) - uo; u += step, i++) {
      for (let v = Math.min(...vs) - vo + step / 2, j = 0; v < Math.max(...vs) - vo; v += step, j++) {
        const p = P(u + (hash(i, j, 1) - 0.5) * step * 0.5, v + (hash(i, j, 2) - 0.5) * step * 0.5);
        const rr = h * (0.3 + 0.06 * hash(i, j, 3));
        if (!inside(p, r) || clearance(p, r) < rr + 1.5) continue;
        if (avoid.some((a) => inside(p, a) || clearance(p, a) < rr + 1)) continue;
        tree(p[0], p[1], y, h * (0.85 + 0.3 * hash(i, j, 4)), rr, `${label}-${n++}`);
      }
    }
  }

  // the ground: paved over the whole block between the towers (above the city's lawn inside the block)
  const PAVING = 0.32;
  kit.prism({ ring: kit.inset(podium, 0.3), y0: 0, y1: PAVING, material: M.paving, top: M.paving, name: 'plaza-paving' });
  // the wings: stone over glass shopfronts set back under them; collision to their roofs
  const wing = (r, h, top, name) => {
    kit.prism({ ring: kit.inset(r, 1.4), y0: 0, y1: H.shopfront, material: M.shop, top: M.roof, name: `${name}-shopfront` });
    kit.prism({ ring: r, y0: H.shopfront, y1: h, material: M.stone, top, name });
    kit.collisionPrism({ ring: r, y0: 0, y1: h });
    return r;
  };
  const t2v = Math.min(...ring(ID.tower2).map(V)) - vo; // Tower 2's south face, in the drawing
  const deck = wing(within(podium, 98, null, 60, null), H.deck, M.green, 'pool-deck');
  // (east of Tower 1: a cut across its notch would join the sliver beside its west face by a seam through the tower)
  wing(within(podium, 40, 98, 141, null), H.boulevard, M.roof, 'marina-boulevard-wing');
  const central = wing(within(podium, null, null, null, t2v), H.central, M.green, 'central-boulevard-wing');
  // the residents' lap pool on the deck, where OSM maps its outline as a tower, in a paved surround
  const lap = ring(ID.pool);
  kit.prism({ ring: kit.inset(lap, -2.5), y0: H.deck - 0.1, y1: H.deck + 0.08, material: M.paving, top: M.paving, name: 'pool-deck-surround' });
  kit.prism({ ring: kit.inset(lap, 1.2), y0: H.deck - 0.1, y1: H.deck + 0.14, material: M.pool, top: M.pool, name: 'pool-deck-pool' });
  plant(deck, H.deck, 11, 7, [kit.inset(lap, -3.5)], 'pool-deck');
  plant(central, H.central, 14, 5, [], 'central-roof');

  // the Link Mall's pavilion on the plaza: glass under a canted metal roof
  const pavilion = rect(62, 124, 88, 138), pavilionRoof = rect(60.5, 122.5, 89.5, 139.5);
  kit.prism({ ring: pavilion, y0: 0, y1: 7.2, material: M.shop, top: M.roof, name: 'link-pavilion' });
  kit.prism({ ring: pavilionRoof, y0: 7.2, y1: kit.sloped(pavilionRoof, 9.6, 2, BAY), material: M.white, top: M.roof, name: 'link-pavilion-roof' });
  kit.collisionPrism({ ring: pavilionRoof, y0: 7.2, y1: 9.6 });
  // white sails over the plaza, each end on a white mast rising past it: the gap on Straits View between Towers 1 and
  // 2, and the middle by Tower 1
  const masts = [];
  const sail = (a, b, w, name) => {
    kit.beam({ from: Q(...a), to: Q(...b), w, h: 0.18, material: M.white, name: `${name}-sail` });
    const du = b[0] - a[0], dv = b[1] - a[1], L = Math.hypot(du, dv);
    for (const [end, out] of [[a, -1], [b, 1]]) {
      // leaning in from a foot 0.8 m out past the sail's end, through that end, 3 m on up
      const h = end[2], foot = 0.8, head = foot * (1 - (h + 3 - PAVING) / (h - PAVING));
      const at = (s) => [end[0] + (out * du * s) / L, end[1] + (out * dv * s) / L];
      kit.beam({ from: Q(...at(foot), PAVING), to: Q(...at(head), h + 3), w: 0.4, h: 0.4, material: M.white, name: `${name}-mast` });
      const [fu, fv] = at(foot);
      masts.push(rect(fu - 2, fv - 2, fu + 2, fv + 2));
    }
  };
  sail([12, 80, 6.5], [30, 88, 9.5], 7, 'canopy-straits-view-1');
  sail([32, 77, 7], [47, 84, 10], 6, 'canopy-straits-view-2');
  sail([62, 100, 7], [76, 110, 10.5], 7, 'canopy-plaza-1');
  sail([66, 114, 6.5], [82, 118, 9], 6, 'canopy-plaza-2');
  // the plaza's trees, in the open middle between the wings, the towers and the pavilion
  const plaza = within(podium, null, 98, t2v, 141);
  plant(plaza, PAVING, 10, 9, [pavilionRoof, ...masts], 'plaza');
}
