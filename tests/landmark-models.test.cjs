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

for (const [model, documented] of [['uob-plaza', 280], ['one-raffles-place', 283], ['guoco-tower', 290], ['republic-plaza', 280], ['asia-square', 228], ['marina-bay-financial-centre', 245]]) {
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

async function rafflesHotelModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'raffles-hotel');
  assert.ok(L, 'Raffles Hotel has a dedicated landmark anchor');
  const { build } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/raffles-hotel.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // Independent drawing coordinates: north-east along the plan, north-west toward the Arcade.
  const point = (u, v) => {
    const a = 37.1 * Math.PI / 180;
    const [x, z] = frame.toWorld(103.854565 + (u * Math.sin(a) - v * Math.cos(a)) / 111290,
      1.294280 + (u * Math.cos(a) + v * Math.sin(a)) / 110574);
    return [x - L.x, z - L.z];
  };
  return { kit, L, point };
}

test('Raffles Hotel replaces the hotel and Arcade at their mapped site within a bounded geometry budget', async () => {
  const { kit, L, point } = await rafflesHotelModel();
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === L.id);
  assert.deepEqual(registered.hideRelations, [3413910,3413596], 'both enclosing generic hotel masses are replaced');
  for (const id of [164176023,164177177])assert.ok(!registered.hide.includes(id), 'separate Seah Street buildings remain');
  assert.ok(L.parts.some((p) => p.id === 254815862));
  assert.ok(L.parts.length >= 40, 'all suite-wing pieces are replaced');
  assert.ok(!L.parts.some((p) => [39487263,172364973,172364975].includes(p.id)), 'Raffles City is separate');
  assert.ok(kit.triangles > 10000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const b = kit.bounds();
  assert.ok(b.maxY >= 24 && b.maxY <= 29, 'roof crest and flagpole, not a tower');
  for(const p of kit.parts)for(const value of Object.values(p.bounds))assert.ok(Number.isFinite(value), p.name + ' finite bounds');
  const [x,z] = point(42,38);
  assert.ok(covers(kit.parts.find((p) => p.name === 'main-body').ring,x,z), 'main building is on the independently located site');
  const corners = [[-15,-15],[160,-15],[160,175],[-15,175]].map(([u,v]) => point(u,v));
  for(const [axis,i] of [['X',0],['Z',1]]) {
    assert.ok(b['min'+axis] >= Math.min(...corners.map((p) => p[i]))-2, 'within hotel property ' + axis);
    assert.ok(b['max'+axis] <= Math.max(...corners.map((p) => p[i]))+2, 'within hotel property ' + axis);
  }
  const { group } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} merged material batches`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
});

test('Raffles Hotel keeps its gardens and Arcade square open in geometry and collision', async () => {
  const { kit, L, point } = await rafflesHotelModel();
  const { colliders } = kit.finish();
  for (const [name, u, v] of [['Palm Garden',6,45],['Palm Court',78,35],['Fern Court',15,105],['The Lawn',76,97],['Arcade square',111,146]]) {
    const [x, z] = point(u, v);
    assert.equal(kit.parts.filter((p) => p.y0 < 8 && p.y1 > 8 && covers(p.ring, x, z)).length, 0, name + ' has no invented mass');
    assert.ok(!colliderAt(colliders, x + L.x, 8, z + L.z), name + ' has no invisible building');
  }
});

test('Raffles Hotel has a detailed main front, hipped roofs, shaded verandas and a collidable elevated pool deck', async () => {
  const { kit, L, point } = await rafflesHotelModel();
  for (const prefix of ['main-pediment','main-porch','main-corner','main-arch','veranda-column','pool-water','arcade-roof']) {
    assert.ok(kit.parts.some((p) => p.name.startsWith(prefix)), prefix);
  }
  const { colliders } = kit.finish();
  const [x, z] = point(37,100);
  assert.ok(colliderAt(colliders,x + L.x,11.4,z + L.z), 'third-storey pool terrace stops descending players');
  assert.ok(!colliderAt(colliders,x + L.x,17,z + L.z), 'pool terrace is open above');
  for(const [u,v]of [[25.5,16.5],[59,17.5]]) {
    const [x,z]=point(u,v);
    assert.ok(colliderAt(colliders,x+L.x,19.1,z+L.z), 'projecting corner pavilion roof stops descent');
  }
  const [cx,cz]=point(135,102);
  assert.ok(kit.parts.some((p)=>p.name.endsWith('-rooms')&&p.y0<13&&p.y1>13&&covers(p.ring,cx,cz)), 'Casuarina suite wing has the third level shown on the hotel plan');
  const [sx,sz]=point(35.5,132);
  assert.ok(kit.parts.some((p)=>p.y0<4.8&&p.y1>4.8&&covers(p.ring,sx,sz)), 'mapped rear stair link is retained');
  for(const [name,u,v]of [['Lawn pavilion',97.8,96.2],['rear west canopy',17.6,141],['rear east canopy',54.4,141],['BBR rear canopy',0,36.5],['BBR side canopy',-8.8,45]]) {
    const [x,z]=point(u,v);
    assert.ok(kit.parts.some((p)=>p.y0<4.8&&p.y1>4.8&&covers(p.ring,x,z)), name+' has visible replacement geometry');
    assert.ok(colliderAt(colliders,x+L.x,4.8,z+L.z), name+' has roof collision');
    assert.ok(!colliderAt(colliders,x+L.x,1.8,z+L.z), name+' remains passable underneath');
  }
});

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

async function oasiaModel() {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find((l) => l.id === 'oasia-hotel-downtown');
  assert.ok(L, 'Oasia Hotel Downtown has its own landmark anchor');
  const { build, info } = await import(pathToFileURL(join(__dirname, '../js/landmark-models/oasia-hotel-downtown.js')).href);
  const kit = createKit({ anchor: L, name: L.id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  // Independent probes from the mapped outline's centre (OSM way 393100847 bounds centre), in metres east/north.
  const at = (east, north) => {
    const [x, z] = frame.toWorld(103.8443413 + east / 111290, 1.2758812 + north / 110574);
    return [x - L.x, z - L.z];
  };
  const coversAt = (east, north, y) => {
    const [x, z] = at(east, north);
    return kit.parts.filter((p) => p.type !== 'sign' && p.y0 < y && p.y1 > y && covers(p.ring, x, z));
  };
  return { kit, L, info, at, coversAt };
}

test('Oasia Hotel Downtown replaces exactly its one mapped outline at the documented 190 m', async () => {
  const { kit, L, info } = await oasiaModel();
  assert.deepEqual(L.parts.map((p) => p.id), [393100847]);
  assert.equal(L.parts[0].levels, 27);
  assert.equal(L.parts[0].height, 193, 'the mapped height tag the model refines to the documented 190.15 m');
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registered = config.landmarks.find((l) => l.id === 'oasia-hotel-downtown');
  assert.deepEqual(registered.hide, [393100847], 'only the hotel way is replaced');
  for (const id of [393100845, 393100848, 393100849, 393100850]) assert.ok(!registered.hide.includes(id), 'Guoco Tower neighbour parts remain mapped buildings');
  assert.equal(info.height, 190);
  const b = kit.bounds();
  assert.ok(b.maxY >= 187 && b.maxY <= 193, `vault crown top at ${b.maxY} m, documented 190.15 m`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.1, 'stands on the ground');
  for (const axis of ['X', 'Z']) {
    const values = L.parts[0].ring.filter((_, i) => i % 2 === (axis === 'X' ? 0 : 1)).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`] >= Math.min(...values) - 2.5 && b[`max${axis}`] <= Math.max(...values) + 2.5, `${axis}: the tower stays on its mapped footprint`);
  }
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  assert.ok(kit.finish().group.children.length <= 16, 'merged material batches');
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
});

