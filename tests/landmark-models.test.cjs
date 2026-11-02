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

test('the geodata anchors the six CBD landmarks with the mapped parts their programs build from', async () => {
  const { GEO } = await geodata;
  const ids = GEO.landmarks.map((l) => l.id);
  for (const id of ['uob-plaza', 'one-raffles-place', 'guoco-tower', 'republic-plaza', 'asia-square', 'marina-bay-financial-centre']) assert.ok(ids.includes(id), id);
  const republic = GEO.landmarks.find((l) => l.id === 'republic-plaza');
  assert.ok(republic.parts.some((p) => p.roofShape === 'skillion' && p.roofDir >= 0 && p.roofHeight > 0), 'the sloped corner parts carry their roof tags');
  const uob = GEO.landmarks.find((l) => l.id === 'uob-plaza');
  assert.ok(uob.parts.length >= 40, `UOB Plaza: ${uob.parts.length} mapped parts (both towers' stacks)`);
  assert.ok(uob.parts.some((p) => p.height === 280), 'the top of Plaza One at 280 m');
  const guoco = GEO.landmarks.find((l) => l.id === 'guoco-tower');
  assert.ok(guoco.parts.some((p) => p.height === 290 && p.minHeight === 180), 'the Wallich Residence part');
});

for (const [model, documented] of [['uob-plaza', 280], ['one-raffles-place', 283], ['guoco-tower', 290], ['republic-plaza', 280], ['asia-square', 228], ['marina-bay-financial-centre', 245], ['marina-one', 225], ['duo', 186]]) {
  test(`${model}: builds on its anchor to its documented height, with nothing to flicker`, async () => {
    const { GEO } = await geodata;
    const L = GEO.landmarks.find((l) => l.model === model);
    const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${model}.js`)).href);
    assert.equal(info.height, documented);
    const kit = createKit({ anchor: { x: L.x, z: L.z }, name: L.id });
    kit.bearingDeg = GEO.frame.bearingDeg;
    const t0 = performance.now();
    build(kit, siteOf(L));
    const ms = performance.now() - t0;
    assert.ok(ms < 500, `built in ${Math.round(ms)} ms`);
    const b = kit.bounds();
    assert.ok(Math.abs(b.maxY - documented) <= 3, `${b.maxY} m tall, ${documented} documented`);
    assert.ok(b.minY >= -0.5 && b.minY <= 0.5, `stands on the ground (${b.minY})`);
    assert.ok(Math.max(Math.abs(b.minX), Math.abs(b.maxX), Math.abs(b.minZ), Math.abs(b.maxZ)) < 200, 'within 200 m of its anchor');
    assert.ok(kit.parts.length >= 4, `${kit.parts.length} parts`);
    const flicker = kit.flicker();
    assert.equal(flicker.length, 0, 'faces that would flicker: ' + JSON.stringify(flicker));
    const { colliders, footprints } = kit.finish();
    assert.ok(colliders.length >= 1 && footprints.length >= 1, 'something to walk into, something on the map');
    for (const c of colliders) assert.ok(c.maxY > c.minY && c.maxX > c.minX && c.maxZ > c.minZ && c.obb);
  });
}

async function fullertonModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'fullerton-hotel');
  assert.ok(L, 'the Fullerton Hotel has its own mapped landmark anchor');
  const { build } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/fullerton-hotel.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  return { kit, L };
}

test('Fullerton replaces the hotel footprint, preserving the separate One Fullerton building', async () => {
  const { kit, L } = await fullertonModel();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [46595395,407926378,407926385]);
  assert.ok(kit.triangles > 1000 && kit.triangles < 65000, `detailed but bounded geometry: ${kit.triangles} triangles`);
  const b = kit.bounds();
  assert.ok(b.maxY >= 36 && b.maxY <= 44, `heritage massing and rooftop flag: ${b.maxY} m`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.1);
  for (const axis of ['X', 'Z']) {
    const values = L.parts.find((p) => p.id === 46595395).ring.filter((_, i) => i % 2 === (axis === 'X' ? 0 : 1)).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`] >= Math.min(...values) - 20 && b[`max${axis}`] <= Math.max(...values) + 20, `${axis}: attached to the mapped hotel and adjacent pool terrace`);
  }
});

function covers(ring, x, z) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j];
    if ((b > z) !== (d > z) && x < (c - a) * (z - b) / (d - b) + a) inside = !inside;
  }
  return inside;
}

