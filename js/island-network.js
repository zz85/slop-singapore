import { makeCurve, curvePoint } from './road-network.js';

// js/island-network.js
// The island's main roads (js/island-roads.js) as a road graph shaped like the detailed city's (js/road-network.js), so
// the route planner and the autopilots (js/navigation.js) drive them the same way, and the two joined into one where the
// island's roads meet the detailed city at its edge.
//
// Each road becomes, for each way it may be driven, a run of straight directed edges (one per stretch between its
// points, split at the stop lines of its traffic lights), with the lanes of its carriageway as offsets to the right of
// the line (road-network.js's convention, kept to the side traffic keeps to), its speed limit, its name, and moves on
// to the next stretch and, at its end, to the roads carrying on (island-roads.js next()). Each stretch is shortened at a
// bend so the lane-to-lane curves (road-network.js makeCurve) round it. A stretch ending at a stop line carries the
// light's phase (edge.phaseAt(time)).
//
// Joined to the city: an island road ending at (or starting from) the detailed city's edge hands over to the city edge
// starting (or ending) nearest it going the same way. Those moves out of city edges are kept apart (extraMoves), so the
// city's own traffic (traffic.js), which drives its edges' moves, never leaves its graph.
//
// Conventions as road-network.js: north = -z, east = +x, an edge's direction (dx, dz) and right normal (rx, rz).

const MIN_STRETCH = 2; // m: closer points are merged
const CORNER_R = 12; // m: the radius a bend's curve is shaped for
const HANDOVER = 60; // m: how far an island road's end and a city edge may be apart to join
const NEAR_CORE = 45; // m: how close to the city's edge an island road end must be to hand over there
const BRIDGE = 15; // m: a dead end (or a road nothing leads into) is joined to the nearest road this close
const REACH = 40; // m: or, failing that, to a road going on the same way this far off (the data's missing slip roads)

