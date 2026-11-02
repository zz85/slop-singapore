// js/landmark-models/guoco-tower.js
// Guoco Tower, Tanjong Pagar Centre (Skidmore, Owings & Merrill, 2016): Singapore's tallest at 290 m, 64 storeys —
// the offices on floors 1-38 (mapped to 180 m), the Wallich Residence above to the crown, the top cut on a slant in
// dark glass; the Sofitel's 20-storey block beside it on the six-storey podium. Built from the mapped outlines
// (site.parts, made safe to draw together by kit.resolve) in blue-grey glass.
export const info = { name: 'Guoco Tower', height: 290 };

const PODIUM = 393100849, OFFICES = 393100845, RESIDENCE = 393100848, HOTEL = 393100850;

export function build(kit, site) {
  const P = (id) => site.parts.find((p) => p.id === id);
  const glass = kit.facadeMaterial({ wall: 0x6b7784, window: 0x2f3a45, floorHeight: 4.0, bayWidth: 2.4, pattern: 'curtain' });
  const homes = kit.facadeMaterial({ wall: 0x7a848f, window: 0x33404a, floorHeight: 3.4, bayWidth: 2.6, pattern: 'ribbon' });
  const podium = kit.facadeMaterial({ wall: 0x8e949b, window: 0x33404a, floorHeight: 5.0, bayWidth: 3.2, pattern: 'curtain' });
  const dark = kit.glassMaterial(0x546472);
  const items = [];
  const base = P(PODIUM), offices = P(OFFICES), homesPart = P(RESIDENCE), hotel = P(HOTEL);
  if (base) items.push({ ring: base.ring, y0: -0.3, y1: base.height || 30, material: podium, name: 'podium' });
  if (offices) items.push({ ring: offices.ring, y0: offices.minHeight || 30, y1: offices.height || 180, material: glass, name: 'offices' });
  if (homesPart) {
    const ring = homesPart.ring;
    const top = homesPart.height || 290;
    items.push({ ring, y0: homesPart.minHeight || 180, y1: top - 18, material: homes, name: 'residence' });
    // the crown: the top cut on a slant, dropping 18 m toward the bay (east)
    items.push({ ring, y0: top - 18, y1: kit.sloped(ring, top, 18, 100), material: dark, top: dark, name: 'crown' });
  }
  if (hotel) items.push({ ring: hotel.ring, y0: hotel.minHeight || 30, y1: hotel.height || 100, material: glass, name: 'hotel' });
  for (const it of kit.resolve(items)) kit.prism(it);
}
