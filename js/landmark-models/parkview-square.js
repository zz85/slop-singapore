// The Neo-Art-Deco "Gotham" tower at 600 North Bridge Road: charcoal granite plinth, warm tan
// granite shaft cut by dark bronze-glass slots, the dark glass centre bay on each broad face
// under its bronze crown grille with four statues and four stepped fins, the taller tan pylons
// either side, the lower stepped corner tiers and the long green-glass roof lantern, over the
// statue plaza with the golden crane. See docs/parkview-square.md for the drawing frame and
// reference photographs.
export const info = { name: 'Parkview Square', height: 144 };

// Along the long faces (a, metres north-east from the south corner): corner tier, dark glass
// recess, tan pylon, then the centre bay between the statue piers, and the same mirrored.
const L = 61, D = 26.7;
const TIER = 8.9, RECESS = 2.2, PYLON = 7.8;
const BAY0 = TIER + RECESS + PYLON, BAY1 = L - BAY0;
const DECK = 132.8; // the roof deck: the grille's cornice and the ends' attics
const PIERS = [0, 1, 2, 3].map(k => BAY0 + k * (BAY1 - BAY0) / 3);

export function build(kit, site) {
  const mapped = id => site.parts.find(p => p.id === id).ring;
  const tower = mapped(560274695);
  const plaza = mapped(560274694);
  const u = kit.compass(44), v = kit.compass(314);
  const dot = ([x, z], [a, b]) => x * a + z * b;
  const origin = tower.reduce((a, b) => dot(a, u) + dot(a, v) < dot(b, u) + dot(b, v) ? a : b);
  const point = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const box = (a, b, options) => {
    const [x, z] = point(a, b);
    return kit.box({ x, z, yaw: Math.atan2(u[1], u[0]), ...options });
  };
  const plan = points => points.map(([a, b]) => point(a, b));
  const solid = (a, b, options) => {
    const part = box(a, b, options);
    kit.collisionPrism({ ring: part.ring, y0: part.y0, y1: part.y1 });
    return part;
  };
  // A block from corner (a0, b0) to (a1, b1); its first wall is the one along a at b0, so a
  // facade's bays start at that corner (uv runs on round the ring).
  const block = (a0, b0, a1, b1, y0, y1, material, top, name, collide = true) => {
    const ring = plan([[a0, b0], [a1, b0], [a1, b1], [a0, b1]]);
    const part = kit.prism({ ring, y0, y1, material, top, name });
    if (collide) kit.collisionPrism({ ring, y0, y1 });
    return part;
  };

  const darkStone = kit.material(0x3f3b39);
  const tanStone = kit.material(0xb8a48a);
  const bronze = kit.material(0x7d5a39, { roughness: 0.38, metalness: 0.55 });
  const gold = kit.material(0xd8c38a, { roughness: 0.3, metalness: 0.5 });
  const paving = kit.material(0x9a9184);
  const darkGlass = kit.glassMaterial(0x2a2623);
  const lanternGlass = kit.glassMaterial(0x6f9c8c);
  const plinthFacade = kit.facadeMaterial({ wall: 0x403c3b, window: 0x2a2018, pattern: 'punched', floorHeight: 8, bayWidth: 4.2, windowWidth: 0.6, windowHeight: 0.5 });
  const bandFacade = kit.facadeMaterial({ wall: 0x46423f, window: 0x26221f, pattern: 'strips', floorHeight: 5, bayWidth: 1.8, windowWidth: 0.6 });
  // Tan granite with narrow dark slots running the shaft's height (no floor lines: the slots'
  // spandrels are dark bronze); bays sized so every face starts and ends on a pier.
  const slots = bay => kit.facadeMaterial({ wall: 0xb8a48a, window: 0x332d29, pattern: 'strips', floorHeight: 150, bayWidth: bay, windowWidth: 1.3 / bay });
  const tierStone = slots(D / 6), pylonStone = slots((D + 0.6) / 7);
  // The centre bays: six tall dark bronze-glass fields between narrow tan piers.
  const centreField = kit.facadeMaterial({ wall: 0xa8937a, window: 0x332d29, pattern: 'strips', floorHeight: 150, bayWidth: (BAY1 - BAY0 - 0.1) / 6, windowWidth: 0.72 });
  const grille = kit.facadeMaterial({ wall: 0x7a5a3c, window: 0x2d2620, pattern: 'curtain', floorHeight: 1.6, bayWidth: 1.3 });

  // The mapped 1-level plaza deck north-west of the tower, and the charcoal granite plinth.
  kit.prism({ ring: plaza, y1: 0.9, material: paving, top: paving, name: 'plaza-deck', outlineCollision: true });
  box(L / 2, D / 2, { y: 0, w: L, h: 32, d: D, material: plinthFacade, top: darkStone, name: 'plinth' });
  // The level 6-8 band keeps the mapper's dark colonnade (centre bay, pylons and recesses);
  // the tan corner tiers start there, set back with a cornice at 58 m and 113 m, capped at 125 m,
  // and an attic in the middle of each end carries the lantern up to the roof deck.
  solid(L / 2, D / 2, { y: 32, w: L - 2 * TIER, h: 10, d: D, material: bandFacade, top: darkStone, name: 'colonnade-band' });
  for (const [a0, a1, end] of [[0, TIER, 0], [L - TIER, L, L]]) {
    const side = end ? 'ne' : 'sw', inA = end ? [a0, a1 - 1.2] : [a0 + 1.2, a1];
    block(a0, 0, a1, D, 32, 113, tierStone, darkStone, `corner-tier-${side}`);
    for (const y of [58, 112.4]) box((a0 + a1) / 2, D / 2, { y, w: TIER + 0.5, h: 0.8, d: D + 0.5, material: darkStone, top: darkStone, name: 'tier-cornice' });
    block(inA[0], 1.2, inA[1], D - 1.2, 113, 124, tierStone, darkStone, `corner-tier-top-${side}`);
    solid((inA[0] + inA[1]) / 2, D / 2, { y: 124, w: TIER - 0.7, h: 1, d: D - 1.9, material: darkStone, top: darkStone, name: 'tier-cap' });
    const attic = end ? [L - TIER - RECESS + 0.1, inA[1]] : [inA[0], TIER + RECESS - 0.1];
    block(attic[0], 5, attic[1], D - 5, 125, DECK, tierStone, darkStone, `end-attic-${side}`);
    // The dark glass strip up the middle of each end face.
    box(end ? L + 0.1 : -0.1, D / 2, { y: 42, w: 0.2, h: 70, d: 3.4, material: darkGlass, top: darkStone, name: 'end-glass-strip' });
  }
  // The dark glass recesses between the corner tiers and the pylons, up to the attics' foot.
  for (const a0 of [TIER, L - TIER - RECESS]) block(a0, 0.7, a0 + RECESS, D - 0.7, 42, 125.3, darkGlass, darkStone, 'glass-recess');
  // The tan pylons framing the centre bay, standing a little proud and rising highest.
  for (const a0 of [TIER + RECESS, BAY1]) {
    block(a0, -0.3, a0 + PYLON, D + 0.3, 42, 132.5, pylonStone, darkStone, 'pylon');
    solid(a0 + PYLON / 2, D / 2, { y: 132.5, w: PYLON + 0.5, h: 1.2, d: D + 1.1, material: darkStone, top: darkStone, name: 'pylon-cornice' });
  }

  // The centre bay: a dark core behind the two glass fields, which sit back from the pylons.
  block(BAY0 + 0.1, 0.9, BAY1 - 0.1, D - 0.9, 42, 114.9, darkStone, darkStone, 'centre-core');
  block(BAY0 + 0.05, 0.6, BAY1 - 0.05, 1.0, 42, 115, centreField, darkStone, 'glass-centre-field', false);
  block(BAY1 - 0.05, D - 0.6, BAY0 + 0.05, D - 1.0, 42, 115, centreField, darkStone, 'glass-centre-field', false);

  // Crown: the cornice over the centre bay, the inset bronze grille screen and its own cornice,
  // whose top is the roof deck.
  solid((BAY0 + BAY1) / 2, D / 2, { y: 115, w: BAY1 - BAY0, h: 2, d: D - 0.4, material: darkStone, top: darkStone, name: 'crown-cornice' });
  solid((BAY0 + BAY1) / 2, D / 2, { y: 117, w: BAY1 - BAY0, h: 15, d: D - 1.2, material: grille, top: darkStone, name: 'crown-screen' });
  solid((BAY0 + BAY1) / 2, D / 2, { y: 132, w: BAY1 - BAY0, h: DECK - 132, d: D - 0.6, material: darkStone, top: darkStone, name: 'screen-cornice' });

  // On each broad face, a giant statue on each of the four piers of the grille, holding a light
  // globe, and over each pier a stepped fin rising from the face to the 144 m crown.
  for (const [b, inward] of [[0, 1], [D, -1]]) for (const a of PIERS) {
    box(a, b, { y: 117, w: 1.4, h: 1.2, d: 1.4, material: darkStone, top: darkStone, name: 'crown-statue-plinth' });
    box(a, b, { y: 118.2, w: 1.4, h: 9.2, d: 1.1, material: bronze, top: bronze, name: 'crown-statue' });
    const [x, z] = point(a, b);
    kit.cylinder({ x, z, y0: 127.4, y1: 128.4, r: 0.55, segments: 10, material: gold, top: gold, name: 'crown-statue-ball' });
    const back = b + inward * 6.0;
    for (const [y0, y1, w, front, name] of [[DECK, 136, 4, 0.3, 'crown-fin'], [136, 139, 3.1, 1.2, 'crown-fin-step'], [139, 141.8, 2.2, 2.1, 'crown-fin-step'], [141.8, 144, 1.3, 3, 'crown-fin-tip']]) {
      const b0 = b + inward * front;
      solid(a, (b0 + back) / 2, { y: y0, w, h: y1 - y0, d: Math.abs(back - b0), material: tanStone, top: darkStone, name });
    }
  }

  // The long green-glass lantern on the roof deck, its corners cut, between the two rows of fins.
  const lantern = plan([[8.5, 6.8], [L - 8.5, 6.8], [L - 6.5, 8.8], [L - 6.5, D - 8.8], [L - 8.5, D - 6.8], [8.5, D - 6.8], [6.5, D - 8.8], [6.5, 8.8]]);
  kit.prism({ ring: lantern, y0: DECK, y1: 138.8, material: lanternGlass, top: lanternGlass, name: 'roof-lantern' });
  kit.collisionPrism({ ring: lantern, y0: DECK, y1: 138.8 });
  kit.loft({ ring: lantern, y0: 138.8, y1: 140.2, scale: 0.85, material: lanternGlass, top: lanternGlass, name: 'roof-lantern-cap' });

  // The golden crane at the plaza centre, with effigy stubs around the deck.
  box(30, 45, { y: 0.9, w: 1.4, h: 1.1, d: 1.4, material: darkStone, top: darkStone, name: 'golden-crane-plinth' });
  const [gx, gz] = point(30, 45);
  const [hx, hz] = point(31.6, 46.2);
  kit.beam({ from: [gx, 1.9, gz], to: [hx, 4.6, hz], w: 0.42, h: 0.42, material: gold, name: 'golden-crane' });
  kit.box({ x: hx, z: hz, y: 4.45, w: 1.5, h: 0.5, d: 0.45, yaw: Math.atan2(u[1], u[0]) + 0.5, material: gold, top: gold, name: 'golden-crane-head' });
  kit.collisionPrism({ ring: plan([[29.2, 44.2], [31.4, 44.2], [31.4, 46.4], [29.2, 46.4]]), y0: 0.9, y1: 4.9 });
  for (const a of [8, 52]) for (const b of [34, 45, 56]) {
    box(a, b, { y: 0.9, w: 0.55, h: 2.1, d: 0.55, material: bronze, top: bronze, name: 'plaza-effigy' });
  }
}
