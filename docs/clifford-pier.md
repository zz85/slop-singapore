# Clifford Pier — SG-035

Codex / bc2d, 3 November 2026. Exclusive claim: [PR #15](https://github.com/datainvestor/tiny-singapore/pull/15). Model period: restored Fullerton Heritage exterior, 2010 onward; no conjectural redevelopment.

## Sources and plan

- [Owner: Clifford Pier](https://www.fullertonhotels.com/the-fullerton-heritage-singapore/properties/clifford-pier), checked 2026-11-03: identity, 1933 date and 80 Collyer Quay address. Its [exterior photograph](https://image-tc.galaxy.tf/wijpeg-9u0zrlgi1osq7cf1rhatib4ig/tcp-exterior.jpg) shows the red gable, stepped west portal, open side arcades, lower flat veranda roofs and eastern waterfront walk. Photograph publication date is unstated.
- [NHB Singapore River Walk, 2018](https://www.roots.gov.sg/~/media/Roots/Files/singapore-river-walk/nhb_singpaore-river-walk_2018.pdf): column-free passenger hall, reinforced-concrete ribbon arches, sunray entrance and 1975–76 covered-deck extension; includes historic and 2016 elevations.
- [URA historic waterfront guide](https://www.ura.gov.sg/-/media/User-Defined/URA-Online/publications/research-resources/books-videos/historic_waterfront.pdf), 2013: restored site plan, coloured fanlights and conservation context.
- [NHB MUSE, 2015](https://www.nhb.gov.sg/~/media/nhb/files/resources/publications/muse%20sg/muse_issue01_2015-muse_issue_01_2015_online.pdf): ten concrete arch trusses, approximately 18.3 m span and 11 m overall height.
- [Michael D. Hunter, aerial photograph, 2013](https://www.flickr.com/photos/25802865@N08/8919189702): roof/site relationship to the hotel and Customs House. Reference files remain outside the repository.

The mapped main hall (way 407926383) is approximately 66.6 × 20.4 m. Its four-corner centroid is 103.853518225 E, 1.2839318 N. Drawing u points along the hall toward bearing 92.8°, v toward 182.8° (south). Derive the origin from that main ring, not the combined site's vertex-average anchor. Roof eaves at 7.5 m, ridge at 11 m, lower verandas at 4.9 m, entrance crown at 11.7 m and selective ornament are photographic estimates, not surveyed measurements. Mapped height 8 m omits the gable peak.

Replace ways **99348745** (zero-height site outline), **986973999** (0.5 m deck/outline), **407926383** (8 m hall), and building relation **13262097** (same three members, no inner rings). The deck outline extends north to an entrance projection and east to the waterfront promenade; it is a low deck, not a full-site wall. No relation-only rings are needed. SG-032 retains ways 184297025, 406900561 and **986973997**, its modern hotel link. The Fullerton Pavilion, waterfront basin, OUE properties and One Fullerton remain separate.

## Implementation and acceptance plan

Use a hollow hall with ten segmented concrete arches, recessed glass between outside piers, two independent gable slopes, lower north/south arcades, real west portal openings and Art Deco steps. Keep the principal hall floor and doorways passable. Give roofs explicit altitude-aware collision; approximate each slope with narrow conservative collision strips inside the visible roof. Palette: warm ivory plaster, pale trim, subdued grey bands, terracotta roof and muted green-grey glazing.

Verify generated replacement IDs, independently located entrance/hall/arcade clearances, roof descent, finite geometry, zero coplanar flicker, fewer than 65,000 triangles and at most 16 batches. Inspect four views, Tiny/day, both rendering backends and loaded city against the references. Checklist remains `review` until shared acceptance.

## Verification

- Built on the generated anchor: **10,299 triangles, 10 material batches**, finite geometry and zero coplanar flicker.
- Nine new model checks cover exact source replacements, independent geographic clear-space and roof/tower probes, concrete ribs below Clifford Pier's roof, upper side glazing and structural arch collision with clear doorways. Full targeted command: **93 pass**. Full `node --test` on a Linux/WSL LF snapshot with Node 24.16.0: **522 pass, zero failures**. No Windows POSIX-fixture failures are concealed by modifying unrelated tests.
- Eight Tiny/day × WebGL/WebGPU preview runs across the pair: no exceptions, shader errors or flicker. WebGPU runs explicitly report `WebGPUBackend` with a real adapter; WebGL runs report `WebGLBackend`. Principal and side elevations were also inspected separately against the cited images. Actual canvas text colours checked for the building signs.
- Loaded production city views at both anchors after the loading overlay disappeared and the camera settled: both model programs present, no load exceptions or landmark warnings. The browser emits only its known Windows `powerPreference` advisory in the city; it does not affect model rendering.
- Regenerated city: **16,001 → 15,995 generic solids (six removed, zero added)**; all existing landmark anchors and the entire tree collection unchanged. All source objects of this pair are replaced; separate way 987031386 and the SG-032 hotel/link remain. Total modelled-source count is 413.

Evidence: [Tiny overview](images/clifford-pier-overview.png), [daylight elevation](images/clifford-pier-front.png), [loaded city](images/clifford-pier-city.png).

Reproduce with a static server and:

```text
/tools/landmark-preview.html?model=clifford-pier&view=all
/tools/landmark-preview.html?model=clifford-pier&view=s&look=day
/tools/landmark-preview.html?model=clifford-pier&view=ne&backend=webgpu
/?look=tiny&at=clifford-pier&camera=map
```

```sh
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
node --test
```

## Limitations and acceptance

Restaurant furniture, fine relief sculpture and interior fittings are omitted; roof tiles are suggested by seams. The 10 concrete arches and façade arches use segmented beams. Recessed glazing encloses the long sides while the principal hall/portal and outdoor arcade probes remain clear. Gable collision uses conservative 0.25 m strips beneath the slopes; small ornamental arcade curves and interior ribs do not have individual fine collision; the deep entrance and east-end structural arches have per-segment collision preserving their openings. Flat city grade replaces detailed underwater piles and tidal levels. Elevation heights and colours remain photographic estimates.

Implementation is on `codex/sg-035-sg-036-waterfront`. Checklist state remains **review**, with shared-branch acceptance outstanding. Implementation and evidence: [PR #16](https://github.com/datainvestor/tiny-singapore/pull/16).


Independent read-only review found two Clifford Pier issues: missing upper side glazing and collision on the deep entrance arches. Both were reproduced with failing tests, corrected, and verified. Customs House had no additional actionable finding.
