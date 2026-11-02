# Raffles Place MRT entrance pavilions

## Design and references

Add the two recognisable above-ground heritage entrance pavilions as a procedural landmark on the existing `codex/fullerton-hotel` branch. The station is underground; this change models its visible park entrances, without adding an underground train simulation or all building-integrated station exits.

- Existing OSM ways `106193391` (southern pavilion / Exit A) and `106193387` (northern pavilion / Exit B) supply the footprints and 7 m nominal height. Each is approximately 11.4 m wide by 23 m long, aligned about 5 degrees from north. Their ornamental façades face the park between them.
- [Exit A photograph, December 2021](https://commons.wikimedia.org/wiki/File:NS26_EW14_Raffles_Place_MRT_Exit_A_20211219_144439.jpg), [three-quarter view](https://commons.wikimedia.org/wiki/File:NS26_EW14_Raffles_Place_MRT_Exit_A_20211219_144720.jpg), and [Exit B photograph](https://commons.wikimedia.org/wiki/File:NS26_EW14_Raffles_Place_MRT_Exit_B_20211219_144555.jpg) guide proportions, cool off-white plaster, pilasters, circular ornaments, scalloped panels, curving gables, finials, clerestory glass and dark entrance openings. Photographs are references only, not bundled assets.
- [The National Heritage Board's Singapore River Walk](https://www.roots.gov.sg/~/media/Roots/Files/singapore-river-walk/nhb_singpaore-river-walk_2018.pdf?la=en) describes the entrance façades as recalling John Little's former premises.
- [URA's park-revamp announcement](https://www.ura.gov.sg/news/media/pr24-31/) targets redevelopment by 2028; the [2025 Master Plan](https://www.ura.gov.sg/land-planning/master-plan/master-plan-2025/regional-plans/central-area/rejuvenating-our-downtown/) also describes the revamped park as future work. This model uses the documented heritage pavilions, without treating competition renderings as completed architecture.

## Approach

Use the existing landmark kit to build real open entrance bays, an ornamental façade, plain side/rear walls and a framed roof/skylight. Position each pavilion from its own footprint rather than the station's shared anchor. Leave the space between them open. A generic extrusion loses the gable silhouette and openings; a downloaded mesh would add an unnecessary asset/material pipeline.

The model includes front pilasters with plinths/capitals, moulded cornices, curved gable masonry and coping, urn-like corner ornaments, a central finial, three circular vents, plaster relief panels, clerestory glass, steps and a shadowed interior. Geometry-based station signs use NS26 red and EW14 green badges. Nearby lantern-style lamps and paved approaches ground the entrances in the park. A narrow path connects the approaches; individual paving and roof-glass panels are estimated, without reconstructing every park paving joint.

Roof, ornament and finial heights are estimated from photographs; the nominal mapped height is 7 m, with the tallest ornaments allowed up to about 11 m. Interiors and rear elevations are simplified. No solid collider may fill the entrance openings or the lawn between pavilions. Elevated roof/clerestory structures must stop vertical descent, while the doorway clearance remains open.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=raffles-place-mrt
```

The preview's Exit A/B buttons frame each entrance separately. `&focus=A&view=n` gives a close north-facing view of Exit A; `&focus=B&view=s` frames Exit B.

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
```

The two mapped generic station blocks are replaced; surrounding towers, other station exits and park geography retain their existing representation.

## Verification

- 42/42 targeted landmark and city-generator checks pass. Station tests probe the actual façade planes and interior openings, the park gap, roof collision, mapped extent, finite geometry, material batching and flicker.
- The paired model uses 20,910 triangles and 14 material batches. Tiny/day and WebGL/WebGPU previews, including both close front views, render without JavaScript errors; the production city also loads the model without model warnings or JavaScript errors.
- Independent review decoded the generated building data against the parent commit: exactly the two 7 m station blocks disappear; all other generic building records and unrelated geography are unchanged. No outstanding review findings.
- Full `node --test`: 349 passing and eight pre-existing Windows fixture failures (one worker-path fixture in `tests/city-tiles.test.mjs`, seven shell-fixture cases in `tests/overpass.test.mjs`). No new failures.
