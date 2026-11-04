// I. M. Pei's twin trapezoidal office blades either side of Beach Road. See docs/the-gateway.md.
export const info = { name: 'The Gateway', height: 150 };

export function build(kit, site) {
  const silver = kit.material(0xd2d6d3, { roughness: 0.42, metalness: 0.35 });
  const roof = kit.material(0x8b8f8d);
  const lobbyGlass = kit.glassMaterial(0x2c3e44);
  // The broad faces: a wide pale spandrel and a thin dark window slot to every 3.95 m floor
  // (near-continuous punched openings, so the silver band dominates as in the photographs).
  const ribbon = kit.facadeMaterial({ wall: 0xeef0ee, window: 0x3d4a52, pattern: 'punched', floorHeight: 3.95, bayWidth: 2.2, windowWidth: 0.97, windowHeight: 0.3 });
  // The short end faces and the notch faces are plainer, finely finned vertically.
  const ends = kit.facadeMaterial({ wall: 0xe3e7e4, window: 0x66747b, pattern: 'strips', floorHeight: 3.95, bayWidth: 1.5, windowWidth: 0.45 });

  for (const [label, id] of [['east', 47126588], ['west', 47126589]]) {
    const ring = site.parts.find(p => p.id === id).ring;
    const shaft = kit.inset(ring, 0.18);
    // Wall by wall from the mapped plan: the two 56 m faces take the ribbon bands, the rest the fins.
    const edge = shaft.map((p, i) => {
      const q = shaft[(i + 1) % shaft.length];
      return Math.hypot(q[0] - p[0], q[1] - p[1]) > 50 ? ribbon : ends;
    });
    kit.prism({ ring: kit.inset(ring, 0.9), y1: 5.2, material: lobbyGlass, top: silver, name: `${label}-lobby`, outlineCollision: true });
    kit.prism({ ring, y0: 5.15, y1: 5.9, material: silver, top: silver, name: `${label}-soffit` });
    kit.collisionPrism({ ring, y0: 5.15, y1: 5.9 });
    kit.prism({ ring: shaft, y0: 5.85, y1: 147, material: ribbon, edgeMaterial: i => edge[i], top: roof, name: `${label}-shaft` });
    kit.collisionPrism({ ring: shaft, y0: 5.85, y1: 147 });
    const plate = kit.inset(ring, 1.2);
    kit.prism({ ring: plate, y0: 146.96, y1: 147.5, material: silver, top: roof, name: `${label}-roof-plate` });
    kit.collisionPrism({ ring: plate, y0: 146.96, y1: 147.5 });
    const o = kit.boxOf(ring);
    const plant = kit.box({ x: o.cx, z: o.cz, y: 147.46, w: 18, h: 2.54, d: 8, yaw: Math.atan2(o.uz, o.ux), material: silver, top: roof, name: `${label}-roof-plant` });
    kit.collisionPrism({ ring: plant.ring, y0: plant.y0, y1: plant.y1 });
  }
}
