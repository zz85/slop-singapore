# The Sail @ Marina Bay model

Checklist **SG-044**. Program: `js/landmark-models/the-sail.js`; tests: `tests/landmark-the-sail.test.cjs`. Built on 3 November 2026 with the landmark kit and the city's normal/Tiny material pairing, replacing a placeholder that extruded the mapped parts.

The Sail @ Marina Bay, 2 & 6 Marina Boulevard, is a residential development of two towers on a shared podium: Marina Bay Tower (70 storeys, 245 m) on Marina Boulevard and Central Park Tower (63 storeys, 215 m) toward Central Boulevard and the park. NBBJ designed it (design principals Peter Pran and Timothy Johnson) with Team Design Architects for City Developments and AIG Global Real Estate. Dragages Singapore (Bouygues) built it; Meinhardt was the structural engineer. It was completed in 2008 (Central Park Tower's residents moved in first, in July 2008).

## References and interpretation

- [Wikipedia](https://en.wikipedia.org/wiki/The_Sail_@_Marina_Bay), read 3 November 2026: 245 m and 70 storeys for Marina Bay Tower, 215 m and 63 storeys for Central Park Tower; NBBJ and Team Design Architects; 1,111 flats on a 0.909 ha site; a glass façade; "sculpted to resemble a sail".
- [CTBUH Skyscraper Center](https://www.skyscrapercenter.com/building/the-sail-at-marina-bay/921), read 3 November 2026: 245 m to the architectural top and the tip, 70 floors, completed 2008; NBBJ with Team Design Architects; Meinhardt; Bouygues/Dragages. It does not list Central Park Tower separately.
- [ArchDaily, "Sail @ Marina Bay / NBBJ"](https://www.archdaily.com/63199/sail-marina-bay-nbbj): NBBJ's text ("two glass-clad towers of 63 and 70 storeys rise from a sculpted base … wind-blown sails"; landscape by Belt Collins) and 28 images, of which these were used:
  - the **ground floor plan** and **club level plan** (the towers' plans, the car-park podium with the bar and lounge, the drop-off plaza and water feature, Marina Boulevard, Marina View; on the club level two tennis courts, the main pool curving along the deck's edge, the lap pool, the aqua-gym pool, the BBQ and play area, the bridge to Tower 1);
  - **Section Tower 1** and **Section Tower 2**, with key plans (the roofs, the tip, the curving leading edges, the podium's parking levels and its 26 m deck, the sky-level public floors);
  - the **typical floor plans** of both towers;
  - photographs: the towers at dusk from the bay lawn, Central Park Tower's crown from Marina Bay Tower (glass leaf over an open frame, the pale leaf's white panels and louvres, its roof terrace), the deck from above (pools, courts, palms, white shades), the block of flats under its white wing, the base on Marina View Link (an angular glass prow, the orange link to the MRT), the car park's grey louvres over shops.
- Wikimedia Commons, [category The Sail @ Marina Bay](https://commons.wikimedia.org/wiki/Category:The_Sail_@_Marina_Bay):
  - [The Sail @ Marina Bay, Singapore - 20121031.jpg](https://commons.wikimedia.org/wiki/File:The_Sail_@_Marina_Bay,_Singapore_-_20121031.jpg) (Nicolas Lannuzel, 31 October 2012, CC BY-SA 2.0), taken in morning sun from the lawn 180 m east-north-east (its coordinates): both towers, the tip, the seam and boom, the pale leaf's white fins. Colours were sampled from it.
  - [Singapore The Sail@Marina Bay 2.jpg](https://commons.wikimedia.org/wiki/File:Singapore_The_Sail@Marina_Bay_2.jpg) (Zairon, 4 November 2015, CC BY-SA 4.0) and its neighbours 1 and 3: from across the bay to the north-east and from the Merlion, with the open lattice in the tips.
  - [Singapore Central Business District viewed from Marina Bay Sands 1.jpg](https://commons.wikimedia.org/wiki/File:Singapore_Central_Business_District_viewed_from_Marina_Bay_Sands_1.jpg) (Zairon, 3 November 2015, CC BY-SA 4.0): both towers from 200 m up to the east-north-east, the gap between them, the planted deck between them, the tip's fall to the seam. Proportions were measured in it.
  - The Sail @ Marina Bay, Singapore - 20121112.jpg and Singapore Marina Bay viewed from Marina Bay Sands 1.jpg, for comparison.
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) tiles at zoom 19 with the OSM outlines overlaid. The imagery is oblique (One Raffles Quay's roof sits about 75 m east-south-east of its base) and the towers are mostly in shadow, so it confirms the podium and plaza only.

The reference photographs stay outside the repository.

### OpenStreetMap ways replaced (hide list unchanged)

| Way | Tags | Use |
| --- | --- | --- |
| [325793771](https://www.openstreetmap.org/way/325793771) | Marina Bay Tower, 70 levels, 245 m | the bay tower's plan |
| [325793747](https://www.openstreetmap.org/way/325793747) | Central Park Tower, 63 levels, 215 m | the park tower's plan |
| [47345007](https://www.openstreetmap.org/way/47345007) | 10 levels, 25 m | the car-park podium, and its 3.4 m neck to Marina Bay Tower: the bridge |
| [1201220123](https://www.openstreetmap.org/way/1201220123) | `building=apartments`, "The Sail", three nodes inside Marina Bay Tower | nothing (a sliver) |

Marina Bay Suites (393092728) and its podium (1035284763) next door remain the city's.

## Frame and drawing

The city's grid (bearing 31.8°) is NBBJ's drawing grid: Marina Bay Tower's straight south-west wall runs exactly along it and Central Park Tower stands square to it. The program draws in metres with `u` along the grid toward Marina View (bearing 121.8°, the city's x) and `v` across it toward the park (the city's z). Tower shapes come from the mapped rings; places on the podium and plaza (courts, pools, plaza outline) are written in metres about Marina Bay Tower's mapped east-south-east point, so they follow the rings rather than the anchor.

NBBJ's club-level plan, rotated by its north arrow (page right = bearing 31.8°) and scaled so that Tower 1 matches the mapped Marina Bay Tower (8.45 px/m), fits that tower within 2–3 m. Its Tower 2 sits about 10 m north-north-east of the mapped Central Park Tower, and its narrow end points the other way (north-north-east in the plan, south-south-west in OSM). The photograph from Marina Bay Sands shows a gap of about 5 m between the towers' facing edges, which agrees with the mapped positions and not with the plan's. The mapped ring is therefore used as it stands (see Limitations).

### Leaves, seams and leading edges

Each tower is two leaves meeting at a pale vertical seam, as the photographs show from every side:

- **Marina Bay Tower**: a crescent 76 × 25 m. Its convex face is to the bay, its straight wall to the plaza. The glass leaf is the east-south-east 44 % of its length (the seam is at the core's edge in NBBJ's plan and section). The pale leaf is the rest, toward Marina View Link. The glass leaf's leading (east-south-east) end bows out like a full sail. In Section Tower 1 the edge is about 5.6 m out at mid-height compared with the foot and about 1 m at the roof. The model holds the mapped end at 120 m, 5 m short at the foot and 3 m short at the roof, with quadratic curves between.
- **Central Park Tower**: a lens 44 × 24 m. The glass bow is the north-north-east 40 % of its length, facing Marina Bay Tower. The pale leaf is beyond the seam, toward the park. In Section Tower 2 the bow's leading edge is straight up to about 110 m and then curves back 10 m to the top of its glass at 203 m.

The glass leaves are lofted in bands (6 m apart where the edge moves) from rings deformed along the tower's length about the seam. The kit lays a façade pattern along a ring from its first point, so each glass leaf is lofted as two halves (one per long face), each ring starting at the fixed seam. That keeps the mullions over each other from band to band. They drift only toward the moving edge, as real panels follow their floor plates.

## Massing

| Mass | Heights (m) | Basis |
| --- | --- | --- |
| Marina Bay Tower, glass leaf: blue-grey glass in thin light frames, the leading edge bowed | 0–229 | 245 m tip published; roof estimated from Section Tower 1 (tip triangle 16 m over the roof) |
| its tip: paler glass on a white frame, a pointed blade rising over the leading end, its top falling 16 m back to the roof over 26 m, its sides leaning in from the bay face and the inner roof | 229–245 | published 245 m; Section Tower 1 (both elevations); Zairon's and Lannuzel's photographs |
| Marina Bay Tower, pale leaf: white panels and fins between grey-blue windows | 0–227 at the seam, 223 at its far end | Section Tower 1 (its roof 228 → 222 m) |
| the seam: a white mast 2.6 m wide on the bay face | 0–227.5 | photographs |
| the boom: a white bar 20 m long across the seam | 192 | scaled in three photographs (188–197 m) |
| Central Park Tower, glass bow, receding above 110 m | 0–203 | Section Tower 2 |
| its crown: paler glass on a frame, sloping up from the bow's top to a level ridge over the seam | 203–215 | published 215 m; Section Tower 2; the photographs from the bay (a lattice face seen head-on) and from the Merlion side |
| Central Park Tower, pale leaf, its roof rising toward the bow | 0–199 at its far end, 209 at the seam | Section Tower 2 (roof 202 → 213 m) |
| lobbies: dark glass at the foot of every leaf | 0–9 | estimated |
| skylight under Marina Bay Tower's overhanging leading edge, on two white posts | 7–7.4 | ground floor plan (skylights) |
| glass canopy along Marina Boulevard under the pale leaf, 3.5 m deep, on posts | 6–6.35 | ground floor plan (landscaped walk); photographs |
| podium: shopfronts, then grey louvres over the car park; the flats' white balconies on its south corner | 0–5, 5–25 | mapped 25 m; NBBJ's sections give 26 m |
| bridge from the deck to Marina Bay Tower: slab, glass room, white roof, over an open drive | 24.3–28.4 | the mapped neck; club level plan |
| the flats' white wing over their terrace, on posts from the deck | 30.4–33.2 | estimated from ArchDaily's photograph |

Heights are published (245 m, 215 m), mapped (25 m podium) or estimated from NBBJ's sections. Each section was scaled by its tower's published height: Section Tower 1 at 4.43 px/m and Section Tower 2 at 4.46 px/m. Storeys check out: 70 storeys at about 3.2 m up to the 229 m roof, over a 9 m lobby, and 63 storeys under Central Park Tower's 203–209 m roofs. The sky-level public floors (about 140 m in Marina Bay Tower, 110 m in Central Park Tower) are inside and not shown.

## Ground and podium

- **Club deck at 25 m**, on the podium's paved top:
  - two tennis courts, green in a red surround;
  - the main pool curving along the edge over the plaza;
  - the lap pool beside Central Park Tower;
  - the small aqua-gym pool on the flats;
  - planters round the edge, 19 palms and white shades on posts.
- **Plaza**: the drop-off and drive between the towers and the podium's curved edge, paved at 0.32 m over the city's lawn. It runs under the bridge, past a water feature, and between the towers toward Marina View, with two trees in the gap. It stays open to the sky.
- **Collision**:
  - Each leaf is filled to its roof, within its narrowest plan: the bay tower's glass leaf at its foot, the park tower's bow at its foot below 110 m and at its top above.
  - The podium is filled to the deck.
  - The bridge, the tip's lower part, the crown's lower part, the canopy, the skylight and the wing are solid.
  - The drive under the bridge, the plaza, the gap between the towers and the space under the overhanging leading edge stay free.

Colours, from the daylight photographs (Lannuzel 2012, Zairon 2015, NBBJ/ArchDaily). Sampled averages are glass leaf `#728893`–`#7b909a` and pale leaf `#889193`–`#8a9394` in morning sun, glass and frames together; the Tiny look lifts them toward the sky.

| Element | Colour |
| --- | --- |
| Glass leaves | `#82a3b3` panes between `#cfd7d9` frames (strips, 1.5 m bays, 3.2 m storeys) |
| Pale leaves | `#dfe3e2` panels and fins with `#6b818b` windows (strips, 1.6 m bays) |
| Tip and crown | `#87a3ae` glass on a `#e2e7e8` frame |
| Lobbies, shopfronts, bridge | `#3d525a` glass in `#9aa6a8` frames |
| Podium louvres | `#959da0` with `#5d676c` gaps |
| Flats | `#e0e3e2` with `#6f8892` windows |
| Seam, boom, wing, posts | `#eceeec` |
| Courts | `#a8483d` surround, `#5f8f4e` courts and planting |
| Pools | `#4fa3c9` |

No signs: the towers carry none. The small "THE SAIL" lettering on the glass prow at the street and the bar's sign under the car park are too small for the map and are left out.

![The Sail from the east in the Tiny look: Central Park Tower (left) with its pale leaf rising to the glass bow that curves back under its crown, Marina Bay Tower (right) with its glass leaf bowing up to the pointed tip, the white seam and boom, the club deck between them](images/the-sail-overview.png)

## Inspect and rebuild

```text
http://localhost:8031/tools/landmark-preview.html?model=the-sail&view=all
http://localhost:8031/tools/landmark-preview.html?model=the-sail&view=e
http://localhost:8031/tools/landmark-preview.html?model=the-sail&view=n&focus=crown
http://localhost:8031/tools/landmark-preview.html?model=the-sail&view=w&focus=base
http://localhost:8031/tools/landmark-preview.html?model=the-sail&view=ne&look=day
http://localhost:8031/?look=tiny&at=the-sail&camera=map
```

Part names group for `focus`: `bay-` (Marina Bay Tower), `park-` (Central Park Tower), `crown-` (the tip and the crown), `base-` (podium, bridge, deck, wing, plaza).

```powershell
node --test tests/landmark-the-sail.test.cjs
```

The hide list is unchanged, so the geodata needs no rebuild.

The tests check:

- the four replaced ways, and that Marina Bay Suites and its podium are not hidden;
- the 245 m height, standing on the ground, the towers and podium within 1.5 m of the mapped outline and everything within 4 m of it (the canopy and the boom reach past the mapped faces), and building in under 500 ms;
- each tower as a glass leaf and a pale leaf of different materials (the same two on both towers);
- the glass leaf's roof at 229 m, the pale leaves' roofs lower;
- the seam from the ground to the pale roof, and the boom at about 192 m resting on it;
- Marina Bay Tower's leading edge 4 m further out at 120 m than at the foot and 2 m further than at the roof;
- under the overhang just inside the mapped end: open and free to walk below the skylight at 7 m, the leaf over it at mid-height, clear again near the top;
- the tip from 229 to 245 m reaching the leading edge;
- Central Park Tower's bow full at 100 m and curved back from its mapped end above 150 m (open and free to fly there);
- the crown from 203 m to its 215 m ridge on the seam, the pale roof lower;
- the plaza, the gap between the towers and the plaza edge open to the sky, free of colliders and paved above the lawn;
- the drive under the bridge open, the bridge solid at 24–28 m;
- the courts on the deck at 25 m, the podium solid;
- three pools, two courts and the palms;
- every raised part resting on something, the bridge on the podium and the tower, the wing on posts from the deck;
- triangles and batches within budget, finite geometry, no flicker, no signs, both towers on the map at their heights.

## Verification

- `node --test tests/landmark-the-sail.test.cjs`: 8 of 8 pass. `tests/landmark-models.test.cjs` passes for the-sail.
- 7,113 triangles in 13 material batches, no coplanar flicker, 380 colliders, built in about 25 ms in node.
- Rendered in the preview in the Tiny and day looks: four views, east and north elevations, the crown from the north and east, the base from the west, the plaza from the east, the roof plan. Compared with:
  - the Esplanade and Merlion photographs (north): the glass leaf's bowed edge rising into the tip, the roofline falling to the seam, the flat pale leaf;
  - the bay and lawn photographs (east-north-east): both sails side by side, the park tower's bow curving back under its crown, the seam and boom;
  - the Marina Bay Sands photograph (the gap and the deck);
  - NBBJ's plans and sections.
- In the live city (Tiny look), Marina Bay Tower shows its seam and boom over the plaza, with no generic extrusion left on the site. The coordinator checks the city view.

## Limitations

- Central Park Tower's mapped ring is kept although NBBJ's club-level plan draws Tower 2 about 10 m further north-north-east with its narrow end at the other end. The gap seen from Marina Bay Sands supports the mapped position. Its shape (wide north-north-east end) is unconfirmed.
- The leading edges' bow and recession, the seams' positions and the roofs are scaled from NBBJ's competition-era sections and from photographs, not surveyed. Banding of the lofted glass shows faintly in the day look near the moving edges.
- The kit has no see-through glass, so the tip's and crown's open frames are opaque solids in a pale glass-and-frame pattern.
- The pale leaves' roof terraces, the sloping glass screen on Central Park Tower's roof and the rooftop cranes are left out. Central Park Tower's pale roof is one sloped plane.
- Left out at the base: the glass prow on Marina View Link, the orange link to the MRT and the sky-level public floors. The deck's layout follows the club plan loosely, fitted to the mapped rings.
