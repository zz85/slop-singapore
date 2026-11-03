# Fullerton Waterboat House — SG-034

## Research and ownership

Research prepared by Codex / worktree `7239`, 3 November 2026, against shared
commit `633a269`. A GitHub PR search for `SG-034 OR Waterboat` returned no
competing work. The user explicitly assigned SG-034 and authorised autonomous
implementation on 3 November 2026. The checklist records this session as owner.

The implemented scope is the conserved building at 3 Fullerton Road and its
attached glass annexe/bridge. One Fullerton, the Fullerton Hotel, the riverside
garden, bridges and promenade remain separate.

## Sources

All links were consulted on 3 November 2026. Photographs are research references;
none are included in the repository or required at runtime.

- [Fullerton Heritage, owner description](https://www.fullertonhotels.com/the-fullerton-heritage-singapore/about-us):
  curved Art Deco front, basement, restored grey Shanghai plaster and the 2005
  glass-annexe intervention.
- [Minkke Architects, restoration project](https://www.minkkearchitects.com/fullerton-waterboat-house):
  the annexe is a distinct building joined to the historic house by a glazed
  bridge. Two daylight photographs show the street/side elevations, round
  windows, projecting shades, roof pavilion, terraces, stairs and annexe glazing.
  Photograph dates are unspecified; these document the restoration design,
  rather than establishing the current tenant or furnishings.
- [Architect photograph, street and river side](https://static.wixstatic.com/media/aecf80_f6ccf63df4fd4f389a6856ee4fd31a80~mv2_d_1600_1200_s_2.jpg).
- [Architect photograph, annexe](https://static.wixstatic.com/media/aecf80_4f291709f29946ba9493a06ea289a7e2~mv2_d_1600_1200_s_2.jpg).
- [Franzwood, project photographs](https://franzwood.com/fullerton-waterboat-house.html):
  the principal street front shows the rounded end, horizontal window bands,
  deep balcony, pale metal rails and building-name lettering. The photograph
  has seasonal decorations, which are outside the proposed model scope.
- [BERITA Mediacorp, 29 September 2022, street elevation photograph](https://berita.mediacorp.sg/singapura/usahawan-muda-melayu-islam-makin-berani-orak-langkah-kembangkan-perniagaan-bina-jenama-identiti-tersendiri-694516):
  a dated principal-elevation reference for the plaster front, upper parapet,
  projecting window shades, curved balcony and tower. Tenant fittings and
  temporary furniture are not reproduced.
- [URA, Historic Waterfront, 2013 / second edition 2018](https://www.ura.gov.sg/-/media/User%20Defined/Conservation%20Portal/Articles/HistoricWaterfront_PosterPamphlet_A1_13mar18_A.PDF):
  location plan and conservation details. The text was accessible; its page
  images could not be retrieved during this research, so they have not been
  used as inspected visual evidence.
- [OSM way 172931401](https://www.openstreetmap.org/way/172931401), in the repository's
  25 October 2026 source snapshot: mapped plan and nominal height. Data
  copyright OpenStreetMap contributors, ODbL.
- [Esri World Imagery roof/site image](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/260269/413391):
  inspected aerial showing the western historic wing, taller southern end and
  broad lower annexe to the east. The service's point-identify metadata at
  103.853535, 1.287066 reports Vantor WV02, acquisition **7 May 2025**, sample
  resolution 0.3 m, source resolution 0.5 m and source accuracy 8.47 m. Use for
  relative roof arrangement, not survey alignment; OSM controls placement.

Published construction dates differ between sources. The model covers
the restored exterior, so it must not infer a construction date or reproduce
an unverified tenant sign from those conflicting accounts.

## Mapped geometry and replacement boundary

The core extract contains one relevant top-level building way, **172931401**,
with 22 distinct footprint vertices, no inner rings, `building=yes`, `height=11`
and `layer=1`. No enclosing relation referencing this way was found in the
extract. There are no separately mapped annexe, roof or canopy building parts
within its bounds.

| Measurement | Value | Basis |
| --- | --- | --- |
| Latitude range | 1.2869244–1.2872083 | Mapped |
| Longitude range | 103.8534032–103.8536656 | Mapped |
| East/west extent | Approximately 29.2 m | Converted from mapped coordinates |
| North/south extent | Approximately 31.4 m | Converted from mapped coordinates |
| Nominal building height | 11 m | OSM tag; not surveyed |

The mapped ring is a plan constraint, **not a full-height extrusion**:
its combined envelope includes portions at different levels. The historic
walls, lower annexe, bridge and open exterior areas are separate masses.

Registration: `id/model: fullerton-waterboat-house`, `hide: [172931401]`; no
`hideRelations`. Generated anchor: world **(26, -408) m**, in the Singapore
frame with bearing 31.8 degrees. All geometry is relative to that anchor.

The model recovers the southernmost mapped vertex (103.8535434, 1.2869244),
which has drawing coordinates approximately (0.935, -15.657) m. The drawing
origin is 103.853535, 1.287066, with true east/north axes from `kit.compass()`.
This basis is reflected relative to world x/z; box yaw is calculated from the
transformed tangent. It does not assume that the generated anchor is the
physical centre or that an arbitrary ring index is stable.

## Architectural estimates and implementation

These dimensions are **visual estimates**, not surveyed elevations. They
describe the restored exterior documented by the architect, the 2022 street
photograph and the 2025 aerial; they are not a claim about November 2026 tenants.

| Component | Model dimensions / elevation | Basis |
| --- | --- | --- |
| Western historic wing | Walls to 7.32 m; roof terrace 7.34–7.68 m | Photograph estimate inside mapped plan |
| Street wall recess | 0.78 m behind the mapped balcony envelope | Visual depth estimate |
| Street balcony | Slab 3.65–3.87 m; railing to approximately 4.95 m | Photograph estimate |
| Main parapet and rails | Parapet/coping to 8.165 m; outer rails to approximately 9.25 m | Photograph estimate |
| Southern rounded end | Upper storey to 10.63 m; coping/surface to 11.17 m | OSM's nominal 11 m cross-checked against photographs |
| Rounded end width | Approximately 8 m; rounded source-guided outline | Mapped outer bounds plus visual subdivision |
| Flagpoles | Highest point 14.4 m | Photograph estimate, distinct from building height |
| Eastern glass annexe | Glazing to 5.94 m; roof/surface to 6.37 m | Aerial arrangement and architect's side views |
| Glazed bridge | 3.4 by 2.5 m deck, 3.50–3.78 m; roof 5.80–6.03 m | Photograph estimate |
| House/annexe opening | Approximately 3 m between their main roof edges | Source-guided plan estimate; no enclosing slab |

The historic body follows the western mapped curve and has a taller rounded
southern roof. Thin continuous floor/shade plates and mitred rim segments avoid
overlapping caps at corners. Window glazing sits behind raised frames and deep
shades; the street balcony, roof rails, portholes and stable building-name sign
provide the principal small details. The glass annexe is lower and has its own
roof, frame rhythm and raised connection. Materials use existing Tiny/day
pairing; the kit and runtime loader are unchanged.

Ground masses and explicit elevated volumes give the house, annexe, bridge,
balcony and principal shade plates collision. The bridge has no ground-to-roof
collider. The independently located gap and surrounding paths remain clear.

## Modelling contract

- Existing landmark kit and city generator; no new asset or material pipeline.
- Curved historic front, round end, stepped flat roofs, roof pavilion and
  terraces; recessed framed windows behind projecting shades, balcony slabs
  and rails; grey plaster and pale trim with restrained blue-grey glazing.
- Model the lower annexe and glazed connection separately. Preserve the
  documented gaps and the pedestrian ground beneath elevated connections.
- Use existing sign support for the stable building name. Exclude unverified
  current tenants and temporary furniture/decorations.
- Test exact replacement IDs, independently located solid/open spaces,
  roof and bridge collision, finite geometry and mapped bounds. Keep below
  65,000 triangles and 16 material batches, with zero coplanar flicker.
- Regenerate city data and inspect the actual loaded city alongside isolated
  roof, front and side views in Tiny/day and WebGL/WebGPU.
- Retain `review` until the checklist's shared-branch acceptance criteria are
  met. Add the actual PR URL only after a PR exists.

## Baseline verification

- Targeted guide command: **74 pass, 0 fail** on 3 November 2026.
- Full Windows `node --test`: **460 tests, 452 pass, 8 fail** before changes.
  Existing failures are the tile-worker test in `tests/city-tiles.test.mjs` and
  seven shell-fixture cases in `tests/overpass.test.mjs` (complete JSON with
  whitespace; failed transfer after HTTP 200; malformed JSON; HTTP error;
  Overpass runtime error; missing elements; endpoint retry). They match the
  platform limitation already described by the shared modelling guide.

## Final verification — 3 November 2026

- **84/84 targeted checks pass** after rebasing onto shared commit `0733996`, including four new tests using the real
  generated anchor and kit output. Those four tests first failed for the absent
  anchor. Further checks reproduced missing balcony collision before it was
  added, and corner overlaps before their geometry was corrected.
- **513/513 full-suite tests pass** under Ubuntu 24.04 / Node 24.16.0, using an
  LF-normalised temporary snapshot of this worktree outside the repository.
- Before the integration rebase, the full Windows suite had **456 pass and the
  same 8 baseline fixture failures** listed above; the full Linux suite then
  passed 464/464. No unrelated fixture or shared-kit changes were made.
- **12,667 triangles, 12 material batches, 948 recorded parts**, finite bounds,
  and **zero coplanar flicker pairs**.
- Generated data comparison against shared commit `0733996`: **16,002 → 16,001** generic buildings; exactly one
  old 11 m solid removed, none added. All pre-existing landmarks and every tree
  remain unchanged. The production city loads the new model at its true anchor
  with no remaining generic mass at the site.
- Rendered and inspected Tiny/day in WebGL and native WebGPU (an actual WebGPU
  adapter was obtained); roof, front, river side and complete-model views agree.
  No preview exceptions, shader warnings or flicker warnings were emitted.
- The loaded Tiny city was captured after its loading overlay disappeared and
  camera settled. No page errors or landmark warnings; Chrome emitted only its
  existing Windows `powerPreference` advisory.
- Independent read-only code review: no Critical or Important findings. Additional
  collision sampling covered main roofs, annexe, bridge and street balconies.

Useful captures: [Tiny overview](images/fullerton-waterboat-house-overview.png),
[daylight street front](images/fullerton-waterboat-house-day.png),
[WebGPU Tiny](images/fullerton-waterboat-house-webgpu.png),
[WebGPU daylight](images/fullerton-waterboat-house-webgpu-day.png), and
[loaded city at map distance](images/fullerton-waterboat-house-city.png).

Reproduce with a static server (shown here on port 18034):

```text
/tools/landmark-preview.html?model=fullerton-waterboat-house&view=all
/tools/landmark-preview.html?model=fullerton-waterboat-house&view=w&look=day
/tools/landmark-preview.html?model=fullerton-waterboat-house&view=all&backend=webgpu
/?look=tiny&at=fullerton-waterboat-house&camera=map
```

```sh
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
node --test
```

## Limitations and acceptance

The basement/riverbank grade is simplified to the city's flat ground level;
there is no terrain excavation or interior restaurant model. Façade curvature,
annexe roof construction, planting and rail spacing are selectively simplified
for map viewing. Internal divisions, heights and fittings remain visual
estimates. The existing kit uses scanline strips for irregular collision volumes
and documents up to 1 m boundary approximation; tiny edge misses at the rounded
coping remain within that approximation. Interior roof and clear-space probes
are covered.

Implementation and evidence are ready locally. **No PR has been opened and this
building is not marked done**: the checklist retains this session's active
ownership until integration/review. Add the real PR link when opening a landmark
PR, then use `review` until shared-branch acceptance. The
[implementation plan](superpowers/plans/2026-11-03-fullerton-waterboat-house.md)
records the completed work.
