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

for (const [model, documented] of [['uob-plaza', 280], ['one-raffles-place', 283], ['guoco-tower', 290], ['republic-plaza', 280], ['asia-square', 228], ['marina-bay-financial-centre', 245], ['marina-one', 225], ['duo', 186],
  ['capitaspring', 280], ['ocean-financial-centre', 245], ['capitagreen', 242], ['the-sail', 245], ['one-raffles-quay', 245],
  ['capital-tower', 254], ['ocbc-centre', 198], ['altez', 250], ['skysuites-anson', 250], ['six-battery-road', 174], ['one-fullerton', 12]]) {
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

test('Raffles Place MRT roofs stop descent and both faÃ§ades have real ornamental geometry', async () => {
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

// SG-034: literal drawing probes in true east/north metres, located independently of the model's local frame.
async function waterboatModel() {
  const m = await siteModel('fullerton-waterboat-house');
  const point = (east, north) => m.at(103.853535 + east / 111290, 1.287066 + north / 110574);
  const over = (east, north, y0, y1) => {
    const [x, z] = point(east, north);
    return builtOver(m.kit, x, z, y0, y1);
  };
  return { ...m, point, over };
}

test('SG-034 Waterboat House replaces its one mapped envelope and stays within the waterfront site', async () => {
  const { kit, L, info } = await waterboatModel();
  const { default: config } = await import('../tools/city/cities/singapore.mjs');
  const registration = config.landmarks.find((l) => l.id === L.id);
  assert.deepEqual(registration.hide, [172931401]);
  assert.equal(registration.hideRelations?.length || 0, 0);
  assert.deepEqual(L.parts.map((p) => p.id), [172931401]);
  assert.equal(info.name, 'The Fullerton Waterboat House');
  assert.ok(Math.hypot(L.x, L.z) > 100, 'real waterfront anchor, not the world origin');
  const b = kit.bounds();
  assert.ok(b.maxY >= 13 && b.maxY <= 16, `low roof and flagpoles: ${b.maxY} m`);
  assert.ok(b.minY >= -0.5);
  for (const [axis, i] of [['X', 0], ['Z', 1]]) {
    const values = L.parts[0].ring.filter((_, k) => k % 2 === i).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b['min' + axis] >= Math.min(...values) - 1.6, axis + ' lower footprint bound');
    assert.ok(b['max' + axis] <= Math.max(...values) + 1.6, axis + ' upper footprint bound');
  }
});

test('SG-034 Waterboat House has stepped historic roofs and a lower distinct annexe', async () => {
  const { kit, over } = await waterboatModel();
  const top = (east, north) => Math.max(0, ...over(east, north, 0, 30).map((p) => p.y1));
  assert.ok(over(-6, 4, 4.8, 5).length, 'curved western historic wing at its mapped location');
  assert.ok(top(-6, 4) >= 7 && top(-6, 4) < 9, 'open roof terrace over the long wing');
  assert.ok(top(4, -11) >= 10.5 && top(4, -11) <= 11.9, 'taller rounded southern roof');
  assert.ok(top(10, 2) >= 5.8 && top(10, 2) < 7, 'separate low eastern glass annexe');
  assert.ok(over(10, 2, 2, 3).length, 'annexe is a complete volume below its roof');
  assert.equal(over(1.5, 5, 1, 12).length, 0, 'space between house and annexe stays open');
  const sign = kit.parts.find((p) => p.type === 'sign' && p.name === 'waterboat-house-name');
  assert.ok(sign && sign.y0 > 2.8 && sign.y1 < 3.6, 'building-name panel above the entrance, below the balcony');
});

test('SG-034 Waterboat House keeps paths clear and stops descent through roofs and its raised link', async () => {
  const { kit, point, over } = await waterboatModel();
  const { colliders } = kit.finish();
  const hit = (east, north, y) => {
    const [, , x, z] = point(east, north);
    return colliderAt(colliders, x, y, z);
  };
  for (const [east, north] of [[-18, 0], [19, 2], [0, 19], [1.5, 5]]) {
    assert.ok(!hit(east, north, 1.6), `clear pedestrian space ${east},${north}`);
  }
  assert.ok(!hit(1.5, 10, 1.6), 'passage below the glazed link is open');
  assert.equal(over(1.5, 10, 0.6, 2.4).length, 0, 'no visible wall beneath the bridge');
  assert.ok(hit(1.5, 10, 3.65), 'raised bridge deck stops descent');
  assert.ok(hit(1.5, 10, 5.9), 'bridge roof stops descent');
  assert.ok(hit(-6, 4, 7.55), 'historic wing roof stops descent');
  assert.ok(hit(4, -11, 10.9), 'upper rounded roof stops descent');
  assert.ok(hit(10, 2, 6.15), 'annexe roof stops descent');
  assert.ok(hit(-7.15, -3, 3.75), 'projecting street balcony stops descent');
  assert.ok(!hit(10, 2, 8), 'open air over annexe');
});

test('SG-034 Waterboat House is finite, batched and free of coplanar flicker', async () => {
  const { kit } = await waterboatModel();
  assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  assert.equal(kit.flicker().length, 0, JSON.stringify(kit.flicker().slice(0, 10)));
  assert.ok(kit.finish().group.children.length <= 16, 'at most 16 merged material batches');
});

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

// Oasia Hotel Downtown (SG-115): four green corner cores, L-shaped floors beside tall sky-garden voids,
// and an open crown ring, on its one mapped outline
async function oasiaModel() {
  const m = await siteModel('oasia-hotel-downtown');
  // Independent probes from the mapped outline's centre (OSM way 393100847 bounds centre), in metres east/north.
  const at = (east, north) => m.at(103.8443413 + east / 111290, 1.2758812 + north / 110574);
  const coversAt = (east, north, y) => {
    const [x, z] = at(east, north);
    return m.kit.parts.filter((p) => p.type !== 'sign' && p.y0 < y && p.y1 > y && covers(p.ring, x, z));
  };
  return { ...m, at, coversAt };
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
  assert.ok(b.maxY >= 187 && b.maxY <= 193, `crown top at ${b.maxY} m, documented 190.15 m`);
  assert.ok(b.minY >= -0.5 && b.minY <= 0.1, 'stands on the ground');
  for (const axis of ['X', 'Z']) {
    const values = L.parts[0].ring.filter((_, i) => i % 2 === (axis === 'X' ? 0 : 1)).map((v) => v - L[axis.toLowerCase()]);
    assert.ok(b[`min${axis}`] >= Math.min(...values) - 2.5 && b[`max${axis}`] <= Math.max(...values) + 2.5, `${axis}: the tower stays on its mapped footprint`);
  }
  assert.ok(kit.triangles > 4000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker.slice(0, 20)));
  assert.ok(kit.finish().group.children.length <= 16, 'merged material batches');
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const signs = kit.parts.filter((p) => p.type === 'sign');
  assert.ok(signs.length >= 2, 'the hotel name hangs on two faces below the crown');
  for (const s of signs) assert.ok(Math.hypot(s.ring[1][0] - s.ring[0][0], s.ring[1][1] - s.ring[0][1]) <= 22, `${s.name} fits the flat stretch of its face instead of floating off the curve`);
});

