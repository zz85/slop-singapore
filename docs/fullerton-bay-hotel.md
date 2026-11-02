# Fullerton Bay Hotel model

## Design and references

Add a detailed model beside the Fullerton Hotel on `codex/fullerton-hotel`, using the existing landmark kit, normal/Tiny material pairing, collision volumes and preview. The aim is a recognisable architectural model at city-view scale, with photo-estimated details rather than survey-certified elevations.

- [DP Architects' project description and exterior photographs](https://www.dpaconsultants.in/projects/fullertonbayhotel/) show the six-storey structure, three outward-inclined glass elevations, copper-toned room dividers, blue glazing, balcony rails and the tall horizontally grooved stone spine on the street elevation.
- [The hotel's official site](https://www.fullertonhotels.com/fullerton-bay-hotel-singapore) establishes the waterfront property at 80 Collyer Quay.
- [The hotel's rooftop pool page](https://www.fullertonhotels.com/fullerton-bay-hotel-singapore/facilities/rooftop-pool-jacuzzis) and [Lantern page](https://www.fullertonhotels.com/fullerton-bay-hotel-singapore/dining/restaurants-and-bars/lantern) guide the planted pool deck, two Jacuzzis, roof bar, loungers and canopies.
- [The photographer's aerial view of Customs House and Fullerton Bay Hotel](https://www.flickr.com/photos/25802865@N08/8919189702) guides roof placement: service core on the west, rectangular pool on the north side, and Lantern's long light canopy on the east. Its 2013 date means the exact furniture and planting may differ today.
- The existing OSM snapshot supplies main part `406900561` (six levels, 25 m), outline `184297025`, and low link `986973997`. Relation `13262095` groups these as the hotel. The main guestroom block is approximately 64 by 43 m, with a low northward link to Clifford Pier.

## Approach and scope

Use a procedural model with real sloping glass shells, repeated balcony/window geometry and a detailed roof. A generic textured extrusion would omit its distinctive inclined façades; importing a third-party mesh would introduce a separate asset, licence and material pipeline. The procedural approach is the executor's choice, consistent with the preceding Fullerton Hotel model the user approved.

Replace only the hotel outline, main block and link, plus its grouping relation if needed. Clifford Pier, Old Customs House, their lighthouse and One Fullerton retain separate identities and geometry. Avoid fictitious high-rise massing and accidental duplicate mapped solids. Interiors, fine lettering and foliage are simplified. Heights above the mapped 25 m guestroom block and rooftop layout details are estimated from photographs.

## Implementation contract

- Export `info` and `build(kit, site)` from `js/landmark-models/fullerton-bay-hotel.js`.
- Derive orientation and dimensions from the mapped main block, independently of the vertex-average anchor and city grid bearing.
- Include six-storey massing, outward-flared glass corners, copper-toned recessed room bays, slender pale floor bands and glass rails, the street-side stone spine, low north link and waterfront deck/supports.
- Include a visible rooftop pool, two Jacuzzis, Lantern pavilion/canopy, planting and furniture; keep the pool within the main roof.
- Use the existing collision API for elevated architectural parts, keeping the entrance canopy clearance open and roofs solid to descent.
- Keep geometry finite, under 65,000 triangles and at most 16 material batches, with no coplanar flicker.
- Verify targeted landmark tests, the full suite and browser renders in both looks and backends, plus the production city. The existing eight Windows fixture failures are known baseline failures.

## Inspect and rebuild

```text
http://127.0.0.1:8012/tools/landmark-preview.html?model=fullerton-bay-hotel
```

```powershell
node --max-old-space-size=8192 tools/city/build.mjs singapore
node --test tests/landmark-kit.test.cjs tests/landmark-models.test.cjs tests/singapore-landmarks.test.mjs tests/city-geodata.test.mjs
```

Reference images guide the geometry; no photographs or downloaded meshes are bundled with the model.

## Verification

- 38 targeted landmark and city-generator checks pass, including both tent halves stopping vertical descent, the roof pool staying within the hotel, visible roof lettering and preservation of the low link.
- Tiny/day previews in WebGL/WebGPU and the production city render without JavaScript errors. The model is 23,082 triangles in 13 material batches.
- Regenerated geodata replaces exactly two old solids (the mapped 25 m block and 3.2 m link). Other buildings, including Clifford Pier and Customs House, remain as before.
- A fresh code review identified the canopy collision omission; a failing descent test reproduced it before the collision volumes were added.
- Full `node --test`: 345 passing, eight existing Windows fixture failures (one worker-path case in `tests/city-tiles.test.mjs`, seven shell-fixture cases in `tests/overpass.test.mjs`), matching the pre-change failure set.

The shared kit now accepts a corresponding `topRing` in `kit.loft()` for directional glass inclines. Vertices must correspond in order to the base ring; arbitrary topology changes are outside that interface's contract. The preview now fits each model's projected bounds automatically.
