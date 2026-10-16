# Editor presentation mode and hidden directive removal audit

Recorded on 2026-10-16 against commit `d189d3ff33d33f6d75cc17db5153a809ad046489` on `main`.

The intended cleanup removes editor presentation mode and the `@hidden` directive while retaining the animated
selection outline and smooth viewport movement for ordinary navigation. The project is unreleased, and the user
explicitly permits breaking changes, so obsolete contracts can be removed without compatibility aliases or a
deprecation period.

**Status: implemented and verified** on branch `ai/remove-editor-presentation`. After saving the audit, the user
authorized implementation. The working tree was clean apart from this saved audit when implementation began.
The outcome and verification are recorded below; the inventories and historical behavior descriptions preserve
the audit baseline.

## Confirmed scope

The user's decisions, including corrections to the initial audit, are:

1. Remove presentation mode and adjacent functionality that becomes unnecessary without it.
2. Remove `@hidden`, including its temporary reveal behavior.
3. Keep the animated outline and apply it to ordinary selected code blocks in both edit and view modes.
4. Preserve smooth viewport animation for normal Command+Arrow navigation in both edit and view modes.
5. Save the audit before implementation so these decisions survive conversation compression.

The initial proposal to delete the outline and retain `@hidden` is superseded. Neither should be used as the basis
for implementation. Keeping the outline does not require retaining presentation countdown state.

## Implementation outcome

- Removed the presentation effect, stop parser, stop navigation events, timers, countdowns, availability hint,
  presentation mode, and presentation state. Removed five presentation feature/type files and their integration.
- Removed the hidden directive plugin and its tests, hidden-state fields, selection-only body rendering, and the
  F9 reveal override with its keyup/blur listeners. Formerly hidden blocks now render normally.
- Kept the four-character selection outline in both view and edit modes. It advances one perimeter step every
  80 ms using `performance.now()`, loops continuously, and keeps its phase when selection changes. It uses no
  presentation state, scheduler, or additional timer. Tests can provide an explicit timestamp.
- Preserved the shared viewport animator, cubic easing, normal 500 ms duration, navigation targets, and
  Command/Control+Arrow handling in both modes. Favorites, home alignment, and viewport anchors remain.
- Moved cancellation of pending viewport animation on editor disposal into the viewport effect. Presentation
  cleanup previously supplied that cancellation even for ordinary navigation. The exported animation-stop helper
  remains necessary for this shared lifecycle behavior, superseding the audit suggestion to make it internal.
- Removed the redundant `InitialEditorMode` type and used `EditorMode` directly. Kept the initial-mode option,
  mode flags, editing/caret behavior, the separate hide directive, and the F9 keyboard-memory input mapping.
- Removed all 23 stop directive comment lines, including their 20 hidden directives, from the three example and
  benchmark sources. Updated current documentation and replaced stop examples in generic parser tests.
- Added deterministic outline tests and screenshots for both modes and animation phases. Updated the existing
  switches screenshot to include the selected-block outline and freeze its animation clock.

## Implementation verification

Verified with Node 24.16.0 using Nx. Builds and tests ran sequentially so tests consumed stable dependency outputs.

| Check | Result |
| --- | --- |
| Both website production builds | Passed, including 37 dependency tasks. |
| Editor state tests | 1,159 passed across 153 files. |
| Editor core tests | 82 passed across 20 files. |
| Web UI unit tests | 73 passed across 22 files. |
| Shared editor test helpers | 5 passed in one file. |
| Default editor composition tests | 40 passed across 6 files. |
| Editor test total | 1,359 passed across 202 files, with no reported type errors. |
| Type checks | Passed for editor-state-types, editor-state, editor-core, web-ui, editor-state-testing, and editor-default. |
| Examples test target | Passed; its dependent CLI suite passed 35 tests. No embedded example-module tests were found. |
| Browser screenshots | All 8 tests across 6 files passed after reviewing the new/updated baselines. |
| Formatting and whitespace | Biome checks and `git diff --check` passed. |

Regression coverage verifies modified-arrow dispatch for both modes and both platform modifiers, intermediate
viewport interpolation and final targets in both modes, and cancellation of an active animation on disposal in
both modes. Outline tests verify selection filtering, selection changes, animation progression, loop completion,
and different block/font grid sizes. Existing hide, home, viewport-anchor, editing, and runtime tests remain green.

