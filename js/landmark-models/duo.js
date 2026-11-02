// DUO (Büro Ole Scheeren with DP Architects, 2017), Bugis: OSM ways 432375292, 432375294 and 432375288 (DUO
// Residences' three stacked blocks) with its outline 427064874, 432375291, 432375293 and 432375289 (DUO Tower's,
// 432375290 repeating its base) with its outline 560240330, and the Duo Galleria (outline 560240322; its low parts
// 560275084 between the towers, 560240327 beside the Tower, 560275278 on the north arm).
// Two towers carved by circles: their faces toward the plaza between them, and the Residences' toward Rochor, are
// concave and wear a white aluminium honeycomb of sunshades (wide, flat-topped hexagons on the Residences, tall,
// pointed ones on the Tower), their straight ends vertical fins. Each tower is a stack of blocks that shift and
// cantilever as mapped, with planted terraces on the setbacks and the Andaz hotel's name down the Tower's white south
// face. Heights: the Residences 186 m and the Tower 179 m (CTBUH); the mapped setbacks (taken above sea level, as the
// tops' 193 and 185 m are) are scaled to them. See docs/duo.md.
export const info = { name: 'DUO', height: 186 };

const RESIDENCES = { blocks: [432375292, 432375294, 432375288], top: 186, mapped: 193 };
const TOWER = { blocks: [432375291, 432375293, 432375289], top: 179, mapped: 185 };
const GALLERIA = { between: 560275084, beside: 560240327, arm: 560275278 };
const BASE = 8; // the glazed lobbies under the towers' sunshades
const C = {
  aluminium: 0xeeefec, glass: 0x667a83, fins: 0xd4d7d6, white: 0xe4e2dc, base: 0x3b4a50, paving: 0xc9c5ba,
  green: 0x6d8f4a, leaf: 0x4f7a3a, steel: 0x6a7075, roof: 0x9ba2a6, sign: 0x3d4144
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
const inside = ([x, z], r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
};
// how far (x, z) lies from a ring's nearest edge
const clearance = ([x, z], r) => Math.min(...r.map(([ax, az], i) => {
  const [bx, bz] = r[(i + 1) % r.length], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}));

export function build(kit, site) {
  const ring = (id) => {
    const p = site.parts.find((q) => q.id === id);
    if (!p?.ring?.length) throw new Error(`DUO needs mapped way ${id}`);
    return p.ring;
  };
  // The drawing's axes: the street grid's east and south when it was mapped (the compass's 121.8° and 211.8°, so the
  // drawing stays put whatever bearing the city's frame takes), its origin from the Residences' upper block's extremes
  const ex = kit.compass(121.8), ez = kit.compass(211.8);
  const upper = ring(RESIDENCES.blocks[2]);
  const ou = Math.min(...upper.map((p) => p[0] * ex[0] + p[1] * ex[1])) - 15.2;
  const ov = Math.min(...upper.map((p) => p[0] * ez[0] + p[1] * ez[1])) + 69.3;
  const P = (u, v) => [ex[0] * (u + ou) + ez[0] * (v + ov), ex[1] * (u + ou) + ez[1] * (v + ov)];
  const plaza = P(-35, -10); // the middle of the plaza the towers curve around

  const M = {
    flatHex: kit.facadeMaterial({ wall: C.aluminium, window: C.glass, pattern: 'honeycomb', bayWidth: 4.2, floorHeight: 3.8, honeycomb: { flat: true, frame: 0.15 } }),
    tallHex: kit.facadeMaterial({ wall: C.aluminium, window: C.glass, pattern: 'honeycomb', bayWidth: 3.6, floorHeight: 6, honeycomb: { frame: 0.13 } }),
    smallHex: kit.facadeMaterial({ wall: C.aluminium, window: C.glass, pattern: 'honeycomb', bayWidth: 2.4, floorHeight: 2.6, honeycomb: { frame: 0.13 } }),
    fins: kit.facadeMaterial({ wall: C.fins, window: C.glass, pattern: 'strips', bayWidth: 1.2, floorHeight: 3.8, windowWidth: 0.5 }),
    white: kit.facadeMaterial({ wall: C.white, window: C.glass, pattern: 'strips', bayWidth: 1.4, floorHeight: 3.8, windowWidth: 0.22 }),
    base: kit.glassMaterial(C.base), paving: kit.material(C.paving), green: kit.material(C.green), leaf: kit.material(C.leaf),
    steel: kit.material(C.steel, { roughness: 0.5, metalness: 0.4 }), column: kit.material(C.aluminium), roof: kit.material(C.roof, { roughness: 0.55, metalness: 0.3 })
  };

  // A tree: a short trunk under a crown that widens then closes
  function tree(x, z, y, h, r, name) {
    const around = (rr) => Array.from({ length: 7 }, (_, i) => [x + Math.cos((i * 2 * Math.PI) / 7) * rr, z + Math.sin((i * 2 * Math.PI) / 7) * rr]);
    kit.cylinder({ x, z, y0: y, y1: y + h * 0.42, r: Math.max(0.16, r * 0.12), segments: 5, material: M.steel, top: M.steel, name: `${name}-trunk` });
    kit.loft({ ring: around(r * 0.5), topRing: around(r), y0: y + h * 0.36, y1: y + h * 0.64, material: M.leaf, top: M.leaf, name: `${name}-tree-crown` });
    kit.loft({ ring: around(r), y0: y + h * 0.64, y1: y + h, scale: 0.35, material: M.leaf, top: M.leaf, name: `${name}-tree-crown-top` });
  }
  // Trees over the part of a roof that the block above leaves open, a few metres apart (each nudged off the grid, and
  // some left out, as planted) and clear of every edge
  function terrace(roof, above, y, label, { step = 8, h = 4.5, r = 1.7, share = 0.7 } = {}) {
    const xs = roof.map((p) => p[0]), zs = roof.map((p) => p[1]);
    const jitter = (k) => { const v = Math.sin(k * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
    let n = 0, k = 0;
    for (let gx = Math.min(...xs) + step / 2; gx < Math.max(...xs); gx += step) {
      for (let gz = Math.min(...zs) + step / 2; gz < Math.max(...zs); gz += step) {
        k++;
        if (jitter(k) > share) continue;
        const x = gx + (jitter(k + 0.31) - 0.5) * step * 0.6, z = gz + (jitter(k + 0.67) - 0.5) * step * 0.6;
        if (!inside([x, z], roof) || clearance([x, z], roof) < r + 1) continue;
        if (above && (inside([x, z], above) || clearance([x, z], above) < r + 1)) continue;
        tree(x, z, y, h, r, `${label}-${n++}`);
      }
    }
    return n;
  }

  // The wall each edge of a tower's block wears: the honeycomb where the face is carved (toward the plaza, or short
  // pieces of a curve), the fins on its straight ends, white on the Tower's south face where the hotel's name hangs
  function facing(r, honeycomb, flat) {
    const N = normalsOf(r);
    return (i) => {
      const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, dx = plaza[0] - mx, dz = plaza[1] - mz, D = Math.hypot(dx, dz) || 1;
      if ((N[i][0] * dx + N[i][1] * dz) / D > 0.5 && D < 110) return honeycomb;
      return L < 12 ? honeycomb : flat;
    };
  }

  // --- the towers: each a stack of mapped blocks scaled to its documented height, on a glazed base ---------------------
  for (const [tower, label, honeycomb] of [[RESIDENCES, 'residences', M.flatHex], [TOWER, 'tower', M.tallHex]]) {
    const scale = tower.top / tower.mapped;
    const rings = tower.blocks.map(ring);
    const heights = tower.blocks.map((id) => site.parts.find((q) => q.id === id)).map((p) => [p.minHeight * scale, (p.height || tower.mapped) * scale]);
    heights[heights.length - 1][1] = tower.top;
    const south = kit.wallToward(rings[2], 211.8);
    rings.forEach((r, k) => {
      const [y0, y1] = k === 0 ? [BASE, heights[0][1]] : heights[k];
      const sides = facing(r, honeycomb, M.fins);
      // (the Tower's straight south face is white from the ground up)
      const wall = label === 'tower' ? (i) => {
        const a = r[i], b = r[(i + 1) % r.length], N = normalsOf(r)[i];
        return N[0] * south.nx + N[1] * south.nz > 0.97 && Math.abs((a[0] - south.a[0]) * south.nx + (a[1] - south.a[1]) * south.nz) < 3 && Math.hypot(b[0] - a[0], b[1] - a[1]) > 12 ? M.white : sides(i);
      } : sides;
      kit.prism({ ring: r, y0, y1, material: M.fins, edgeMaterial: wall, top: k === 2 ? M.paving : M.green, name: `${label}-block-${k}` });
      kit.collisionPrism({ ring: r, y0: k === 0 ? 0 : y0, y1 });
    });
    // the lobby, glazed and set back under the block, and white columns under its carved faces
    kit.prism({ ring: kit.inset(rings[0], 3), y0: 0, y1: BASE, material: M.base, top: M.paving, name: `${label}-lobby` });
    {
      const r = rings[0], N = normalsOf(r), carved = facing(r, true, false);
      r.forEach((a, i) => {
        const b = r[(i + 1) % r.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!carved(i) || L < 4) return;
        for (let k = 0, n = Math.max(1, Math.round(L / 7)); k < n; k++) {
          const t = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t - N[i][0] * 1.3, z = a[1] + (b[1] - a[1]) * t - N[i][1] * 1.3;
          kit.cylinder({ x, z, y0: 0, y1: BASE, r: 0.5, segments: 8, material: M.column, top: M.column, name: `${label}-column-${i}-${k}` });
        }
      });
    }
    // the planted setbacks: where the middle block runs past the top one, and the top block's own roof
    terrace(rings[1], rings[2], heights[1][1], `${label}-setback`);
    if (label === 'tower') {
      // the rooftop bar's garden
      terrace(rings[2], null, tower.top, `${label}-roof`, { step: 9, h: 2.8, r: 1.4, share: 0.45 });
    }
    // a parapet round the top roof
    const r = rings[2], inner = kit.inset(r, 0.35);
    r.forEach((a, i) => kit.prism({ ring: [a, r[(i + 1) % r.length], inner[(i + 1) % r.length], inner[i]], y0: tower.top, y1: tower.top + 1.1, material: M.fins, top: M.steel, name: `${label}-parapet-${i}` }));
  }

  // --- the hotel's name down the Tower's white south face, near its east end, under the roofline ------------------------
  {
    const r = ring(TOWER.blocks[2]), w = kit.wallToward(r, 211.8), eastward = kit.compass(121.8);
    const [near, far] = (w.a[0] - w.b[0]) * eastward[0] + (w.a[1] - w.b[1]) * eastward[1] > 0 ? [w.a, w.b] : [w.b, w.a];
    const L = Math.hypot(far[0] - near[0], far[1] - near[1]), t = [(far[0] - near[0]) / L, (far[1] - near[1]) / L];
    kit.sign({ text: 'andaz', x: near[0] + t[0] * 2.6 + w.nx * 0.3, z: near[1] + t[1] * 2.6 + w.nz * 0.3, yTop: TOWER.top - 2.5, yaw: w.yaw, height: 2.4, width: 10.5, vertical: true, color: C.sign, font: '600 110px Helvetica, Arial, sans-serif', name: 'sign:andaz' });
  }

  // --- the Duo Galleria: the low gallery between the towers under a planted roof with round planters, the glass block
  // beside the Tower, the canopied arm to the north ---------------------------------------------------------------------
  {
    const between = ring(GALLERIA.between), N = normalsOf(between);
    kit.prism({ ring: between, y0: 0, y1: 5.5, material: M.base, edgeMaterial: (i) => {
      const a = between[i], b = between[(i + 1) % between.length], dx = plaza[0] - (a[0] + b[0]) / 2, dz = plaza[1] - (a[1] + b[1]) / 2;
      return N[i][0] * dx + N[i][1] * dz > 0 ? M.smallHex : null;
    }, top: M.green, name: 'galleria' });
    // its screen toward the plaza: the honeycomb leaning out over the walk, as the shell along the plaza's edge — one
    // ribbon a run of edges facing the plaza, its joints mitred
    const toPlaza = between.map((p, i) => {
      const q = between[(i + 1) % between.length], dx = plaza[0] - (p[0] + q[0]) / 2, dz = plaza[1] - (p[1] + q[1]) / 2;
      return N[i][0] * dx + N[i][1] * dz > 0 && Math.hypot(q[0] - p[0], q[1] - p[1]) >= 1;
    });
    const n = between.length, first = toPlaza.findIndex((f, i) => f && !toPlaza[(i - 1 + n) % n]);
    for (let k = 0, run = []; first >= 0 && k <= n; k++) {
      const i = (first + k) % n;
      if (k < n && toPlaza[i]) { run.push(i); continue; }
      if (run.length) {
        // the run's points, each pushed out along its edges' mean normal
        const pts = [...run.map((e) => between[e]), between[(run[run.length - 1] + 1) % n]];
        const normal = (j) => {
          const prev = run[j - 1], next = run[j];
          const [nx, nz] = prev === undefined ? N[next] : next === undefined ? N[prev] : [N[prev][0] + N[next][0], N[prev][1] + N[next][1]];
          const L = Math.hypot(nx, nz) || 1, c = prev !== undefined && next !== undefined ? (nx * N[next][0] + nz * N[next][1]) / L : 1;
          return [nx / L / Math.max(0.5, c), nz / L / Math.max(0.5, c)];
        };
        const at = (d) => pts.map((p, j) => { const [nx, nz] = normal(j); return [p[0] + nx * d, p[1] + nz * d]; });
        kit.loft({ ring: [...at(0.4), ...at(0.75).reverse()], topRing: [...at(3.2), ...at(3.55).reverse()], y0: 0, y1: 8.5, material: M.smallHex, top: M.column, name: `galleria-screen-${run[0]}` });
        run = [];
      }
    }
    const box = kit.boxOf(between);
    for (let k = -1; k <= 1; k++) {
      const x = box.cx + box.ux * box.hx * 0.5 * k, z = box.cz + box.uz * box.hx * 0.5 * k;
      if (!inside([x, z], between) || clearance([x, z], between) < 3.2) continue;
      kit.cylinder({ x, z, y0: 5.5, y1: 6.3, r: 2.6, segments: 14, material: M.paving, top: M.green, name: `galleria-planter-${k + 1}` });
      tree(x, z, 6.3, 5, 1.8, `galleria-${k + 1}`);
    }
    kit.prism({ ring: ring(GALLERIA.beside), y0: 0, y1: 9.2, material: M.base, top: M.green, name: 'galleria-pavilion' });
    kit.prism({ ring: ring(GALLERIA.arm), y0: 0, y1: 4.8, material: M.base, top: M.roof, name: 'galleria-arm' });
  }
}
