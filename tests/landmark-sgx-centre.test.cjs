const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// The landmark model programs (js/landmark-models/<model>.js) built against the kit (js/landmark-kit.js) on their
// real anchors (GEO.landmarks of js/singapore-geodata.js, tools/city/build.mjs): each stands where it is mapped,
// reaches its documented height, draws no faces that would flicker, and builds in a moment.

const chain = () => new Proxy(function node() {}, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k] : k === 'then' ? undefined : chain()),
  set: (t, k, v) => { t[k] = v; return true; },
  apply: () => chain(),
  construct: () => chain()
});
class Chain { constructor(o) { const c = chain(); if (o && typeof o === 'object') Object.assign(c, o); return c; } }
class Group { constructor() { this.children = []; this.position = { set() {} }; } add(...o) { this.children.push(...o); return this; } }
const THREE = { Group, Mesh: Chain, BufferGeometry: Chain, Float32BufferAttribute: Chain, MeshStandardNodeMaterial: Chain, MeshLambertNodeMaterial: Chain, MeshBasicNodeMaterial: Chain, CanvasTexture: Chain, SRGBColorSpace: 'srgb', Color: Chain, FrontSide: 0, DoubleSide: 2 };
const tsl = new Proxy({}, { get: () => chain() });
const tinyLook = { pairMaterial: (a, b) => b, createTinyFlatMaterial: (hex) => new Chain({ color: hex }), blendHex: (a) => a, hexToRgb: () => [1, 1, 1] };
const { createKit } = loadModule(readFileSync(join(__dirname, '../js/landmark-kit.js'), 'utf8'), { imports: { 'three/webgpu': THREE, 'three/tsl': tsl, './tiny-look.js': tinyLook }, filename: 'landmark-kit.js' });

const geodata = import(pathToFileURL(join(__dirname, '../js/singapore-geodata.js')).href);
const siteOf = (L) => ({ id: L.id, name: L.name, x: L.x, z: L.z, parts: L.parts.map((p) => ({ ...p, ring: Array.from({ length: p.ring.length / 2 }, (_, k) => [p.ring[k * 2] - L.x, p.ring[k * 2 + 1] - L.z]) })) });