The screenshot suite contains four new baselines for selected outlines in view/edit modes at initial/advanced
phases, plus the updated switches baseline. All five images were visually inspected. The initial browser run
created missing baselines and exposed the switches test's moving outline; freezing the screenshot clock resolved
that instability. The final full screenshot run passed without updating baselines.

Each edited example was also compiled from its original audit-baseline source and its cleaned source using the same
compiler. WebAssembly bytes and required memory sizes matched exactly:

| Source | Required memory bytes | Unchanged WebAssembly SHA-256 |
| --- | ---: | --- |
| `hymn_to_aurora.8f4e` | 114400 | `4863062a4523c7233b0568c08bb97d8af8ed35d8e551807f86608f871e62d50e` |
| `pneumatic.8f4e` | 708664 | `ee66cf111324ba0a27278a3ab63381b2e5de58913f14d678e901cc5096fbab66` |
| Benchmark `hymnToAurora.8f4e` | 114400 | `8de327d4e87bffeccc83363c043b3f9c5d3b3bc84f4fefe82b7443f8dcfc6cee` |

A final search found no removed directive, presentation event/state/type, hidden-rendering override, or redundant
initial-mode type identifiers in active package sources. Historical documentation remains as an audit trail.

## Source locations

Paths in the inventory use these prefixes, all relative to the repository root:

| Prefix | Directory |
| --- | --- |
| `CORE` | `packages/editor/packages/editor-core` |
| `STATE` | `packages/editor/packages/editor-core/packages/editor-state` |
| `TYPES` | `packages/editor/packages/editor-core/packages/editor-state-types` |
| `UI` | `packages/editor/packages/editor-core/packages/web-ui` |
| `TESTING` | `packages/editor/packages/editor-core/packages/editor-state-testing` |

## Presentation behavior before removal

- `EditorMode` currently allows `view`, `edit`, and `presentation`.
- From view mode, `p` dispatches `enterPresentationMode` when mode toggling is enabled.
- Entering presentation disables editing and code line selection.
- Full-line `@stop <order> <seconds> [alignment]` directives identify stops. The parser validates order, positive
  duration, and optional alignment, then sorts stops by order and code block creation index.
- The presentation effect selects stops, centers the viewport, schedules advances, handles previous/next stop
  events, recomputes stops after block changes, and recenters after viewport resizing.
- Entry returns immediately to view mode when there are no valid stops. A single stop does not schedule automatic
  advancement; presentation remains active until exited.
- Left and right arrows navigate stops. Escape exits presentation even when ordinary mode toggling is disabled.
- Presentation remembers the active stop when exited, allowing later entry to resume from that stop.
- On entering, it sets the shared viewport animation duration to 2,000 ms. Normal navigation defaults to 500 ms.
- At the end of a sequence, it returns the viewport to the starting position and enters view mode.
- The effect owns stop timers, a return-animation timeout, and the cached `canPresent` capability.
- The mode overlay advertises presentation only when stops exist and displays stop index and countdown while active.
- The outline renderer currently runs only in presentation mode. Its progress follows the current stop deadline.

Presentation state contains `canPresent`, `activeStopIndex`, `totalStops`, `remainingMs`, `currentStopDurationMs`, and
optional `deadlineAt`. All six fields can disappear once the outline has its own animation clock.

## Presentation removal inventory

### Files to delete

- `STATE/src/features/presentation/effect.ts`
- `STATE/src/features/presentation/effect.test.ts`
- `STATE/src/features/presentation/directives.ts`
- `STATE/src/features/presentation/directives.test.ts`
- `TYPES/src/features/presentation/types.ts`

The initial audit counted these five files plus the outline renderer as six files totaling 1,264 lines. That count
describes the original proposal. The 73-line outline renderer is now retained and adapted, and hidden-directive
cleanup adds a separate set of files and integration changes.

### Integration and types to update

- `STATE/src/index.ts`: remove the presentation import and effect registration.
- `STATE/src/features/editor-mode/effect.ts`: remove `enterPresentationMode` and its event subscription; retain
  view/edit transitions and their editing and caret-selection behavior.
- `STATE/src/features/editor-mode/effect.test.ts`: remove presentation cases and retain view/edit coverage.
- `TYPES/src/index.ts`: remove the presentation state import, `State.presentation`, and presentation type exports;
  narrow `EditorMode` to `view | edit`; update the `modeToggling` comment.
