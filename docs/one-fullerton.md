# One Fullerton — SG-033

## Ownership and scope

Meta Muse / `01a1a1c3`, branch `datainvestor/take-two-checklist-buildings`, user-assigned 2026-11-03 (two-building task; the second building is Suntec City SG-215 — Six Battery Road SG-007 and Customs House SG-036 were dropped because the user reported them built by other agents). Checklist row SG-033 was unowned `todo`; no model or open PR existed.

Scope: the two-storey waterfront dining building at 1 Fullerton Road only. The Fullerton Hotel (SG-031), Fullerton Waterboat House (SG-034), Merlion Park, the promenade and the bay remain separate.

## Sources (consulted 2026-11-03; photographs are research only, none in the repo)

- [President's Design Award 2006, Fullerton Hotel & One Fullerton (Architects 61)](https://pda.designsingapore.org/award-recipients/2006/fullerton-hote-and-one-fullerton/): One Fullerton is the playful, open dining counterpart to the hotel; "its wave-like roof form contrasts to the more rigid structure of the Hotel"; wavy roofs inspired by the bay, an elliptical drum recalling vessels moored in the sea.
- [Fullerton Heritage, owner page](https://www.fullertonhotels.com/the-fullerton-heritage-singapore/properties/one-fullerton): "a graceful, modern two-storey waterfront development" facing Marina Bay.
- [Wikimedia Commons, "Singapore (SG), Merlion — 2019 — 4496"](https://commons.wikimedia.org/wiki/File:Singapore_(SG),_Merlion_--_2019_--_4496.jpg): dated 2019 bay elevation — long dark-glass body under large pale swooping roof shells, trees along the promenade, the Fullerton Hotel behind.
- [Wikimedia Commons, "One Fullerton sign"](https://commons.wikimedia.org/wiki/File:One_Fullerton_sign.jpg) and the 2024 Bistro Aseana photograph: white ONE FULLERTON lettering on the bay glass, ground-level dining frontage.
- OSM extract in `tools/data/singapore/osm_buildings.json` (© OpenStreetMap contributors, ODbL): mapped plan, parts and roof tags below.

## Mapped geometry and replacement boundary

One outline plus seven `building:part` ways inside it; no enclosing relation references them.

| OSM way | Tags that matter | Role in the model |
| --- | --- | --- |
| 46595394 | `name=One Fullerton`, `building:levels=2`, `height=12`, `roof:shape=skillion` | The curved waterfront outline (~165 m long, ~26 m wide, 4,752 m²) |
| 407926351, 407926353 | `height=12`, glass, flat roofs | Low flat links between the wave shells |
| 407926356, 407926371, 407926374 | `height=12`, glass, `roof:shape=skillion`, `roof:direction=19`, `roof:height=3` | Southern/middle wave-roof segments, sloping down toward NNE |
| 407926390 | `height=12`, glass, skillion, `roof:direction=199`, `roof:height=5` | The large northern shell, sloping down toward SSW |
| 407926388 | `height=12`, `min_height=8`, glass, flat | The raised elliptical drum/clerestory in the middle |

Registration: `id/model: one-fullerton`, `hide` exactly the eight ways above. The parts overlap each other (the mappers layered the shells), so the model does **not** extrude every part full-height: one recessed glass body stands on the outline, and each part ring becomes the roof element its tags describe, at its mapped height. Dimensions: total height **12 m (mapped)**; two storeys (mapped/owner); body top, shell bases and drum split (7.6 / 7.65 / 11.2 m) are **visual estimates** from the 2019 elevation, not surveyed. Shell drops and directions are the mapped `roof:height`/`roof:direction` values.

## Modelling contract

- Recessed dark-teal glass body (two storeys) under overhanging pale-silver wave shells; the shells are the recognition feature from the map camera.
- Raised drum with its own cap, flat links between shells, thin silver string courses, white ONE FULLERTON sign on the bay face as photographed.
- Collision: body at ground (automatic), explicit prisms for shells, links and drum so nothing descends through a roof; promenade and bay stay open.
- Finite geometry, zero coplanar flicker, < 65,000 triangles, ≤ 16 material batches. Tests probe independently located points (south/middle/north segments, drum, bay, road).

## Verification — 2026-11-03

- New `tests/landmark-one-fullerton.test.cjs` (3 tests) first failed on the absent model, then passed: exactly the eight mapped ways replaced (Fullerton Hotel/Waterboat House untouched), sloped shells and drum over independently located south/north/drum probes, roof collision with the bay and Fullerton Road open, finite geometry, zero flicker. **424 triangles, 6 material batches.** One Fullerton also joins the generic height loop in `tests/landmark-models.test.cjs`.
- Targeted guide suite plus the two new files and building-info: **99/99 pass**. Full Windows `node --test`: **512/520 pass**; the 8 failures are the documented platform fixtures (7 Overpass shell cases, 1 tile-worker), identical to the SG-034 baseline on the shared branch.
- Regenerated geodata vs `HEAD`: only `buildings` and `landmarks` keys change; landmarks 25 → 27 (this pair), mapped parts 302 → 410, trees identical.
- Rendered (headless Chrome, WebGL + WebGPU, Tiny + day) and compared with the 2019 Merlion photograph: layered silver shells over the dark glass curve, drum and sign read correctly; the loaded city shows the building on the promenade beside the Fullerton Hotel with no duplicate generic solid. Captures: [overview](images/one-fullerton-overview.png), [daylight bay front](images/one-fullerton-day.png), [loaded city](images/one-fullerton-city.png).

## Limitations

Shell curvature is approximated by straight skillion planes at the mapped drops/directions; interiors, outdoor dining furniture and planting are omitted; shell collision uses flat-topped volumes inside each shell footprint (up to the shell's high edge), as the guide allows for sloping roofs. The building stays `active` in the checklist until a PR is opened and the shared-branch acceptance criteria are met.
