import assert from 'node:assert/strict';
import test from 'node:test';
import { landuseClass, landuseImage, LANDUSE } from '../tools/city/landuse.mjs';
import { encodePNG, decodePNG } from '../tools/city/png.mjs';
import { islandQueries } from '../tools/city/fetch-island.mjs';

// a world frame of metres: lon = x, lat = z
const toWorld = (lon, lat) => [lon, lat];
let id = 1;
const poly = (pts, tags) => {
  const n = id++;
  return { type: 'way', id: n, tags, nodes: [...pts.map((_, k) => n * 100 + k), n * 100], geometry: [...pts, pts[0]].map(([x, z]) => ({ lon: x, lat: z })) };
};
const rect = (x0, z0, x1, z1, tags) => poly([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], tags);
const px = (img, x, z) => {
  const i = Math.floor((x - img.x0) / img.res), j = Math.floor((z - img.z0) / img.res);
  return Array.from(img.rgb.subarray((j * img.w + i) * 3, (j * img.w + i) * 3 + 3));
};

test('land use classes: woods, grass, paved, or left to the land\'s own mix', () => {
  assert.deepEqual(LANDUSE, ['wood', 'grass', 'paved']);
  assert.equal(landuseClass({ landuse: 'forest' }), 0);
  assert.equal(landuseClass({ natural: 'wood' }), 0);
  assert.equal(landuseClass({ leisure: 'nature_reserve' }), 0);
  assert.equal(landuseClass({ leisure: 'park' }), 1);
  assert.equal(landuseClass({ leisure: 'golf_course' }), 1);
  assert.equal(landuseClass({ landuse: 'cemetery' }), 1);
  assert.equal(landuseClass({ aeroway: 'aerodrome' }), 1);
  assert.equal(landuseClass({ landuse: 'industrial' }), 2);
  assert.equal(landuseClass({ amenity: 'parking' }), 2);
  assert.equal(landuseClass({ aeroway: 'apron' }), 2);
  // the more specific tag wins
  assert.equal(landuseClass({ leisure: 'park', natural: 'wood' }), 0, 'woods in a park');
  assert.equal(landuseClass({ landuse: 'grass', amenity: 'parking' }), 2);
  assert.equal(landuseClass({ landuse: 'residential' }), -1);
  assert.equal(landuseClass({ landuse: 'military' }), -1);
  assert.equal(landuseClass({}), -1);
});

test('the land-use image: each pixel\'s share of woods, grass and paving, the smaller areas inside the larger winning', () => {
  const elements = [
    rect(0, 0, 400, 400, { leisure: 'park' }),
    rect(100, 100, 200, 200, { natural: 'wood' }), // woods in the park
    rect(250, 250, 300, 300, { amenity: 'parking' }), // its car park
    rect(500, 0, 700, 200, { landuse: 'industrial' }),
    rect(530, 30, 570, 70, { leisure: 'pitch' }), // a pitch in the industrial estate
    rect(0, 500, 300, 700, { landuse: 'residential' }), // not a class: left out
    rect(410, 0, 412, 1, { leisure: 'park' }) // too small to count (< 100 m²)
  ];
  elements.push(elements[0]); // (an area in two downloads: once)
  const img = landuseImage(elements, toWorld, [0, 0, 800, 800], { res: 20 });
  assert.equal(img.res, 20);
  assert.ok(img.w >= 40 && img.h >= 40);
  assert.equal(img.rgb.length, img.w * img.h * 3);
  assert.deepEqual(img.counts, [1, 2, 2]);
  assert.deepEqual(px(img, 50, 50), [0, 255, 0], 'park: grass');
  assert.deepEqual(px(img, 150, 150), [255, 0, 0], 'its woods');
  assert.deepEqual(px(img, 270, 270), [0, 0, 255], 'its car park');
  assert.deepEqual(px(img, 650, 150), [0, 0, 255], 'industry: paved');
  assert.deepEqual(px(img, 550, 50), [0, 255, 0], 'the pitch in it');
  assert.deepEqual(px(img, 150, 600), [0, 0, 0], 'homes: the land\'s own');
  assert.deepEqual(px(img, 750, 750), [0, 0, 0]);
  // an edge half way across a pixel: shared
  const edge = landuseImage([rect(0, 0, 110, 400, { leisure: 'park' })], toWorld, [0, 0, 400, 400], { res: 20 });
  assert.deepEqual(px(edge, 105, 50), [0, 128, 0], 'half the pixel park');
});

test('a multipolygon\'s holes are left out of it', () => {
  const outer = [[0, 0], [400, 0], [400, 400], [0, 400]].map(([x, z]) => ({ lon: x, lat: z }));
  const inner = [[150, 150], [250, 150], [250, 250], [150, 250]].map(([x, z]) => ({ lon: x, lat: z }));
  const rel = { type: 'relation', id: 999, tags: { landuse: 'forest' }, members: [{ role: 'outer', geometry: [...outer, outer[0]] }, { role: 'inner', geometry: [...inner, inner[0]] }] };
  const img = landuseImage([rel], toWorld, [0, 0, 400, 400], { res: 20 });
  assert.deepEqual(px(img, 50, 50), [255, 0, 0]);
  assert.deepEqual(px(img, 200, 200), [0, 0, 0], 'the clearing');
});

test('PNG: written and read back exactly, rows top first', () => {
  const w = 37, h = 11;
  const rgb = new Uint8Array(w * h * 3).map((_, k) => (k * 7919) % 256);
  const png = encodePNG(rgb, w, h, 3);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const back = decodePNG(png);
  assert.equal(back.w, w);
  assert.equal(back.h, h);
  assert.equal(back.channels, 3);
  assert.deepEqual(back.pixels, rgb);
  // a big even image is small
  assert.ok(encodePNG(new Uint8Array(1000 * 1000 * 3), 1000, 1000, 3).length < 10000);
});

test('the island\'s land use is fetched in cells twice the size of its buildings\'', () => {
  const q = islandQueries({ island: { box: [1.2, 103.6, 1.32, 103.72], fetchCell: 0.06 } });
  const lu = Object.keys(q).filter((k) => k.startsWith('landuse_'));
  assert.equal(lu.length, 1);
  for (const tag of ['leisure', 'landuse', 'natural', 'golf_course', 'forest', 'industrial', 'parking']) assert.ok(q[lu[0]].includes(tag), tag);
  assert.ok(q[lu[0]].includes('relation['), 'multipolygons too');
});
