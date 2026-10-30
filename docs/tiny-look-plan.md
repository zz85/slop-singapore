# Making Slop Singapore look like Tiny Warsaw

Research notes, 2026-10-30. Sources: the `zz85/slop-singapore` repo (gh-pages, commit 69c6329), the live
site at zz85.github.io/slop-singapore, tinywarsaw.app (its About page and its shipped JavaScript bundles, which
are readable in the browser), and Dominik Roszkowski's launch thread on X.

## 1. What the creator actually said

Dominik Roszkowski (@OrestesGaolin) launched Tiny Warsaw on 26 Oct 2026. The relevant points from his thread and
About page:

- It started as an attempt to reproduce tiny.london (an isometric pixel-art map) for Warsaw. While prototyping the
  "source material" for that isometric render he tried three.js low-poly models instead, and found that "just from a
  few dozen landmarks and OSM data" he got "a look similar to old-school SimCity". That is the remark about low-poly
  models: hand-built, flat-shaded landmark models on top of plain OSM extrusions, instead of the photoreal
  glass-tower look that Slop New York and most of its forks (including Singapore) inherit.
- Stats he quoted: 49 km2, 17k generic buildings, 1,027 custom landmarks, 7.4M triangles, 257k trees.
- About page: "Ordinary buildings are generated from their outlines (OSM) and the height and colour data (GUGiK);
  details such as windows and shop fronts are drawn by a shader. More than a thousand of the most recognisable
  places ... are dedicated low-poly models. Each one is in practice a short program that builds the shape from photos
  and maps. AI models (Claude, Gemini, Codex) wrote their code. Everything went through automatic tests that catch
  graphics errors (such as flickering walls), and a human made the final selection." Rendering is "three.js and
  WebGL", and "some solutions are inspired by the Slop New York project".

## 2. How Tiny Warsaw is rendered (from its bundles)

Engine: three.js r186, `WebGLRenderer` on WebGL2. No WebGPU, no TSL.

### Lighting and colour pipeline

