# Raffles Place MRT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model the two heritage entrance pavilions at Raffles Place MRT with accurate placement and recognisable architectural detail.

**Architecture:** One landmark module derives an independent frame for each mapped entrance, using the shared kit for masonry, glass, ornaments and collision. The existing city generator replaces the two generic blocks and publishes the anchor; the shared preview and production city load the module normally.

**Tech Stack:** JavaScript ES modules, existing three.js WebGPU/TSL landmark kit, Node test runner, existing OSM snapshot.

**Spec:** `docs/raffles-place-mrt.md`

## Global Constraints

- Reuse current isolated branch and kit; no new dependencies, downloaded models or photographic textures.
- Replace exactly ways `106193391` (A) and `106193387` (B), preserving nearby buildings and the park between them.
- Model above-ground architecture only; proportions above the nominal 7 m are photo estimates.
- Keep doorway clearance open and roofs solid to descent; finite geometry, no coplanar flicker, fewer than 65,000 triangles and at most 16 material batches.

## Review Focus

- Pair placement and orientation: façades face the shared park, no anchor-offset or city-bearing error.
- Entrances and lawn: no invented solid slab or collider fills either doorway or the gap between pavilions.
- High viewpoints: ornamental gables and roof structures remain recognisable and roofs stop descent.
- Source overlap: exactly the two generic station solids disappear; nearby tower models remain intact.
- Tiny/day close views: pilasters, clerestory, relief and signs read clearly without coplanar overlap.

### Task 1: Build the entrance landmark

**Files:** Create `js/landmark-models/raffles-place-mrt.js`; modify `tools/city/cities/singapore.mjs`, generated `js/singapore-geodata.js` and `tools/landmark-preview.html` (individual exit focus and N/S views); test in `tests/landmark-models.test.cjs`; document in `docs/raffles-place-mrt.md`.

**Interfaces:** Export `info={name,height:7}` and `build(kit,site)` consuming local rings in `site.parts`, and the existing `kit.collisionPrism` and `kit.loft({topRing})` where useful.

- [x] Add failing tests for exactly the two source ways, independent placement, ornamental height, open centre doorways, clear space between pavilions, solid roof interiors and batched finite geometry without flicker.
- [x] Run `node --test --test-name-pattern="Raffles Place MRT" tests/landmark-models.test.cjs`; expected missing landmark anchor failures.
- [x] Register and build the photo-guided model. Regenerate city data with `node --max-old-space-size=8192 tools/city/build.mjs singapore`.
- [x] Run the four targeted files from the spec; expected all pass. Inspect Tiny/day WebGL/WebGPU previews and a close production-city view; expected no model/overlap errors.
- [x] Obtain fresh-context review, address important findings with regression tests, run `node --test` and `git diff --check`; expected only the eight known baseline Windows fixture failures.
- [x] Document verification and commit on the current isolated branch.
