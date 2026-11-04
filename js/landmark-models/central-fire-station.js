// The 1908-09 Hill Street fire station: red-brick ranges with white "bandage" bands around an
// open drill yard. The street front faces Hill Street to the east: the white pedimented
// frontispiece between its twin green-domed turrets, the striped hose tower centred behind it,
// red arched doors between red-and-white striped piers along the 1909 block and the lower
// extension to the north, under white parapets with pinnacles.
// See docs/central-fire-station.md for the drawing frame and reference photographs.
export const info = { name: 'Central Fire Station', height: 34 };

export function build(kit, site) {
  const ring = site.parts.find(p => p.id === 172368086).ring;
  const u = kit.compass(117), v = kit.compass(27);
  const dot = ([x, z], [a, b]) => x * a + z * b;
  const origin = ring.reduce((a, b) => dot(a, u) + dot(a, v) < dot(b, u) + dot(b, v) ? a : b);
  const point = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const box = (a, b, options) => {
    const [x, z] = point(a, b);
    return kit.box({ x, z, yaw: Math.atan2(u[1], u[0]), ...options });
  };
  const plan = points => points.map(([a, b]) => point(a, b));
  // A slab on the Hill Street side whose first wall is its street face at a1, running from b0
  // to b1, so a facade's bays start at b0.
  const facing = (a0, a1, b0, b1, y0, y1, material, top, name) => {
    const r = plan([[a1, b0], [a1, b1], [a0, b1], [a0, b0]]);
    const part = kit.prism({ ring: r, y0, y1, material, top, name });
    kit.collisionPrism({ ring: r, y0, y1 });
    return part;
  };

  const brickGround = kit.facadeMaterial({ wall: 0x96422f, window: 0xe3e0d5, pattern: 'punched', floorHeight: 4.8, bayWidth: 3.2, windowWidth: 0.42, windowHeight: 0.55 });
  const brickUpper = kit.facadeMaterial({ wall: 0x9a4633, window: 0xdedbd0, pattern: 'punched', floorHeight: 3.7, bayWidth: 2.9, windowWidth: 0.52, windowHeight: 0.62 });
  const attic = kit.facadeMaterial({ wall: 0xf0ece1, window: 0x39474d, pattern: 'punched', floorHeight: 3.9, bayWidth: 6.4, windowWidth: 0.28, windowHeight: 0.38 });
  const louvre = kit.facadeMaterial({ wall: 0xd9d4c6, window: 0x4a423c, pattern: 'ribbon', floorHeight: 0.5, bayWidth: 2.2 });
  // The street front's upper floors: white plaster round dark windows on the 1909 block and its
  // frontispiece; white shutters between red piers on the extension.
  const streetUpper = kit.facadeMaterial({ wall: 0xeee9dd, window: 0x5d6b62, pattern: 'punched', floorHeight: 3.9, bayWidth: 3.8, windowWidth: 0.42, windowHeight: 0.6 });
  const frontispiece = kit.facadeMaterial({ wall: 0xf2eee4, window: 0x5d6b62, pattern: 'punched', floorHeight: 3.9, bayWidth: 10.3 / 3, windowWidth: 0.42, windowHeight: 0.6 });
  const shutters = kit.facadeMaterial({ wall: 0x9a4633, window: 0xe6e3d8, pattern: 'strips', floorHeight: 11, bayWidth: 4.1, windowWidth: 0.74 });
  const white = kit.material(0xf0ece1);
  const brick = kit.material(0x96422f);
  const doorRed = kit.material(0x9c2320, { roughness: 0.55 });
  const copper = kit.material(0x7ea8a1, { roughness: 0.45, metalness: 0.3 });
  const roofTop = kit.material(0xa39a8e);
  const dark = kit.material(0x33393b);

  // One range of the perimeter: two stacked brick storeys, white floor bands, and a white
  // cornice slab carrying an inset grey roof plate (the parapet line seen from the map).
  // Abutting ranges take cornice/band heights a few centimetres apart so their expanded
  // slabs never share a plane where they overlap at the joins.
  let wingIndex = 0;
  const wing = (a0, a1, b0, b1, top, name) => {
    const i = wingIndex++;
    const ac = (a0 + a1) / 2, bc = (b0 + b1) / 2, w = a1 - a0, d = b1 - b0;
    const split = Math.min(4.8, top * 0.45);
    box(ac, bc, { y: 0, w, h: split, d, material: brickGround, top: roofTop, name: `${name}-ground` });
    const upper = box(ac, bc, { y: split, w, h: top - split, d, material: brickUpper, top: roofTop, name: `${name}-upper` });
    kit.collisionPrism({ ring: upper.ring, y0: split, y1: top });
    for (const y of [4.55, 8.15]) {
      const proud = 0.24 + i * 0.06;
      if (y + 0.6 < top) box(ac, bc, { y: y + i * 0.04, w: w + proud, h: 0.55, d: d + proud, material: white, top: white, name: `${name}-band` });
    }
    const cornice = box(ac, bc, { y: top - 0.05 + i * 0.03, w: w + 0.36 + i * 0.06, h: 0.5, d: d + 0.36 + i * 0.06, material: white, top: white, name: `${name}-cornice` });
    kit.collisionPrism({ ring: cornice.ring, y0: cornice.y0, y1: cornice.y1 });
    box(ac, bc, { y: cornice.y1 - 0.03, w: w - 1.1, h: 0.14, d: d - 1.1, material: roofTop, top: roofTop, name: `${name}-roof` });
  };

  // The ranges as the mapped ring decomposes: the plain back range toward Fort Canning and the
  // north-west block across the yard; the 1909 block along Hill Street (narrower at its south
  // end, with its yard-side court) and the lower extension running north from it to the corner
  // block; the small porch at the south end.
  wing(0, 54.5, 0, 11.8, 12.6, 'back-range');
  wing(0.6, 12.8, 11.8, 32.2, 12.6, 'north-west-block');
  wing(48.7, 53.3, 11.8, 32.1, 12.6, 'tower-court');
  wing(53.3, 69, 12.5, 32, 12.6, 'hill-street-block');
  wing(57.8, 69, 4.4, 12.5, 12.6, 'hill-street-south');
  wing(53.3, 65.4, 32, 60.5, 10.9, 'hill-street-extension');
  wing(61.5, 64.7, -0.9, 4.4, 9.9, 'south-porch');

  // Hill Street front. The 1909 block's face stands at a 69 with the frontispiece projecting to
  // a 71.1 between b 13.1 and 23.4; the extension's face is set back at a 65.4.
  const FACE = 69, PROJ = 71.1, EXT = 65.4, MID = (13.1 + 23.4) / 2;
  const front = [[FACE, [6.9, 10.7]], [PROJ, [14.5, MID, 22.0]], [FACE, [25.8, 29.6]], [EXT, [0, 1, 2, 3, 4, 5].map(k => 34.05 + k * 4.1)]];
  const piers = [[FACE, [5.0, 8.8, 12.4, 24.0, 27.7, 31.5]], [PROJ, [16.4, 20.1]], [EXT, [0, 1, 2, 3, 4, 5, 6].map(k => 32 + k * 4.1)]];
  for (const [face, doors] of front) for (const b of doors) {
    box(face + 0.06, b, { y: 0, w: 0.24, h: 4.3, d: 2.5, material: doorRed, top: doorRed, name: 'engine-door' });
    box(face + 0.13, b, { y: 4.28, w: 0.3, h: 0.45, d: 2.44, material: white, top: white, name: 'engine-door-lintel' });
  }
  for (const [face, list] of piers) for (const b of list) {
    for (let k = 0; k < 5; k++) box(face + 0.08, b, { y: 0.22 + k * 1.0, w: 0.34, h: 0.5, d: 0.95, material: white, top: white, name: 'striped-pier' });
  }
  // The 1909 block's upper floors: white plaster between red-and-white striped piers, over the
  // red balcony; the extension's white shutters between its red piers.
  for (const [b0, b1] of [[4.45, 13.1], [23.4, 31.95]]) {
    facing(FACE - 0.04, FACE + 0.15, b0, b1, 4.8, 12.58, streetUpper, white, 'street-upper'); // just under the block's own roof
    facing(FACE, FACE + 0.6, b0 + 0.05, b1 - 0.05, 5.0, 6.0, doorRed, doorRed, 'balcony');
  }
  for (const [face, list] of [[FACE, piers[0][1]], [PROJ, [13.5, 16.4, 20.1, 23.0]]]) for (const b of list) {
    box(face + 0.3, b, { y: 6.0, w: 0.3, h: 6.6, d: 0.9, material: brick, top: brick, name: 'upper-pier' });
    for (let k = 0; k < 4; k++) box(face + 0.36, b, { y: 6.5 + k * 1.6, w: 0.3, h: 0.55, d: 0.96, material: white, top: white, name: 'upper-pier-stripe' });
  }
  facing(EXT - 0.04, EXT + 0.15, 32, 56.6, 4.8, 10.6, shutters, white, 'extension-shutters');
  for (const b of piers[2][1]) for (let k = 0; k < 3; k++) box(EXT + 0.27, b, { y: 5.6 + k * 1.6, w: 0.24, h: 0.55, d: 1.0, material: white, top: white, name: 'upper-pier-stripe' });
  // Pinnacles along both parapets, over the piers.
  for (const b of piers[0][1]) box(FACE - 0.2, b, { y: 13.0, w: 0.55, h: 1.4, d: 0.55, material: white, top: white, name: 'pinnacle' });
  for (const b of piers[2][1].slice(1)) box(EXT - 0.2, b, { y: 11.3, w: 0.55, h: 1.4, d: 0.55, material: white, top: white, name: 'pinnacle' });

  // The white frontispiece rising over the parapet to its pediment, between the two turrets.
  facing(FACE, PROJ, 13.1, 23.4, 0, 15.8, frontispiece, white, 'frontispiece');
  for (const [b0, b1, toward] of [[15.9, MID, 207], [MID, 20.6, 27]]) {
    const r = plan([[FACE + 0.1, b0], [PROJ, b0], [PROJ, b1], [FACE + 0.1, b1]]);
    kit.prism({ ring: r, y0: 15.8, y1: kit.sloped(r, 17.4, 1.5, toward), material: white, top: white, name: 'frontispiece-pediment' });
  }
  // The twin turrets on the frontispiece's corners: white stages, a cornice, a drum and the
  // pale green copper domes with their spikes.
  for (const b of [14.5, 22.0]) {
    const a = PROJ - 1.45; // 5 cm inside the frontispiece's faces
    const turret = box(a, b, { y: 12.6, w: 2.8, h: 6.8, d: 2.7, material: attic, top: white, name: 'turret' });
    kit.collisionPrism({ ring: turret.ring, y0: turret.y0, y1: turret.y1 });
    box(a, b, { y: 19.4, w: 3.3, h: 0.4, d: 3.3, material: white, top: white, name: 'turret-cornice' });
    box(a, b, { y: 19.8, w: 2.3, h: 0.6, d: 2.3, material: white, top: white, name: 'turret-drum' });
    const [cx, cz] = point(a, b);
    const domeRing = Array.from({ length: 8 }, (_, k) => {
      const t = k * Math.PI / 4 + Math.PI / 8;
      return [cx + Math.cos(t) * 1.35, cz + Math.sin(t) * 1.35];
    });
    kit.loft({ ring: domeRing, y0: 20.4, y1: 21.9, scale: 0.28, material: copper, top: copper, name: 'turret-dome' });
    kit.collisionPrism({ ring: kit.inset(domeRing, 0.6), y0: 20.4, y1: 21.9 });
    kit.cylinder({ x: cx, z: cz, y0: 21.85, y1: 24, r: 0.07, segments: 6, material: copper, top: copper, name: 'turret-finial' });
  }

  // The hose/lookout tower, centred behind the frontispiece where the 1909 block meets its court.
  const T = { a: 54.5, b: MID };
  const shaft = box(T.a, T.b, { y: 12.3, w: 7, h: 8.45, d: 7, material: brick, top: roofTop, name: 'tower-shaft' });
  kit.collisionPrism({ ring: shaft.ring, y0: shaft.y0, y1: shaft.y1 });
  for (const ca of [T.a - 2.95, T.a + 2.95]) for (const cb of [T.b - 2.95, T.b + 2.95]) {
    for (let k = 0; k < 6; k++) box(ca, cb, { y: 13.1 + k * 1.35, w: 1.7, h: 0.62, d: 1.7, material: white, top: white, name: 'tower-quoin' });
  }
  for (const [a, b, w, d] of [[T.a + 3.55, T.b, 0.24, 0.35], [T.a, T.b - 3.55, 0.35, 0.24]]) box(a, b, { y: 17, w, h: 1.6, d, material: dark, top: dark, name: 'tower-slit' });
  const louvres = box(T.a, T.b, { y: 20.7, w: 6.6, h: 2.3, d: 6.6, material: louvre, top: white, name: 'tower-louvres' });
  kit.collisionPrism({ ring: louvres.ring, y0: louvres.y0, y1: louvres.y1 });
  box(T.a, T.b, { y: 22.95, w: 7.7, h: 0.7, d: 7.7, material: white, top: white, name: 'tower-cornice' });
  const atticBox = box(T.a, T.b, { y: 23.65, w: 6.4, h: 3.95, d: 6.4, material: attic, top: white, name: 'tower-attic' });
  kit.collisionPrism({ ring: atticBox.ring, y0: atticBox.y0, y1: atticBox.y1 });
  box(T.a, T.b, { y: 27.58, w: 7.0, h: 0.45, d: 7.0, material: white, top: white, name: 'tower-eaves' });
  const pyramidRing = plan([[T.a - 3.4, T.b - 3.4], [T.a + 3.4, T.b - 3.4], [T.a + 3.4, T.b + 3.4], [T.a - 3.4, T.b + 3.4]]);
  kit.loft({ ring: pyramidRing, y0: 28.02, y1: 30.85, scale: 0.16, material: copper, top: copper, name: 'tower-pyramid-roof' });
  // Conservative collision inside the visible pyramid slope.
  kit.collisionPrism({ ring: plan([[T.a - 1.9, T.b - 1.9], [T.a + 1.9, T.b - 1.9], [T.a + 1.9, T.b + 1.9], [T.a - 1.9, T.b + 1.9]]), y0: 28.02, y1: 30.85 });
  const cupola = box(T.a, T.b, { y: 30.7, w: 1.7, h: 1.8, d: 1.7, material: white, top: copper, name: 'tower-cupola' });
  kit.collisionPrism({ ring: cupola.ring, y0: cupola.y0, y1: cupola.y1 });
  const [tx, tz] = point(T.a, T.b);
  const cupolaDome = Array.from({ length: 8 }, (_, k) => {
    const t = k * Math.PI / 4 + Math.PI / 8;
    return [tx + Math.cos(t) * 1.05, tz + Math.sin(t) * 1.05];
  });
  kit.loft({ ring: cupolaDome, y0: 32.48, y1: 33.8, scale: 0.22, material: copper, top: copper, name: 'tower-cupola-dome' });
  kit.cylinder({ x: tx, z: tz, y0: 33.75, y1: 34.15, r: 0.08, segments: 6, material: copper, top: copper, name: 'tower-finial' });
}
