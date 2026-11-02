# Marina One model

Modelled on `claude/building-models-map-37948b`, branched from `main` at `3bebb2c` on 2 November 2026, with the landmark kit and the city's normal/Tiny material pairing. Program: `js/landmark-models/marina-one.js`.

## References and interpretation

- [OpenStreetMap](https://www.openstreetmap.org/way/463857949) supplies the footprints and the stacked heights: the offices' outline `463857949`, the East and West Towers `463857946`/`463857945` (207 m), their bronze stair shafts `463857948`/`463857947` (207 m), the glass corner crowns `941456993/94/96/97` (210 and 216 m) and the chimneys between them `941456992/95` (225 m), and Marina One Residences, Garden Tower `463858904` and Park Tower `463858905` (141 m, 34 levels). All thirteen are replaced; nothing else in the block is.
- Heights: the offices are 200 m to the roof in Ingenhoven's and the project databases' figures ([german-architects](https://german-architects.com/en/projects/view/marina-one)), and 225 m to the top in the [CTBUH Skyscraper Center](https://skyscrapercenter.com/building/marina-one/16878) and [Wikipedia's list](https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Singapore): the model puts the roof at 200 m and the mapped chimneys at 225 m. The residences are 139 m (Ingenhoven); 34 storeys and 30 office storeys from [Wikipedia](https://en.wikipedia.org/wiki/Marina_One).
- [ArchDaily's Green Heart page](https://www.archdaily.com/886215/green-heart-marina-one-singapore-ingenhoven-architects) (photographs by HG Esch, drawings by Ingenhoven): the site plan and level 2 plan (four towers around a lobed garden void, the office cores and portal on the west), the section (the office storeys over a podium of terraces, the roof pergola), the view from the east over the residences (the bridge of the top storeys over an open portal, the two bronze columns standing in it and over the roof, the bronze stair shafts at the office towers' ends, the saddle-shaped pergola, the residences' bronze frames and rooftop boxes) and the aerial straight down into the heart (bronze louvres a storey apart on every face toward the heart, waving).
- [The Commons photograph from Marina View](https://commons.wikimedia.org/wiki/File:Marina_One.jpg): the offices' west face, the recessed portal under the bridge, the light glass crowns at the outer corners.

The block follows the city grid, so its axes come from the offices' longest wall and the drawing's origin from the outline's extremes, independent of the anchor and of the city's bearing. The towers stand on their mapped rings; the bridge takes its north and south walls from the towers' own vertices so that the roofs meet edge to edge. Estimated from the drawings and photographs, not surveyed: the bridge's soffit (166 m, the top seven storeys), the residences' glazed base (12 m), the heart's terraces (five, up to 21.4 m, the void an egg with three lobes widening upward, open toward the portal), the pergola's saddle (203 to 215 m), the frames' rhythm, the louvres' depth (0.55 to 1.9 m).

## Visible features

- Offices: blue glass with fine mullions on the mapped rings; the bridge over the open portal; two bronze columns from the plaza through the bridge; bronze stair shafts at the heart ends; light glass corner crowns and steel chimneys at the outer corners; a glass parapet on the roof's outer edges; the steel pergola (ribs every 7 m on a saddle, rafters, posts) over planted beds and small trees.
- Residences: green glass in a bronze curtain grid on a dark glazed base; bronze fins between bays and staggered bars where frames end on the faces away from the heart; a few frames rising open past the roof; bronze rooftop boxes.
- Every face toward the heart: tan bronze louvres a storey apart (4.6 m on the offices, 3.9 m on the residences), their depth waving along the face and drifting storey by storey.
- The Green Heart: five terraces stepping down to a garden with a dark pond, paths and trees; the residents' lap pool along the first terrace; trees on the planted terraces; the way in from the portal paved; glazed two-storey podium blocks with green roofs in the gaps between the towers.
- Colliders and map footprints for every tower to its full height, the bridge (not the portal under it), nothing over the heart.

## Inspect and rebuild

```text
http://127.0.0.1:8000/tools/landmark-preview.html?model=marina-one
http://127.0.0.1:8000/?look=tiny&at=marina-one&yaw=110&pitch=42&dist=700
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs
```

The model tests check the thirteen replaced ways, the portal open under the bridge, the offices at 200 m and the residences at 139 m, the heart open to the sky over its garden and terraces, the louvres and the pergola, the triangle and batch budget, no coplanar flicker, and colliders (the residences and the bridge solid, the portal and the air over the heart not).
