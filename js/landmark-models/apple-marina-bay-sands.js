// js/landmark-models/apple-marina-bay-sands.js
// Apple Marina Bay Sands (SG-049), 2 Bayfront Avenue (Foster + Partners, opened 2020): the "lantern on the
// bay" — a fully glazed 30 m diameter dome (114 curved panes on ten mullions, concentric baffle rings under
// a semi-opaque oculus) on a black glass base in Marina Bay, joined to the shore boardwalk by a small
// ramped bridge. The mapped part is way 821764692, a 32.7 m circle tagged height 5 + roof:height 15
// (dome); the model is a 15 m radius sphere about a centre 7 m over the water, truncated at the oculus
// within that mapped ≈20 m envelope. See docs/apple-marina-bay-sands.md.
import { LOGOS } from '../landmark-logos.js';

export const info = { name: 'Apple Marina Bay Sands', height: 21 };

const DOME = 821764692;
const R = 15, CENTRE_Y = 7; // the published 30 m diameter, its centre over the water
const LEVELS = [3, 5, 8, 11, 14, 16.8, 19, 20.4, 21]; // latitude bands, base rim to oculus ring
const SHORE = 55; // bearing to the mapped shore ≈65 m away (osm_water.json)

export function build(kit, site) {
  const p = site.parts.find((q) => q.id === DOME);
  if (!p?.ring?.length) throw new Error(`Apple Marina Bay Sands needs mapped part ${DOME}`);
  let ring = p.ring.map((pt) => [...pt]);
  const f = ring[0], l = ring[ring.length - 1];
  if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
  // The drawing's origin: the mapped circle's own centre
  let cx = 0, cz = 0;
  for (const [x, z] of ring) { cx += x / ring.length; cz += z / ring.length; }
  const at = (y) => Math.sqrt(Math.max(1, R * R - (y - CENTRE_Y) * (y - CENTRE_Y)));
  const circle = (r, seg = 36) => Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });

  const M = {
    black: kit.glassMaterial(0x11151a),
    glass: kit.glassMaterial(0x5f7f8c),
    baffle: kit.material(0xe8e4da, { roughness: 0.6 }),
    oculus: kit.material(0xdfe8ea, { roughness: 0.35 }),
    steel: kit.material(0xc8cfd2, { roughness: 0.4, metalness: 0.4 }),
    deck: kit.material(0x9a958a, { roughness: 0.85 }),
    post: kit.material(0x2a2d30, { roughness: 0.6 })
  };

  // The black glass base at the waterline, the glass sphere in latitude bands, the oculus at its apex
  kit.cylinder({ x: cx, z: cz, y0: -0.2, y1: 3, r: 13.9, segments: 36, material: M.black, top: M.black, name: 'black-base' });
  for (let k = 0; k + 1 < LEVELS.length; k++) {
    kit.loft({ ring: circle(at(LEVELS[k])), topRing: circle(at(LEVELS[k + 1])), y0: LEVELS[k], y1: LEVELS[k + 1], material: M.glass, top: M.glass, name: `dome-band-${k}` });
  }
  kit.cylinder({ x: cx, z: cz, y0: 21, y1: 21.3, r: at(21), segments: 36, material: M.oculus, top: M.oculus, name: 'oculus' });
  // The ten mullions following the glass, and the pale concentric baffles just inside it
  for (let m = 0; m < 10; m++) {
    const a = (m / 10) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k + 1 < LEVELS.length; k++) {
      const r0 = at(LEVELS[k]) + 0.07, r1 = at(LEVELS[k + 1]) + 0.07;
      kit.beam({ from: [cx + ca * r0, LEVELS[k], cz + sa * r0], to: [cx + ca * r1, LEVELS[k + 1], cz + sa * r1], w: 0.22, h: 0.22, material: M.steel, name: `mullion-${m}-${k}` });
    }
  }
  [[12, 12.9], [15.5, 11.2], [18, 9.0]].forEach(([y, r], i) => {
    kit.cylinder({ x: cx, z: cz, y0: y, y1: y + 0.35, r, segments: 28, material: M.baffle, top: M.baffle, name: `baffle-${i}` });
  });
  kit.collisionPrism({ ring: circle(14.6, 24), y0: 0, y1: 21 });

  // The boardwalk: a low deck on the shore bearing, thin parapets, and the shore signpost with Apple's mark
  const dir = kit.compass(SHORE), tang = [-dir[1], dir[0]];
  const P = (r, w) => [cx + dir[0] * r + tang[0] * w, cz + dir[1] * r + tang[1] * w];
  kit.prism({ ring: [P(10, 4), P(66, 4), P(66, -4), P(10, -4)], y0: 0, y1: 1.5, material: M.deck, top: M.deck, name: 'boardwalk' });
  for (const s of [1, -1]) {
    kit.prism({ ring: [P(12, s * 3.7), P(66, s * 3.7), P(66, s * 4), P(12, s * 4)], y0: 1.5, y1: 2.3, material: M.steel, top: M.steel, name: `boardwalk-rail-${s > 0 ? 0 : 1}` });
  }
  const [sx, sz] = P(63, 5.2);
  kit.box({ x: sx, z: sz, y: 0, w: 0.3, h: 2.6, d: 0.3, material: M.post, top: M.post, name: 'signpost' });
  kit.sign({ logo: LOGOS.apple, x: sx, z: sz, y: 2.7, height: 1.1, yaw: kit.yawToward(SHORE), color: 0xffffff });
}
