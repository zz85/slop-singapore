# Building convincing Tiny Singapore landmarks

This is the shared modelling workflow for **Codex, Claude Code and Meta Muse**, and for human contributors. Read it before changing a landmark. Root `AGENTS.md` and `CLAUDE.md` point here so coding agents can discover it. It describes repository conventions and works independently of an agent framework.

Start with the building's footprint, silhouette, proportions and palette. Spend detail where it makes the landmark recognisable from the map camera. A correct roof and a deep veranda usually contribute more than hundreds of tiny windows.

## 1. Establish the real building

Collect a roof/site plan, a clear principal elevation and at least one side or courtyard view. Prefer the owner, architect, conservation authority and original photographers. Check that the photographs show the same building and renovation period. A hotel name can refer to several buildings; Raffles Hotel, Raffles City and Raffles Place MRT are different sites.

Inspect `tools/data/singapore/osm_buildings.json` before drawing. List every relevant way and relation, including `building:part`, canopies and enclosing multipolygons. Record their IDs, tags, bounds and inner rings. Check individual heights against storeys in photographs: tags can describe a whole complex, a roof or an outdated estimate.

Write `docs/<landmark-id>.md` with source links, the replacement IDs, the coordinate frame, measured/mapped dimensions and visual estimates. Do not imply that an estimated elevation is surveyed. Reference photographs stay outside the repository unless redistribution rights are established; our procedural geometry does not require those image files at runtime.

## 2. Draw the massing before decorating

Make a small plan in metres and label each wing. Identify what is empty: atria, court gardens, passages and gaps between separate buildings. Model those spaces by arranging solids around them. Never cover them with a full-site building slab or a single bounding-box collider.

Break the building into its characteristic masses: lower podium, tall wings, setbacks, corner pavilions, balconies, sloping roofs, plant enclosures and canopies. Preserve the proportions seen in the plan and elevation. For modern buildings, check the actual roof and glass volume rather than starting from a generic tower. For heritage buildings, keep colonnades, verandas and roof tiers distinct.

Use a restrained reference palette: main wall, shadowed wall, light trim, roof, roof edge, glass/frames and vegetation. White buildings need shadow and depth to read. Keep windows visibly behind columns and trim; flat rectangles painted over a block will not give the same result. Compare the Tiny look and ordinary daylight before deciding on the final colours.

## 3. Integrate with this repository

| File | Responsibility |
| --- | --- |
| `tools/city/cities/singapore.mjs` | Register `{ id, name, model, hide, hideRelations }`. Hide only the OSM objects this model replaces. |
| `js/landmark-models/<id>.js` | Export `info = { name, height }` and `build(kit, site)`. Keep all model-specific geometry here. |
| `js/landmark-kit.js` | Existing geometry, material pairing, batching, collision and validation helpers. Extend it only for a genuinely reusable missing primitive. |
| `js/singapore-geodata.js` | Generated city output. Regenerate it; do not edit its data string by hand. |
| `tests/landmark-models.test.cjs` | Build the real model on the generated anchor and check geometry and collisions. |
| `tools/landmark-preview.html` | Inspect the isolated model from several directions and in both looks/backends. |

`site.parts[].ring` is an array of `[x,z]` points **relative to the landmark anchor**, already rotated into the city frame. One unit is one metre; `y` is up. Use `kit.compass(degrees)` for true bearings; do not assume world `+x` is true east. Recover the reference drawing's origin from a stable mapped part, rather than assuming the anchor is the physical centre. Check whether drawing axes form a reflected basis before converting local angles to `kit.box` yaw.

`hide` contains **way IDs**. `hideRelations` contains **relation IDs**; those are separate OSM namespaces. Hidden top-level ways supply `site.parts`. Hidden relations currently suppress generic masses but do **not** supply anchor rings or holes. If your model needs their outlines, inspect the raw relation and document your decomposition into wings. Do not hide a relation and then fill its courtyard with an invented extrusion. Do not assume a relation member exists as a top-level way.

After changing replacement IDs, run:

```sh
node --max-old-space-size=8192 tools/city/build.mjs singapore
```

Inspect the changed building/tree counts and the resulting landmark anchor. Check the city view for remaining generic parts underneath or above the new model, and for missing neighbours. Tree exclusion follows hidden source footprints; add intentional courtyard planting in the model when necessary.