test('Oasia has four full-height corner cores and L-shaped floors beside tall sky-garden voids', async () => {
  const { kit, coversAt } = await oasiaModel();
  const cores = kit.parts.filter((p) => p.name.startsWith('corner-core-'));
  assert.equal(cores.length, 4, 'a service core in every rounded corner, as the plans label them');
  for (const c of cores) assert.ok(c.y0 <= 0 && c.y1 >= 144, `${c.name} runs the full height to the roof terrace`);
  for (const [e, n] of [[16, 16], [16, -16], [-16, 16], [-16, -16]])
    assert.ok(coversAt(e, n, 92).length > 0, `the corner ${e},${n} is solid in the guestroom stratum, detached core included`);
  // Offices (26-70 m) and club rooms (114-144 m) wrap the east+north corner; the south-west sky garden
  // beside them stays open from its deck to the next, about 44 m (30 m for the club stratum)
  for (const y of [30, 66, 118, 140]) assert.equal(coversAt(-18, -2, y).length, 0, `the south-west sky garden is open at ${y} m`);
  assert.ok(coversAt(13, 13, 50).length > 0, 'the office L fills the east/north faces between decks');
  // Guestrooms (70-114 m) flip to the south+west corner, opening the north-east sky garden
  for (const y of [76, 108]) assert.equal(coversAt(10, 14, y).length, 0, `the north-east sky garden is open at ${y} m`);
  assert.ok(coversAt(-13, -13, 92).length > 0, 'the guestroom L fills the south/west faces between decks');
});

