# Fullerton Bay Hotel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recognisable, detailed Fullerton Bay Hotel beside the completed Fullerton Hotel model.

**Architecture:** One procedural `build(kit, site)` landmark module uses mapped geometry and the shared landmark kit. City configuration hides the replaced hotel solids and the existing generator publishes the anchor. The shared preview exercises both looks and rendering backends.

**Tech Stack:** JavaScript ES modules, three.js WebGPU/TSL, Node's built-in test runner, existing OSM snapshot.

**Spec:** `docs/fullerton-bay-hotel.md`

## Global Constraints

- Use existing landmark kit and normal/Tiny material pairing; no new dependencies or downloaded model assets.
- Keep Clifford Pier, Old Customs House, their lighthouse and One Fullerton separate.
- Anchor to main OSM part `406900561`, outline `184297025`, low link `986973997`; main mass 25 m and six storeys.
- Fewer than 65,000 triangles, no more than 16 batches, finite geometry, no coplanar flicker.
- Work in the current isolated branch; do not merge into Claude's active checkout.

## Review Focus

- Mapped part/outline/relation overlap: no old hotel slab remains under the custom model.
- Rotated city frame and off-centre anchor: the sloping façades and roof remain on the mapped footprint.
- High viewpoints: roof pool and pavilion are visible, with solid collision beneath.
- Waterfront and entrance: low link stays low, neighbouring heritage buildings remain intact.
- Close views and Tiny/day materials: copper fins, balcony rails and glass remain legible without flicker.

### Task 1: Build and integrate the hotel

**Files:**
- Create: `js/landmark-models/fullerton-bay-hotel.js`
- Modify: `tools/city/cities/singapore.mjs`, generated `js/singapore-geodata.js`, `js/landmark-kit.js` (optional corresponding `topRing`), `tools/landmark-preview.html` (automatic fit)
- Test: `tests/landmark-models.test.cjs`, `tests/landmark-kit.test.cjs`
- Document: `docs/fullerton-bay-hotel.md`

**Interfaces:** Consumes `createKit`, `kit.collisionPrism` and `site.parts` rings local to the anchor. Produces `info={name,height:25}` and `build(kit,site)`, loaded through the existing landmark loader and preview.

- [x] Write failing integration tests for the hotel anchor and exactly its three replaced ways; mapped dimensions and 25 m mass; real outward-sloping glass, roof pool and low link; solid roof interiors, finite geometry, batch/triangle limits and zero flicker.
- [x] Run `node --test --test-name-pattern="Fullerton Bay" tests/landmark-models.test.cjs`; expected missing-anchor failures.
- [x] Register the landmark and implement the photo-guided model; preserve all neighbouring heritage buildings. Regenerate geodata with `node --max-old-space-size=8192 tools/city/build.mjs singapore`.
- [x] Run the four targeted test files from the spec; expected all pass. Render four preview views, Tiny/day, WebGL/WebGPU and the production city; expected no model errors or duplicate slabs.
- [x] Run `node --test`; expected no new failures relative to baseline (eight known Windows fixture failures). Run `git diff --check`.
- [x] Obtain fresh-context whole-change review, resolve important findings, document verification and commit the implementation on the current branch.