function createIslandNetwork(roads, { keepLeft = true, city = null, coreRing = null } = {}) {
  const edges = [];
  const firstEdge = new Map(); // road -> dir -> its first edge that way
  const lastEdge = new Map();
  const set = (map, road, dir, e) => {
    if (!map.has(road)) map.set(road, new Map());
    map.get(road).set(dir, e);
  };
  const get = (map, road, dir) => map.get(road)?.get(dir) || null;
  let uid = 0;

  // Where a road ends on another road part way along it (a side road at a T, which the data does not split the main road
  // at): joins to split that road at, with the roads ending there
  const joins = [];
  const joinsOf = new Map(); // road -> its joins
  for (const A of roads.roads) {
    const n = A.pts.length / 2;
    for (const end of [0, 1]) {
      const x = end ? A.pts[n * 2 - 2] : A.pts[0];
      const z = end ? A.pts[n * 2 - 1] : A.pts[1];
      for (const p of roads.near(x, z, 3)) {
        if (p.road === A || p.s <= 3 || p.s >= p.road.len - 3) continue;
        const list = joinsOf.get(p.road) || [];
        let J = list.find((q) => Math.abs(q.s - p.s) < 2);
        if (!J) {
          J = { road: p.road, s: p.s, x: p.x, z: p.z, ends: [], in: [], out: [] };
          list.push(J);
          joinsOf.set(p.road, list);
          joins.push(J);
        }
        J.ends.push({ road: A, end });
      }
    }
  }

  // The lanes of `road` driven one way, as offsets to the right of its line (ascending). A one-way carriageway's lanes
  // run from the one half a lane to the kerb side of its line outwards (the lanes a road gains at a junction are added on
  // the far side, as they are), so a carriageway changing its count of lanes from one stretch to the next keeps its
  // kerbside lanes where they were instead of jogging half a lane
  function lanesOf(road) {
    const out = [];
    if (road.oneway) {
      const kerb = keepLeft ? -1 : 1;
      for (let k = 0; k < road.lanes; k++) out.push(kerb * (roads.LANE / 2) - kerb * k * roads.LANE);
    } else {
      const perSide = Math.max(1, Math.floor(road.lanes / 2));
      for (let k = 0; k < perSide; k++) out.push(-roads.laneOffset(road, k, keepLeft));
    }
    return out.sort((a, b) => a - b);
  }

  // 1. Stretches, way by way
  for (const road of roads.roads) {
    const dirs = road.oneway ? [road.oneway] : [1, -1];
    const n = road.pts.length / 2;
    for (const dir of dirs) {
      // its points in the order driven, with travel arc length u
      const pts = [];
      for (let k = 0; k < n; k++) {
        const i = dir > 0 ? k : n - 1 - k;
        pts.push({ x: road.pts[i * 2], z: road.pts[i * 2 + 1], u: dir > 0 ? road.cum[i] : road.len - road.cum[i], stop: null });
      }
      // its stop lines
      for (const g of road.signals || []) {
        const at = (dir > 0 ? g.s : road.len - g.s) - roads.STOP_BACK;
        if (at <= 1 || at >= road.len - 1) continue;
        let k = 1;
        while (k < pts.length && pts[k].u < at) k++;
        const a = pts[k - 1];
        const b = pts[k];
        const t = (at - a.u) / (b.u - a.u || 1);
        pts.splice(k, 0, { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, u: at, stop: g });
      }
      // its joins with the roads ending on it
      for (const J of joinsOf.get(road) || []) {
        const at = dir > 0 ? J.s : road.len - J.s;
        let k = 1;
        while (k < pts.length && pts[k].u < at) k++;
        if (k >= pts.length) continue;
        const a = pts[k - 1];
        const b = pts[k];
        const t = (at - a.u) / (b.u - a.u || 1);
        pts.splice(k, 0, { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, u: at, stop: null, join: J });
      }
      // merged where too close (keeping the ends, the stop lines and the joins)
      const keep = [pts[0]];
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k];
        const last = keep[keep.length - 1];
        if (k < pts.length - 1 && !p.stop && !p.join && p.u - last.u < MIN_STRETCH) continue;
        if (p.u - last.u < 0.2) {
          if (p.stop) last.stop = p.stop;
          if (p.join) last.join = p.join;
          continue;
        }
        keep.push(p);
      }
      if (keep.length < 2) continue;
      const lanes = lanesOf(road);
      let prev = null;
      for (let k = 0; k + 1 < keep.length; k++) {
        const a = keep[k];
        const b = keep[k + 1];
        const L = Math.hypot(b.x - a.x, b.z - a.z);
        const dx = (b.x - a.x) / L;
        const dz = (b.z - a.z) / L;
        const stop = b.stop;
        const e = {
          uid: uid++, island: true, road, dir, x0: a.x, z0: a.z, x1: b.x, z1: b.z, raw: L,
          dx, dz, rx: -dz, rz: dx, sx: a.x, sz: a.z, len: L, trimStart: 0, trimEnd: 0,
          lanes, moves: [], axisIndex: 0, speedLimit: road.speed, navName: road.name || '',
          costFactor: Math.sqrt(25 / Math.max(5, road.speed)),
          from: prev ? prev.to : { signal: false }, to: { signal: Boolean(stop) }
        };
        if (stop) e.phaseAt = (time) => roads.phase(stop.signal, stop.group, time);
        if (b.join && k + 1 < keep.length - 1) b.join.in.push(e);
        if (a.join && k > 0) a.join.out.push(e);
        edges.push(e);
        if (prev) prev.moves.push(moveTo(prev, e));
        else set(firstEdge, road, dir, e);
        prev = e;
      }
      set(lastEdge, road, dir, prev);
    }
  }

  function moveTo(e, f, extra = {}) {
    const cross = e.dx * f.dz - e.dz * f.dx;
    const out = e.lanes.map((o) => {
      // the lane of f nearest the same offset (or the same place in the road, when the counts differ)
      let best = 0;
      for (let j = 1; j < f.lanes.length; j++) if (Math.abs(f.lanes[j] - o) < Math.abs(f.lanes[best] - o)) best = j;
      return best;
    });
    return { to: f, turn: cross < -0.5 ? 'L' : cross > 0.5 ? 'R' : 'S', cross, uturn: false, out, ...extra };
  }

  // 2. Road to road, where they meet
  for (const [road, byDir] of lastEdge) {
    for (const [dir, e] of byDir) {
      for (const nx of roads.next(road, dir)) {
        const f = get(firstEdge, nx.road, nx.dir);
        if (f) e.moves.push(moveTo(e, f));
      }
    }
  }

  // 2b. At the joins: from the road ending there onto the other road either way, and from it into a road starting there
  const ahead = (a, b) => a.dx * b.dx + a.dz * b.dz > -0.2; // (no U-turns)
  for (const J of joins) {
    for (const { road: A, end } of J.ends) {
      for (const dir of A.oneway ? [A.oneway] : [1, -1]) {
        const arriving = (end === 1) === (dir > 0);
        if (arriving) {
          const a = get(lastEdge, A, dir);
          if (a) for (const o of J.out) if (ahead(a, o) && !a.moves.some((m) => m.to === o)) a.moves.push(moveTo(a, o));
        } else {
          const f = get(firstEdge, A, dir);
          if (f) for (const i of J.in) if (ahead(i, f) && !i.moves.some((m) => m.to === f)) i.moves.push(moveTo(i, f));
        }
      }
    }
  }

  // 2c. Loose ends, where the data leaves a road with no way on (or no way in): joined to the nearest road within BRIDGE
  //     m, going on ahead if one does, else turning back (a U-turn at a cul-de-sac or onto the other carriageway)
  bridgeLooseEnds(edges, moveTo);

  // 3. Handing over to the city where the island's roads meet it
  const extraMoves = new Map();
  if (city) {
    const ring = coreRing;
    const toCore = (x, z) => (roads.inCore(x, z) ? 0 : ring ? ringDistance(ring, x, z) : Infinity);
    const cityStarts = city.edges.map((c) => ({ c, x: c.sx, z: c.sz }));
    const cityEnds = city.edges.map((c) => ({ c, x: c.sx + c.dx * c.len, z: c.sz + c.dz * c.len }));
    const bestCity = (list, x, z, dx, dz) => {
      let best = null;
      for (const q of list) {
        const d = Math.hypot(q.x - x, q.z - z);
        if (d > HANDOVER) continue;
        const dot = q.c.dx * dx + q.c.dz * dz;
        if (dot < 0.6) continue;
        const score = d + (1 - dot) * 40;
        if (!best || score < best.score) best = { c: q.c, score };
      }
      return best && best.c;
    };
    for (const [, byDir] of lastEdge) {
      for (const [, e] of byDir) {
        if (toCore(e.x1, e.z1) > NEAR_CORE) continue;
        const c = bestCity(cityStarts, e.x1, e.z1, e.dx, e.dz);
        if (c) e.moves.push(moveTo(e, c, { handover: true }));
      }
    }
    for (const [, byDir] of firstEdge) {
      for (const [, f] of byDir) {
        if (toCore(f.x0, f.z0) > NEAR_CORE) continue;
        const c = bestCity(cityEnds, f.x0, f.z0, f.dx, f.dz);
        if (!c) continue;
        if (!extraMoves.has(c)) extraMoves.set(c, []);
        extraMoves.get(c).push(moveTo(c, f, { handover: true }));
      }
    }
  }

  // 3b. The island's edges outside its largest strongly connected set (with the city, when joined): a route can neither
  //     start nor end on them (they lead nowhere, or nothing leads to them)
  markStranded(edges, city ? city.edges : [], extraMoves);

  // 4. Shortened at their bends, for the curves round them (handovers leave the city's edges as they are)
  const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.dx * b.dx + a.dz * b.dz)));
  for (const e of edges) {
    for (const m of e.moves) {
      if (m.handover) continue;
      const f = m.to;
      const need = Math.max(0.3, CORNER_R * Math.tan(Math.min(Math.PI / 2 - 0.05, angle(e, f)) / 2));
      e.trimEnd = Math.max(e.trimEnd, need);
      f.trimStart = Math.max(f.trimStart, need);
    }
  }
  for (const e of edges) {
    const a = Math.min(e.trimStart, e.raw * 0.35);
    const b = Math.min(e.trimEnd, e.raw * 0.35);
    e.sx = e.x0 + e.dx * a;
    e.sz = e.z0 + e.dz * a;
    e.len = e.raw - a - b;
  }

  // Lane-to-lane curves, built on first use
  const curves = new Map();
  const cityIds = new WeakMap(); // (the city's edges have their own ids; these keep clear of the island's)
  const idOf = (e) => {
    if (e.island) return e.uid;
    let id = cityIds.get(e);
    if (id === undefined) cityIds.set(e, (id = `c${uid++}`));
    return id;
  };
  function connector(e, i, f, j) {
    if (city && !e.island && !f.island) return city.connector(e, i, f, j);
    const k = `${idOf(e)}:${i}:${idOf(f)}:${j}`;
    let c = curves.get(k);
    if (!c) curves.set(k, (c = makeCurve(e, i, f, j)));
    return c;
  }

  // On the island's roads: within a carriageway's width of the nearest road's line (its lanes, as lanesOf lays them)
  function onIslandRoad(x, z, clear = 0) {
    const p = roads.nearest(x, z, 24);
    if (!p) return false;
    const L = roads.LANE;
    const n = Math.max(1, p.road.lanes);
    if (!p.road.oneway) return p.dist + clear <= (n * L) / 2 + 0.6;
    // a one-way carriageway: from a lane's width to the kerb side of its line to its last lane's far edge
    const right = ((x - p.x) * -p.dz + (z - p.z) * p.dx) * p.road.oneway; // m right of its travel
    const [lo, hi] = keepLeft ? [-L, (n - 1) * L] : [-(n - 1) * L, L];
    return right - clear >= lo - 0.6 && right + clear <= hi + 0.6;
  }

  const islandOnly = { edges, keepLeft, connector, curvePoint, isRoadClear: onIslandRoad, onSidewalk: () => false, extraMoves, inCore: roads.inCore };
  if (!city) return islandOnly;
  return {
    edges: [...city.edges, ...edges],
    islandEdges: edges,
    keepLeft,
    connector,
    curvePoint,
    extraMoves,
    inCore: roads.inCore,
    isRoadClear: (x, z, clear) => (roads.inCore(x, z) ? city.isRoadClear(x, z, clear) : onIslandRoad(x, z, clear)),
    onSidewalk: (x, z) => (city.onSidewalk ? city.onSidewalk(x, z) : false),
    walkable: city.walkable,
    city
  };
}