- `STATE/src/pureHelpers/state/createDefaultState.ts`: remove presentation defaults.
- `STATE/src/pureHelpers/testingUtils/testUtils.ts` and `TESTING/src/index.ts`: remove presentation mock state.
- `CORE/src/events/keyboardEvents.ts`: remove the `p` mode shortcut, presentation-specific arrow handling, and the
  presentation Escape exception. Preserve `e`, ordinary edit-mode Escape, text input, and modifier navigation.
- `CORE/src/events/keyboardEvents.test.ts`: remove presentation tests and preserve keyboard behavior in both modes.
- `UI/src/drawers/modeOverlay.ts`: remove the presentation hint, availability branch, and countdown formatter;
  retain view/edit hints and existing feature-flag controls.
- `UI/src/drawers/modeOverlay.test.ts`: replace presentation availability expectations with view/edit coverage.
- `UI/src/drawers/codeBlocks/index.ts`: replace the presentation-only outline condition with selected-block
  rendering that works in both remaining modes.
- `UI/src/drawers/codeBlocks/drawSelectedOutline.ts`: retain and adapt as described below.

The event names `enterPresentationMode`, `previousPresentationStop`, and `nextPresentationStop` become obsolete.
Remove their producers, consumers, and tests without leaving forwarding handlers or compatibility behavior.

## Hidden directive removal inventory

`@hidden` currently suppresses a block's body and background while it is unselected, leaving its corners visible.
Selecting the block reveals it. Holding F9 temporarily reveals all hidden blocks; key release or loss of focus
clears that override. This behavior is distinct from the separate `@hide` directive that collapses part of a block.

### Files to delete

- `STATE/src/features/code-blocks/features/directives/hidden/plugin.ts`
- `STATE/src/features/code-blocks/features/directives/hidden/plugin.test.ts`

### Integration and state to remove

- `STATE/src/features/code-blocks/features/directives/registry.ts`: remove the plugin import and registration and
  the derived `blockState.hidden` default.
- `TYPES/src/features/code-blocks/features/directives/types.ts`: remove `DirectiveBlockState.hidden`.
- `TYPES/src/features/code-blocks/types.ts`: remove `CodeBlockGraphicData.hidden` and
  `CodeBlockRendering.showHiddenCodeBlocks`, including their comments.
- `STATE/src/features/code-blocks/effect.ts`: remove derivation and assignment of `graphicData.hidden`, including
  its selection-dependent expression and block-creation property.
- `STATE/src/features/code-blocks/utils/createCodeBlockGraphicData.ts`: remove the `hidden` default.
- `STATE/src/pureHelpers/state/createDefaultState.ts`: remove `showHiddenCodeBlocks`.
- `STATE/src/pureHelpers/testingUtils/testUtils.ts` and `TESTING/src/index.ts`: remove `hidden` and
  `showHiddenCodeBlocks` mock defaults.
- `STATE/src/pureHelpers/testingUtils/testUtils.test.ts`: remove the normalization that deletes `hidden` from a
  block before comparing it.
- `CORE/src/events/keyboardEvents.ts`: remove F9 reveal handling, its keyup handler, the reveal-reset helper, and
  blur handling used only by temporary reveal. Keep unrelated keyboard input handling intact.
- `UI/src/drawers/codeBlocks/index.ts`: remove `renderHiddenPreview` and its conditional rendering branches so
  formerly hidden blocks render normally. Preserve disabled blocks, selection highlighting, carets, and widgets.
- `STATE/src/features/code-blocks/effect.test.ts`: remove selection-only hidden-block behavior tests.
- `STATE/src/features/code-blocks/features/directives/registry.test.ts`: remove hidden-state assertions and defaults;
  retain tests for the separate `@hide` collapse behavior.
- `UI/src/drawers/codeBlocks/index.test.ts`: remove hidden-block setup and corner-only/reveal-override expectations;
  adapt selected-block expectations for the retained outline.
- `CORE/src/events/keyboardEvents.test.ts`: remove F9 reveal/reset tests and reveal-specific mock state and setters.
  Retain tests proving keyboard events are routed to the editor that owns the input target.

F9 also appears in the keyboard-memory USB HID mapping. That mapping supports program keyboard input and is useful
independently; removing the editor's reveal shortcut does not justify removing the F9 key mapping.

## Retained outline animation

