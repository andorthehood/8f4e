---
title: 'TODO: Add no-op cacheGroup compatibility helper to glugglug2 utilities'
priority: Medium
effort: 1-2h
created: 2026-08-19
issue: null
status: Completed
completed: 2026-08-19
---

# TODO: Add no-op cacheGroup compatibility helper to glugglug2 utilities

## Problem Description

The existing `web-ui` renderer calls the old `glugglug` `cacheGroup()` method around code-block drawing. `glugglug2`
does not yet implement raster caching, so migrating those call sites would require removing or conditionally rewriting
the cache callbacks before the rest of the renderer migration can proceed.

Add a deliberately non-caching compatibility helper to the optional `glugglug2/utils` drawing context. It should accept
the old `cacheGroup(cacheId, width, height, draw, enabled?, alpha?)` call shape, execute the drawing callback normally on
every invocation, and return `false`. This preserves current uncached rendering behavior while allowing consumers to
migrate their drawing API before the real cache design in TODO 468 is implemented.

## Proposed Solution

Add the following method to `DrawContext`:

```ts
cacheGroup(
	cacheId: string,
	width: number,
	height: number,
	draw: () => void,
	enabled: boolean = true,
	alpha: number = 1,
): boolean {
	draw();
	return false;
}
```

The signature should remain source-compatible with the old `glugglug` method for existing call sites. The compatibility
behavior is intentionally equivalent to old `glugglug` running with caching disabled:

- Execute `draw()` exactly once on every call, including repeated calls with the same `cacheId`.
- Execute `draw()` whether `enabled` is `true` or `false`.
- Preserve the `DrawContext` offset that is active when `cacheGroup()` is called.
- Ignore `cacheId`, `width`, `height`, and `alpha`; they exist only to retain the migration-friendly call shape.
- Return `false` because no cached content was created or reused.
- Propagate callback errors unchanged.

Keep this method on `DrawContext`, not on `SpriteTarget` or the core `Engine`. A sprite target only promises numeric
sprite submission, and the core renderer should not advertise caching until it owns real cache resources and behavior.

## Anti-Patterns

- Do not allocate textures, framebuffers, cache handles, maps, lookup tables, or retained instruction buffers.
- Do not remember `cacheId` values or suppress callbacks on repeated calls.
- Do not skip `draw()` when `enabled` is `false`; old uncached behavior still executes the callback.
- Do not reset, push, or pop coordinate offsets around the callback.
- Do not apply `alpha` to individual sprites or add alpha to the instance format as part of this compatibility helper.
- Do not add `cacheGroup()` to `SpriteTarget`; future cache builders only need structural `drawSprite()` compatibility.
- Do not add the old `hasCachedContent()`, `clearCache()`, `clearAllCache()`, `drawCachedContent()`, or cache-statistics APIs.
- Do not claim or imply that this method improves rendering performance.
- Do not automatically change this shim to real caching when TODO 468 lands. Decide the compatibility transition
  explicitly so existing call sites do not silently acquire new lifecycle or memory behavior.

## Implementation Plan

### Step 1: Add the compatibility method

- Add `cacheGroup()` to `DrawContext` with the old parameter order, defaults, and boolean return type.
- Document every parameter and state clearly that the method always renders uncached.
- Execute the provided callback directly without changing target or offset state.
- Keep the implementation free of cache metadata and per-call allocations beyond the callback already supplied by the
  consumer.

### Step 2: Add focused tests

- Verify `draw()` runs exactly once and `cacheGroup()` returns `false`.
- Verify repeated calls with the same id rerun the callback.
- Verify both `enabled: true` and `enabled: false` run the callback.
- Verify sprites submitted inside the callback inherit the current nested offset.
- Verify dimensions and alpha have no effect on forwarded sprite calls.
- Verify callback errors propagate and later balanced offset operations still behave normally.

### Step 3: Document the migration purpose

- Add the compatibility signature and no-cache semantics to the `glugglug2/utils` README section.
- Show that an old cache-wrapped drawing block can move to `DrawContext` without claiming a performance benefit.
- Link the helper to TODO 468 as the future real raster-cache work.

## Validation Checkpoints

- `npx nx run glugglug2:build`
- `npx nx run glugglug2:typecheck`
- `npx nx run glugglug2:test`
- `npx nx run glugglug2:lint`
- Confirm `SpriteTarget` and the root `Engine` do not expose `cacheGroup()`.
- Confirm two calls with the same cache id append their sprite instructions twice.

## Success Criteria

- [x] `DrawContext.cacheGroup()` accepts the old `glugglug` parameter order and defaults.
- [x] The callback executes exactly once per invocation regardless of id reuse or `enabled`.
- [x] The method always returns `false` and creates no retained CPU or GPU cache state.
- [x] Active coordinate offsets remain in effect inside the callback and remain unchanged afterward.
- [x] Dimensions and alpha are accepted but ignored.
- [x] Callback errors propagate without being caught or translated.
- [x] `SpriteTarget` and `Engine` remain free of the compatibility method.
- [x] README documentation labels the method clearly as a migration shim with no caching or performance benefit.
- [x] Package build, typecheck, tests, and lint pass.

## Affected Components

- `packages/editor/packages/glugglug2/src/utils/drawContext.ts` - No-op compatibility method and JSDoc.
- `packages/editor/packages/glugglug2/src/utils/drawContext.test.ts` - Callback, return-value, offset, and error coverage.
- `packages/editor/packages/glugglug2/README.md` - Compatibility usage and explicit no-cache semantics.

## Risks & Considerations

- **Misleading name**: `cacheGroup()` sounds like an optimization. Documentation must state prominently that it always
  redraws and does not retain anything.
- **Callback cost**: Dense text and other static content still append every sprite on every frame until real raster
  caching exists.
- **Ignored alpha**: The old alpha argument affects a cached composite, which does not exist here. Ignoring it matches the
  old caching-disabled path but may surprise callers relying on cache opacity.
- **Temporary compatibility surface**: The method exists to sequence a migration. Its fate should be reconsidered when
  the explicit cache API is implemented, without requiring the real cache design to copy the old API.
- **Breaking changes**: None for current `glugglug2` consumers; this only adds an optional utility method.

## Related Items

- **Depends on**: TODO 469 (Add optional drawing utilities to glugglug2; completed)
- **Related**: TODO 468 (Add shader-batched raster caches to glugglug2)
- **Related**: `packages/editor/packages/glugglug2/docs/adr/001-no-programmer-input-validation-in-the-sprite-hot-path.md`

## Notes

- This is source-level compatibility for the single `cacheGroup()` call shape, not general compatibility with the old
  `glugglug` engine.
- Returning `false` matches the old caching-disabled branch and makes the absence of cache creation explicit.
- Real caching remains an explicit GPU-resource feature owned by the core renderer, as described in TODO 468.
- Completed on 2026-08-19 with the planned signature on `DrawContext`. Focused tests cover repeated ids, enabled and
  disabled calls, ignored dimensions and alpha, inherited offsets, unchanged offset state after errors, and direct error
  propagation. The transition toward TODO 468 is unchanged: this shim will not silently become a real cache.
- Removed on 2026-08-20 after the migrated web-ui code-block drawer was simplified to draw its contents directly. The
  compatibility method, its forwarding wrapper, focused tests, cache-only render keys, and invalidation epoch were all
  deleted; the success criteria above describe the completed intermediate migration step, not the current API.

## Archive Instructions

When completed, move this file to `docs/todos/archived/`, add its completion entry to `docs/todos/_index.md`, and record
the implemented compatibility signature, test coverage, and any change to the planned transition toward TODO 468.