// Joins dead ends (edges with no moves) to the edges starting nearest their ends, and edges nothing leads into from the
// edges ending nearest their starts, within BRIDGE m: ahead where there is a way ahead, else back
function bridgeLooseEnds(edges, moveTo) {
  const CELL = 20;
  const grid = (pick) => {
    const g = new Map();
    for (const e of edges) {
      const [x, z] = pick(e);
      const k = Math.floor(x / CELL) * 100003 + Math.floor(z / CELL);
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(e);
    }
    return g;
  };
  const near = (g, x, z) => {
    const out = [];
    for (let i = Math.floor((x - REACH) / CELL); i <= Math.floor((x + REACH) / CELL); i++) {
      for (let j = Math.floor((z - REACH) / CELL); j <= Math.floor((z + REACH) / CELL); j++) out.push(...(g.get(i * 100003 + j) || []));
    }
    return out;
  };
  const starts = grid((e) => [e.x0, e.z0]);
  const ends = grid((e) => [e.x1, e.z1]);
  const fed = new Set();
  for (const e of edges) for (const m of e.moves) fed.add(m.to);
  // the nearest within BRIDGE going on ahead (else turning back), else the nearest within REACH going the same way
  const choose = (cands, d, dot) => {
    const close = cands.filter((c) => d(c) <= BRIDGE);
    const ahead = close.filter((c) => dot(c) > -0.2);
    let pool = ahead.length ? ahead : close;
    if (!pool.length) pool = cands.filter((c) => d(c) <= REACH && dot(c) > 0.5);
    pool.sort((a, b) => d(a) - d(b));
    return pool.slice(0, ahead.length ? 2 : 1);
  };
  for (const e of edges) {
    if (e.moves.length) continue;
    const cands = near(starts, e.x1, e.z1).filter((f) => f !== e && f.road !== e.road && Math.hypot(f.x0 - e.x1, f.z0 - e.z1) <= REACH);
    // (turning back on its own road too, where it runs both ways)
    for (const f of near(starts, e.x1, e.z1)) if (f.road === e.road && f.dir !== e.dir && Math.hypot(f.x0 - e.x1, f.z0 - e.z1) <= BRIDGE) cands.push(f);
    for (const f of choose(cands, (f) => Math.hypot(f.x0 - e.x1, f.z0 - e.z1), (f) => e.dx * f.dx + e.dz * f.dz)) {
      e.moves.push(moveTo(e, f, { uturn: e.dx * f.dx + e.dz * f.dz < -0.2, bridge: true }));
      fed.add(f);
    }
  }
  for (const f of edges) {
    if (fed.has(f)) continue;
    const cands = near(ends, f.x0, f.z0).filter((e) => e !== f && Math.hypot(e.x1 - f.x0, e.z1 - f.z0) <= REACH && !e.moves.some((m) => m.to === f));
    for (const e of choose(cands, (e) => Math.hypot(e.x1 - f.x0, e.z1 - f.z0), (e) => e.dx * f.dx + e.dz * f.dz)) {
      e.moves.push(moveTo(e, f, { uturn: e.dx * f.dx + e.dz * f.dz < -0.2, bridge: true }));
    }
  }
}