// --- SGX Centre (SG-063) --------------------------------------------------------------------------------------------------
// Twin office towers on Shenton Way, mirror images of each other on a three-storey stone podium: each a glass slab
// curving back toward its outer end on the Shenton Way side under a thin roof sloping down from 172.8 m at the inner end,
// stone-framed toward Boon Tat Link and toward the other tower with horizontal sunshade fins, and a stone portal rising
// to 187 m over its inner end, its tall opening showing the top storeys and the sky; between them the podium with its
// colonnade, at the north end the drop-off canopy and the lawn with the SGX letters.

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}
const colliderAt = (colliders, x, y, z) => colliders.some((c) => {
  const o = c.obb, dx = x - o.cx, dz = z - o.cz;
  return c.minY < y && c.maxY > y && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
});
async function siteModel(id) {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === id);
  assert.ok(L, `${id} has its own mapped landmark anchor`);
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${L.model}.js`)).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  const t0 = performance.now();
  build(kit, siteOf(L));
  const ms = performance.now() - t0;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // a lon/lat as a point about the anchor, then in the world
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  return { kit, L, info, at, ms };
}
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, posts and masts aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));
// ... and the same without the trees
const solidOver = (kit, x, z, y0, y1) => builtOver(kit, x, z, y0, y1).filter((p) => !/tree-crown|trunk/.test(p.name));
const topAt = (kit, x, z) => Math.max(0, ...solidOver(kit, x, z, 0, 400).map((p) => p.y1));
// the roof's height over (x, z): the top of the roof slab's slice there (a slice is 1.5 m long, so this is the slope's
// height at the slice's high end, within a metre)
const roofAt = (kit, t, x, z) => Math.max(0, ...kit.parts.filter((p) => new RegExp(`^${t}-canopy-\\d+$`).test(p.name) && covers(p.ring, x, z)).map((p) => p.y1));

// Points read off the mapped rings (OSM ways 47345025 SGX Centre One, 47345024 SGX Centre Two, 45098518 the podium) and
// the photographs, each tower's in turn: inside it near its inner end and near its outer end (the roof's high and low
// ends) and in its middle; in its portal's opening and in the portal's south-east post over the inner end; on the
// pavement just outside the curved Shenton Way face near the outer end (inside the mapped podium rectangle); in the
// notch at the outer corner toward Boon Tat Link; in the colonnade under the Shenton Way face. Then: over the podium
// in the middle of the gap between the towers, in the podium's colonnade on Shenton Way, under the drop-off canopy on
// the north forecourt, on the lawn beside it, and on the south forecourt.
const SGX = {
  one: {
    inner: [103.8500593, 1.2795424], outer: [103.8501592, 1.2798418], mid: [103.8500797, 1.2796786],
    opening: [103.8500403, 1.2795116], post: [103.8500862, 1.2794830],
    arcOut: [103.8502746, 1.2797804], notch: [103.8500732, 1.2799168], colonnade: [103.8501231, 1.2795344]
  },
  two: {
    inner: [103.8496521, 1.2788814], outer: [103.8494347, 1.2786658], mid: [103.8495400, 1.2788023],
    opening: [103.8496781, 1.2789151], post: [103.8497240, 1.2788865],
    arcOut: [103.8495469, 1.2785905], notch: [103.8493375, 1.2787105], colonnade: [103.8497008, 1.2788403]
  },
  gap: [103.8497993, 1.2792577], podiumColonnade: [103.8499123, 1.2791871],
  dropOff: [103.8501949, 1.2799685], lawn: [103.8503018, 1.2799018], southForecourt: [103.8493874, 1.2785890]
};
// heights (m): Emporis' roof (the roof's high end, over the inner end), CTBUH/Emporis' architectural top (the portals),
// the podium's three storeys
const ROOF = 172.8, TOP = 187.3, PODIUM = 16;

test('SGX Centre replaces its podium and both towers, and nothing else', async () => {
  const { L, info } = await siteModel('sgx-centre');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [45098518, 47345024, 47345025]);
  assert.equal(info.name, 'SGX Centre');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  // Robinson Point and its spire, The Ogilvy Centre (SO/ Sofitel), Robinson Centre, One Shenton's towers stay the city's
  for (const id of [47345018, 172915351, 47345019, 47345026, 47345021, 325793774, 325793778]) assert.ok(!registered.hide.includes(id), `${id} stays the city's`);
});

test('SGX Centre builds on its anchor to its documented 187 m, within its mapped outline, in a moment', async () => {
  const { kit, L, info, ms } = await siteModel('sgx-centre');
  assert.equal(info.height, 187);
  assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
  const b = kit.bounds();
  assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
  // the portals are the architectural top; only the lattice masts on them go higher
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam');
  const highest = Math.max(...solids.map((p) => p.bounds.maxY));
  assert.ok(Math.abs(highest - TOP) <= 0.3, `the portals' tops at ${highest} m, ${TOP} documented`);
  assert.ok(b.maxY <= 198, `the masts' tips at ${b.maxY.toFixed(1)} m`);
  const site = siteOf(L), ring = (id) => site.parts.find((p) => p.id === id).ring;
  const span = (r, k) => [Math.min(...r.map((p) => p[k])), Math.max(...r.map((p) => p[k]))];
  // everything within the mapped podium rectangle along Shenton Way, and across it but for the roof's overhang
  const [x0, x1] = span(ring(45098518), 0), [z0, z1] = span(ring(45098518), 1);
  assert.ok(b.minZ >= z0 - 1.5 && b.maxZ <= z1 + 1.5, `along Shenton Way within the podium (${b.minZ.toFixed(1)}..${b.maxZ.toFixed(1)})`);
  assert.ok(b.minX >= x0 - 3 && b.maxX <= x1 + 3, `across it within the roofs' overhang (${b.minX.toFixed(1)}..${b.maxX.toFixed(1)})`);
  // each tower's body within its mapped ring
  for (const [t, id] of [['one', 47345025], ['two', 47345024]]) {
    const body = kit.parts.find((p) => p.name === `${t}-body`).bounds, [rx0, rx1] = span(ring(id), 0), [rz0, rz1] = span(ring(id), 1);
    assert.ok(body.minX >= rx0 - 0.6 && body.maxX <= rx1 + 0.6 && body.minZ >= rz0 - 0.6 && body.maxZ <= rz1 + 0.6, `${t}: the body within the mapped tower`);
  }
});