test('Fullerton has an actual atrium below the roof rather than a solid hotel block', async () => {
  const { kit, L } = await fullertonModel();
  const { GEO } = await geodata;
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // The mapped way's vertex-average anchor is on the east wing, not at the atrium's physical centre.
  const { colliders } = kit.finish();
  for (const lat of [1.28603, 1.28643]) {
    // Test both atrium bays, clear of the central rooftop pavilion/link.
    const [wx, wz] = frame.toWorld(103.85298, lat);
    const x = wx - L.x, z = wz - L.z;
    const enclosing = kit.parts.filter((p) => p.y0 < 31 && p.y1 > 31 && covers(p.ring, x, z));
    assert.equal(enclosing.length, 0, 'the upper atrium stays open between the hotel wings');
    const below = kit.parts.filter((p) => p.y1 >= 15 && covers(p.ring, x, z));
    assert.ok(below.some((p) => p.y1 < 30), 'a lower atrium skylight is present');
    assert.ok(!colliders.some((c) => {
      const o = c.obb, dx = wx - o.cx, dz = wz - o.cz;
      return c.minY < 31 && c.maxY > 31 && Math.abs(dx * o.cs - dz * o.sn) < o.hx && Math.abs(dx * o.sn + dz * o.cs) < o.hz;
    }), 'wing colliders leave the upper atrium bays clear');
  }
  assert.ok(kit.parts.filter((p) => p.type === 'cylinder' && p.y1 - p.y0 >= 9).length >= 12, 'the giant-order colonnade has individual shafts');
  const pool = kit.parts.find((p) => p.name === 'infinity-pool-water');
  assert.ok(pool && pool.y1 < 5, 'the river-side pool terrace stays below the colonnade');
});

test('Fullerton details merge into a few materials without coplanar flicker', async () => {
  const { kit } = await fullertonModel();
  const start = performance.now();
  const flicker = kit.flicker();
  assert.ok(performance.now() - start < 2000, 'detail validation must not stall city startup for multiple seconds');
  assert.equal(flicker.length, 0, 'no overlapping coplanar detail surfaces: ' + JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  assert.ok(colliders.length > 0 && footprints.length > 0);
  assert.ok(colliders.some((c) => c.maxY >= 33), 'the upper hotel wings remain solid to aircraft, not just the low plinth');
  assert.ok(footprints.some((p) => p.h >= 33), 'the map records the actual hotel height');
  for (const name of ['atrium-skylight', 'lighthouse-pavilion']) {
    const part = kit.parts.find((p) => p.name === name);
    const x = kit.anchor.x + part.ring.reduce((sum, p) => sum + p[0] / part.ring.length, 0);
    const z = kit.anchor.z + part.ring.reduce((sum, p) => sum + p[1] / part.ring.length, 0);
    const y = (part.y0 + part.y1) / 2;
    assert.ok(colliders.some((c) => {
      const o = c.obb, dx = x - o.cx, dz = z - o.cz;
      return c.minY <= y && c.maxY >= y && Math.abs(dx * o.cs - dz * o.sn) <= o.hx && Math.abs(dx * o.sn + dz * o.cs) <= o.hz;
    }), `${name} stops descent through its interior`);
  }
  for (const p of kit.parts) for (const n of Object.values(p.bounds)) assert.ok(Number.isFinite(n), `finite bounds for ${p.name}`);
});

async function fullertonBayModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'fullerton-bay-hotel');
  assert.ok(L, 'Fullerton Bay has its own landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/fullerton-bay-hotel.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  return { kit, L, info };
}