The current renderer draws a four-character segment around the selected block's perimeter. It derives the segment
position from `state.presentation.currentStopDurationMs` and `deadlineAt`; merely changing the renderer condition
would leave an animation dependency on the removed feature.

The confirmed requirement is an animated outline for the selected block in both edit and view modes. The proposed
implementation is to retain the perimeter geometry and characters and drive a continuous loop at a fixed speed
from a rendering clock, independently of presentation timers. The exact speed and whether changing selection
restarts the phase have not been specified by the user; choose a reasonable default during implementation.

Implementation should:

- Draw the outline whenever the block is selected in either remaining mode.
- Keep the existing selection corner colors, caret, line selection, and other block visuals.
- Read an animation timestamp or phase in the renderer without rebuilding semantic data or mutating editor state
  during drawing. A pure helper with an injectable timestamp would permit deterministic animation tests.
- Avoid retaining `PresentationState`, stop durations, deadlines, or a stop scheduler just to animate the outline.
- Handle different block sizes and selection changes without animation errors.
- Account for the new time-dependent visual in screenshot tests, using a controlled clock where needed.

## Viewport animation that must remain

The user explicitly requires smooth viewport animation during ordinary Command+Arrow navigation in edit and view
modes. The keyboard layer currently treats Command or Control plus an arrow as `navigateCodeBlock` and includes
the direction in its payload. The navigation effect is independent of presentation mode.

Preserve this path:

1. `CORE/src/events/keyboardEvents.ts` dispatches modifier-plus-arrow navigation.
2. `STATE/src/features/code-blocks/features/codeBlockNavigation/effect.ts` selects the target and calls
   `animateViewport`, passing the event dispatcher.
3. `STATE/src/features/viewport/animateViewport.ts` uses animation-frame callbacks, interpolates with cubic easing,
   updates the viewport, and emits viewport changes.

The navigation helper also animates movement to the current block's vertical edge. Favorites and `goHome` use the
same animation helper. Retain their behavior as well as the fallback that updates immediately when animation
callbacks or the event dispatcher are absent.

Keep the shared viewport animation state, frame scheduling/cancellation callbacks, and ordinary 500 ms duration.
The presentation-specific 2,000 ms override disappears with the presentation effect. Do not remove viewport
animation merely because one of its original commits was titled "ease presentation viewport."

Existing regression coverage includes the test named "should animate viewport when navigating between code blocks
if animation callbacks are available" in `codeBlockNavigation/effect.test.ts`. It checks the selected block,
animation target, unchanged initial viewport, final viewport, and `viewportChanged` event. Extend or parameterize
coverage for both editor modes and test keyboard dispatch as well as the navigation helper.

## Other shared functionality to retain

- View/edit modes, `initialEditorMode`, `modeToggling`, `modeOverlay`, editing flags, and code line selection.
  The product website starts editors in edit mode and disables mode switching in its homepage/gallery wiring.
- Ordinary block selection, favorites, `@home`, viewport dragging, snapping, grid rounding, and cursor centering.
- `ViewportBlockAlignment`, `parseViewportBlockAlignment`, and alignment options on `centerViewportOnCodeBlock`.
  `@home` now uses the same alignment support originally added for presentation stops.
- `viewportResized` and `viewportChanged` events. Viewport-anchored blocks consume these independently.
- The separate `@hide` directive, display-model collapse state, and expansion for editing.
- Generic parsing of multiple directives on one comment line. Replace test examples using `@stop` rather than
  deleting this capability.
- Number-font sprites and selection corner highlighting. Other renderers use them independently.
- Compiler/runtime behavior, memory views, and keyboard-memory input mapping.

## Adjacent simplifications

`InitialEditorMode` currently means `Exclude<EditorMode, 'presentation'>`. With only view and edit remaining, it is
redundant. Use `EditorMode` directly in `TYPES/src/index.ts` and `CORE/src/index.ts`, removing the extra type export.
Keep the `initialEditorMode` option itself and its forwarding through `editor-default`.

At the audit baseline, presentation was the only caller of `stopViewportAnimation` outside `animateViewport.ts`,
which initially suggested making it internal. Implementation established that presentation cleanup also canceled
ordinary navigation animation on editor disposal. That call now belongs to the viewport effect, so the export is
retained for the shared animation lifecycle.

Presentation is the only production code that overrides `viewportAnimation.durationMs`; the other production
assignments initialize it to 500 ms. Moving this fixed duration into the animator would be an optional further
simplification, rather than a requirement. Preserve normal navigation duration and animation if taking that step.