| Thing | Tiny Warsaw |
| --- | --- |
| Lights | `HemisphereLight(sky #eef4ff, ground #b8ad9c, intensity 1.95)` + `DirectionalLight(#fff3e0, 1.9)` |
| Shadows | one orthographic map, 4096 px (2048 on touch), covers +-700 m, `bias -4e-4`, `normalBias 0.6`, `radius 2.5`, frustum refit and texel-snapped to the view |
| Sky | a painted gradient, zenith `#8fb8da` to horizon `#dde6ea`; clear colour = haze `#d6e0e6`; fog colour = same haze |
| Tone mapping | none. Only `toneMappingExposure` is set (1.0). Colours reach the screen linear-to-sRGB, which is why pastels stay pastel |
| Presets | `afternoon` (above), `dusk` (sun #ffa868, sky #a9a9c9, horizon #f0a87c, haze #d8a991), `night` (sun #8ea6e0 at 0.22, sky #4c62a8, haze #22305a) and a real-sun mode that derives colours from solar elevation |
| Post-processing | a tilt-shift pass (modes band / depth / hybrid, default `depth` on desktop, off on touch) with blur 0.6, +0.12 saturation and a 0.25 vignette. No bloom, no AO, no colour grading |

The hemisphere light is as strong as the sun. That is the single biggest reason shadows look soft and nothing goes
dark: the lit/shadow contrast is roughly 2:1, not the 10:1 of a physically lit scene.

### Generic buildings

- Footprints are extruded from OSM; heights and roof colours come from GUGiK aerial data.
- Each building is classified from OSM tags plus footprint shape into `tenement`, `office`, `slab`, `tower` or `box`
  (uses `building:use`, `start_date` 1800-1945, `historic`, `heritage`, "kamienica" in the name, area, aspect ratio,
  fill, short side). Floors come from `building:levels` or height / 3.6 (tenement), 3.5 (office), 2.85 (other).
- Wall colour is picked from a small pastel palette per type, hashed by OSM id (FNV-1a) so it is stable:
  - slab `#e6e4da #deded5 #e5dfcf #d8dfd9 #dad8cf`
  - tower `#e2dfd3 #deded7 #d6dfdb #e8dfce`
  - tenement `#e6d5b8 #dfc9ac #e4d9ca #d6c5ad #dfd2b8`
  - office `#d9dfe0 #d9d9d1 #e0dfd8 #ced9dc`
  - an OSM `building:colour`, when present, is blended 40% toward `#d8d2c6` so nothing is garish.
- Material: `MeshLambertMaterial({ map, vertexColors: true })`. Diffuse only. No roughness, metalness, env map or
  reflections anywhere on a building.
- Windows: a 1024x512 canvas atlas of eight 192 px facade tiles drawn with 2D canvas calls (wall `#faf9f3`, panes
  `#809aaa` / `#a7becb`, frames `#c3c4ba` / `#fffdf5`, sills, a sign strip). A per-building `facadeTile` attribute
  selects the tile; a small `onBeforeCompile` patch samples it with `textureGrad` so it does not moire at distance.
  A richer street-level shader adds shop fronts (sign strips `#2f4a7a`, `#8a3b32`, `#2f5f4a`, frames `#2b313a`), rooms,
  blinds and lit windows at night, with an integer hash per window cell.

### Landmarks (the "low-poly models")

Each landmark is a JavaScript module at `/pkin/models/<osm-way-id>.js` exporting `build(THREE, kit)`. A typical one
is 50-250 KB of straight-line code: boxes, extruded prisms from measured footprints, 12-segment cylinders, arches,
roof triangles. Models are built in a Web Worker and flattened to a single vertex-coloured mesh (their `lm1` format),
rendered with `MeshLambertMaterial({ vertexColors: true, side: DoubleSide })`.

The `kit` the models are written against is tiny, and it is the style guide:

| kit call | What it makes |
| --- | --- |
| `kit.material('#a4543b')` | `MeshLambertMaterial({ color, flatShading: true, side: DoubleSide })` |
| `kit.glassMaterial('#60818a')` | `MeshPhongMaterial`, colour blended 30% toward sky-blue `#9db9d3`, `specular #8a96a3`, `shininess 25`, flat shaded |
| `kit.facadeMaterial({pattern, wall_color, window_color, frame_color, floor_height_m, bay_width_m, window_width_ratio, window_height_ratio})` | a 128x128 canvas tile (`punched`, `ribbon`, `curtain_wall`, `vertical_strips`), window colour blended 30% toward `#9db9d3`, repeated as a Lambert map |
| `kit.facadeUV(geometry, bay=3, floor=3.5)` | planar UVs per wall so the tile repeats once per bay and floor |
| `kit.finish(group, {skirt: 3, base: 0.05})` | sinks a skirt into the terrain so there is no gap at the base |

So "low-poly model" here means: a few hundred flat-shaded primitives in five or six solid colours, with windows as a
painted tile rather than geometry, authored per landmark by an LLM from photos and the OSM footprint, verified by
automatic render tests, then baked.

### Trees, props, far distance

- Trees: a merged trunk (`CylinderGeometry(0.25, 0.35, 1, 4)`) plus crown (`IcosahedronGeometry(1, 0)`, i.e. 20
  faces, or `ConeGeometry(1, 2, 6)` for conifers), one `InstancedMesh` per cell, `MeshLambertMaterial({ flatShading:
  true })`, with a vertex-shader patch that varies hue and brightness per tree from its position and lightens the top
  of the crown.
- Props (stops, signals, lamps) are instanced meshes in a single grey `#5d6670`.
- Far cells become baked impostor "cards" (KTX2 textures picked by camera azimuth, cross-faded with Bayer dithering)
  and simplified far geometry, so the whole city is on screen at once without the near-field cost.

## 3. How Slop Singapore is rendered today

Engine: a pinned three.js dev build (r186/r187) with `WebGPURenderer` and TSL node materials, reversed depth,
MSAA, clustered lighting for headlights. Like Warsaw, nothing is loaded from model files or image textures; it is all
code. The difference is entirely in what that code draws.

### Lighting and colour pipeline (`js/lighting.js`, `js/post-processing.js`, `js/main.js`)

| Thing | Slop Singapore |
| --- | --- |
| Lights | `SunLight` (2-cascade CSM, 3072 px per cascade, `normalBias 0.05`) at intensity 5.8-6.6, plus `HemisphereLight(0x9abbe6, 0xc88a62)` at 1.05-1.58. Sun-to-sky ratio about 4:1, so shadows are deep and crisp |
| Sky | Preetham `SkyMesh` with clouds, baked to a PMREM every preset and set as `scene.environment` (`environmentIntensity` 0.30-0.58), so every surface gets image-based lighting and glass reflects the sky |
| Fog | a custom aerial-perspective node (height-attenuated, colour sampled from the sky PMREM toward the horizon) |
| Tone mapping | `ACESFilmicToneMapping`, then exposure, white balance, cool-shadow/warm-highlight split toning, contrast 1.12, saturation 1.08 plus vibrance, 12% vignette |
| Post | half-resolution screen-space reflections (intensity 0.5), bloom 0.24 at threshold 1.2 |
| Default preset | Golden Hour 17:45 (`selectTime('golden')`, main.js:888): warm low sun, long shadows |

### Buildings (`js/open-city-buildings.js`, `js/tsl-materials.js`, `js/city-tiles.js`)

- Core city: every footprint edge becomes one instance of a unit plane; ten `InstancedMesh`es, one per facade style
  in the `FACADES` table (lines 19-30). `facadeOf()` (45-54) picks the style from height, OSM type and district:
  three curtain-wall glass styles for anything 60 m or taller, "housing" stone for homes 15 m and up, four shophouse
  pastels (`0xe8c6a2 0xc4dcc6 0xefdc9f 0xb7d0e3`), a concrete default and a white civic style.
- The facades are fully procedural PBR shaders: a window grid fitted to whole bays and storeys, ray-marched apartment
  interiors behind the glass, a fake reflected skyline, fresnel and sun specular, mullion bump maps, running-bond brick,
  cornices, sash bars, AC units, painted signs, soot, analytic street-canyon ambient occlusion, lit rooms at night.
  Curtain walls are `roughness 0.12 / metalness 0.72`; masonry `0.76 / 0.06`.
- Roofs are one merged flat mesh in grey `0x9c988f` with a per-building shade. No roof shapes at all.
- Every lit material in the project is `MeshStandardNodeMaterial` (138 uses) or `MeshBasicNodeMaterial` for glows
  (39). There is no `flatShading`, Lambert, Phong or Toon anywhere.
- Island tiles (`city-tiles.js:21-37`) are already closer to Warsaw: per-building vertex colours from `PASTELS`,
  `INDUSTRIAL` and `CONCRETE` palettes, with a window grid (3 m storeys, 2.4 m bays, glass `vec3(0.16,0.2,0.24)`)
  painted in the colour node and lit at night.

### Data (`tools/city/build.mjs`)

Per building the geodata keeps only footprint rings, top, bottom and OSM type (build.mjs:236-271). The committed raw
download `tools/data/singapore/osm_buildings.json` has more, and all of it is discarded:

| OSM tag | Buildings carrying it (of 17,135 tagged) |
| --- | --- |
| `building:levels` | 8,466 |
| `start_date` | 3,530 |
| `roof:colour` | 3,254 |
| `height` | 3,221 |
| `building:colour` | 1,973 |
| `name` | 1,938 |
| `building:material` | 1,660 |
| `roof:shape` | 1,276 (gabled 378, pyramidal 159, skillion 116, hipped 87, round 40, dome 17) |

### Landmarks (`js/singapore-landmarks.js`)

Four, all code-built: Marina Bay Sands, the Flyer, the Supertrees and the Esplanade. Their `Mesher` (lines 47-71)
already emits face normals, so they are flat-shaded in geometry; the materials are still PBR metal (Flyer steel
`metalness 0.6`, Esplanade sunshades `0.75`, Supertree canopies `0.7`). The config already supports replacing OSM
outlines with a model (`landmarks[].hide` in `tools/city/cities/singapore.mjs:76-93`), which is the hook a larger
landmark set would use.

### Trees, ground, camera

- Core trees (NParks inventory, `js/trees.js`): bark tubes with alpha-tested leaf cards from a generated atlas, seven
  species, three LODs, dark tints (rain tree `0x3f6322/0x4a6e27/0x36561d`).
- Island trees (`city-tiles.js:132-165`): a lumpy icosahedron crown on a 5-sided trunk, hashed tropical greens
  `0x1d3f19 / 0x335f22 / 0x4a6e26`. Structurally this is the Tiny Warsaw tree already, just with radial (smooth)
  normals and darker colours.
- Ground: the base plane under everything is the road asphalt material (`0x2b2e33`-`0x464a51`, wet puddles, SSR);
  lawns `0x224c20`-`0x6b9c3e`; water `0x162d2c`-`0x2e3f36` with FFT waves and fresnel; sidewalks `0x8e8d85`.
- Camera: street-level third-person modes (walk, car, bike, helicopter, jet). There is no high-angle map view and no
  depth-of-field or tilt-shift pass.

## 4. The gap, and what to change

Side by side, the difference is not "low-poly geometry": Singapore's facades are already single quads and its
landmarks already flat-shaded. The Tiny look comes from five things, in order of how much they contribute:

1. **Flat, bright lighting with no tone mapping.** Sky light as strong as the sun, no image-based lighting, no ACES.
2. **Diffuse-only materials in a pastel palette.** Lambert, no reflections, no specular, no wet roads, no interiors.
3. **Painted windows instead of simulated glass.** A tile with muted blue rectangles, repeated per bay and storey.
4. **Hundreds of hand-built landmarks plus real roof shapes**, so the skyline reads as "modelled" rather than extruded.
5. **A high-angle map camera with tilt-shift blur**, which is what makes it feel like a miniature.

None of this needs the renderer changed. Everything below stays on WebGPU and TSL; `three/webgpu` has
`MeshLambertNodeMaterial`, `flatShading` on node materials, `FogExp2` and a TSL gaussian blur.

### Phase 1. A `?look=tiny` preset (lighting, sky, post). About a day. Most of the visual change.

Gate it behind a URL flag and a Graphics-menu toggle so the photoreal look stays available.

- `TIME_PRESETS` (lighting.js:28-133): add `tiny` with `sunColor 0xfff3e0`, `sunIntensity` about 2.0, `hemiSky
  0xeef4ff`, `hemiGround 0xb8ad9c`, `hemiIntensity` about 2.0 (a 1:1 ratio is the point), `envIntensity 0`,
  `interiorGlow 0`, `roadWetness 0`, `canyonBounce 0`, `fogColor 0xd6e0e6`, a lower `fogDensity`, `skyExposure` so
  the sky reads as `#8fb8da` to `#dde6ea`. Skip `bakeEnvironmentMap()` and set `scene.environment = null`.
- Sky: either keep `SkyMesh` with low turbidity, or replace its `colorNode` with a two-colour gradient by view
  direction (zenith `#8fb8da`, horizon `#dde6ea`). Replace the aerial fog node with plain `FogExp2` in the haze colour.
- `LOOKS` (post-processing.js:25-30): add `tiny` with `contrast 1.0`, `saturation 1.12`, `bloom 0`, and switch
  `renderer.toneMapping` to `NeutralToneMapping` or `NoToneMapping` for that look. Keep the vignette, raise it to 0.25.
- Set `ssrPass.intensity` to 0 (main.js:377) in the tiny look.
- Shadows: set `renderer.shadowMap.type = PCFSoftShadowMap`, raise `normalBias` toward 0.3-0.6 and let the cascade
  `far` grow with the map camera altitude (the `update()` at lighting.js:313 already does this).

### Phase 2. Flat materials and the pastel palette. One to two days.

- Facades: add `createTinyFacadeMaterial({ wall, window, pattern, floorHeight, bayWidth })` in tsl-materials.js, a
  `MeshLambertNodeMaterial` (or Standard with `roughness 1`, `metalness 0`, no env map) whose `colorNode` draws the
  window rectangles with the same `floor`/`fract` grid the island `wallMaterial()` already uses, anti-aliased with
  `fwidth`. Patterns: punched, ribbon, curtain wall, vertical strips, shop front at ground floor. Window colour is the
  wall's window tint blended 30% toward sky blue (`#9db9d3`), exactly Warsaw's trick, with no emissive by day.
  Then point the `FACADES` table at it. The instanced-plane geometry and `facadeCell()` bay fitting stay as they are.
- Wall palettes by type (hash by building id so they are stable across builds), modelled on Warsaw's:
  glass tower `#e2dfd3 #deded7 #d6dfdb #e8dfce`; office `#d9dfe0 #d9d9d1 #e0dfd8 #ced9dc`; HDB slab and point
  block `#e6e4da #deded5 #e5dfcf #d8dfd9` with one coloured band per block (HDB estates are painted in bands);
  shophouse: keep the existing four pastels and add `#f0d9c0 #d8e6d0 #f2e4b0`. When OSM has `building:colour`, blend it
  40% toward `#d8d2c6` so it never shouts.
- Roofs: keep the merged vertex-colour mesh, but use `roof:colour` when present, a lighter default (`#b9b5ac`), and a
  terracotta (`#a4543b`-`#b8694a`) for shophouses and bungalows.
- Ground (tsl-materials.js factories): asphalt to a light warm grey (`#9c9a95`, no puddles, no aggregate bump),
  sidewalks to off-white (`#d8d2c6`), lawns to bright flat green (`#7ca057`, `#8cc063`), water to a flat light blue
  (`#8fb8da`) with no waves or fresnel, curbs one shade darker than the sidewalk. Road paint can stay.
- Island tiles: drop the `roughnessNode` and `emissiveNode` from `wallMaterial()` and lighten the three palettes; the
  tiles are then almost identical to Warsaw's generic buildings.
- Trees: use the island `treeGeometry` for the core NParks trees as well (they are instanced and already LOD'd), but
  compute per-face normals instead of radial ones so the crowns facet, and lift the greens to `#7ca057`-`#4a7a3a`
  with Warsaw's per-instance hue and top-lightening. Give rain trees a wide flattened crown (scale x/z 1.6, y 0.6)
  and palms a cone or fan, since those two silhouettes are what makes a street read as Singapore.

### Phase 3. Keep the OSM tags and build real roofs. Half a day for the data, a day for roofs.

- `build.mjs` (236-271): bump the geodata version and append per building `roof:shape`, `roof:colour`,
  `building:colour`, `building:levels` and `name` (the raw download already has them, counts above). Re-run
  `node tools/city/build.mjs singapore`.
- In `open-city-buildings.js`, build gabled, hipped, pyramidal and skillion roofs for the 1,276 tagged buildings, and
  apply a gabled tile roof heuristically to shophouse-district buildings under 20 m. A pitched roof on every
  shophouse row is the single cheapest thing that makes OSM-only blocks look like a model rather than an extrusion.

### Phase 4. Landmarks at Warsaw's scale. The real work, and the part the creator was talking about.

Singapore has four hand-built landmarks; Warsaw has 1,027. Copy the pipeline, not the models:

1. A `kit` for model authors, mirroring Warsaw's, in a new `js/landmark-kit.js`: `material(hex)` (Lambert, flat
   shaded, double-sided), `glassMaterial(hex)` (blended 30% to sky blue, light specular), `facadeMaterial({ pattern,
   wall_color, window_color, frame_color, floor_height_m, bay_width_m })` (a 128 px canvas tile repeated via
   `facadeUV(geometry, bay, floor)` planar UVs), `box`, `prism(footprint, y0, y1)`, `cylinder`, `finish(group,
   { skirt: 3 })`. Flatten the result to one vertex-coloured merged geometry (the facade tile can stay as a second
   material) so a thousand models cost a few draw calls.
2. One module per landmark at `tools/landmarks/<osm-way-id>.js` exporting `build(THREE, kit)`, in local metres
   around the building's own OSM footprint (the geodata `frame` with its Raffles Place origin and 31.8 degree bearing
   gives the transform). Hide the outline with the existing `landmarks[].hide` config.
