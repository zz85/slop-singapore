import * as THREE from 'three/webgpu';
import {
  Fn, float, vec2, vec3, color, mix, step, fract, floor, smoothstep, fwidth, attribute, positionGeometry, positionWorld,
  positionView, instanceIndex, uv, sin, dot, max, abs, select
} from 'three/tsl';

// js/tiny-look.js
// The tiny look's materials (TIME_PRESETS.tiny in js/lighting.js, LOOKS.tiny in js/post-processing.js): flat Lambert
// stand-ins, after tinywarsaw.app, for the city's photoreal materials — pastel walls with painted windows, light matte
// ground, flat water, faceted trees — and the registry that swaps them in over the scene while the look is on.
// Every photoreal material is still created where it always was; its tiny counterpart is paired beside it
// (pairMaterial), objects that exist for one look only are marked (onlyIn), and main.js selectTime applies the look to
// the scene (applyTinyLook). Nothing here runs a shader of its own while the photoreal look is on.

// Warsaw-style pastels per kind of building (tinywarsaw.app's slab / tower / tenement / office palettes, and the
// shophouses' Singapore pastels), one picked per building by its tone (tinyWallColor) so it is stable across builds
const TINY_PALETTES = {
  glass: [0xe2dfd3, 0xdeded7, 0xd6dfdb, 0xe8dfce],
  office: [0xd9dfe0, 0xd9d9d1, 0xe0dfd8, 0xced9dc],
  slab: [0xe6e4da, 0xdeded5, 0xe5dfcf, 0xd8dfd9, 0xdad8cf],
  shophouse: [0xe8c6a2, 0xc4dcc6, 0xefdc9f, 0xb7d0e3, 0xf0d9c0, 0xd8e6d0, 0xf2e4b0],
  concrete: [0xd9d9d1, 0xdad8cf, 0xcfd3cc, 0xe0dfd8],
  civic: [0xf1ede4, 0xece6da, 0xe8e4dc]
};
// Tiny Warsaw's windows: panes blended 30% toward its sky blue so they never read as holes, pale frames, dark sign strips
const SKY_BLUE = 0x9db9d3;
const WINDOW = { pane: 0x809aaa, paneLight: 0xa7becb, frame: 0xc3c4ba, shopGlass: 0x6f8a9a, signs: [0x2f4a7a, 0x8a3b32, 0x2f5f4a] };
// The ground: light warm asphalt, off-white pavements, a curb one shade darker, flat lawns and water
const GROUND = { asphalt: 0x9c9a95, sidewalk: 0xd8d2c6, curb: 0xc9c3b6, lawn: 0x7ca057, lawnLight: 0x8cc063, water: 0x8fb8da, seawall: 0xb8b2a6, hedge: 0x5f8a4a, deck: 0xc9c4ba, roof: 0xb9b5ac };
const PATTERNS = ['punched', 'ribbon', 'curtain', 'strips'];
// HDB blocks are painted in bands: the accent colours of two storeys per block
const HDB_BANDS = [0xd98c6a, 0x6f9fd3, 0x8cbf7a, 0xe8c05a, 0xc98bb5];

const channel = (hex, shift) => ((hex >> shift) & 0xff) / 255;
/** A hex colour as [r, g, b] in 0..1 */
const hexToRgb = (hex) => [channel(hex, 16), channel(hex, 8), channel(hex, 0)];
const rgb = hexToRgb;
/** `a` blended `t` of the way to `b`, as a hex colour */
function blendHex(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return A.reduce((hex, c, i) => (hex << 8) | Math.round((c + (B[i] - c) * t) * 255), 0) >>> 0;
}
/** The wall colour of a building of `kind` with tone 0..1 (one of its palette, stable per tone) */
function tinyWallColor(kind, tone) {
  const p = TINY_PALETTES[kind];
  return p[Math.min(p.length - 1, Math.max(0, Math.floor(tone * p.length)))];
}
/** The roof colour [r, g, b] (0..1) of a building of `kind` with tone 0..1: terracotta on shophouses, a light warm grey
 *  elsewhere, both a little darker to lighter by tone */
