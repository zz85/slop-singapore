// The granite slab and the 2025 podium refurbishment. See docs/hong-leong-building.md.
export const info = { name: 'Hong Leong Building', height: 158 };

export function build(kit, site) {
  const mapped = id => site.parts.find(p => p.id === id).ring;
  const garage = mapped(1566685787);
  const lobby = mapped(1566685788);
  const shoulder = mapped(1566685786);
  const shaft = mapped(560203760);

  const granite = kit.material(0x8d8d89);
  const lightGranite = kit.material(0xb5b3a9);
  const roof = kit.material(0x686c69);
  const bronze = kit.material(0xb69a72, { roughness: 0.47, metalness: 0.43 });
  const shadow = kit.material(0x434844);
  const glazing = kit.facadeMaterial({ wall: 0x788587, window: 0x3f5a67, pattern: 'strips', floorHeight: 3.15, bayWidth: 1.4, windowWidth: 0.96 });
  const lobbyGlass = kit.facadeMaterial({ wall: 0x5e6260, window: 0x3f565a, pattern: 'strips', floorHeight: 6.75, bayWidth: 1.9, windowWidth: 0.94 });
  const shoulderGlass = kit.facadeMaterial({ wall: 0x6e8280, window: 0x436570, pattern: 'curtain', floorHeight: 2.6, bayWidth: 1.8 });
  const grille = kit.facadeMaterial({ wall: 0x967b5a, window: 0x534c40, pattern: 'punched', floorHeight: 0.22, bayWidth: 0.22, windowWidth: 0.55, windowHeight: 0.46 });

  const faceBox = (a, b, nx, nz, along, offset, shape) => {
    const x = a[0] + (b[0] - a[0]) * along + nx * offset;
    const z = a[1] + (b[1] - a[1]) * along + nz * offset;
    return kit.box({ x, z, yaw: Math.atan2(b[1] - a[1], b[0] - a[0]), ...shape });
  };

  kit.prism({ ring: lobby, y1: 6.73, material: lobbyGlass, top: granite, name: 'recessed-lobby-and-retail', outlineCollision: true });
  kit.prism({ ring: garage, y0: 6.5, y1: 8.35, material: lightGranite, top: granite, name: 'covered-walk-soffit' });
  const wall = kit.inset(garage, 0.27);
  kit.prism({ ring: wall, y0: 8.29, y1: 31.4, material: granite, top: roof, name: 'garage-wall' });
  kit.prism({ ring: garage, y0: 31.35, y1: 33, material: granite, top: roof, name: 'podium-roof-edge' });
  kit.collisionPrism({ ring: garage, y0: 6.5, y1: 33, outlineCollision: true });

  // The long façades carry bronze screens and rails set forward of the concrete.
  // The lower columns stay separate from the lobby behind the covered pavement.
  const centre = shaft.reduce(([x, z], [a, b]) => [x + a / shaft.length, z + b / shaft.length], [0, 0]);
  for (let i = 0; i < garage.length; i++) {
    const a = garage[i], b = garage[(i + 1) % garage.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 12) continue;
    let nx = (b[1] - a[1]) / length, nz = (a[0] - b[0]) / length;
    if ((centre[0] - a[0]) * nx + (centre[1] - a[1]) * nz > 0) [nx, nz] = [-nx, -nz];
    const at = (along, offset, shape) => faceBox(a, b, nx, nz, along, offset, shape);
    const bays = Math.round(length / 7);
    for (let j = 0; j < bays; j++) {
      at((j + 0.5) / bays, -0.78, { y: 0, w: 1.04, h: 6.57, d: 0.89, material: granite, name: 'walkway-column' });
    }
    at(0.5, -0.17, { y: 9.05, w: length - 2.7, h: 2.2, d: 0.3, material: shadow, name: 'dark-recess-under-screens' });
    at(0.5, -0.05, { y: 13.28, w: length - 2.55, h: 16.4, d: 0.42, material: grille, top: bronze, name: 'perforated-carpark-screen' });
    for (let j = 0; j < 5; j++) {
      at(0.5, 0.13, { y: 13.23 + j * 4.08, w: length - 2.35, h: 0.82, d: 0.53, material: bronze, name: 'bronze-screen-rail' });
    }
  }
  const entrance = kit.wallToward(lobby, 31);
  const lintel = faceBox(entrance.a, entrance.b, entrance.nx, entrance.nz, 0.5, 0.04,
    { y: 4.55, w: 11.4, h: 1.46, d: 0.49, material: shadow, name: 'entrance-sign-lintel' });
  kit.hang({ ring: lintel.ring, toward: 31, top: lintel.y1, below: 0.35, out: 0.06, margin: 0.8,
    text: 'HONG LEONG BUILDING', height: 0.65, maxWidth: 10.5, color: 0xe1d8c6 });
  kit.collisionPrism({ ring: lintel.ring, y0: lintel.y0, y1: lintel.y1 });

  kit.prism({ ring: shoulder, y0: 32.95, y1: 38, material: shoulderGlass, top: roof, name: 'upper-podium-shoulder', outlineCollision: true });
  for (const bearing of [31, 211, 301]) {
    const wall = kit.wallToward(shoulder, bearing);
    const parapet = faceBox(wall.a, wall.b, wall.nx, wall.nz, 0.5, -0.27,
      { y: 37.94, w: wall.length - 0.8, h: 0.84, d: 0.36, material: granite, top: lightGranite, name: 'podium-roof-parapet' });
    kit.collisionPrism({ ring: parapet.ring, y0: parapet.y0, y1: parapet.y1 });
  }
  kit.prism({ ring: shaft, y0: 32.96, y1: 151, material: glazing, top: roof, name: 'office-slab', outlineCollision: true });
  for (let i = 0; i < shaft.length; i++) {
    const a = shaft[i], b = shaft[(i + 1) % shaft.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let nx = (b[1] - a[1]) / length, nz = (a[0] - b[0]) / length;
    if ((centre[0] - a[0]) * nx + (centre[1] - a[1]) * nz > 0) [nx, nz] = [-nx, -nz];
    const bays = Math.round(length / 2.86);
    for (let j = 0; j < bays; j++) {
      faceBox(a, b, nx, nz, (j + 0.5) / bays, 0.02,
        { y: 37.96, w: j === 0 || j === bays - 1 ? 0.69 : 0.35, h: 115.8, d: 0.64,
          material: lightGranite, top: granite, name: 'full-height-granite-fin' });
    }
  }
  kit.prism({ ring: kit.inset(shaft, 0.35), y0: 150.97, y1: 154.4, material: granite, top: roof,
    name: 'granite-crown-band', outlineCollision: true });
  const plant = kit.inset(shaft, 5.2);
  kit.prism({ ring: plant, y0: 154.37, y1: 157.76, material: shadow, top: roof, name: 'inset-tower-plant', outlineCollision: true });
  const service = kit.wallToward(plant, 31);
  const hatch = faceBox(service.a, service.b, service.nx, service.nz, 0.55, -4.1,
    { y: 157.72, w: 4.8, h: info.height - 157.72, d: 3.3, material: lightGranite, top: granite, name: 'plant-roof-hatch' });
  kit.collisionPrism({ ring: hatch.ring, y0: hatch.y0, y1: hatch.y1 });
}
