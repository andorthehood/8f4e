# Contributing Editor Directives

This document describes how to add or refactor editor directives in the editor codebase.

For user-facing directive syntax and semantics, see [editor-directives.md](./editor-directives.md).

## Goal

Editor directives should be owned by the directive itself.

That means each directive should keep its:

- parsing
- derived code-block contributions
- widget and layout behavior
- directive-specific tests

in one place under the directives feature area.

The shared directive engine should stay generic. It should coordinate directive parsing and application, but it should not hardcode directive-specific behavior such as plotter buckets, scanner rules, or layout switches.

## Directory Layout

Directive code lives under:

`packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`

Typical structure:

```txt
directives/
  registry.ts
  types.ts
  utils.ts
  plot/
    data.ts
    plugin.ts
    resolve.ts
    data.test.ts
    resolve.test.ts
  scan/
    data.ts
    plugin.ts
    resolve.ts
    data.test.ts
    resolve.test.ts
```

Each directive folder should contain its own logic. Avoid putting directive-specific logic back into `registry.ts`.

## Directive Flow

The current directive pipeline is:

1. `deriveDirectiveState(code, options)` scans the block once and parses all registered directives.
2. Each directive plugin applies its own contributions to a shared draft.
3. `graphicHelper` consumes the derived result.
4. Directive-owned widget contributions optionally run `beforeGraphicDataWidthCalculation(...)` before width calculation.
5. Directive-owned widget contributions run `afterGraphicDataWidthCalculation(...)` after width calculation.

The important boundary is:

- directives contribute data and behavior
- the engine coordinates
- the renderer consumes derived state

## Shared Types

The main shared types are in:

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/registry.ts`

The derived directive state currently includes:

- `blockState`
- `displayState`
- `displayModel`
- `layoutContributions`
- `widgets`

`widgets` is intentionally generic. Do not add directive-specific buckets like `plotters`, `sliders`, or `pianos` to shared directive state.

## Adding a New Directive

Create a new folder under `directives/`, for example:

```txt
directives/
  hide/
    data.ts
    plugin.ts
    data.test.ts
```

Then:

1. Add a directive plugin in `plugin.ts`
2. If needed, add argument-to-data helpers in `data.ts`
3. Register the plugin in `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/registry.ts`
4. Add tests in the same directive folder
5. Update the user-facing docs in [editor-directives.md](./editor-directives.md)

## Parsing

Directive syntax parsing is centralized.

The shared parser in:

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/utils.ts`

handles the common syntax:

```txt
; @directiveName argument1 argument2 ...
```

Directives should not re-parse their own comment syntax.

Directive folders should only:

- interpret `args`
- derive typed directive data
- contribute block state, layout, display changes, or widgets

If a directive needs more context than a single line, keep that extra derivation logic inside the directive folder. Do not move it into the central registry.

## Block Contributions

Use `plugin.ts` to contribute block-level metadata such as:

- `disabled`
- `isHome`
- display transforms such as `@hide`

If a directive changes how code should be displayed, that should be modeled as a directive-owned contribution to the display model, not as a renderer hack in `graphicHelper`.

## Layout Contributions

If a directive needs extra vertical space, it should add a layout contribution from its own plugin.

Example shape:

```ts
draft.layoutContributions.push({
  rawRow: directive.rawRow,
  rows: 2,
});
```

Do not centralize directive layout rules in a global switch.

## Widget Contributions

Directive-owned widgets should use generic widget contributions.

A widget contribution can:

- `beforeGraphicDataWidthCalculation(...)`
- `afterGraphicDataWidthCalculation(...)`

Use `beforeGraphicDataWidthCalculation(...)` when the directive must affect graphic data before block width is computed, for example setting `minGridWidth`.

Use `afterGraphicDataWidthCalculation(...)` when the directive builds runtime/editor widgets after layout information is available.

The center should only iterate widget contributions. It should not know concrete widget categories.

## Testing

Keep directive tests in the directive folder.

Typical test split:

- `data.test.ts` for generic parse output plus argument-to-data derivation
- `resolve.test.ts` for widget/layout behavior through the real directive pipeline

Prefer testing through:

- `deriveDirectiveState(...)`
- `runBeforeGraphicDataWidthCalculation(...)`
- `runAfterGraphicDataWidthCalculation(...)`

instead of reviving old directive-specific update entry points.

## Boundaries To Preserve

Good:

- one folder per directive
- generic shared directive engine
- generic directive syntax parsing
- directive-owned argument interpretation and widget logic
- directive-owned tests

Bad:

- central registry switches with directive-specific numbers or behavior
- shared directive state with concrete buckets like `plotters`
- directive logic split across unrelated feature folders
- directive-specific comment parsers that duplicate the shared syntax parser
- reintroducing directive-specific `updateGraphicData.ts` files outside `directives/`
