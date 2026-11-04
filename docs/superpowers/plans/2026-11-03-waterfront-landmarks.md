# SG-035 and SG-036 implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task with failing tests before geometry.

**Goal:** Replace the generic Clifford Pier and Customs House masses with recognisable conserved waterfront buildings.
**Architecture:** Independent procedural `info` / `build(kit, site)` modules, existing landmark kit, generated city anchors and altitude-aware collisions.
**Tech Stack:** JavaScript, Three.js, Node test runner, existing city generator.
**Spec:** `docs/clifford-pier.md`, `docs/customs-house.md`, shared modelling guide and checklist.

## Global constraints

Exclusive merged claim PR #15. Preserve SG-032's hotel/link and all unrelated buildings. Fewer than 65,000 triangles and 16 batches per site; zero flicker. No runtime reference photos or new dependency pipeline. Review status until shared acceptance.

## Review focus

Wrong vertex-average origin, overlooked tower parts, filled hall or water basin, missing elevated roof collision, and generic neighbours surviving underneath replacements.

### Task 1: Clifford Pier

- [x] Add failing tests in `tests/landmark-models.test.cjs` for generated registration, independently located hall/portal/arcade openings and solid gable roofs.
- [x] Implement `js/landmark-models/clifford-pier.js`; register exactly three ways and relation 13262097 in `tools/city/cities/singapore.mjs`.
- [x] Regenerate geodata; verify geometry, collisions, finite bounds, batches and flicker.

### Task 2: Customs House

- [x] Add failing tests for exact five replacement ways, 23 m lookout, open basin and passable pavilion with solid roof.
- [x] Implement `js/landmark-models/customs-house.js`, preserving separate way 987031386; register and regenerate city.
- [x] Verify geometry, collisions, finite bounds, batches and flicker.

### Task 3: Visual verification and delivery

- [x] Inspect source-aligned roof/elevation previews in Tiny/day, WebGL/WebGPU and the loaded city. Capture useful evidence.
- [x] Run targeted tests and complete suite in Linux/WSL with LF sources; distinguish platform failures.
- [x] Review changes, update source-note evidence and checklist rows, open implementation PR, insert its actual link and leave rows at review.

## Progress

Baseline: 84 targeted checks pass. Both claims merged in PR #15. Source notes establish exact boundaries before implementation. The user's request delegates building selection and routine implementation choices; proceed with the existing procedural workflow.

Implementation and visual passes complete. A geographic basin probe caught an origin error caused by generator simplification joining the north edge; selecting the southern long edge fixes it. A new roof-envelope regression caught protruding trusses before their height was corrected. 93 targeted / 522 full Linux checks passed. Independent review found upper glazing and structural arch collision omissions; both have failing-then-passing regression checks and fixes. Model/evidence PR: [#16](https://github.com/datainvestor/tiny-singapore/pull/16). Both checklist rows remain at review for shared acceptance.