test('SGX Centre: the twin roofs slope from 172.8 m over the inner ends down toward the outer ends, mirrored', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  const h = {};
  for (const t of ['one', 'two']) {
    const [ix, iz] = at(...SGX[t].inner), [ox, oz] = at(...SGX[t].outer), [mx, mz] = at(...SGX[t].mid);
    h[t] = { inner: roofAt(kit, t, ix, iz), outer: roofAt(kit, t, ox, oz), mid: roofAt(kit, t, mx, mz) };
    assert.ok(h[t].inner >= 166 && h[t].inner <= ROOF + 0.5, `${t}: the roof near the inner end at ${h[t].inner.toFixed(1)} m`);
    assert.ok(h[t].outer >= 150 && h[t].outer <= 158, `${t}: near the outer end at ${h[t].outer.toFixed(1)} m`);
    assert.ok(h[t].mid < h[t].inner && h[t].mid > h[t].outer, `${t}: between them in the middle (${h[t].mid.toFixed(1)} m)`);
    // the roof is a thin slab overhanging a recessed top storey, over the glass
    assert.ok(solidOver(kit, ix, iz, h[t].inner - 0.5, h[t].inner).some((p) => new RegExp(`^${t}-canopy-`).test(p.name)), `${t}: the roof slab on top`);
    assert.ok(solidOver(kit, ix, iz, h[t].inner - 3, h[t].inner - 2).some((p) => p.name === `${t}-loggia`), `${t}: the recessed top storey under it`);
    assert.ok(solidOver(kit, ix, iz, 100, 101).some((p) => p.name === `${t}-body`), `${t}: the office floors under that`);
  }
  assert.ok(Math.abs(h.one.inner - h.two.inner) < 2 && Math.abs(h.one.outer - h.two.outer) < 3, 'twins');
  // the roof's top falls steadily along each tower: canopy slices one after another, each lower toward the outer end
  for (const t of ['one', 'two']) {
    const slices = kit.parts.filter((p) => new RegExp(`^${t}-canopy-\\d+$`).test(p.name));
    assert.ok(slices.length >= 20, `${t}: a smooth slope (${slices.length} slices)`);
  }
});