3. Author them the way Warsaw did: an LLM (Claude, Gemini, Codex) given the footprint, the height tags and reference
   photos writes the program; a `?model=<id>` preview page renders it from four sides; automatic checks reject
   z-fighting (render twice with a jittered camera and diff), geometry outside the footprint, NaNs and triangle budgets;
   a human picks the keepers.
4. First batch, roughly in order of how often they are in frame: Raffles Hotel, Fullerton, the Merlion, ArtScience
   Museum, Helix Bridge, National Gallery and the Old Supreme Court dome, Victoria Theatre, Parliament, Lau Pa Sat,
   Sultan Mosque, Sri Mariamman, Buddha Tooth Relic Temple, CHIJMES, Capitol, Suntec's five towers and fountain,
   OCBC Centre, UOB Plaza, Republic Plaza, Guoco Tower, Marina One, DUO, South Beach, The Interlace, Pinnacle@Duxton,
   People's Park Complex, Golden Mile Complex, Tiong Bahru walk-ups, the Cavenagh, Anderson and Elgin bridges, Clarke
   Quay's canopies, the Sports Hub, the Flower Dome and Cloud Forest, Marina Barrage, Jewel and the Changi control
   tower for the island.
5. Typologies, not just landmarks: Warsaw classifies every generic building as tenement, office, slab or tower and
   gives each a silhouette. Singapore's equivalents are the shophouse (five-foot way arcade, pitched tile roof,
   pastel bands), the HDB slab block (void deck, corridor bands, lift core on the end) and the HDB point block. A
   generator per typology, driven by footprint shape, height and district, covers thousands of buildings at once.

### Phase 5. The map camera. Half a day.

Add an orbit "map" mode that starts about 400 m up at 45 degrees looking at the city (Warsaw's default view), with a
depth-based tilt-shift blur in the post graph (a TSL `gaussianBlur` of the scene pass, blended by distance from the
focus depth), the vignette and the +0.12 saturation. Make it the landing view for the tiny look and keep the street
modes as they are. The miniature feeling is mostly this camera plus Phase 1.

### What not to copy

- The WebGL renderer: no benefit, and the TSL facade and tile code would have to be rewritten.
- Far-distance impostor cards: Singapore already streams the island as tiles with their own window fade.
- GUGiK-style roof colours from aerial imagery: Singapore has no equivalent open dataset, so use `roof:colour` plus
  per-type defaults.
