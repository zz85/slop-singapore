import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOF_SHAPES, roofShapeCode, packRoof, unpackRoof, roofHeightFor, roofPlacement, pitchedRoof } from '../js/roofs.js';

// js/roofs.js: the pitched roofs a city built from OpenStreetMap raises over its extruded footprints (Phase 3 of
// docs/tiny-look-plan.md): OSM roof:shape values to the five kinds built, packed with the roof's height and
// orientation into one integer of the geodata (tools/city/build.mjs), and the roof geometry itself over a building's
// turned box.

test('roof shapes: OSM values to the five the city builds, packed with their height and orientation', () => {
  assert.equal(roofShapeCode('gabled'), ROOF_SHAPES.gabled);
  assert.equal(roofShapeCode('hipped'), ROOF_SHAPES.hipped);
  for (const v of ['equal_hipped', 'side_hipped', 'half-hipped', 'round hipped', 'mansard', 'round', 'gambrel']) assert.equal(roofShapeCode(v), ROOF_SHAPES.hipped, v);
  for (const v of ['pyramidal', 'dome', 'onion', 'cone']) assert.equal(roofShapeCode(v), ROOF_SHAPES.pyramidal, v);
  assert.equal(roofShapeCode('skillion'), ROOF_SHAPES.skillion);
  assert.equal(roofShapeCode('saltbox'), ROOF_SHAPES.gabled);
  for (const v of ['flat', 'many', undefined, '', 'something']) assert.equal(roofShapeCode(v), ROOF_SHAPES.flat, String(v));
  const packed = packRoof({ shape: ROOF_SHAPES.hipped, across: true, included: true, heightDm: 45 });
  assert.deepEqual(unpackRoof(packed), { shape: ROOF_SHAPES.hipped, across: true, included: true, heightDm: 45 });
  assert.deepEqual(unpackRoof(0), { shape: ROOF_SHAPES.flat, across: false, included: false, heightDm: 0 });
  assert.equal(unpackRoof(packRoof({ shape: ROOF_SHAPES.skillion, across: false, included: false, heightDm: 2500 })).heightDm, 2500);
});

test('a roof\'s height when OSM gives none: a third of the short side within reason, flatter for a skillion', () => {
  assert.equal(roofHeightFor(ROOF_SHAPES.gabled, 9), 3);
  assert.equal(roofHeightFor(ROOF_SHAPES.hipped, 60), 6, 'capped');
  assert.equal(roofHeightFor(ROOF_SHAPES.pyramidal, 2), 1.2, 'never a sliver');
  assert.equal(roofHeightFor(ROOF_SHAPES.skillion, 12), 3);
  assert.equal(roofHeightFor(ROOF_SHAPES.skillion, 40), 4, 'capped');
  assert.equal(roofHeightFor(ROOF_SHAPES.flat, 20), 0);
});

// The box: centre (cx, cz), half sizes hx along (ux, uz) and hz across, as js/open-city-buildings.js orientedBox gives
// it; the roof between the eave at 20 m and the ridge at 23 m
const box = { cx: 100, cz: -50, hx: 10, hz: 4, ux: Math.cos(0.3), uz: Math.sin(0.3) };
const tris = (r) => r.positions.length / 9;
const points = (r) => Array.from({ length: r.positions.length / 3 }, (_, i) => r.positions.slice(i * 3, i * 3 + 3));
// a point's box coordinates (a along, b across)
const local = ([x, , z]) => [(x - box.cx) * box.ux + (z - box.cz) * box.uz, -(x - box.cx) * box.uz + (z - box.cz) * box.ux];
const within = (r) => points(r).every((p) => {
  const [a, b] = local(p);
  return Math.abs(a) <= box.hx + 1e-6 && Math.abs(b) <= box.hz + 1e-6 && p[1] >= 20 - 1e-6 && p[1] <= 23 + 1e-6;
});
// every face winds counter-clockwise seen from outside: its normal points away from the box's heart under the eaves
const outward = (r) => {
  const p = r.positions;
  for (let i = 0; i < p.length; i += 9) {
    const ax = p[i + 3] - p[i], ay = p[i + 4] - p[i + 1], az = p[i + 5] - p[i + 2];
    const bx = p[i + 6] - p[i], by = p[i + 7] - p[i + 1], bz = p[i + 8] - p[i + 2];
    const n = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
    const c = [(p[i] + p[i + 3] + p[i + 6]) / 3 - box.cx, (p[i + 1] + p[i + 4] + p[i + 7]) / 3 - 19.5, (p[i + 2] + p[i + 5] + p[i + 8]) / 3 - box.cz];
    if (n[0] * c[0] + n[1] * c[1] + n[2] * c[2] <= 0) return false;
  }
  return true;
};
const atRidge = (r) => points(r).filter((p) => Math.abs(p[1] - 23) < 1e-6);

