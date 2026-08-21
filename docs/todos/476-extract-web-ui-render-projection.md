---
title: 'TODO: Extract web UI render projection'
priority: Medium
effort: 3-5d
created: 2026-08-21
issue: null
status: Open
completed: null
---

# TODO: Extract Web UI Render Projection

## Problem Description

The editor state currently owns both editor behavior and render preparation. `CodeBlockGraphicData` combines source
code, cursor and selection behavior, semantic directive results, pixel geometry, widget layout, and render-ready sprite
IDs. The top-level state also contains sprite lookups and precalculated layout for other UI elements.

This coupling makes editor behavior depend on the canvas presentation model, broadens the state contract consumed by
`web-ui`, and makes it difficult to change rendering without changing editor-state. It also obscures which cached values
are editor semantics and which belong to a replaceable render projection.

Logical layout that affects editor behavior must remain editor-owned. In particular, code-block gaps and display-row to
source-row mappings are used by caret movement and hit-testing. Graphics may consume those values to derive pixels, but
must not become their source of truth.

## Proposed Solution

Create an `@8f4e/web-ui-render-projection` package under web-ui that derives immutable, web-specific render data from
editor state and rendering resources. The package should expose pure derivation functions and a projection controller
that updates render snapshots outside the render loop. `web-ui` should eventually render from this projection plus
explicit frame-time inputs such as WebAssembly memory views.

The editor application is the composition root and must initialize editor-state and web-ui-render-projection as sibling
layers. `web-ui-render-projection` may consume the public editor-state contract, but editor-state must not import,
initialize, or read web-ui-render-projection.

Use stable code-block IDs to connect editor entities to render records. Do not copy the complete editor state into a
parallel object. Keep source and behavioral state authoritative in editor-state, keep semantic derivations there when
compiler or interaction logic consumes them, and place render-only geometry and sprite resolution in projected render
data.

## Anti-Patterns

- Do not create a second full copy of `State` with ambiguous ownership and synchronization rules.
- Do not add an editor-state dependency on web-ui-render-projection, including as a temporary migration shortcut.
- Do not move logical gaps, display/source row mappings, raw cursor coordinates, or semantic directive results merely
  because rendering also consumes them.
- Do not make editor-state read projected render data to perform caret movement or other source-level behavior.
- Do not precalculate values that change independently every frame, such as current WebAssembly meter samples.
- Do not rely on code-block object identity across editor-state and the render projection; join them through stable IDs.
- Do not mutate editor-state or projected render data from a renderer draw function.

## Implementation Plan

### Step 1: Extract Pure Code-Glyph Resolution

- Create the `@8f4e/web-ui-render-projection` package under web-ui.
- Add render-ready code-cell resolution as a pure, independently tested graphics function.
- Preserve the legacy editor-state resolver and current `codeToRender` ownership temporarily; remove both only after an
  application-composed render projection owns the production call path.
- Continue treating logical gaps and display-row mappings as editor-state inputs.

### Step 2: Use Existing Runtime Code-Block Identity

- Use `creationIndex`, the existing monotonic and non-reused runtime identifier, to join editor blocks to render data.
- Keep project serialization unchanged; runtime identity resets when a project is loaded and does not need persistence.
- Guard future asynchronous projection work against stale results across project reloads rather than adding a parallel
  block identifier.

### Step 3: Add A Narrow Render Projection

- Introduce `WebUiRenderData` with sprite resources and code cells keyed by the runtime code-block identifier.
- Build a web-ui-render-projection controller that subscribes to committed editor changes and recalculates only affected
  blocks.
- Invalidate all code glyphs when font, color scheme, cell metrics, or the sprite atlas changes.
- Publish coherent snapshots with structural sharing for unchanged records.

### Step 4: Switch Code Rendering To Projected Render Data

- Pass editor state, projected render data, and frame-time memory inputs explicitly to `web-ui` during migration.
- Read resolved code cells from projected render data in the code-block drawer.
- Remove `codeToRender` and sprite-dependent code highlighting from editor-state after parity is verified.

### Step 5: Extract Remaining Render-Only Layout

- Move widget pixel geometry while retaining widget semantics and memory references in editor-state.
- Move block pixel bounds, cursor pixel coordinates, entry outlines, and viewport-anchored pixel positions.
- Move tooltip, dialog, context-menu, and overlay render layout where those values have no editor-behavior consumer.
- Keep logical gaps, grid positions, semantic visibility directives, and source/display row mappings editor-owned.

### Step 6: Harden Projection Updates

- Replace direct mutations that bypass state notifications with store actions or committed change notifications.
- Add batching so render projection derivation never observes a partially completed editor action.
- Ensure async sprite generation cannot publish stale resources after a newer font or color request.
- Remove render-loop writes, including runtime position-offset mutations of code-block state.

