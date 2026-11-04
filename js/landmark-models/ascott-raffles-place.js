// Former Asia Insurance Building, 2 Finlayson Green. See docs/ascott-raffles-place.md.
export const info = { name: 'Ascott Raffles Place', height: 87 };

export function build(kit, site) {
  const mapped = id => site.parts.find(p => p.id === id).ring;
  const envelope = mapped(47345005);
  const wings = mapped(463857984);
  const setbacks = mapped(463857986);
  const addition = mapped(463857988);
  const drum = mapped(463857989);
  const u = kit.compass(121), v = kit.compass(211);
  const dot = ([x, z], [a, b]) => x * a + z * b;
  const origin = envelope.reduce((a, b) => dot(a, u) + dot(a, v) < dot(b, u) + dot(b, v) ? a : b);
  const point = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const box = (a, b, options) => {
    const [x, z] = point(a, b);
    return kit.box({ x, z, yaw: Math.atan2(u[1], u[0]), ...options });
  };
  const solid = options => {
    const part = kit.prism(options);
    kit.collisionPrism({ ring: part.ring, y0: part.y0, y1: part.y1 });
  };

  const travertine = kit.material(0xd2c2a5);
  const trim = kit.material(0xe0d3b6);
  const marble = kit.material(0x333a39, { roughness: 0.33 });
  const decking = kit.material(0xa38e72);
  const pool = kit.material(0x44b6ba, { roughness: 0.22 });
  const roof = kit.material(0x9ca5a2);
  const steel = kit.material(0xc1c8c6, { roughness: 0.32, metalness: 0.62 });
  const darkSteel = kit.material(0x899393, { roughness: 0.4, metalness: 0.55 });
  const greens = kit.material(0x52734c);
  const lobbyGlass = kit.glassMaterial(0x405959);
  const ribbon = kit.facadeMaterial({ wall: 0xd2c2a5, window: 0x424e4a, floorHeight: 3.55, bayWidth: 2.55, windowWidth: 0.87, windowHeight: 0.41 });
  const cornerGlass = kit.facadeMaterial({ wall: 0xd9cbb1, window: 0x354e4c, floorHeight: 3.55, bayWidth: 2.05, windowWidth: 0.75, windowHeight: 0.43 });
  const rooftopGlass = kit.facadeMaterial({ wall: 0x6b7771, window: 0x324849, pattern: 'strips', floorHeight: 2.32, bayWidth: 2.2, windowWidth: 0.95 });

  kit.prism({ ring: kit.inset(envelope, 2.62), y1: 6.68, material: lobbyGlass, top: marble, name: 'recessed-lobby-glazing', outlineCollision: true });
  const columns = [
    ...[2.5, 7.9, 13.3, 18.7, 24.1, 29.5].map(a => [a, 0.73]),
    [33.5, 1.64], [36.5, 5.5],
    ...[10.3, 15.2, 20.1, 25].map(b => [37, b]),
    ...[7, 14, 21].map(b => [0.85, b]),
    ...[7.8, 15.5, 23.2, 30.9].map(a => [a, 25.82])
  ];
  for (const [a, b] of columns) {
    const [x, z] = point(a, b);
    kit.cylinder({ x, z, y1: 6.61, r: 0.43, segments: 10, material: marble, top: marble, name: 'marble-gallery-column', outlineCollision: true });
  }
  kit.prism({ ring: envelope, y0: 6.53, y1: 7.3, material: trim, top: travertine, name: 'gallery-soffit', outlineCollision: true });

  solid({ ring: kit.inset(wings, 0.85), y0: 7.24, y1: 55.96, material: ribbon, top: decking, name: 'travertine-wings' });
  // The original sunshades stop short of the curved corner windows.
  for (let i = 2; i <= 15; i++) {
    const y = i * 3.55 + 2.53;
    box(13.7, 0.55, { y, w: 27, h: 0.47, d: 1.16, material: trim, top: travertine, name: 'finlayson-sunshade' });
    box(37.57, 17.57, { y, w: 1.21, h: 0.47, d: 17.3, material: trim, top: travertine, name: 'raffles-quay-sunshade' });
  }
  solid({ ring: kit.inset(setbacks, 0.25), y0: 55.9, y1: 67.93, material: ribbon, top: decking, name: 'upper-terrace-wings' });
  solid({ ring: kit.inset(setbacks, 0.05), y0: 55.87, y1: 56.29, material: trim, top: decking, name: 'stepped-terrace-edge' });
  solid({ ring: kit.inset(drum, 0.07), y0: 7.27, y1: 78.72, material: cornerGlass, top: travertine, name: 'round-corner-tower' });
  solid({ ring: drum, y0: 78.52, y1: 79.02, material: trim, top: travertine, name: 'crown-cornice' });

  const glassWing = kit.inset(addition, 0.34);
  solid({ ring: glassWing, y0: 67.88, y1: 81.32, material: rooftopGlass, top: decking, name: 'glazed-roof-addition' });
  const roofPlant = kit.inset(glassWing, 2.4);
  solid({ ring: roofPlant, y0: 81.28, y1: 85.15, material: roof, top: roof, name: 'roof-plant-screen' });
  kit.hang({ ring: glassWing, top: 81.32, toward: 31, below: 0.67, out: 0.11, margin: 3,
    text: 'ASCOTT', color: 0x2864a1, height: 1.8, maxWidth: 10.7 });
  kit.hang({ ring: drum, top: 13.8, toward: 76, below: 0.1, out: 0.12, margin: 0,
    text: 'ASCOTT', color: 0x25517b, height: 1.1, maxWidth: 6.1 });

  box(12.1, 5.55, { y: 67.89, w: 19.2, h: 0.35, d: 4.35, material: trim, top: trim, name: 'pool-coping' });
  box(12.1, 5.55, { y: 68.19, w: 18.4, h: 0.14, d: 3.76, material: pool, top: pool, name: 'infinity-pool-water' });
  for (const a of [5, 11, 17, 22]) {
    box(a, 11.1, { y: 81.29, w: 1.9, h: 0.56, d: 1.02, material: trim, top: decking, name: 'roof-planter' });
    box(a, 11.1, { y: 81.8, w: 1.65, h: 0.54, d: 0.8, material: greens, top: greens, name: 'roof-planting' });
  }

  // Alternating radii pick up the light on the coronation crown's vertical flutes.
  for (const [y0, y1, radius, flutes] of [[78.96, 82.2, 4.38, 30], [82.15, 84.83, 3.05, 24], [84.78, info.height, 1.76, 18]]) {
    const [x, z] = point(32.36, 5.66);
    const ring = Array.from({ length: flutes * 2 }, (_, i) => {
      const angle = i * Math.PI / flutes;
      const r = radius - (i % 2) * 0.13;
      return [x + Math.cos(angle) * r, z + Math.sin(angle) * r];
    });
    kit.prism({ ring, y0, y1, material: steel, top: steel, edgeMaterial: i => i % 2 ? steel : darkSteel, name: 'fluted-coronation-tier' });
    kit.collisionPrism({ ring: kit.inset(ring, 0.09), y0, y1 });
  }
}