test('gabled: two slopes up to a ridge along the long side, closed by two vertical gable ends', () => {
  const r = pitchedRoof({ shape: ROOF_SHAPES.gabled, box, eave: 20, ridge: 23 });
  assert.equal(tris(r), 6);
  assert.ok(within(r));
  assert.ok(outward(r));
  const ridge = atRidge(r);
  assert.ok(ridge.length >= 2);
  assert.ok(ridge.every((p) => Math.abs(local(p)[1]) < 1e-6 && Math.abs(Math.abs(local(p)[0]) - box.hx) < 1e-6), 'the ridge runs the full long side, down the middle');
  assert.equal(r.ends.length, 6);
  assert.equal(r.ends.filter(Boolean).length, 2, 'the two gable ends are the vertical faces');
  // across: the ridge runs the short way
  const a = pitchedRoof({ shape: ROOF_SHAPES.gabled, box, eave: 20, ridge: 23, across: true });
  assert.ok(atRidge(a).every((p) => Math.abs(local(p)[0]) < 1e-6));
  assert.ok(within(a) && outward(a));
});

test('hipped: the ridge shortened by the half-width, four slopes; a square box comes to a point', () => {
  const r = pitchedRoof({ shape: ROOF_SHAPES.hipped, box, eave: 20, ridge: 23 });
  assert.equal(tris(r), 6);
  assert.ok(within(r) && outward(r));
  assert.ok(atRidge(r).every((p) => Math.abs(Math.abs(local(p)[0]) - (box.hx - box.hz)) < 1e-6));
  assert.equal(r.ends.filter(Boolean).length, 0, 'no vertical face');
  const p = pitchedRoof({ shape: ROOF_SHAPES.pyramidal, box, eave: 20, ridge: 23 });
  assert.equal(tris(p), 4);
  assert.ok(within(p) && outward(p));
  assert.equal(atRidge(p).length, 4, 'one apex, shared by the four faces');
  const sq = pitchedRoof({ shape: ROOF_SHAPES.hipped, box: { ...box, hx: 4 }, eave: 20, ridge: 23 });
  assert.equal(tris(sq), 4, 'a square hipped roof is a pyramid');
});

test('skillion: one slope from the low eave to the high side, two triangular sides and the high wall', () => {
  const r = pitchedRoof({ shape: ROOF_SHAPES.skillion, box, eave: 20, ridge: 23 });
  assert.equal(tris(r), 6);
  assert.ok(within(r) && outward(r));
  assert.equal(r.ends.filter(Boolean).length, 4, 'the two sides and the high wall are vertical');
  assert.equal(pitchedRoof({ shape: ROOF_SHAPES.flat, box, eave: 20, ridge: 23 }), null);
});

test('where a roof goes: within a mapped height the walls stop at the eave, over storeys it sits on top', () => {
  const G = ROOF_SHAPES.gabled;
  // a mapped height of 20 m with a 4 m roof in it
  assert.deepEqual(roofPlacement({ shape: G, included: true, heightDm: 40, top: 20, bottom: 0, shortSide: 9 }), { eave: 16, ridge: 20, wallTop: 16 });
  // three storeys (9.6 m), no roof height: a third of the 9 m short side, on top
  assert.deepEqual(roofPlacement({ shape: G, included: false, heightDm: 0, top: 9.6, bottom: 0, shortSide: 9 }), { eave: 9.6, ridge: 12.6, wallTop: 9.6 });
  // a part standing above the ground keeps its bottom
  assert.deepEqual(roofPlacement({ shape: G, included: false, heightDm: 0, top: 30, bottom: 20, shortSide: 6 }), { eave: 30, ridge: 32, wallTop: 30 });
  assert.equal(roofPlacement({ shape: ROOF_SHAPES.flat, top: 20, bottom: 0, shortSide: 9 }), null);
});

test('where a roof goes: never taller than the building allows', () => {
  const G = ROOF_SHAPES.gabled;
  // a heuristic roof on a mapped 3.2 m shed 18 m wide: within the height, and never most of it
  const shed = roofPlacement({ shape: G, included: true, heightDm: 0, top: 3.2, bottom: 0, shortSide: 18, heuristic: true });
  assert.ok(shed && shed.ridge === 3.2 && shed.eave >= 2.5 && shed.wallTop === shed.eave, JSON.stringify(shed));
  // a heuristic roof over storeys: at most half the building
  const low = roofPlacement({ shape: G, included: false, heightDm: 0, top: 4, bottom: 0, shortSide: 18, heuristic: true });
  assert.ok(low && low.ridge - low.eave <= 2 + 1e-9 && low.eave === 4, JSON.stringify(low));
  // a mapped roof height that is most of the building was tagged as its whole height: a derived one instead
  assert.deepEqual(roofPlacement({ shape: G, included: true, heightDm: 90, top: 10, bottom: 0, shortSide: 9 }), { eave: 7, ridge: 10, wallTop: 7 });
  // too low a building for any roof, or nothing left between eave and ridge
  assert.equal(roofPlacement({ shape: G, included: true, heightDm: 10, top: 2.6, bottom: 0, shortSide: 9 }), null);
  assert.equal(roofPlacement({ shape: G, included: false, heightDm: 0, top: 2.4, bottom: 0, shortSide: 9 }), null);
  assert.equal(roofPlacement({ shape: G, included: true, heightDm: 2, top: 20, bottom: 0, shortSide: 9 }), null, 'a 0.2 m roof is no roof');
});