function tinyRoofColor(kind, tone) {
  if (kind === 'shophouse') return rgb(blendHex(0xa4543b, 0xb8694a, tone));
  const shade = 0.86 + tone * 0.22;
  return rgb(GROUND.roof).map((c) => Math.min(1, c * shade));
}

// --- the registry ---------------------------------------------------------------------------------------------------
const tinyOf = new WeakMap(); // photoreal material → its tiny stand-in
const photoOf = new WeakMap(); // tiny stand-in → the photoreal material
const lookOf = new WeakMap(); // object → the one look it belongs to ('tiny' | 'photo')

/** Pairs a photoreal material with its tiny stand-in (returns the stand-in) */
function pairMaterial(photo, tiny) {
  tinyOf.set(photo, tiny);
  photoOf.set(tiny, photo);
  return tiny;
}
/** The other look's material for a paired one (the tiny stand-in of a photoreal material, or the reverse), else undefined */
function pairedMaterial(material) {
  return tinyOf.get(material) || photoOf.get(material);
}
/** Marks an object as belonging to one look only: shown in it, hidden in the other */
function onlyIn(object, look) {
  lookOf.set(object, look);
  return object;
}
/** Puts the tiny look on (`on`) or off over everything under `root`: paired materials swapped, one-look objects shown
 *  or hidden. Idempotent; new meshes made later with a paired material are caught by the next call. */
function applyTinyLook(root, on) {
  root.traverse((o) => {
    const look = lookOf.get(o);
    if (look) o.visible = on ? look === 'tiny' : look === 'photo';
    if (!o.isMesh || !o.material) return;
    const swap = on ? tinyOf.get(o.material) : photoOf.get(o.material);
    if (swap) o.material = swap;
  });
}

// --- shader helpers ---------------------------------------------------------------------------------------------------
// 1 inside [lo, hi] of x, anti-aliased over the pixel footprint fw of x
const band = (lo, hi, x, fw) => smoothstep(float(lo).sub(fw), float(lo).add(fw), x).mul(float(1).sub(smoothstep(float(hi).sub(fw), float(hi).add(fw), x)));
const hash2 = (p) => fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453));
// One of `hexes` by t in 0..1 (the palette entry a building's tone picks: tinyWallColor in the shader)
function pick(hexes, t) {
  let col = color(hexes[0]);
  for (let i = 1; i < hexes.length; i++) col = select(t.greaterThanEqual(i / hexes.length), color(hexes[i]), col);
  return col;
}

// --- the materials ----------------------------------------------------------------------------------------------------
/**
 * A facade with painted windows for the instanced wall quads of js/open-city-buildings.js (their `box` and `faces`
 * attributes: width, height, depth, seed + tone; the WALL_KINDS of the box's walls): the wall in one of its kind's
 * pastels by the building's tone, a window per bay and storey in one of four patterns (`punched` holes with a sill,
 * a `ribbon` across each storey, a `curtain` of panes in a thin frame, full-height `strips`), a glazed shop front
 * with a sign strip on shop ground floors, a solid parapet, and no windows on lot-line walls or in a storey the wall
 * is too short for. Diffuse only, as Tiny Warsaw's Lambert tiles.
 */
