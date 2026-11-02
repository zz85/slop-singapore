const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { loadModule } = require('./helpers/module.cjs');

// js/open-city-buildings.js: the buildings of a city built from OpenStreetMap, decoded from the geodata's packed
// stream (tools/city/build.mjs), with the roof shape, colours and storeys the build keeps from the OSM tags since
// geodata `extra: 4` (older geodata without them still decodes).

const noop = () => ({});
const source = readFileSync(join(__dirname, '../js/open-city-buildings.js'), 'utf8');
const load = () => loadModule(source, {
  imports: {
    'three/webgpu': {},
    './tsl-materials.js': { createPreWarBuildingMaterial: noop, createCurtainWallMaterial: noop, WALL_KINDS: { shop: 0, entry: 1, rear: 2, lotLine: 3, blankStone: 4 } },
    './city-config.js': { districtAt: () => 'generic' },
    './geodata.js': { GEO: {} },
    './tiny-look.js': { pairMaterial: noop, createTinyFacadeMaterial: noop, createTinyRoofMaterial: noop, createTinyFlatMaterial: noop, tinyRoofColor: () => [1, 1, 1], tinyWallColor: () => 0xffffff, blendHex: (a) => a, hexToRgb: () => [1, 1, 1] },
    './roofs.js': { ROOF_SHAPES: { flat: 0, gabled: 1, hipped: 2, pyramidal: 3, skillion: 4 }, unpackRoof: noop, roofHeightFor: noop, pitchedRoof: noop }
  },
  globals: { Float32Array, Math },
  filename: 'open-city-buildings.js'
});

test('the geodata stream decodes with the roof, colours and storeys of each building, and without them', () => {
  const { decode } = load();
  // one building: 1 ring, 12 m tall from the ground, a house, roof 7, white walls, a red roof, 3 storeys, a 10 x 10 m
  // square 1 m east and 2 m south of the origin (deltas in dm)
  const ring = [4, 10, 20, 100, 0, 0, 100, -100, 0];
  const built = decode({ types: ['yes', 'house'], extra: 4, data: [1, 120, 0, 1, 7, 0xffffff, 0xff0000, 3, ...ring] });
  assert.equal(built.length, 1);
  const b = built[0];
  assert.deepEqual([b.top, b.bottom, b.type, b.roof, b.wall, b.roofColour, b.levels], [12, 0, 'house', 7, 0xffffff, 0xff0000, 3]);
  assert.deepEqual(Array.from(b.rings[0]), [1, 2, 11, 2, 11, 12, 1, 12]);
  // two of them: the second ring's first point steps from the first's
  const two = decode({ types: ['yes'], extra: 4, data: [1, 120, 0, 0, 0, -1, -1, 0, ...ring, 1, 60, 0, 0, 0, -1, -1, 0, 4, 500, 0, 50, 0, 0, 50, -50, 0] });
  assert.equal(two.length, 2);
  assert.deepEqual(Array.from(two[1].rings[0]).slice(0, 2), [51, 2]);
  // older geodata without the extra fields
  const old = decode({ types: ['yes', 'house'], data: [1, 120, 0, 1, ...ring] });
  assert.deepEqual([old[0].top, old[0].type, old[0].roof, old[0].wall, old[0].roofColour, old[0].levels], [12, 'house', 0, -1, -1, 0]);
  assert.deepEqual(Array.from(old[0].rings[0]), [1, 2, 11, 2, 11, 12, 1, 12]);
});