test('Oasia crown is an open ring over the roof terrace, solid where its decks and walls are', async () => {
  const { kit, L, at, coversAt } = await oasiaModel();
  assert.ok(!kit.parts.some((p) => /vault/i.test(p.name)), 'no closed vault over the crown');
  assert.equal(coversAt(0, 0, 170).length, 0, 'the crown is hollow over the level-27 roof terrace');
  assert.equal(coversAt(0, 0, 188).length, 0, 'and open at the top: the roof pools show from above');
  assert.equal(coversAt(0, -18, 170).length, 0, 'nothing roofs the south roof pool');
  for (const name of ['roof-pool-water', 'roof-pool-north-water']) {
    const pool = kit.parts.find((p) => p.name === name);
    assert.ok(pool && pool.y0 >= 144 && pool.y1 < 149, `${name} sits on the 144 m roof terrace`);
  }
  const { colliders } = kit.finish();
  const hit = (east, north, y) => { const [x, z] = at(east, north); return colliderAt(colliders, x + L.x, y, z + L.z); };
  assert.ok(!hit(0, 0, 170) && !hit(0, 0, 188), 'no invisible slab fills or caps the crown');
  assert.ok(hit(0, -23.3, 160), 'the crown screen wall is solid at its face');
  assert.ok(hit(0, -21, 185), 'and solid where it has tapered inward near the top');
  assert.ok(hit(0, 0, 144.4), 'the roof-terrace deck stops descent');
  assert.ok(hit(-18, -2, 26.4) && hit(10, 14, 70.4) && hit(-18, -2, 114.4), 'every sky-terrace deck stops descent');
  assert.ok(hit(13, 13, 50), 'the office L is solid to aircraft');
  assert.ok(!hit(-18, -2, 50), 'the open sky garden beside it has no invisible wall');
  assert.ok(hit(16, 16, 92), 'the detached north-east corner core is solid in the guestroom stratum');
});

// Marina Bay Financial Centre: four towers of glass slabs slid past one another around an open middle, the residences'
// pool deck where OSM maps a 245 m building (which the first model built as a fifth tower down the middle)
const MBFC = {
  tower1: [103.854090, 1.280223], tower1Low: [103.854359, 1.280178], tower2: [103.853867, 1.279456], tower2Middle: [103.853961, 1.279609],
  tower2West: [103.853679, 1.279700], tower3: [103.854341, 1.279048], residences: [103.855258, 1.279636], residencesLow: [103.855123, 1.279681],
  pool: [103.854818, 1.279699], plaza: [103.854314, 1.279636], deck: [103.854560, 1.279352]
};

test('Marina Bay Financial Centre replaces its towers, its podium and the pool mapped as a tower, and nothing else', async () => {
  const { L, info } = await siteModel('marina-bay-financial-centre');
  assert.deepEqual(L.parts.map((p) => p.id).sort((a, b) => a - b), [116905040, 116905041, 116905042, 116905045, 116905047, 509003525,
    509003526, 509003527, 509003528, 509003529, 728243729]);
  assert.equal(info.name, 'Marina Bay Financial Centre');
});

