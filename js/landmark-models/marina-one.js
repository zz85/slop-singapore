// Marina One (Ingenhoven Architects with Gustafson Porter + Bowman, 2017): OSM ways 463857949 (the offices' outline),
// 463857946 and 463857945 (the East and West Towers), 463857948 and 463857947 (their bronze stair shafts on the heart
// side), 941456992–97 (the glass corner crowns at their outer corners and the chimneys between them), 463858904 and
// 463858905 (Marina One Residences, Garden and Park Towers).
// Four towers ring a block on the city grid around the Green Heart, a garden valley of terraces: the two office towers
// on the west, joined above an open portal by a bridge of their top storeys and roofed by one saddle-shaped pergola,
// and the two residences on the east, glass behind staggered bronze frames, on a glazed base. Every face toward the
// heart is banded a storey at a time in bronze louvres that wave, as the aerial photographs show them. Heights: the
// offices 200 m to the roof (Ingenhoven) and 225 m to the corner chimneys (CTBUH), the crowns and shafts as mapped, the
// residences 139 m (Ingenhoven); the bridge, terraces and frames are estimated from Ingenhoven's section and HG Esch's
// photographs. See docs/marina-one.md.
export const info = { name: 'Marina One', height: 225 };

const ID = {
  offices: 463857949, northOffice: 463857946, southOffice: 463857945, northShaft: 463857948, southShaft: 463857947,
  gardenTower: 463858904, parkTower: 463858905, crowns: [941456993, 941456994, 941456996, 941456997], chimneys: [941456992, 941456995]
};
// heights (m): the offices' roof, the bridge's soffit, the residences' roof and their glazed base, the heart's podium
const H = { office: 200, bridge: 166, residence: 139, base: 12, gap: 9.6 };
const OFFICE_STOREY = 4.6, RESIDENCE_STOREY = 3.9;
const C = {
  officeGlass: 0x46697a, officeFrame: 0xa8b3b5, crown: 0xb7cdd0, residenceGlass: 0x6f8f86, residenceFrame: 0x7d6448,
  base: 0x34444a, bronze: 0x7a5c40, louvre: 0xb39470, paving: 0xcfcabd, green: 0x6d8f4a, leaf: 0x4f7a3a, steel: 0x6a7075, pool: 0x5fb3c4
};

