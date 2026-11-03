# Customs House — SG-036

Codex / bc2d, 3 November 2026. Exclusive claim: [PR #15](https://github.com/datainvestor/tiny-singapore/pull/15). Model period: restored 2010 onward exterior; tenant furniture is simplified.

## Sources and plan

- [Owner: Customs House](https://www.fullertonhotels.com/the-fullerton-heritage-singapore/properties/customs-house) and [heritage history](https://www.fullertonhotels.com/the-fullerton-heritage-singapore/about-us), checked 2026-11-03: two-storey building at 70 Collyer Quay, opened 1969, **23 m** control tower, preserved butterfly fascia and window panels. The [owner's exterior photograph](https://image-tc.galaxy.tf/wijpeg-669jmr1kpmnmtbwxzcjpokiro/07-property-customs-house.jpg) shows recessed glazing, white bow-tie fascias, vertical service screens and the octagonal lookout. Photograph date unstated.
- [URA conservation record, 70 Collyer Quay](https://www.ura.gov.sg/conservation/find-a-building/conservation-portal/cliffpr-00003/), checked 2026-11-03: principal daylight waterfront elevation and conserved scope.
- [NHB Singapore River Walk, 2018](https://www.roots.gov.sg/~/media/Roots/Files/singapore-river-walk/nhb_singpaore-river-walk_2018.pdf), p. 36: 2016 side elevation, L-shaped pier, bow-tie panels, umbrella pavilions, 23 m watchtower; distinct from Maxwell Chambers.
- [NHB conservation account](https://www.roots.gov.sg/stories-landing/stories/transforming-clifford-pier-building-and-customs-house-the-fullerton-heritage/story), originally MUSE Oct–Dec 2012: square umbrella pavilions, retained original fascia, restored tower windows and added glass shopfronts.
- [Michael D. Hunter, aerial photograph, 2013](https://www.flickr.com/photos/25802865@N08/8919189702): mapped roof/site plan, rooflights, screened cooling equipment, narrow north pier roof and open water basin. Reference photos remain outside the repository.

Mapped main envelope: approximately **61.4 × 19.4 m**, local origin 103.8533772375 E, 1.2825417375 N, u bearing 92.8°, v bearing 182.8°. Recover this origin from the west endpoint of the longest southern mapped edge, at drawing (-19.75, 10.43) m. Plan dimensions are mapped; intermediate floor at 3.8 m, upper fascia at 7.3 m and screen top at 10 m are photographic estimates. Main OSM height is 10 m. Tower shaft diameter approximately 3.1 m and lookout diameter 7.9 m are mapped; tower's 23 m overall height follows the owner/NHB rather than OSM's 20 m lookout top.

Replace ways **395113920** (two-storey body), **406900754** (16 m tower shaft), **406900756** (zero-height outline named “Clifford Pier Lighthouse”, actually this control tower), **986973998** (16–20 m lookout), and **986973995** (approximately 9.4 × 29.8 m elevated north pier roof). There are no enclosing relations or inner rings for this site. The tower is at local (36.9, 5.9) m. The north pier projects from v=-9 to about -39 m; keep it open below its elevated roof. The central harbour basin to its west must remain water/open air. Separate low building **987031386** at the street-side promenade is retained, as are all SG-032 hotel parts and SG-035 pier parts.

## Implementation and acceptance plan

Use the existing kit: recessed shopfronts and window strips behind projecting bow-tie fascia, separate floor and roof slabs, slender columns, a grey louvred rooftop service enclosure with rooflights and cooling plant, a slender tower with flared octagonal glazed lookout, railings, and square umbrella roofs on the mapped northern pier. Preserve open water and the passage beneath the pavilions; explicitly collide elevated slabs and tower. Palette is daylight ivory, grey metal, desaturated green-grey glass and muted planting. No tenant logos are invented; building identification uses its actual name.

Verify exact replacements, independently located water/pavilion clearances, roof/tower descent, finite geometry, zero flicker and standard 65,000 triangle / 16 batch budgets. Inspect Tiny/day, WebGL/WebGPU, roof/side views and production city. Checklist remains `review` until shared acceptance.

## Verification

- Built on the generated anchor: **13,352 triangles, 10 material batches**, finite geometry and zero coplanar flicker.
- Seven new model checks cover exact source replacements, independent geographic clear-space and roof/tower probes, and concrete ribs below Clifford Pier's roof. Full targeted command: **91 pass**. Full `node --test` on a Linux/WSL LF snapshot with Node 24.16.0: **520 pass, zero failures**. No Windows POSIX-fixture failures are concealed by modifying unrelated tests.
- Eight Tiny/day × WebGL/WebGPU preview runs across the pair: no exceptions, shader errors or flicker. WebGPU runs explicitly report `WebGPUBackend` with a real adapter; WebGL runs report `WebGLBackend`. Principal and side elevations were also inspected separately against the cited images. Actual canvas text colours checked for the building signs.
- Loaded production city views at both anchors after the loading overlay disappeared and the camera settled: both model programs present, no load exceptions or landmark warnings. The browser emits only its known Windows `powerPreference` advisory in the city; it does not affect model rendering.
- Regenerated city: **16,001 → 15,995 generic solids (six removed, zero added)**; all existing landmark anchors and the entire tree collection unchanged. All source objects of this pair are replaced; separate way 987031386 and the SG-032 hotel/link remain. Total modelled-source count is 413.

Evidence: [Tiny overview](images/customs-house-overview.png), [daylight elevation](images/customs-house-front.png), [loaded city](images/customs-house-city.png).

Reproduce with a static server and:

```text
/tools/landmark-preview.html?model=customs-house&view=all
/tools/landmark-preview.html?model=customs-house&view=s&look=day
/tools/landmark-preview.html?model=customs-house&view=ne&backend=webgpu
/?look=tiny&at=customs-house&camera=map
```

```sh
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
node --test
```

## Limitations and acceptance

The rooftop plant, glazing, railings and planting are simplified. Three umbrella modules approximate the conserved north-pier roof; the reference's detailed planted patterns and terrace furniture are omitted. The north-pier roof has conservative collision within its footprint; tower collision uses inner prisms beneath its flared glazing. Ground is the city's flat datum, without underwater piles. The original room fit-out and tenant signs are omitted. Intermediate heights remain photographic estimates; the tower's 23 m overall height follows the owner/NHB.

Implementation is on `codex/sg-035-sg-036-waterfront`. Checklist state remains **review**, with shared-branch acceptance outstanding. Implementation PR link is added after creation.

