# Contributing Editor Directives

This document describes how to add or refactor code-block-local editor directives in the editor codebase.

For user-facing editor directive syntax and semantics, see [editor-directives.md](./editor-directives.md).
For runtime directives, see [runtime-directives.md](./runtime-directives.md).

## Goal

Editor directives should be owned by the directive itself.

That means each directive should keep its:

- parsing
- derived code-block contributions
- widget and layout behavior
- directive-specific tests

in one place under the directives feature area.

The shared directive engine should stay generic. It should coordinate directive parsing and application, but it should not hardcode directive-specific behavior such as plotter buckets, wave rules, or layout switches.

This document is specifically about the code-block directive system under `code-blocks/features/directives/`. Global editor directives are a separate feature area and should follow the same ownership principle, but they do not live in this pipeline.

## Architecture Overview

There are two distinct concerns that must stay separate:

**Directive semantics** — what a directive means:
- parsing directive arguments
- deriving block state, layout, and widget contributions
- owned by each directive folder under `directives/`

**Directive editing** — how directive source lines are rewritten:
- inserting, removing, or updating directive lines in code
- canonicalizing directive placement
- owned by the shared `directiveEditing/` feature

## Directory Layout

Directive semantic code lives under:

`packages/editor/packages/editor-state/src/features/code-blocks/features/directives/`

Shared directive editing primitives live under:

`packages/editor/packages/editor-state/src/features/code-blocks/features/directiveEditing/`

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
  wave/
    data.ts
    plugin.ts
    resolve.ts
    data.test.ts
    resolve.test.ts

directiveEditing/
  index.ts
  removeDirective.ts
  upsertDirective.ts
  updateDirectiveArgs.ts
```

Each directive folder should contain its own semantic logic. Avoid putting directive-specific logic back into `registry.ts`. Source rewriting belongs in `directiveEditing/`.

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

## Shared Directive Editing Primitives

Use the helpers in `directiveEditing/` whenever you need to rewrite directive source lines:

```ts
import { removeDirective, upsertDirective, updateDirectiveArgs } from '../directiveEditing';
```

### `removeDirective(code, name)`

Removes all lines containing a directive with the given name.

```ts
// Remove all ; @group lines
code = removeDirective(code, 'group');
```

### `upsertDirective(code, name, args?)`

Ensures exactly one directive line with the given name exists, placed after the first line (block declaration). If the directive already exists, it is replaced.

```ts
// Insert or update ; @pos 10 20
code = upsertDirective(code, 'pos', ['10', '20']);

// Insert ; @disabled (no args)
code = upsertDirective(code, 'disabled');
```

### `updateDirectiveArgs(code, name, updater)`

Updates the arguments of all existing directive lines with the given name. Useful when you need to modify args without changing line placement.

```ts
// Toggle nonstick flag on ; @group directive
code = updateDirectiveArgs(code, 'group', ([groupName]) =>
  makeNonstick ? [groupName, 'nonstick'] : [groupName]
);
```

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

If you are adding a runtime directive instead of an editor directive, document it in [runtime-directives.md](./runtime-directives.md) instead.

If you need to insert or update the directive in source code (e.g., from an effect or action), use the `directiveEditing/` helpers rather than writing inline regex logic.

## Parsing

Directive syntax parsing is centralized.

The shared parser in:

- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/utils.ts`

handles the common syntax:

```txt
; @directiveName argument1 argument2 ...
; @directiveName argument1 @otherDirective
```

Multiple directives may share one comment line. Shared syntax utilities parse
one directive record per `@name` or `~name` token, and source-editing helpers
must preserve unrelated directives on the same line.

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

- one folder per directive for semantics
- `directiveEditing/` for all source rewriting mechanics
- generic shared directive engine
- generic directive syntax parsing
- directive-owned argument interpretation and widget logic
- directive-owned tests
- action features remain separate (e.g., `clearDebugProbes`, group togglers) but delegate source edits to `directiveEditing/`

Bad:

- central registry switches with directive-specific numbers or behavior
- shared directive state with concrete buckets like `plotters`
- directive logic split across unrelated feature folders
- directive-specific comment parsers that duplicate the shared syntax parser
- reintroducing directive-specific `updateGraphicData.ts` files outside `directives/`
- inline regex-based directive line manipulation in effect/action files (use `directiveEditing/` instead)