## Validation Checkpoints

- `! rg -n "@8f4e/web-ui-render-projection" packages/editor/packages/editor-state --glob '!dist/**'`
- `npx nx run @8f4e/web-ui-render-projection:test`
- `npx nx run @8f4e/web-ui-render-projection:typecheck`
- `npx nx run @8f4e/web-ui-render-projection:build`
- `npx nx run @8f4e/editor-state:test`
- `npx nx run @8f4e/editor-state:typecheck`
- `npx nx run @8f4e/web-ui:test`
- `npx nx run @8f4e/web-ui:typecheck`
- `npx nx run @8f4e/editor:test`
- `npx nx run @8f4e/editor:typecheck`

## Success Criteria

- [ ] `web-ui` renders from an explicit render projection rather than the complete mixed editor state.
- [x] Editor-state has no source, manifest, or build dependency on web-ui-render-projection.
- [ ] Render-ready sprite IDs and sprite resources are absent from editor-state.
- [x] Logical gaps and display/source row mappings remain editor-owned and retain caret behavior coverage.
- [x] Runtime-stable `creationIndex` values connect code-block editor entities to projected render records.
- [x] Render-data derivations are pure and covered independently from canvas rendering.
- [ ] Render projection updates are granular, batched, and cannot publish stale async resources.
- [ ] Renderer draw functions do not mutate editor-state or projected render data.
- [x] Editor, editor-state, web-ui-render-projection, and web-ui tests and typechecks pass.

## Affected Components

- `packages/editor/packages/web-ui/packages/render-projection` - independently built web UI render-data projection package.
- `packages/editor/packages/editor-state` - retain editor/semantic state and remove render-only calculations incrementally.
- `packages/editor/packages/editor-state-types` - split editor-owned and graphics-owned public contracts.
- `packages/editor/packages/web-ui` - consume the render projection and remain a drawing layer.
- `packages/editor/src/index.ts` - compose editor state, render projection, sprite resources, and the renderer.
- `packages/editor/packages/state-manager` - potentially add batching or committed change notifications.

## Risks & Considerations

- **Missed invalidation**: Direct object mutations currently bypass store subscriptions. Keep parity tests and migrate
  mutation sites before relying on subscriptions as the only projection trigger.
- **Partial updates**: Synchronous path subscriptions can observe intermediate state. Introduce transaction or commit
  boundaries before enabling broad projections.
- **Interaction coupling**: Hit-testing and dragging need pixel geometry. Expose graphics queries keyed by block ID
  without moving source-level actions into projected render data.
- **Over-invalidation**: Font and atlas changes legitimately invalidate all glyphs, while code and cursor changes should
  normally invalidate only one block or one graphics field.
- **Frame-time data**: Runtime values should remain live inputs; only their static layout belongs in projected render
  data.
- **Breaking changes**: The public `State` and `CodeBlockGraphicData` shapes will narrow over several migration steps.

## Related Items

- **Related**: `docs/todos/295-unify-code-render-rows-and-width-derivation.md`
- **Related**: `docs/todos/307-optimize-state-manager-selector-tokenization-and-subscription-lookup.md`
- **Related**: `docs/todos/376-add-ascii-scene-renderer-for-editor-snapshots.md`

## Notes

- 2026-08-21: Agreed to keep logical gaps in editor state because caret movement consumes them.
- 2026-08-21: Completed the first part of Step 1 by adding pure render-ready code-cell resolution to the new
  `@8f4e/web-ui-render-projection` package with focused tests. The legacy editor-state resolver remains until the
  application composition layer can switch production ownership without introducing an editor-state dependency on the
  render projection.
- 2026-08-21: Composed editor-state and web-ui-render-projection as sibling layers in `@8f4e/editor`. The render
  projection subscribes to relevant editor-state changes, owns code syntax highlighting and sprite-ID resolution, and
  is passed explicitly to `web-ui`. Removed `codeToRender` and the legacy syntax-highlighting implementation from
  editor-state;
  logical display rows and gaps remain editor-owned. The projection uses the runtime-stable `creationIndex` as its join
  key and currently recalculates all code blocks, so granular invalidation, batching, and the remaining render-only
  fields are still follow-up work.
- 2026-08-21: Renamed `editor-graphics` to `editor-render-projection` to describe its role as a subscriber-maintained,
  render-ready projection of editor state rather than a graphics owner or renderer. It was then moved into a dedicated
  `@8f4e/web-ui-render-projection` package under web-ui because its sprite-ID output is specific to that renderer.

## Archive Instructions

When this TODO is completed, set `status: Completed`, add the completion date, move the file to `docs/todos/archived/`,
and move its index entry from Active TODOs to Completed TODOs with a short summary of the final boundary.