test('Marina Bay Financial Centre: four towers at their heights, each of slabs at different heights, no tower on the pool deck', async () => {
  const { kit, at } = await siteModel('marina-bay-financial-centre');
  const top = ([lon, lat]) => { const [x, z] = at(lon, lat); return Math.max(0, ...builtOver(kit, x, z, 0, 400).map((p) => p.y1)); };
  for (const [where, h, what] of [[MBFC.tower1, 192, 'Tower 1 under its crown'], [MBFC.tower1Low, 138, "Tower 1's lower slab, toward the bay"],
    [MBFC.tower2, 245, 'Tower 2'], [MBFC.tower2Middle, 205, "Tower 2's middle slab"], [MBFC.tower2West, 165, "Tower 2's west slab"],
    [MBFC.tower3, 239, 'Tower 3'], [MBFC.residences, 227, 'the Residences under their crown'], [MBFC.residencesLow, 195, "the Residences' balconied slab"]]) {
    assert.ok(Math.abs(top(where) - h) <= 1, `${what} at ${h} m (${top(where)})`);
  }
  const [px, pz] = at(...MBFC.pool); // where OSM maps a 245 m building: the lap pool on the deck
  assert.equal(builtOver(kit, px, pz, 25, 400).length, 0, 'no tower between Tower 1 and the Residences');
  assert.ok(builtOver(kit, px, pz, 17, 19).some((p) => /pool/.test(p.name)), 'the lap pool on the podium deck');
  assert.ok(!kit.parts.some((p) => /suites/i.test(p.name)), 'Marina Bay Suites stands across Straits View, not in this block');
  // the crowns cut on a slant: Tower 1's falling toward its lower slab, the Residences' toward theirs
  for (const name of ['tower1-crown', 'residences-crown']) {
    const crown = kit.parts.find((p) => p.name === name);
    const ys = crown.walls.map((w) => w.y1);
    assert.ok(Math.max(...ys) - Math.min(...ys) >= 10, `${name} slants (${Math.min(...ys)} to ${Math.max(...ys)} m)`);
  }
});

test('Marina Bay Financial Centre: the tenants\' signs, each with its mark, hang on the crowns\' walls under their rooflines', async () => {
  const { kit } = await siteModel('marina-bay-financial-centre');
  const signs = kit.parts.filter((p) => p.type === 'sign');
  for (const [name, logo] of [['standard-chartered', 'standard-chartered'], ['standard-chartered-east', 'standard-chartered'], ['hsbc', 'hsbc'], ['dbs', 'dbs'], ['dbs-east', 'dbs']]) {
    assert.equal(signs.find((s) => s.name === `sign:${name}`)?.logo, logo, `${name} carries the ${logo} mark`);
  }
  const solids = kit.parts.filter((p) => p.type !== 'sign' && p.type !== 'beam' && p.ring.length >= 3);
  for (const s of signs) {
    const [mx, mz] = [(s.ring[0][0] + s.ring[1][0]) / 2, (s.ring[0][1] + s.ring[1][1]) / 2];
    const host = solids.filter((p) => p.walls.some((w) => Math.abs(mx * w.nx + mz * w.nz - w.off) < 1 && w.y0 <= s.y0 && w.y1 >= s.y1));
    assert.ok(host.length, `${s.name} hangs on a wall that stands behind all of it`);
  }
});

test('Marina Bay Financial Centre stays finite, batched and free of flicker, its middle open, its towers and deck solid', async () => {
  const { kit, at } = await siteModel('marina-bay-financial-centre');
  assert.ok(kit.triangles > 2000 && kit.triangles < 65000, `${kit.triangles} triangles`);
  const flicker = kit.flicker();
  assert.equal(flicker.length, 0, JSON.stringify(flicker));
  const [qx, qz] = at(...MBFC.plaza);
  assert.equal(builtOver(kit, qx, qz, 20, 400).length, 0, 'the plaza in the middle is open to the sky');
  const { group, colliders, footprints } = kit.finish();
  assert.ok(group.children.length <= 16, `${group.children.length} material batches`);
  for (const p of kit.parts) for (const v of Object.values(p.bounds)) assert.ok(Number.isFinite(v), p.name);
  const solidAt = (where, y) => { const [, , x, z] = at(...where); return colliderAt(colliders, x, y, z); };
  assert.ok(solidAt(MBFC.tower1, 170), 'Tower 1 is solid in its crown');
  assert.ok(solidAt(MBFC.residences, 201), 'the Residences are solid in theirs');
  assert.ok(solidAt(MBFC.tower2, 230), 'Tower 2 is solid up its height');
  assert.ok(solidAt(MBFC.deck, 12), 'the pool deck is solid');
  assert.ok(!solidAt(MBFC.plaza, 30), 'the air over the plaza is not');
  assert.ok(footprints.some((f) => f.h >= 244), 'the map has Tower 2 at its height');
});


