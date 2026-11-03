// js/building-picker.js
// Which building a click is on: the ray from the camera through the click against each building as it stands (its
// footprint extruded from its bottom to its top, or to the ridge of the roof drawn over it), looked up through a grid
// of 64 m cells along the ray's track over the ground. Pure geometry, the same for the city's buildings, the
// landmarks' footprints and the island tiles' outlines (js/building-info.js uses it); and a world point's longitude &
// latitude (tools/city/frame.mjs toLonLat).

const CELL = 64;

/** Whether (x, z) is inside `rings` (flat x, z arrays: an outline, then its courtyards): even-odd over all of them */
function insideRings(rings, x, z) {
  let inside = false;
  for (const r of rings) {
    const n = r.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = r[i * 2], zi = r[i * 2 + 1], xj = r[j * 2], zj = r[j * 2 + 1];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
}

/**
 * Where the ray o + t d (t > 0) first meets the prism over `rings` from `bottom` up to `top`: through a wall, or down
 * onto its roof (up into its underside); t, or Infinity
 */
function rayPrism(o, d, rings, bottom, top) {
  let best = Infinity;
  for (const r of rings) {
    const n = r.length / 2;
    for (let k = 0; k < n; k++) {
      const ax = r[k * 2], az = r[k * 2 + 1];
      const ex = r[((k + 1) % n) * 2] - ax, ez = r[((k + 1) % n) * 2 + 1] - az;
      const det = ex * d.z - d.x * ez;
      if (Math.abs(det) < 1e-12) continue;
      const t = (ex * (az - o.z) - ez * (ax - o.x)) / det;
      if (!(t > 1e-6) || t >= best) continue;
      const s = (d.x * (az - o.z) - d.z * (ax - o.x)) / det;
      if (s < 0 || s > 1) continue;
      const y = o.y + t * d.y;
      if (y >= bottom && y <= top) best = t;
    }
  }
  if (d.y !== 0) {
    for (const h of [top, bottom]) {
      const t = (h - o.y) / d.y;
      if (t > 1e-6 && t < best && insideRings(rings, o.x + t * d.x, o.z + t * d.z)) best = t;
    }
  }
  return best;
}

/**
 * The buildings to pick from: add(rings, bottom, top, ref) one (its rings flat x, z arrays, outline first), addTile(key,
 * x, z, outlines) an island tile's (js/city-tiles.js onTileOutlines: points about the tile's corner, standing on the
 * ground) and dropTile(key) them again (as the tile leaves the view), then pick(o, d) the nearest a ray from o along the
 * unit vector d meets before the ground (y = 0) or
 * `maxDistance`: { ref, t, x, y, z (where), cx, cz (the middle of its outline) }, or null
 */
function createBuildingPicker({ cell = CELL } = {}) {
  const items = [];
  const grid = new Map();
  const tiles = new Map(); // tile key → its items' ids
  let size = 0;
  const key = (i, j) => i * 100003 + j;

  function add(rings, bottom, top, ref) {
    const outer = rings[0];
    if (!outer || outer.length < 6 || !(top > bottom)) return -1;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let k = 0; k < outer.length; k += 2) {
      x0 = Math.min(x0, outer[k]); x1 = Math.max(x1, outer[k]);
      z0 = Math.min(z0, outer[k + 1]); z1 = Math.max(z1, outer[k + 1]);
    }
    const cells = [];
    for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) {
      for (let j = Math.floor(z0 / cell); j <= Math.floor(z1 / cell); j++) cells.push(key(i, j));
    }
    const id = items.push({ rings, bottom, top, ref, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, cells }) - 1;
    for (const k of cells) {
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(id);
    }
    size++;
    return id;
  }

  function addTile(tileKey, ox, oz, { pts, offsets, tops }) {
    if (tiles.has(tileKey)) return; // (already here)
    const ids = [];
    for (let k = 0; k + 1 < offsets.length; k++) {
      const ring = new Float32Array((offsets[k + 1] - offsets[k]) * 2);
      for (let i = offsets[k], m = 0; i < offsets[k + 1]; i++, m += 2) {
        ring[m] = ox + pts[i * 2];
        ring[m + 1] = oz + pts[i * 2 + 1];
      }
      const id = add([ring], 0, tops[k], { kind: 'tile', tile: tileKey });
      if (id >= 0) ids.push(id);
    }
    tiles.set(tileKey, ids);
  }

  // A tile gone from the view takes its buildings with it (they stream in again with it)
  function dropTile(tileKey) {
    const ids = tiles.get(tileKey);
    if (!ids) return;
    tiles.delete(tileKey);
    const gone = new Set(ids);
    const cells = new Set();
    for (const id of ids) {
      for (const k of items[id].cells) cells.add(k);
      items[id] = null;
      size--;
    }
    // (each cell once: its buildings may share it)
    for (const k of cells) {
      const list = (grid.get(k) || []).filter((other) => !gone.has(other));
      if (list.length) grid.set(k, list);
      else grid.delete(k);
    }
  }

  function pick(o, d, { maxDistance = 6000 } = {}) {
    const ground = d.y < 0 && o.y > 0 ? -o.y / d.y : Infinity;
    const end = Math.min(ground, maxDistance);
    let best = Infinity, hit = null;
    const tested = new Set();
    // The cells under the ray, in order (a grid walk); none further on can hold a nearer meeting than one found
    let i = Math.floor(o.x / cell), j = Math.floor(o.z / cell);
    const si = d.x > 0 ? 1 : -1, sj = d.z > 0 ? 1 : -1;
    let tx = d.x ? ((i + (d.x > 0 ? 1 : 0)) * cell - o.x) / d.x : Infinity;
    let tz = d.z ? ((j + (d.z > 0 ? 1 : 0)) * cell - o.z) / d.z : Infinity;
    const dx = d.x ? cell / Math.abs(d.x) : Infinity, dz = d.z ? cell / Math.abs(d.z) : Infinity;
    for (let tCell = 0, steps = 0; tCell <= end && tCell <= best && steps < 20000; steps++) {
      for (const id of grid.get(key(i, j)) || []) {
        if (tested.has(id)) continue;
        tested.add(id);
        const it = items[id];
        const t = rayPrism(o, d, it.rings, it.bottom, it.top);
        if (t < best && t <= end) { best = t; hit = it; }
      }
      if (tx < tz) { tCell = tx; tx += dx; i += si; } else { tCell = tz; tz += dz; j += sj; }
    }
    return hit ? { ref: hit.ref, t: best, x: o.x + best * d.x, y: o.y + best * d.y, z: o.z + best * d.z, cx: hit.cx, cz: hit.cz } : null;
  }

  return { add, addTile, dropTile, pick, get size() { return size; } };
}

/** A world point's [longitude, latitude] in the city's frame (GEO.frame: lat0, lon0, bearingDeg; tools/city/frame.mjs) */
function toLonLat(frame, x, z) {
  const A = 6378137.0, E2 = 6.69437999014e-3;
  const phi = (frame.lat0 * Math.PI) / 180;
  const s0 = Math.sin(phi);
  const KX = (Math.PI / 180) * (A / Math.sqrt(1 - E2 * s0 * s0)) * Math.cos(phi);
  const KY = (Math.PI / 180) * ((A * (1 - E2)) / Math.pow(1 - E2 * s0 * s0, 1.5));
  const th = ((frame.bearingDeg || 0) * Math.PI) / 180;
  const c = Math.cos(th), s = Math.sin(th);
  return [frame.lon0 + (x * c - z * s) / KX, frame.lat0 + (-x * s - z * c) / KY];
}

export { createBuildingPicker, rayPrism, insideRings, toLonLat };
