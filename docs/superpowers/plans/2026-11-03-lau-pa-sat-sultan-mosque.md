# Lau Pa Sat and Sultan Mosque implementation plan

> **For agentic workers:** Use superpowers:executing-plans for implementation and dispatching-parallel-agents for the two independent model scopes.

**Goal:** Detail checklist entries SG-039 and SG-242 using source-led, recognisable procedural models.

**Architecture:** Separate `build(kit, site)` modules on mapped anchors, registered through the existing Singapore generator. Keep the mosque annexe and all neighbouring buildings separate. The user delegated selection of the two entries to this session; both were unowned on main at 18fe797.

**Tech Stack:** JavaScript, Three.js, landmark kit, OSM generator, Node tests.

**Spec:** Shared modelling guide, checklist rows SG-039/SG-242 and source notes `docs/lau-pa-sat.md`, `docs/sultan-mosque.md` established during research before geometry work.

## Global constraints

- Use existing geometry/material helpers, fewer than 65,000 triangles and 16 batches per model.
- Document measured/mapped dimensions separately from estimated elevations and source dates.
- Preserve open passages, courts, neighbouring buildings and roof collision.
- Do not mark rows done before acceptance on the shared branch; use review with actual evidence.

## Review focus

- Lau Pa Sat's mapped height is zero: model from references, never propagate the zero height.
- The open market must remain traversable below its elevated roof.
- Gold mosque domes must have bulbous profiles, correctly placed on the actual prayer hall.
- The separately mapped mosque annexe must remain, with no invented site-wide slab.
- Roof collisions must stop descending players while leaving adjacent streets clear.

## Task 1: SG-039 Lau Pa Sat

Files: create `docs/lau-pa-sat.md`, `js/landmark-models/lau-pa-sat.js`, `tests/lau-pa-sat.test.cjs`.

- [x] Research roof/site, street front and interior/side views; inspect nearby OSM ways and relations; document replacement boundaries.
- [x] Write and run failing tests for real anchor/replacement, open market aisle, roof collision, finite geometry, placement, budgets and flicker.
- [x] Implement `info` and `build(kit, site)` with octagonal iron pavilion, tiered roofs, central lantern and clock tower.
- [x] Run model tests and refine rendered Tiny/day views against sources.

## Task 2: SG-242 Sultan Mosque

Files: create `docs/sultan-mosque.md`, `js/landmark-models/sultan-mosque.js`, `tests/sultan-mosque.test.cjs`.

- [x] Research roof/site, main elevation and side views; inspect mapped body and annexe; document replacement boundary.
- [x] Write and run failing tests for real anchor/replacement, independently located hall/domes, clear exterior, roof collision, finite geometry, budgets and flicker.
- [x] Implement `info` and `build(kit, site)` with cream prayer hall, two gold onion domes, minarets, parapets and recessed arched elevations.
- [x] Run model tests and refine rendered Tiny/day views against sources.

## Task 3: Shared integration and verification

Files: modify `tools/city/cities/singapore.mjs`, generated city data and `docs/landmark-checklist.md`.

- [x] Register only confirmed replacement IDs; regenerate using `node --max-old-space-size=8192 tools/city/build.mjs singapore`.
- [x] Run the guide's targeted tests and full suite; distinguish platform-specific failures.
- [x] Inspect both full models in Tiny/day, WebGL/WebGPU, roof/elevation and loaded city views; save useful captures and verification notes.
- [x] Obtain independent code review, address findings, update checklist to review with evidence and leave changes reviewable in this worktree.

## Integration record

- Synced the existing isolated worktree to main at `18fe797` before selection; no competing site PR found. User delegated site selection; no shared-branch claim mutation was needed.
- Baseline: 61/61 guide-targeted checks pass. Windows full baseline: 402/410; existing tile-worker path and seven POSIX Overpass-fixture failures. Final full verification used a clean LF Linux copy: 424/424 pass (Ubuntu 24.04 / Node 22.23.4).
- Both model tests failed for the intended missing-anchor assertion before implementation; the parent integration test also failed before registration and passed after generation.
- Exact source sets: Lau Pa Sat nine ways; Sultan Mosque 45 ways; no relations. Only `buildings` and `landmarks` change in regenerated GEO; all twelve previous procedural anchors stay byte-equivalent, trees unchanged. Generic building records 16,070 to 16,050.

- Final targeted checks: 75/75. Full LF Linux suite: 424/424. All Tiny/day previews on actual WebGL and WebGPU backends report zero flicker, no errors or compiler warnings. Loaded city checks show both models among retained neighbours; only Chrome's standard ignored-powerPreference warning remains.
- Final code review: no remaining actionable findings. Fixed Sultan gable and lower-aisle collision above the visible roof via emitted-triangle regression tests (RED then GREEN). Render-driven fixes to Lau roof glazing widths and coplanarity also passed RED then GREEN.
- Map-scale simplifications remain documented: filled market roof/gable sections with a flat underside and approximate lantern collision; mosque fine ornament and shallow canopy curvature. Heights and small details are visual estimates. The user requested PR publication after implementation. Publish branch `codex/sg-039-sg-242-heritage-landmarks` against `main`, then update both unchecked review rows with the actual PR link. Preserve the worktree for review and leave merging to the user.
