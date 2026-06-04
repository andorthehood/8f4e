---
title: 'TODO: Migrate binary asset directives to config'
priority: Medium
effort: 1-2d
created: 2026-05-30
issue: null
status: Completed
completed: 2026-06-04
---

# TODO: Migrate binary asset directives to config

## Problem Description

`@defAsset` and `@loadAsset` configure editor-managed binary asset loading, but the binary asset environment plugin currently parses those directives directly from code blocks instead of using the shared config system.

Current state:
- `; @defAsset <id> <url>` defines a named asset URL.
- `; @loadAsset <id> <memoryRef>` loads a named asset into Wasm memory.
- Parsing is implemented in the binary asset environment plugin by scanning raw source lines.
- Asset sizes are exposed through the auto-generated env constants block.

Why this is a problem:
- binary asset configuration has custom parsing and weak validation compared with schema-backed config
- raw-line scanning bypasses the parsed directive/config pipeline
- asset configuration is project-level environment setup, not block-local display metadata

## Proposed Solution

Move binary asset definitions and loads to a binary-assets config schema contribution.

Possible shape:

```txt
; @config assets.kick.url https://example.com/kick.pcm
; @config assets.kick.loadMemory audio:buffer
```

or split definition and load roots:

```txt
; @config binaryAssets.kick.url https://example.com/kick.pcm
; @config binaryAssets.kick.memory audio:buffer
```

The exact path shape should prioritize readable code blocks, stable asset ids, and clear diagnostics.

## Anti-Patterns

- Do not keep raw source-line scans for `@defAsset` and `@loadAsset` after migration.
- Do not add binary asset maps directly to the core `EditorConfig` interface.
- Do not rely on directive order if config paths can provide stable ids.
- Do not lose generated `ASSET_<ID>_SIZE` env constants.

## Implementation Plan

### Step 1: Design the asset schema root
- Add a binary-asset-owned config root such as `assets` or `binaryAssets`.
- Support asset ids as object keys.
- Support URL and memory target fields.
- Decide how duplicate asset ids and multiple load targets should be represented.

### Step 2: Replace directive parsing
- Replace `parseBinaryAssetDirectives(...)` with config resolution.
- Preserve last-write-wins or define explicit duplicate behavior through config semantics.
- Keep asset load/reload behavior tied to compiler memory maps.

### Step 3: Preserve env constants
- Keep `ASSET_<ID>_SIZE` generation working from the resolved asset list.
- Ensure config changes update binary asset state and env constants consistently.

### Step 4: Migrate examples and docs
- Replace `@defAsset` / `@loadAsset` in examples and docs.
- Remove old directive tests.
- Add schema/config tests for asset definitions and load targets.

## Validation Checkpoints

- `npx nx run app:test -- --run src/editorEnvironmentPlugins/binaryAssets`
- `npx nx run @8f4e/editor-state:test -- --run src/features/editor-config src/features/code-blocks/features/auto-env-constants`
- `npx nx run @8f4e/examples:test`
- `rg -n "@defAsset|@loadAsset" packages src docs --glob '!docs/todos/**' --glob '!docs/brainstorming_notes/archived/**'`

## Success Criteria

- [ ] Binary asset definitions are declared through `@config`.
- [ ] Binary asset load targets are declared through `@config`.
- [ ] The binary asset environment plugin owns the asset config schema.
- [ ] Raw source-line asset directive parsing is removed.
- [ ] Asset loading and generated asset-size constants still work.
- [ ] Live docs and examples no longer mention `@defAsset` or `@loadAsset`.

## Affected Components

- `packages/editor/src/editorEnvironmentPlugins/binaryAssets/`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/auto-env-constants/`
- `packages/editor/docs/editor-directives.md`
- `packages/examples/src/`

## Risks & Considerations

- **Config shape**: JSON-schema-like validation currently has limited support for dynamic object keys. The implementation may need schema support for `additionalProperties` object schemas.
- **Multiple loads**: Current behavior supports multiple loads for one asset. The config shape must preserve this if users depend on it.
- **URL values**: `@config` values are single-token today; URLs with spaces are already impractical, but future quoted-string config support would improve this.
- **Lazy activation**: The binary asset plugin should still lazy-load when asset config is present.

## Related Items

- **Related**: `docs/todos/094-opfs-large-binary-asset-storage.md`
- **Related**: `docs/todos/315-optimize-global-editor-directive-recomputation.md`

## Notes

- This TODO is intentionally separate from keyboard and MIDI because binary assets interact with storage, compiler memory maps, and generated env constants.
- Completed by migrating binary asset configuration to schema-backed `@config bin...` entries, removing live `@defAsset` / `@loadAsset` parsing, and verifying no compatibility support remains for the old binary asset directive/config names.
