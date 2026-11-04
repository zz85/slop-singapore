# The Gateway — East and West (SG-226)

This model covers I. M. Pei's twin trapezoidal office slabs at 150/152 Beach Road, completed in April 1990: two sheer 37-storey blades standing either side of Beach Road with the road running open between them.

## References

- [The Gateway (Singapore) — Wikipedia](https://en.wikipedia.org/wiki/The_Gateway_(Singapore)) records 37 storeys (2 below ground), a 150 m roof, architects I. M. Pei with Chua Ka Seng and Partners, and the trapezoidal form Pei also used at the National Gallery of Art East Building. The local OSM extract independently tags both ways `building:levels=37`, `height=150`, `start_date=1990` (East also carries the same Wikidata/Wikipedia links).
- Reference photographs viewed 4 November 2026 on Wikimedia Commons: [The Gateway, Singapore, Dec 05](https://commons.wikimedia.org/wiki/File:The_Gateway,_Singapore,_Dec_05.JPG) (the pair across Beach Road from the south-east: broad faces in fine silver/dark horizontal floor bands, knife-sharp acute corners, flat roofs), [The Gateway 4, Singapore, Dec 05](https://commons.wikimedia.org/wiki/File:The_Gateway_4,_Singapore,_Dec_05.JPG) (looking up: the short end faces are plainer, finely vertically striped, and the horizontal bands wrap the obtuse corners), and the [massing model diagram](https://commons.wikimedia.org/wiki/File:The_Gateway_massing_model.svg) (parallelogram plans with the small V-notch on one long face of each tower).
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) roof forms are consistent with flat roofs and a compact central plant mass; the plant block's size here is an estimate at miniature scale.

## Footprint and massing

The 25 October 2026 local OSM extract maps the towers as two unnamed `building=office` ways identified by their address tags: [way 47126588](https://www.openstreetmap.org/way/47126588) ("The Gateway East", 152 Beach Road) and [way 47126589](https://www.openstreetmap.org/way/47126589) ("The Gateway West", 150 Beach Road). These are the only two replacements; there are no building relations, inner rings or `building:part` stacks on either tower, and no separate podium way — The Plaza, PARKROYAL and DUO next door remain mapped.

Each ring is the same parallelogram plan, about 56 m long (bearing 135°/315°) by 39 m across its short edges, roughly 1,530 m², with a shallow V-notch (two 6.8 m edges) in the middle of one long face — the north-east face of East, the south-west face of West. The model keeps the mapped rings exactly: a recessed glass lobby storey (inset 0.9 m, to 5.2 m) under a silver soffit slab (5.15–5.9 m, an estimate from the tree-hidden bases in the photographs), then the office shaft to 147 m in a silver `ribbon` façade (3.95 m floors: wide pale spandrels, narrow dark window strips) on the long faces and a vertically `strips` façade on the short end faces, chosen wall-by-wall from the ring's edge lengths. A silver parapet (147–148.6 m) and a centred roof-plant block along the long axis bring each tower to the documented 150 m. The gap between the towers — Beach Road itself — is left completely open in geometry and collision.

## Verification

- The city generator retained 71,784 trees and added the three new landmark anchors in this batch; the generic building count fell from 15,887 to 15,878 across the ten replaced ways of SG-226/SG-253/SG-235. The tests check the two exact replacement IDs, that both blades reach 146 m or more at their independently located mapped centres, that Beach Road between them carries no geometry or collision at any height, and that Gateway East's acute tip is built while the air 12 m beyond it is clear.
- All 118 targeted checks (landmark kit, landmark models, Singapore landmarks, city geodata) passed, and 561 of 569 checks in the full Windows suite — the 8 failures are the known POSIX shell/worker fixtures, confirmed identical on the untouched base. Zero coplanar flicker pairs.
- The preview uses 206 triangles and 5 material batches. Checked Tiny and daylight in WebGL and WebGPU from the north-east, east, west and roof, and inspected the loaded city (both blades either side of Beach Road, DUO and The Plaza undisturbed, no duplicate generic towers).
- [Four-view preview](images/the-gateway-overview.png) and [city view](images/the-gateway-city.jpg). With the repo served locally, use `/tools/landmark-preview.html?model=the-gateway&view=all` or `/?look=tiny&at=the-gateway&camera=map`.

The recessed lobby storey and the roof-plant block are miniature-scale estimates — the bases sit behind street trees and the roofs are seen only in aerial imagery in the references above. There is no signage on either tower in the photographs, so none is modelled.
