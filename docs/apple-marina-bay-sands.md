# Apple Marina Bay Sands model (SG-049)

## Design and references

Replace the generic OpenStreetMap extrusion of Apple Marina Bay Sands (2 Bayfront Avenue #B2-06; Foster + Partners with Apple's design teams; opened 10 September 2020; checklist task **SG-049**) with a procedural landmark model in the existing landmark kit: the fully glazed "lantern on the bay" — a 30 m diameter glass dome/sphere on a black glass base, standing in Marina Bay off the Shoppes and joined to the shore boardwalk by a small ramped bridge.

- [Foster + Partners project text](https://fp-corporatewebsite-prod.azurewebsites.net/projects/apple-marina-bay-sands) (also [reproduced by Arch2O](https://www.arch2o.com/apple-marina-bay-sands-foster-partners/) and in the [Foster + Partners press release (PDF)](https://cdn.archilovers.com/projects/ece3eac3-536f-45bc-a9d8-d94d1f1fc990.pdf)) — "a **30-metre diameter dome** that is a contemporary interpretation of the geodesic dome… fully glazed, with a **black glass base**, creating an island joined only by a small bridge. A gentle ramp from the boardwalk leads up to the fully glazed dome, which affords a 360-degree view… through large **12 metre × 3 metre** panes of curved glass." 114 pieces of curved structural glass; inside, **concentric light sunshade rings (baffles)** reduce in size toward the top, below a **semi-opaque oculus** at the apex "reminiscent of Rome's famous Pantheon".
- [9to5Mac, "The lantern on the bay" (7 Sep 2020, with preview photographs)](https://9to5mac.com/2020/09/07/apple-store-marina-bay-sands-preview-photos/) — 114 pieces of curved glass; the open-air **inclined boardwalk rising from the shore**, marked with a small Apple signpost; concentric baffles narrowing to the oculus; below the dome, a subaquatic tunnel to The Shoppes (not visible; not modelled).
- [Apple: Apple Marina Bay Sands store page](https://www.apple.com/sg/retail/marinabaysands/) — the store's own page (also the mapped `website` tag).
- [OpenStreetMap way 821764692](https://www.openstreetmap.org/way/821764692) — `name=Apple Marina Bay Sands`, `building=retail`, 1 level over 1 underground level, `height=5`, `roof:shape=dome`, `roof:height=15`, `roof:material=glass`, `start_date=2020-09-10`.

Reference photographs (Foster + Partners' and Apple's press views across the bay, and views along the boardwalk) stay outside the repository; the sphere's siting in the water, the black base, the pale baffle rings seen through the glass and the boardwalk's run to shore are taken from them as noted under "estimated" below.

## Mapped footprint and dimensions

- Replaced OSM object: **way `821764692` only** (hidden via `hide`, which also supplies `site.parts`). No `building:part` ways and no enclosing relation exist for the pavilion in the extract; the boardwalk is not mapped as a building.
- Mapped dimensions: the way is a 21-point near-circle of **32.7 × 32.7 m**, area ≈ 828 m², centred at 1.283330, 103.857571 — in the bay, west of The Shoppes. The tags give `height=5` plus `roof:height=15`, i.e. ≈ **20 m** overall, which agrees with the published 30 m *diameter* read as a sphere whose equator stands a few metres over the water (a full 30 m sphere floating with its lower third in the black base and the bay). The model therefore builds a **sphere of radius 15 m about a centre 7 m over the water, its glass bands rising to 21 m under an oculus cap at ≈ 21.3 m** (`info.height` 21 m rounded) — mapped diameter 32.7 m less the base's flare. The sphere's exact centre height and the base's profile are **estimates from the photographs within the mapped 20 m envelope**, not surveyed values.
- The shore: the nearest mapped water boundary in `tools/data/singapore/osm_water.json` lies ≈ 65 m from the sphere's centre at bearing ≈ 55° — the promenade edge in front of The Shoppes. The boardwalk is modelled on that bearing from the dome to the shore, ≈ 52 m of deck beyond the sphere, 8 m wide with its top ≈ 1.5 m over the water (width and level estimated from photographs).
- Neighbours are preserved: The Shoppes podium and its parts to the east (SG-047's scope), the Crystal Pavilion North (`172013197`, SG-057) and the MBS hotel/SkyPark ways are not hidden. The dome replaces nothing on land; the boardwalk deck is the model's own geometry over the water, as the real bridge is.

## Approach and scope

The model's centre is the mapped circle's own centre (recovered from the ring in `site.parts`, not assumed from the anchor); the sphere is built in latitude bands about it with `kit.loft`.

- **Black glass base**: a short dark cylinder at the waterline, the sphere emerging from it — the published base, also what the mapped `height=5` plausibly describes.
- **Glass dome**: latitude loft bands of the 15 m sphere in glass, with ten slim vertical mullions following the surface (the structure's ten supports and the 3 m pane rhythm) and three pale concentric baffle rings just inside the glass, shrinking toward the top as in the interior photographs. The **semi-opaque oculus** caps the apex in pale translucent-looking material.
- **Boardwalk**: a low straight deck on bearing ≈ 55° to the mapped shore, with slim edge rails suggested by thin parapet strips; the shore-end Apple signpost is the model's one sign — the Apple mark alone (from `js/landmark-logos.js`, simplified from photographs), at the scale of the real signpost. The big  applied to the dome's bay-facing glass in some photographs is a temporary-looking applied graphic rather than building lettering, and is not modelled.
- **Collision**: the base collides automatically; the elevated sphere gets an explicit filled collision prism (its equatorial disc, waterline to oculus) so nothing descends through the dome; the boardwalk deck is a low solid over the water. The bay around it stays open.
- The interior (Forum, trees, tables), the underwater tunnel to B2 of The Shoppes and the glass's night-time glow are not modelled — the kit's glass reads as the lantern at map distance.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=apple-marina-bay-sands&view=all
http://127.0.0.1:8012/tools/landmark-preview.html?model=apple-marina-bay-sands&view=ne&look=day
http://127.0.0.1:8012/tools/landmark-preview.html?model=apple-marina-bay-sands&view=ne&backend=webgpu
http://127.0.0.1:8012/?look=tiny&at=apple-marina-bay-sands&camera=map
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-models.test.cjs tests/landmark-apple-marina-bay-sands.test.cjs
```

## Verification

- New tests in `tests/landmark-apple-marina-bay-sands.test.cjs`, built on the real generated anchor with independently located lon/lat probes (the mapped circle's centre, 13 m west inside the dome, the boardwalk at 40 m on bearing 55°, open water 50 m south-west): exactly way 821764692 replaced, with the Crystal Pavilion (SG-057) and ArtScience (SG-048) intact in the registration; at least five latitude bands with an equator radius of ≈ 15 m (the published 30 m diameter); black base at the waterline, oculus at the apex, at least three baffle rings; exactly one sign, carrying `logo: 'apple'` alone; finite geometry, zero coplanar flicker, dome and boardwalk-deck collision solid with the bay open. **2,698 triangles in 8 material batches** (budget 65,000/16). The model also joined the generic documented-height loop in `tests/landmark-models.test.cjs` at 21 m, and the new Apple mark joined the tenant-mark registry test in `tests/landmark-kit.test.cjs`.
- Regenerated geodata: `GEO.landmarks` gains this anchor and SG-048's (35 → 37 anchors against the integration branch this PR rebased onto); this anchor carries the one mapped dome way, and `js/singapore-building-info.js` was regenerated in the same run.
- Targeted checks pass **111/111**: `node --test tests/landmark-artscience-museum.test.cjs tests/landmark-apple-marina-bay-sands.test.cjs tests/landmark-models.test.cjs tests/landmark-kit.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs tests/building-info.test.mjs`. The full `node --test` suite passes **540/548** on Windows; the 8 failures (7 Overpass `bash` fixtures, 1 tile-worker test) fail identically on the untouched base commit `b74179d` in a clean worktree — the guide's known platform cases, not regressions.
- Rendered checks (headless Chrome): the [four-view Tiny overview](images/apple-marina-bay-sands-overview.png) and the north-east massing in day look show the dark glass sphere with its ten pale mullions, oculus cap, black base and shore boardwalk; the city logs `Apple Marina Bay Sands (98 parts, 2698 triangles, 21 m)` with no flicker warnings or exceptions (the only warnings are this headless Chrome's missing WebGPU adapter, so it rendered on the WebGL2 fallback). The loaded city view (`/?look=tiny&at=apple-marina-bay-sands&camera=map`) shows the dome floating in the bay with the boardwalk landing on the promenade in front of The Shoppes, no duplicate generic dome and neighbours intact. Known limitations: the sphere's centre height and base profile are estimates within the mapped envelope (above); the baffle rings sit inside opaque-at-this-scale glass and are not visible from outside; the interior and the B2 tunnel are not modelled.
