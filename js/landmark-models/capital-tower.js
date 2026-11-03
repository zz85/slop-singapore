// js/landmark-models/capital-tower.js
// Capital Tower, 168 Robinson Road (RSP Architects Planners & Engineers for CapitaLand, completed in 2000; 52 storeys,
// 254 m): OSM ways 47345009 (the outline), 510811294 (the shaft, 0–163 m), 510811295 (163–190 m), 510811296 and its
// eight skillion pieces 510811279–93 (the sloping tier, 190–229 m), 510811297 and its four skillions 1566725293–96 (the
// crown, 229–254 m), 1558353295 (the eight-storey car park on the north-east side, the club's pool on its roof) and
// 1558353296–97 (the three-storey blocks filling the corners beside the entrance).
// A shaft 60 m along Robinson Road's axis and 49 m across it: a core with square wings at its ends, and in the middle of
// its plaza (south-west) and car park (north-east) faces a 42 m bay standing 3–4 m proud. The wings are clad in pale warm
// grey stone with punched windows, the bays are blue glass in bands — salmon granite spandrels in the lower half, pale
// ones higher up — split by a vertical slot of dark glass, and on the plaza face the slot carries a glass funnel under a
// half-round canopy at about 95 m, over the atrium and the entrance. At 163 m a broad cornice; over it a storey of
// stone with dark vents round the wings, and a glass box with its own ledge in front of each bay up to 190 m; behind it
// the glass rises to 229 m on all four sides in a shoulder, curving in by almost 5 m (true slopes, steeper toward the
// top). Over a second, bevelled cornice the crown: a stone band with CapitaLand's name toward the plaza, then the China
// Club's pale green glass behind five white louvre blades on posts, narrowing to the flat roof at 254 m.
// Heights: 254 m (CapitaLand, Wikipedia; CTBUH 255.4 m) and the mapped tiers (163, 190, 229 m) checked on a frontal
// photograph of the plaza face (CapitaLand); the funnel, ledges, atrium, vents, cornices and crown band measured on the
// same photograph by its 60 m width; the car park's eight storeys (28 m) estimated, its pool placed from the Esri aerial.
// See docs/capital-tower.md.
export const info = { name: 'Capital Tower', height: 254 };

const ID = { shaft: 510811294 };
const FACE = { sw: 212, nw: 302, ne: 32, se: 122 }; // the faces' outward bearings (the plaza, Cecil Street, the car park, Robinson Road)
// heights (m): the granite plinth round the wings and the lobby's glass; the atrium's ledge and the ledge across the
// plaza bay; the funnel's foot and canopy; the shaft's top and its cornice; the vent storey; the bays' glass boxes and
// their ledges; the sloping tier's top and its cornice; the crown's stone band, the louvre blades and the roof slab;
// the car park's roof (eight storeys)
const H = {
  plinth: 12, lobby: 8, atrium: 31, ledge: 91, funnel: 72, funnelTop: 94.2, shaft: 163, cornice: 164.2, vents: 172.5,
  box: 189.6, boxLedge: 190.8, tier: 228.6, tierCornice: 229.6, hip: 230.6, band: 235, blades: [236.6, 239.6, 242.6, 245.6, 248.6],
  roof: 252.4, roofTop: 253.6, top: 254, podium: 28
};
// the drawing (m), u toward Robinson Road (bearing 122°), v toward the car park (32°), as the mapped shaft ring gives it:
// the wings' rectangle, the bays' extent along u and their fronts, the sloping tier's top (way 510811296)
const WING = { u0: -30.1, u1: 30.0, v0: -25.3, v1: 17.0 };
const BAY = { u0: -21.4, u1: 20.9, sw: -28.2, ne: 20.9 };
const TIER = { u0: -25.3, u1: 25.4, v0: -20.6, v1: 12.5 };
const SLOT = 3.5; // half the slot's width up the middle of each bay
const SIDE_SLOT = [-6.0, -2.3]; // the narrower slot up the middle of the wings' end faces (along v)
// colours from daylight photographs (CapitaLand 2020s, Commons 2006–2018): the wings' pale warm grey stone, the windows
// in it; blue glass in the bays and the tier; the bays' salmon granite and pale spandrels; the slot's darker glass in grey
// mullions; the dark vents; the cornices' light grey; the crown's white blades and pale green glass; the plaza's pink
// granite paving and planters; the palms; the pool; CapitaLand's blue name and the bronze letters at the entrance
const C = {
  stone: 0xcdc7bc, window: 0x3d5470, glass: 0x587aa2, granite: 0xc49d86, spandrel: 0xc9ced3, slot: 0x2e4766,
  slotFrame: 0x5f6e7e, mullion: 0xa7b3be, vent: 0x5f666d, trim: 0xd8d4cb, blade: 0xe6e6e1, crownGlass: 0xa6cab6,
  paving: 0xcdb6a6, leaf: 0x4b7a37, pool: 0x5cb8cf, capitaland: 0x1f5fae, bronze: 0x6e5130
};

