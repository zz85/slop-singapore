# SGX Centre model

Checklist **SG-063**. Program: `js/landmark-models/sgx-centre.js`; tests: `tests/landmark-sgx-centre.test.cjs`. Built on 4 November 2026 with the landmark kit and the city's normal/Tiny material pairing, replacing a placeholder that extruded the mapped parts.

SGX Centre is a pair of office towers on Shenton Way: SGX Centre One (2 Shenton Way, completed 2000) at the north-north-east end toward Lau Pa Sat, and SGX Centre Two (4 Shenton Way, completed 2001) toward McCallum Street. They share a three-storey podium on a long, narrow site between Shenton Way (east-south-east) and Boon Tat Link (west-north-west). They were built as the Unity Towers and renamed when the Singapore Exchange moved in. Kohn Pedersen Fox designed them with Architects 61; Oscar Faber was the structural engineer, Parsons Brinckerhoff the MEP engineer, Permasteelisa the cladding contractor and Heintges the façade consultant. The towers are mirror images of each other about the middle of the podium.

## References and interpretation

- [Wikipedia](https://en.wikipedia.org/wiki/SGX_Centre), read 4 November 2026: 30 floors each, "antenna spire" 187 m, roof 172 m; KPF and Architects 61; completed 2000 and 2001; the towers "arc slightly" toward Marina Bay; vertical and horizontal fins on different sides (after URA); a colonnaded first storey and a glass-curtained lobby.
- [CTBUH Skyscraper Center](https://www.skyscrapercenter.com/complex/641) and [SGX Centre 1](https://www.skyscrapercenter.com/building/sgx-centre-1/2151), read 4 November 2026: 187.3 m architectural and to tip, 29 floors above ground, both towers alike; the consultants above.
- Emporis, archived by the Wayback Machine: [the complex](http://web.archive.org/web/20150404191624/http://www.emporis.com/complex/102231/singapore-exchange-centre-singapore-singapore) (4 April 2015: "Unity Towers", two towers of 615 ft and 29 floors) and [SGX Centre One](http://web.archive.org/web/2015/http://www.emporis.com/buildings/106459/sgx-centre-one-singapore-singapore) (2015: architectural height 614.50 ft = 187.3 m, **roof 566.99 ft = 172.8 m**, 29 floors).
- Singapore Land Group's page for SGX Centre 2 ([singaporeland.com](https://singaporeland.com/portfolio/sgx-centre-two/), read through its mirror on 4 November 2026): 270,000 sq ft lettable, 349 car park lots for both towers, KPF, Green Mark Platinum; the lobbies were recently refurbished (interior only).
- Photographs (they show the same towers; the exterior is unchanged since 2001 apart from signs):
  - [SGX Centre Two.JPG](https://commons.wikimedia.org/wiki/File:SGX_Centre_Two.JPG) (Terence Ong, 2 September 2006, CC BY 2.5): SGX Centre Two's inner face from Shenton Way by the podium. It shows the stone frame round a bay of glass with white sunshade blades every two storeys, the wide stone pier beside it, and the curved Shenton Way face with vertical fins under the roof's edge. Over the inner end it shows the stone portal with its opening, the AVIVA sign and the lattice mast. This is the **principal elevation** of the crown.
  - [Shenton Way Skyscrapers.JPG](https://commons.wikimedia.org/wiki/File:Shenton_Way_Skyscrapers.JPG) (Terence Ong, September 2006, CC BY 2.5): both towers from the south-east across Shenton Way, as silhouettes against the evening sky. The mirror-image twins: each roof falls in a straight slope from the portal at its inner end to its outer end, over a recessed band; the portals rise above the roofs with masts on top. This is the **side view** used for the heights.
  - [SGX Centre, Singapore - 20121015.jpg](https://commons.wikimedia.org/wiki/File:SGX_Centre,_Singapore_-_20121015.jpg) (Nicolas Lannuzel, 15 October 2012, CC BY-SA 2.0): SGX Centre One from Raffles Quay, north-east, in morning sun. It shows the outer face's glass with white mullions and a white band every two storeys, the curved face beside it, the dark roof slab overhanging both, and the stone strip at the notched corner. Behind it rises SGX Centre One's own portal with its antennas. Beyond, SGX Centre Two's portal shows the AVIVA sign over the opening, the lattice mast up its left post, and through the opening the top storeys, the roof's dark edge and the sky. Colours were sampled here.
  - Timothy Tye's photographs on [Penang Travel Tips](https://penang-traveltips.com/singapore/sgx-centre.htm):
    - SGX Centre Two from McCallum Street (2011): the Boon Tat Link face's stone frame, the bay with its blades, the wide stone band at the outer end, the notch and the outer face.
    - SGX Centre One from Lau Pa Sat, north-north-east (2017): the outer face end-on, the roof slab, and the portal standing over the far end.
    - SGX Centre One's north corner over the colonnade, with "SGX CENTRE 1" on the fascia and the black SGX letters on the lawn (27 July 2017).
    - The SGX letters with SO/ Sofitel across Boon Tat Link (27 July 2017).
  - Shenton Way photographs of 2022 and 2026 on Commons were checked. They do not show the towers' crowns clearly. No photograph of the crowns later than 2017 was found.
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) tiles at zoom 19 with the OSM outlines overlaid (the **roof/site** reference). The towers lean about 30–40 m east-south-east in it. Both roofs are visible:
  - each is pale with a grid of about 3 × 6 dark square wells, its Shenton Way side curved;
  - at the north end of the site, over the forecourt, a low grey roof with a light strip, and a tree at its east corner.
- OpenStreetMap streets: Shenton Way about 16 m off the east-south-east side, Boon Tat Link (a lane) about 6 m off the west-north-west side, Robinson Road beyond it; Boon Tat Street / Raffles Quay at the north end, McCallum Street and Maxwell Link at the south end.

The reference photographs and the aerial stay outside the repository.

### Heights

**187.3 m is CTBUH's architectural height, to the top of the stone portals** (Emporis gives the same); `info.height` is 187. **The masts, about 196.5 m at their tips, are this model's estimate from photographs**, not a published figure: CTBUH counts them as antennas, outside its height.

The published figures agree once they are read as two different points: 172.8 m (Emporis' roof) and 187.3 m (CTBUH and Emporis, architectural and tip). In Ong's 2006 skyline photograph, the roof's high end and the portals' tops stand in the ratio 172.8 : 187.3. The image is level (its verticals are parallel), so points at one depth scale linearly. In the same photograph, the roof's low end is at 0.88 of the high end, about 152 m, or about 154 m once the outer end's greater distance is allowed for. Lannuzel's photograph puts the outer face's roof at 146–152 m by its storey bands, so the model uses **153 m**. The masts' tips are 8–10 m above the portals in three photographs (Ong 2006, Lannuzel 2012, Tye 2017); the model takes 9.2 m (196.5 m). The 29 storeys over a 13 m colonnade come to about 4.6 m floor to floor, and the faint bands across the glass mark every second floor (about 9.2 m apart, which matches the photographs). Wikipedia's 30 floors and its "187 m spire" are taken as a count including the podium and a label for the portal's top.

### OpenStreetMap ways replaced (hide list unchanged)

| Way | Tags | Use |
| --- | --- | --- |
| [47345025](https://www.openstreetmap.org/way/47345025) | "Unity Tower One", alt_name SGX Centre One, 2 Shenton Way; 30 levels from level 3; 187 m; metal `#d3d7dc` | SGX Centre One's plan |
| [47345024](https://www.openstreetmap.org/way/47345024) | "Unity Tower Two", alt_name SGX Centre Two, 4 Shenton Way; the same tags; `#c9d2d9` | SGX Centre Two's plan |
| [45098518](https://www.openstreetmap.org/way/45098518) | "SGX Centre", 3 levels, stone `#9a9a94`, layer 1; the whole site, 30 × 188 m | the podium, the forecourts, the paving; the test's outline |

Nothing else is mapped inside the site. The neighbours remain the city's:

- Robinson Point (47345018 and its pyramid 172915351);
- The Ogilvy Centre, now SO/ Sofitel (47345019);
- Robinson Centre (47345026 and parts);
- the Afro-Asia Building (45098517);
- One Shenton (47345021, 325793774, 325793778);
- Shenton House (611285861);
- Lau Pa Sat (45098520).

The hide list registered for the model (`[45098518, 47345025, 47345024]`) is right; there is nothing to add or remove.

## Frame and drawing

The site lies on the city grid (bearing 31.8°): its long sides run exactly along it. The program draws in metres with `u` toward Shenton Way (bearing 121.8°, the city's x here) and `v` along the site toward McCallum Street (211.8°, the city's z). Each tower is drawn in its own frame, read off its mapped ring:

- `b` across the site (= u);
- `a` along it from the tower's inner end (the face toward the other tower) to its outer end.

SGX Centre One's `a` runs north-north-east and SGX Centre Two's south-south-west, so the same program draws both mirror images. Read off the rings (One / Two):

| Feature | SGX Centre One | SGX Centre Two | Basis |
| --- | --- | --- | --- |
| Boon Tat Link wall `bW`, Shenton Way wall `bE` (width) | −14.2, 15.6 (29.8 m) | −13.8, 16.1 (29.9 m) | mapped |
| Length from the inner end to the outer face `aOut` | 47.9 m | 46.5 m | mapped |
| Stone pier at the inner end of the Boon Tat Link side: from `bW` to `bP`, standing `aIn2` proud of the inner face | to −3.6, 4.8 m | to −5.9, 3.0 m | mapped |
| Shenton Way wall straight to `aArc`, then curving back to `bOut` on the outer face (a parabola fitted through the mapped mid-point) | 19.1 m → 9.4 | 16.1 m → 10.9 | mapped |
| Notch at the outer Boon Tat Link corner: to `bN`, from `aN` | −10.4, from 41.9 m | −9.3, from 40.4 m | mapped |
| Gap between the towers' inner faces | 74 m between the portals' faces | | mapped |

The photographs confirm the plan:

- the curved face toward Shenton Way and its turn into the outer face (Lannuzel, Tye 2017);
- the pier standing proud of the inner face (Ong 2006);
- the notch, with glass on its faces, next to a wide stone band (Tye 2011);
- the roofs' curved Shenton Way side on the aerial.

## Massing

| Mass | Heights (m) | Basis |
| --- | --- | --- |
| Colonnade: the lobby's dark glass set back 3.5 m from the glass faces behind ten round columns | 0–12.6 | Wikipedia (colonnade), Tye 2017; height estimated (three levels, OSM `min_level` 3) |
| Stone fascia over it ("SGX CENTRE 1" on One's outer face) | 12.6–14.4 | Tye 2017 |
| Office floors: the Shenton Way face, its curve, the outer face and the notch in pale silvery glass between close white vertical fins, crossed only by a thin soft band every two storeys; the Boon Tat Link wall and the inner face in bays of bluer, darker glass | 14.4 to 4.6 below the roof line | photographs; 29 storeys |
| Recessed top storey: dark glass behind posts, set back 1.2 m | under the roof slab | Ong 2006 skyline, Lannuzel 2012 |
| Roof slab: 0.9 m thick, overhanging the glass faces and the notch by 2.4 m, its top falling in a straight slope from 172.8 m at the back of the portal to 153 m over the outer face; dark fascia 1.7 m deep along its free edges; pale on top with a grid of dark wells | 151–173.7 | Emporis 172.8 m; low end estimated (see Heights); overhang and fascia estimated; the aerial |
| Stone band along the top of the Boon Tat Link wall, 1.5 m over the roof line, sloping with it | roof − 9.5 to roof + 1.5 | Tye 2011 |
| Wide stone band at the outer end of the Boon Tat Link wall, 5 m, next to the notch | 0 to roof + 1.5 | Tye 2011, Lannuzel 2012 |
| Stone pier at the inner end of the Boon Tat Link side, 0.3 m proud | 0–177 | mapped plan; its top at the opening's top level in Ong 2006 |
| Sunshade blades: 1.5 m deep, 0.35 m thick, every 9.2 m from 22 m. On the Boon Tat Link wall they run from the pier to the stone band, shortening under the sloping top band. On the inner face they run from the pier to the corner post, up to the portal | 22–160 | Ong 2006, Tye 2011, Lannuzel 2012 |
| Corner post of the inner face toward Shenton Way: stone, 3.9 m wide, the portal's south-east post | 0–187.3 | Ong 2006, Lannuzel 2012 |
| Portal over the inner face: a stone frame from the top of the bay to the top, its north-west post, and a lintel 9.5 m deep. The opening, 13.4 m wide and 16.3 m tall, shows the top storeys, the roof slab's edge and the sky over it | 161.5–187.3; opening 161.5–177.8 | 187.3 m published; proportions measured on Lannuzel 2012 (the portal at 27.9 px/m) and Tye 2017 |
| Lattice mast: two legs and rungs up the corner post's face, from the portal's foot to 9.2 m over its top | 161.5–196.5 | Lannuzel 2012, Tye 2017, Ong 2006 skyline |
| Podium between the towers: stone with punched windows over a colonnade on Shenton Way (shopfronts set back 3 m behind square columns), a flat roof | 0–5.5, 5.5–16 | mapped 3 levels; Ong 2006 (stone and windows); 16 m estimated |
| North forecourt: a drop-off canopy on four round columns with a skylight strip over the Boon Tat Link two-thirds; a raised lawn in a stone kerb with the SGX letters and a tree toward Raffles Quay | 0–9.15; lawn 0.9 | Tye 2017, the aerial; sizes estimated |
| South forecourt: paving, two planters with trees along Shenton Way | 0–0.8 | estimated (no photograph) |
| Paving over the whole site at 0.32 m | 0–0.32 | above the city's lawn |

## Palette

Colours, from the daylight photographs (Lannuzel 2012 in morning sun, Tye 2011 in midday sun; Ong 2006 for the shaded faces). Sampled brights and darks:

- the stone `#d3cec6` in sun, lighter on the sunlit portal in Lannuzel 2012;
- the outer face's glass `#4e646b`–`#5b6f75`, its mullions and bands `#a8b3b4`–`#d0d5d5`;
- the bay glass `#455d74`–`#8b9eb0` with reflections;
- the roof slab's underside `#333b43`.

The kit's glossy panes come out darker in the day look and lighter in the Tiny look (their windows blended 30 % toward the sky). The Shenton Way face's panes are therefore set well above the darkest samples, to a pale blue-grey. They read silvery blue-grey in the day look, close to Lannuzel's sampled average, and pale grey-blue in the Tiny look without going pastel. The close white fins (34 % of the face) carry the face's rhythm. The two-storey bands are thin soft-grey beams, lighter than the fins, as in the photographs. The stone faces' bays stay bluer and darker. The stone was lifted toward the sunlit samples. The OSM colours (`#d3d7dc`, `#c9d2d9`, `#9a9a94`) were taken as a hint only.

| Element | Colour |
| --- | --- |
| Stone (frames, bands, pier, portal, fascia, podium) | warm pale grey `#d6d1c7` |
| Glass faces toward Shenton Way and the outer ends | pale blue-grey `#a2b9c6` panes between `#dde0de` fins (strips, 1.2 m bays, fins 0.4 m; no horizontal lines in the pattern) |
| Their two-storey bands | `#d0d6d9` beams 0.45 m deep every 9.2 m (the blades' levels) |
| Bays in the stone faces | `#6d8aa2` panes in `#9aa9b3` mullions and transoms (strips, 1.6 × 2.3 m) |
| Sunshade blades, columns, mast, canopy | `#e4e5e2` |
| Recessed top storey | `#2b3338` glass behind `#9aa1a5` posts |
| Roof slab and fascia | `#3b4147`; top `#d2d2cc` with `#7a8287` wells |
| Lobbies and shopfronts | `#2c3a43` glass in `#7e878c` frames |
| Podium windows | `#41545f` |
| Paving / lawn | `#c6c0b6` / `#4f7d3a` |

## Signs

Only those seen on the photographs at street level are modelled:

- "SGX CENTRE 1" in grey capitals 1 m tall on SGX Centre One's fascia over the colonnade, on its outer face, hung with `kit.hang` (Tye 2017 shows it at the north corner).
- The black "SGX" letters, 2.8 m tall, standing on the raised lawn of the north forecourt, facing Raffles Quay (Tye 2017).

Both are drawn as text, without a logo (the SGX mark was not added to `js/landmark-logos.js`). No SGX mark was found on the towers or the podium.

The **AVIVA** sign on SGX Centre Two's lintel in the 2006 and 2012 photographs is left out. Aviva's Singapore business became part of Singlife in 2020, and no photograph of the crowns after 2017 was found to show what, if anything, hangs there today. Both portals are drawn plain.

## Collision

- The lobbies, columns, piers, corner posts, stone bands and podium shopfronts stand on the ground and collide by themselves.
- The office floors are filled from the fascia to under the roof slab, in 6 m bands along each tower that step down with the roof.
- Each slice of the roof slab, the portal's north-west post and lintel, every sunshade blade, the podium's upper storeys and the drop-off canopy have their own collision volumes.
- Left open:
  - the colonnades under the glass faces and along Shenton Way under the podium;
  - the gap between the towers over the podium's roof;
  - the space outside the curved faces and in the notches;
  - the portals' openings above the top storeys;
  - the drive under the drop-off canopy.

![SGX Centre in the Tiny look: the twin towers from the north-east, the east (Shenton Way) and the west (Boon Tat Link), and the roof plan. The Shenton Way faces are pale-finned glass curving back toward the outer ends under roofs sloping down from the stone portals over the inner ends. The stone-framed bays carry white sunshade blades, and the podium between the towers has its colonnade](images/sgx-centre-overview.png)

## Inspect and rebuild

```text
http://localhost:8014/tools/landmark-preview.html?model=sgx-centre&view=all
http://localhost:8014/tools/landmark-preview.html?model=sgx-centre&view=e&look=day
http://localhost:8014/tools/landmark-preview.html?model=sgx-centre&view=w
http://localhost:8014/tools/landmark-preview.html?model=sgx-centre&view=n&focus=one
http://localhost:8014/tools/landmark-preview.html?model=sgx-centre&view=ne&focus=base
http://localhost:8014/?look=tiny&at=sgx-centre&camera=map
```

Part names group for `focus`: `one-` (SGX Centre One), `two-` (SGX Centre Two), `base-` (paving, podium, forecourts, canopy, lawn).

```powershell
node --test tests/landmark-sgx-centre.test.cjs
```

The hide list is unchanged, so the geodata needs no rebuild.

The tests check:

- the three replaced ways, and that Robinson Point, The Ogilvy Centre, Robinson Centre and One Shenton are not hidden;
- building in under 500 ms, standing on the ground, and the portals' tops at 187.3 m with only the masts higher (under 198 m);
- the parts along Shenton Way within the mapped site, and across it within the roofs' overhang;
- each tower's body within its mapped ring.

The following are probed at points taken from the mapped rings (lon/lat):

- each roof near the inner end at 166–173.3 m, near the outer end at 150–158 m, lower in between; the slab on a recessed top storey on the office floors; the two towers alike; the slope drawn in at least 20 slices;
- each portal:
  - no stone in its opening from 162.5 to 177.3 m, with the top storeys behind it and the opening free to fly through above them;
  - a lintel at least 8 m deep, solid;
  - the portal standing on the tower's top storeys;
  - the corner post solid to the top;
  - the lattice mast beside it with its tips at 194–198 m;
- the pavement outside each curved face near its outer end, and each notch, open and free from 20 to 145 m, while each tower's middle is solid;
- at least 24 blades per tower, one every two storeys, each thin; the glass faces' thin bands at the blades' levels; each colonnade open and free to walk, the floors over it solid, at least eight columns;
- the podium's roof at about 16 m and nothing over it between the towers; its colonnade open below a solid podium;
- the drive under the drop-off canopy open, the canopy solid over it on its columns;
- the forecourts paved above the city's lawn;
- every raised part resting on something (a slice of the roof slab's overhang past the outer face carried on from the slice before it, the slab's fascia hanging from the slab); each lintel on its two posts; each mast running down its post;
- the two signs at street level (the name on One's fascia wall, the letters standing on their plinth, about 3 m tall); nothing on the crowns;
- triangle and batch budgets, finite geometry, no coplanar flicker, each tower solid up its height and lower toward its outer end, and the map footprints.

## Verification

- `node --test tests/landmark-sgx-centre.test.cjs`: 10 of 10 pass. With `tests/landmark-kit.test.cjs`, `tests/landmark-models.test.cjs`, `tests/singapore-landmarks.test.mjs` and `tests/city-geodata.test.mjs`: 110 of 110 pass.
- 8,844 triangles in 15 material batches (two of them signs), 237 colliders, no coplanar flicker, built in about 30 ms in node.
- Rendered in the preview (headless Chrome, WebGL) in the Tiny and day looks: the four views, the north, south, east and west elevations, the roof plan, and close-ups of the base and the portal.
- Also rendered in perspective from the photographers' standpoints and compared side by side with:
  - Lannuzel 2012 from Raffles Quay;
  - SGX Centre Two's portal in the same photograph;
  - Ong 2006 from across Shenton Way;
  - Tye 2011 from McCallum Street;
  - Ong 2006 from Shenton Way by the podium;
  - Tye 2017 from Lau Pa Sat.
- Checked in the live city on 4 November 2026 (`/?look=tiny&at=sgx-centre&camera=map`, WebGPU in Chromium, after the loading overlay cleared and the map camera settled): it stands on Shenton Way beside Robinson Point and Robinson Centre, the gap between the towers open over the podium; no generic mass of the replaced ways remains, no neighbour is missing, and the console shows no errors, missing models or flicker warnings. [City view](images/sgx-centre-city.jpg). The preview with `backend=webgpu` renders it with no errors either.

## Limitations

- The roof's low end (153 m), the portal's opening and lintel, the masts, the colonnade, the fascia, the podium's 16 m and the forecourts are estimates from photographs, not surveys. The roof slab's overhang and the top storey's setback are visual estimates.
- The roof slab is drawn in 1.5 m slices along each tower (the kit has no sloping slab), so its underside is stepped by up to 0.7 m; the dark fascia along its edges covers the steps from the side.
- The Shenton Way face's curve is a parabola through the mapped points, sampled in ten segments. The photographs show a smooth curve with fins.
- The kit has no see-through glass. The top storeys inside each portal's opening are the tower's own solid top, set back as in the photographs.
- The lattice masts are two legs and rungs; the real ones are latticed and carry antennas. They stand about 9 m over the architectural top, so `kit.bounds().maxY` is 196.5 m against the documented 187 m.
- The fins on the glass faces are drawn by the façade pattern and the two-storey bands as thin beams, not solids; the finer transoms are left out. Only the stone faces' sunshade blades are solid.
- Left out:
  - the crown sign (AVIVA in 2006–2012, today's unknown);
  - the 120 m mural wall beside the site;
  - the rooftop plant;
  - the podium's roof details;
  - the entrance canopies' fine structure;
  - SGX Centre Two's fascia name (not photographed).
- The south forecourt is not photographed; it is paved with two planted trees by assumption.
