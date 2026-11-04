// The 1908-09 Hill Street fire station: red-brick ranges with white "bandage" bands around an
// open drill yard, six red engine doors, domed corner turrets and the striped hose tower.
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

  const brickGround = kit.facadeMaterial({ wall: 0x96422f, window: 0xe3e0d5, pattern: 'punched', floorHeight: 4.8, bayWidth: 3.2, windowWidth: 0.42, windowHeight: 0.55 });
  const brickUpper = kit.facadeMaterial({ wall: 0x9a4633, window: 0xdedbd0, pattern: 'punched', floorHeight: 3.7, bayWidth: 2.9, windowWidth: 0.52, windowHeight: 0.62 });
  const attic = kit.facadeMaterial({ wall: 0xf0ece1, window: 0x39474d, pattern: 'punched', floorHeight: 3.9, bayWidth: 6.4, windowWidth: 0.28, windowHeight: 0.38 });
  const louvre = kit.facadeMaterial({ wall: 0xd9d4c6, window: 0x4a423c, pattern: 'ribbon', floorHeight: 0.5, bayWidth: 2.2 });
  const white = kit.material(0xf0ece1);
  const brick = kit.material(0x96422f);
  const doorRed = kit.material(0x9c2320, { roughness: 0.55 });
  const copper = kit.material(0x7ea8a1, { roughness: 0.45, metalness: 0.3 });
  const slate = kit.material(0x3e4a4a);
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

  wing(0, 55, 0, 11.8, 12.6, 'front-range');
  wing(0.6, 12.8, 11.8, 32.2, 12.6, 'coleman-wing');
  wing(48.7, 53.3, 11.8, 32.2, 12.6, 'tower-court');
  wing(53.3, 65.4, 11.8, 60.5, 12.6, 'rear-barracks');
  wing(65.4, 71.1, 13, 32, 12.6, 'se-side-wing');
  wing(57.8, 69, 4.4, 11.8, 9.9, 'se-street-pavilion');

  // Hill Street engine house: six red doors between finely striped piers, under the
  // shuttered veranda floor with its white balustrade band.
  const doors = [32.9, 36.3, 39.7, 43.1, 46.5, 49.9];
  for (const a of doors) {
    box(a, -0.06, { y: 0, w: 2.5, h: 4.3, d: 0.24, material: doorRed, top: doorRed, name: 'engine-door' });
    box(a, -0.13, { y: 4.28, w: 2.44, h: 0.45, d: 0.3, material: white, top: white, name: 'engine-door-lintel' });
  }
  for (const a of [31.2, 34.6, 38, 41.4, 44.8, 48.2, 51.6]) {
    for (let k = 0; k < 5; k++) box(a, -0.08, { y: 0.22 + k * 1.0, w: 0.95, h: 0.5, d: 0.34, material: white, top: white, name: 'striped-pier' });
  }
  box(41.4, -0.1, { y: 5.05, w: 21.4, h: 0.9, d: 0.25, material: white, top: white, name: 'veranda-balustrade' });

  // The twin domed turrets at the Coleman Street end of the front.
  for (const [a, b] of [[3.2, 13.5], [9.8, 13.5]]) {
    const turret = box(a, b, { y: 12.3, w: 3.2, h: 4.1, d: 3.2, material: white, top: white, name: 'turret' });
    kit.collisionPrism({ ring: turret.ring, y0: turret.y0, y1: turret.y1 });
    box(a, b, { y: 14.2, w: 3.45, h: 0.5, d: 3.45, material: brick, top: brick, name: 'turret-band' });
    const [cx, cz] = point(a, b);
    const domeRing = Array.from({ length: 8 }, (_, k) => {
      const t = k * Math.PI / 4 + Math.PI / 8;
      return [cx + Math.cos(t) * 2.0, cz + Math.sin(t) * 2.0];
    });
    kit.loft({ ring: domeRing, y0: 16.35, y1: 18.1, scale: 0.28, material: slate, top: slate, name: 'turret-dome' });
    kit.collisionPrism({ ring: kit.inset(domeRing, 0.9), y0: 16.35, y1: 18.1 });
    kit.cylinder({ x: cx, z: cz, y0: 18.05, y1: 18.75, r: 0.07, segments: 6, material: slate, top: slate, name: 'turret-finial' });
  }

  // The hose/lookout tower behind the front range, where it turns into the rear barracks.
  const T = { a: 54.5, b: 15.5 };
  const shaft = box(T.a, T.b, { y: 12.3, w: 7, h: 8.45, d: 7, material: brick, top: roofTop, name: 'tower-shaft' });
  kit.collisionPrism({ ring: shaft.ring, y0: shaft.y0, y1: shaft.y1 });
  for (const [ca, cb] of [[51, 12], [58, 12], [51, 19], [58, 19]]) {
    const ia = ca + (ca < T.a ? 0.55 : -0.55), ib = cb + (cb < T.b ? 0.55 : -0.55);
    for (let k = 0; k < 6; k++) box(ia, ib, { y: 13.1 + k * 1.35, w: 1.7, h: 0.62, d: 1.7, material: white, top: white, name: 'tower-quoin' });
  }
  box(T.a, 11.95, { y: 17, w: 0.35, h: 1.6, d: 0.24, material: dark, top: dark, name: 'tower-slit' });
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