test('SGX Centre: the stone portal over each inner end rises to 187 m, the top storeys and the sky seen through its opening', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  const { colliders } = kit.finish();
  for (const t of ['one', 'two']) {
    const [x, z, wx, wz] = at(...SGX[t].opening), [px, pz, pwx, pwz] = at(...SGX[t].post);
    // the opening, about 16 m tall from the inner face's bay up past the roof: no stone in it, the tower's top floors
    // set back behind it and open over them and the roof slab behind, up to the lintel
    assert.equal(solidOver(kit, x, z, 162.5, 177.3).filter((p) => /-portal-|-corner-/.test(p.name)).length, 0, `${t}: no stone in the opening`);
    assert.ok(solidOver(kit, x, z, 165, 168).some((p) => p.name === `${t}-body`), `${t}: the top storeys behind it`);
    assert.equal(solidOver(kit, x, z, 170, 177.3).length, 0, `${t}: open over them`);
    for (const y of [172, 174, 176.5]) assert.ok(!colliderAt(colliders, wx, y, wz), `${t}: free to fly through at ${y} m`);
    const lintel = kit.parts.find((p) => p.name === `${t}-portal-lintel`);
    assert.ok(solidOver(kit, x, z, 178, 187).includes(lintel) && lintel.y1 - lintel.y0 >= 8, `${t}: the deep lintel over it`);
    assert.ok(colliderAt(colliders, wx, 182, wz), `${t}: the lintel is solid`);
    const foot = kit.parts.find((p) => p.name === `${t}-portal-post`).y0;
    assert.ok(foot >= 158 && foot <= 166 && solidOver(kit, x, z, foot - 2, foot).some((p) => p.name === `${t}-body`), `${t}: the portal stands on the tower's top storeys`);
    const post = solidOver(kit, px, pz, 150, 400).filter((p) => /-portal-|-corner-/.test(p.name));
    assert.ok(post.length && Math.max(...post.map((p) => p.y1)) >= TOP - 0.3, `${t}: the post up to the top`);
    assert.ok(colliderAt(colliders, pwx, 186, pwz) && colliderAt(colliders, pwx, 60, pwz), `${t}: the post is solid`);
    // the lattice mast up the post's face from the portal's foot to about 9 m past its top
    const mast = kit.parts.filter((p) => new RegExp(`^${t}-mast-`).test(p.name) && p.type === 'beam');
    assert.ok(mast.length >= 2 && Math.max(...mast.map((p) => p.bounds.maxY)) >= 194 && Math.max(...mast.map((p) => p.bounds.maxY)) <= 198, `${t}: the mast's tips`);
    assert.ok(Math.min(...mast.map((p) => Math.hypot((p.bounds.minX + p.bounds.maxX) / 2 - px, (p.bounds.minZ + p.bounds.maxZ) / 2 - pz))) < 8, `${t}: the mast by the post`);
  }
});

test('SGX Centre: the Shenton Way face curves back toward each outer end and the outer corner is notched; both open', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  const { colliders } = kit.finish();
  for (const t of ['one', 'two']) {
    for (const where of ['arcOut', 'notch']) {
      const [x, z, wx, wz] = at(...SGX[t][where]);
      assert.equal(solidOver(kit, x, z, 20, 145).length, 0, `${t} ${where}: open up the tower`);
      for (const y of [30, 100, 140]) assert.ok(!colliderAt(colliders, wx, y, wz), `${t} ${where}: free at ${y} m`);
    }
    const [mx, mz, mwx, mwz] = at(...SGX[t].mid);
    assert.ok(colliderAt(colliders, mwx, 100, mwz) && colliderAt(colliders, mwx, 150, mwz), `${t}: solid in the middle`);
    assert.ok(solidOver(kit, mx, mz, 100, 101).length, `${t}: built in the middle`);
  }
});

test('SGX Centre: the stone faces carry horizontal sunshade fins, the glass faces run up behind a colonnade', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  const { colliders } = kit.finish();
  for (const t of ['one', 'two']) {
    const fins = kit.parts.filter((p) => new RegExp(`^${t}-fin-`).test(p.name));
    assert.ok(fins.length >= 24, `${t}: ${fins.length} fins`);
    const levels = [...new Set(fins.map((p) => Math.round(p.y0)))].sort((a, b) => a - b);
    assert.ok(levels.length >= 12 && levels.slice(1).every((y, k) => y - levels[k] >= 8 && y - levels[k] <= 10.5), `${t}: one every two storeys (${levels})`);
    for (const p of fins) assert.ok(p.y1 - p.y0 < 0.6, `${p.name} a thin blade`);
    // across the glass faces only a thin, soft band every two storeys at the blades' levels (the close vertical fins are
    // the façade's pattern)
    const bands = kit.parts.filter((p) => new RegExp(`^${t}-glass-band-`).test(p.name));
    assert.ok(bands.length >= 100 && bands.every((p) => p.type === 'beam' && p.bounds.maxY - p.bounds.minY < 0.6), `${t}: ${bands.length} thin glass bands`);
    const bandLevels = [...new Set(bands.map((p) => Math.round(p.bounds.minY)))];
    assert.ok(bandLevels.every((y) => levels.some((l) => Math.abs(l - y) <= 1)), `${t}: the bands at the blades' levels`);
    // the colonnade: open between the columns under the Shenton Way face, the floors over it
    const [x, z, wx, wz] = at(...SGX[t].colonnade);
    assert.equal(solidOver(kit, x, z, 0.5, 12).length, 0, `${t}: the colonnade is open`);
    assert.ok(!colliderAt(colliders, wx, 3, wz), `${t}: free to walk`);
    assert.ok(colliderAt(colliders, wx, 20, wz) && solidOver(kit, x, z, 14, 20).length, `${t}: the tower over it`);
    assert.ok(kit.parts.filter((p) => new RegExp(`^${t}-column-`).test(p.name)).length >= 8, `${t}: its columns`);
  }
});