## 4. Add depth and selective detail

Use `kit.box`, `kit.prism`, `kit.loft`, `kit.cylinder`, `kit.inset` and `kit.compass`. Reuse a local face helper for columns, windows and cornices. Keep wall profiles, window proportions and column spacing consistent with the sources. A hipped roof needs a narrow ridge and sloping sides; a glass pavilion may need an explicit translated `topRing`. A pediment, canopy or curved corner should change the silhouette.

Build balconies and verandas as recessed rooms behind an outer line of columns. Use real openings in important arches. Suggest tile texture and distant railings with a limited number of shapes. Concentrate small details on the principal façade and characteristic roof; simplify repeated service elevations. Avoid copying the same floor/roof treatment across historically different wings. For a tiered roof, truncate the lower hip beneath the upper tier's footprint and join the levels with a fascia or clerestory; stacking complete pointed hips leaves the upper roof floating. Check that columns, beams, walls and eaves actually meet in a low elevation view.

Use `kit.material` and `kit.glassMaterial` so materials receive their Tiny counterparts. The kit merges geometry by material: a window should not create its own draw call. Include signs only where the real building has them, at plausible sizes, with a separate raised face.

Keep visible faces apart by a few centimetres. In particular, check crossing mullions/transoms, balcony posts inside columns, roof ridges and overlapping corner masses. Fix overlapping solids or their dimensions; do not remove flicker checks to hide the problem.

## 5. Treat collision as part of the model

Ground-level parts get automatic collision. An elevated solid, bridge, roof or deck generally needs an explicit `kit.collisionPrism({ ring, y0, y1 })`. Otherwise a player or aircraft can descend through a visually solid roof.

Collision should cover solid building/roof interiors while leaving actual paths and gardens clear. For a raised canopy, use column collision below and roof collision above; do not invent a ground-to-roof wall across its doorway. The kit's filled irregular volumes approximate boundaries with scanline strips, so probe both interiors and nearby clear spaces. Sloping roofs can use conservative volumes kept inside their footprint; document any material simplification.

## 6. Verify geometry and appearance

Write failing tests for the model's meaningful constraints before implementing them. Use real generated anchors and actual kit output. Good assertions probe an independently located courtyard, a passage under a canopy, an elevated deck and bounds against mapped geometry. Include replacement IDs, finite geometry, a reasonable triangle/material budget and zero coplanar flicker. Part-name checks alone do not establish correct shape or placement.

Aim for **fewer than 65,000 triangles and 16 material batches per landmark**. Set a justified, documented exception if the site needs one. Count before multiplying a small detail across every face: balusters and multi-piece windows can dominate an otherwise cheap model.

```sh
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
node --test
python -m http.server 8012
```

Open these preview variants, replacing `raffles-hotel` with your model ID:

```text
/tools/landmark-preview.html?model=raffles-hotel&view=all
/tools/landmark-preview.html?model=raffles-hotel&view=ne&look=day
/tools/landmark-preview.html?model=raffles-hotel&view=ne&backend=webgpu
/?look=tiny&at=raffles-hotel&camera=map
```

Inspect the roof plan, principal elevation, rear/side and normal map distance. The preview's `focus=<part-name-prefix>` can fit one group, but it is not a universal cutaway; check a complete model view as well. Wait for the city loading overlay to disappear and the camera to settle before taking screenshots. Check browser exceptions, missing models, shader errors and landmark flicker warnings. **Passing tests do not replace looking at the rendered building against its sources.**

The full suite includes POSIX shell fixtures. On Windows, use a Linux/WSL checkout with LF line endings for the complete suite and report any platform-specific failures separately. Do not change unrelated tests merely to make a landmark PR green.

## 7. Deliver something reviewable

Include the model, generated geodata, source notes, tests and a small number of useful preview images or links in the PR. Explain what changed at map scale, the sources and estimates, verification results and material limitations. Keep temporary downloaded references, test fixtures and browser scripts outside the repository. Follow the user's current instruction about creating or merging a PR.

Useful examples: [Fullerton Hotel](../fullerton-hotel.md), [Fullerton Bay Hotel](../fullerton-bay-hotel.md), [Raffles Place MRT](../raffles-place-mrt.md) and [Raffles Hotel](../raffles-hotel.md). Read their model code alongside the notes; they demonstrate different shapes rather than one template to copy blindly.
