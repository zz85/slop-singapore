// The 2025 refurbishment at 50 Raffles Place. See docs/singapore-land-tower.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Singapore Land Tower', height: 213 };

const ROOF = 198;

export function build(kit, site) {
  const tower = site.parts.find(p => p.id === 46595418).ring;
  const east = kit.compass(90);
  const easting = ([x, z]) => x * east[0] + z * east[1];
  const origin = tower.reduce((west, p) => easting(p) < easting(west) ? p : west);
  const u = kit.compass(52), v = kit.compass(142);
  const point = (a, b) => [origin[0] + a * u[0] + b * v[0], origin[1] + a * u[1] + b * v[1]];
  const plan = corners => corners.map(([a, b]) => point(a, b));
  const rectangle = (a, b, w, d) => plan([[a, b], [a + w, b], [a + w, b + d], [a, b + d]]);

  const silver = kit.material(0xc1cad0, { roughness: 0.52, metalness: 0.2 });
  const stone = kit.material(0xc5c3bb);
  const dark = kit.material(0x50606b);
  const deck = kit.material(0xaeb2af);
  const green = kit.material(0x607b4a);
  const lobby = kit.glassMaterial(0x486477);
  const curtain = kit.facadeMaterial({
    wall: 0xb2c2cb, window: 0x56768c, pattern: 'strips', floorHeight: 4, bayWidth: 2.2, windowWidth: 0.92
  });
  const crownGlass = kit.facadeMaterial({
    wall: 0x91a0a9, window: 0x4b6579, pattern: 'strips', floorHeight: 4, bayWidth: 2.2, windowWidth: 0.92
  });
  const podiumGlazing = kit.facadeMaterial({
    wall: 0xb2b7b3, window: 0x506978, pattern: 'ribbon', floorHeight: 4.15, bayWidth: 3.2
  });
  const solid = (ring, y0, y1, material, name, top = material) => {
    kit.prism({ ring, y0, y1, material, top, name });
    if (y0 > 0.5) kit.collisionPrism({ ring, y0, y1 });
  };

  // The public plaza runs across the southwest face. The lobby sits behind the canopy columns.
  solid(kit.inset(tower, 1.5), 0, 8.1, lobby, 'setback-lobby');
  const canopy = plan([[-17, 24], [-6, 12], [3, 10], [3, 45], [-5, 44], [-14, 34]]);
  solid(canopy, 7.25, 8.15, silver, 'plaza-canopy', deck);
  for (const [a, b] of [[-13, 25], [-10, 36], [-4, 41], [-3, 17]]) {
    solid(rectangle(a, b, 0.65, 0.8), 0, 7.4, silver, 'canopy-column');
  }

  // Use the wings of the mapped podium envelope for the low rooms and the raised garden.
  const podium = plan([[1, 35], [36, 35], [40, 18], [49, 17], [63, 25], [32, 56], [28, 53], [16, 63], [2, 48]]);
  const shopfront = kit.inset(podium, 0.65);
  solid(shopfront, 0, 6, lobby, 'podium-shopfront', stone);
  kit.collisionPrism({ ring: shopfront, y1: 6 });
  solid(kit.inset(podium, 0.18), 5.9, 15.35, podiumGlazing, 'podium-wings', stone);
  for (const y0 of [5.95, 10.4, 14.9]) {
    kit.prism({ ring: podium, y0, y1: y0 + 0.35, material: stone, top: stone, name: 'podium-spandrel' });
  }
  solid(kit.inset(podium, 0.2), 15.2, 16, deck, 'podium-deck');
  solid(rectangle(15, 44, 9, 8), 16, 22.6, lobby, 'terrace-pavilion', silver);
  for (const [a, b, w, d] of [[26, 44, 12, 2.2], [36, 39, 11, 2.3], [10, 45, 2.3, 8]]) {
    kit.prism({ ring: rectangle(a, b, w, d), y0: 16, y1: 16.65, material: green, top: green, name: 'terrace-planter' });
  }

  const shaft = kit.inset(tower, 0.16);
  solid(shaft, 8.05, 189.9, curtain, 'fritted-curtain-wall');
  for (const [y0, y1] of [[8.35, 9.05], [105, 107.7], [189.65, 190.05]]) {
    kit.prism({ ring: tower, y0, y1, material: silver, top: silver, name: 'continuous-fascia' });
  }
  solid(shaft, 189.9, 193.5, dark, 'recessed-gallery-band');
  solid(tower, 193.45, ROOF, crownGlass, 'gallery-roof-deck', deck);
  solid(rectangle(24, 24, 9, 9), ROOF, 201.5, lobby, 'roof-access-pavilion', silver);

  // Two curved mesh screens with swept tops and a clear deck between them.
  const mesh = kit.material(0x91a8b8, { roughness: 0.55, metalness: 0.18 });
  const [cx, cz] = point(20, 20);
  const screen = (start, end, rise) => {
    const screenTop = (x, z) => {
      const a = (x - cx) * u[0] + (z - cz) * u[1];
      const b = (x - cx) * v[0] + (z - cz) * v[1];
      const degrees = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
      return ROOF + 2.2 + rise * Math.sin((degrees - start) / (end - start) * Math.PI / 2);
    };
    const nodes = Array.from({ length: 13 }, (_, i) => {
      const angle = (start + (end - start) * i / 12) * Math.PI / 180;
      const polar = radius => point(20 + radius * Math.cos(angle), 20 + radius * Math.sin(angle));
      return { outside: polar(12.5), inside: polar(12.15) };
    });
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1], b = nodes[i];
      const ring = [a.outside, b.outside, b.inside, a.inside];
      kit.prism({ ring, y0: ROOF, y1: screenTop, material: mesh, top: silver, name: 'curved-crown-screen' });
      const [ax, az] = a.outside, [bx, bz] = b.outside;
      const ay = screenTop(ax, az), by = screenTop(bx, bz);
      kit.collisionPrism({ ring, y0: ROOF, y1: ay });
      kit.beam({ from: [ax, ay, az], to: [bx, by, bz], w: 0.32, h: 0.25, material: silver, name: 'screen-top-rail' });
    }
  };
  screen(195, 346, 12.8);
  screen(15, 166, 6.2);
  kit.hang({ ring: tower, top: ROOF, toward: 142, below: 0.9, out: 0.18, margin: 9, text: 'SINGAPORE LAND',
    logo: LOGOS['singapore-land'], height: 2.35, color: 0x123d83 });
}
