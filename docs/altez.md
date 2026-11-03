# Altez model (SG-116)

## Design and references

Replace the generic OpenStreetMap extrusions of Altez (16 Enggor Street, Tanjong Pagar; RSP Architects for Bishan Properties/Far East, completed 2014; checklist task **SG-116**) with a procedural landmark model in the existing landmark kit: a low podium over the whole plot, a slender dark-glass residential shaft whose broad faces carry the scattered projecting silver-framed bay windows of the photographs, and a lighter glazed penthouse crown under a thin white cornice.

- [Wikipedia: Altez](https://en.wikipedia.org/wiki/Altez) — 250 m (820 ft), 62 floors, completed 2014, architect RSP Architects; tied 7th tallest in Singapore with its Enggor Street neighbour Skysuites @ Anson (SG-117). Its photograph (taken during construction) shows the shaft's dark blue-grey curtain wall, the irregular pattern of projecting white-framed bays and the open-framed glazed crown.
- [Wikimedia Commons: "Sky Suites@Anson and Altez"](https://commons.wikimedia.org/wiki/File:Sky_Suites@Anson_and_Altez.jpg) — both towers from below during construction; Altez (right) shows the same bay pattern, the horizontal slab lines and the flat-topped crown with its white frame.
- [99.co / Daniel Martinus, "12 tallest buildings in Singapore"](https://www.99.co/singapore/insider/?p=42996) — Altez 250 m, 62 storeys, RSP Architects Planners & Engineers; its RSP perspective shows the facade above Icon Village and its pool immediately north of the plot.
- [Stacked Homes directory: Altez](https://directory.stackedhomes.com/condo/altez/) — 208 units (developer material elsewhere says 280; the unit count does not affect the model), 62 storeys, completed 2014.
- [Far East / PropertyGuru project descriptions](https://www.propertyguru.com.sg/listing/for-rent-altez-20585800) — "single 62-storey skyscraper" of 250 m at 16 Enggor Street.

No freely licensed straight-on elevation of the completed tower was found; the completed-state colours and crown are taken from the construction photographs above (the facade was complete in them apart from the crown frame) and checked against the distant completed tower visible behind M Hotel in [Commons: "Palmer road Singapore"](https://commons.wikimedia.org/wiki/File:Palmer_road_Singapore.jpg). Anything not visible there (the podium-roof layout) is marked estimated below.

## Mapped footprint and dimensions

- Replaced OSM objects (in `tools/data/singapore/osm_buildings.json`): way `172023443` (`name=Altez`, `building:part=yes`, `height=10`, the plot/podium outline) and way `393100852` (`building:part=yes`, `building:levels=62`, `height=250`, `min_height=10`, the tower). No enclosing relation and no other `building:part` ways exist for this site in the extract.
- After the city generator's simplification both rings are quads. The plot measures about 59 × 38 m (edges 59.1/36.3/57.4/39.6 m in the city frame); the tower plate is a rectangle of about 29.7 × 26.4 m, its long axis running roughly east–west, sitting in the southern two-thirds of the plot. The 3,036 m² site area quoted by Wikipedia is consistent with the mapped plot (about 2,200 m² for the simplified quad; the unsimplified ring is larger).
- Neighbours are preserved: Icon Village (way 152598430) and the Icon Loft towers to the north, the Union and Lian Huat buildings to the west, and Skysuites @ Anson (SG-117) across the shared boundary to the east are not hidden.
- Model dimensions (metres, `y` up from the street): total 250 (documented). Podium 0–10 (mapped `height=10`, and the tower part's mapped `min_height=10`); shaft 10–236; inset glazed crown 236–247; white cornice slab 247–248.6; roof plant to 250. The 62 documented storeys give the shaft its 3.8 m facade module ((250 − 10) / 62 ≈ 3.87; the crown floors are taller). The split between shaft and crown at 236 m is estimated from the photographs, where the lighter crown occupies roughly the top three to four floors; the podium-roof pool deck on the plot's northern end is likewise an estimate from the mapped podium height and the usual arrangement — no roof plan was available.

## Approach and scope

Build in a local frame recovered from the mapped tower ring's long edge (independent of the vertex-average anchor and the city grid bearing), with the mapped rings themselves as the podium and shaft footprints:

- The podium is the mapped plot ring to its mapped 10 m, in a dark grey-blue curtain facade (the mapped `building:colour` is #5d6166), with a deck slab on top, a pool and planting on the northern deck away from the tower, and an entrance canopy on the Enggor Street (west) face.
- The shaft is the mapped tower ring in a dark blue-grey curtain facade with silver mullions. Its signature — the apparently random projecting bay windows — is built as individual silver-framed boxes with dark glass fronts, scattered deterministically over both broad faces on the floor/bay grid, standing about 0.5 m proud of the curtain wall as in the photographs. Plain silver fins mark the narrow faces.
- The crown is the tower ring inset 0.7 m in paler glass, capped by a thin white cornice slab that overhangs the shaft by 0.4 m and a small central plant block, reaching the documented 250 m.
- Collision covers the podium (automatic), the podium deck, the full shaft and crown (explicit prisms, since the shaft starts at 10 m), and the entrance canopy at its own height, leaving the street below it open.
- Altez carries no rooftop tenant sign in the photographs, so none is modelled. Interiors, individual balcony rails and the podium's car-park screens are simplified to what reads at map camera distance. Reference photographs stay outside the repository; rendered comparisons are the model's own output.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=altez&view=all
http://127.0.0.1:8012/tools/landmark-preview.html?model=altez&view=s&look=day
http://127.0.0.1:8012/tools/landmark-preview.html?model=altez&view=ne&backend=webgpu
http://127.0.0.1:8012/?look=tiny&at=altez&camera=map
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-models.test.cjs tests/landmark-altez.test.cjs tests/landmark-skysuites-anson.test.cjs
```

## Verification

- New tests in `tests/landmark-altez.test.cjs` probe the model on its real generated anchor from independently located lon/lat points (the mapped tower ring's centroid, the northern podium deck, Enggor Street): exactly ways 172023443 and 393100852 replaced with Icon Village, the Icon towers and Skysuites intact in the registration; 250 m top over the tower centre; the podium at its mapped 10 m with nothing tall on its northern deck and a pool lying on it; at least 60 projecting bays confined to the shaft (172 built); the crown above 230 m; no tenant sign; finite geometry, zero coplanar flicker, shaft/crown/deck collision solid and the street open. 4,294 triangles in 9 material batches.
- Regenerated geodata compared decoded against the shared branch: `GEO.landmarks` gains exactly the two Enggor Street anchors of this PR pair (18 → 20 anchors, 258 → 262 mapped parts); the only changed geodata keys are `buildings` and `landmarks`, and `js/singapore-building-info.js` was regenerated in the same run.
- Targeted checks: `node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs tests/building-info.test.mjs` passes 84/84, and the two new test files pass 8/8. The full `node --test` suite passes 462/470 on Windows; the 8 failures (7 Overpass `bash` fixtures and 1 tile-worker test) fail identically on the untouched shared branch and are the guide's known platform cases.
- Rendered checks (headless Chrome): [four-view Tiny look](images/altez-overview.png), the south elevation in day look and the north-east view on the WebGPU backend all render without errors, and the loaded city view (`?look=tiny&at=altez&camera=map`) shows the tower with its scattered white bays between Icon and Skysuites @ Anson with no duplicate generic solid and all neighbours standing. The rendered shaft was compared against the Commons construction photographs: bay scatter, dark blue-grey curtain, pale crown and white cornice all read at map distance.
