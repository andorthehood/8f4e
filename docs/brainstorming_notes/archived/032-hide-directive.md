# 032: Editor `@hide` Directive

## Goal

Add a new editor-only directive:

```txt
; @hide
```

When placed inside a module, it hides the code that comes after the directive.

## Proposed Semantics

- `@hide` is an editor-only directive. It does not affect compiler output.
- It is valid only inside `module` blocks.
- The first valid `; @hide` line in the module wins.
- All lines after `; @hide` are hidden until `moduleEnd`.
- `moduleEnd` remains visible so the block shape is still legible.
- When the block is selected for editing, the block should temporarily expand so the hidden code remains editable.
- When the block is no longer selected, it collapses again.

This avoids the failure mode where hidden code cannot be reached in the editor.

## Why This Should Stay Editor-Only

The current meaning is presentational, not semantic. The compiler should continue to see the full module source. That keeps `@hide` aligned with existing editor directives such as `@favorite`, `@home`, `@pos`, and `@disabled`.

## Where To Implement It

No compiler changes should be required.

Primary editor changes would be in:

- `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `/Users/andorpolgar/git/8f4e/packages/editor/docs/editor-directives.md`

Add a small parser alongside the existing directive parsers:

- `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-blocks/features/disabled/parseDisabled.ts`
- `/Users/andorpolgar/git/8f4e/packages/editor/packages/editor-state/src/features/code-blocks/features/home/parseHome.ts`

Suggested parser shape:

```ts
type HideDirective = {
	hideAfterLine: number;
};

function parseHide(code: string[]): HideDirective | undefined;
```

## Important Constraint

The current renderer assumes `graphicData.code` maps directly to visible rows. That assumption is used by:

- text rendering
- syntax coloring
- caret placement
- click hit-testing
- gap insertion for widgets and errors

Because of that, `@hide` is not just a draw-time toggle. It needs an explicit visible-line mapping.

## Recommended Implementation Model

Introduce a display model for each code block:

```ts
visibleLines: string[];
visibleRowToRawRow: number[];
rawRowToVisibleRow: Map<number, number>;
```

Use that mapping when building:

- `codeToRender`
- `codeColors`
- caret row-to-pixel calculations
- click row resolution

For a collapsed module, render:

1. all lines up to and including `; @hide`
2. one synthetic placeholder line such as `; ... hidden ...`
3. `moduleEnd`

The raw source should remain unchanged in `graphicData.code`.

## Minimal MVP Option

A faster but less robust version would blank out the hidden lines during rendering while leaving the rest of the logic unchanged.

That is likely to create problems around:

- caret navigation
- click-to-line mapping
- overlays tied to raw line numbers
- future editor behavior

So it is useful only as a short-lived prototype.

## Suggested Tests

- parser tests for `parseHide`
- graphic-helper tests proving modules collapse after `@hide`
- tests proving selected blocks expand for editing
- docs updates with a canonical example

## Example

```txt
module oscillator
; @hide
loop
  push 1
  add
loopEnd
moduleEnd
```

Collapsed display:

```txt
module oscillator
; @hide
; ... hidden ...
moduleEnd
```
