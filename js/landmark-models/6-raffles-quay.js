// Former John Hancock Tower at Telegraph Street. See docs/6-raffles-quay.md.
export const info = { name: '6 Raffles Quay', height: 112 };

export function build(kit, site) {
  const outline = site.parts.find(p => p.id === 47345004).ring;
  const u = kit.compass(212), v = kit.compass(302), east = kit.compass(90);
  const dot = ([x, z], [a, b]) => x * a + z * b;
  const origin = outline.reduce((a, b) => dot(a, east) > dot(b, east) ? a : b);
  const plan = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const box = (a, b, shape) => {
    const [x, z] = plan(a, b);
    return kit.box({ x, z, yaw: Math.atan2(u[1], u[0]), ...shape });
  };

  const stone = kit.material(0x828586);
  const silver = kit.material(0xb4b7b5);
  const charcoal = kit.material(0x454d56);
  const roof = kit.material(0x646a6c);
  const lobbyGlass = kit.facadeMaterial({ wall: 0x748187, window: 0x384e5b, pattern: 'strips', floorHeight: 5.3, bayWidth: 1.65, windowWidth: 0.95 });
  const cornerGlass = kit.facadeMaterial({ wall: 0x657987, window: 0x394e69, pattern: 'curtain', floorHeight: 2.65, bayWidth: 1.4 });
  const officeGlass = kit.facadeMaterial({ wall: 0x6e788b, window: 0x546984, pattern: 'strips', floorHeight: 4.58, bayWidth: 1.8, windowWidth: 0.95 });
  const parking = kit.facadeMaterial({ wall: 0x9b9b94, window: 0x3b4047, pattern: 'ribbon', floorHeight: 3.4, bayWidth: 3.7 });
  const louvers = kit.facadeMaterial({ wall: 0x828a8c, window: 0x4e5a60, pattern: 'ribbon', floorHeight: 0.55, bayWidth: 3.4 });

  // Keep the curved corner glazed down through the parking levels. The approach runs
  // between the recessed lobby and the front columns under the raised garage.
  const local = p => {
    const delta = [p[0] - origin[0], p[1] - origin[1]];
    return [dot(delta, u), dot(delta, v)];
  };
  // Split the two straight runs flanking the curve so the blue corner glazing wraps onto both.
  const splitCorner = ring => ring.flatMap((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const [a, b] = local(p), [c, d] = local(q);
    let split = 0;
    if (Math.max(b, d) < 2 && (a < 33) !== (c < 33)) split = (33 - a) / (c - a);
    if (Math.min(a, c) > 40 && (b < 8) !== (d < 8)) split = (8 - b) / (d - b);
    if (split <= 0.04 || split >= 0.96) return [p];
    return [p, [p[0] + split * (q[0] - p[0]), p[1] + split * (q[1] - p[1])]];
  });
  const corner = ring => ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const [a, b] = local([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
    return a > 34.5 && b < 8.2;
  });
  const lobby = kit.inset(outline, 3.35);
  kit.prism({ ring: lobby, y1: 5.03, material: lobbyGlass, top: stone, name: 'recessed-lobby-and-retail', outlineCollision: true });
  for (const a of [4, 11, 24, 32]) box(a, 0.86, { y: 0, w: 0.92, h: 4.86, d: 0.83, material: stone, name: 'drop-off-column' });
  kit.prism({ ring: outline, y0: 4.8, y1: 5.65, material: charcoal, top: stone, name: 'drop-off-soffit', outlineCollision: true });

  const garage = splitCorner(kit.inset(outline, 0.19));
  const garageCorner = corner(garage);
  kit.prism({ ring: garage, y0: 5.62, y1: 31, material: parking, top: roof,
    edgeMaterial: i => garageCorner[i] ? cornerGlass : parking, name: 'parking-podium', outlineCollision: true });
  for (const a of [4.7, 22.7, 34.2]) {
    box(a, 0.47, { y: 5.58, w: 1.15, h: 25.4, d: 0.84, material: charcoal, top: stone, name: 'stone-podium-pier' });
  }
  const panel = box(15.6, 0.43, { y: 5.6, w: 10.4, h: 19.2, d: 0.76, material: stone, top: silver, name: 'framed-raffles-quay-panel' });
  box(15.6, 0.24, { y: 12.4, w: 4.55, h: 3.65, d: 0.48, material: charcoal, name: 'address-panel' });
  kit.hang({ ring: panel.ring, top: 15.35, toward: 122, below: 0.4, out: 0.21, text: '6 RAFFLES QUAY', color: 0xd9d9d3, height: 0.42, maxWidth: 4, margin: 1.5 });

  const shaft = splitCorner(kit.inset(outline, 0.48));
  const windowWall = splitCorner(kit.inset(outline, 0.71));
  const officeCorner = corner(windowWall);
  kit.prism({ ring: windowWall, y0: 30.96, y1: 105.6, material: officeGlass, top: roof,
    edgeMaterial: i => officeCorner[i] ? cornerGlass : officeGlass, name: 'rounded-office-shaft' });
  kit.collisionPrism({ ring: shaft, y0: 30.96, y1: 106.7, outlineCollision: true });
  const bandCorner = corner(shaft);
  for (let floor = 0; floor < 16; floor++) {
    const y0 = 31.14 + floor * 4.58;
    kit.prism({ ring: shaft, y0, y1: y0 + 0.94, material: silver, top: stone,
      edgeMaterial: i => bandCorner[i] ? charcoal : silver, name: 'projecting-office-band' });
  }
  for (const [a, b, w, d] of [[7.2, 0.51, 0.64, 0.38], [31.7, 0.51, 0.92, 0.38], [0.73, 9.4, 0.38, 0.74], [0.73, 20.7, 0.38, 0.74]]) {
    box(a, b, { y: 31.05, w, h: 74.7, d, material: charcoal, name: 'deep-curtain-wall-seam' });
  }

  kit.prism({ ring: shaft, y0: 105.5, y1: 106.7, material: charcoal, top: roof, name: 'rounded-roof-edge' });
  for (const [a, b, w, d, y, top, material] of [
    [21, 16, 22, 12.8, 106.66, 109.25, stone],
    [18, 16, 12.5, 8.8, 109.21, info.height, louvers],
    [33.5, 20, 4.3, 3.9, 106.66, 108.9, silver]
  ]) {
    const plant = box(a, b, { y, w, h: top - y, d, material, top: roof, name: 'inset-roof-plant' });
    kit.collisionPrism({ ring: plant.ring, y0: y, y1: top });
  }
}