test('Oasia sky terraces are genuinely open on alternating faces, with the core at the back corner', async () => {
  const { coversAt } = await oasiaModel();
  // Level-6 terrace (modelled open 23-41 m): open to the south, core behind the mesh to the north-west.
  assert.equal(coversAt(0, -16, 32).length, 0, 'the level-6 sky garden is open air on its south face, not a filled slab');
  assert.ok(coversAt(-8, 16, 32).length > 0, 'the level-6 back-corner core stands behind the closed faces');
  // Level-12 terrace (64-82 m) flips: open to the north, core to the south-east.
  assert.equal(coversAt(0, 16, 73).length, 0, 'the level-12 sky garden flips to open on its north face');
  assert.ok(coversAt(8, -16, 73).length > 0, 'the level-12 core flipped to the south-east corner');
  // Level-21 terrace (112-127 m) flips back to open south.
  assert.equal(coversAt(0, -16, 119).length, 0, 'the level-21 sky garden is open to the south again');
  // The enclosed hotel block between terraces is solid through its centre.
  assert.ok(coversAt(0, 0, 100).length > 0, 'the enclosed hotel floors fill the footprint between terraces');
});

test('Oasia crown is a hollow screen over the roof terrace, solid where its decks and vault are', async () => {
  const { kit, L, at, coversAt } = await oasiaModel();
  assert.equal(coversAt(0, 0, 160).length, 0, 'the red crown screen is hollow over the level-27 roof terrace');
  const roofPool = kit.parts.find((p) => p.name === 'roof-pool-water');
  assert.ok(roofPool && roofPool.y0 >= 146 && roofPool.y1 < 150, 'the rooftop pool sits on the level-27 terrace inside the crown');
  assert.ok(kit.parts.filter((p) => p.type === 'sign').length >= 2, 'the hotel name hangs on two faces below the crown');
  const { colliders } = kit.finish();
  const hit = (east, north, y) => { const [x, z] = at(east, north); return colliderAt(colliders, x + L.x, y, z + L.z); };
  assert.ok(!hit(0, 0, 160), 'no invisible slab fills the crown');
  assert.ok(hit(0, 0, 147.4), 'the roof-terrace deck stops descent');
  assert.ok(hit(0, 0, 188), 'the vault top stops descent onto the crown');
  assert.ok(hit(0, 0, 100), 'the enclosed hotel block is solid to aircraft');
  assert.ok(!hit(0, -16, 32), 'the open level-6 sky garden has no invisible wall');
  assert.ok(hit(0, -16, 23.4), 'the level-6 terrace deck stops descent');
});