test('Fullerton Bay replaces only its hotel and low link at the mapped six-storey height', async () => {
  const { kit, L, info } = await fullertonBayModel();
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [184297025,406900561,986973997]);
  assert.equal(info.height, 25);
  const main = L.parts.find((p) => p.id === 406900561);
  assert.equal(main.levels, 6);
  assert.equal(main.height, 25);
  const b = kit.bounds();
  assert.ok(b.maxY >= 26 && b.maxY <= 34, 'roof furniture and street-side spine above the 25 m block');
  assert.ok(b.minY >= -0.5 && b.minY <= 0.1);
  for (const axis of ['X', 'Z']) {
    const values = L.parts.find((p) => p.id === 184297025).ring.filter((_, i) => i % 2 === (axis === 'X' ? 0 : 1)).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`] >= Math.min(...values) - 8 && b[`max${axis}`] <= Math.max(...values) + 8, `${axis}: hotel stays on the mapped site`);
  }
});

test('Fullerton Bay has sloping glass, a roof pool and a genuinely low pier link', async () => {
  const { kit } = await fullertonBayModel();
  const tilted = kit.parts.filter((p) => p.type === 'loft' && p.y1 - p.y0 > 10 && p.caps.some((c) => c.ring.some((q, i) => Math.hypot(q[0] - p.ring[i][0], q[1] - p.ring[i][1]) > 1)));
  assert.ok(tilted.length >= 4, 'corner glass is inclined geometry rather than a printed texture');
  const pool = kit.parts.find((p) => p.name === 'rooftop-pool-water');
  assert.ok(pool && pool.y0 >= 24 && pool.y1 < 27, 'pool on the rooftop');
  const roof = kit.parts.find((p) => p.name === 'roof-deck');
  assert.ok(pool.ring.every(([x,z]) => covers(roof.ring,x,z)), 'pool stays within the guestroom roof');
  const upperLetters = kit.parts.filter((p) => p.name.startsWith('hotel-sign-') && p.y1 > roof.y0);
  assert.ok(upperLetters.length > 0 && upperLetters.every((p) => p.ring.every(([x,z]) => !covers(roof.ring,x,z))), 'roof lettering stays in front of the solid roof slab');
  assert.ok(kit.parts.find((p) => p.name === 'north-pier-link').y1 <= 7, 'link stays below the guestroom floors');
  assert.equal(kit.parts.filter((p) => /^jacuzzi-water-/.test(p.name)).length, 2);
});

test('Fullerton Bay is batched, finite, free of flicker and solid beneath the rooftop pool', async () => {
  const { kit } = await fullertonBayModel();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const start = performance.now(), flicker = kit.flicker();
  assert.ok(performance.now() - start < 2000);
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16 && footprints.length > 0);
  const pool = kit.parts.find((p) => p.name === 'rooftop-pool-water');
  const [x,z] = pool.ring.reduce(([x,z],p) => [x+p[0]/pool.ring.length,z+p[1]/pool.ring.length],[kit.anchor.x,kit.anchor.z]);
  assert.ok(colliders.some((c) => {
    const o=c.obb,dx=x-o.cx,dz=z-o.cz;
    return c.minY <= 24.9 && c.maxY >= 24.9 && Math.abs(dx*o.cs-dz*o.sn) <= o.hx && Math.abs(dx*o.sn+dz*o.cs) <= o.hz;
  }), 'roof interior stops vertical descent');
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
});

test('Fullerton Bay Lantern canopy stops descent through both tent halves', async () => {
  const { kit } = await fullertonBayModel(), { colliders } = kit.finish();
  const halves = kit.parts.filter((p) => p.name.startsWith('lantern-tent-roof-'));
  assert.equal(halves.length, 2);
  for (const part of halves) {
    const [x,z] = part.ring.reduce(([x,z],p) => [x+p[0]/part.ring.length,z+p[1]/part.ring.length],[kit.anchor.x,kit.anchor.z]);
    assert.ok(colliders.some((c) => {
      const o=c.obb,dx=x-o.cx,dz=z-o.cz;
      return c.minY <= 28.2 && c.maxY >= 28.2 && Math.abs(dx*o.cs-dz*o.sn) <= o.hx && Math.abs(dx*o.sn+dz*o.cs) <= o.hz;
    }), `${part.name} has collision above the deck, inside its visible roof`);
  }
});

async function rafflesMrtModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'raffles-place-mrt');
  assert.ok(L, 'the two Raffles Place MRT pavilions have a landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/raffles-place-mrt.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0:GEO.frame.lat0,lon0:GEO.frame.lon0,theta:GEO.frame.bearingDeg*Math.PI/180 });
  return { kit, L, info, frame };
}

const colliderAt = (colliders,x,y,z) => colliders.some((c) => {
  const o=c.obb,dx=x-o.cx,dz=z-o.cz;
  return c.minY < y && c.maxY > y && Math.abs(dx*o.cs-dz*o.sn) < o.hx && Math.abs(dx*o.sn+dz*o.cs) < o.hz;
});

test('Raffles Place MRT replaces exactly its two park pavilions, with low roofs and taller finials', async () => {
  const { kit, L, info } = await rafflesMrtModel();
  assert.deepEqual(L.parts.map(p=>p.id).sort((a,b)=>a-b),[106193387,106193391]);
  assert.equal(info.height,7);
  const b=kit.bounds();
  assert.ok(b.maxY >= 9 && b.maxY <= 12, 'photo-guided gables and finials above the nominal 7 m roof');
  for(const axis of ['X','Z']){
    const values=L.parts.flatMap(p=>p.ring.filter((_,i)=>i%2===(axis==='X'?0:1))).map(v=>v-L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`]>=Math.min(...values)-6 && b[`max${axis}`]<=Math.max(...values)+6, 'each pavilion stays on its own mapped footprint');
  }
});