export function build(kit, site) {
  const shaftRing = site.parts.find((p) => p.id === ID.shaft)?.ring;
  if (!shaftRing?.length) throw new Error(`Capital Tower needs mapped way ${ID.shaft}`);
  const M = {
    // the wings: pale stone with two punched windows to a storey on each 9 m face
    wing: kit.facadeMaterial({ wall: C.stone, window: C.window, floorHeight: 4, bayWidth: 2.9, windowWidth: 0.5, windowHeight: 0.52, pattern: 'punched' }),
    // the bays: ribbons of blue glass, slim mullions 1.8 m apart, between granite spandrels (low, half the storey) and
    // pale silver ones (high, two fifths of it)
    bandLow: kit.facadeMaterial({ wall: C.granite, window: C.glass, floorHeight: 4, bayWidth: 1.8, windowWidth: 0.94, windowHeight: 0.5, pattern: 'punched' }),
    bandHigh: kit.facadeMaterial({ wall: C.spandrel, window: C.glass, floorHeight: 4, bayWidth: 1.8, windowWidth: 0.94, windowHeight: 0.6, pattern: 'punched' }),
    // the slots, the funnel, the atrium and the lobby: darker glass in a fine grid of grey mullions
    slot: kit.facadeMaterial({ wall: C.slotFrame, window: C.slot, floorHeight: 4, bayWidth: 1.5, pattern: 'curtain' }),
    // the glass boxes and the sloping tier: blue glass behind slim mullions a storey apart
    tier: kit.facadeMaterial({ wall: C.mullion, window: C.glass, floorHeight: 4, bayWidth: 1.6, windowWidth: 0.84, pattern: 'strips' }),
    // stone with tall dark vents: the plant storey over the shaft, the crown's band, the car park's screens
    vents: kit.facadeMaterial({ wall: C.stone, window: C.vent, floorHeight: 4.2, bayWidth: 3.2, windowWidth: 0.42, pattern: 'strips' }),
    trim: kit.material(C.trim, { roughness: 0.7 }), blade: kit.material(C.blade, { roughness: 0.5, metalness: 0.2 }),
    crownGlass: kit.glassMaterial(C.crownGlass), granite: kit.material(C.granite, { roughness: 0.6 }),
    paving: kit.material(C.paving), leaf: kit.material(C.leaf), pool: kit.material(C.pool, { roughness: 0.2 })
  };

  // --- the drawing, from the mapped shaft's extremes along u and v: independent of the anchor ----------------------------
  const U = kit.compass(FACE.se), V = kit.compass(FACE.ne);
  const dot = (p, a) => p[0] * a[0] + p[1] * a[1];
  const us = shaftRing.map((p) => dot(p, U)), vs = shaftRing.map((p) => dot(p, V));
  const du = (Math.min(...us) - WING.u0 + Math.max(...us) - WING.u1) / 2, dv = (Math.min(...vs) - BAY.sw + Math.max(...vs) - BAY.ne) / 2;
  const P = (u, v) => [U[0] * (u + du) + V[0] * (v + dv), U[1] * (u + du) + V[1] * (v + dv)];
  const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  const lerp = (a, b, t) => a + (b - a) * t;
  // a block in the drawing; one off the ground is solid to fly into as well (the ground's are by themselves)
  const box = (name, [u0, v0, u1, v1], y0, y1, material, top = M.trim) => {
    const part = kit.prism({ ring: rect(u0, v0, u1, v1), y0, y1, material, top, name });
    if (y0 > 0.5) kit.collisionPrism({ ring: part.ring, y0, y1 });
    return part;
  };
  // a rectangle grown by d m on every side (shrunk for a negative d), as a function of d
  const grown = ([u0, v0, u1, v1]) => (d) => rect(u0 - d, v0 - d, u1 + d, v1 + d);

  // --- the shaft, 0–163 m ----------------------------------------------------------------------------------------------
  // the core between the wings' end faces: granite to the plinth's top, stone over it (its end walls show only in the
  // end faces' slots, in the slots' glass)
  const core = [WING.u0 + 0.8, WING.v0, WING.u1 - 0.8, WING.v1];
  box('shaft-core-plinth', core, 0, H.plinth, M.granite);
  kit.prism({ ring: rect(...core), y0: H.plinth, y1: H.shaft, material: M.wing, edgeMaterial: (i) => (i % 2 ? M.slot : M.wing), top: M.trim, name: 'shaft-core' });
  kit.collisionPrism({ ring: rect(...core), y0: H.plinth, y1: H.shaft });
  // the wings' end faces toward Cecil Street and Robinson Road, 0.8 m deep: whole along the plinth, over it split by the slot
  for (const [side, a, b] of [['nw', WING.u0, WING.u0 + 0.8], ['se', WING.u1 - 0.8, WING.u1]]) {
    box(`shaft-end-${side}-plinth`, [a, WING.v0, b, WING.v1], 0, H.plinth, M.granite);
    box(`shaft-end-${side}-0`, [a, WING.v0, b, SIDE_SLOT[0]], H.plinth, H.shaft, M.wing);
    box(`shaft-end-${side}-1`, [a, SIDE_SLOT[1], b, WING.v1], H.plinth, H.shaft, M.wing);
  }
  // the corners beside the plaza bay, filled to the third storey in granite (ways 1558353296–97)
  box('base-corner-w', [WING.u0, -28.3, BAY.u0, WING.v0], 0, H.plinth, M.granite);
  box('base-corner-s', [BAY.u1, -28.3, WING.u1, WING.v0], 0, H.plinth, M.granite);

  // The bays, each in five columns along u: the outer and inner flanks either side of the slot. On the plaza face the
  // inner columns are the lobby (set back under the canopy) and the atrium's glass up to its ledge at 31 m; the inner
  // flanks then show pale spandrels, the outer ones granite up to the ledge across the bay at 91 m and pale over it.
  const COL = { outer: [[BAY.u0, -11], [11, BAY.u1]], inner: [[-11, -SLOT], [SLOT, 11]] };
  {
    const f = BAY.sw, back = WING.v0;
    COL.outer.forEach(([a, b], k) => {
      box(`shaft-sw-outer-${k}-base`, [a, f, b, back], 0, H.lobby, M.granite);
      box(`shaft-sw-outer-${k}-low`, [a, f, b, back], H.lobby, H.ledge, M.bandLow);
      box(`shaft-sw-outer-${k}-high`, [a, f, b, back], H.ledge, H.shaft, M.bandHigh);
    });
    COL.inner.forEach(([a, b], k) => box(`shaft-sw-inner-${k}`, [a, f, b, back], H.atrium, H.shaft, M.bandHigh));
    box('shaft-sw-slot', [-SLOT, f + 0.8, SLOT, back], H.atrium, H.shaft, M.slot);
    box('shaft-sw-atrium', [-11, f, 11, back], H.lobby, H.atrium, M.slot);
    box('base-lobby', [-11, f + 1.2, 11, back], 0, H.lobby, M.slot);
    // the atrium's ledge and the ledge across the bay
    box('shaft-sw-atrium-ledge', [-11.6, f - 1.3, 11.6, f + 0.2], H.atrium - 0.6, H.atrium + 0.2, M.trim);
    box('shaft-sw-ledge', [-19.5, f - 1.5, 19.5, f + 0.2], H.ledge - 0.6, H.ledge + 0.2, M.trim);
  }
  {
    const f = BAY.ne, back = WING.v1;
    COL.outer.forEach(([a, b], k) => {
      box(`shaft-ne-outer-${k}-low`, [a, back, b, f], 0, H.ledge, M.bandLow);
      box(`shaft-ne-outer-${k}-high`, [a, back, b, f], H.ledge, H.shaft, M.bandHigh);
    });
    COL.inner.forEach(([a, b], k) => box(`shaft-ne-inner-${k}`, [a, back, b, f], 0, H.shaft, M.bandHigh));
    box('shaft-ne-slot', [-SLOT, back, SLOT, f - 0.8], 0, H.shaft, M.slot);
  }

  // The funnel on the plaza face's slot: a half cone of glass in slim mullions widening upward from 72 m to 94 m, under a
  // half-round canopy; drawn as half rings about the slot's face
  const slotFace = BAY.sw + 0.8;
  const half = (r, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = (Math.PI * i) / n; return P(r * Math.cos(a), slotFace + 0.1 - r * Math.sin(a)); });
  kit.loft({ ring: half(2.8), topRing: half(7), y0: H.funnel, y1: H.funnelTop, material: M.tier, top: M.trim, name: 'funnel-glass' });
  kit.prism({ ring: half(8.6, 14), y0: H.funnelTop, y1: H.funnelTop + 1, material: M.trim, top: M.trim, name: 'funnel-canopy' });
  kit.collisionPrism({ ring: half(7), y0: H.funnel, y1: H.funnelTop + 1 });

  // --- the cornice at 163 m: a slab 1.3 m proud of the shaft's whole plan over a bevelled soffit -------------------------
  // the shaft's plan (the core, the wings, the two bays) grown by d m
  const plan = (d) => [[BAY.u0 - d, BAY.ne + d], [BAY.u1 + d, BAY.ne + d], [BAY.u1 + d, WING.v1 + d], [WING.u1 + d, WING.v1 + d],
    [WING.u1 + d, WING.v0 - d], [BAY.u1 + d, WING.v0 - d], [BAY.u1 + d, BAY.sw - d], [BAY.u0 - d, BAY.sw - d], [BAY.u0 - d, WING.v0 - d],
    [WING.u0 - d, WING.v0 - d], [WING.u0 - d, WING.v1 + d], [BAY.u0 - d, WING.v1 + d]].map(([u, v]) => P(u, v));
  // a ledge round `ringAt(0)`: a slab `out` m proud from y0 to y1 over a soffit bevelled back to the wall 0.9 m lower
  // (y0 a little under the top of what it caps, so that their tops never lie at one height)
  const ledge = (name, ringAt, y0, y1, out) => {
    kit.loft({ ring: ringAt(-0.3), topRing: ringAt(out), y0: y0 - 0.9, y1: y0, material: M.trim, top: M.trim, name: `${name}-soffit` });
    kit.prism({ ring: ringAt(out), y0, y1, material: M.trim, top: M.trim, name });
    kit.collisionPrism({ ring: ringAt(out), y0: y0 - 0.9, y1 });
  };
  ledge('band-cornice', plan, H.shaft - 0.3, H.cornice, 1.3);

  // --- 163–190 m: the plant storey round the wings and the bays' glass boxes ------------------------------------------
  box('band-vents', [WING.u0, WING.v0, WING.u1, WING.v1], H.cornice, H.vents, M.vents);
  for (const [side, v0, v1] of [['sw', BAY.sw, WING.v0 + 0.7], ['ne', WING.v1 - 1, BAY.ne]]) {
    const r = rect(BAY.u0, v0, BAY.u1, v1);
    kit.prism({ ring: r, y0: H.cornice, y1: H.box, material: M.tier, top: M.trim, name: `band-box-${side}` });
    kit.collisionPrism({ ring: r, y0: H.cornice, y1: H.box });
    ledge(`band-box-${side}-ledge`, grown([BAY.u0, v0, BAY.u1, v1]), H.box + 0.2, H.boxLedge, 1.2);
  }

  // --- 172–229 m: the sloping tier, from the wings' rectangle to the mapped top, in six lofts along a convex curve ----------
  const tierAt = (y) => {
    const w = Math.pow(Math.max(0, (y - H.vents) / (H.tier - H.vents)), 2.2);
    return [lerp(WING.u0, TIER.u0, w), lerp(WING.v0, TIER.v0, w), lerp(WING.u1, TIER.u1, w), lerp(WING.v1, TIER.v1, w)];
  };
  const STEPS = [H.vents, 186, 198, 207.5, 215.5, 222.5, H.tier];
  for (let k = 0; k + 1 < STEPS.length; k++) {
    const lo = rect(...tierAt(STEPS[k])), hi = rect(...tierAt(STEPS[k + 1]));
    kit.loft({ ring: lo, topRing: hi, y0: STEPS[k], y1: STEPS[k + 1], material: M.tier, top: M.trim, name: `tier-${k}` });
    kit.collisionPrism({ ring: hi, y0: STEPS[k], y1: STEPS[k + 1] });
  }
  // the slots carried on up into the tier as dark slits: over the glass boxes' ledges on the bays' faces, from the plant
  // storey on the end faces; each a sliver of dark glass 0.3 m proud of its face, in a piece for each of the tier's lofts
  // (so that it follows the face's bends), each piece running on 5 cm into the next loft so their tops never meet the
  // tier's at one height
  const slit = (name, face, [a, b], y0, y1) => {
    const at = (y) => {
      const [u0, v0, u1, v1] = tierAt(y);
      if (face === 'sw') return rect(a, v0 - 0.3, b, v0 + 1);
      if (face === 'ne') return rect(a, v1 - 1, b, v1 + 0.3);
      if (face === 'nw') return rect(u0 - 0.3, a, u0 + 1, b);
      return rect(u1 - 1, a, u1 + 0.3, b);
    };
    let from = y0;
    for (let k = 0; k + 1 < STEPS.length && from < y1; k++) {
      if (STEPS[k + 1] <= from) continue;
      const to = Math.min(y1, STEPS[k + 1] + 0.05);
      kit.loft({ ring: at(from), topRing: at(to), y0: from, y1: to, material: M.slot, top: M.slot, name: `tier-slit-${name}-${k}` });
      from = to;
    }
  };
  slit('sw', 'sw', [-3, 3], H.boxLedge, 201.5);
  slit('ne', 'ne', [-3, 3], H.boxLedge, 201.5);
  slit('nw', 'nw', [SIDE_SLOT[0] + 0.3, SIDE_SLOT[1] - 0.3], H.vents, 204);
  slit('se', 'se', [SIDE_SLOT[0] + 0.3, SIDE_SLOT[1] - 0.3], H.vents, 204);
  // the cornice at 229 m, its top bevelled up to the crown's band
  const tierTop = grown([TIER.u0, TIER.v0, TIER.u1, TIER.v1]);
  ledge('crown-cornice', tierTop, H.tier - 0.3, H.tierCornice, 1.3);
  const bandRect = [TIER.u0 + 2.3, TIER.v0 + 2.3, TIER.u1 - 2.3, TIER.v1 - 2.3];
  const band = rect(...bandRect);
  kit.loft({ ring: tierTop(1.3), topRing: band, y0: H.tierCornice, y1: H.hip, material: M.trim, top: M.trim, name: 'crown-cornice-hip' });

  // --- the crown: the stone band, the club's glass behind five louvre blades on posts, the flat roof ------------------------
  // the band: plain stone toward the plaza and the car park (a dark vent panel near each end), narrow dark openings in
  // groups along the side faces
  kit.prism({ ring: band, y0: H.tierCornice, y1: H.band, material: M.trim, edgeMaterial: (i) => (i % 2 ? M.vents : M.trim), top: M.trim, name: 'crown-band' });
  kit.collisionPrism({ ring: band, y0: H.tier, y1: H.band });
  for (const [side, v0, v1] of [['sw', bandRect[1] - 0.15, bandRect[1] + 0.1], ['ne', bandRect[3] - 0.1, bandRect[3] + 0.15]]) {
    for (const u of [bandRect[0] + 3, bandRect[2] - 6]) box(`crown-band-vent-${side}-${u > 0 ? 'e' : 'w'}`, [u, v0, u + 3, v1], H.hip + 0.2, H.band - 0.8, M.slot, M.slot);
  }
  const inBand = (d) => rect(bandRect[0] + d, bandRect[1] + d, bandRect[2] - d, bandRect[3] - d);
  const glassIn = (y) => 2.4 + (y - H.band) / (H.roof - H.band); // the glass's inset from the band, sloping in by 1 m
  kit.loft({ ring: inBand(glassIn(H.band)), topRing: inBand(glassIn(H.roof)), y0: H.band, y1: H.roof, material: M.crownGlass, top: M.trim, name: 'crown-glass' });
  kit.collisionPrism({ ring: inBand(glassIn(H.roof)), y0: H.band, y1: H.roof });
  // a blade is a frame of four trapezoids from the glass out to its edge, each blade 0.45 m narrower than the one below
  const frame = (outer, inner) => outer.map((_, i) => { const j = (i + 1) % outer.length; return [outer[i], outer[j], inner[j], inner[i]]; });
  H.blades.forEach((y, k) => {
    frame(inBand(0.2 + 0.45 * k), inBand(glassIn(y) + 0.1)).forEach((q, i) => kit.prism({ ring: q, y0: y, y1: y + 0.4, material: M.blade, top: M.blade, name: `crown-blade-${k}-${i}` }));
  });
  const roofRing = inBand(2.1);
  kit.prism({ ring: roofRing, y0: H.roof, y1: H.roofTop, material: M.blade, top: M.trim, name: 'crown-roof' });
  kit.prism({ ring: inBand(6), y0: H.roofTop, y1: H.top, material: M.trim, top: M.trim, name: 'crown-roof-plant' });
  kit.collisionPrism({ ring: roofRing, y0: H.roof, y1: H.top });
  // the posts: from the band at the lowest blade's edge to the roof's edge, every 6–7 m along each face and at the corners
  const bottom = inBand(0.25), topLine = inBand(2.35);
  bottom.forEach((a, i) => {
    const j = (i + 1) % bottom.length, b = bottom[j], ta = topLine[i], tb = topLine[j];
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6.5));
    for (let s = 0; s < n; s++) {
      const t = s / n;
      kit.beam({ from: [lerp(a[0], b[0], t), H.band, lerp(a[1], b[1], t)], to: [lerp(ta[0], tb[0], t), H.roof, lerp(ta[1], tb[1], t)], w: 0.35, h: 0.35, material: M.blade, name: `crown-post-${i}-${s}` });
    }
  });

  // --- the car park on the north-east side (way 1558353295), eight storeys, and the club's deck on its roof ---------------
  const podium = [[WING.u0, WING.v1], [BAY.u0, WING.v1], [BAY.u0, BAY.ne], [BAY.u1, BAY.ne], [BAY.u1, WING.v1], [WING.u1, WING.v1],
    [WING.u1, 32.3], [10.3, 32.3], [10.3, 37], [-7.4, 37], [-7.4, 32.5], [WING.u0, 32.5]].map(([u, v]) => P(u, v));
  kit.prism({ ring: podium, y0: 0, y1: H.podium, material: M.vents, top: M.paving, name: 'podium' });
  kit.collisionPrism({ ring: podium, y0: 0, y1: H.podium + 0.4 });
  const deck = H.podium;
  box('podium-pool-deck', [-1.5, 21.4, 22.5, 31.6], deck, deck + 0.25, M.paving, M.paving);
  box('podium-pool', [0.5, 22.6, 20.5, 29.6], deck + 0.25, deck + 0.35, M.paving, M.pool);
  box('podium-sundeck', [22.5, 21.4, 29.5, 31.8], deck, deck + 0.4, M.trim, M.trim);
  // umbrellas along the pool's far side, as the aerial shows them
  for (let k = 0; k < 5; k++) {
    const [x, z] = P(2.5 + k * 4.2, 30.6);
    kit.cylinder({ x, z, y0: deck + 0.25, y1: deck + 2.4, r: 0.06, segments: 4, material: M.trim, top: M.trim, name: `podium-umbrella-${k}-pole` });
    kit.loft({ ring: Array.from({ length: 8 }, (_, i) => [x + Math.cos((i * Math.PI) / 4) * 1.3, z + Math.sin((i * Math.PI) / 4) * 1.3]), y0: deck + 2.2, y1: deck + 2.7, scale: 0.15, material: M.granite, top: M.granite, name: `podium-umbrella-${k}` });
  }
  // the roof garden over the rest of the deck: beds with small trees, clear of the tower
  box('podium-garden-0', [-29.3, 21.8, -3.5, 26], deck, deck + 0.6, M.granite, M.leaf);
  box('podium-garden-1', [-29.3, 28, -9, 31.7], deck, deck + 0.6, M.granite, M.leaf);
  const tree = (u, v, y, h, r, name) => {
    const [x, z] = P(u, v), around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.45, r: 0.16, segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.4, y1: y + h * 0.65, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.65, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  };
  [[-26, 23.9], [-19, 23.9], [-12, 23.9], [-6, 23.9], [-25, 29.9], [-17, 29.9], [-11.5, 29.9]].forEach(([u, v], k) => tree(u, v, deck + 0.6, 4.5 + (k % 3) * 0.6, 1.6, `podium-garden-${k}`));
  // the deck's parapet along its open edges (not against the tower)
  podium.forEach((a, i) => {
    if (i < 5) return; // the edges against the tower: from the north-west wing round the bay to the south-east wing
    const b = podium[(i + 1) % podium.length];
    kit.beam({ from: [a[0], deck + 0.55, a[1]], to: [b[0], deck + 0.55, b[1]], w: 0.25, h: 1.1, material: M.trim, name: `podium-parapet-${i}` });
  });

  // --- the plaza front: the forecourt, the entrance canopy, the palms --------------------------------------------------------
  box('base-forecourt', [WING.u0 + 0.1, BAY.sw - 5.8, WING.u1 - 0.1, BAY.sw + 1.25], 0, 0.32, M.paving, M.paving);
  // the canopy: curved glass over the entrance, 6 m up, hung from the lobby's face and carried on two posts at its edge
  const arc = Array.from({ length: 9 }, (_, i) => { const u = -9 + (18 * i) / 8; return P(u, BAY.sw - 5.4 * (1 - (u / 9) ** 2)); });
  const canopy = [...arc, P(9, BAY.sw + 1.1), P(-9, BAY.sw + 1.1)];
  kit.prism({ ring: canopy, y0: 5.6, y1: 6.0, material: M.crownGlass, top: M.crownGlass, name: 'base-canopy' });
  kit.collisionPrism({ ring: canopy, y0: 5.6, y1: 6.0 });
  for (let i = 0; i + 1 < arc.length; i++) kit.beam({ from: [arc[i][0], 6.1, arc[i][1]], to: [arc[i + 1][0], 6.1, arc[i + 1][1]], w: 0.25, h: 0.3, material: M.trim, name: `base-canopy-edge-${i}` });
  for (const u of [-5.5, 5.5]) {
    const [x, z] = P(u, BAY.sw - 5.4 * (1 - (u / 9) ** 2) + 0.4);
    kit.beam({ from: [x, 0.32, z], to: [x, 5.6, z], w: 0.3, h: 0.3, material: M.trim, name: `base-canopy-post-${u}` });
  }
  // palms in granite planters along the forecourt's edge
  const palm = (u, v, name) => {
    const [x, z] = P(u, v);
    kit.prism({ ring: rect(u - 1.2, v - 1.2, u + 1.2, v + 1.2), y0: 0.32, y1: 0.9, material: M.granite, top: M.leaf, name: `${name}-planter` });
    kit.cylinder({ x, z, y0: 0.9, y1: 8.4, r: 0.22, segments: 5, material: M.paving, top: M.paving, name: `${name}-trunk` });
    const star = Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5, rr = i % 2 ? 1.0 : 3; return [x + Math.cos(a) * rr, z + Math.sin(a) * rr]; });
    kit.loft({ ring: star.map(([px, pz]) => [x + (px - x) * 0.25, z + (pz - z) * 0.25]), topRing: star, y0: 7.8, y1: 9.1, material: M.leaf, top: M.leaf, name: `${name}-palm-crown` });
  };
  [[-25, -31.4], [-15.5, -31.4], [15.5, -31.4], [25, -31.4]].forEach(([u, v], k) => palm(u, v, `base-palm-${k}`));

  // --- signs: CapitaLand's name on the crown's band toward the plaza; the tower's name in bronze beside the entrance ------
  kit.hang({ ring: band, top: H.band, toward: FACE.sw, below: 1.0, out: 0.3, text: 'CapitaLand', height: 2.8, maxWidth: 12.5, color: C.capitaland, font: '600 110px "Segoe UI", Helvetica, Arial, sans-serif', name: 'sign:capitaland' });
  kit.hang({ ring: rect(11, BAY.sw, BAY.u1, WING.v0 + 0.3), top: H.lobby, toward: FACE.sw, below: 3.2, out: 0.06, margin: 1, text: 'CAPITAL TOWER', height: 0.75, color: C.bronze, name: 'sign:capital-tower' });
}