// SG-035 / SG-036: probes are geographic points from the source plan, independent of the model's frame helper.
async function waterfrontModel(id) {
  const { GEO } = await geodata;
  const L = GEO.landmarks.find(l => l.id === id);
  assert.ok(L, `${id} has a generated mapped anchor`);
  const { build, info } = await import(pathToFileURL(join(__dirname, `../js/landmark-models/${id}.js`)).href);
  const kit = createKit({ anchor: L, name: id });
  kit.bearingDeg = GEO.frame.bearingDeg;
  build(kit, siteOf(L));
  const { makeFrame } = await import('../tools/city/frame.mjs');
  const frame = makeFrame({ lat0: GEO.frame.lat0, lon0: GEO.frame.lon0, theta: GEO.frame.bearingDeg * Math.PI / 180 });
  const at = (lon, lat, y) => {
    const [x,z] = frame.toWorld(lon,lat);
    return colliderAt(kit.finish().colliders,x,y,z);
  };
  return { kit, L, info, at };
}

for (const [id,ways,relations] of [
  ['clifford-pier',[99348745,407926383,986973999],[13262097]],
  ['customs-house',[395113920,406900754,406900756,986973995,986973998],[]]
]) {
  test(`${id}: exact mapped replacements, finite geometry, bounded materials and no flicker`, async () => {
    const { kit, L } = await waterfrontModel(id);
    const { default: config } = await import('../tools/city/cities/singapore.mjs');
    const entry = config.landmarks.find(l => l.id === id);
    assert.deepEqual([...entry.hide].sort((a,b)=>a-b), [...ways].sort((a,b)=>a-b));
    assert.deepEqual(entry.hideRelations || [], relations);
    assert.deepEqual(L.parts.map(p=>p.id).sort((a,b)=>a-b), [...ways].sort((a,b)=>a-b));
    for(const part of kit.parts)for(const value of Object.values(part.bounds))assert.ok(Number.isFinite(value), part.name);
    assert.ok(kit.triangles > 1500 && kit.triangles < 65000, `${kit.triangles} triangles`);
    assert.ok(kit.finish().group.children.length <= 16);
    assert.equal(kit.flicker().length, 0, JSON.stringify(kit.flicker().slice(0,10)));
    // A wrong anchor or bounding-box-filled site would consume its neighbours.
    const b=kit.bounds();
    assert.ok(Math.max(b.maxX-b.minX,b.maxZ-b.minZ)<110);
    const hotel=config.landmarks.find(l=>l.id==='fullerton-bay-hotel');
    assert.ok(hotel.hide.includes(986973997), 'SG-032 still owns its link');
    assert.ok(!entry.hide.includes(987031386), 'street-side promenade building survives');
  });
}

test('Clifford Pier: column-free hall, real west portal and side arcade stay passable', async () => {
  const { at } = await waterfrontModel('clifford-pier');
  for(const [name,lon,lat]of [
    ['hall',103.85352,1.283932],['west portal',103.85317,1.283956],
    ['south arcade',103.85352,1.283815],['north arcade',103.85352,1.284049]
  ])assert.ok(!at(lon,lat,2), name+' has no invisible wall');
  assert.ok(at(103.85352,1.283932,10.4), 'ridge roof stops descent');
  assert.ok(at(103.85352,1.283991,8.8), 'north sloping roof stops descent');
  assert.ok(at(103.85352,1.283870,8.8), 'south sloping roof stops descent');
  assert.ok(at(103.85352,1.283815,4.9), 'raised veranda roof is solid');
  assert.ok(!at(103.85352,1.283932,13), 'no generic mass over the gable');
});

