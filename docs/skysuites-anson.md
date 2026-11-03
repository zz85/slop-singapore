# Skysuites @ Anson model (SG-117)

## Design and references

Replace the generic OpenStreetMap extrusions of Skysuites @ Anson (8 Enggor Street, Tanjong Pagar; P&T Consultants for Arcadia Development/Allgreen, completed 2014–15; checklist task **SG-117**) with a procedural landmark model in the existing landmark kit: a six-level podium, a near-black glass shaft cut by full-height silver fins, an open planted sky-terrace setback near the top (The Retreat), a paler louvred upper section, and the circular Vista Deck disc that caps the tower at 250 m.

- [Wikipedia: Skysuites @ Anson](https://en.wikipedia.org/wiki/Skysuites_@_Anson) — 250 m (820 ft), 71 floors (its gallery and developer material count the roof deck as the 72nd), 8 Enggor Street, site 2,788.1 m², architects P&T Consultants, tied 7th tallest in Singapore with Altez (SG-116) next door.
- [Wikimedia Commons category: Skysuites @ Anson](https://commons.wikimedia.org/wiki/Category:Skysuites_@_Anson) — freely licensed photographs and the model's primary visual evidence: "Skysuites@Anson" (looking up the finished tower: near-black curtain wall, strong vertical silver fins, the planted setback ledge with open slots, silver louvred floors above it and the dark circular crown disc), "Palmer road Singapore" (the whole tower from Shenton Way: podium, the two setback bands in the shaft's rhythm and the overhanging oval disc), and the construction view shared with Altez.
- [EdgeProp: "Allgreen Properties relaunches SkySuites@Anson"](https://www.edgeprop.sg/property-news/allgreen-properties-relaunches-skysuitesanson) — 360 units, completed 2015, "the sky garden called 'The Retreat' on the 60th floor of the 72-storey SkySuites@Anson" and the 72nd-floor roof terrace with 360-degree views.
- [99.co / Daniel Martinus, "12 tallest buildings in Singapore"](https://www.99.co/singapore/insider/?p=42996) — 250 m, 72 storeys, P&T Consultants; The Retreat at level 56 and the 360-degree Vista Deck on the 72nd floor; notes the circular roof design. The Retreat's floor is given as both 56 and 60 in these sources, so its height is estimated (see below).

## Mapped footprint and dimensions

- Replaced OSM objects (in `tools/data/singapore/osm_buildings.json`): way `172023451` (`name=Sky Suites@Anson`, `building:part=yes`, `building:levels=6`, the podium/plot outline) and way `393100851` (`building:part=yes`, `building:levels=71`, `building:min_level=6`, `height=250`, the tower). No enclosing relation and no other `building:part` ways exist for this site in the extract.
- After the city generator's simplification both rings are quads. The plot measures about 57 × 43 m (edges 43.6/57.4/42.5/57.9 m in the city frame); the tower plate is a parallelogram of about 29.5 × 25.1 m turned diagonally to the streets, so its broad faces look north-east and south-west — the face seen from Shenton Way in the Commons photograph.
- Neighbours are preserved: Altez (SG-116) across the shared western boundary, Mapletree Anson and its tower part (ways 171995554, 325832016) to the east, and Icon Village to the north are not hidden.
- Model dimensions (metres, `y` up from the street): total 250 (documented). Podium 0–21 (the mapped six levels at an estimated 3.5 m; the tower part's mapped `min_level=6` agrees that the shaft starts over it). Lower shaft 21–198; The Retreat's open terrace deck at 198 with the upper shaft set back 2.2 m behind corner columns from 198.6–240; glazed crown drum 240–246.5; Vista Deck disc (radius 16.5 m, overhanging the plate's 12.6 m half-depth as in the photographs) 246.5–249 and its cap to 250. The terrace height is estimated: levels 56–60 of 71–72 at the model's 3.45 m module over a 21 m podium bracket 195–209 m, and the Commons photographs put the planted ledge at about four-fifths of the shaft; 198 m is used. Storey counts then read 6 (podium) + 51 (lower shaft) + 12 (upper shaft) + the deck ≈ the documented 71–72.

## Approach and scope

Build in a local frame recovered from the mapped tower ring's long edge (independent of the vertex-average anchor and the city grid bearing), with the mapped rings themselves as the podium and shaft footprints:

- The podium is the mapped plot ring to 21 m in a near-black curtain facade with a proud glass retail band at its foot, a deck slab and planting on its roof around the tower, and an entrance canopy on the Enggor Street (west) face.
- The lower shaft is the mapped tower ring in very dark blue-black glass. The photographs' full-height silver fins are individual boxes standing proud of both broad faces (and one centred on each narrow face), so the tower reads as vertical silver stripes over black glass from the map camera.
- The Retreat is a real setback, not a painted band: a thin ledge slab overhangs the shaft at 198 m, the upper shaft resumes 2.2 m inside the plate behind four corner columns, and planters line the broad edges of the open deck between them. Geometry and collision both leave that ring of deck open.
- The upper shaft uses a pale silver louvred facade (fine vertical strips), matching the light, finely ribbed floors above the ledge in the close-up photograph. The Vista Deck is a glazed drum under a dark circular disc wider than the tower plate, with a low cap reaching 250 m; the disc's overhang is collidable at its own height with open air beneath it.
- Collision covers the podium (automatic), the podium and Retreat decks, both shafts, the drum and the disc (explicit prisms for everything above the podium), and the entrance canopy at its own height.
- The tower carries no rooftop tenant sign in the photographs, so none is modelled. Interiors, balcony rails, the podium's car-park screens and the artwork in the lobby are simplified to what reads at map camera distance. Reference photographs stay outside the repository; rendered comparisons are the model's own output.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=skysuites-anson&view=all
http://127.0.0.1:8012/tools/landmark-preview.html?model=skysuites-anson&view=s&look=day
http://127.0.0.1:8012/tools/landmark-preview.html?model=skysuites-anson&view=ne&backend=webgpu
http://127.0.0.1:8012/?look=tiny&at=skysuites-anson&camera=map
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-models.test.cjs tests/landmark-altez.test.cjs tests/landmark-skysuites-anson.test.cjs
```

## Verification

- New tests in `tests/landmark-skysuites-anson.test.cjs` probe the model on its real generated anchor from independently located points (the mapped tower ring's OSM centroid, a point just inside its longest edge on The Retreat's deck ring, and a point 15 m out from the centre under the Vista Deck's overhang): exactly ways 172023451 and 393100851 replaced with Altez and Mapletree Anson intact in the registration; 250 m top over the centre; the six-level podium at 21 m; the circular disc (radius 16.5 m) overhanging the plate; 10 silver fins each running over 150 m of the shaft; The Retreat's deck ring open in geometry and collision at 201 m while its deck at 198 m stops descent and four corner columns carry the set-back upper shaft; open air under the disc overhang with the disc itself collidable; finite geometry and zero coplanar flicker. 572 triangles in 10 material batches.
- Regenerated geodata compared decoded against the shared branch: `GEO.landmarks` gains exactly the two Enggor Street anchors of this PR pair (18 → 20 anchors, 258 → 262 mapped parts); the only changed geodata keys are `buildings` and `landmarks`, and `js/singapore-building-info.js` was regenerated in the same run.
- Targeted checks: `node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs tests/building-info.test.mjs` passes 84/84, and the two new test files pass 8/8. The full `node --test` suite passes 462/470 on Windows; the 8 failures (7 Overpass `bash` fixtures and 1 tile-worker test) fail identically on the untouched shared branch and are the guide's known platform cases.
- Rendered checks (headless Chrome): [four-view Tiny look](images/skysuites-anson-overview.png), the south elevation in day look and the north-east view on the WebGPU backend all render without errors, and the loaded city view (`?look=tiny&at=skysuites-anson&camera=map`) shows the black finned shaft beside Altez with no duplicate generic solid and all neighbours standing. The rendered tower was compared against the Commons photographs: black shaft with silver verticals, planted setback ledge, pale louvred top and overhanging disc all read at map distance.