test('Raffles Place MRT keeps both entrance bays and the park gap physically open', async () => {
  const { kit, L, frame } = await rafflesMrtModel(), { colliders } = kit.finish();
  for(const [name,lon,lat]of [['A front',103.8514598,1.2840541],['A inside',103.851458,1.284045],['B front',103.85149915,1.2844800],['B inside',103.851501,1.284493],['park',103.85148,1.28428]]){
    const [x,z]=frame.toWorld(lon,lat);
    const obstructing=kit.parts.filter(p=>p.y0<1.5&&p.y1>1.5&&covers(p.ring,x-L.x,z-L.z));
    assert.equal(obstructing.length,0, `${name}: no invented ground-level slab across the entrance or lawn`);
    assert.ok(!colliderAt(colliders,x,1.5,z), `${name}: clear of invisible collision walls`);
  }
});

test('Raffles Place MRT roofs stop descent and both façades have real ornamental geometry', async () => {
  const { kit, frame } = await rafflesMrtModel(), { colliders } = kit.finish();
  for(const [lon,lat]of [[103.851453,1.283954],[103.851509,1.284578]]){
    const [x,z]=frame.toWorld(lon,lat);
    assert.ok(colliderAt(colliders,x,4.6,z), 'solid roof interior above the open doorway');
  }
  assert.ok(kit.parts.filter(p=>p.name.includes('gable-masonry')).length>=60, 'shaped gable masonry rather than a flat sign texture');
  assert.ok(kit.parts.filter(p=>p.name.includes('clerestory-glass')).length>=6, 'three glazed entrance bays per pavilion');
});

test('Raffles Place MRT stays finite, batched and free of coplanar flicker', async () => {
  const { kit } = await rafflesMrtModel();
  assert.ok(kit.triangles>2000 && kit.triangles<65000, `${kit.triangles} triangles`);
  const start=performance.now(),flicker=kit.flicker();
  assert.ok(performance.now()-start<2000);
  assert.equal(flicker.length,0,JSON.stringify(flicker));
  assert.ok(kit.finish().group.children.length<=16);
  for(const p of kit.parts)for(const v of Object.values(p.bounds))assert.ok(Number.isFinite(v),p.name);
});