## Examples and documentation

At the audited revision, presentation directives occur in three sources:

| Source | Stop directives | Hidden directives |
| --- | ---: | ---: |
| `packages/examples/src/projects/audio/amigaMods/hymn_to_aurora.8f4e` | 11 | 10 |
| `packages/examples/src/projects/audio/amigaMods/pneumatic.8f4e` | 1 | 0 |
| `packages/examples/src/benchmarks/bytecode-size/hymnToAurora.8f4e` | 11 | 10 |
| Total | 23 | 20 |

All 20 hidden directives share lines with stop directives. Both are now in the removal scope, so those comment
lines can be removed entirely. Preserve program instructions and unrelated metadata. Removing comments can shift
source-line metadata; review resulting snapshots rather than assuming comment removal has no observable effect.

Update current documentation and parser examples:

- `docs/feature-flags.md`: remove the "Presentation Mode" usage example. Keep useful feature flags themselves.
- `CORE/docs/editor-directives.md`: replace the chained `@stop` example, remove the `@hidden` section and F9
  description, and explain `@home` alignment directly instead of comparing it with `@stop`.
- `STATE/src/features/code-editing/README.md`: update the mode list to view/edit.
- `STATE/src/features/code-blocks/features/directives/utils.test.ts` and
  `STATE/src/features/code-blocks/utils/__tests__/parseBlockDirectives.test.ts`: replace `@stop` in generic
  multi-directive examples with a supported directive such as `@pos`, retaining parser coverage.

Historical plans and agent notes can remain as historical records. Relevant examples include
`docs/agent_failure_notes/037-render-hot-path-semantic-derivation.md` and archived feature-flag proposals.
The general lesson in that failure note still applies: semantic directive processing belongs in editor-state,
not inside a rendering hot path. The word "presentation" in unrelated prose, such as tooltip presentation or
data representation, is not evidence of a dependency on presentation mode.

## Original pull requests and commit history

