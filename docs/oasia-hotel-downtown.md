# Oasia Hotel Downtown model

## Design and references

Replace the generic OpenStreetMap extrusion of WOHA's Oasia Hotel Downtown (100 Peck Seah Street, completed 2016) with a procedural landmark model in the existing landmark kit: the red aluminium mesh and its creepers, the stacked strata with open sky terraces flipping from face to face, and the hollow arched crown screen over the rooftop terrace. Heights above the documented total are photo-estimated, not surveyed.

- [WOHA's project page (via world-architects)](https://www.world-architects.com/en/woha-singapore/project/oasia-hotel-downtown) is the architect's own record, quoted in search coverage: building height 190.15 m; four sky terraces at the 6th, 12th, 21st and 27th storeys; roof crown structure 42.9 m (about 13 hotel floors); 25,490 m² of expanded red aluminium mesh carrying 21 species of creepers. It describes the "club sandwich" of distinct strata — offices, hotel and club rooms — each with its own sky garden.
- [ArchDaily's project page](https://www.archdaily.com/800878/oasia-hotel-downtown-woha) (photographs by K. Kopter and Patrick Bingham-Hall, 2016) supplied the aerial view into the open crown and the elevations showing the mesh continuing over the roof as an arched screen, the alternating open terraces and the dark enclosed core set back at the back corner of each terrace. Area 19,416 m², year 2016.
- [Wikimedia Commons category: Oasia Hotel Downtown](https://commons.wikimedia.org/wiki/Category:Oasia_Hotel_Downtown) supplied freely licensed straight elevations — "Facade A" and "Facade B" (2019) and the scale model exhibited at Roppongi Hills Mori Tower (2019). The scale model is the clearest record of the massing: enclosed red-grid blocks alternating with open voids on each face, the voids switching faces between strata, and the barrel-vaulted mesh crown with open trussed ends over the roof terrace.
- [Wikipedia: Oasia Hotel Downtown](https://en.wikipedia.org/wiki/Oasia_Hotel_Downtown) gives 27 floors and the CTBUH Best Tall Building Worldwide 2018 award; its top-floor figure (193.3 m) conflicts with the architect's 190.15 m total, so the architect's figure is used and the mapped 193 m tag is treated as an approximation.
- The EdgeProp and hotel coverage of the strata (office sky terrace with pool at level 6, hotel reception and pool at level 12, club facilities at level 21) guided the pool on each terrace deck.

## Mapped footprint and dimensions

- Replaced OSM object: way `393100847` only (`building=yes`, `building:levels=27`, `height=193`, `roof:shape=dome` — the last is the mapper's approximation of the arched crown, not used). No `building:part` ways and no enclosing relation exist for this tower in `tools/data/singapore/osm_buildings.json`.
- The footprint is a convex rounded square of 20 mapped points after the city generator's simplification, about 50.6 m east–west by 49.2 m north–south (bounds centre 1.2758812, 103.8443413), area about 2,050 m² against a published site area of 2,311.4 m² — the footprint fills the site less its planting buffers, as WOHA describe.
- Neighbours are preserved: Guoco Tower's podium and parts (ways 393100845, 393100848, 393100849, 393100850) and the surrounding Tanjong Pagar buildings are not hidden.
- Model dimensions (metres, `y` up from the street): total 190 (documented 190.15). The roof-terrace deck is at 147, so the crown is 43 m, matching the documented 42.9 m. The strata beneath are estimates fitted to the terrace storeys (6, 12, 21) and the proportions of the elevations and scale model: enclosed blocks 0–23, 41–64, 82–112 and 127–147; open terraces 23–41, 64–82 and 112–127; straight crown screen to 166, then a semicircular-profile vault to the 190 m top. Individual floor-to-floor heights are not published in the sources above, so these boundaries should be read as ± several metres.

## Approach and scope

Use the mapped ring itself for the enclosed blocks so the tower occupies exactly its surveyed footprint, and build everything else in a local east/south frame recovered from a mapped edge (independent of the vertex-average anchor and the city grid bearing):

- Enclosed floors are prisms over the mapped ring in a red-orange curtain grid over dark windows, alternating tone per block, with seeded creeper patches on the flat face stretches and green-wrapped corner columns where the planting is heaviest in photographs.
- Each sky terrace is modelled as what it is — open air: a deck slab across the footprint, the enclosed core clipped to the back corner (the footprint ring inset 2.3 m, clipped to a corner quadrant), red mesh panels only on the core's two faces, and posts, a pool, planting and trees on the deck. The core corner flips NW → SE → NW up the tower, so the open faces alternate as photographed. No slab fills a terrace, in geometry or in collision.
- The crown is four straight mesh screen panels (the footprint clipped to within 0.65 m of each face) up to 166 m, then eight faceted shell strips on a circular arch profile to 190 m, ridge running east–west with the ends left open and two dark truss rods suggested at each end. Inside it sit the level-27 roof terrace, its pool, trees and a small plant core. Collision covers the screen walls, each terrace and roof deck, the enclosed blocks and, conservatively, the vault's top strip only — the curved flanks are a documented simplification (descending onto a flank meets the screen-wall colliders at its base).
- Signs: white "oasia hotel" lettering at its photographed size on the south and west faces below the crown. Vault orientation (ridge east–west, open ends east and west) is estimated from the Commons elevations and the scale model; no source states it in compass terms, so a 90° error here is the model's main orientation uncertainty.
- Interiors, the mesh's fine perforation, drapery of individual creepers and roof furniture are simplified to what reads at map camera distance. Reference photographs stay outside the repository.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=oasia-hotel-downtown&view=all
http://127.0.0.1:8012/tools/landmark-preview.html?model=oasia-hotel-downtown&view=s&look=day
http://127.0.0.1:8012/tools/landmark-preview.html?model=oasia-hotel-downtown&view=ne&backend=webgpu
http://127.0.0.1:8012/?look=tiny&at=oasia-hotel-downtown&camera=map
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
```

## Verification

- New tests in `tests/landmark-models.test.cjs` probe the model from the mapped outline's centre in real east/north metres: exactly way 393100847 replaced (Guoco neighbours intact), 190 m top on the mapped footprint, no coplanar flicker, finite geometry; south face open at level 6 with the core north-west, north face open at level 12 with the core south-east, south open again at level 21; the crown hollow at its centre with no invisible slab, while its deck and vault top, the terrace decks and the enclosed blocks stop descent.
- Regenerated geodata, compared decoded against the committed geodata: `GEO.landmarks` gains exactly one entry (10 → 11 anchors, 160 → 161 mapped parts, the new part being way 393100847); decoded `GEO.buildings` go from 16,094 to 16,093 with exactly the generic Oasia extrusion removed (193 m, 27 levels, 20-point ring) and every other decoded building identical in absolute geometry (the only other packed difference is the next building's first-point delta, which is encoded relative to the previous ring). All other geodata keys — trees, lawns, blocks, roads — are identical.
- Rendered checks (headless Chrome, preview tool): four-view Tiny look, south elevation in day look and the north-east view on the WebGPU backend all render without errors; 4,564 triangles in 11 material batches. The rendered tower was compared against the Commons elevations and the scale model; the strata were rebalanced once (taller terrace voids, denser creepers, gridded enclosed floors) after the first comparison.
