// Maybank Tower and its rounded podium at 2 Battery Road. See docs/maybank-tower.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Maybank Tower', height: 175.3 };

const PODIUM = 21.1;
const CROWN = 157;

// Keep the roof collision below the slope by clipping each higher slice to the portion of roof above it.
function aboveLevel(ring, roofAt, level) {
  const clipped = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ya = roofAt(...a), yb = roofAt(...b);
    if (ya >= level) clipped.push(a);
    if ((ya < level) !== (yb < level)) {
      const t = (level - ya) / (yb - ya);
      clipped.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return clipped;
}

export function build(kit, site) {
  const mapped = id => site.parts.find(p => p.id === id).ring;
  const podium = mapped(1075240989);
  const shaft = mapped(1075240988);
  const highRoof = mapped(325793730);
  const wing = mapped(1075553558);
  const silver = kit.material(0xb7b7af, { roughness: 0.55, metalness: 0.25 });
  const stone = kit.material(0xa9a8a1);
  const roof = kit.material(0x717b82);
  const glass = kit.facadeMaterial({
    wall: 0x557185, window: 0x466782, pattern: 'strips', floorHeight: (CROWN - PODIUM) / 27, bayWidth: 2, windowWidth: 0.95
  });
  const lobby = kit.facadeMaterial({
    wall: 0x868a87, window: 0x375d69, pattern: 'strips', floorHeight: 5.4, bayWidth: 2.7, windowWidth: 0.88
  });
  const signboard = kit.material(0xf6c745);

  // The bank's riverside glazing is set back from the curving stone spandrels.
  const base = kit.inset(podium, 1.25);
  kit.prism({ ring: base, y1: 5.4, material: lobby, name: 'river-lobby' });
  kit.collisionPrism({ ring: base, y1: 5.4 });
  kit.prism({ ring: kit.inset(podium, 0.38), y0: 5.4, y1: PODIUM, material: lobby, top: roof, name: 'podium-glazing' });
  kit.collisionPrism({ ring: podium, y0: 5.4, y1: PODIUM });
  for (const y0 of [5.55, 9.1, 12.75, 16.4, 19.5]) {
    kit.prism({ ring: podium, y0, y1: y0 + 1.52, material: silver, top: silver, name: 'rounded-podium-band' });
  }

  kit.prism({ ring: kit.inset(shaft, 0.15), y0: PODIUM, y1: CROWN, material: glass, top: roof, name: 'glazed-shaft' });
  kit.collisionPrism({ ring: shaft, y0: PODIUM, y1: CROWN });
  const storey = (CROWN - PODIUM) / 27;
  for (let i = 0; i < 27; i++) {
    const y0 = PODIUM + i * storey;
    kit.prism({ ring: shaft, y0, y1: y0 + 2.1, material: silver, top: silver, name: 'silver-spandrel' });
  }
  kit.prism({ ring: highRoof, y0: CROWN, y1: info.height, material: stone, top: roof, name: 'high-crown' });
  kit.collisionPrism({ ring: highRoof, y0: CROWN, y1: info.height });
  const roofAt = kit.sloped(wing, info.height, 9, 64);
  kit.prism({ ring: wing, y0: CROWN, y1: roofAt, material: stone, top: roof, name: 'sloping-crown' });
  let level = CROWN;
  for (const top of [166.3, 168.3, 170.3, 172.3, 174.3]) {
    kit.collisionPrism({ ring: aboveLevel(wing, roofAt, top - 0.001), y0: level, y1: top });
    level = top;
  }

  for (const [host, toward, y, maxWidth, height] of [
    [highRoof, 154, 161, 9.3, 2.7],
    [highRoof, 244, 161, 16.5, 3.6],
    [highRoof, 334, 161, 9.3, 2.7],
    [podium, 334, 5.65, 12, 1.22]
  ]) {
    const wall = kit.wallToward(host, toward);
    const width = Math.min(maxWidth, wall.length - 1);
    const x = wall.x + wall.nx * 0.18, z = wall.z + wall.nz * 0.18;
    const yaw = Math.atan2(-wall.nx, wall.nz);
    kit.box({ x, z, y, w: width, h: height, d: 0.32, yaw, material: signboard, top: signboard, name: 'yellow-signboard' });
    kit.sign({ x: x + wall.nx * 0.18, z: z + wall.nz * 0.18, y: y + height * 0.12, yaw: wall.yaw,
      text: 'Maybank', logo: LOGOS.maybank, height: height * 0.76, maxWidth: width * 0.92, color: 0x201d18 });
  }
}
