// js/landmark-models/one-raffles-place.js
// One Raffles Place: Tower 1 (the OUB Centre, Kenzo Tange, 1986; 280 m, 63 storeys), two triangular prisms a step
// apart in dark bronze, one taller (mapped 283 m) than the other (215 m); Tower 2 (2012; 209 m, 38 storeys), two
// glass slabs whose tops slope 30 m across, one facing north and one south (mapped roof:direction 5 and 185); the
// mall podium (26 m) and its five-storey wing. Built from the mapped outlines (site.parts), made safe to draw
// together by kit.resolve.
export const info = { name: 'One Raffles Place', height: 283 };

const T1_TALL = 325793773, T1_SHORT = 325793737;
const T2_TALL = 407705559, T2_LOW = 407705505;
const PODIUM = 171999293, WING = 407705492;

export function build(kit, site) {
  const P = (id) => site.parts.find((p) => p.id === id);
  const bronze = kit.facadeMaterial({ wall: 0x5a4e45, window: 0x1f1b18, floorHeight: 4.4, bayWidth: 2.4, pattern: 'ribbon' });
  const glass = kit.facadeMaterial({ wall: 0x8a97a6, window: 0x2d3a52, floorHeight: 4.0, bayWidth: 2.2, pattern: 'curtain' });
  const stone = kit.facadeMaterial({ wall: 0xcfc9bd, window: 0x3a4a56, floorHeight: 4.4, bayWidth: 3.0, pattern: 'punched' });
  const roofGlass = kit.glassMaterial(0x383e57);
  const items = [];
  const tall = P(T1_TALL), short = P(T1_SHORT);
  if (tall) items.push({ ring: tall.ring, y0: -0.3, y1: tall.height || 283, material: bronze, name: 'tower1-tall' });
  if (short) items.push({ ring: short.ring, y0: -0.3, y1: short.height || 215, material: bronze, name: 'tower1-short' });
  const t2a = P(T2_TALL), t2b = P(T2_LOW);
  if (t2a) items.push({ ring: t2a.ring, y0: -0.3, y1: kit.sloped(t2a.ring, t2a.height || 209, 30, 185), material: glass, top: roofGlass, name: 'tower2-tall' });
  if (t2b) items.push({ ring: t2b.ring, y0: -0.3, y1: kit.sloped(t2b.ring, t2b.height || 179, 30, 5), material: glass, top: roofGlass, name: 'tower2-low' });
  const podium = P(PODIUM), wing = P(WING);
  if (podium) items.push({ ring: podium.ring, y0: -0.3, y1: podium.height || 26, material: stone, name: 'podium' });
  if (wing) items.push({ ring: wing.ring, y0: -0.3, y1: 18, material: stone, name: 'podium-wing' });
  for (const it of kit.resolve(items)) kit.prism(it);
}