function createTinyFacadeMaterial({ kind, pattern = 'punched', floorHeight = 3.5, bayWidth = 3.0, windowWidth = 0.55, windowHeight = 0.5 } = {}) {
  if (!TINY_PALETTES[kind]) throw new Error(`tiny facade: unknown kind "${kind}"`);
  if (!PATTERNS.includes(pattern)) throw new Error(`tiny facade: unknown pattern "${pattern}"`);
  const m = new THREE.MeshLambertNodeMaterial({ side: THREE.FrontSide });
  m.name = `tinyFacade.${kind}.${pattern}`;
  m.colorNode = Fn(() => {
    const box = attribute('box', 'vec4');
    const faces = attribute('faces', 'vec4');
    const wallKind = faces.w; // the quad is the box's +z wall: 0 shop, 1 entry, 2 rear, 3 lot line
    const wallW = box.x;
    const wallH = box.y;
    // metres along the wall (left to right, facing it) and up from its foot; bays fitted whole along the wall
    const s = positionGeometry.x.add(0.5).mul(wallW);
    const y = positionGeometry.y.add(0.5).mul(wallH);
    // the wall's colour and storey height per building (open-city-buildings.js `tinyWall`: one of the kind's pastels
    // by its tone or OpenStreetMap's building:colour toned down; its mapped storeys, or 0 for the pattern's own)
    const tw = attribute('tinyWall', 'vec4');
    const fh = select(tw.w.greaterThan(0.1), tw.w, float(floorHeight));
    const bays = max(floor(wallW.div(bayWidth).add(0.5)), 1.0);
    const gu = s.div(wallW.div(bays));
    const gv = y.div(fh);
    const cu = fract(gu), cv = fract(gv);
    const fu = fwidth(gu), fv = fwidth(gv);
    const groundFloor = float(1).sub(step(1.0, gv));
    // a storey only where the wall reaches its ceiling (no sliced windows under the parapet), none on lot-line walls
    const whole = step(floor(gv).add(1.0).mul(fh), wallH.add(0.05));
    const parapet = float(1).sub(step(0.4, wallH.sub(y)));
    const windowed = whole.mul(float(1).sub(parapet)).mul(float(1).sub(step(2.5, wallKind)));
    let pane;
    if (pattern === 'punched') pane = band((1 - windowWidth) / 2, (1 + windowWidth) / 2, cu, fu).mul(band(0.28, 0.28 + windowHeight, cv, fv));
    else if (pattern === 'ribbon') pane = band(0.3, 0.82, cv, fv).mul(float(1).sub(band(0.0, 0.035, cu, fu)));
    else if (pattern === 'curtain') pane = band(0.12, 0.88, cu, fu).mul(band(0.16, 0.84, cv, fv));
    else pane = band((1 - windowWidth) / 2, (1 + windowWidth) / 2, cu, fu).mul(band(0.06, 0.97, cv, fv));
    pane = pane.mul(windowed);
    // the shop front: a glazed ground floor across the bay under a sign strip, on shop fronts only
    const shop = groundFloor.mul(float(1).sub(step(0.5, wallKind))).mul(whole);
    const shopGlass = band(0.1, 0.78, cv, fv).mul(band(0.04, 0.96, cu, fu)).mul(shop);
    const sign = band(0.8, 0.95, cv, fv).mul(shop);
    // colours: the wall's pastel, the panes a shade apart per cell, the sign in one of three paints
    let wall = tw.rgb;
    if (kind === 'slab') {
      // two storeys in an accent colour, a different storey and colour per block
      const bandAt = floor(fract(box.w.mul(0.731)).mul(6)).add(1.0);
      const inBand = step(abs(floor(gv).sub(bandAt).sub(0.5)), 1.0);
      wall = mix(wall, pick(HDB_BANDS, fract(box.w.mul(0.173))), inBand.mul(0.85));
    }
    const cell = hash2(vec2(floor(gu), floor(gv)).add(floor(box.w)));
    const paneCol = mix(color(blendHex(WINDOW.pane, SKY_BLUE, 0.3)), color(blendHex(WINDOW.paneLight, SKY_BLUE, 0.3)), cell.mul(0.6));
    const base = pattern === 'curtain' ? mix(wall, color(WINDOW.frame), 0.15) : wall; // (a tower's mullion grid, a shade greyer)
    let col = mix(base, paneCol, pane);
    col = mix(col, color(blendHex(WINDOW.shopGlass, SKY_BLUE, 0.3)), shopGlass);
    col = mix(col, pick(WINDOW.signs, fract(box.w.mul(0.37))), sign);
    return col;
  })();
  return m;
}

/** The roofs of js/open-city-buildings.js: the colour baked per building into their `tinyColor` attribute (tinyRoofColor) */
function createTinyRoofMaterial() {
  const m = new THREE.MeshLambertNodeMaterial();
  m.name = 'tinyRoof';
  m.colorNode = attribute('tinyColor', 'vec3');
  return m;
}

/** One flat matte colour (roads, pavements, curbs, walls, decks); `vertexColors` keeps a mesh's own tint under it */
function createTinyFlatMaterial(hex, { vertexColors = false, side = THREE.FrontSide } = {}) {
  const m = new THREE.MeshLambertNodeMaterial({ color: hex, vertexColors, side });
  m.name = `tinyFlat.${hex.toString(16)}`;
  return m;
}

