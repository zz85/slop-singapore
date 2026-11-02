import * as THREE from 'three/webgpu';
import { createTreeField, TREE_SPECIES } from './trees.js';
import { blockAt, CITY } from './city-config.js';
import { createEnforcement } from './open-city-enforcement.js';
import { GEO } from './geodata.js';
import { treeColliders } from './street-colliders.js';
import { treeGeometry } from './city-tiles.js';
import { onlyIn, createTinyTreeMaterial, tinyTreeLod } from './tiny-look.js';

// js/open-city-details.js
// The street details of a city built from OpenStreetMap, built by main.js instead of street-details.js's New York
// furniture: the city's own trees (GEO.trees, an inventory such as NParks' for Singapore: tools/city/build.mjs), each
// where it stands on a sidewalk, median, verge or park lawn, grown to its height, its crown shape from its family
// (palms included; a shape without a model in js/trees.js isn't planted), and its road pricing gantries & traffic
// cameras (open-city-enforcement.js). Returns what main.js and the audio take from street-details.js: { group,
// footprints, signalClock, audioSignals, update(camera, player) }, and attach(network, audio) & notice(head, body,
// flash, chime) for the enforcement; colliders (the trees' trunks, the gantries' & cameras' poles) and, after
// attach, signalColliders() (the traffic lights' poles) for the player.

const SIDEWALK_Y = 0.22;
const LAWN_Y = 0.235;
// The tree models (mature trees, 10-13 m tall at scale 1) scale as a whole, leaf cards and all: below ~60% their crowns
// thin out to bare twigs, so the inventory's young & small trees grow to this height
const MIN_HEIGHT = 7.5;

// The same trees in the tiny look (js/tiny-look.js): the island's faceted crown on a trunk (city-tiles.js treeGeometry),
// one instance per tree scaled to its height and its family's crown (a rain tree's wide umbrella, a palm's small
// tuft on a tall trunk), in cells of 300 m: each cell drawn by its distance (tinyTreeLod: the faceted crown near,
// the plain one across the city, a speck far off, none beyond, shadows near; update(cameraPosition) every frame).
// Shown in place of the leaf-card trees while the look is on (onlyIn). -> { group, update }
const TINY_CELL = 300;
function buildTinyTrees(sites) {
  const group = new THREE.Group();
  group.name = 'TinyTrees';
  group.visible = false;
  const geometries = [treeGeometry(-1), treeGeometry(0), treeGeometry(1)]; // by detail + 1
  const geometry = geometries[1];
  const material = createTinyTreeMaterial();
  const cells = new Map();
  for (const s of sites) {
    const key = Math.floor(s.x / TINY_CELL) + ':' + Math.floor(s.z / TINY_CELL);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(s);
  }
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const scl = new THREE.Vector3();
  for (const list of cells.values()) {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((s, i) => {
      const sp = TREE_SPECIES[s.species] || {};
      // the crown's width as a share of the tree's height: wide umbrellas, round crowns, a palm's tuft
      const width = sp.fronds ? 0.45 : sp.name === 'raintree' ? 1.35 : sp.name === 'weeping' ? 0.85 : 0.75;
      const yaw = ((s.x * 12.9898 + s.z * 78.233) % 6.2832);
      q.setFromAxisAngle(up, yaw);
      m.compose(p.set(s.x, s.y, s.z), q, scl.set(s.height * width, s.height, s.height * width));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    mesh.name = 'TinyTrees';
    group.add(mesh);
  }
  const cells2 = group.children.map((mesh) => ({ mesh, sphere: mesh.boundingSphere, detail: 0 }));
  const update = (cameraPosition) => {
    if (!group.visible) return;
    for (const c of cells2) {
      const d = Math.max(0, cameraPosition.distanceTo(c.sphere.center) - c.sphere.radius);
      const lod = tinyTreeLod(d);
      c.mesh.visible = lod.visible;
      c.mesh.castShadow = lod.castShadow;
      if (lod.visible && lod.detail !== c.detail) {
        c.detail = lod.detail;
        c.mesh.geometry = geometries[lod.detail + 1];
      }
    }
  };
  return { group, update };
}

function buildOpenCityDetails(scene) {
  const group = new THREE.Group();
  group.name = 'CityStreetDetails';
  const sites = [];
  const trees = GEO.trees;
  if (trees) {
    const speciesOf = trees.shapes.map((name) => TREE_SPECIES.findIndex((sp) => sp.name === name));
    let qx = 0;
    let qz = 0;
    for (let i = 0; i < trees.heights.length; i++) {
      qx += trees.xz[i * 2]; // dm, each a step from the tree before
      qz += trees.xz[i * 2 + 1];
      const species = speciesOf[trees.shape[i]];
      if (species < 0) continue;
      const x = qx / 10;
      const z = qz / 10;
      const height = Math.max(MIN_HEIGHT, trees.heights[i]);
      const b = blockAt(x, z);
      const park = !!b && b.park > 0.6;
      // draw distance: park trees and the tall ones furthest
      sites.push({ x, y: b ? (park ? LAWN_Y : SIDEWALK_Y) : 0, z, height, species, tier: park ? 0 : height >= 12 ? 1 : 2 });
    }
  }
  let tinyTrees = null;
  if (sites.length) {
    const field = createTreeField(scene, sites);
    group.add(onlyIn(field.group, 'photo'));
    tinyTrees = buildTinyTrees(sites);
    group.add(onlyIn(tinyTrees.group, 'tiny'));
  }
  const enforcement = createEnforcement(group, { keepLeft: CITY.driveSide === 'left' });
  // what the player bumps into (js/street-colliders.js): the trees' trunks, the gantries' & cameras' poles, and once
  // the traffic network is attached, its signal poles
  const colliders = [...treeColliders(sites), ...(enforcement ? enforcement.colliders : [])];
  scene.add(group);
  console.info(`[cityDetails] ${sites.length} trees${trees ? ` (${trees.credit})` : ''}`);
  const signalClock = { value: 0 }; // main.js keeps it at the traffic's time
  return {
    group,
    footprints: [],
    colliders,
    signalColliders: () => (enforcement ? enforcement.signalColliders() : []),
    signalClock,
    audioSignals: [],
    update: (camera, player) => {
      if (tinyTrees) tinyTrees.update(camera.position);
      if (enforcement) enforcement.update(signalClock.value, player);
    },
    attach: enforcement ? (network, audio) => enforcement.attach(network, audio) : null,
    notice: enforcement ? enforcement.notice : null
  };
}

export { buildOpenCityDetails };