test('Clifford Pier: hall roof rises to its ridge and west portal has open arch geometry', async () => {
  const { kit } = await waterfrontModel('clifford-pier');
  assert.ok(kit.bounds().maxY>=11 && kit.bounds().maxY<14);
  const arches=kit.parts.filter(p=>p.name.startsWith('hall-rib-'));
  assert.ok(arches.length>=100, 'ten segmented transverse arches');
  const roof=kit.parts.filter(p=>p.name.startsWith('gable-slope-'));
  assert.equal(roof.length,2);
  assert.ok(roof.every(p=>p.bounds.maxY-p.bounds.minY>3), 'slopes change the silhouette');
});

test('Customs House: tower is 23 m, solid through shaft and lookout, with clear air above', async () => {
  const { kit, at, info } = await waterfrontModel('customs-house');
  assert.equal(info.height,23);
  assert.ok(Math.abs(kit.bounds().maxY-23)<0.1);
  for(const y of [3,12,20,22.8])assert.ok(at(103.853706,1.282473,y), 'tower solid at '+y);
  assert.ok(!at(103.853706,1.282473,24));
  assert.ok(at(103.8534,1.28254,7.9), 'main roof stops descent');
});

test('Customs House: water basin and pavilion passage remain clear under solid umbrella roofs', async () => {
  const { at } = await waterfrontModel('customs-house');
  for(const y of [2,6,12])assert.ok(!at(103.8535,1.28277,y), 'central basin remains open at '+y);
  assert.ok(!at(103.85372,1.28275,2), 'pavilion edge passage is open');
  assert.ok(at(103.85372,1.28275,5.2), 'umbrella roof stops descent');
  assert.ok(!at(103.85377,1.28275,2), 'east promenade is clear');
  assert.ok(!at(103.8534,1.28241,2), 'southern waterfront walk is clear');
});


test('Clifford Pier: concrete ribs stay below the terracotta roof envelope', async () => {
  const {kit,L}=await waterfrontModel('clifford-pier');
  const {GEO}=await geodata;
  const {makeFrame}=await import('../tools/city/frame.mjs');
  const f=makeFrame({lat0:GEO.frame.lat0,lon0:GEO.frame.lon0,theta:GEO.frame.bearingDeg*Math.PI/180});
  const c=f.toWorld(103.853518225,1.2839318),a=182.8*Math.PI/180,t=GEO.frame.bearingDeg*Math.PI/180;
  const V=[Math.sin(a)*Math.cos(t)-Math.cos(a)*Math.sin(t),-Math.sin(a)*Math.sin(t)-Math.cos(a)*Math.cos(t)];
  for(const p of kit.parts.filter(p=>p.name.startsWith('hall-rib-'))) {
    const v=Math.min(...p.ring.map(q=>Math.abs((q[0]+L.x-c[0])*V[0]+(q[1]+L.z-c[1])*V[1])));
    assert.ok(p.bounds.maxY<11.15-v/10.5*3.5-0.03, p.name+' fits beneath the sloping roof');
  }
  const [x,z]=f.toWorld(103.853818,1.283917);
  assert.ok(kit.parts.some(p=>p.y0>7&&p.y0<9&&p.y1>10&&covers(p.ring,x-L.x,z-L.z)), 'east gable has its white attic face');
});


test('Clifford Pier: structural entrance arches stop flight above a clear doorway', async () => {
  const {kit}=await waterfrontModel('clifford-pier');
  const colliders=kit.finish().colliders;
  // Independently inspected west centre-arch concrete, fixed in the generated city frame.
  assert.ok(colliderAt(colliders,169.8766064541,5.8298702727,-91.9753031815), 'thick arch is solid');
  assert.ok(!colliderAt(colliders,169.8766064541,2,-91.9753031815), 'doorway below stays passable');
});