test('SGX Centre: the podium between the towers with its colonnade, the open gap above it, the forecourts', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  const { colliders } = kit.finish();
  const [gx, gz, gwx, gwz] = at(...SGX.gap);
  assert.ok(Math.abs(topAt(kit, gx, gz) - PODIUM) <= 1.5, `the podium's roof at ${topAt(kit, gx, gz)} m`);
  assert.equal(solidOver(kit, gx, gz, PODIUM + 2, 400).length, 0, 'open over it between the towers');
  for (const y of [10, 40, 120]) assert.equal(colliderAt(colliders, gwx, y, gwz), y < PODIUM, `${y} m over the podium`);
  const [cx, cz, cwx, cwz] = at(...SGX.podiumColonnade);
  assert.equal(solidOver(kit, cx, cz, 0.5, 5).length, 0, 'the colonnade on Shenton Way is open');
  assert.ok(!colliderAt(colliders, cwx, 2.5, cwz) && colliderAt(colliders, cwx, 10, cwz), 'walk under, the podium above');
  // the drop-off canopy on the north forecourt: open under it, its roof on columns; the lawn beside it, paved above the
  // city's lawn
  const [dx, dz, dwx, dwz] = at(...SGX.dropOff);
  assert.equal(solidOver(kit, dx, dz, 0.5, 7.5).length, 0, 'open under the drop-off canopy');
  assert.ok(solidOver(kit, dx, dz, 7.5, 10).some((p) => p.name === 'base-canopy'), 'the canopy over it');
  assert.ok(!colliderAt(colliders, dwx, 3, dwz) && colliderAt(colliders, dwx, 8.6, dwz), 'drive under, solid roof');
  assert.ok(kit.parts.filter((p) => /^base-canopy-column-/.test(p.name)).length >= 3, 'on columns');
  for (const where of ['dropOff', 'lawn', 'southForecourt']) {
    const [x, z] = at(...SGX[where]);
    assert.ok(builtOver(kit, x, z, 0, 1).some((p) => p.y1 >= 0.3 && p.y0 <= 0.01), `${where}: paved or planted above the city's lawn`);
  }
});

