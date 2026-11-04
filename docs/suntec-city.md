# Suntec City — SG-215

## Ownership and scope

Meta Muse / `01a1a1c3`, branch `datainvestor/take-two-checklist-buildings`, user-assigned 2026-11-03 (the user substituted Suntec City after reporting Six Battery Road SG-007 and Customs House SG-036 already built by other agents; the first building of the pair is One Fullerton SG-033). Checklist row SG-215 was unowned `todo`; no model or open PR existed.

Scope is the checklist's bounded complex: the five office towers, the mall podium and the Suntec Singapore Convention & Exhibition Centre, with the Fountain of Wealth in its open court. Neighbours that stay as mapped: Conrad Centennial (46595138), Millenia Walk and the Marina Square/Pan Pacific blocks to the south, Promenade station entrances.

## Sources (consulted 2026-11-03; photographs are research only, none in the repo)

- [Wikipedia, Suntec City](https://en.wikipedia.org/wiki/Singapore_International_Convention_and_Exhibition_Centre): five office towers — Towers One to Four 45 storeys ("the four fingers"), Tower Five 18 storeys ("the thumb") — around the Fountain of Wealth, over the mall and convention centre; completed 1997.
- Tallest-buildings listings and the OSM parts agree: Towers 1–4 **181 m**, 45 floors, with a diagonal cut-out/step near the 30th floor.
- [Wikimedia Commons, "Suntec City 202409"](https://commons.wikimedia.org/wiki/File:Suntec_City_202409.jpg): September 2024 street view — dense small-window grid in warm beige-grey aluminium, the stepped notch two-thirds up, a SUNTEC sign on a tower crown, the convention centre's angled glass front at left.
- [Wikimedia Commons, "Singapore Suntec City viewed from The Stamford"](https://commons.wikimedia.org/wiki/File:Singapore_Suntec_City_viewed_from_The_Stamford.jpg): two towers with the notch and flat roofs, SUNTEC lettering at a crown.
- [Wikimedia Commons, "Above The Fountain"](https://commons.wikimedia.org/wiki/File:Above_The_Fountain_(214687347).jpeg): aerial of the Fountain of Wealth — bronze ring over a dark circular basin inside the roundabout, ring held on four slanted legs.
- Fountain of Wealth published figures: bronze ring circumference ≈ 66 m (≈ 21 m diameter), held ≈ 13.8 m above ground on four slanted columns; basin ≈ 1,683 m².
- OSM extract in `tools/data/singapore/osm_buildings.json` (© OpenStreetMap contributors, ODbL): all footprints, tower tiers and roof pyramids below.

## Mapped geometry and replacement boundary

The OSM mapping is unusually complete: each 45-storey tower is an outline plus three stacked parts (0–90 m, 90–150 m, 150–181 m, each tier's ring smaller/offset — the photographed notch), Tower Five is an outline plus a 72 m/18-level part, the convention centre is an outline, a 28 m/7-level part over the same ring and **71 small pyramidal roof parts** (28–33 m, the white skylight pyramids), the mall is four ways, and the fountain's four legs are four tiny metal parts whose centroids sit 16.3 m from their common centre (103.8589213, 1.2947645).

| Group | OSM ways replaced |
| --- | --- |
| Towers 1–4 outlines | 46595146, 46595147, 46595148, 102938119 |
| Towers 1–4 lower tiers (→90 m) | 741937829, 741937830, 741937831, 741937832 |
| Towers 1–4 middle tiers (90–150 m) | 393090486, 393090485, 393090484, 393090487 |
| Towers 1–4 top tiers (150–181 m) | 172373826, 172373825, 172373827, 393090483 |
| Tower 5 outline + part (72 m) | 46595145, 741937828 |
| Mall podium (20 m) + link + west block (33 m) | 393210508, 46595137, 492114727, 393210509, 46594818 |
| Convention centre outline + 28 m part | 393090489, 591301851 |
| Convention roof pyramids (71 ways, 28–33 m) | 393090403–393090481 series and 463425266–463425306 series — enumerated in the registration and test |
| Fountain legs | 460430417, 460430418, 460430419, 460430420 |

Dimensions: tower heights **181 m / 72 m are mapped and corroborated** above; mall 20 m and convention 28 m + 5 m pyramids are mapped. The west block 46594818 (5 levels, `height=33`, concrete, on the mall's west edge and in no other outline) is modelled at its mapped height as part of the podium. Tower tier splits (90/150/181) are the mapped `min_height`/`height` values. Facade bay/floor modules, the SUNTEC sign placement (Tower Two's north crown, as photographed from the west/north), fountain ring height (13.8 m published) and basin radius (23 m from the published area) are documented estimates; the ring centre and leg feet are recovered from the mapped leg parts.

## Modelling contract

- Towers built tier by tier on their mapped rings in warm grey aluminium with a dense small-window grid (punched facade), flat roofs, SUNTEC crown sign.
- Mall as its mapped curved podium rings at 20 m with a glass band and roof deck; the fountain court between the mall rings stays open — no full-site slab.
- Convention centre as the 28 m block with a stone/glass facade and every mapped roof pyramid rebuilt as a small white loft.
- Fountain of Wealth: dark basin disc, four slanted legs (beams) from the mapped feet, bronze ring at 13.8 m; the court around it stays walkable/drivable (no ground-to-roof collider under the ring).
- Collision: ground masses automatic; explicit prisms for tower tiers above the podium, pyramids' roof block, fountain ring. Finite, zero flicker, < 65,000 triangles, ≤ 16 batches. The complex spans ~450 m, so the generic "within 200 m of anchor" loop in `landmark-models.test.cjs` does not apply; dedicated tests cover placement from independently located lon/lat probes.

## Verification — 2026-11-03

- New `tests/landmark-suntec-city.test.cjs` (3 tests) first failed on the absent model, then passed: exactly the 100 mapped Suntec ways replaced (Conrad Centennial and the southern hotels untouched); Towers One/Three at 181 m and Tower Five at 72 m over independently located ring centroids; each tall tower in three tiers at the mapped 90/150 m steps; mall at 20 m, convention centre at 28 m with ≥ 70 rebuilt pyramids (71 built); SUNTEC crown sign; fountain ring collision at 13.8 m with open air beneath its centre and a clear roundabout; finite geometry, zero flicker. **2,073 triangles, 9 material batches.**
- Targeted guide suite plus the two new files and building-info: **99/99 pass**. Full Windows `node --test`: **512/520 pass**; the 8 failures are the documented platform fixtures (7 Overpass shell cases, 1 tile-worker), identical to the SG-034 baseline on the shared branch.
- Regenerated geodata vs `HEAD`: only `buildings` and `landmarks` keys change; landmarks 25 → 27 (this pair), mapped parts 302 → 410, trees identical.
- Rendered (headless Chrome, WebGL + WebGPU, Tiny + day) and compared with the 2024 street photograph, the Stamford aerial and the fountain aerial: beige punched-grid towers with the notch, white pyramid convention roof, curved podium and the bronze ring on slanted legs all read at map distance; the loaded city shows the complex in place with neighbours standing and no duplicate generic masses. Captures: [overview](images/suntec-city-overview.png), [Fountain of Wealth](images/suntec-city-fountain.png), [loaded city](images/suntec-city-city.png).

## Limitations

Tower tier ledges are flat caps (the real notch transitions are partly slanted); mall atria, entrances and the remodelling's wavy street facade are simplified to the mapped podium rings; the fountain has no animated water; interiors are not modelled. The SUNTEC sign is placed on Tower Two's north crown following the 2024 photograph. The complex stays `active` in the checklist until a PR is opened and the shared-branch acceptance criteria are met.
