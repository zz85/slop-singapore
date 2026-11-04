// js/landmark-models/one-fullerton.js
// One Fullerton (SG-033), 1 Fullerton Road (Architects 61, 2000): the two-storey glass dining building
// curving along the Marina Bay promenade under pale wave-like roof shells. The mapped outline 46595394
// (2 levels, 12 m) carries seven layered parts: flat links (407926351/353), skillion shells sloping NNE
// (407926356/371/374) and the big northern shell sloping SSW (407926390), and the raised drum 407926388
// (min_height 8). The model stands one recessed glass body on the outline and rebuilds each part as the
// roof element its tags describe. See docs/one-fullerton.md.
export const info = { name: 'One Fullerton', height: 12 };

const OUTLINE = 46595394, DRUM = 407926388;
const SHELLS = [407926356, 407926371, 407926374, 407926390];
const LINKS = [407926351, 407926353];
const BODY = 7.6, ROOF = 12; // documented 12 m overall; the split under the shells is a visual estimate

export function build(kit, site) {
  const raw = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`One Fullerton needs mapped part ${id}`);
    return p;
  };
  const ringOf = (id) => {
    let ring = raw(id).ring.map((pt) => [...pt]);
    const f = ring[0], l = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-9) ring = ring.slice(0, -1);
    return ring;
  };
  const outline = ringOf(OUTLINE);

  const M = {
    glass: kit.facadeMaterial({ wall: 0x46545c, window: 0x22323c, floorHeight: 3.65, bayWidth: 2.8, pattern: 'curtain' }),
    silver: kit.material(0xc9cdc6, { roughness: 0.55, metalness: 0.25 }),
    stone: kit.material(0x8f8c82), deck: kit.material(0xa8a499), dark: kit.material(0x39464c)
  };

  // The promenade plinth and the recessed two-storey glass body the shells overhang
  kit.prism({ ring: outline, y0: -0.2, y1: 0.3, material: M.stone, top: M.deck, name: 'plinth' });
  const bodyRing = kit.inset(outline, 0.9);
  kit.prism({ ring: bodyRing, y0: 0.3, y1: BODY, material: M.glass, top: M.dark, name: 'glass-body' });
  // Silver string courses at the floor line and the eaves, standing just proud of the glass
  kit.prism({ ring: kit.inset(bodyRing, -0.14), y0: 3.85, y1: 4.05, material: M.silver, top: M.silver, name: 'string-course' });
  kit.prism({ ring: kit.inset(bodyRing, -0.14), y0: 7.42, y1: 7.66, material: M.silver, top: M.silver, name: 'eaves-band' });

  // The part of a ring where f(point) >= 0 (one half-plane cut)
  const cut = (ring, f) => ring.flatMap((a, i) => {
    const b = ring[(i + 1) % ring.length], fa = f(a), fb = f(b), out = fa >= 0 ? [a] : [];
    if ((fa >= 0) !== (fb >= 0)) { const s = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
    return out;
  });

  // The wave shells: each mapped skillion part as a sloped silver roof at its mapped drop and direction, its base
  // kept under its low edge (the big northern shell drops 5 m, below the glass body's top). Successive shells are
  // inset a few centimetres further so their shared mapped edges never lie coplanar. Their collision steps down the
  // slope in bands a metre of drop apart, each just under the roof's low side within it, so nothing stands above it.
  SHELLS.forEach((id, i) => {
    const p = raw(id), ring = kit.inset(ringOf(id), i * 0.08);
    const drop = p.roofHeight > 0 ? p.roofHeight : 3, dir = p.roofDir >= 0 ? p.roofDir : 19;
    const y0 = Math.min(BODY + 0.05, ROOF - drop - 0.3);
    kit.prism({ ring, y0, y1: kit.sloped(ring, ROOF, drop, dir), material: M.silver, top: M.silver, name: `wave-roof-${id}` });
    const [dx, dz] = kit.compass(dir), along = ([x, z]) => x * dx + z * dz;
    const lo = Math.min(...ring.map(along)), span = Math.max(...ring.map(along)) - lo, steps = Math.ceil(drop);
    for (let k = 0; k < steps; k++) {
      const a = lo + span * k / steps, b = lo + span * (k + 1) / steps;
      const band = cut(cut(kit.inset(ring, 0.3), (q) => along(q) - a), (q) => b - along(q));
      if (band.length >= 3) kit.collisionPrism({ ring: band, y0, y1: ROOF - drop * (k + 1) / steps - 0.1 });
    }
  });
  // The low flat links between the shells
  LINKS.forEach((id, i) => {
    const ring = kit.inset(ringOf(id), 0.2 + i * 0.08);
    kit.prism({ ring, y0: BODY + 0.05, y1: 8.7, material: M.dark, top: M.silver, name: `flat-link-${id}` });
    kit.collisionPrism({ ring, y0: BODY, y1: 8.7 });
  });
  // The raised elliptical drum in the middle, with its own pale cap
  const drumRing = kit.inset(ringOf(DRUM), 0.3);
  kit.prism({ ring: drumRing, y0: BODY + 0.05, y1: 11.2, material: M.glass, top: M.dark, name: 'drum' });
  kit.prism({ ring: kit.inset(drumRing, -0.2), y0: 11.2, y1: 11.55, material: M.silver, top: M.silver, name: 'drum-cap' });
  kit.collisionPrism({ ring: drumRing, y0: BODY, y1: 11.2 });

  // The building's name on the bay glass, as photographed from Merlion Park
  kit.hang({ ring: bodyRing, top: BODY, toward: 105, below: 1.2, out: 0.25, text: 'ONE FULLERTON', height: 1.1, color: 0xf2f4f2, name: 'one-fullerton-sign' });
}
