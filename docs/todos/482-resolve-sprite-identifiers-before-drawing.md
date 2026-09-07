---
title: 'TODO: Resolve sprite identifiers before drawing'
priority: Medium
effort: 2-4h
created: 2026-09-06
issue: https://github.com/andorthehood/8f4e/issues/957
status: Open
completed: null
---

# TODO: Resolve Sprite Identifiers Before Drawing

## Problem Description

`glugglugglug` converts every `drawSprite()` identifier to a string and resolves it through a `Map`, then writes the
resolved dense sprite id and dimensions into its instance buffer. The editor already submits numeric sprite identifiers,
so every glyph still incurs string conversion and map lookup after its semantic sprite role has been resolved.

Atlas metadata is stable between atlas replacements. Resolve public identifiers once during setup and use dense numeric
ids to index CPU sprite metadata directly during drawing.

## Proposed Solution

Separate the public atlas lookup keys from resolved ids belonging to the active atlas:

- Keep public string or numeric keys available to setup-time resolution.
- Expose the resulting ids through an atlas setup result or an explicit resolver; choose one coherent API during
  implementation.
- Make the primary `drawSprite()` API accept resolved numeric ids and read dimensions from a dense array or packed table.
- Keep optional destination width/height behavior and the existing 20-byte GPU instance format unchanged.
- Update engine, utilities, sprite-generator integration, and editor consumers to resolve ids when the atlas changes.

Do not assume an arbitrary public numeric key equals its dense index. Sparse numeric keys, string names, and existing
string/number key normalization must resolve correctly on the cold path. Atlas replacement invalidates previously
resolved ids; consumers must rebuild their lookup tables rather than adding per-draw generation checks.

The API can change directly without compatibility shims. Preserve the package's validation-free drawing policy and
update its hot-path ADR to reflect the relocation of identifier resolution.

## Preliminary Measurements

An isolated experiment on 2026-09-06 compared the existing renderer submission method with direct dense-array lookup in
headless Chrome 152. It used 4,096 sprite definitions, preallocated instance buffers, both default and explicit sprite
dimensions, alternating variant order, warmup rounds, and repeated median measurements. Two runs produced consistent
results and byte-identical instance data.

| Sprites per frame | Current CPU submission | Dense lookup | Approximate reduction |
| ----------------- | ---------------------- | ------------ | --------------------- |
| 10,000 | 0.197 ms | 0.120 ms | 39% |
| 100,000 | 2.30 ms | 1.67 ms | 27% |

These timings exclude WebGL uploads and GPU rendering; they are not whole-frame speedups. The initial experiment bypassed
renderer construction and supplied prepared metadata directly. Retain a reproducible benchmark and add full API/rendering
coverage during implementation; the initial scripts were temporary.

## Implementation Plan

1. Define resolved-id types and the setup-time resolution API in `types.ts` and `spriteAtlas.ts`.
2. Retain dense CPU metadata alongside the existing GPU rectangle lookup and remove string/map resolution from drawing.
3. Migrate `Engine`, `SpriteTarget`, drawing utilities, examples, and the editor's sprite/glyph lookup setup.
4. Cover atlas replacement, default dimensions, sparse keys, mixed public identifiers, and rendered output.
5. Update README/API documentation and the hot-path ADR; repeat submission and representative frame benchmarks.

## Success Criteria

- [ ] `drawSprite()` performs no identifier string conversion or map lookup.
- [ ] Public names and sparse numeric keys resolve to the correct dense ids during setup.
- [ ] Default dimensions, explicit dimensions, sprite order, and emitted instance bytes retain their behavior.
- [ ] Editor sprite roles and font tables are rebuilt against the active atlas after replacement.
- [ ] Utilities and cache builders use the same resolved-id drawing contract.
- [ ] Ordinary ids remain compatible with TODO 468's high-bit cache flag; resolving public numeric keys does not pass
      them through as encoded GPU ids.
- [ ] Invalid or stale ids remain programmer errors without new per-sprite runtime validation.
- [ ] Unit tests, typechecks, and visual regressions pass; retained benchmarks distinguish CPU submission from frame time.

## Affected Components

- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/{types,spriteAtlas,renderer,engine}.ts`
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/src/utils/`
- `packages/editor/packages/editor-core/packages/web-ui/packages/glugglugglug/docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md`
- `packages/editor/packages/editor-core/packages/web-ui/packages/sprite-generator/` and editor atlas/glyph setup
- `packages/editor/packages/editor-core/packages/web-ui/src/drawContext.ts`

## Validation Checkpoints

- `npx nx run glugglugglug:build`
- `npx nx run-many --target=test --projects=glugglugglug,@8f4e/web-ui,@8f4e/sprite-generator`
- `npx nx run-many --target=typecheck --all`
- `npx nx run glugglugglug:test:screenshot`
- Repeat byte-equivalence and browser submission benchmarks; validate the migrated setup API with actual rendering.

## Related Items

- [TODO 468: Add shader-batched raster caches to glugglugglug](archived/468-add-shader-batched-raster-caches-to-glugglugglug.md) —
  coordinate ordinary sprite ids and cache-builder inputs with its encoded cache-id design.
