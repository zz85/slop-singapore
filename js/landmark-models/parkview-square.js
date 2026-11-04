// The Neo-Art-Deco "Gotham" tower at 600 North Bridge Road: charcoal plinth, striped
// stone-and-glass shaft, bronze crown screen with its eight statues, stepped fins and
// the green roof lantern, over the statue plaza with the golden crane.
// See docs/parkview-square.md for the drawing frame and reference photographs.
export const info = { name: 'Parkview Square', height: 144 };

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

  const darkStone = kit.material(0x4a484c);
  const roofGrey = kit.material(0x6d6a66);
  const bronze = kit.material(0x8a6a42, { roughness: 0.38, metalness: 0.55 });
  const gold = kit.material(0xc9a227, { roughness: 0.3, metalness: 0.65 });
  const paving = kit.material(0x9a9184);
  const lanternGlass = kit.glassMaterial(0x8fb8ad);
  const plinthFacade = kit.facadeMaterial({ wall: 0x4c4a4c, window: 0x8a795c, pattern: 'punched', floorHeight: 8, bayWidth: 4.2, windowWidth: 0.55, windowHeight: 0.5 });
  const bandFacade = kit.facadeMaterial({ wall: 0x4c4a4c, window: 0x242526, pattern: 'strips', floorHeight: 5, bayWidth: 1.8, windowWidth: 0.65 });
  const shaftFacade = kit.facadeMaterial({ wall: 0xcbb391, window: 0x33393f, pattern: 'strips', floorHeight: 4.4, bayWidth: 1.55, windowWidth: 0.6 });
  const glassField = kit.facadeMaterial({ wall: 0x2e3134, window: 0x54626e, pattern: 'curtain', floorHeight: 4.4, bayWidth: 1.55 });
  const screenFacade = kit.facadeMaterial({ wall: 0x8a6f4d, window: 0x37302a, pattern: 'curtain', floorHeight: 2.3, bayWidth: 1.1 });

  // The mapped 1-level plaza deck north-west of the tower, and the tower's charcoal plinth.
  kit.prism({ ring: plaza, y1: 0.9, material: paving, top: paving, name: 'plaza-deck', outlineCollision: true });
  box(30.5, 13.35, { y: 0, w: 61, h: 32, d: 26.7, material: plinthFacade, top: darkStone, name: 'plinth' });
  // The level 6-8 band, keeping the mapper's dark colonnade centre and tan ends.
  solid(28.9, 13.35, { y: 32, w: 40.4, h: 10, d: 26.7, material: bandFacade, top: darkStone, name: 'colonnade-band' });
  solid(4.35, 13.35, { y: 32, w: 8.7, h: 10, d: 26.7, material: shaftFacade, top: darkStone, name: 'band-end-sw' });
  solid(55.05, 13.35, { y: 32, w: 11.9, h: 10, d: 26.7, material: shaftFacade, top: darkStone, name: 'band-end-ne' });

  // The striped shaft in two lifts either side of its dark string course.
  solid(30.5, 13.35, { y: 42, w: 61, h: 42.5, d: 26.7, material: shaftFacade, top: roofGrey, name: 'shaft-lower' });
  solid(30.5, 13.35, { y: 84.5, w: 61.9, h: 1.5, d: 27.6, material: darkStone, top: darkStone, name: 'string-course' });
  solid(30.5, 13.35, { y: 86, w: 61, h: 26, d: 26.7, material: shaftFacade, top: roofGrey, name: 'shaft-upper' });

  // Dark glass centre fields proud of the stripes, and the dark corner bays.
  for (const b of [-0.1, 26.8]) box(30.5, b, { y: 42, w: 37, h: 69.7, d: 0.35, material: glassField, top: darkStone, name: 'glass-centre-field' });
  for (const a of [-0.1, 61.1]) box(a, 13.35, { y: 42, w: 0.35, h: 69.7, d: 5.5, material: glassField, top: darkStone, name: 'glass-end-slot' });
  for (const [a, b] of [[0.85, 0.85], [60.15, 0.85], [0.85, 25.85], [60.15, 25.85]]) {
    box(a, b, { y: 42, w: 2.2, h: 69.7, d: 2.2, material: glassField, top: darkStone, name: 'corner-bay' });
  }

  // Crown: cornice, the inset bronze grille screen and its own cornice.
  solid(30.5, 13.35, { y: 112, w: 61.7, h: 2, d: 27.4, material: darkStone, top: darkStone, name: 'crown-cornice' });
  solid(30.5, 13.35, { y: 114, w: 57.8, h: 14, d: 23.5, material: screenFacade, top: darkStone, name: 'crown-screen' });
  solid(30.5, 13.35, { y: 128, w: 58.6, h: 1.2, d: 24.3, material: darkStone, top: darkStone, name: 'screen-cornice' });

  // Four giant statues on plinths before the screen on each broad (long) side.
  for (const b of [0.55, 26.15]) for (const a of [12, 24, 37, 49]) {
    box(a, b, { y: 114, w: 1.1, h: 1.2, d: 1.1, material: darkStone, top: darkStone, name: 'crown-statue-plinth' });
    box(a, b, { y: 115.2, w: 0.9, h: 8, d: 0.9, material: bronze, top: bronze, name: 'crown-statue' });
    const [x, z] = point(a, b);
    kit.cylinder({ x, z, y0: 123.2, y1: 124.1, r: 0.5, segments: 10, material: gold, top: gold, name: 'crown-statue-ball' });
  }

  // Stepped transverse fins along the front of the roof, the glass lantern behind them.
  for (const a of [18, 30.5, 43]) {
    solid(a, 5, { y: 129.2, w: 1.8, h: 8.8, d: 8, material: darkStone, top: darkStone, name: 'crown-fin' });
    solid(a, 5, { y: 138, w: 1.8, h: 3, d: 4.5, material: darkStone, top: darkStone, name: 'crown-fin-step' });
  }
  solid(30.5, 5, { y: 141, w: 1.8, h: 3, d: 2.6, material: darkStone, top: darkStone, name: 'crown-fin-tip' });
  solid(30.5, 16, { y: 126, w: 22, h: 13.5, d: 13, material: lanternGlass, top: roofGrey, name: 'roof-lantern' });
  const capRing = plan([[24.5, 12.5], [36.5, 12.5], [36.5, 19.5], [24.5, 19.5]]);
  kit.loft({ ring: capRing, y0: 139.5, y1: 141.5, scale: 0.3, material: lanternGlass, top: lanternGlass, name: 'roof-lantern-cap' });
  kit.collisionPrism({ ring: plan([[27, 14], [34, 14], [34, 18], [27, 18]]), y0: 139.5, y1: 141.5 });

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