test('SGX Centre: nothing floats — every raised piece rests on or in something under it', async () => {
  const { kit } = await siteModel('sgx-centre');
  const parts = kit.parts.filter((p) => p.type !== 'sign');
  const overlap = (a, b) => a.minX <= b.maxX + 0.05 && b.minX <= a.maxX + 0.05 && a.minZ <= b.maxZ + 0.05 && b.minZ <= a.maxZ + 0.05;
  const byName = new Map(parts.map((p) => [p.name, p]));
  for (const p of parts) {
    if (p.bounds.minY <= 0.5) continue;
    const under = parts.find((q) => q !== p && !/^(one|two)-rim-/.test(q.name) && q.bounds.minY < p.bounds.minY - 0.01 && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds));
    // the roof slab is one piece, drawn in slices along the tower so that it slopes: a slice of its overhang past the
    // outer face carries on from the slice before it
    const slice = /^(one|two)-canopy-(\d+)$/.exec(p.name), before = slice && byName.get(`${slice[1]}-canopy-${slice[2] - 1}`);
    const carried = before && overlap(p.bounds, before.bounds) && before.bounds.maxY >= p.bounds.maxY;
    // ... and its dark fascia trims the slab's edge, hanging from it
    const rim = /^(one|two)-rim-/.test(p.name) && parts.some((q) => /^(one|two)-canopy-\d+$/.test(q.name) && overlap(p.bounds, q.bounds) && q.bounds.maxY >= p.bounds.maxY - 0.1);
    assert.ok(under || carried || rim, `${p.name} at ${p.bounds.minY.toFixed(2)} m rests on something`);
  }
  for (const t of ['one', 'two']) {
    const overhang = parts.filter((p) => new RegExp(`^${t}-canopy-\\d+$`).test(p.name) && !parts.some((q) => q !== p && !/-canopy-|-rim-/.test(q.name) && q.bounds.minY < p.bounds.minY && q.bounds.maxY >= p.bounds.minY - 0.05 && overlap(p.bounds, q.bounds)));
    assert.ok(overhang.length <= 3, `${t}: only the last few slices (${overhang.length}) are the slab's overhang past the outer face`);
  }
  // the portal's lintel spans its posts; the masts start on the tower
  for (const t of ['one', 'two']) {
    const lintel = kit.parts.find((p) => p.name === `${t}-portal-lintel`);
    const posts = kit.parts.filter((p) => new RegExp(`^${t}-(portal-post|corner)`).test(p.name) && p.y1 >= lintel.y1 - 0.01);
    assert.ok(posts.length >= 2 && posts.every((p) => p.y0 < lintel.y0), `${t}: the lintel on its two posts`);
    const mast = kit.parts.filter((p) => new RegExp(`^${t}-mast-`).test(p.name));
    assert.ok(Math.min(...mast.map((p) => p.bounds.minY)) <= TOP - 5, `${t}: the mast runs down the post`);
  }
});

test('SGX Centre: its signs are at street level — the name on the fascia and the SGX letters on their plinth', async () => {
  const { kit } = await siteModel('sgx-centre');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.deepEqual(Array.from(signs, (s) => s.name).sort(), ['sign:sgx-centre-1', 'sign:sgx-letters']);
  for (const s of signs) assert.ok(s.y1 < 16, `${s.name} at street level, nothing on the crowns`);
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  const name = signs.find((s) => s.name === 'sign:sgx-centre-1');
  const [mx, mz] = [(name.ring[0][0] + name.ring[1][0]) / 2, (name.ring[0][1] + name.ring[1][1]) / 2];
  const host = solids.filter((p) => p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 0.6 && w.y0 <= name.y0 && w.y1 >= name.y1));
  assert.ok(host.some((p) => p.name === 'one-fascia'), 'SGX CENTRE 1 on the fascia over the colonnade');
  const letters = signs.find((s) => s.name === 'sign:sgx-letters');
  const [lx, lz] = [(letters.ring[0][0] + letters.ring[1][0]) / 2, (letters.ring[0][1] + letters.ring[1][1]) / 2];
  const plinth = solids.find((p) => p.name === 'base-letters-plinth');
  assert.ok(plinth && plinth.y0 <= 0.01 && Math.abs(letters.y0 - plinth.y1) < 0.01 && covers(plinth.ring, lx, lz), 'the letters stand on their plinth');
  assert.ok(letters.y1 - letters.y0 >= 2 && letters.y1 - letters.y0 <= 3.5, 'about 3 m tall');
});

test('SGX Centre stays finite, batched and free of flicker; solid where built', async () => {
  const { kit, at } = await siteModel('sgx-centre');
  assert.ok(kit.triangles > 3000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  for (const t of ['one', 'two']) {
    for (const y of [1.5, 50, 140]) assert.ok(solidAt(SGX[t].mid, y), `${t} is solid at ${y} m`);
    assert.ok(solidAt(SGX[t].inner, 166) && !solidAt(SGX[t].inner, ROOF + 1.5), `${t}: solid to its roof near the inner end`);
    assert.ok(solidAt(SGX[t].outer, 150) && !solidAt(SGX[t].outer, 160), `${t}: lower near the outer end`);
  }
  assert.ok(footprints.filter((f) => f.h >= 145).length >= 2, 'the map has both towers at their heights');
});
