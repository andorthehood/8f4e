# Memory Churn Review

Date: 2026-04-08

This note captures a static code-review pass for likely memory churners. These are not profiler-confirmed hotspots yet. The ranking below is based on two factors:

- how allocative the code looks
- how likely it is to run frequently in a hot path

## Highest-suspicion churners

### 1. Post-process uniform uploads in the render loop

File: `/Users/andorpolgar/git/8f4e/packages/editor/packages/glugglug/src/postProcess/PostProcessManager.ts`

Relevant lines:

- `Object.entries(this.effect.uniforms)` around line 144
- `this.sharedBuffer.slice(mapping.offset, mapping.offset + size)` around line 148

Why this looks expensive:

- `Object.entries(...)` allocates an array of entries every frame when post-processing is active.
- `Float32Array.prototype.slice(...)` allocates a fresh typed array for every uniform upload.

Why it matters:

- This is in the true render path, so even modest per-frame churn can translate into steady GC pressure.

## Strong edit-path churners

### 2. Code block graphic rebuilds on edits, cursor movement, and selection changes

File: `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`

Relevant lines:

- `updateGraphics(...)` around line 67
- `displayModel.lines.map(...)` around line 86
- `new Array(line.length).fill(undefined)` around line 108
- `expandLineColorsToCells(...)` around line 125

Why this looks expensive:

- Rebuilds `codeToRender` using `map`, spread, `concat`, string formatting, and tab expansion.
- Rebuilds `codeColors` as fresh arrays for every line.
- Runs a fair amount of derived computation in one place.

Why it matters:

- This is not a per-frame renderer hotspot, but it is likely one of the biggest allocators while typing or moving the caret in larger blocks.

### 3. Syntax highlighting in 8f4e code

File: `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts`

Relevant lines:

- `code.map(...)` around line 177
- `line.matchAll(...)` around lines 181-182
- `new Array(line.length).fill(undefined)` around line 184
- nested `matchAll(...)` for binary zeros and ones around lines 230-231

Why this looks expensive:

- Multiple regex iterators are created per line.
- A new color array is allocated per line.
- Binary literal highlighting does extra nested regex passes.

Why it matters:

- Likely a major edit-time churn source for large blocks or rapid typing.

## Medium-suspicion churners

### 4. Tab expansion helpers

File: `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-editing/tabLayout.ts`

Relevant lines:

- `new Array(...).fill(32)` in `expandLineToCells(...)` around line 94
- `new Array(...).fill(undefined)` in `expandLineColorsToCells(...)` around line 117

Why this looks expensive:

- Tabs cause temporary arrays to be allocated and spread into result arrays.
- These helpers are called from `updateGraphics(...)`, so the churn compounds with large blocks or many tabs.

Why it matters:

- Probably not the top problem by itself, but it amplifies the churn from the graphic rebuild path.

### 5. State-manager path tokenization during updates

Files:

- `/Users/andorpolgar/git/8f4e/packages/editor/packages/state-manager/src/set.ts`
- `/Users/andorpolgar/git/8f4e/packages/editor/packages/state-manager/src/getValueByPath.ts`

Relevant lines:

- `path.split('.')` in `set.ts` around line 8
- `String(selector).split('.')` in `getValueByPath.ts` around line 10

Why this looks expensive:

- Every `set(...)` call splits the selector path.
- Each subscription read can split another selector path through `getValueByPath(...)`.

Why it matters:

- Each allocation is small, but this sits underneath many state transitions, so it is a plausible broad background churn source.

## Notes on classification

- `glugglug` and `web-ui` code was treated as render-path code.
- `editor-state` code was treated as edit/update-path code.
- One-off setup code, tests, and example generation were intentionally not ranked even when allocative.

## Likely first profiling targets

If profiling starts later, the best first candidates to validate are:

1. `PostProcessManager.render(...)`
2. `graphicHelper.updateGraphics(...)`
3. `highlightSyntax8f4e(...)`

## Likely first optimization targets

If optimizing without profiling first, the safest high-signal targets appear to be:

1. Remove `slice(...)` and `Object.entries(...)` allocations from post-process uniform uploads.
2. Reduce whole-block array reconstruction in `updateGraphics(...)`.
3. Replace regex-iterator-heavy syntax highlighting with lower-allocation scans where practical.
