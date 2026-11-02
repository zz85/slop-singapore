// js/landmark-models/republic-plaza.js
// Republic Plaza, Raffles Place (Kisho Kurokawa, 1995; 280 m, 66 storeys): polished granite with strip windows
// rising from an octagonal base, the corners sloping away so the top reads as a square turned 45°, tinted glass on
// the upper floors. OpenStreetMap maps the octagonal shaft (275 m) and the sloped corner parts as skillion roofs at
// 83, 181 and 263 m with their directions, which the program follows; the crown slivers mapped above their own
// height are left out. info.height is the documented 280 m.
export const info = { name: 'Republic Plaza', height: 280 };

const PODIUM = 171999304, SHAFT = 407705571;

export function build(kit, site) {
  const granite = kit.facadeMaterial({ wall: 0x8e8b84, window: 0x2c4a63, floorHeight: 4.2, bayWidth: 2.4, pattern: 'ribbon' });
  const glass = kit.facadeMaterial({ wall: 0x6f8aa0, window: 0x24405a, floorHeight: 4.2, bayWidth: 2.4, pattern: 'curtain' });
  const stone = kit.facadeMaterial({ wall: 0xa9a59c, window: 0x2c4a63, floorHeight: 5.0, bayWidth: 3.0, pattern: 'punched' });
  const dark = kit.glassMaterial(0x2c4a63);
  const items = [];
  for (const p of site.parts) {
    if (p.id === PODIUM) { items.push({ ring: p.ring, y0: -0.3, y1: p.height || 43, material: stone, name: 'podium' }); continue; }
    if (!(p.height > 0) || p.minHeight >= p.height) continue;
    const y0 = p.minHeight > 0 ? p.minHeight : -0.3;
    if (p.id === SHAFT) {
      // the octagonal shaft: granite with strip windows, tinted glass from 180 m up (or its top 5 m, were it lower)
      const split = Math.min(180, p.height - 5);
      items.push({ ring: p.ring, y0, y1: split, material: granite, name: 'shaft-granite' });
      items.push({ ring: p.ring, y0: split, y1: p.height, material: glass, name: 'shaft-glass' });
      continue;
    }
    // the corners, sloping away as mapped (a skillion falling toward roof:direction by roof:height)
    const y1 = p.roofShape === 'skillion' && p.roofDir >= 0 ? kit.sloped(p.ring, p.height, p.roofHeight || 10, p.roofDir) : p.height;
    items.push({ ring: p.ring, y0, y1, material: p.height > 200 ? glass : granite, top: dark, name: `corner-${p.id}` });
  }
  for (const it of kit.resolve(items)) kit.prism(it);
  // the crown over the shaft, up to the documented 280 m
  const shaft = site.parts.find((p) => p.id === SHAFT);
  if (shaft && shaft.height > 0 && shaft.height < 280) kit.loft({ ring: kit.inset(shaft.ring, 1.5), y0: shaft.height, y1: 280, scale: 0.8, material: dark, top: dark, name: 'crown' });
}