// Marina One and DUO: whole developments on their mapped parts, with the shapes that make them read from the map
async function siteModel(id) {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === id);
  assert.ok(L, `${id} has its own mapped landmark anchor`);
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${L.model}.js`)).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // a lon/lat as a point about the anchor, then in the world
  const at = (lon, lat) => { const [x, z] = frame.toWorld(lon, lat); return [x - L.x, z - L.z, x, z]; };
  return { kit, L, info, at };
}
// what is built over (x, z) about the anchor within the heights [y0, y1] (signs, posts and rafters aside)
const builtOver = (kit, x, z, y0, y1) => kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.y0 < y1 && p.y1 > y0 && p.ring.length >= 3 && covers(p.ring, x, z));

test('Marina One replaces its four towers, their shafts and corner crowns, and nothing else', async () => {
  const { L, info } = await siteModel('marina-one');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [463857945, 463857946, 463857947, 463857948, 463857949, 463858904, 463858905,
    941456992, 941456993, 941456994, 941456995, 941456996, 941456997]);
  assert.equal(info.name, 'Marina One');
});

test('Marina One: the office towers bridged high over an open portal, the residences lower, the Green Heart open to the sky', async () => {
  const { kit, at } = await siteModel('marina-one');
  const [px, pz] = at(103.852555, 1.277546); // the portal between the office towers
  assert.equal(builtOver(kit, px, pz, 2, 160).length, 0, 'the portal is open from the ground to the bridge');
  const bridge = builtOver(kit, px, pz, 170, 195);
  assert.ok(bridge.length >= 1 && Math.max(...bridge.map((p) => p.y1)) >= 199, 'a bridge of the top storeys joins the towers');
  const [ox, oz] = at(103.852920, 1.277881); // inside the north office tower
  assert.ok(Math.max(...builtOver(kit, ox, oz, 0, 300).map((p) => p.y1)) >= 199, 'the offices rise to their 200 m roof');
  const [rx, rz] = at(103.853737, 1.277319); // inside the Garden Tower
  const residence = builtOver(kit, rx, rz, 20, 300);
  assert.ok(residence.length && Math.abs(Math.max(...residence.map((p) => p.y1)) - 139) <= 7, 'the residences at 139 m (with their roof frames)');
  const [hx, hz] = at(103.853041, 1.277210); // the middle of the Green Heart
  assert.equal(builtOver(kit, hx, hz, 2, 300).length, 0, 'nothing over the garden at the heart');
  assert.ok(builtOver(kit, hx, hz, 0, 2).length >= 1, 'a garden floor at the bottom of the heart');
  const terraces = kit.parts.filter((p) => /^heart-terrace-/.test(p.name));
  assert.ok(new Set(terraces.map((p) => p.y1.toFixed(1))).size >= 4, 'terraces stepping up around the heart');
  assert.ok(kit.parts.filter((p) => /-louvre-/.test(p.name)).length >= 100, 'bronze louvres a storey apart on the faces toward the heart');
  assert.ok(kit.parts.filter((p) => p.type === 'beam' && /^pergola-/.test(p.name)).length >= 20, 'the roof pergola');
});

test('Marina One stays finite, batched and free of flicker, solid to fly into above its stilts and bridge', async () => {
  const { kit, at } = await siteModel('marina-one');
  assert.ok(kit.triangles > 5000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const start = performance.now(), flicker = kit.flicker();
  assert.ok(performance.now() - start < 2000, 'checked in a moment');
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const world = (lon, lat) => at(lon, lat).slice(2);
  const [rx, rz] = world(103.853737, 1.277319), [px, pz] = world(103.852555, 1.277546), [hx, hz] = world(103.853041, 1.277210);
  assert.ok(colliderAt(colliders, rx, 100, rz), 'the residences are solid up their height');
  assert.ok(colliderAt(colliders, px, 185, pz), 'the bridge is solid');
  assert.ok(!colliderAt(colliders, px, 80, pz), 'the portal under it is not');
  assert.ok(!colliderAt(colliders, hx, 60, hz), 'nor the air over the heart');
  assert.ok(footprints.some((f) => f.h >= 199), 'the map has the offices at their height');
});

test('DUO replaces its two towers and the Galleria between them', async () => {
  const { L, info } = await siteModel('duo');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [427064874, 432375288, 432375289, 432375290, 432375291, 432375292, 432375293, 432375294,
    560240322, 560240325, 560240327, 560240330, 560275084, 560275278]);
  assert.equal(info.name, 'DUO');
});

test('DUO: the Residences and the Tower at their documented heights, stacked with cantilevers and roof gardens', async () => {
  const { kit, at } = await siteModel('duo');
  const top = (x, z) => Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1));
  const [rx, rz] = at(103.858733, 1.299676); // the Residences' upper tower
  assert.ok(Math.abs(top(rx, rz) - 186) <= 2, `the Residences at 186 m (${top(rx, rz)})`);
  const [tx, tz] = at(103.857740, 1.299179); // the Tower's upper block
  assert.ok(Math.abs(top(tx, tz) - 179) <= 3, `the Tower at 179 m with its rooftop garden (${top(tx, tz)})`);
  const [cx, cz] = at(103.858609, 1.299594); // under the Residences' cantilever
  assert.equal(builtOver(kit, cx, cz, 10, 70).length, 0, 'the Residences cantilever over open air');
  assert.ok(builtOver(kit, cx, cz, 75, 95).length >= 1);
  const [kx, kz] = at(103.858225, 1.299280); // under the Tower's cantilever
  assert.equal(builtOver(kit, kx, kz, 10, 68).length, 0, 'the Tower\'s middle block cantilevers too');
  assert.ok(builtOver(kit, kx, kz, 75, 120).length >= 1);
  const [gx, gz] = at(103.857957, 1.299788); // the plaza the towers curve around
  assert.equal(builtOver(kit, gx, gz, 0.5, 300).length, 0, 'the plaza stays open');
  assert.ok(kit.parts.filter((p) => /tree-crown/.test(p.name)).length >= 12, 'trees on the roof gardens');
  assert.ok(kit.parts.some((p) => p.type === 'sign' && /andaz/.test(p.name)), 'the hotel\'s name down the Tower');
});

test('DUO stays finite, batched and free of flicker, solid to fly into above its stilts', async () => {
  const { kit, at } = await siteModel('duo');
  assert.ok(kit.triangles > 3000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const { group, colliders } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const [rx, rz] = at(103.858733, 1.299676).slice(2), [kx, kz] = at(103.858225, 1.299280).slice(2);
  assert.ok(colliderAt(colliders, rx, 150, rz), 'the Residences are solid up their height');
  assert.ok(colliderAt(colliders, kx, 100, kz), 'the Tower\'s cantilevered block is solid');
  assert.ok(!colliderAt(colliders, kx, 40, kz), 'the air under it is not');
});
