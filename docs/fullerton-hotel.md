# Fullerton Hotel model

Modelled on `codex/fullerton-hotel`, branched from `feat/tiny-look` at `c8fa461` on 2 November 2026. The model uses the existing landmark kit and the city's normal/Tiny material pairing.

## Reference and interpretation

- [OpenStreetMap way 46595395](https://www.openstreetmap.org/way/46595395) supplies the footprint, position and orientation. The source snapshot is already in `tools/data/singapore/osm_buildings.json`. The hotel's outline and two overlapping parts (`407926378`, `407926385`) are excluded from generic rendering; One Fullerton, the Waterboat House and Fullerton Bay Hotel remain separate buildings. The upper part also guides the central rooftop pavilion placement.
- [URA's conservation entry](https://www.ura.gov.sg/conservation/find-a-building/conservation-portal/071-fltbdg/) identifies the former Fullerton Building at 1 Fullerton Square and provides a front-facade photograph.
- [Bob T's October 2018 aerial photograph](https://commons.wikimedia.org/wiki/File:Aerial_perspective_of_Fullerton_Hotel,_Singapore.jpg) is the principal visual reference for the recessed giant-order colonnade, red tiled dormer roofs, white modern upper floors, rooftop pavilion and atrium. The photograph is used as a reference only; it is not bundled as a texture or asset.
- [The hotel's own site](https://www.fullertonhotels.com/fullerton-hotel-singapore) and [entrance photograph](https://shop.fullertonhotels.com/evoucher/e-voucher/stay-and-savour) provide current context and entrance colours.
- [The hotel's infinity-pool page and photograph](https://www.fullertonhotels.com/fullerton-hotel-singapore/facilities/infinity-pool) identify the low 25 m riverside pool terrace. OSM relation `4039936` supplies its deck/pool outlines; its untagged height previously produced a tall generic block. `hideRelations` now excludes that relation independently of way IDs, and the landmark replaces it with a low terrace, water, parapet, loungers and parasols.

The mapped footprint is approximately 128 m north–south and 79 m east–west including the low eastern projection. The historic mass is represented by its five main frontages, clipped corners and recessed wings around an atrium, rather than a rectangular solid. The low bowed extension is separate from the tall mass.

The source tags disagree: `height=25` and `building:height=37`. The latter is used as an approximate architectural reference, with the flagpole reaching 43 m. Storey, cornice, roof and pavilion proportions are estimated from photos; these are not survey-certified elevations. Fine stone carving, interiors and exact rooftop equipment are simplified.

## Visible features

- Pale warm-grey stone base and columns, off-white window surrounds and upper floors, muted green-grey glazing and terracotta roofs.
- Individual faceted column shafts, bases, capitals, deep window recesses, three rows of heritage windows, cornices and balcony balusters.
- Red sloped roof bands with dormers, setback upper windows and a lower glazed atrium with framing.
- Low glazed eastern projection, open entrance canopy, riverside pool terrace, rooftop pavilion with its central link, gold roof lettering and a small flag.
- Material batching and altitude-aware collision/map volumes supplied by `js/landmark-kit.js`, including upper wings and roofs while preserving the atrium bays and entrance clearance. Irregular explicit volumes use filled strips with up to 1 m boundary approximation, so roof interiors also stop vertical descent. No downloaded model or photographic texture is used.

## Inspect and rebuild

Serve the repository on a local HTTP server, then open:

```text
http://127.0.0.1:8000/tools/landmark-preview.html?model=fullerton-hotel
```

The preview supplies four views, individual front/roof views and a normal/Tiny look switch. It defaults to the WebGL backend for easy review; `&backend=webgpu` exercises WebGPU. The production city loads the model through its existing landmark loader.

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
```

The model tests check its mapped anchor and extent, a real atrium, tall individual columns, finite geometry, material batching, collision footprints and coplanar flicker. Visual comparison against the reference remains necessary for architectural fidelity.

## Verification on this branch

- 33/33 targeted landmark and city-generator tests pass. The generated city removes the two overlapping hotel parts and the incorrect 57.6 m pool-terrace extrusion.
- The model renders in normal and Tiny looks, WebGL and WebGPU, and in the production city without JavaScript errors. Geometry is 43,555 triangles in 11 material batches.
- The full `node --test` run reports 340 passing and eight failures also present before this change: one Windows worker-path fixture in `tests/city-tiles.test.mjs` and seven shell-fixture failures in `tests/overpass.test.mjs`. These unrelated failures were left for the main branch.