// The outward unit normal of each edge of a ring, from its winding (as the kit's own)
function normalsOf(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  const s = a >= 0 ? 1 : -1;
  return ring.map(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az) || 1;
    return [(s * (bz - az)) / L, (-s * (bx - ax)) / L];
  });
}
// A number in [0, 1) for a few integers, the same every build
const hash = (...k) => { let h = 2166136261; for (const v of k) { h ^= v & 0xffff; h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`Marina One needs mapped way ${id}`);
    return p.ring;
  };
  const outline = ring(ID.offices);
  // The block's axes from the offices' longest wall (east along it, toward the residences), and the drawing's origin
  // from the outline's extremes along them: independent of the model's anchor and of the city's grid bearing
  let east = [1, 0], longest = 0;
  outline.forEach((p, i) => {
    const q = outline[(i + 1) % outline.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (L > longest) { longest = L; east = [(q[0] - p[0]) / L, (q[1] - p[1]) / L]; }
  });
  const centre = (r) => r.reduce(([x, z], p) => [x + p[0] / r.length, z + p[1] / r.length], [0, 0]);
  const [oc, rc] = [centre(outline), centre(ring(ID.gardenTower))];
  if ((rc[0] - oc[0]) * east[0] + (rc[1] - oc[1]) * east[1] < 0) east = [-east[0], -east[1]];
  const south = [-east[1], east[0]];
  const along = (p, axis) => p[0] * axis[0] + p[1] * axis[1];
  const ou = Math.min(...outline.map((p) => along(p, east))) + 82.6;
  const ov = Math.min(...outline.map((p) => along(p, south))) + 88.6;
  // a point of the drawing (u east, v south, metres) about the anchor, and back
  const P = (u, v) => [east[0] * (u + ou) + south[0] * (v + ov), east[1] * (u + ou) + south[1] * (v + ov)];
  const D = (p) => [along(p, east) - ou, along(p, south) - ov];
  const heart = [10.5, 1]; // the Green Heart's middle, in the drawing

  const M = {
    office: kit.facadeMaterial({ wall: C.officeFrame, window: C.officeGlass, pattern: 'strips', bayWidth: 1.5, floorHeight: OFFICE_STOREY, windowWidth: 0.86 }),
    residence: kit.facadeMaterial({ wall: C.residenceFrame, window: C.residenceGlass, pattern: 'curtain', bayWidth: 1.8, floorHeight: RESIDENCE_STOREY }),
    crown: kit.glassMaterial(C.crown), base: kit.glassMaterial(C.base),
    bronze: kit.material(C.bronze), louvre: kit.material(C.louvre), paving: kit.material(C.paving), green: kit.material(C.green),
    leaf: kit.material(C.leaf), steel: kit.material(C.steel, { roughness: 0.5, metalness: 0.4 }), pool: kit.material(C.pool, { roughness: 0.2 })
  };
  const inside = ([x, z], r) => {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
    return c;
  };
  // the mapped points of a ring within the drawing's box [u0, v0, u1, v1], in order along `key`
  const pointsIn = (r, [u0, v0, u1, v1], key) => r.filter((p) => { const [u, v] = D(p); return u >= u0 && u <= u1 && v >= v0 && v <= v1; })
    .sort((p, q) => key(D(p)) - key(D(q)));
  // the point where a ring's edge within the drawing's v0..v1 crosses the drawing's u
  const crossing = (r, u, v0, v1) => {
    for (let i = 0; i < r.length; i++) {
      const p = r[i], q = r[(i + 1) % r.length], [pu, pv] = D(p), [qu, qv] = D(q);
      if (Math.min(pv, qv) < v0 || Math.max(pv, qv) > v1 || (pu - u) * (qu - u) > 0 || pu === qu) continue;
      const t = (u - pu) / (qu - pu);
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    }
    throw new Error(`Marina One: no mapped wall crosses ${u} between ${v0} and ${v1}`);
  };
  // Whether each edge of a ring faces the heart: its outward normal within 60° of the way to the heart's middle
  const toHeart = (r) => {
    const N = normalsOf(r), [hx, hz] = P(...heart);
    return r.map((a, i) => {
      const b = r[(i + 1) % r.length], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const dx = hx - mx, dz = hz - mz, L = Math.hypot(dx, dz) || 1;
      return (N[i][0] * dx + N[i][1] * dz) / L > 0.5 && L < 80;
    });
  };

  // Bronze louvres a storey apart on a ring's edges toward the heart, from `from` up to `to`: one band a run of such
  // edges, its depth out from the glass waving along the face and drifting storey by storey, as the aerials show them
  function louvres(r, from, to, step, label) {
    const facing = toHeart(r), N = normalsOf(r), n = r.length;
    const first = facing.findIndex((f, i) => f && !facing[(i - 1 + n) % n]);
    if (first < 0) return;
    const runs = [];
    let run = null;
    for (let k = 0; k < n; k++) {
      const i = (first + k) % n;
      if (!facing[i]) { run = null; continue; }
      if (!run) { run = []; runs.push(run); }
      run.push(i);
    }
    runs.forEach((edges, ri) => {
      // the run's points (each edge cut into pieces 5 m or less), each with its arc length and outward normal
      const pts = [];
      edges.forEach((i, k) => {
        const a = r[i], b = r[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), pieces = Math.max(1, Math.ceil(L / 5));
        for (let j = 0; j < pieces; j++) {
          const t = j / pieces, joint = j === 0 && k > 0;
          const nx = joint ? N[i][0] + N[edges[k - 1]][0] : N[i][0], nz = joint ? N[i][1] + N[edges[k - 1]][1] : N[i][1], nl = Math.hypot(nx, nz) || 1;
          pts.push({ p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], n: [nx / nl, nz / nl] });
        }
        if (k === edges.length - 1) pts.push({ p: [...b], n: N[i] });
      });
      let s = 0;
      pts.forEach((q, k) => { if (k) s += Math.hypot(q.p[0] - pts[k - 1].p[0], q.p[1] - pts[k - 1].p[1]); q.s = s; });
      for (let y = from, f = 0; y <= to + 1e-6; y += step, f++) {
        const outer = pts.map(({ p, n: [nx, nz], s: t }) => {
          const d = 0.55 + 1.35 * (0.5 + 0.5 * Math.sin(t / 9 + y / 11));
          return [p[0] + nx * d, p[1] + nz * d];
        });
        kit.prism({ ring: [...pts.map((q) => q.p), ...outer.reverse()], y0: y - 0.32, y1: y, material: M.louvre, top: M.louvre, name: `${label}-louvre-${ri}-${f}` });
      }
    });
  }

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.12), segments: 5, material: M.bronze, top: M.bronze, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }

  // --- the block: a paved plinth with rounded corners ------------------------------------------------------------------
  const rounded = (u0, v0, u1, v1, rr, steps = 4) => {
    const out = [];
    for (const [cu, cv, a0] of [[u1 - rr, v0 + rr, -Math.PI / 2], [u1 - rr, v1 - rr, 0], [u0 + rr, v1 - rr, Math.PI / 2], [u0 + rr, v0 + rr, Math.PI]]) {
      for (let k = 0; k <= steps; k++) { const a = a0 + (k / steps) * (Math.PI / 2); out.push(P(cu + Math.cos(a) * rr, cv + Math.sin(a) * rr)); }
    }
    return out;
  };
  kit.prism({ ring: rounded(-84.6, -90.6, 84.3, 87.3, 9), y0: 0, y1: 0.3, material: M.paving, top: M.paving, name: 'plinth' });

  // --- the offices: two towers on their mapped rings, the bridge over the portal, crowns, chimneys, shafts ----------------
  const northOffice = ring(ID.northOffice), southOffice = ring(ID.southOffice);
  for (const [r, label] of [[northOffice, 'east-tower'], [southOffice, 'west-tower']]) {
    kit.prism({ ring: r, y0: 0, y1: H.office, material: M.office, top: M.paving, name: label });
    kit.collisionPrism({ ring: r, y0: 0, y1: H.office });
    louvres(r, 24, H.office - 2, OFFICE_STOREY, label);
  }
  // the bridge: the outline between the towers from the soffit over the portal to the roof, set back from their
  // west faces as mapped, its north and south walls on the towers' own (so the roofs meet edge to edge), its heart
  // face the outline's
  const bridge = [
    crossing(northOffice, -78.2, -21, -19), ...pointsIn(northOffice, [-78, -20.6, -33, -19.3], ([u]) => u),
    ...pointsIn(outline, [-34.5, -19.4, -31, 15.2], ([, v]) => v),
    ...pointsIn(southOffice, [-78, 15.2, -32.4, 16.2], ([u]) => -u), crossing(southOffice, -78.1, 15, 16.5)
  ];
  if (bridge.length < 6) throw new Error('Marina One: the bridge between the office towers is not where it is mapped');
  kit.prism({ ring: bridge, y0: H.bridge, y1: H.office, material: M.office, top: M.paving, name: 'bridge' });
  kit.collisionPrism({ ring: bridge, y0: H.bridge, y1: H.office });
  louvres(bridge, H.bridge + 4, H.office - 2, OFFICE_STOREY, 'bridge');
  // the two bronze columns at the portal's heart side, from the plaza up through the bridge to stand over its roof
  for (const v of [-18.6, 14.4]) {
    const [x, z] = P(-32.6, v);
    kit.cylinder({ x, z, y0: 0, y1: H.office + 5, r: 0.9, segments: 10, material: M.bronze, top: M.bronze, name: `portal-column-${v < 0 ? 'n' : 's'}` });
  }
  // the light glass crowns at the outer corners (full height, to their mapped 210 and 216 m), the round chimneys
  // between them to 225 m, and the bronze stair shafts at the towers' heart ends to 207 m
  for (const id of ID.crowns) {
    const p = site.parts.find((q) => q.id === id);
    kit.prism({ ring: ring(id), y0: 0, y1: p.height || 210, material: M.crown, top: M.steel, name: `crown-${id}` });
  }
  for (const id of ID.chimneys) kit.prism({ ring: ring(id), y0: 0, y1: 225, material: M.steel, top: M.steel, name: `chimney-${id}` });
  for (const id of [ID.northShaft, ID.southShaft]) kit.prism({ ring: ring(id), y0: 0, y1: 207, material: M.bronze, top: M.bronze, name: `stair-shaft-${id}` });

  // --- the offices' roof: a glass parapet on its outer edges, planters, and the pergola over the roof garden -------------
  const roofs = [northOffice, southOffice, bridge];
  for (const [ri, r] of roofs.entries()) {
    const N = normalsOf(r), inner = kit.inset(r, 0.3);
    r.forEach((a, i) => {
      const b = r[(i + 1) % r.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 0.5) return;
      // only where the roof ends: not between a tower and the bridge
      const probe = [(a[0] + b[0]) / 2 + N[i][0] * 0.5, (a[1] + b[1]) / 2 + N[i][1] * 0.5];
      if (roofs.some((o, oi) => oi !== ri && inside(probe, o))) return;
      kit.prism({ ring: [a, b, inner[(i + 1) % r.length], inner[i]], y0: H.office, y1: H.office + 2.2, material: M.crown, top: M.steel, name: `parapet-${ri}-${i}` });
    });
  }
  // the pergola: steel ribs running the block's length a few metres apart on a saddle, rising over the towers' ends
  // and dipping over the bridge, laid only where there is roof under both ends of a piece; rafters across them, posts
  // down to the roof
  const overRoof = (u, v) => roofs.some((r) => inside(P(u, v), r));
  const saddle = (v) => H.office + 3.2 + 12 * ((v + 2) / 86) ** 2;
  const RIBS = [-76, -69, -62, -55, -48, -41, -34, -27, -20, -13, -6], STEP = 6;
  for (const u of RIBS) {
    for (let v = -88, k = 0; v + STEP <= 84; v += STEP, k++) {
      if (!overRoof(u, v) || !overRoof(u, v + STEP)) continue;
      const [ax, az] = P(u, v), [bx, bz] = P(u, v + STEP);
      kit.beam({ from: [ax, saddle(v), az], to: [bx, saddle(v + STEP), bz], w: 0.4, h: 0.6, material: M.steel, name: `pergola-rib-${u}-${k}` });
      if (k % 3 === 1 && RIBS.indexOf(u) % 2 === 0) kit.beam({ from: [ax, H.office, az], to: [ax, saddle(v) - 0.3, az], w: 0.35, h: 0.35, material: M.steel, name: `pergola-post-${u}-${k}` });
    }
  }
  for (let v = -82; v <= 80; v += 12) {
    for (let k = 0; k + 1 < RIBS.length; k++) {
      const [ua, ub] = [RIBS[k], RIBS[k + 1]];
      if (!overRoof(ua, v) || !overRoof(ub, v)) continue;
      const [ax, az] = P(ua, v), [bx, bz] = P(ub, v);
      kit.beam({ from: [ax, saddle(v) + 0.5, az], to: [bx, saddle(v) + 0.5, bz], w: 0.25, h: 0.4, material: M.steel, name: `pergola-rafter-${v}-${k}` });
    }
  }
  // the roof garden under it: planted beds and small trees
  for (const [u, v, w, d] of [[-27, -62, 14, 4], [-27, 60, 14, 4], [-45, -2, 4, 26], [-64, -45, 14, 4], [-64, 40, 14, 4], [-45, -62, 4, 16], [-45, 58, 4, 16], [-12, -75, 8, 4], [-12, 72, 8, 4]]) {
    const [x, z] = P(u, v);
    kit.box({ x, z, y: H.office, w, h: 1.1, d, yaw: Math.atan2(east[1], east[0]), material: M.paving, top: M.green, name: `roof-planter-${u}-${v}` });
  }
  for (const [u, v] of [[-52, -70], [-30, -74], [-66, -52], [-52, -30], [-66, 26], [-52, 30], [-30, 72], [-52, 70], [-66, 50], [-52, 12], [-60, -12]]) {
    const [x, z] = P(u, v);
    tree(x, z, H.office, 2.6, 1.3, `roof-${u}-${v}`);
  }

  // --- the residences: a glazed base, the glass tower in bronze frames, louvres to the heart, bronze rooftop boxes -------
  for (const [id, label] of [[ID.gardenTower, 'garden-tower'], [ID.parkTower, 'park-tower']]) {
    const r = ring(id), N = normalsOf(r), facing = toHeart(r), [hx, hz] = P(...heart);
    kit.prism({ ring: r, y0: 0, y1: H.base, material: M.base, top: M.paving, name: `${label}-base` });
    kit.prism({ ring: r, y0: H.base, y1: H.residence, material: M.residence, top: M.paving, name: label });
    kit.collisionPrism({ ring: r, y0: 0, y1: H.residence });
    louvres(r, H.base + 11.4, H.residence - 1.5, RESIDENCE_STOREY, label);
    // the frames on the faces away from the heart: a bronze fin between bays, and in each bay a bar where one frame
    // ends and the next begins, a few storeys up, staggered bay by bay; a few bays' frames rise past the roof, open
    r.forEach((a, i) => {
      const b = r[(i + 1) % r.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2 - hx, mz = (a[1] + b[1]) / 2 - hz;
      if (L < 5 || facing[i] || N[i][0] * mx + N[i][1] * mz < 0.3 * Math.hypot(mx, mz)) return;
      const t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], [nx, nz] = N[i], yaw = Math.atan2(t[1], t[0]);
      const bays = Math.max(1, Math.round(L / 5.5)), bay = L / bays;
      const at = (s, out) => [a[0] + t[0] * s + nx * out, a[1] + t[1] * s + nz * out];
      // a bay whose frame rises past the roof, open, its fins and a bar over them
      const framed = (j) => j >= 1 && j <= bays - 2 && hash(id, i, j, 9) < 0.3;
      const rises = (j) => framed(j) || framed(j - 1);
      for (let j = 1; j < bays; j++) {
        const [x, z] = at(j * bay, 0.45);
        kit.box({ x, z, y: H.base, w: 0.35, h: H.residence - H.base + (rises(j) ? 6 : 0), d: 0.9, yaw, material: M.bronze, top: M.bronze, name: `${label}-fin-${i}-${j}` });
      }
      for (let j = 1; j < bays - 1; j++) {
        const [x, z] = at((j + 0.5) * bay, 0.45);
        for (let y = H.base + RESIDENCE_STOREY * (1 + Math.floor(hash(id, i, j, 7) * 3)), k = 0; y < H.residence - 3; k++) {
          kit.box({ x, z, y: y - 0.45, w: bay - 0.35, h: 0.45, d: 0.9, yaw, material: M.bronze, top: M.bronze, name: `${label}-bar-${i}-${j}-${k}` });
          y += RESIDENCE_STOREY * (3 + Math.floor(hash(id, i, j, k) * 5));
        }
        if (framed(j)) kit.box({ x, z, y: H.residence + 5.5, w: bay - 0.35, h: 0.5, d: 0.9, yaw, material: M.bronze, top: M.bronze, name: `${label}-frame-top-${i}-${j}` });
      }
    });
    // bronze boxes on the roof, where the photographs show them over each wing
    for (const [u, v] of label === 'garden-tower' ? [[38, -80], [70, -40]] : [[40, 78], [70, 40]]) {
      const [x, z] = P(u, v);
      if (inside([x, z], r)) kit.box({ x, z, y: H.residence, w: 13, h: 6, d: 8, yaw: Math.atan2(east[1], east[0]), material: M.bronze, top: M.bronze, name: `${label}-roof-box-${u}` });
    }
  }

  // --- the Green Heart: a garden at the bottom of a bowl of terraces, open to the portal --------------------------------
  // the bowl's rings: an egg with three lobes, wider each terrace up; the outermost runs into the towers' bases
  const WEDGES = 48, LEVELS = [0.9, 4.6, 8.8, 13.0, 17.2, 21.4];
  const lobe = (th) => 1 + 0.08 * Math.cos(3 * th + 0.6);
  const edgeAt = (k, th) => [heart[0] + (19 + 4.6 * k) * Math.cos(th) * lobe(th), heart[1] + (25 + 5.6 * k) * Math.sin(th) * lobe(th)];
  const boundAt = (th) => { const c = Math.cos(th), s = Math.sin(th), t = Math.min(46.5 / Math.max(Math.abs(c), 1e-6), 62 / Math.max(Math.abs(s), 1e-6)); return [heart[0] + c * t, heart[1] + s * t]; };
  const portal = (th) => Math.abs(Math.atan2(Math.sin(th - Math.PI), Math.cos(th - Math.PI))) < 0.36; // toward the portal (west)
  const ringAt = (k, th) => (k >= 5 ? boundAt(th) : edgeAt(k, th));
  kit.prism({ ring: Array.from({ length: WEDGES }, (_, j) => P(...edgeAt(0, (j / WEDGES) * 2 * Math.PI))), y0: 0.3, y1: LEVELS[0], material: M.louvre, top: M.green, name: 'heart-garden' });
  for (let j = 0; j < WEDGES; j++) {
    const a = (j / WEDGES) * 2 * Math.PI, b = ((j + 1) / WEDGES) * 2 * Math.PI, mid = (a + b) / 2;
    if (portal(mid)) {
      // the way in from the portal: paved to the bowl's edge
      kit.prism({ ring: [P(...edgeAt(0, a)), P(...edgeAt(0, b)), P(...boundAt(b)), P(...boundAt(a))], y0: 0.3, y1: 0.8, material: M.paving, top: M.paving, name: `heart-entrance-${j}` });
      continue;
    }
    for (let k = 1; k <= 5; k++) {
      kit.prism({ ring: [P(...ringAt(k - 1, a)), P(...ringAt(k - 1, b)), P(...ringAt(k, b)), P(...ringAt(k, a))], y0: 0.3, y1: LEVELS[k], material: M.louvre, top: k % 2 ? M.green : M.louvre, name: `heart-terrace-${k}-${j}` });
    }
    // the residents' lap pool along the first terrace on the residences' side
    if (Math.cos(mid) > 0.82) {
      const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
      const pool = [lerp(edgeAt(0, a), edgeAt(1, a), 0.25), lerp(edgeAt(0, b), edgeAt(1, b), 0.25), lerp(edgeAt(0, b), edgeAt(1, b), 0.8), lerp(edgeAt(0, a), edgeAt(1, a), 0.8)];
      kit.prism({ ring: pool.map((p) => P(...p)), y0: LEVELS[1], y1: LEVELS[1] + 0.08, material: M.pool, top: M.pool, name: `heart-pool-${j}` });
    }
  }
  // the garden: a dark pond, paths across, trees; trees on the planted terraces too
  kit.prism({ ring: [[-2, 4], [9, 14], [-4, 18], [-9, 9]].map(([u, v]) => P(heart[0] + u, heart[1] + v)), y0: LEVELS[0], y1: LEVELS[0] + 0.03, material: M.base, top: M.base, name: 'heart-pond' });
  for (const [k, [u, v, len, deg]] of [[-15, -6, 34, 70], [8, -4, 30, 120], [2, 10, 26, 10]].entries()) {
    const [x, z] = P(heart[0] + u + (len / 2) * Math.cos((deg * Math.PI) / 180), heart[1] + v + (len / 2) * Math.sin((deg * Math.PI) / 180));
    kit.box({ x, z, y: LEVELS[0], w: len, h: 0.06 + 0.02 * k, d: 1.8, yaw: Math.atan2(east[1], east[0]) + (deg * Math.PI) / 180, material: M.paving, top: M.paving, name: `heart-path-${k}` });
  }
  for (const [u, v, h] of [[-12, -14, 11], [-6, -20, 9], [6, -16, 12], [12, -6, 10], [-14, 2, 9], [10, 4, 8], [14, 16, 11], [-12, 16, 10], [4, 22, 9], [-2, -6, 8]]) {
    const [x, z] = P(heart[0] + u, heart[1] + v);
    tree(x, z, LEVELS[0], h, h * 0.32, `heart-${u}-${v}`);
  }
  for (const k of [3, 5]) {
    for (let j = 3; j < WEDGES; j += 8) {
      const th = ((j + 0.5) / WEDGES) * 2 * Math.PI;
      if (portal(th)) continue;
      const p = edgeAt(k - 1, th), q = k >= 5 ? edgeAt(4, th).map((c, i) => c + (boundAt(th)[i] - c) * 0.3) : edgeAt(k, th);
      const [x, z] = P((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      tree(x, z, LEVELS[k], 5, 1.7, `terrace-${k}-${j}`);
    }
  }

  // --- the glazed podium in the gaps between the towers (north, south, and the slot between the residences) -------------
  for (const [u0, v0, u1, v1, label] of [[3, -86, 30, -56, 'north'], [3, 56, 32, 84, 'south'], [52, -12.5, 80, 9.5, 'east']]) {
    kit.prism({ ring: [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], y0: 0, y1: H.gap, material: M.base, top: M.green, name: `podium-${label}` });
  }
}
