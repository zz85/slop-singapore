# Raffles Hotel implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Replace the generic Raffles Hotel masses with a recognisable, source-led model and document a repeatable workflow for Codex, Claude Code and Meta Muse.

**Architecture:** One procedural landmark using the existing geometry kit. Anchor the drawing to mapped way 254815862; replace the hotel's individual building ways and its two enclosing relations. Build separate wings around the real courts rather than extruding the whole property. Keep source notes and a portable modelling README beside the code.

**Tech stack:** JavaScript, the landmark kit, OpenStreetMap geodata generator, Node tests, Three.js preview.

**Spec:** `docs/raffles-hotel.md`.

## Constraints and review focus

- Preserve surrounding buildings, roads and the open Palm Court, Palm Garden, Fern Court and Lawn.
- Use existing materials and merged geometry; aim below 65,000 triangles and 16 material batches.
- Document approximate elevations and small details honestly; reference photographs are not distributable assets.
- Check relation suppression, map alignment, upper-roof collisions, coplanar surfaces and both rendering backends.

## Tasks

- [x] Write failing anchor, courtyard, façade/roof and geometry-budget tests.
- [x] Register the correct source ways/relations and regenerate geodata.
- [x] Build the Beach Road main building, porch and corner pavilions, courtyard wings, Arcade, pool deck and planting.
- [x] Write source notes and `docs/landmark-modeling/README.md`, linked from the root README.
- [x] Run targeted tests; inspect roof plan, front, rear, Tiny/day, WebGL/WebGPU and city context. Refine against references.
- [x] Run the full suite in the supported Linux environment and obtain a fresh code review.
- [x] Commit, push and open a PR against `main`; leave merging to the user.

Validation: 49/49 targeted tests and 385/385 tests in a clean LF Linux checkout (Node 22.15.0); Tiny/day WebGL and WebGPU previews plus city context; 63,083 triangles, 15 material batches, zero reported flicker. The fresh reviewer approved the final fixes, including canopy replacements, corner roof collision and connected roof tiers.

Delivered in [PR #3](https://github.com/datainvestor/tiny-singapore/pull/3).
