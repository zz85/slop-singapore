// The Cecil Street office tower, with a recessed entrance and a granite-framed plant crown.
// See docs/prudential-tower.md for the mapped footprint and reference photographs.
export const info = { name: 'Prudential Tower', height: 145 };

export function build(kit, site) {
  const mapped = id => site.parts.find(p => p.id === id).ring;
  const podium = mapped(171999306);
  const shaft = mapped(326926563);
  const u = kit.compass(150), v = kit.compass(240);
  const dot = ([x, z], [a, b]) => x * a + z * b;
  const origin = podium.reduce((a, b) => dot(a, u) + dot(a, v) < dot(b, u) + dot(b, v) ? a : b);
  const point = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const plan = points => points.map(([a, b]) => point(a, b));
  const box = (a, b, options) => {
    const [x, z] = point(a, b);
    return kit.box({ x, z, yaw: Math.atan2(u[1], u[0]), ...options });
  };

  const granite = kit.material(0xa4a6a3);
  const spandrel = kit.material(0xbfc1ba);
  const roof = kit.material(0x747b7a);
  const steel = kit.material(0xa5b3b5, { roughness: 0.3, metalness: 0.65 });
  const entry = kit.glassMaterial(0x36575e);
  const lobbyGrid = kit.facadeMaterial({ wall: 0x788c8c, window: 0x415e66, pattern: 'strips', floorHeight: 1.85, bayWidth: 1.6, windowWidth: 0.94 });
  const glazing = kit.facadeMaterial({ wall: 0x6c7e81, window: 0x4a6470, pattern: 'strips', floorHeight: 3.85, bayWidth: 1.55, windowWidth: 0.96 });
  const service = kit.facadeMaterial({ wall: 0x979c98, window: 0x52666c, floorHeight: 3.85, bayWidth: 3.25, windowWidth: 0.47, windowHeight: 0.44 });
  const louvers = kit.facadeMaterial({ wall: 0x777f7c, window: 0x4c5558, pattern: 'ribbon', floorHeight: 0.46, bayWidth: 3.7 });

  // The east corner of the podium projects over the drop-off. The columns and the recessed
  // lobby wall occupy separate volumes, leaving a walk between them at pavement level.
  const lobby = kit.inset(podium, 1.15).map(p => {
    const a = dot([p[0] - origin[0], p[1] - origin[1]], u);
    const b = dot([p[0] - origin[0], p[1] - origin[1]], v);
    const setback = Math.max(0, Math.min(3.8, a - 37, (31 - b) * 0.5));
    return [p[0] - u[0] * setback, p[1] - u[1] * setback];
  });
  const facesJunction = ring => ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length];
    return dot([(a[0] + b[0]) / 2 - origin[0], (a[1] + b[1]) / 2 - origin[1]], u) > 35;
  });
  const entryGlass = facesJunction(lobby);
  kit.prism({ ring: lobby, y1: 7.7, material: granite, edgeMaterial: i => entryGlass[i] ? entry : granite, name: 'recessed-lobby' });
  kit.collisionPrism({ ring: lobby, y1: 7.7 });
  const podiumGlass = facesJunction(podium);
  kit.prism({ ring: podium, y0: 7.65, y1: 8.32, material: granite, top: granite, name: 'podium-sill' });
  kit.prism({ ring: kit.inset(podium, 0.19), y0: 8.29, y1: 16.42, material: granite,
    edgeMaterial: i => podiumGlass[i] ? lobbyGrid : granite, name: 'podium-window-wall' });
  kit.prism({ ring: podium, y0: 16.39, y1: 20, material: granite, top: roof, name: 'podium-parapet' });
  for (const [a, b] of [[42.7, 2.45], [51.3, 14.6]]) {
    const [x, z] = point(a, b);
    kit.cylinder({ x, z, y1: 7.72, r: 0.57, segments: 14, material: steel, top: steel, name: 'entrance-column', outlineCollision: true });
  }
  kit.collisionPrism({ ring: podium, y0: 7.65, y1: 20 });
  const lintel = plan([[44, 2.55], [50.5, 10.1], [49.5, 10.95], [43, 3.4]]);
  kit.prism({ ring: lintel, y0: 6.25, y1: 7.68, material: granite, top: granite, name: 'entrance-lintel' });
  kit.collisionPrism({ ring: lintel, y0: 6.25, y1: 7.68 });
  kit.hang({ ring: lintel, toward: 80, top: 7.68, below: 0.31, out: 0.08, margin: 0.7,
    text: 'PRUDENTIAL TOWER', height: 0.6, maxWidth: 7.4, color: 0x242e31 });

  const officeTop = 131.65, floor = 3.85;
  const banded = facesJunction(shaft);
  const windowRing = kit.inset(shaft, 0.24);
  kit.prism({ ring: windowRing, y0: 19.96, y1: officeTop, material: service, top: roof,
    edgeMaterial: i => banded[i] ? glazing : service, name: 'office-shaft' });
  kit.collisionPrism({ ring: shaft, y0: 19.96, y1: officeTop, outlineCollision: true });
  for (let i = 0; i < 29; i++) {
    const y0 = 20 + i * floor;
    kit.prism({ ring: shaft, y0, y1: y0 + 1.42, material: granite, top: spandrel,
      edgeMaterial: j => banded[j] ? spandrel : granite, name: 'curved-granite-band' });
  }
  // The long western service elevation has full-height stone piers.
  const west = kit.wallToward(shaft, 278);
  for (const fraction of [0.16, 0.41, 0.82]) {
    const [ax, az] = west.a, [bx, bz] = west.b;
    const pier = kit.box({ x: ax + (bx - ax) * fraction + west.nx * 0.12, z: az + (bz - az) * fraction + west.nz * 0.12,
      y: 19.9, w: 2.7, h: 116.5, d: 0.85, yaw: Math.atan2(bz - az, bx - ax), material: granite, top: roof, name: 'west-granite-pier' });
    kit.collisionPrism({ ring: pier.ring, y0: pier.y0, y1: pier.y1 });
  }

  // The set-back mechanical levels leave a curved perimeter terrace around the plant.
  const shoulder = kit.inset(shaft, 1.45);
  const penthouse = plan([[19.6, 16.2], [32.1, 8.5], [49, 37.3], [36.1, 45.2]]);
  kit.prism({ ring: shoulder, y0: 131.62, y1: 135.4, material: granite, top: roof, name: 'roof-shoulder' });
  kit.collisionPrism({ ring: shoulder, y0: 131.62, y1: 135.4 });
  kit.prism({ ring: penthouse, y0: 135.36, y1: 143.8, material: louvers, top: roof, name: 'roof-penthouse' });
  kit.collisionPrism({ ring: penthouse, y0: 135.36, y1: 143.8 });
  for (const [a, b] of [[24, 14.2], [38.2, 38.9], [46.3, 34.8]]) {
    const fin = box(a, b, { y: 134.6, w: 2, h: info.height - 134.6, d: 3.9, material: spandrel, top: granite, name: 'granite-crown-pier' });
    kit.collisionPrism({ ring: fin.ring, y0: fin.y0, y1: fin.y1 });
  }
  for (const [a, b] of [[31.5, 17.4], [34.6, 23.5], [38.3, 30.2]]) {
    const plant = box(a, b, { y: 143.75, w: 4.3, h: 0.95, d: 2.1, material: steel, top: roof, name: 'roof-exhaust' });
    kit.collisionPrism({ ring: plant.ring, y0: plant.y0, y1: plant.y1 });
  }
}
