# Fullerton Waterboat House Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. The user authorised autonomous execution on 3 November 2026.

**Goal:** Model SG-034's restored historic house and glass annexe at the real city location.

**Architecture:** A procedural `build(kit, site)` model uses the existing kit.
The western historic wing follows the mapped curved street edge, with a taller
rounded southern end, roof terraces and a lower separate eastern glass annexe.
The source way supplies the anchor; only that way is replaced.

**Tech Stack:** JavaScript modules, existing landmark kit, Node tests, city generator.

**Spec:** [Source notes and modelling contract](../../fullerton-waterboat-house.md).

## Global Constraints

- User-assigned SG-034 only; preserve neighbouring buildings and garden paths.
- Replace way 172931401 only; do not add an enclosing site slab or collider.
- Below 65,000 triangles and 16 material batches; zero coplanar flicker.
- Clearly distinguish mapped dimensions and photograph-based estimates.
- Checklist remains unchecked until accepted on the shared branch.

## Review Focus

- Main wing/annexe gap and clearance below the elevated glazed connection.
- Southern round end and stepped roof at map distance.
- Projection of balcony/eyebrow geometry against the mapped street edge.
- Slabs and roof interiors stop descent without blocking adjacent paths.
- Generated source IDs and city registration preserve nearby landmarks.

## Task 1: Integrate and build the architectural model

**Files:** `tests/landmark-models.test.cjs`,
`js/landmark-models/fullerton-waterboat-house.js`,
`tools/city/cities/singapore.mjs`, generated `js/singapore-geodata.js`.

- [x] Add tests for exact replacement, bounded low massing, separate annexe,
  independent geographical clear/solid probes, elevated roof/bridge collision,
  finite geometry, budgets and flicker. Run the SG-034 tests and observe the
  missing-anchor assertion fail before implementation.
- [x] Register the single way; implement photo-guided plaster masses, window
  recesses/shades, balcony rails, roof terraces/pavilion, glass annexe and
  elevated link using kit primitives. Document estimated heights in source notes.
- [x] Regenerate the city. Run the targeted guide command; expected all pass.

## Task 2: Render, review and deliver evidence

**Files:** `docs/fullerton-waterboat-house.md`, `docs/landmark-checklist.md`,
useful captures in `docs/images/`.

- [x] Inspect roof, street, river side and complete model renders in Tiny/day,
  WebGL/WebGPU, plus the loaded city at map distance. Correct observed defects
  and rerun affected checks.
- [x] Run full suite; expected baseline's eight Windows fixture failures only.
  Attempt the documented Linux route if available; record platform limits.
- [x] Review final diff, exact replacement IDs, collision evidence and sources.
  Record renders, budgets and limitations. Keep checklist status honest and
  use a real PR URL only if a PR is opened.
