# IOI Central Boulevard Towers model

Checklist **SG-045**. Program: `js/landmark-models/ioi-central-boulevard-towers.js`; tests: `tests/landmark-ioi-central-boulevard-towers.test.cjs`. Built on 4 November 2026 with the landmark kit and the city's normal/Tiny material pairing, replacing a placeholder that extruded the mapped parts.

IOI Central Boulevard Towers, 2 Central Boulevard, is IOI Properties' office development on the former Central Boulevard white site. It occupies the block between Raffles Quay (west-north-west), Central Boulevard (north-north-east), Marina View (east-south-east) and Commerce Street (south-south-west). Two towers stand on a seven-storey podium: the 48-storey West Tower at the Raffles Quay end and the 16-storey East Tower toward Marina View. Level 7 is Central Green, a sky park on the podium's roof that runs between and under the towers, which stand on columns over it. Design: CallisonRTKL with Architects 61; completed in 2024.

The brief named Kevin Roche John Dinkeloo and Associates as the architect. No source consulted supports that: the owner and CTBUH both credit CallisonRTKL, with Architects 61 as the local firm.

## References and interpretation

All read on 4 November 2026.

- CTBUH Skyscraper Center, [West Tower](https://www.skyscrapercenter.com/building/ioi-central-boulevard-towers-west-tower/41622) and [East Tower](https://www.skyscrapercenter.com/building/ioi-central-boulevard-towers-east-tower/50965):
  - West Tower: 237.9 m architectural and tip height, highest occupied floor 220.5 m, 48 floors above ground and 1 below, all-concrete.
  - East Tower: 100.4 m, highest occupied floor 82.8 m, 16 floors, composite (steel bracing at floors 3–4).
  - Both proposed 2017, started 2018, completed 2024.
  - Design architect and architect of record CallisonRTKL (Architects 61 also listed), KTP Consultants (structure), Hexacon Construction.
- [IOI Properties Singapore, portfolio page](https://www.ioiproperties.com.sg/portfolio/ioi-central-boulevard-towers): CallisonRTKL and Architects61, completed in 2024, "Marina Bay's first urban sky park with a dedicated jogging track". Its photographs (2024–25) are the main references for the present state:
  - *ioicbt-masthead-v2* (also *home-01-v2* on the home page): a drone view from the east-south-east along the site's axis. It shows the East Tower in front on its columns over the sky park, its louvred crown, the West Tower behind with the IOI mark at the south end of its crown's east face, the podium's fins and green glass, and the four-storey block on the left with its roof garden. The crowns, the sign and the podium were measured on it.
  - *ioicbt-05*: from the Central Boulevard / Marina View corner (east-north-east). It shows both towers' notched corners, the crowns' louvres and the East Tower raised on columns over the podium's planted edge, but no IOI mark on the West Tower's crown: it predates the sign.
  - *ioicbt-02-01*: the West Tower from Robinson Road behind Lau Pa Sat.
  - *ioicbt-02-02*: the gap between the towers from the street, with a link bridge.
  - *ioicbt-02-03*: the West Tower's corner notch over the podium's pleated fins.
  - *ioicbt-02-04*: the East Tower over Central Green from the east-north-east.
  - *ioicbt-01-01…05*: the podium's street faces, the bridges' landings, the escalator entrance and a planted walk under a tower.
- [IOI Properties Malaysia, project page](https://www.ioiproperties.com.my/central-boulevard/ioi-central-boulevard-towers):
  - The stacking plan (*ICBT-stacking-plan-2025.04.29*): a north elevation drawn to scale. Its widths match the mapped rings to about a metre: West Tower 46 m wide 6.6–52.7 m from the podium's west end, East Tower 68 m wide ending 15.6 m short of the podium's east end. The heights below were measured on it, scaled by the West Tower's 237.9 m; the East Tower then measures 100.7 m against CTBUH's 100.4 m.
  - The typical floor plans (East Tower 25,480 sq ft, West Tower mid and low 21,710 sq ft): the corner notches, the columns' positions and their insets.
  - The Level 5 podium plan (70,000 sq ft): the plan's street names, the cores' positions, and the "roof garden at Level 5" with its three planters on the four-storey block along Commerce Street.
  - The brochure ([deck, April 2025](https://files.ioiproperties.com.my/dsites/s3fs-public/2025-04/IOI%20Central%20Boulevard%20Towers_Deck.pdf)): a close view of the West Tower's crown corner (the louvre blades on both faces, the notch's chevron of fins rising between them) and an as-built view down on the sky park's east corner (lawns, a teal jogging track, young trees, a dark glass-roofed pavilion under the East Tower's north-east corner, the glass railing). Its renderings of the podium cutaway and the sky park were used only for the arrangement.
- *The Edge Singapore*, 12 July 2024, [republished by IOI Properties](https://www.ioiproperties.com.my/news/ioi-central-boulevard-towers-building-greener-future): "a 16-storey East Tower and a 48-storey West Tower, both atop a seven-storey podium". It describes "120,000 sq ft of lush green landscaping", with Central Green "a 60,000 sq ft sky park on the seventh floor" with a 200 m jogging track and the restaurant Sospiri.
  - [EdgeProp's announcement](https://edgeprop.sg/property-news/ioi-central-boulevard-towers-feature-‘largest-urban-sky-park’-marina-bay) of 7 December 2022 gave 120,000 sq ft for the park itself (160 m long). The later figure is taken here: 60,000 sq ft (about 5,600 m²) for the sky park, 120,000 sq ft for all the planting. The modelled deck, less the cores, is about 6,400 m².
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) tiles at zoom 19 (taken after completion), with a grid in the city frame overlaid. Towers lean east-south-east, about 0.31 m per metre of height:
  - The West Tower's roof appears 75 m off its base: a grey roof inside a light rim (the louvre screen seen from above).
  - The East Tower's roof appears 32 m off: a green roof with a row of panels along its south side. Its east edge, set back by that lean, falls about 81.5 m along the site, matching the elevation.
  - The sky park itself is hidden under the West Tower's leaning image.
- OpenStreetMap streets (osm_roads.json): Central Boulevard 13–25 m off the north face, Commerce Street 8 m off the south face, Raffles Quay 23 m west, Marina View 11 m east.

The reference photographs stay outside the repository.

### OpenStreetMap ways replaced (hide list unchanged)

| Way | Tags | Use |
| --- | --- | --- |
| [1206694672](https://www.openstreetmap.org/way/1206694672) | `building=office`, "IOI Central Boulevard Towers" | the outline: the drawing's axes (its longest edge), the test's bounds |
| [725993952](https://www.openstreetmap.org/way/725993952) | `building:part=office`, "Central Square" | the same ring under an older name; hidden, unused |
| [1075230981](https://www.openstreetmap.org/way/1075230981) | 6 levels, glass, teal, grass roof | the podium (with the outline's step at the north bridge) |
| [1206694673](https://www.openstreetmap.org/way/1206694673) | 4 levels, grass roof | the block along Commerce Street and its Level 5 roof garden |
| [1075230983](https://www.openstreetmap.org/way/1075230983) | "West Tower", 46 levels from level 8, 245 m | the West Tower's plan and notches; anchors the drawing |
| [1075230982](https://www.openstreetmap.org/way/1075230982) | "East Tower", 18 levels from level 8, 80 m | its north, south and west faces and west notches; its east end is the podium's edge, not the tower's |
| [1075230987](https://www.openstreetmap.org/way/1075230987), [1075230986](https://www.openstreetmap.org/way/1075230986) | grey concrete, levels 6–8 | the cores' enclosures where they come down through the sky park, drawn on their rings |

The mapped heights (245 m, 80 m) are superseded by CTBUH's 237.9 m and 100.4 m. The two link bridges, [1075230984](https://www.openstreetmap.org/way/1075230984) to One Raffles Quay / Marina Bay Link Mall and [1206694671](https://www.openstreetmap.org/way/1206694671) across Commerce Street (5–8 m, layer 1), stay the city's. The podium meets them with dark glass portals at Level 2 and no fins in front of their ends. Asia Square (SG-041), Marina Bay Suites (393092728), One Shenton, MBFC and the MRT entrances are untouched. `osminside.mjs` finds no other mapped way inside the outline, so the hide list is complete.

## Frame and drawing

The program draws in metres. `u` runs along the outline's longest edge (the south wall, 0.94° off the city's x), toward Marina View. `v` runs across it, toward Commerce Street. The drawing's origin is fitted to the mapped West Tower ring's extremes, so the drawing is independent of the anchor. The podium, the block and the ground floor's line are the mapped vertices projected into this frame. In it:

- the podium runs u −62.8…96.9: the corner toward Raffles Quay and Central Boulevard reaches v −36.7, the north wall lies at v −24.1, and the south wall at v 33.5 under the West Tower and 20.0 beyond it;
- the block runs u −11.9…90.4, v 19.9…33.5;
- the West Tower runs u −56.05…−11.45 (44.6 m) by v −27.29…33.51 (60.8 m), each corner cut in 6.6 m along u and 1.95 m along v;
- the East Tower runs u 13.9…82.0 (68.1 m) by v −24.08…19.95 (44.0 m), each corner cut in 3.2 × 3.0 m;
- the gap between the towers is 25.4 m; the deck beyond the East Tower is 14.9 m deep.

## Massing

| Mass | Heights (m) | Basis |
| --- | --- | --- |
| Ground floor: dark glass recessed 1.2 m behind the line of the floors over it, granite-grey piers about 9 m apart | 0–4.8 | elevation (L1); recess and piers from photographs (01-01, deck img-001); estimated |
| Podium, Levels 2–4: the street walls with silver fins over dark glass, real fins 0.6 m deep every 2.4 m | 4.8–20.6 | elevation; photographs |
| Podium, Levels 5–6: green glass curtain wall | 20.6–30 | elevation (30.6 m to the parapet) |
| Central Green: the deck, its glass railing | 30, rail 30–31.1 | elevation |
| Four-storey block along Commerce Street, roof garden on top | 4.8–20.3 | mapped 4 levels; L5 plan; elevation's Level 5 slab |
| West Tower: 18 columns 1.7 m square (6 per long face, 3 per short face, centres 2.1 and 1.5 m in) | 30–41.7 | floor plan; elevation |
| East Tower: 20 columns 1.6 m square (7 per long face, 4 west, 2 east, centres 1.6 m in) | 30–44.2 | floor plan; elevation |
| Cores' enclosures at the sky park | 30–41.7, 30–44.2 | mapped rings; heights to the soffits |
| West Tower: soffit slab, shaft of 41 office floors (4.47 m), clear glass on the main faces under a silver spandrel band 0.6 m tall and 0.15 m proud at each of its 40 floor lines | 41.7–42.5, 42.5–225.7 | elevation; CTBUH occupied 220.5 m; bands from the masthead (about 2–3 px bright in a 17 px storey) |
| West Tower's crown: pale grey plant floors 1.2 m inside the glass, sixteen louvre blades 0.3 m thick on each face (0.35 m proud, 1.55 m deep) on posts about 6 m apart, roof slab and a plant box | 225.7–237.9 (roof 236.8) | elevation (12.2 m crown band); masthead; aerial (the rim) |
| East Tower: soffit slab, shaft of 9 office floors (4.81 m), banded as the West's at its 8 floor lines | 44.2–45, 45–88.3 | elevation; CTBUH occupied 82.8 m |
| East Tower's crown: as the West's, a pale cap a fifth of the tower's height over the soffit (12.1 of 55.4 m; 60 of 285 px in the masthead); a green roof with six rows of panels along its south side | 88.3–100.4 (roof 99.3) | elevation; masthead; aerial |
| Pavilion (the restaurant) under the East Tower's north-east corner, out past its east face | 30–35.2 | brochure's sky-park view, 02-04; estimated |
| Three meeting pods with white roofs at the deck's west edge under the West Tower | 30–32.85 | deck img-001; estimated |
| Lawns, the 2.2 m teal track in a 233 m loop, 41 trees on the deck, 3 planters and 6 trees on the block | deck +0.12, +0.16 | brochure's sky-park view, 02-04, L5 plan; layout estimated |

Each tower's notch walls are striped by their fins (light bands over dark glass, a storey at a time) all the way up, and dark through the crown, where the blades stop at the notch as the brochure's crown photograph shows.

Colours, from the daylight photographs (masthead, 05, 02-01, 02-04). Sampled on the masthead:
- the East Tower's face, bands included: `#afc6d9`;
- the West Tower's sunlit face: `#5f93cb`–`#6e99c9` between bright bands of about `#d0dde8`;
- the crowns: `#bdbfc9`–`#c9c4c6`.

The towers are the lightest glass in that view. The broad faces use a plain, slightly glossy material (roughness 0.3, metalness 0.18) rather than the kit's glass, whose metalness 0.55 renders navy in the preview's daylight, which has no reflected sky. In the preview's east view the sunlit faces render about `#869fb4` (day) and `#87a2bc` (Tiny), bands included.

| Element | Colour |
| --- | --- |
| Tower glass on the main faces | silvery sky blue `#92bbe6` |
| Floor bands, louvre blades, posts, railings, pod roofs, real fins | bright silver `#e1e5e8` |
| Plant floors behind the louvres | pale grey `#c9cdd1` |
| Notches' fins over dark glass | `#d3d7da` over `#34465a` |
| Columns, roof slabs, piers | light stone `#b8b6af` |
| Soffits, pavilion roof, panels, trunks | dark grey `#4f5559` |
| Podium fins (painted) over dark glass | `#c9ced1` over `#515f67` |
| Podium's office glass | green `#466e6e` in `#8e9a9c` |
| Ground floor, pavilion, portals | dark glass `#34434b` |
| Lawns, trees and the East Tower's green roof, paving, track | `#7fa94a`, `#4b7a37`, `#d6d3cb`, teal `#4f9f96` |

## Sign

IOI's mark (a blue globe crossed by a white band, then "IOI" in white serif capitals with dark shadows) hangs on the West Tower's crown. It sits on the east face toward the bay and the East Tower, at the face's south end, as the masthead shows it. It is 17 m wide and 6.2 m tall, centred about 6.6 m under the top, 0.25 m in front of the louvre blades. The plant floors' wall stands 1.8 m behind it. The mark was added to `js/landmark-logos.js` as `ioi`, simplified from the photograph; no drawing is published on Wikimedia Commons. The East Tower carries no sign in any photograph.

## Collision

- Filled volumes:
  - the ground floor on its recessed line, so the 1.2 m arcade under the overhang stays clear;
  - the podium and the block from Level 2 to their roofs, so the deck is solid to walk on;
  - each tower from its soffit slab to its top;
  - each column, both cores, the pavilion and the pods.
- Left open:
  - the sky park from the deck to the soffits between the towers, beyond the East Tower and under both towers between the columns and the cores;
  - the corner terrace;
  - the block's roof garden;
  - the West Tower's corner notches;
  - the pavements.

![IOI Central Boulevard Towers in the Tiny look, four views: the tall West Tower and the broad East Tower on their columns over the planted deck, their notched corners and louvred crowns, IOI's mark on the West Tower's crown toward the bay, the podium's fins and green glass band, the jogging track looping round the East Tower, the block's roof garden along Commerce Street; and the roof plan with the East Tower's green roof](images/ioi-central-boulevard-towers-overview.png)

## Inspect and rebuild

```text
http://localhost:8014/tools/landmark-preview.html?model=ioi-central-boulevard-towers&view=all
http://localhost:8014/tools/landmark-preview.html?model=ioi-central-boulevard-towers&view=e&look=day
http://localhost:8014/tools/landmark-preview.html?model=ioi-central-boulevard-towers&view=e&focus=west-crown
http://localhost:8014/tools/landmark-preview.html?model=ioi-central-boulevard-towers&view=e&focus=park
http://localhost:8014/tools/landmark-preview.html?model=ioi-central-boulevard-towers&view=n&focus=podium
http://localhost:8014/?look=tiny&at=ioi-central-boulevard-towers&camera=map
```

```powershell
node --test tests/landmark-ioi-central-boulevard-towers.test.cjs
```

The hide list is unchanged, so the geodata needs no rebuild.

The tests check:

- the eight replaced ways, with the bridges, Marina Bay Suites and Asia Square left unhidden;
- the 237.9 m height, standing on the ground within the mapped outline, built in under 500 ms;
- the two towers' tops (each roof just under its screen, the screen at 237.9 and 100.4 m) and their shafts at mid-height over the mapped cores' centroids;
- the West Tower's mapped corner notch open all the way up, and each shaft a single notched prism between soffit and crown;
- the crowns: at least 40 thin blades each, the top one at the tower's top, the roof under it, at least 12 posts standing on the shaft;
- Central Green at the deck's height and open to the sky:
  - between the towers, beyond the East Tower and in the corner terrace;
  - under both towers between core and long face, with the tower over it and the deck under it;
- the cores from the deck to the soffits; at least 18 and 20 columns from the deck to the soffit slabs;
- at least 25 trees on the deck and the track about 200 m long;
- the block's roof garden at 20.3 m, open above, with its trees;
- colliders solid in the podium, the towers and the cores, and clear in the sky park, over the block's garden and on both pavements;
- that nothing floats: every raised part rests on something, each podium fin on the podium wall beside it, each shaft on its slab and each slab on its columns;
- the single IOI sign on the West Tower's crown, facing east-south-east with the crown's wall behind it, toward the south end and under the top;
- the budgets, finite geometry and no coplanar flicker.

## Verification

- `node --test tests/landmark-ioi-central-boulevard-towers.test.cjs`: 10 of 10 pass.
- With `tests/landmark-kit.test.cjs`, `tests/landmark-models.test.cjs`, `tests/singapore-landmarks.test.mjs` and `tests/city-geodata.test.mjs`: 110 of 110 pass.
- 11,939 triangles in 14 material batches (one of them the sign), no coplanar flicker, built in about 27 ms in node.
- Rendered in the preview (headless Chrome, WebGL, SwiftShader) in the Tiny and day looks:
  - the four views, and the north, south, east and west frontages;
  - the roof plan;
  - the West Tower's crown from the east;
  - the sky park from the north-east and east;
  - the podium from the north and south;
  - the West Tower's columns and pods from the west.
- Compared with:
  - the masthead (the east view: the towers' order and proportions, the crowns' bands, the IOI mark's place and size, the block's roof garden);
  - 05 and 02-04 (the East Tower on its columns, the notches);
  - the brochure's sky-park view (the pavilion, the track and the lawns at the east corner);
  - the stacking elevation (every height);
  - the aerial (both roofs).
- Checked in the live city on 4 November 2026 (`/?look=tiny&at=ioi-central-boulevard-towers&camera=map`, WebGPU in Chromium, after the loading overlay cleared and the map camera settled): it stands between Asia Square, Marina Bay Financial Centre and One Shenton, the two link bridges meeting the podium; no generic mass of the replaced ways remains, no neighbour is missing, and the console shows no errors, missing models or flicker warnings. [City view](images/ioi-central-boulevard-towers-city.jpg). The preview with `backend=webgpu` renders it with no errors either.

## Limitations

- The IOI mark is confirmed only by the owner's current masthead photograph. An earlier owner photograph (05) of the same face shows no sign, so the mark went up after completion. It is not known whether other faces carry it.
- The sky park's layout (lawns, the track's route, the trees, the pavilion's size) is drawn from one as-built view of its east corner, two photographs and renderings. The aerial does not show it, because the West Tower's leaning image covers it. The water feature and gym of the renderings are left out as unconfirmed.
- The podium's street walls share one treatment: painted and real fins to Level 5, green glass above. In reality they vary by face. The pleated fins under the West Tower, the glazed corner toward Raffles Quay and the Central Square plaza and drop-off under the podium are simplified away.
- The East Tower's east face (82.0 m along the site) is set between the floor plan's 70 m length and the elevation's and aerial's 81.5–81.7 m; it may be a metre off. Its mapped ring runs 15 m further, to the podium's edge.
- The louvres are flat blades; the real ones are angled and finer. The notches' chevron fins are painted stripes.
- The broad faces have no vertical mullions at all: at close range the real ones show faintly.
- The glass is matte where the real glass reflects the sky. Its colour is a compromise between the West Tower's sunlit sky blue and the East Tower's paler silver; it does not change with the view.
