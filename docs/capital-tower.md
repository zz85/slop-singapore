# Capital Tower model

Checklist **SG-062**. Program: `js/landmark-models/capital-tower.js`; tests: `tests/landmark-capital-tower.test.cjs`. Built on 3 November 2026 with the landmark kit and the city's normal/Tiny material pairing, replacing a placeholder that extruded the mapped parts.

Capital Tower, 168 Robinson Road, is a 52-storey office tower by RSP Architects Planners & Engineers for CapitaLand (originally the PosBank headquarters). It was completed in September 2000 and opened in May 2001; the China Club occupies its top floor and GIC is its anchor tenant. It stands between Robinson Road (south-east) and Cecil Street (north-west), with Capital Tower Plaza and the Tanjong Pagar MRT entrance in front of its south-west face and its car park against the north-east face.

## References and interpretation

- [Wikipedia](https://en.wikipedia.org/wiki/Capital_Tower_(Singapore)), read 3 November 2026: 254 m to the roof, 52 floors, RSP as architect, completed 2000, the China Club on the top floor, GIC as anchor tenant.
- [CTBUH Skyscraper Center](https://www.skyscrapercenter.com/building/capital-tower/824), read 3 November 2026: 255.4 m architectural and tip height, highest occupied floor 231.7 m, 52 floors above ground and 1 below, completed 2000.
- [CapitaLand's property page](https://www.capitaland.com/en/find-a-property/global-property-listing/office/capital-tower.html), read 3 November 2026: 254 m, 52 storeys, a "club fitness centre with swimming pool", 415 car park lots, direct connection to Tanjong Pagar MRT. Its six photographs are the main references for the present state:
  - *Capital-Tower-Facade-3*: a near-frontal evening view of the south-west face from the south-south-west with 79 Robinson Road (completed 2020) on the right. The tiers, the funnel, the ledges, the atrium and the crown were measured on it by the face's mapped 60 m width (about 10 px/m in the crown crop).
  - *Capital-Tower-Facade-1*: the same face by day, the CapitaLand name on the crown's band, 79 Robinson Road's Allianz sign in view.
  - *Capital-Tower-Hero*, *-Facade-2*, *-Facade-4*: the south-west face from the plaza (bays of blue glass in salmon and pale bands, the slot, the funnel's canopy, the curved glass entrance canopy, the bronze "CAPITAL TOWER" letters on the granite right of the entrance).
  - *Capital-Tower-Entrance-Koi-Pond*: palms in a koi pond before a pink granite wall and a glass walkway canopy.
- Wikimedia Commons, [Category:Capital Tower, Singapore](https://commons.wikimedia.org/wiki/Category:Capital_Tower,_Singapore):
  - [Capital Tower, Jan 06.JPG](https://commons.wikimedia.org/wiki/File:Capital_Tower,_Jan_06.JPG) (Sengkang, January 2006): from Maxwell Road, west-south-west. The north-west face's stone with punched windows and its slot, the south-west face's bay, the funnel, the plant storey, the tier's curve and slits, and the crown's band, blades and posts.
  - [Capital Tower 3.JPG](https://commons.wikimedia.org/wiki/File:Capital_Tower_3.JPG) (Terence Ong, August 2006): the same faces in clear daylight. Colours were sampled here.
  - [Capital Tower.jpg](https://commons.wikimedia.org/wiki/File:Capital_Tower.jpg) (Terence Ong, June 2006): the south-west face from below.
  - [Capital Tower, Singapore - 20100828.jpg](https://commons.wikimedia.org/wiki/File:Capital_Tower,_Singapore_-_20100828.jpg) (William Cho, 28 August 2010): the crown at close range (blades, posts, the band's openings).
  - [Singapore - Shenton Way IMG 9663.jpg](https://commons.wikimedia.org/wiki/File:Singapore_-_Shenton_Way_IMG_9663.jpg) (Bjoertvedt, 11 November 2018): the south-east face from Shenton Way, all stone with punched windows and a slot, the plant storey's vents, and a "J.P. Morgan" sign on the crown's band.
- J.P. Morgan left Capital Tower, its home since 2001, for levels 24–30 of CapitaSpring ([EdgeProp](https://www.edgeprop.sg/property-news/jp-morgan-be-anchor-tenant-former-golden-shoe-car-park-now-renamed-capitaspring); the office opened in 2023), so its sign is not modelled.
- The club on the car park's roof: [Fitness First Capital Tower](https://www.fitnessfirst.com/sg/en/clubs/capital-tower) and [Time Out](https://www.timeout.com/singapore/sport-and-fitness/capital-tower-sports-performance) (now Capital Tower Sports Performance) give its address as #09-01 with a heated pool and an outdoor climbing wall, i.e. the ninth level, the roof of the eight-storey block.
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) tiles at zoom 19 with the OSM outlines overlaid. The base is in the tower's shadow; the car park's roof is legible: a lap pool about 21 × 8 m along the grid with five round umbrellas on its far side, a light deck south-east of it, and a darker area to the north-west.
- OpenStreetMap streets (Overpass, 3 November 2026): Robinson Road 15 m off the south-east face, Cecil Street 21 m off the north-west face, the drop-off driveway (way 117044170) 11 m off the south-west face and Capital Tower Plaza (739516892) beyond it.

The reference photographs stay outside the repository.

### OpenStreetMap ways replaced (hide list unchanged)

| Way | Tags | Use |
| --- | --- | --- |
| [47345009](https://www.openstreetmap.org/way/47345009) | `building=yes`, 52 levels, no height; the outline of tower and car park | the test's outline |
| [510811294](https://www.openstreetmap.org/way/510811294) | "Capital Tower (4th)", 0–163 m, metal `#C4C6DC` | the shaft's plan; anchors the drawing |
| [510811295](https://www.openstreetmap.org/way/510811295) | "(3rd)", 163–190 m, glass `#567BA7`, the same ring | the plant storey and the glass boxes |
| [510811296](https://www.openstreetmap.org/way/510811296) | "(2nd)", 190–229 m, glass | the tier's top (50.7 × 33.1 m) |
| 510811279, 283, 287, 289, 290–293 | "(2nd)", 190–229 m, skillions sloping 39 m toward 212°, 32°, 302°, 122° | the tier's sloping faces (as lofts) |
| [510811297](https://www.openstreetmap.org/way/510811297) | "(1st)", 229–254 m, glass `#535057` | the crown's roof plan |
| 1566725293–96 | 229–254 m, skillions of 25 m | the crown's inward taper |
| [1558353295](https://www.openstreetmap.org/way/1558353295) | `building:part`, 8 levels, round the north-east bay | the car park and the club's deck |
| 1558353296, 1558353297 | `building:part`, 3 levels, in the corners beside the south-west bay | granite blocks filling the corner notches |

1558353295 is Capital Tower's own car park (415 lots per CapitaLand) with the club on its roof (#09-01), so it is rightly hidden and rebuilt here. The neighbours remain the city's: SBF Center (48948265 and its parts) north of the car park, Robinson 77 (47345028), 79 Robinson Road (45098519), the MRT entrances and the streets.

## Frame and drawing

The tower lies on the city grid. The program draws in metres with `u` toward Robinson Road (bearing 122°) and `v` toward the car park (32°), fixed by the mapped shaft ring's extremes, so the drawing is independent of the anchor. In it:

- the wings' rectangle (core and end wings) is u −30.1…30.0, v −25.3…17.0: 60.1 m along Robinson Road, 42.3 m across;
- the two bays span u −21.4…20.9 (42.3 m) and stand proud of it to v = −28.2 (south-west, 2.9 m) and v = 20.9 (north-east, 3.9 m);
- the re-entrant corners between bays and wings are 8.7–9.1 m by 2.9–3.9 m;
- the tier's top (way 510811296) is u −25.3…25.4, v −20.6…12.5;
- the car park wraps the north-east bay from v = 17 to 32.3–37.

The plan is 60 × 49 m, not square: the brief's "square plan with chamfered corners" is better read as a rectangle with notched corners. The photographs agree (the south-west face is about 60 m wide by its storey heights).

## Massing

| Mass | Heights (m) | Basis |
| --- | --- | --- |
| Granite plinth round the wings and the two corner blocks (ways 1558353296–97) | 0–12 | mapped 3 levels; photographs |
| Shaft: core and end wings in pale stone with punched windows; a 3.7 m slot of dark glass up the middle of each end face | 12–163 | mapped 163 m |
| South-west bay, outer flanks: granite to the lobby, salmon-banded glass to the ledge at 91 m, pale-banded glass above | 0–163 | photographs (Facade-3) |
| South-west bay, inner flanks (u ±3.5…11): the lobby (set back 1.2 m), the atrium's dark glass to its ledge, pale-banded glass above | 0–8, 8–31, 31–163 | estimated on Facade-3 |
| South-west slot: dark glass recessed 0.8 m, 7 m wide | 31–163 | Facade-3 |
| Funnel: a half cone of glass from radius 2.8 m to 7 m on the slot, under a half-round canopy of radius 8.6 m | 72–94.2, canopy 94.2–95.2 | estimated on Facade-3, Capital Tower 3, Jan 06 |
| Ledges across the south-west bay | 30.4–31.2 (atrium), 90.4–91.2 | Facade-3 |
| North-east bay: the same flanks and slot, without funnel, atrium or ledges | 0–163 | assumed by symmetry (no photograph of that face) |
| Cornice: 1.3 m proud of the whole plan over a bevelled soffit | 161.8–164.2 | Facade-3 |
| Plant storey: stone with dark vents on the wings' rectangle | 164.2–172.5 | Facade-3, Shenton Way 2018 |
| Glass boxes before both bays, with ledges 1.2 m proud | 164.2–189.6, ledge 189.8–190.8 | mapped 190 m; Facade-1, Facade-3 |
| Tier: blue glass in six lofts from the wings' rectangle to the mapped top, receding by 4.7–4.8 m on each side along a convex curve (inset ∝ t^2.2) | 172.5–228.6 | mapped 229 m; the curve fitted to Facade-3 (0.75 m in at 200 m, 2.3 m at 215 m, 4 m at 225 m) |
| Dark slits continuing the slots: 6 m wide over the boxes' ledges, 3.1 m wide on the end faces | 190.8–201.5, 172.5–204 | Facade-3, Jan 06, Capital Tower 3 |
| Upper cornice, its top bevelled up to the crown's band | 227.4–230.6 | Facade-3, Commons 2010 |
| Crown band: stone, plain toward plaza and car park with a dark vent near each end, narrow dark openings on the end faces | 229.6–235 | Facade-3, Commons 2010 |
| China Club glass, pale green, sloping in by 1 m | 235–252.4 | mapped skillions; Facade-3 |
| Five louvre blades round it, each 0.45 m narrower than the one below; 26 posts from the band to the roof | 236.6–249 | Facade-3, Commons 2010 |
| Roof slab and a low plant box | 252.4–254 | 254 m published and mapped |
| Car park (way 1558353295), stone with dark screens | 0–28 | mapped 8 levels; 28 m estimated |
| Club deck: lap pool 20 × 7 m with five umbrellas, sun deck, two planted beds with seven trees, a parapet | 28–33 | pool and umbrellas from the aerial; beds and trees estimated |
| Forecourt before the south-west face, palms in four granite planters, the curved glass entrance canopy on two posts | 0–9 | Facade-2, Facade-4, Hero |

Colours, from the daylight photographs (Capital Tower 3, Facade-1, Shenton Way 2018, Hero). Sampled brights and darks: stone `#c6bcad`–`#d6dada`; the tier's glass `#5e6974`–`#788996` on average with `#2c3c56`–`#526677` in its panes; salmon granite `#e4bea4` in sun. The OSM colours (`#C4C6DC` metal, `#567BA7`, `#535057`) were treated as a hint only.

| Element | Colour |
| --- | --- |
| Stone (wings, plant storey, crown band) | warm pale grey `#cdc7bc` |
| Glass (bays, boxes, tier) | blue `#587aa2` |
| Bays' spandrels | salmon granite `#c49d86` (low), silver `#c9ced3` (high) |
| Slots, funnel's frames, lobby | dark glass `#2e4766` in `#5f6e7e` mullions |
| Tier's mullions | `#a7b3be` |
| Cornices, ledges, canopies | `#d8d4cb` |
| Louvre blades and posts | `#e6e6e1` |
| China Club glass | pale green `#a6cab6` |
| Paving | pink granite `#cdb6a6` |

Signs, both hung with `kit.hang` on walls under their rooflines:

- "CapitaLand" in blue letters, 12.5 m wide and 2 m tall, on the crown band's south-west face 1 m under its top, as Facade-1 and Facade-3 show it.
- "CAPITAL TOWER" in bronze capitals 0.75 m tall on the granite right of the entrance, 4 m up, as Facade-4 shows it.

Collision:

- Every block off the ground (shaft pieces over the plinth, plant storey, glass boxes, each loft of the tier at its smaller top ring, crown band, glass, roof, funnel, ledges) has its own collision volume.
- The car park is filled with scanline strips.
- The entrance canopy collides as a slab 5.6–6 m up.
- Left open: the slot's recess, the corner notches over the plinth, the space under the canopy, the forecourt, and the pavements beyond the end walls.

![Capital Tower from the south in the Tiny look: the plaza face's stone wings and banded blue bays split by the dark slot, the funnel under its half-round canopy, the cornice at 163 m, the glass boxes and the tier curving in to the upper cornice, the crown's band with CapitaLand's name and the louvred China Club under the flat roof; the entrance canopy and palms at the foot](images/capital-tower-overview.png)

## Inspect and rebuild

```text
http://localhost:8031/tools/landmark-preview.html?model=capital-tower&view=all
http://localhost:8031/tools/landmark-preview.html?model=capital-tower&view=s&look=day
http://localhost:8031/tools/landmark-preview.html?model=capital-tower&view=w&focus=crown
http://localhost:8031/tools/landmark-preview.html?model=capital-tower&view=s&focus=base
http://localhost:8031/tools/landmark-preview.html?model=capital-tower&view=n&focus=podium
http://localhost:8031/?look=tiny&at=capital-tower&camera=map
```

```powershell
node --test tests/landmark-capital-tower.test.cjs
```

The hide list is unchanged, so the geodata needs no rebuild.

The tests check:

- the 20 replaced ways (the car park mapped with eight levels), and that SBF Center and Robinson 77 are not hidden;
- the 254 m height, standing on the ground, building in under 500 ms;
- every part within the mapped outline: ledges and cornices up to 1.5 m proud, the forecourt with its canopy and palms up to 6.5 m and the funnel's canopy up to 8 m out from the plaza face only;
- the shaft to 163 m under its cornice;
- the tier as six unbroken lofts from 60.1 × 42.3 m to the mapped 50.7 × 33.1 m, each face receding faster the higher it goes;
- a point 2 m inside the north-west wall inside the tier at 190–200 m and outside it above 216 m;
- five blades each narrower than the one below, the China Club's glass from band to roof, and the posts;
- the slot recessed and free to fly into;
- the funnel widening to more than twice its foot, under its canopy, and solid;
- the glass boxes and their ledges, with a slit over each;
- the corner notches open over the three-storey blocks, the space under the entrance canopy (on two posts) and the forecourt open, with colliders matching;
- the pool's water on the car park's deck at 28.35 m, the car park solid, the umbrellas;
- that every raised part rests on or in something under it, and that the crown's roof, posts, band and cornice connect;
- the two signs on south-west-facing walls standing behind them and under their tops, CapitaLand's on the crown's band at about 12 m wide;
- the budgets, finite geometry and no coplanar flicker;
- the tower solid from 1.5 to 253.5 m and no invisible walls beyond the end walls.

## Verification

- `node --test tests/landmark-capital-tower.test.cjs`: 9 of 9 pass; `node --test tests/landmark-models.test.cjs`: 39 of 39 pass.
- 2,682 triangles in 15 material batches (two of them signs), no coplanar flicker, built in about 14 ms in node.
- Rendered in the preview (headless Chrome, WebGL) in the Tiny and day looks: four views, the roof plan, the crown from the west and south, the base from the south, the car park's deck from the north, the tier from the west.
- Compared with:
  - Facade-3 (the plaza face frontally: tiers, funnel, ledges, crown band and sign);
  - the Maxwell Road photograph of January 2006 (the same direction as the preview's west view: end face and plaza face, the tier's curve, the crown);
  - the Commons 2010 crown close-up;
  - the aerial (pool, umbrellas, deck).
- Live city (WebGPU in Playwright, Tiny look, map view; 3 November 2026): seen from the plaza side, the banded bay, the slot and the blue tier stand among the Tanjong Pagar towers, with no console errors, no generic extrusion left on the site and the neighbours in place.

## Limitations

- The north-east face is mirrored from the south-west one (bay, flanks, slot, glass box) without a photograph of it; the car park hides its lower 28 m. It has no funnel, atrium or ledge here.
- CapitaLand's name is confirmed only on the owner's own photographs, taken after 2020 (79 Robinson Road complete). No independent photograph from 2024–2026 was found, nor any of the south-east or north-east crown faces today. It is drawn as blue text without the green swoosh under it (no logo was added).
- The car park's height (28 m for eight storeys), its façade and the deck's layout are estimates. The north-west half of the deck is dark on the aerial: it may be roofed club space, not the planted beds modelled here. The climbing wall is left out.
- The tier's shoulder is six straight lofts along a fitted curve. The real glass is smoothly curved.
- The slits are slivers 0.3 m proud of the glass; the real ones are recessed.
- The funnel and its canopy are sized from oblique and frontal photographs that disagree by a few metres. The lighter "keyhole" of glass under the funnel is simplified to the inner flanks' pale bands.
- The crown's diagonal tension rods, the maintenance crane on the roof and the louvres' fine slats are left out. The blades are solid slabs.
- The plaza beyond the driveway is the city's (Capital Tower Plaza, a pedestrian way): its fountain of coloured spheres, the MRT entrance's glass canopy, the walkway canopy and the koi pond with palms (whose position could not be fixed from the shadowed aerial) are not modelled.