The original dedicated feature PR is
[PR 519, feat(editor): add presentation mode and editor modes](https://github.com/andorthehood/8f4e/pull/519),
merged on 2026-04-09. GitHub reports merge commit `93b43b852e3d8f08469558804fc8cd5c977b5052`; the checked-out main
history contains merge commit `cc4b2f45c53cf423c515b8569015bf611c0afd4b` for the same PR. The local repository contains
both sets of historical commit identifiers. The table below uses identifiers from the inspected main history.

PR 519 also changed editing-state gating and unified viewport updates. It is not suitable for a wholesale revert:
those shared changes remain useful. Its GitHub commit list includes the initial feature commit `a093f0781`, editing
gating simplification `439cd2df4`, oversized-block centering `c32287319`, viewport update refactors `4a0066938` and
`90aec0d89`, a main-branch merge `72f6cfcba`, and review fixes `8ef1d0d2b`.

| Date | Local commit | Contribution and cleanup implication |
| --- | --- | --- |
| 2026-04-09 | `cc4b2f45c` | Merge of PR 519; remove presentation-specific pieces while preserving view/edit and shared viewport work. |
| 2026-04-09 | `2948bbc76` | Presentation viewport easing; the animator is now shared with ordinary navigation. |
| 2026-04-09 | `3328980ac` | Stop alignment and viewport centering; keep alignment because home navigation uses it. |
| 2026-04-09 | `20cf59f87` | Arrow-key navigation between presentation stops; remove. |
| 2026-04-09 | `7d4598346` | Presentation state and countdown display; remove. |
| 2026-04-09 | `c08331231` | Initial selected-block outline, originally drawn for ordinary selection; retain the selected-block purpose. |
| 2026-04-09 | `8076ea626` | Extracted animated outline renderer; retain and adapt it. |
| 2026-04-09 | `eee30f842` | Stop duration state and related logic; remove its timing dependency from the retained outline. |
| 2026-04-10 | `772ab7d82` | Outline character-rendering fix; preserve corrected geometry and characters. |
| 2026-04-13 | `5456ed1ec` | Hidden directive and selection-only rendering; remove the feature. |
| 2026-04-13 | `108a7cdd3` | Temporary F9 reveal override; remove with hidden blocks. |
| 2026-04-15 | `a94bc0e27` | Preserved active stop index for presentation re-entry; remove. |
| 2026-04-20 | `5f40b7579` | Improved viewport easing; retain the shared animator's easing. |
| 2026-04-20 | `58c471824` | Return to the starting viewport after presentation; remove presentation restoration logic. |
| 2026-04-23 | `088e164c3` | Home viewport alignment; keep its consumers and shared alignment parser. |
| 2026-04-24 | `1adf0f580` | Cached presentation availability and conditional hint; remove with presentation state and overlay branches. |

GitHub's commit-to-PR lookup returned no associated PRs for the checked post-merge presentation additions, so the
direct commits above are the more useful references for that portion of the feature history.

Two later PRs establish shared behavior that should survive:

- [PR 917, fix(editor-state): align centered viewports to grid](https://github.com/andorthehood/8f4e/pull/917),
  merge `bde09ff9ade65614288e4f7c905c96fa30e8b241`. Grid-aligned centering serves home, ordinary navigation, and
  presentation, so retain it.
- [PR 929, feat(editor-core): support initial editor mode](https://github.com/andorthehood/8f4e/pull/929),
  merge `4a17914c914044aedb0555e08f20152eac374b8e`. Keep initial-mode configuration and website edit-mode behavior;
  simplify only the type distinction that existed to exclude presentation.

The historical PR named "hide-directive" is PR 396 and concerns the separate `@hide` feature. Do not treat its title
as evidence that `@hidden` and `@hide` are the same feature or revert it as part of hidden-block removal.

## Proposed implementation order

1. Retain the outline renderer, replace its presentation timing dependency, and cover selected blocks in both modes.
2. Remove presentation behavior, state, events, shortcuts, hints, and feature-specific tests.
3. Remove the hidden directive, its derived fields, render branches, reveal keyboard listeners, and tests.
4. Remove obsolete example comments and update current documentation and generic parser examples.
5. Simplify redundant types and internal exports without changing ordinary navigation animation.
6. Run relevant builds, tests, type checks, formatting, and a visual check before reporting completion.

## Completed verification checklist

- [x] View/edit entry, exit, initial mode, mode flags, caret movement, and text editing still behave correctly.
- [x] No active presentation effect, stop scheduler, presentation events, countdown state, or presentation hint remains.
- [x] Selected blocks receive the outline in both modes; unselected blocks do not.
- [x] The outline advances over time and loops independently of presentation state.
- [x] Outline behavior remains sound when selection, block size, or font grid changes.
- [x] Command+Arrow navigation dispatches in both edit and view modes; Control+Arrow handling remains intact.
- [x] Navigation changes selection, animates through intermediate positions, and reaches the correct target.
- [x] Navigation still emits viewport changes, preserves grid alignment, and supports repeated navigation.
- [x] Favorites, home navigation, viewport dragging, viewport anchors, and resize updates still work.
- [x] Formerly hidden blocks render normally; hidden state and F9 reveal listeners are gone.
- [x] The separate hide directive, block collapse behavior, and keyboard-memory F9 mapping remain.
- [x] Example programs retain their instructions and compile after obsolete comments are removed.
- [x] Screenshots account for selected-block outlines with deterministic timing where necessary.
- [x] Active code and docs contain no obsolete presentation/hidden references; historical notes and unrelated
  terminology are distinguished during the search.

Use Node 24.16.0 through `nvm use` and prefer Nx targets. Relevant commands after implementation include:

```sh
npx nx run-many --target=build --projects=@8f4e/editor-website,@8f4e/8f4e-website
npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/editor-core,@8f4e/web-ui,@8f4e/editor-state-testing
npx nx run-many --target=typecheck --projects=@8f4e/editor-state-types,@8f4e/editor-state,@8f4e/editor-core,@8f4e/web-ui,@8f4e/editor-state-testing,@8f4e/editor-default
npx nx run @8f4e/examples:test
npx nx run @8f4e/web-ui:test:screenshot
git diff --check
```

Build shared dependencies before tests that consume built aliases; keep builds and tests sequential so tests do not
observe changing outputs. Use Biome for changed TypeScript files. Review screenshot differences for the intentional
new outline and removed hidden-block rendering. Existing example snapshot coverage lives in the CLI; the examples
test target depends on that test suite.

## Completion checkpoint

Implementation and verification are complete in the working tree on `ai/remove-editor-presentation`. This document
preserves the scope, original history, shared-functionality decisions, implementation outcome, and checks alongside
the source changes and screenshot baselines.
