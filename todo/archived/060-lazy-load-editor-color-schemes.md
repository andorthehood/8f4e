# TODO: Lazy-Load Editor Color Schemes

**Priority**: 🟡
**Estimated Effort**: 1-2 days
**Created**: 2025-10-07
**Status**: ✅ Completed
**Completed**: 2025-10-09

## Problem Description

Color scheme data for the editor is currently hard-coded inside `packages/editor/src/view/colorSchemes.ts`. The editor view, menu generators, and sprite loader pull directly from this static map, binding palette selection to the editor package and forcing eager inclusion of every palette in the initial bundle. This prevents other consumers from reusing the palette definitions, complicates future theme configuration, and leaves no room for lazy loading or user-defined extensions. The growing sprite generator package already exports the necessary `ColorScheme` typing, but the actual scheme definitions remain embedded inside the editor bundle.

## Proposed Solution

Move the color scheme definitions into a neutral module that can be loaded on demand, and expose them to the editor via a callback supplied at initialization time. Specifically:
- Relocate the existing `colorSchemes` map to a shared module outside the editor package (e.g. `src/color-schemes.ts`) that exports the same `Record<string, ColorScheme>` shape.
- Add an optional `loadColorSchemes` callback to the editor `Options`, allowing host applications to provide an async loader that lazy-imports the shared module and returns the map.
- Update the editor view and menu logic to resolve palettes through this callback, caching the result so sprite regeneration remains synchronous when responding to `setColorScheme` events.
- Retain the current palette names and data to avoid behavioral changes while enabling future, dynamic theme sources.

## Implementation Plan

### Step 1: Relocate Palette Definitions
- Create `src/color-schemes.ts` that exports the existing `Record<string, ColorScheme>` definitions and re-export type aliases if needed.
- Ensure the module uses the `@8f4e/sprite-generator` `ColorScheme` type to preserve existing structure.
- Dependencies: none beyond existing sprite-generator package.

### Step 2: Extend Editor Options With Loader Callback
- Add `loadColorSchemes?: () => Promise<Record<string, ColorScheme>>` to `packages/editor/src/state/types.ts` and propagate it through `initState` so it lands on `state.options`.
- Document default behavior (editor falls back to `import('@app/color-schemes')` if callback is absent).
- Dependencies: update any tests or call sites constructing `Options` objects.

### Step 3: Integrate Lazy Loader Into Editor View
- Update `packages/editor/src/view/index.ts` to await the loader during initialization, cache the resolved map, and use the cache for `reloadSpriteSheet`.
- Provide a sensible fallback (e.g. default scheme) if the requested key is missing or the loader fails.
- Dependencies: new loader callback from Step 2.

### Step 4: Update Menu & Bootstrapping Code
- Modify `packages/editor/src/state/effects/menu/menus.ts` so `colorSchemeMenu` builds its entries from the loaded map (awaiting the callback if necessary) instead of hard-coded titles.
- Add a memoized lazy-import helper in `src/editor.ts` that fulfills `loadColorSchemes` using dynamic `import('./color-schemes')`, and pass it into `initEditor` options; adjust unit tests such as `runtimeReadyProject.test.ts` to supply a stub.
- Dependencies: completion of Step 1-3.

## Success Criteria

- [ ] Color scheme definitions live outside the editor package and are imported lazily.
- [ ] `loadColorSchemes` callback is part of the editor options API with type coverage and documentation.
- [ ] Editor view and menus function correctly using the async loader with existing schemes (`hackerman`, `redalert`, `default`).
- [ ] All existing tests pass, and new tests cover loader fallbacks or menu generation as needed.

## Affected Components

- `src/color-schemes.ts` (new) – Source of shared palette definitions.
- `src/editor.ts` – Provides memoized lazy loader and passes it to the editor.
- `packages/editor/src/state/types.ts` – Extends `Options` and related types.
- `packages/editor/src/state/index.ts` – Ensures options (with new callback) flow into state.
- `packages/editor/src/view/index.ts` – Consumes the loader and caches palette data.
- `packages/editor/src/state/effects/menu/menus.ts` – Generates color scheme submenu dynamically.
- `packages/editor/src/state/effects/colorTheme.ts` – Continues to update settings but may need minor adjustments for async interactions.
- `packages/editor/src/state/effects/runtimeReadyProject.test.ts` and similar test fixtures – Updated to provide the new callback when constructing editor options.

## Risks & Considerations

- **Async Initialization Regression**: Introducing asynchronous palette loading could delay initial render; mitigate by caching results and resolving before sprite generation.
- **Bundler Compatibility**: Dynamic import paths must remain compatible with Vite and Nx build outputs; verify aliases and ensure tree shaking still works.
- **Fallback Handling**: Need robust defaults if the loader rejects or returns missing keys to avoid runtime errors.
- **Dependencies**: Any downstream consumers expecting sync palette access must adapt to the async API.

## Related Items

- **Related**: `todo/025-separate-editor-view-layer.md` (continues the effort to decouple editor state from rendering assets).

## References

- `packages/editor/src/view/colorSchemes.ts` (current static palette definitions).
- `packages/editor/src/view/index.ts` (sprite initialization and reload path).
- `packages/editor/src/state/effects/menu/menus.ts` (color scheme menu generation).
- `packages/editor/src/state/types.ts` (editor options definition).

## Notes

- Cache the promise returned by the loader to avoid repeated dynamic imports.
- Consider exposing the shared palette module for other tooling (e.g. docs) once migrated.
- Update documentation or usage examples once the API is in place.

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