// Marks the island edges (e.stranded) outside the largest strongly connected set of all the edges (Kosaraju)
function markStranded(island, cityEdges, extraMoves) {
  const all = [...cityEdges, ...island];
  const index = new Map(all.map((e, i) => [e, i]));
  const succ = all.map((e) => {
    const out = [];
    for (const m of e.moves) if (index.has(m.to)) out.push(index.get(m.to));
    for (const m of extraMoves.get(e) || []) if (index.has(m.to)) out.push(index.get(m.to));
    return out;
  });
  const pred = all.map(() => []);
  succ.forEach((list, i) => { for (const j of list) pred[j].push(i); });
  const seen = new Uint8Array(all.length);
  const order = [];
  for (let r = 0; r < all.length; r++) {
    if (seen[r]) continue;
    seen[r] = 1;
    const stack = [[r, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top[1] < succ[top[0]].length) {
        const j = succ[top[0]][top[1]++];
        if (!seen[j]) { seen[j] = 1; stack.push([j, 0]); }
      } else {
        order.push(top[0]);
        stack.pop();
      }
    }
  }
  const comp = new Int32Array(all.length).fill(-1);
  let best = -1, bestSize = 0;
  for (let k = order.length - 1, c = 0; k >= 0; k--) {
    if (comp[order[k]] >= 0) continue;
    const stack = [order[k]];
    comp[order[k]] = c;
    let size = 0;
    while (stack.length) {
      const i = stack.pop();
      size++;
      for (const p of pred[i]) if (comp[p] < 0) { comp[p] = c; stack.push(p); }
    }
    if (size > bestSize) { bestSize = size; best = c; }
    c++;
  }
  for (const e of island) e.stranded = comp[index.get(e)] !== best;
}

// The distance from (x, z) to a ring's edge (flat [x0, z0, x1, z1, ...])
function ringDistance(ring, x, z) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const ax = ring[j], az = ring[j + 1];
    const ex = ring[i] - ax, ez = ring[i + 1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)));
    best = Math.min(best, Math.hypot(ax + ex * t - x, az + ez * t - z));
  }
  return best;
}

export { createIslandNetwork, ringDistance };
