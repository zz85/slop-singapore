import * as THREE from 'three/webgpu';
import { GEO } from './geodata.js';
import { createKit } from './landmark-kit.js';
import { buildFountainJets } from './fountain-jets.js';

// js/landmark-models.js
// The landmarks built by model programs: for each anchor tools/city/build.mjs wrote into GEO.landmarks (a landmark
// of the city's config with a `model`: its centre and the mapped outlines it replaces, each with its height, floors
// and name), the program js/landmark-models/<model>.js is loaded and its build(kit, site) run against a kit
// (js/landmark-kit.js) about the anchor; `site` carries the parts with their rings about the anchor. What it built
// is merged, placed and added to the scene, with colliders and footprints as js/open-city-buildings.js gives them,
// and the water its fountains throw (kit.jet: js/fountain-jets.js).
// A model that fails to load or build is reported and skipped; faces the kit finds would flicker are reported too.
// Returns { group, colliders, footprints, update() }.

async function buildLandmarkModels(scene) {
  const t0 = performance.now();
  const group = new THREE.Group();
  group.name = 'LandmarkModels';
  const colliders = [];
  const footprints = [];
  const built = [];
  for (const L of GEO.landmarks || []) {
    try {
      const { build } = await import(`./landmark-models/${L.model}.js`);
      const site = {
        id: L.id, name: L.name, x: L.x, z: L.z,
        parts: L.parts.map((p) => ({ ...p, ring: Array.from({ length: p.ring.length / 2 }, (_, k) => [p.ring[k * 2] - L.x, p.ring[k * 2 + 1] - L.z]) }))
      };
      const kit = createKit({ anchor: { x: L.x, z: L.z }, name: L.id });
      kit.bearingDeg = GEO.frame?.bearingDeg || 0;
      build(kit, site);
      const done = kit.finish();
      if (kit.jets.length) done.group.add(buildFountainJets(kit.jets, { sceneMRT: true }));
      group.add(done.group);
      colliders.push(...done.colliders);
      // (each footprint knows its landmark: what a click on it names, js/building-info.js)
      for (const f of done.footprints) f.site = L.id;
      footprints.push(...done.footprints);
      const flicker = kit.flicker();
      if (flicker.length) console.warn(`[landmarks] ${L.id}: faces that may flicker: ${flicker.map(([a, b]) => `${a} / ${b}`).join(', ')}`);
      built.push(`${L.name} (${kit.parts.length} parts, ${kit.triangles} triangles, ${kit.parts.length ? Math.round(kit.bounds().maxY) + ' m' : 'nothing built'})`);
    } catch (e) {
      console.warn(`[landmarks] ${L.model}:`, e);
    }
  }
  scene.add(group);
  console.info(`[landmarks] model programs: ${built.join('; ') || 'none'} in ${Math.round(performance.now() - t0)} ms`);
  return { group, colliders, footprints, update() {} };
}

export { buildLandmarkModels };
