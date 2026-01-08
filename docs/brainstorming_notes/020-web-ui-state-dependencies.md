# Web-UI State Dependencies

This note captures which editor-state fields the `@8f4e/web-ui` package reads or mutates from the shared state object.

## State surface used by `@8f4e/web-ui`

- `state.graphicHelper.spriteLookups` (read + write); expects lookups like `fillColors`, `fontLineNumber`, `fontMenuItemText`, `fontMenuItemTextHighlighted`, `background`, `icons`, `fontNumbers`, `fontCode`, `feedbackScale`, `plotter`, `pianoKeys`
- `state.graphicHelper.viewport` (read + write): `x`, `y`, `width`, `height`, `roundedWidth`, `roundedHeight`, `hGrid`, `vGrid`, `animationDurationMs?`, `center.{x,y}`, `borderLineCoordinates.{top|right|bottom|left}.{startX,startY,endX,endY}`
- `state.graphicHelper.codeBlocks` (iterated for rendering)
- `state.graphicHelper.selectedCodeBlock`, `state.graphicHelper.draggedCodeBlock`
- `state.graphicHelper.outputsByWordAddress` (Map lookup for wire rendering)
- `state.graphicHelper.contextMenu.{open,items,x,y,highlightedItem,itemWidth}` (and each item's `disabled`, `divider`, `title`)
- `state.graphicHelper.dialog.show`
- `state.console.logs`
- `state.editorSettings.font`
- `state.colorScheme`
- `state.featureFlags.{consoleOverlay,infoOverlay,viewportAnimations}`
- `state.compiler.{compiledModules,compilationTime,byteCodeSize,allocatedMemorySize}`
- `state.compiledConfig.{memorySizeBytes,runtimeSettings,selectedRuntime}`
- `state.runtime.stats.{timerExpectedIntervalTimeMs,timeToExecuteLoopMs,timerPrecisionPercentage,timerDriftMs}`
- `state.storageQuota.{usedBytes,totalBytes}`

## State fields written by `@8f4e/web-ui`

- `state.graphicHelper.spriteLookups` (written in `packages/editor/packages/web-ui/src/index.ts` during init and `reloadSpriteSheet`)
- `state.graphicHelper.viewport.hGrid` (written in `packages/editor/packages/web-ui/src/index.ts` during init and `reloadSpriteSheet`)
- `state.graphicHelper.viewport.vGrid` (written in `packages/editor/packages/web-ui/src/index.ts` during init and `reloadSpriteSheet`)
- `state.graphicHelper.viewport.x` (written in `packages/editor/packages/web-ui/src/index.ts` during render loop)
- `state.graphicHelper.viewport.y` (written in `packages/editor/packages/web-ui/src/index.ts` during render loop)

## Decoupling note

- Goal: move writes for `state.graphicHelper.spriteLookups`, `state.graphicHelper.viewport.hGrid`, and `state.graphicHelper.viewport.vGrid` out of `@8f4e/web-ui` and into the editor package so the render layer is read-only for those fields.
