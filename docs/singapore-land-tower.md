# Singapore Land Tower (SG-008)

The model represents the 2025 asset enhancement at 50 Raffles Place. SingLand and Maki and Associates document the white-fritted curtain wall, public plaza canopy, planted podium terraces and the 49th-storey viewing gallery.

## References

- [Singapore Land Group property profile](https://www.singaporeland.com/portfolio/singapore-land-tower/) and [May 2026 completion account](https://www.singaporeland.com/celebrating-singapore-land-towers-transformation/) establish the as-built period and uses at plaza and roof level.
- [DvTor8303's west elevation, 3 September 2025](https://commons.wikimedia.org/wiki/File:Singapore_Land_Tower_20250903.jpg) shows blue-silver glazing, fine floor lines, the broad change in the frit around mid-height, and the plaza canopy in front of the recessed lobby.
- [Lighting Planners Associates, 2025 project](https://www.lighting.co.jp/en/projects/singapore-land-tower/) shows the as-built bayside elevation and a close view of the curved metal mesh at the crown, with the owner sign below.
- [Maki and Associates regeneration project](https://www.maki-and-associates.co.jp/projects/33?lang=en) gives the exterior design intent and completed storey count. Its renderings inform the podium and roof layout. The dated photographs govern the façade and crown.
- [CTBUH](https://www.skyscrapercenter.com/building/singapore-land-tower/1987) lists 190 m, matching the local map extract. [The owner's history](https://www.singaporeland.com/singapore-land-tower-transforming-an-icon/) describes the original tower as 198 m, and [the skyline inventory](https://en.wikipedia.org/wiki/List_of_tallest_buildings_in_Singapore) lists 213 m for the refurbished building. The model uses about 198 m to the new roof deck and 213 m to the top of the screens as working estimates.

## Footprint and massing

The local OSM snapshot dated 25 October 2026 supplies the roughly 40 × 40 m shaft ([way 46595418](https://www.openstreetmap.org/way/46595418)) and the irregular four-level podium envelope ([way 939684168](https://www.openstreetmap.org/way/939684168)). The model replaces these two ways. The extract has no enclosing building relation or inner rings for this site. MYP Centre and its parts, CIMB Plaza and both Raffles Place MRT entrance pavilions are separate scopes.

The plaza canopy and podium sit in a metre frame centred on the first mapped shaft vertex at 103.851766°E, 1.2847431°N. The axes point 52° and 142° clockwise from true north. The tower follows the mapped ring. The podium steps around it into the wider envelope, leaving the west plaza open and the canopy clear below its roof between columns. Estimated dimensions are 8 m at the canopy, 16 m at the main podium deck and 23 m at its raised pavilion. The glass rhythm and the two curved crown screens are estimated from the photographs. The mesh is represented by thin faceted panels and ribs.

## Verification

- The generated city anchor uses both replacement ways. Tests probe the clear plaza and covered approach, canopy collision, podium deck and the solid roof below the open crown.
- The guide's targeted suite passed 99 checks. The complete Node suite passed 544 checks on Linux.
- The model uses 967 triangles and 11 material batches. The kit reports zero coplanar overlaps. Checked Tiny and daylight in WebGL and WebGPU, plus the loaded Tiny city view. The new curtain wall and crown were compared with the dated west and bayside photographs.
- [Four-view preview](images/singapore-land-tower-overview.png) and [city view](images/singapore-land-tower-city.png). With the repo served locally, use `/tools/landmark-preview.html?model=singapore-land-tower&view=w&look=day` for the west elevation and `/?look=tiny&at=singapore-land-tower&camera=map&dist=730&pitch=56&yaw=225` for the city view.

The first pass simplifies the roof gallery pavilion, planted terraces and glazing details. Crown lighting and interior spaces are future detail.