/** Lawns: flat green in patches of a few tens of metres, as a painted map */
function createTinyLawnMaterial() {
  const m = new THREE.MeshLambertNodeMaterial();
  m.name = 'tinyLawn';
  const p = positionWorld.xz;
  const patch = hash2(floor(p.div(60))).mul(0.6).add(hash2(floor(p.div(17)).add(7)).mul(0.4));
  m.colorNode = mix(color(GROUND.lawn), color(GROUND.lawnLight), patch);
  return m;
}

/** Water: one flat light blue, no waves, no reflections */
function createTinyWaterMaterial() {
  const m = new THREE.MeshLambertNodeMaterial({ color: GROUND.water });
  m.name = 'tinyWater';
  return m;
}

/** How a cell of the city's tiny trees `d` m from the camera is drawn (js/open-city-details.js): the faceted crown
 *  (treeGeometry detail 1) within 350 m, the plain one (0) to 1.4 km, a far speck (-1, the octahedron) to 3 km, none
 *  beyond; shadows from within 900 m */
function tinyTreeLod(d) {
  if (!(d < 3000)) return { detail: -1, visible: false, castShadow: false };
  return { detail: d < 350 ? 1 : d < 1400 ? 0 : -1, visible: true, castShadow: d < 900 };
}

/** The island's and the city's trees (js/city-tiles.js treeGeometry: a crown on a trunk, `crown` 1 on the crown's
 *  vertices): faceted, in a green per tree from the shade to the sun, lighter towards the top of the crown. One
 *  material for all of them (one set of pipelines). */
let tinyTree = null;
function createTinyTreeMaterial() {
  if (tinyTree) return tinyTree;
  const m = tinyTree = new THREE.MeshLambertNodeMaterial({ flatShading: true });
  m.name = 'tinyTree';
  const isCrown = attribute('crown', 'float');
  const tone = fract(sin(float(instanceIndex).mul(0.6180339).add(1.7)).mul(43758.5453));
  const leaf = mix(color(0x4a7a3a), color(0x7ca057), tone);
  const top = smoothstep(0.45, 1.0, positionGeometry.y);
  const crown = mix(leaf.mul(0.88), leaf.mul(1.12), top);
  m.colorNode = mix(color(0x6b5a48), crown, isCrown);
  return m;
}

/** The island tiles' walls (js/city-tiles.js wallMaterial: uv in metres, the building's colour per vertex): the colour
 *  lifted to a pastel, windows in rows of storeys (3 m) and bays (2.4 m) in the painted pane blue, fading into the wall
 *  with distance; no lit rooms, no gloss */
function createTinyTileWallMaterial() {
  const m = new THREE.MeshLambertNodeMaterial();
  m.name = 'tinyTileWall';
  const p = uv();
  const wall = mix(attribute('color', 'vec3'), color(0xe6e4da), 0.55);
  const fy = fract(p.y.div(3.0));
  const fx = fract(p.x.div(2.4));
  const pane = step(0.3, fy).mul(step(fy, 0.8)).mul(step(0.2, fx)).mul(step(fx, 0.8)).mul(step(2.2, p.y));
  const paneCol = color(blendHex(WINDOW.pane, SKY_BLUE, 0.3));
  const near = smoothstep(1600, 350, positionView.z.negate());
  m.colorNode = mix(mix(wall, paneCol, 0.22), mix(wall, paneCol, pane), near);
  return m;
}

/** The island tiles' roofs: their baked colour lifted most of the way to the roof grey */
function createTinyTileRoofMaterial() {
  const m = new THREE.MeshLambertNodeMaterial();
  m.name = 'tinyTileRoof';
  m.colorNode = mix(attribute('color', 'vec3'), color(GROUND.deck), 0.65);
  return m;
}

export {
  TINY_PALETTES, GROUND, blendHex, hexToRgb, tinyWallColor, tinyRoofColor,
  pairMaterial, pairedMaterial, onlyIn, applyTinyLook, tinyTreeLod,
  createTinyFacadeMaterial, createTinyRoofMaterial, createTinyFlatMaterial, createTinyLawnMaterial, createTinyWaterMaterial,
  createTinyTreeMaterial, createTinyTileWallMaterial, createTinyTileRoofMaterial
};
