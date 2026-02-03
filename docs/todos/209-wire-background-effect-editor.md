---
title: 'TODO: Wire background effects into the editor via targeted shader blocks'
priority: High
effort: 2-3h
created: 2026-02-03
status: In Progress
completed: null
---

# TODO: Wire background effects into the editor via targeted shader blocks

## Context

Todo 158 added `BackgroundEffectManager` and the `setBackgroundEffect`/`clearBackgroundEffect` API
to glugglug (Engine + Renderer). Todo 185 established the single-effect, first-block-selection pattern
for post-process shaders using bare `fragmentShader` / `vertexShader` markers.

This todo extends the shader block syntax with a **target** suffix so that a single project can drive
both the post-process and background pipelines from code blocks:

```
fragmentShader postprocess   →  post-process fragment
fragmentShader background    →  background fragment
vertexShader postprocess     →  post-process vertex
vertexShader background      →  background vertex
```

End markers stay unchanged: `fragmentShaderEnd`, `vertexShaderEnd`.
`getBlockType` already matches targeted markers (its regex is `/^\s*fragmentShader(\s|$)/`), so
`CodeBlockType` and syntax-highlighting paths are unaffected.

No backward compatibility for bare markers — the only existing usage (`rippleEffect.ts`) is updated here.

## What has already been done (partial progress)

- `derivePostProcessEffects.ts` has been **renamed** to `deriveShaderEffects.ts` via `mv`.
  The file contents have NOT been rewritten yet — it still contains the old code under the old
  function name. This is the first thing to finish.
- All source files have been read and the exact edits are known (see below).

## Files to edit and exact changes

All paths are relative to `packages/editor/`.

### 1. `packages/editor-state/src/features/shader-effects/extractShaderSource.ts`

Change the function signature and start-marker match. End marker is derived from the first word
of the start marker (so `'fragmentShader postprocess'` → end marker `'fragmentShaderEnd'`).

```diff
-export default function extractShaderSource(code: string[], blockType: 'vertexShader' | 'fragmentShader'): string {
-	const endMarker = blockType + 'End';
+export default function extractShaderSource(code: string[], startMarker: string): string {
+	const baseType = startMarker.split(/\s+/)[0];
+	const endMarker = baseType + 'End';
```

```diff
-		if (trimmedLine === blockType) {
+		if (trimmedLine === startMarker) {
```

Update the JSDoc to describe the new param. Update the three inline vitest tests:
use `'vertexShader postprocess'` / `'fragmentShader background'` as both the code-block
first line and the second argument.

### 2. `packages/editor-state/src/features/shader-effects/deriveShaderEffects.ts`

Full rewrite of function + tests. Key points:

- Import `BackgroundEffect` from glugglug alongside `PostProcessEffect`.
- Function name: `deriveShaderEffects`. Return type: `{ postProcessEffects, backgroundEffects, errors }`.
- Four state variables: `postProcessFragment`, `postProcessVertex`, `backgroundFragment`, `backgroundVertex` (all `string | null`).
- Loop: `getBlockType` still returns `'fragmentShader'`/`'vertexShader'`. Extract target from
  `block.code[0].trim().split(/\s+/)[1]`. Skip if target is not `'postprocess'` or `'background'`.
  Pass `block.code[0].trim()` as the `startMarker` to `extractShaderSource`.
- Early break when all four slots are filled.
- Produce `postProcessEffects` array (0 or 1 element) if `postProcessFragment !== null`.
- Produce `backgroundEffects` array (0 or 1 element) if `backgroundFragment !== null`.
- Both fall back to `DEFAULT_VERTEX_SHADER` when their vertex source is null.
- Tests to cover: single postprocess fragment, single background fragment, paired vertex+fragment
  per target, first-block selection per target, blocks without target are skipped, vertex-only
  produces no effect, empty shader bodies for both targets.

### 3. `packages/editor-state/src/features/shader-effects/effect.ts`

- Change import: `derivePostProcessEffects` → `deriveShaderEffects` from `'./deriveShaderEffects'`.
- In `recomputeShaderEffects`: destructure `{ postProcessEffects, backgroundEffects, errors }`.
- Add `state.graphicHelper.backgroundEffects = backgroundEffects;`
- Add `events.dispatch('loadBackgroundEffect', backgroundEffects[0] ?? null);`
- Update the JSDoc comment on the function.

### 4. `packages/editor-state/src/features/code-blocks/types.ts`

- Add `BackgroundEffect` to the existing glugglug import:
  `import type { SpriteLookup, PostProcessEffect, BackgroundEffect } from 'glugglug';`
- Add field to `GraphicHelper`:
  `backgroundEffects: BackgroundEffect[];`

### 5. `packages/editor-state/src/pureHelpers/state/createDefaultState.ts`

- Add `backgroundEffects: [],` right after the existing `postProcessEffects: [],` line (line 35).

### 6. `packages/editor-state/src/pureHelpers/testingUtils/testUtils.ts`

- Add `backgroundEffects: [],` right after the existing `postProcessEffects: [],` line (line 244).

### 7. `packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`

- In the `blockType` parameter union (line 108), replace
  `'vertexShader' | 'fragmentShader'`
  with
  `'vertexShader postprocess' | 'vertexShader background' | 'fragmentShader postprocess' | 'fragmentShader background'`

- Replace the two shader creation branches (lines 117-120):
  ```diff
  -			} else if (blockType === 'vertexShader') {
  -				code = ['vertexShader', '', '', 'vertexShaderEnd'];
  -			} else if (blockType === 'fragmentShader') {
  -				code = ['fragmentShader', '', '', 'fragmentShaderEnd'];
  +			} else if (blockType === 'vertexShader postprocess' || blockType === 'vertexShader background') {
  +				code = [blockType, '', '', 'vertexShaderEnd'];
  +			} else if (blockType === 'fragmentShader postprocess' || blockType === 'fragmentShader background') {
  +				code = [blockType, '', '', 'fragmentShaderEnd'];
  ```

### 8. `packages/web-ui/src/index.ts`

- Add `BackgroundEffect` to the glugglug import:
  `import { Engine, PostProcessEffect, BackgroundEffect } from 'glugglug';`
- Add to the return-type object and the returned object:
  ```typescript
  loadBackgroundEffect: (effect: BackgroundEffect | null) => void;
  ```
  Implementation mirrors `loadPostProcessEffect`:
  ```typescript
  loadBackgroundEffect: (effect: BackgroundEffect | null) => {
  	if (effect) {
  		engine.setBackgroundEffect(effect);
  	} else {
  		engine.clearBackgroundEffect();
  	}
  },
  ```

### 9. `packages/editor/src/index.ts`

- Add `BackgroundEffect` to the existing type import from glugglug:
  `import type { PostProcessEffect, BackgroundEffect } from 'glugglug';`
- Add event wiring (right after the existing `loadPostProcessEffect` listener):
  ```typescript
  events.on<BackgroundEffect | null>('loadBackgroundEffect', effect => {
  	view.loadBackgroundEffect(effect);
  });
  ```

### 10. `packages/examples/src/projects/rippleEffect.ts`  (line 85)

- Change `'fragmentShader'` to `'fragmentShader postprocess'`.

## After all edits

1. Run `npx nx run-many --target=typecheck --all` — must pass.
2. Run `npx nx run-many --target=test --all` — must pass (snapshots may auto-update).
3. Commit on branch `feat/158-add-background-effect` in the main repo.
4. Push.

## Related

- Todo 158 — background effect pipeline (glugglug, already implemented and pushed)
- Todo 185 — single-effect post-process simplification
