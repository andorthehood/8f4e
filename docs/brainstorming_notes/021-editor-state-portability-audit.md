---
title: 'Editor State Portability Audit (JS/Browser Dependencies)'
priority: Medium
effort: 1-2h
created: 2026-01-08
status: Draft
---

# Editor State Portability Audit (JS/Browser Dependencies)

## Problem Description

The editor-state package should avoid browser-specific APIs, JS-only data structures, and runtime-specific globals so it can be ported to a more performant language (e.g. Rust). This note captures current dependencies that would complicate such a port.

## Findings

### Browser APIs / Globals
- `navigator.storage.getDirectory()` (OPFS) in `packages/editor/packages/editor-state/src/effects/menu/menus.ts:103`
- `navigator.clipboard.readText()` / `navigator.clipboard.writeText()` in `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts:127` and `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts:197`
- `performance.now()` in `packages/editor/packages/editor-state/src/effects/compiler.ts:35` and `packages/editor/packages/editor-state/src/effects/compiler.ts:66`
- `atob` / `btoa` in `packages/editor/packages/editor-state/src/pureHelpers/base64/decodeBase64ToUint8Array.ts:7` and `packages/editor/packages/editor-state/src/pureHelpers/base64/base64Encoder.ts:15`

### JS-Specific Collections
- `Map` and `Set` in core types and state defaults: `packages/editor/packages/editor-state/src/types.ts:249`, `packages/editor/packages/editor-state/src/types.ts:285`, `packages/editor/packages/editor-state/src/types.ts:347`, `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts:42`
- `Map`/`Set` used in logic and helpers: `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/derivePostProcessEffects.ts:25`, `packages/editor/packages/editor-state/src/pureHelpers/shaderEffects/derivePostProcessEffects.ts:60`, `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/gapCalculator.ts:29`, `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/reverseGapCalculator.ts:28`, `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts:246`, `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts:169`, `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockDecorators/pianoKeyboard/parsePressedKeys.ts:4`

### Typed Arrays (JS Runtime Feature)
- `Uint8Array`, `Int32Array`, `Float32Array` in base64 utilities and serialization: `packages/editor/packages/editor-state/src/pureHelpers/base64/decodeBase64ToUint8Array.ts:5`, `packages/editor/packages/editor-state/src/pureHelpers/base64/decodeBase64ToInt32Array.ts:7`, `packages/editor/packages/editor-state/src/pureHelpers/base64/decodeBase64ToFloat32Array.ts:7`, `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToProject.ts:19`, `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToRuntimeReadyProject.ts:18`

### Dates / Timers
- `Date` / `Date.now()` in runtime logic: `packages/editor/packages/editor-state/src/impureHelpers/logger/logger.ts:6`, `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts:254`, `packages/editor/packages/editor-state/src/effects/codeBlocks/codeEditing.ts:46`, `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts:176`
- `setTimeout` in runtime logic: `packages/editor/packages/editor-state/src/effects/historyTracking.ts:14`

### RegExp Usage (JS Parsing)
- Regex construction and parsing: `packages/editor/packages/editor-state/src/pureHelpers/codeParsers/codeToRegex.ts:9`, `packages/editor/packages/editor-state/src/pureHelpers/codeParsers/insertCodeAfterLine.ts:11`, `packages/editor/packages/editor-state/src/pureHelpers/codeEditing/generateCodeColorMap.ts:6`, `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts:82`, `packages/editor/packages/editor-state/src/pureHelpers/codeParsers/lineToRegexString.ts:1`

### Test-Only JS Runtime Features
- `atob`, typed arrays, and `setTimeout` in tests such as `packages/editor/packages/editor-state/src/effects/runtimeReadyProject.test.ts:14` and `packages/editor/packages/editor-state/src/effects/disableCompilation.test.ts:74`

## Notes

Porting to Rust likely needs platform adapters for storage, clipboard, timers, perf, and base64, plus replacing `Map`/`Set` and typed arrays with language-native equivalents.
