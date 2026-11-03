# Singapore building detailing checklist

This is the shared work queue for Codex, Claude Code, Meta Muse and human contributors. The goal is a recognisable, closely observed Singapore miniature at **Tiny Warsaw's level of architectural care**: correct footprints, proportions, rooflines, façade depth, colours and important open spaces, legible both from the map and nearby. Follow the [modelling guide](landmark-modeling/README.md); a name in this list is a research target, not a finished architectural brief.

**The whole CBD is required.** The named entries below are the starting inventory, not a claim that every CBD property has already been enumerated. The mandatory coverage passes at the end find and add the remaining buildings, including unnamed midrises and shophouses. Finishing the famous towers alone does not finish the CBD.

## Scope and priorities

- **P0 — complete CBD:** Raffles Place, Clifford Pier/Collyer Quay, Cecil/Robinson/Shenton, Maxwell/Tanjong Pagar/Anson, Marina Bay's Central and Bayfront areas, plus their street-level fabric. Use [URA's Downtown Core guidance and boundary plan](https://www.ura.gov.sg/guidelines/urban-design/downtown-core/) to settle boundary questions. These work areas are practical groupings, not new planning boundaries.
- **P1 — wider downtown and the requested architectural landmarks:** Civic District, Marina Centre, Beach Road/Bugis, Chinatown, the river, Orchard, and the explicitly requested ION Orchard, VivoCity, The Star Vista, The Colonnade and The Interlace.
- **P2 — island expansion:** distinctive housing, cultural, transport, commercial and institutional buildings beyond downtown. Start these alongside the CBD when assigned; P0 must still receive complete coverage.

The initial inventory was assembled on **3 November 2026** from the [city registration](../tools/city/cities/singapore.mjs), [mapped building extract](../tools/data/singapore/osm_buildings.json), existing source notes and the references below. Recheck identity, aliases, construction status and reference dates before modelling. Use a documented as-built period; do not silently mix demolished buildings, construction sites and proposed finished designs. Do not substitute an architect's future rendering for evidence of what is built.

## Permanent numbers and ownership

`SG-001` is a permanent task ID. Use its numeric suffix for even/odd or range assignments. Never renumber, recycle or move an ID to another property, even after completion. Add entries in unused numbers within the relevant band: **001–199 CBD, 201–299 wider downtown, 301–399 Orchard, 401–899 island landmarks, 901–999 coverage passes**. Skip occupied numbers. If a band fills, append a new numbered band and document it here; existing assignments keep their IDs.

Each building row covers one building or an explicitly named, bounded complex. A hotel's tower inside a listed complex is not another task. Check aliases and neighbouring entries before adding a row. Split large complexes into separately numbered, non-overlapping scopes **before** assigning them to different sessions, and record the relationship in both rows. Small shophouse batches must state their street side, address range and OSM objects; a whole neighbourhood is not one modelling task.

**Recommended allocation:** give each agent disjoint ID ranges, then record a claim for each session. Even/odd works for two pools. With three pools, numeric suffix modulo 3 is disjoint too (for example remainder 1 / remainder 2 / remainder 0). A third agent working “from the bottom” can still collide with both even and odd pools unless you reserve a separate range. Allocation is managed by the user; this document does not assign any agent automatically.

Before starting a building:

1. Sync with the shared integration branch. Read this checklist, that building's existing source notes, registration/model code and any open PR for the same ID or site. A private worktree's copy is not a shared lock.
2. Pick an unowned `todo` or `audit` row within the user's allocation. Confirm ownership either through the user's explicit assignment or a **claim commit merged into the shared branch before modelling**. If using a claim-only PR, wait for its merge; opening it alone is not an exclusive claim. Resolve competing claims before starting.
3. Set the row to `active`; fill `Owner / branch / PR` with agent + session identifier, branch, Singapore start date and claim/model PR link when available. For example: `Codex / session-abc; codex/sg-004-capitaspring; 2026-11-03; PR #…`. Record exact replacement ways/relations and any shared podium boundary in the building's source notes before geometry work.
4. Keep changes focused on the claimed site. Coordinate edits to shared registration, kit, test files and generated geodata; a building claim does not grant exclusive ownership of those files. Regenerate combined geodata after rebasing, rather than resolving its packed data by hand.
5. On interruption or blockage, leave an actionable handover in the row or its linked notes. Do not reclaim another session merely because its date is old; confirm release with the user/owner or a merged handover. Release abandoned work explicitly and retain its branch/PR link.

| State | Meaning |
| --- | --- |
| `todo` | No custom model is established by this inventory; research and model it. Generic OSM geometry may already be present. |
| `audit` | Custom geometry already exists. Inspect and reuse it; establish what still needs work against the current guide. This is not an instruction to rebuild it. |
| `active` | Claimed by the named session and being worked on. |
| `review` | Implementation and verification evidence are in the linked PR; checkbox remains empty. |
| `blocked` | Named dependency or unresolved scope/era prevents progress; explain it and link any work. |
| `done` | Accepted on the shared branch with the completion evidence below; checkbox is `[x]`. |

The 16 sites with existing custom geometry start as `audit`, with links to their existing implementation/notes. This conservative seed does **not** invalidate prior verification or assert those models are deficient. Their audit may simply link the earlier evidence and record acceptance. No new building has been marked complete by this documentation change.

## Update this checklist in every landmark PR

Every PR that adds, changes, audits or fixes a landmark must update its row **in that PR**, including follow-up fixes to a `done` entry. Mention its `SG-…` ID in the PR title or description. Claim-only PRs update ownership; implementation PRs set `review`, link their evidence and retain the owner. Reopen a completed row to `active`/`review` if its acceptance criteria are no longer met. Unrelated PRs do not need a checklist change.

Before merging an implementation PR, the reviewer/user may change its row to `done` and check it in that PR once all criteria are satisfied. Acceptance takes effect when it merges; otherwise use a follow-up checklist PR after merge. A screenshot, passing unit tests, or an agent saying “finished” alone is insufficient. Keep the accepted PR link and source-note link in the row. Never invent a PR number; add the real link after opening the PR.

A completed building needs all of the following, with evidence in `docs/<landmark-id>.md` and the PR:

- Dated roof/site, principal elevation and side/courtyard references; source links; exact OSM way/relation replacements; dimensions with measured, mapped and estimated values distinguished.
- Correct silhouette, volumes, setbacks, roof, façade depth and palette; open courts, passages and neighbouring buildings preserved. Review at normal map distance as well as close-up against the references.
- Existing landmark kit and generator integration, regenerated output where needed, no duplicate generic solids, no missing neighbours and correct placement in the live city.
- Meaningful geometry/collision tests, clear spaces and elevated solids checked, finite geometry, no coplanar flicker, and triangle/material budgets or a documented justified exception.
- Rendered Tiny and daylight comparisons, WebGL and WebGPU checks, plus the loaded city view; useful preview captures/links and any material limitations recorded. Run the guide's targeted and full checks and distinguish known platform failures.

**Outside the core:** check the configured detail box **and its fetched margin**, the island source extract and the streamed tile containing the site. Establish a real anchor and remove only the replaced generic geometry from every applicable path. The core `hide` list does not by itself suppress island-tile buildings. Missing source coverage or tile support is an integration dependency to solve or record as `blocked`; never accept an origin-anchored model, a duplicate tower, or an isolated preview that does not appear correctly in the city. Coordinate shared streaming changes before several sessions attempt them independently.

## P0 — Raffles Place and Collyer Quay

Columns are deliberately row-local: update your row rather than maintaining shared progress totals. `—` means unclaimed. All unchecked rows remain actionable.

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-001 | [ ] | UOB Plaza — both towers and shared podium | Offset shafts, crowns, raised banquet hall; [existing model](../js/landmark-models/uob-plaza.js); add standalone source notes | audit | — |
| SG-002 | [ ] | One Raffles Place — both towers and podium | Different tower profiles and crowns; [existing model](../js/landmark-models/one-raffles-place.js); add source notes | audit | — |
| SG-003 | [ ] | Republic Plaza | Octagonal shaft, sloping corners and crown; [existing model](../js/landmark-models/republic-plaza.js); add source notes | audit | — |
| SG-004 | [ ] | CapitaSpring | Split fin façade, open Green Oasis and Sky Garden, 177 m podium with City Room; [model](../js/landmark-models/capitaspring.js), [sources and verification](capitaspring.md), [render](images/capitaspring-overview.png) | review | Claude Code / 66bc9fa1; `claude/building-checklist-progress-ceabc0`; 2026-11-03; [PR #10](https://github.com/datainvestor/tiny-singapore/pull/10) |
| SG-005 | [ ] | Ocean Financial Centre | Curved crown over a sail plan, banded glass, stainless colonnade and folded canopy; Keppel sign (ANZ moved out October 2026); [model](../js/landmark-models/ocean-financial-centre.js), [sources and verification](ocean-financial-centre.md), [render](images/ocean-financial-centre-overview.png) | review | Claude Code / 66bc9fa1; `claude/building-checklist-progress-ceabc0`; 2026-11-03; [PR #10](https://github.com/datainvestor/tiny-singapore/pull/10) |
| SG-006 | [ ] | OCBC Centre, Centre East and Centre South | Slab between half-round granite cores, three cantilevered office stacks over open girder floors, OCBC signs on the crown; Centre East, Centre South and the car-park podium; [model](../js/landmark-models/ocbc-centre.js), [sources and verification](ocbc-centre.md), [render](images/ocbc-centre-overview.png) | review | Claude Code / a92834f5; `claude/add-downtown-buildings-7d00e4`; 2026-11-03; [PR #11](https://github.com/datainvestor/tiny-singapore/pull/11) |
| SG-007 | [ ] | Six Battery Road | Stepped granite/glass massing and crown | todo | — |
| SG-008 | [ ] | Singapore Land Tower | Current recladding, vertical rhythm and roof | todo | — |
| SG-009 | [ ] | Maybank Tower | Tapered crown, façade and riverside base | todo | — |
| SG-010 | [ ] | Bank of China Building — historic and newer towers | Separate eras, proportions and rooflines | todo | — |
| SG-011 | [ ] | CIMB Plaza / 30 Raffles Place — former Chevron/Caltex House and Change Alley podium | One site: tower and retail podium, including differently named OSM parts; [site identity](https://cimbplaza.com.sg/contact-us/) | todo | — |
| SG-012 | [ ] | Prudential Tower | Curving upper profile, roof and street base | todo | — |
| SG-013 | [ ] | Clifford Centre redevelopment site, 24 Raffles Place | Establish dated as-built/construction stage; separate from CIMB Plaza SG-011 | todo | — |
| SG-014 | [ ] | GSH Plaza — former Equity Plaza | Tower setbacks, cladding and podium | todo | — |
| SG-015 | [ ] | The Arcade, Raffles Place | Narrow footprint and recognisable street façade | todo | — |
| SG-016 | [ ] | MYP Centre, Battery Road | Façade bands, roof and tight adjoining boundaries | todo | — |
| SG-017 | [ ] | 6 Raffles Quay | Tower/podium proportions and roof plant | todo | — |
| SG-018 | [ ] | 16 Collyer Quay — former Hitachi Tower | Façade grid and waterfront silhouette | todo | — |
| SG-019 | [ ] | Tung Centre | Bay-facing elevation and roof | todo | — |
| SG-020 | [ ] | AIA Tower, Robinson Road | Distinct tower shape and corner treatment | todo | — |
| SG-021 | [ ] | 20 Collyer Quay — former HSBC Building | Waterfront façade and current roof treatment | todo | — |
| SG-022 | [ ] | Bharat Building | Midrise proportions and street frontage | todo | — |
| SG-023 | [ ] | Ascott Raffles Place — former Asia Insurance Building | Heritage tower, stepped crown and corner details | todo | — |
| SG-024 | [ ] | Hong Leong Building | Repeated bands, slab proportions and podium | todo | — |
| SG-025 | [ ] | City House | Tower/podium, street corners and cladding | todo | — |
| SG-026 | [ ] | Capital Square — modern office/podium only | Tower, setbacks; assign adjoining conserved terraces separately | todo | — |
| SG-027 | [ ] | Far East Square — conserved complex | Roofscape, pavilions and open internal lanes | todo | — |
| SG-028 | [ ] | Great Eastern Centre | Tower and curved podium street edge | todo | — |
| SG-029 | [ ] | One George Street | Tower form, planted terraces and podium openings | todo | — |
| SG-030 | [ ] | Raffles Place MRT — historic park entrances A and B | Roof tiers, verandas, openings; [source notes](raffles-place-mrt.md) | audit | — |
| SG-031 | [ ] | The Fullerton Hotel | Colonnade, roofs, atrium and pool terrace; [source notes](fullerton-hotel.md) | audit | — |
| SG-032 | [ ] | The Fullerton Bay Hotel — guestroom block and link | Sloping glass, roof pool; excludes Clifford Pier; [source notes](fullerton-bay-hotel.md) | audit | — |
| SG-033 | [ ] | One Fullerton | Low waterfront massing, terraces and canopies | todo | — |
| SG-034 | [ ] | Fullerton Waterboat House | Rounded end, recessed windows/shades, terraces and separate glass annexe/link; [sources and verification](fullerton-waterboat-house.md), [render](images/fullerton-waterboat-house-overview.png); 84 targeted / 513 Linux checks pass | active | Codex / 7239; `codex/sg-034-fullerton-waterboat-house`; user-assigned 2026-11-03; PR being prepared, shared-branch acceptance pending |
| SG-035 | [ ] | Clifford Pier | Open hall, arched structure and roof; coordinate hotel link with SG-032 | todo | — |
| SG-036 | [ ] | Customs House and its harbour-control tower | Low wings and separate slender tower | todo | — |
| SG-037 | [ ] | OUE Bayfront, OUE Tower and OUE Link | Separate waterfront volumes and bridge clearances | todo | — |
| SG-038 | [ ] | Yueh Hai Ching Temple | Twin halls, decorated roofs and open forecourt | todo | — |
| SG-039 | [x] | Lau Pa Sat | Octagonal hip/nave roof, broad airwells, ironwork and clock; [sources and verification](lau-pa-sat.md), [render](images/lau-pa-sat-overview.png) | done | Codex / 18e5; `codex/sg-039-sg-242-heritage-landmarks`; 2026-11-03; [PR #7](https://github.com/datainvestor/tiny-singapore/pull/7) |

## P0 — Marina Bay, Central and Bayfront

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-040 | [ ] | Marina Bay Financial Centre — three office towers, Residences and shared podium (Marina Bay Suites stands across Straits View, outside this site) | Offset glass slabs with slanted crowns, open plaza and pool deck, the banks' signs with their logos; [model](../js/landmark-models/marina-bay-financial-centre.js), [sources and verification](marina-bay-financial-centre.md), [render](images/marina-bay-financial-centre-mbs.jpg) | review | Claude Code / 778f1e79; `claude/marina-bay-financial-centre-model-b61e72`; 2026-11-03; [PR #8](https://github.com/datainvestor/tiny-singapore/pull/8) |
| SG-041 | [ ] | Asia Square — both towers and shared podium, including Westin volume | Twin profiles, podium and roof; [existing model](../js/landmark-models/asia-square.js); add source notes | audit | — |
| SG-042 | [ ] | Marina One — office/residential towers and Green Heart | Garden void, louvres and bridging; [source notes](marina-one.md) | audit | — |
| SG-043 | [ ] | One Raffles Quay — North/South towers and podium | North Tower turned over the MRT tunnels with its lantern blade and raking lobby, South Tower with Deutsche Bank's sign, bronze cooling plant on columns over the open plaza; [model](../js/landmark-models/one-raffles-quay.js), [sources and verification](one-raffles-quay.md), [render](images/one-raffles-quay-overview.png), [city](images/the-sail-one-raffles-quay-city.jpg) | review | Claude Code / a92834f5; `claude/add-downtown-buildings-7d00e4`; 2026-11-03; [PR #11](https://github.com/datainvestor/tiny-singapore/pull/11) |
| SG-044 | [ ] | The Sail @ Marina Bay — both towers | Glass sails and pale leaves meeting at a white mast and boom, the pointed glass tip and sloping crown, the club deck on the podium and the open drop-off between the towers; [model](../js/landmark-models/the-sail.js), [sources and verification](the-sail.md), [render](images/the-sail-overview.png), [city](images/the-sail-one-raffles-quay-city.jpg) | review | Claude Code / a92834f5; `claude/add-downtown-buildings-7d00e4`; 2026-11-03; [PR #11](https://github.com/datainvestor/tiny-singapore/pull/11) |
| SG-045 | [ ] | IOI Central Boulevard Towers | Unequal towers, sky park and bridges; [owner reference](https://www.ioiproperties.com.sg/portfolio/ioi-central-boulevard-towers) | todo | — |
| SG-046 | [ ] | Marina Bay Sands — hotel towers and SkyPark | Leaning legs, terraces, deck and pool; [existing legacy implementation](../js/singapore-landmarks.js); add source notes | audit | — |
| SG-047 | [ ] | Marina Bay Sands — Shoppes and convention/exhibition podium | Roof folds, glazed atria, entrances and water edge; excludes SG-046 | todo | — |
| SG-048 | [ ] | ArtScience Museum | Petal volumes, supports and reflecting pool | todo | — |
| SG-049 | [ ] | Apple Marina Bay Sands pavilion | Glazed sphere, louvres and waterfront connection | todo | — |
| SG-050 | [ ] | Supertree Grove and Silver Garden Supertrees / OCBC Skyway | Branching canopies, planting and bridge; [legacy implementation](../js/singapore-landmarks.js); add source notes | audit | — |
| SG-051 | [ ] | Gardens by the Bay — Flower Dome | Ribbed asymmetric shell and low service edges | todo | — |
| SG-052 | [ ] | Gardens by the Bay — Cloud Forest | Taller inclined shell, ribs and entrance | todo | — |
| SG-053 | [ ] | Gardens by the Bay — Bayfront Plaza / Floral Fantasy building | Roof shape and pedestrian openings; excludes conservatories | todo | — |
| SG-054 | [ ] | Marina Barrage — visitor/operations building | Swept grass roof, courtyard and ramps | todo | — |
| SG-055 | [ ] | Marina Bay Cruise Centre Singapore | Angular roof and two terminal arms | todo | — |
| SG-056 | [ ] | Red Dot Design Museum, Marina Boulevard | Angular glazed pavilion; not former Maxwell Road premises | todo | — |
| SG-057 | [ ] | Louis Vuitton Island Maison — north Crystal Pavilion, Marina Bay Sands | Faceted glass envelope and waterfront base; [architect reference](https://www.safdiearchitects.com/projects/marina-bay-sands-crystal-pavilions); excludes mall interiors | todo | — |
| SG-058 | [ ] | One Marina Boulevard / NTUC Centre | Tower, crown, podium and frontage | todo | — |
| SG-059 | [ ] | Marina View development — W hotel / residences complex | Verify dated as-built stage and mapped names; no speculative finished massing | todo | — |

## P0 — Robinson Road, Cecil Street and Shenton Way

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-060 | [ ] | CapitaGreen | Finned glass with planting, corner sky terraces, glazed cage and red wind catcher, raised block over an open plaza; [model](../js/landmark-models/capitagreen.js), [sources and verification](capitagreen.md), [render](images/capitagreen-overview.png), [city](images/capitagreen-capitaspring-ofc-city.jpg) | review | Claude Code / 66bc9fa1; `claude/building-checklist-progress-ceabc0`; 2026-11-03; [PR #10](https://github.com/datainvestor/tiny-singapore/pull/10) |
| SG-061 | [ ] | 18 Robinson | Faceted tower, sky garden and split podium | todo | — |
| SG-062 | [ ] | Capital Tower | Banded plaza bay with its slot and glass funnel, stone wings, the curved glass tier, China Club crown and CapitaLand sign; the car park with its pool deck; [model](../js/landmark-models/capital-tower.js), [sources and verification](capital-tower.md), [render](images/capital-tower-overview.png) | review | Claude Code / a92834f5; `claude/add-downtown-buildings-7d00e4`; 2026-11-03; [PR #11](https://github.com/datainvestor/tiny-singapore/pull/11) |
| SG-063 | [ ] | SGX Centre — both blocks | Paired towers, fins and podium | todo | — |
| SG-064 | [ ] | OUE Downtown — both towers and Downtown Gallery | Unequal slabs, window bands and podium roof terraces | todo | — |
| SG-065 | [ ] | UIC Building and V on Shenton | Distinguish office/residential volumes, curved façades and podium | todo | — |
| SG-066 | [ ] | One Shenton — both towers and podium | Gold/blue panels, staggered heights and roof gardens | todo | — |
| SG-067 | [ ] | Robinson 77 | Bands, setbacks and street base | todo | — |
| SG-068 | [ ] | Robinson Centre | Narrow tower, façade and roof | todo | — |
| SG-069 | [ ] | Robinson Point | Corner form and cladding | todo | — |
| SG-070 | [ ] | Afro-Asia building, Robinson Road | Current building era, façade fins and podium | todo | — |
| SG-071 | [ ] | The Octagon | Eight-sided tower and street-level base | todo | — |
| SG-072 | [ ] | Tong Eng Building | Tower proportions, window rhythm and podium | todo | — |
| SG-073 | [ ] | Keck Seng Tower | Main slab, crown and corner frontage | todo | — |
| SG-074 | [ ] | SBF Center | Office mass, planted terraces and podium | todo | — |
| SG-075 | [ ] | GB Building | Slab form, banded façades and base | todo | — |
| SG-076 | [ ] | Oxley Tower | Tower/podium separation and glass profile | todo | — |
| SG-077 | [ ] | The Clift | Residential shaft, roof and lower setbacks | todo | — |
| SG-078 | [ ] | Fraser Tower | Rounded tower, green terraces and low pavilion | todo | — |
| SG-079 | [ ] | 158 Cecil Street | Recessed façade, roof and ground frontage | todo | — |
| SG-080 | [ ] | Guoco Tower — office/Wallich tower, hotel block and podium | Stacked masses and public base; [existing model](../js/landmark-models/guoco-tower.js); add source notes | audit | — |
| SG-081 | [ ] | Solitaire on Cecil | Current redevelopment, stepped terraces and façade | todo | — |
| SG-082 | [ ] | Bangkok Bank Building, Cecil Street | Distinct façade, base and roof | todo | — |
| SG-083 | [ ] | Tokio Marine Centre | Vertical façade and street-level proportions | todo | — |
| SG-084 | [ ] | Wing On Life Building | Midrise envelope and repeated windows | todo | — |
| SG-085 | [ ] | Cecil Court | Footprint, façade and roof plant | todo | — |
| SG-086 | [ ] | 76 Shenton | Residential tower, balconies and podium | todo | — |
| SG-087 | [ ] | Shenton House site | Verify standing/construction/replacement era before choosing geometry | todo | — |
| SG-088 | [ ] | Singapore Conference Hall | Folded roofs, exposed structure and forecourt | todo | — |
| SG-089 | [ ] | Singapore Chinese Cultural Centre | Layered elevations, roof garden and podium | todo | — |
| SG-090 | [ ] | MAS Building | Façade rhythm, tower/podium and roof profile | todo | — |
| SG-091 | [ ] | The Skywaters / former AXA Tower site | Establish dated as-built stage; do not retain old tower beside replacement | todo | — |
| SG-092 | [ ] | EON Shenton | Offset blocks, sky terraces and podium | todo | — |
| SG-093 | [ ] | 80 Robinson Road — paired office blocks | Separate profiles, façade rhythms and shared base | todo | — |
| SG-094 | [ ] | Robinson Suites | Slender tower, balconies and roof | todo | — |
| SG-095 | [ ] | Finexis Building | Midrise street face and setbacks | todo | — |
| SG-096 | [ ] | SIF Building | Façade, corners and rooftop massing | todo | — |
| SG-097 | [ ] | MYP Plaza | Envelope, glazing and roof | todo | — |
| SG-098 | [ ] | The Globe, Cecil Street | Narrow frontage, massing and roof | todo | — |
| SG-099 | [ ] | HB Robinson | Individual elevation and street alignment | todo | — |

## P0 — Tanjong Pagar, Maxwell and Anson

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-100 | [ ] | International Plaza | Tower and broad podium; verify redevelopment status | todo | — |
| SG-101 | [ ] | Bestway Building, Prince Edward Road site | Low office blocks; establish standing/redevelopment era | todo | — |
| SG-102 | [ ] | Mapletree Anson | Tower slabs, fins and entrance canopy | todo | — |
| SG-103 | [ ] | Twenty Anson | Façade, roof and public base | todo | — |
| SG-104 | [ ] | Anson House | Clipped tower form and window bands | todo | — |
| SG-105 | [ ] | Springleaf Tower | Tower/podium and distinctive façade | todo | — |
| SG-106 | [ ] | Hub Synergy Point | Current tower, curved glass and stepped base | todo | — |
| SG-107 | [ ] | Newport Plaza — former Fuji Xerox site | Office/residential/podium scope; establish dated as-built stage | todo | — |
| SG-108 | [ ] | Keppel South Central | Current tower, crown and green podium | todo | — |
| SG-109 | [ ] | Southpoint | Tower form, window pattern and podium | todo | — |
| SG-110 | [ ] | M Hotel Singapore | Hotel slab, lower wings and street canopy | todo | — |
| SG-111 | [ ] | Jit Poh Building | Window grid, roof and street face | todo | — |
| SG-112 | [ ] | Genting Centre | Midrise envelope and façade bands | todo | — |
| SG-113 | [ ] | ABI Plaza site | Verify redevelopment era; document surviving/replacement geometry | todo | — |
| SG-114 | [ ] | 100 AM and Amara hotel block | Mall/hotel volumes, screens and roof | todo | — |
| SG-115 | [ ] | Oasia Hotel Downtown | Red planted screen, open sky gardens and crown; [sources and verification](oasia-hotel-downtown.md), [render](images/oasia-hotel-downtown-overview.png) | review | Meta Muse / 01a19cbf; datainvestor/update-building-model; 2026-11-03; [PR #9](https://github.com/datainvestor/tiny-singapore/pull/9) |
| SG-116 | [ ] | Altez | Dark curtain shaft with scattered projecting silver bays, pale glazed crown, 10 m podium with pool deck; [model](../js/landmark-models/altez.js), [sources and verification](altez.md), [render](images/altez-overview.png) | review | Meta Muse / 01a1a0cb; `datainvestor/add-tanjong-pagar-landmarks`; 2026-11-03; [PR #12](https://github.com/datainvestor/tiny-singapore/pull/12) |
| SG-117 | [ ] | Skysuites @ Anson | Near-black finned shaft, The Retreat's open setback terrace, silver louvred top and circular Vista Deck disc; [model](../js/landmark-models/skysuites-anson.js), [sources and verification](skysuites-anson.md), [render](images/skysuites-anson-overview.png) | review | Meta Muse / 01a1a0cb; `datainvestor/add-tanjong-pagar-landmarks`; 2026-11-03; [PR #12](https://github.com/datainvestor/tiny-singapore/pull/12) |
| SG-118 | [ ] | Icon — both residential towers and Icon Village | Different towers, balconies and podium | todo | — |
| SG-119 | [ ] | Lumiere | Residential slab, projecting bays and roof | todo | — |
| SG-120 | [ ] | Orchid Hotel | Façade, canopy and podium | todo | — |
| SG-121 | [ ] | Carlton City Hotel | Glazed tower, crown and streetside base | todo | — |
| SG-122 | [ ] | Tanjong Pagar Plaza — residential and retail/market complex | Multiple slabs, podium decks and public gaps | todo | — |
| SG-123 | [ ] | The Pinnacle@Duxton — seven towers and skybridges | Tower arrangement, open ground and both bridge levels | todo | — |
| SG-124 | [ ] | Maxwell Chambers and Chambers Suites | Separate heritage wings, roofs and internal space | todo | — |
| SG-125 | [ ] | Maxwell Reserve — former traffic police building | Long heritage elevation, corner and pitched roof | todo | — |
| SG-126 | [ ] | URA Centre | Main/wing volumes, colonnaded base and roof | todo | — |
| SG-127 | [ ] | MND complex, Maxwell Road | Main/annexe blocks and open ground; exact scope from source survey | todo | — |
| SG-128 | [ ] | TMW Maxwell site | Establish construction/as-built era and replacement footprint | todo | — |
| SG-129 | [ ] | Amoy Street Food Centre | Layered low roof, open sides and service edges | todo | — |
| SG-130 | [ ] | Telok Ayer Chinese Methodist Church | Distinct heritage mass, windows and roof | todo | — |
| SG-131 | [ ] | Thian Hock Keng | Roof ridges, deep halls, gates and courtyards | todo | — |
| SG-132 | [ ] | Nagore Dargah heritage centre | Tall corner minarets and street façade | todo | — |
| SG-133 | [ ] | Al-Abrar Mosque | Twin minarets, façade and prayer-hall roof | todo | — |
| SG-134 | [ ] | Ying Fo Fui Kun | Heritage frontage, roof and inner court | todo | — |
| SG-135 | [ ] | The Clan Hotel | Slender tower, upper terraces and low entrance | todo | — |
| SG-136 | [ ] | Telok Ayer / Cross Street — conserved Capital Square terraces | Exact addresses/OSM batch required; exclude modern SG-026 | todo | — |
| SG-137 | [ ] | Far East Financial Building | Distinct tower envelope and street edge | todo | — |
| SG-138 | [ ] | Manulife Tower, Cross Street | Tower/podium and façade rhythm | todo | — |
| SG-139 | [ ] | Bank of Singapore Centre | Tower shape, crown and street frontage | todo | — |
| SG-140 | [ ] | Royal One Phillip | Narrow tower, façade and podium | todo | — |
| SG-141 | [ ] | One Finlayson Green | Tower profile, cladding and ground base | todo | — |
| SG-142 | [ ] | The Quadrant — former Kwangtung Provincial Bank | Heritage corner mass and façade depth | todo | — |
| SG-143 | [ ] | The House of Eden | Narrow infill envelope and street elevation | todo | — |
| SG-144 | [ ] | Malacca Centre | Midrise façade, height and roof | todo | — |
| SG-145 | [ ] | 18 Cross / Cross Street Exchange | Office block, retail podium and conserved street edge; distinguish SG-026 | todo | — |
| SG-146 | [ ] | RB Capital Building, 22 Malacca Street | Narrow midrise and façade; OSM spelling “RB Capita” is a separate site from SG-011 | todo | — |

## P1 — Civic District and Marina Centre

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-201 | [ ] | National Gallery Singapore — former City Hall and Supreme Court | Both monuments, dome, colonnades and linking roof | todo | — |
| SG-202 | [ ] | Esplanade — theatre/concert shells | Spiked shells; [legacy implementation](../js/singapore-landmarks.js); add source notes; podium separate below | audit | — |
| SG-203 | [ ] | Esplanade — podium, annexe and outdoor theatre | Complete mapped low complex; excludes SG-202 shells | todo | — |
| SG-204 | [ ] | Victoria Theatre and Victoria Concert Hall | Clock tower, paired halls and porticoes | todo | — |
| SG-205 | [ ] | The Arts House — Old Parliament House | Portico, pitched roofs and rear additions | todo | — |
| SG-206 | [ ] | Parliament House | Separate wings, stepped roofs and courts | todo | — |
| SG-207 | [ ] | Supreme Court — current building | Disc, glazed courts and podium | todo | — |
| SG-208 | [ ] | Asian Civilisations Museum — Empress Place | Heritage wings, roofscape and riverside extensions | todo | — |
| SG-209 | [ ] | Saint Andrew's Cathedral | Spire, buttresses and open grounds | todo | — |
| SG-210 | [ ] | Singapore Cricket Club | Verandas, pitched roofs and Padang edge | todo | — |
| SG-211 | [ ] | Singapore Recreation Club | Distinct clubhouse volumes and terraces | todo | — |
| SG-212 | [ ] | The Treasury | Curved office forms and base | todo | — |
| SG-213 | [ ] | Singapore Flyer — wheel and supports | Wheel/capsules; [legacy implementation](../js/singapore-landmarks.js); source notes and terminal audit needed | audit | — |
| SG-214 | [ ] | Singapore Flyer — terminal / podium | Low mapped terminal, roof and access; excludes wheel SG-213 | todo | — |
| SG-215 | [ ] | Suntec City — five towers, mall and convention centre | Unequal towers, curved podium, roof and fountain court | todo | — |
| SG-216 | [ ] | Millenia Tower and Centennial Tower | Separate sculpted crowns and podiums | todo | — |
| SG-217 | [ ] | Millenia Walk | Repeated pyramidal roof modules and open passages | todo | — |
| SG-218 | [ ] | Marina Square mall | Low podium/roofscape only; hotels separately below | todo | — |
| SG-219 | [ ] | Raffles City — mall, office tower, Swissotel and Fairmont towers | Distinct heights, cylindrical hotel and shared podium | todo | — |
| SG-220 | [ ] | Raffles Hotel and Arcade | Courts, verandas and roof tiers; [source notes](raffles-hotel.md); distinct from SG-219 | audit | — |
| SG-221 | [ ] | Mandarin Oriental Singapore | Fan-shaped plan and stepped hotel profile | todo | — |
| SG-222 | [ ] | Pan Pacific Singapore | Triangular tower, glazed lifts and stepped crown | todo | — |
| SG-223 | [ ] | PARKROYAL COLLECTION Marina Bay | Hotel form, balconies and atrium roof | todo | — |
| SG-224 | [ ] | Ritz-Carlton Millenia Singapore | Faceted tower, roof and lower hotel wings | todo | — |
| SG-225 | [ ] | JW Marriott / South Beach complex | Two towers, canopy and conserved military blocks | todo | — |
| SG-226 | [ ] | The Gateway — East and West | Twin blade plans and sharp glazed edges | todo | — |
| SG-227 | [ ] | The Concourse | Octagonal shaft, setbacks and podium | todo | — |
| SG-228 | [ ] | Shaw Tower, Beach Road site | Establish current replacement/construction era | todo | — |
| SG-229 | [ ] | NS Square site | Verify dated construction/as-built stage; distinguish former Float | todo | — |

## P1 — Bugis, Bras Basah, Kampong Glam and Little India

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-230 | [ ] | National Library Building | Twin blocks, connecting bridges and garden terraces | todo | — |
| SG-231 | [ ] | National Museum of Singapore | Dome, heritage wings and rear glass addition | todo | — |
| SG-232 | [ ] | Singapore Art Museum — former Saint Joseph's Institution | Dome, curved wings and courtyards | todo | — |
| SG-233 | [ ] | CHIJMES | Chapel, arcades and open courts | todo | — |
| SG-234 | [ ] | Cathedral of the Good Shepherd | Tower, portico and pitched roofs | todo | — |
| SG-235 | [ ] | Parkview Square | Art Deco crown, setbacks and relief depth | todo | — |
| SG-236 | [ ] | DUO — both towers and Galleria | Honeycomb, carved curves and plaza; [source notes](duo.md) | audit | — |
| SG-237 | [ ] | Guoco Midtown — office tower, Midtown Square and former police station | Tower/canopies and preserved heritage block; housing separate | todo | — |
| SG-238 | [ ] | Midtown Bay | Residential tower, podium and terraces; excludes Midtown Modern SG-296 | todo | — |
| SG-239 | [ ] | Bugis Junction and InterContinental | Glass-covered streets, heritage façades and hotel | todo | — |
| SG-240 | [ ] | Bugis+ | Faceted white screen, corners and roof | todo | — |
| SG-241 | [ ] | Raffles Hospital | Tower/podium and characteristic top | todo | — |
| SG-242 | [x] | Sultan Mosque | Twin gold domes, minarets, green roof and Bussorah entrance; [sources and verification](sultan-mosque.md), [render](images/sultan-mosque-overview.png) | done | Codex / 18e5; `codex/sg-039-sg-242-heritage-landmarks`; 2026-11-03; [PR #7](https://github.com/datainvestor/tiny-singapore/pull/7) |
| SG-243 | [ ] | Malay Heritage Centre / Istana Kampong Glam | Palace, verandas and separate grounds | todo | — |
| SG-244 | [ ] | Golden Mile Complex / The Golden Mile | Terraced megastructure; establish restoration era | todo | — |
| SG-245 | [ ] | Golden Mile Tower | Slab, podium and original façade rhythm | todo | — |
| SG-246 | [ ] | Bencoolen Mosque | Mosque frontage, prayer hall and upper block | todo | — |
| SG-247 | [ ] | LASALLE — McNally Street campus | Black angular blocks and open central space | todo | — |
| SG-248 | [ ] | School of the Arts (SOTA) | Elevated blocks, green screens and open base | todo | — |
| SG-249 | [ ] | NAFA — Bencoolen campus blocks | Exact campus scope, varied blocks and street frontages | todo | — |
| SG-250 | [ ] | The Cathay | Heritage front, tower and podium; verify era | todo | — |
| SG-251 | [ ] | The Adelphi | Tower/podium and repetitive façade | todo | — |
| SG-252 | [ ] | Peninsula Plaza and Peninsula Shopping Centre / hotel complex | Distinguish adjacent buildings and crowns | todo | — |
| SG-253 | [ ] | Central Fire Station | Red/white bays, tower and courtyard | todo | — |
| SG-254 | [ ] | Armenian Church | Small classical church, spire and portico | todo | — |
| SG-255 | [ ] | Stamford Court | Corner clock tower and roof | todo | — |
| SG-256 | [ ] | Stamford Arts Centre | Heritage wings and courtyard | todo | — |
| SG-257 | [ ] | Sri Veeramakaliamman Temple | Gopuram, roof sculpture and hall plan | todo | — |
| SG-258 | [ ] | Tekka Centre | Market roof, residential block and public openings | todo | — |
| SG-259 | [ ] | Indian Heritage Centre | Faceted glazing and tight corner footprint | todo | — |
| SG-260 | [ ] | House of Tan Teng Niah | Colourful timber details and roof | todo | — |
| SG-261 | [ ] | Mustafa Centre — main connected retail buildings | Actual block extents, façades and roof plant | todo | — |
| SG-262 | [ ] | Sim Lim Square | Podium, atrium and distinctive street elevations | todo | — |
| SG-263 | [ ] | The Bencoolen / Burlington Square | Separate towers and retail podiums | todo | — |
| SG-264 | [ ] | Singapore Management University — Bras Basah campus | Survey individual campus blocks before splitting work | todo | — |

## P1 — Chinatown, Outram and the river

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-265 | [ ] | Buddha Tooth Relic Temple | Layered roofs, corner pavilions and façade depth | todo | — |
| SG-266 | [ ] | Sri Mariamman Temple | Gopuram, enclosure and inner hall roofscape | todo | — |
| SG-267 | [ ] | Jamae (Chulia) Mosque | Twin minarets, gateways and prayer hall | todo | — |
| SG-268 | [ ] | Chinatown Complex | Market podium, roofscape and residential block | todo | — |
| SG-269 | [ ] | Maxwell Food Centre | Low hall, pitched roof modules and open edges | todo | — |
| SG-270 | [ ] | People's Park Complex | Yellow/green slab, terraces and deep podium | todo | — |
| SG-271 | [ ] | People's Park Centre | Distinct blocks and podium; not SG-270 | todo | — |
| SG-272 | [ ] | Chinatown Point | Curved podium, tower and atrium | todo | — |
| SG-273 | [ ] | Hong Lim Complex and food centre | Slabs, retail base and open circulation | todo | — |
| SG-274 | [ ] | PARKROYAL COLLECTION Pickering | Sculpted terraces, planting and open base | todo | — |
| SG-275 | [ ] | State Courts — current towers and retained octagonal building | Separate eras, high courtrooms and bridges | todo | — |
| SG-276 | [ ] | One Pearl Bank | Curved twin towers, skybridges and green terraces | todo | — |
| SG-277 | [ ] | The Majestic | Heritage theatre frontage, tiled details and roof | todo | — |
| SG-278 | [ ] | Yue Hwa Building | Heritage department-store mass and tower top | todo | — |
| SG-279 | [ ] | Mondrian Singapore Duxton | Contemporary hotel and conserved lower street edge | todo | — |
| SG-280 | [ ] | CanningHill Piers / CanningHill Square complex | Verify current as-built stage; towers, lattice and low podium | todo | — |
| SG-281 | [ ] | Clarke Quay — conserved warehouse blocks and permanent canopies | Block-by-block roofs, courts and river frontage | todo | — |
| SG-282 | [ ] | Clarke Quay Central | Tower composition, low podium and river façade | todo | — |
| SG-283 | [ ] | Old Hill Street Police Station | Coloured shutters, deep wings and courtyards | todo | — |
| SG-284 | [ ] | Fort Canning Centre | Heritage main block, wings, pitched roofs and stairs; excludes hotel SG-297 | todo | — |
| SG-285 | [ ] | Robertson Quay — The Warehouse Hotel | Three pitched warehouse roofs and river frontage | todo | — |
| SG-286 | [ ] | STPI Creative Workshop and Gallery, Robertson Quay | Conserved warehouse mass, pitched roofs and river frontage | todo | — |
| SG-287 | [ ] | The InterContinental Singapore Robertson Quay hotel / Quayside | Hotel slab and podium; excludes surrounding condos | todo | — |
| SG-288 | [ ] | UE Square | Office/residential blocks, roof and podium | todo | — |
| SG-289 | [ ] | The Riverwalk | Curved river-edge podium and tower | todo | — |
| SG-290 | [ ] | Old Thong Chai Medical Institution | Heritage hall, courtyard and roof | todo | — |
| SG-291 | [ ] | Former Tanjong Pagar Railway Station | Monumental front, hall and platform roof | todo | — |
| SG-292 | [ ] | Tiong Bahru Market | Rounded corners, low market roof and open upper floor | todo | — |
| SG-293 | [ ] | Tiong Bahru pre-war estate — first bounded batch | Name street side, block/address range and OSM IDs before claim | todo | — |
| SG-294 | [ ] | Singapore General Hospital — Bowyer Block | Clock tower, heritage wings and roof | todo | — |
| SG-295 | [ ] | National Cancer Centre Singapore — current building | Layered clinical tower, planted terraces and sky links | todo | — |
| SG-296 | [ ] | Midtown Modern | Twin residential towers, landscaped podium and street base; excludes SG-238 | todo | — |
| SG-297 | [ ] | Hotel Fort Canning | Separate heritage hotel, verandas, roof and pool terraces; excludes SG-284 | todo | — |
| SG-298 | [ ] | Capitol Singapore — Capitol Theatre, Capitol Building, Stamford House and Eden Residences | Conserved fronts, theatre roof, new tower and open galleria | todo | — |
| SG-299 | [ ] | Funan | Stepped retail/office/residence blocks, planted roof and open pedestrian links | todo | — |

## P1 — Orchard, Tanglin and Scotts Road

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-301 | [ ] | ION Orchard and The Orchard Residences — explicitly requested | Sculpted mall skin and canopy, curved residential tower; [architect reference](https://rsp.design/project/ion-orchard-the-orchard-residences/) | todo | — |
| SG-302 | [ ] | Ngee Ann City / Takashimaya | Paired red towers, broad podium and civic plaza | todo | — |
| SG-303 | [ ] | Wisma Atria | Blue glazed frontage, podium and tower | todo | — |
| SG-304 | [ ] | TANGS / Tang Plaza and Singapore Marriott Tang Plaza | Pagoda roof, octagonal tower and retail base | todo | — |
| SG-305 | [ ] | Paragon | Layered shopping frontage and office/medical tower | todo | — |
| SG-306 | [ ] | Mandarin Gallery / Hilton Singapore Orchard | Paired hotel volumes and distinct retail base | todo | — |
| SG-307 | [ ] | 313@somerset | Podium frontage, roof and station-facing connections | todo | — |
| SG-308 | [ ] | Orchard Central | Tall mall, projecting terraces and façade | todo | — |
| SG-309 | [ ] | orchardgateway — both sides and bridge | Unequal towers, glass connection and podium | todo | — |
| SG-310 | [ ] | The Centrepoint | Layered retail frontage and upper residential block | todo | — |
| SG-311 | [ ] | Design Orchard | Sloping planted roof, concrete volume and public steps | todo | — |
| SG-312 | [ ] | The Heeren | Current frontage, setbacks and upper mass | todo | — |
| SG-313 | [ ] | Tong Building | Distinct slab, glazing and podium; excludes Paragon SG-305 | todo | — |
| SG-314 | [ ] | Lucky Plaza | Tower/podium, balconies and street canopy | todo | — |
| SG-315 | [ ] | Far East Plaza | Terraced podium and upper towers | todo | — |
| SG-316 | [ ] | Scotts Square | Twin residential towers and glazed retail podium | todo | — |
| SG-317 | [ ] | Shaw House and Shaw Centre | Separate slabs and cinema/retail base | todo | — |
| SG-318 | [ ] | Wheelock Place | Conical glazed corner, podium and office tower | todo | — |
| SG-319 | [ ] | Forum The Shopping Mall and voco Orchard hotel | Distinct hotel slab and retail envelope | todo | — |
| SG-320 | [ ] | Palais Renaissance | Rounded corner and detailed shopping frontage | todo | — |
| SG-321 | [ ] | Delfi Orchard | Midrise façade, projecting bays and roof | todo | — |
| SG-322 | [ ] | Orchard Towers | Paired volumes, podium and current external appearance | todo | — |
| SG-323 | [ ] | Four Seasons Hotel Singapore | Hotel mass, roof and lower wings | todo | — |
| SG-324 | [ ] | The St. Regis Singapore | Distinct hotel/residential towers and podium | todo | — |
| SG-325 | [ ] | The Singapore EDITION | White massing, roof garden and courtyard | todo | — |
| SG-326 | [ ] | Pan Pacific Orchard | Open stacked terraces, columns and planted volumes | todo | — |
| SG-327 | [ ] | Goodwood Park Hotel | Tower, red roofs, heritage wings and open grounds | todo | — |
| SG-328 | [ ] | Grand Hyatt Singapore | Tower, podium and renovation-era façade | todo | — |
| SG-329 | [ ] | Shangri-La Singapore — hotel wings | Distinct Tower/Garden/Valley wings and roofscapes | todo | — |
| SG-330 | [ ] | The Istana — main building | Porticoes, tower and roof; public exterior references | todo | — |
| SG-331 | [ ] | The Atrium@Orchard and Plaza Singapura | Paired office blocks, mall and station entrances | todo | — |
| SG-332 | [ ] | Orchard Rendezvous Hotel | Terraced hotel, pitched roofs and Tanglin frontage | todo | — |
| SG-333 | [ ] | Newton / Scotts landmark housing — Scotts Tower | Raised mass, projecting sky terraces and podium | todo | — |
| SG-334 | [ ] | Ardmore Residence | Sculpted white structure, balconies and open base | todo | — |
| SG-335 | [ ] | EDEN, Draycott Park | Planted shell balconies, concrete core and roof | todo | — |
| SG-336 | [ ] | Park Nova | Curved planted terraces and raised structure | todo | — |
| SG-337 | [ ] | Boulevard 88 and Artyzen Singapore | Residential roof connection and stepped hotel gardens | todo | — |

## P1 — explicitly requested landmarks beyond the CBD

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-401 | [ ] | VivoCity | Flowing white envelope, open roofscape and waterfront terraces; [owner reference](https://www.vivocity.com.sg/about-us/) | todo | — |
| SG-402 | [ ] | The Colonnade, Grange Road | Stacked projecting modules, structural columns and deep voids; [Rudolph archive](https://prhf-a9m5.squarespace.com/198001-colonnade); user's “Collonade” | todo | — |
| SG-403 | [ ] | The Star — Star Vista and Star Performing Arts Centre | Carved open atrium, cantilever and layered shell; [architect reference](https://www.aedas.com/en/project/the-star/); user's “Start Vist” | todo | — |
| SG-404 | [ ] | The Interlace | Interlocking horizontal blocks, roof gardens and open courtyards; [architect reference](https://www.oma.com/projects/the-interlace) | todo | — |

## P2 — southern waterfront, Sentosa and distinctive housing

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-405 | [ ] | HarbourFront Centre and connected office towers | Separate blocks, terminal edge and mall roof | todo | — |
| SG-406 | [ ] | HarbourFront / Keppel Bay — Caribbean at Keppel Bay | Identify tower groups, low waterfront and canals | todo | — |
| SG-407 | [ ] | Reflections at Keppel Bay | Curving towers, crowns and lower villa blocks | todo | — |
| SG-408 | [ ] | Corals at Keppel Bay | Low curved slabs, balconies and waterfront spacing | todo | — |
| SG-409 | [ ] | The Reef at King's Dock | Stepped waterfront blocks and preserved dock void | todo | — |
| SG-410 | [ ] | Resorts World Convention Centre | Conference-hall volumes, roof and entry canopies; exclude adjacent hotels | todo | — |
| SG-411 | [ ] | Singapore Oceanarium building | Verify current extent/era and distinguish aquarium predecessor | todo | — |
| SG-412 | [ ] | Hotel Ora / Hotel Michael / Festive Hotel-era complex | Reconcile current identities, split non-overlapping buildings before claim | todo | — |
| SG-413 | [ ] | The Barracks Hotel and conserved barracks | Verandas, pitched roofs and courtyard arrangement | todo | — |
| SG-414 | [ ] | The Outpost Hotel and Village Hotel Sentosa | Distinct raised blocks, terraces and podium | todo | — |
| SG-415 | [ ] | Capella Singapore | Conserved bungalows, curved hotel wings and courtyard | todo | — |
| SG-416 | [ ] | W Singapore — Sentosa Cove | Low curved hotel, roof and water-edge terraces | todo | — |
| SG-417 | [ ] | d'Leedon | Curved tower cluster, sky gardens and distinct podiums | todo | — |
| SG-418 | [ ] | Sky Habitat, Bishan | Stepped twin towers and open bridges | todo | — |
| SG-419 | [ ] | SkyVille @ Dawson | Three groups, sky gardens and open public ground | todo | — |
| SG-420 | [ ] | SkyTerrace @ Dawson | Staggered towers, interlocking blocks and planting | todo | — |
| SG-421 | [ ] | SkyParc @ Dawson | Distinct tower grouping, sky gardens and open public base | todo | — |
| SG-422 | [ ] | Golden Mile successor housing / Aurea | Establish dated as-built stage; excludes conserved SG-244 | todo | — |
| SG-423 | [ ] | The Coast at Sentosa Cove | Curved waterfront blocks, terraces and open courts | todo | — |
| SG-424 | [ ] | Marina Collection, Sentosa Cove | Low residential blocks, balconies and marina frontage | todo | — |

## P2 — one-north, universities and western landmarks

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-425 | [ ] | Fusionopolis One — Connexis and Symbiosis | Linked towers, upper spheres/curves and open base | todo | — |
| SG-426 | [ ] | Mediapolis — Mediacorp campus | Long raised building, inclined roof and public plaza | todo | — |
| SG-427 | [ ] | Sandcrawler, one-north | Horseshoe plan, sloping faces and inner garden | todo | — |
| SG-428 | [ ] | Biopolis — first bounded cluster | Name blocks and shared spaces before splitting models | todo | — |
| SG-429 | [ ] | Rochester Commons | Tower, hotel and conserved bungalows; excludes Rochester Mall SG-485 | todo | — |
| SG-430 | [ ] | JTC LaunchPad @ one-north — first bounded block group | Distinct container/industrial blocks; exact scope required | todo | — |
| SG-431 | [ ] | NUS — Lee Kong Chian Natural History Museum | Planted rocklike envelope, cuts and roof; UCC separate at SG-486 | todo | — |
| SG-432 | [ ] | NUS — SDE4 | Raised tropical structure, open floors and solar roof | todo | — |
| SG-433 | [ ] | NUS UTown — Education Resource Centre | Low learning blocks, roof and courtyards | todo | — |
| SG-434 | [ ] | NTU — The Hive | Clustered tapered learning towers and internal voids | todo | — |
| SG-435 | [ ] | NTU — School of Art, Design and Media | Sweeping planted roofs, glazed fronts and courtyard | todo | — |
| SG-436 | [ ] | NTU — Gaia | Long timber mass, curved courts and roof | todo | — |
| SG-437 | [ ] | Jurong Town Hall | Raised slab, clock tower and open forecourt | todo | — |
| SG-438 | [ ] | Science Centre Singapore — existing Jurong East complex | Distinct exhibition halls; verify era, do not mix replacement site | todo | — |
| SG-439 | [ ] | The JTC Summit | Curved tower crown, glazing and podium | todo | — |
| SG-440 | [ ] | Ng Teng Fong General Hospital / Jurong Community Hospital | Separate ward blocks, angled rooms and skybridges | todo | — |

## P2 — east, north, sports, transport and cultural landmarks

| ID | Done | Building / bounded scope | Recognition focus / existing evidence | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-441 | [ ] | National Stadium | Dome, retractable opening, ribs and surrounding podium | todo | — |
| SG-442 | [ ] | Singapore Indoor Stadium | Sweeping roof, supports and concourses | todo | — |
| SG-443 | [ ] | Sports Hub — OCBC Aquatic Centre / Arena | Separate long-span roofs and pedestrian gaps | todo | — |
| SG-444 | [ ] | Singapore Sports Hub — Kallang Wave Mall | Podium integration; coordinate boundaries with SG-441 | todo | — |
| SG-445 | [ ] | Singapore Swimming Club, Tanjong Rhu | Curved roofs, terraces and pool setting | todo | — |
| SG-446 | [ ] | Leisure Park Kallang | Distinct low mall mass; verify redevelopment era | todo | — |
| SG-447 | [ ] | Jewel Changi Airport | Toroidal glass roof, structural grid and central oculus | todo | — |
| SG-448 | [ ] | Changi Airport — control tower and Terminal 1 exterior | Tower crown and terminal roof; excludes SG-447 | todo | — |
| SG-449 | [ ] | Changi Airport — Terminal 3 | Long terminal, roof rhythm and glazed façades | todo | — |
| SG-450 | [ ] | Changi Airport — Terminal 4 | Roof bays, low terminal and departure frontage | todo | — |
| SG-451 | [ ] | Changi Airport — Terminal 2 | Establish renovation era, frontage and roof equipment | todo | — |
| SG-452 | [ ] | SUTD — first bounded academic campus group | Curving blocks, bridges, roofs and public voids | todo | — |
| SG-453 | [ ] | Singapore EXPO and MAX Atria | Repeated hall roofs and separate conference block | todo | — |
| SG-454 | [ ] | Our Tampines Hub | Courtyard/stadium void, porous block and roof | todo | — |
| SG-455 | [ ] | Tampines Grande | Paired office blocks, façades and planted base | todo | — |
| SG-456 | [ ] | Paya Lebar Quarter | Distinct office/residential towers and mall roof | todo | — |
| SG-457 | [ ] | Paya Lebar Square and SingPost Centre | Separate blocks, crowns and podium boundaries | todo | — |
| SG-458 | [ ] | Katong — conserved Joo Chiat first shophouse batch | Exact address range, coloured fronts and varied roofs | todo | — |
| SG-459 | [ ] | Katong — former Red House bakery complex | Conserved red building and separate newer volumes | todo | — |
| SG-460 | [ ] | Sri Senpaga Vinayagar Temple | Gopuram, layered roofs and hall footprint | todo | — |
| SG-461 | [ ] | Church of the Holy Family, Katong | Church volume, roof and tower | todo | — |
| SG-462 | [ ] | Former Kallang Airport terminal | Streamlined terminal, tower and separate wings | todo | — |
| SG-463 | [ ] | HDB Hub, Toa Payoh | Office tower, retail blocks and sheltered public space | todo | — |
| SG-464 | [ ] | Junction 8, Bishan | Mall phases, street frontages and roof; library separate at SG-483 | todo | — |
| SG-465 | [ ] | Khoo Teck Puat Hospital | Planted ward blocks, lake edge and courtyard | todo | — |
| SG-466 | [ ] | Kampung Admiralty | Stacked public uses, residential towers and garden roof | todo | — |
| SG-467 | [ ] | Woodlands Health campus | Separate ward blocks, bridges and landscape gaps | todo | — |
| SG-468 | [ ] | Seletar Airport — passenger terminal and control tower | Low terminal, tower and correct apron edge | todo | — |
| SG-469 | [ ] | Yishun — Northpoint City | Separate mall phases, towers and transport podium | todo | — |
| SG-470 | [ ] | Sengkang — Anchorvale Community Club | Curved roof, open volumes and water-edge setting | todo | — |
| SG-471 | [ ] | Punggol — Oasis Terraces | Stepped planted terraces and connected community blocks | todo | — |
| SG-472 | [ ] | Punggol — Northshore Plaza | Two mall blocks, bridges and open ground | todo | — |
| SG-473 | [ ] | Punggol Digital District — first bounded landmark group | Establish dated as-built campus/office scope before splitting | todo | — |
| SG-474 | [ ] | Lee Kong Chian School of Medicine — Novena Clinical Sciences Building | Tower/podium, terraces and façade | todo | — |
| SG-475 | [ ] | Tan Tock Seng Hospital — main landmark blocks | Distinct ward towers and lower complex; precise scope first | todo | — |
| SG-476 | [ ] | Oasia Hotel Novena | Hotel/medical tower and podium; distinct from Downtown SG-115 | todo | — |
| SG-477 | [ ] | Singapore Botanic Gardens — Gallop Extension houses | Atbara and Inverturret; deep verandas and pitched roofs | todo | — |
| SG-478 | [ ] | Singapore Botanic Gardens — Bandstand and key permanent pavilions | Exact mapped structures, octagonal roofs and open grounds | todo | — |
| SG-479 | [ ] | Singapore Chinese Garden — pagodas and main pavilions | Dated restored forms, tiered roofs and bridge relationships | todo | — |
| SG-480 | [ ] | Sembawang — The Former Admiralty House | Heritage mass, pitched roof and portico | todo | — |
| SG-481 | [ ] | Novena Square / Velocity | Office towers, mall podium and roofscape | todo | — |
| SG-482 | [ ] | Royal Square at Novena | Hotel/medical tower, upper terraces and lower podium | todo | — |
| SG-483 | [ ] | Bishan Public Library | Projecting coloured reading pods and glazed box | todo | — |
| SG-484 | [ ] | NUS UTown — Stephen Riady Centre | Stepped recreation/learning complex and roof | todo | — |
| SG-485 | [ ] | Rochester Mall / Park Avenue Rochester | Distinct hotel tower and retail podium; excludes SG-429 | todo | — |
| SG-486 | [ ] | NUS — University Cultural Centre | Auditorium volumes, roof, colonnades and entry | todo | — |

## Mandatory coverage passes — close the CBD gaps

These are **inventory and acceptance tasks**, not permission to replace a district with one mesh. Use the linked URA CBD boundary, street blocks and source OSM geometry to define a non-overlapping parcel/way ledger. Adjacent passes share street boundaries, not buildings: assign a straddling property to one pass and cross-reference it in the other. Audit the source data for stale/missing properties as well as the model.

For each pass create `docs/landmark-coverage/sg-<number>.md` with its precise boundary, source snapshot/date, **every** building way/relation or address group, the corresponding building task ID, and remaining gaps. Group parts belonging to the same physical building; include unnamed buildings, infill, podiums, canopies and conserved rows. Give uncovered buildings individual new CBD IDs. A sweep cannot be `done` until its ledger is complete and every in-scope building has accepted detailing (or an explicit, linked user-approved exception). A survey that merely adds tasks remains `review` with its remaining dependencies listed. Coverage passes outside the strict CBD are marked extension work below.

| ID | Done | Coverage area / bounded survey to establish | Required result | State | Owner / branch / PR |
| --- | --- | --- | --- | --- | --- |
| SG-901 | [ ] | Raffles Place / Battery Road / Chulia Street / Phillip Street | Parcel ledger, tower bases, small infill, station pavilions and no generic gaps | todo | — |
| SG-902 | [ ] | Collyer Quay / Clifford Pier / Fullerton waterfront | Every low waterfront building and link; independent piers and clear promenades | todo | — |
| SG-903 | [ ] | Market Street / Church Street / Cross Street / Telok Ayer north | Offices, conserved terraces, courts and all interstitial buildings | todo | — |
| SG-904 | [ ] | Robinson Road / Cecil Street corridor | Both street sides, side streets and small midrise properties | todo | — |
| SG-905 | [ ] | Shenton Way / McCallum Street / Boon Tat Street | Full street fabric, podiums, canopies and redevelopment-era consistency | todo | — |
| SG-906 | [ ] | Telok Ayer / Amoy / Stanley / Ann Siang / Club Street | CBD parcels plus adjacent conservation frontage; address-bounded roof/façade batches | todo | — |
| SG-907 | [ ] | Maxwell / Tanjong Pagar / Peck Seah / Tras Street | Conserved rows, civic buildings, hotel bases and all CBD infill | todo | — |
| SG-908 | [ ] | Anson / Enggor / Bernam / Hoe Chiang / Keppel edge | Every office/residential block, low property and dated construction site | todo | — |
| SG-909 | [ ] | Marina Bay Central / Marina View / Marina Boulevard | Every tower/podium, independent pavilion, skybridge and open garden | todo | — |
| SG-910 | [ ] | Bayfront / Marina Bay Sands waterfront | Hotel/podium/museum/retail coverage with no duplicate or missing pieces | todo | — |
| SG-911 | [ ] | Entire URA CBD boundary — final reconciliation | Union SG-901–910 ledgers against official boundary and OSM; allocate any omitted parcels, then verify accepted coverage | todo | — |
| SG-912 | [ ] | Downtown extension — Civic District / Marina Centre / Beach Road | Add remaining prominent buildings and bounded infill tasks; extension, not strict CBD | todo | — |
| SG-913 | [ ] | Downtown extension — Boat Quay / Circular Road / river warehouses | Exact street-side address batches; distinct roofscapes, five-foot ways and clear quays | todo | — |
| SG-914 | [ ] | Orchard extension — both sides from Tanglin to Dhoby Ghaut | All significant mall/hotel/tower gaps and low conserved frontage | todo | — |

## Starting references

These establish scope and research starting points; each model still needs its own plans, elevations, dated photographs, footprint IDs and estimated dimensions in source notes.

- [URA — Downtown Core, CBD extent and boundary-plan download](https://www.ura.gov.sg/guidelines/urban-design/downtown-core/): scope for required CBD coverage and distinction from Civic District/Bugis/Marina Centre.
- [URA — Rejuvenating our Downtown](https://www.ura.gov.sg/land-planning/master-plan/master-plan-2025/regional-plans/central-area/rejuvenating-our-downtown/): named downtown projects and redevelopment context. Planned projects are not evidence of completion.
- [NHB / Roots — National Monuments](https://www.roots.gov.sg/nhb/monuments): authoritative heritage identities and research leads.
- [RSP — ION Orchard and The Orchard Residences](https://rsp.design/project/ion-orchard-the-orchard-residences/), [VivoCity — About Us](https://www.vivocity.com.sg/about-us/), [Aedas — The Star](https://www.aedas.com/en/project/the-star/), [Paul Rudolph Institute archive — The Colonnade](https://prhf-a9m5.squarespace.com/198001-colonnade), [OMA — The Interlace](https://www.oma.com/projects/the-interlace): starting references for the user's explicitly requested sites.
- [IOI — Central Boulevard Towers](https://www.ioiproperties.com.sg/portfolio/ioi-central-boulevard-towers): distinguishes this completed site from other Marina Bay projects.
- Repository evidence: [city registration](../tools/city/cities/singapore.mjs), [core OSM extract](../tools/data/singapore/osm_buildings.json), [kit models](../js/landmark-models/), [legacy icons](../js/singapore-landmarks.js), and linked building notes above. OSM data © OpenStreetMap contributors, ODbL; a mapped name or height still needs visual verification.