test('Clifford Pier: conditioned hall glazing reaches the eaves above the veranda', async () => {
  const {at}=await waterfrontModel('clifford-pier');
  assert.ok(at(103.8535514,1.28401302,6), 'north upper glass wall closes the hall');
  assert.ok(at(103.85354337,1.28384771,6), 'south upper glass wall closes the hall');
});

for (const [id, height, ways, maxSpan] of [
  ['singapore-land-tower', 213, [46595418, 939684168], 90],
  ['maybank-tower', 175.3, [106193386, 325793730, 1075240988, 1075240989, 1075553558], 60]
]) {
  test(`${id}: exact mapped replacements, bounded geometry and no coplanar flicker`, async () => {
    const { kit, L, info } = await siteModel(id);
    const { default: city } = await import('../tools/city/cities/singapore.mjs');
    const entry = city.landmarks.find(l => l.id === id);
    assert.deepEqual([...entry.hide].sort((a, b) => a - b), ways);
    assert.deepEqual(entry.hideRelations ?? [], []);
    assert.deepEqual(L.parts.map(p => p.id).sort((a, b) => a - b), ways);
    assert.equal(info.height, height);
    const bounds = kit.bounds();
    assert.ok(Math.abs(bounds.maxY - height) < 0.5);
    assert.ok(Math.abs(bounds.minY) < 0.05);
    assert.ok(Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) < maxSpan);
    for (const part of kit.parts) assert.ok(Object.values(part.bounds).every(Number.isFinite), part.name);
    assert.ok(kit.triangles < 65000, `${kit.triangles} triangles`);
    assert.ok(kit.finish().group.children.length <= 16);
    const flicker = kit.flicker();
    assert.equal(flicker.length, 0, JSON.stringify(flicker));
  });
}

test('SG-008: plaza stays open below the canopy and the podium and gallery decks stop descent', async () => {
  const { kit, at } = await siteModel('singapore-land-tower');
  const { colliders } = kit.finish();
  const [x, z, wx, wz] = at(103.85187930, 1.28446494);
  assert.equal(builtOver(kit, x, z, 1, 3).length, 0, 'unobstructed beneath the entrance canopy');
  assert.ok(builtOver(kit, x, z, 7.4, 8.2).length, 'canopy is visible above the plaza');
  assert.ok(colliderAt(colliders, wx, 7.7, wz), 'canopy stops descent');
  assert.ok(!colliderAt(colliders, wx, 2, wz), 'walkway has no invisible wall');
  const solidAt = (lon, lat, y) => {
    const [, , x, z] = at(lon, lat);
    return colliderAt(colliders, x, y, z);
  };
  assert.ok(!solidAt(103.85175716, 1.28446071, 2), 'west plaza is clear beyond the canopy');
  assert.ok(solidAt(103.85221718, 1.28455848, 15.7), 'podium deck is solid');
  assert.ok(solidAt(103.85201825, 1.28471193, 197.6), 'roof deck is solid');
  assert.ok(!solidAt(103.85201825, 1.28471193, 208), 'sky gallery remains open between crown screens');
});

test('SG-009: the mapped podium, narrow high roof and sloping wing preserve the river edge and setbacks', async () => {
  const { kit, at } = await siteModel('maybank-tower');
  const { colliders } = kit.finish();
  const solidAt = (lon, lat, y) => {
    const [, , x, z] = at(lon, lat);
    return colliderAt(colliders, x, y, z);
  };
  assert.ok(solidAt(103.85259929, 1.28571874, 20.6), 'podium roof stops descent beyond the tower');
  assert.ok(solidAt(103.85247152, 1.28589729, 174.7), 'narrow high crown is solid');
  assert.ok(solidAt(103.85257624, 1.28594938, 164), 'sloping wing is solid below its roof');
  assert.ok(!solidAt(103.85257624, 1.28594938, 174.7), 'wing steps down from the high crown');
  assert.ok(!solidAt(103.85252457, 1.28607500, 40), 'tower is set back above the river podium');
  assert.ok(!solidAt(103.85241217, 1.28609979, 2), 'riverside promenade is clear');
  assert.ok(!solidAt(103.85241495, 1.28582880, 3), 'Bank of China side remains outside the Maybank collider');
});
