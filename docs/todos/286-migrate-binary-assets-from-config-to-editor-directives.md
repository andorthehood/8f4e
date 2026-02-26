---
title: 'TODO: Migrate Binary Assets from Config to Editor Directives'
priority: Medium
effort: 1-2d
created: 2026-02-26
status: Open
completed: null
---

# TODO: Migrate Binary Assets from Config to Editor Directives

## Problem Description

Binary asset loading is currently driven by project config shape (`compiledProjectConfig.binaryAssets`).
The desired model is to define and load assets via editor directives inside code blocks, consistent with other editor metadata.

Current issues:
- Asset definitions are split between config and code.
- Loading targets are not colocated with the module memory declarations that consume them.
- Config surface contains binary asset fields that should become obsolete before release.

## Proposed Solution

Replace config-driven binary assets with two editor directives:

- `; @defAsset <id> <url>`
  - Declares an asset id and source URL.
  - Allowed in any block type.
  - If id is repeated, last definition wins.

- `; @loadAsset <id> <memoryRef>`
  - Loads a previously defined asset into a specific memory reference.
  - Allowed in any block type.
  - `memoryRef` must be an `&...` memory reference (required).
  - Unknown ids should log to console and be skipped.

Additional behavior:
- Keep auto-generated env constants for asset sizes (`ASSET_<ID>_SIZE`).
- One asset may be loaded into multiple memories, but docs should discourage it and recommend loading once and sharing the memory.
- Remove binary asset loading from config shape (hard API break allowed, project not released yet).
- Update existing projects/examples to directive-based format.

## Anti-Patterns (Optional)

- Do not keep config `binaryAssets` as an active loading path.
- Do not accept non-reference memory targets for `@loadAsset` (no plain names).
- Do not fail hard on unknown asset ids; warn and continue.

## Implementation Plan

### Step 1: Add directive parsing and mapping
- Add parser(s) for `@defAsset` and `@loadAsset` over all code block lines.
- Build effective definition map with last-write-wins semantics.
- Resolve `@loadAsset` entries into concrete load tasks (`url`, `id`, `memoryRef`).

### Step 2: Refactor binary asset effect to directive source
- Replace config-based fetch/load trigger source with directive-derived tasks.
- Keep deduplicated URL fetching and cached metadata behavior.
- Resolve memory targets from `memoryRef` and load bytes into runtime memory.
- Emit warnings for unknown ids and invalid/non-reference targets.

### Step 3: Remove config shape support and migrate examples
- Remove `binaryAssets` from project config schema/types/defaults.
- Update any runtime-ready fixtures/tests expecting config `binaryAssets`.
- Migrate existing `.8f4e` projects that currently define assets in config blocks.

### Step 4: Update docs
- Document both directives in editor-directives docs with examples.
- Document recommended one-asset-one-memory pattern and why.
- Note constant-generation behavior for `ASSET_<ID>_SIZE`.

## Validation Checkpoints (Optional)

- `npx nx run editor-state:test`
- `npx nx run editor-state:typecheck`
- `npx nx run-many --target=test --all`
- `rg -n "binaryAssets" packages/editor/packages/editor-state/src/features/project-config`
- Manual check: open migrated sample project and verify asset fetch/load plus generated env constants.

## Success Criteria

- [ ] Binary assets are fully declared and loaded via directives only.
- [ ] `@defAsset` uses last-write-wins for duplicate ids.
- [ ] `@loadAsset` only accepts `&...` memory references.
- [ ] Unknown asset ids are logged and skipped without crashing.
- [ ] `ASSET_<ID>_SIZE` constants remain generated and usable.
- [ ] Project config no longer contains `binaryAssets` shape.
- [ ] Existing projects/examples are migrated and still run.

## Affected Components

- `packages/editor/packages/editor-state/src/features/binary-assets` - directive parsing + loading flow
- `packages/editor/packages/editor-state/src/features/code-blocks/features/auto-env-constants` - asset-size constants generation input
- `packages/editor/packages/editor-state/src/features/project-config` - remove `binaryAssets` schema/types/defaults
- `packages/examples/src/projects/*.8f4e` - migrate asset definitions/loading directives
- `packages/editor/docs/editor-directives.md` - document new directives

## Risks & Considerations

- **Directive parsing ambiguity**: malformed directives may silently fail; mitigate with explicit warnings.
- **Order sensitivity**: repeated definitions must clearly resolve to last-write-wins.
- **Memory safety**: loading into wrong targets can corrupt memory; keep strict `&` reference requirement.
- **Breaking changes**: config API changes are intentional before release; migration must be complete.

## Related Items

- **Related**: [180-config-binary-assets-from-urls.md](./archived/180-config-binary-assets-from-urls.md)
- **Related**: [184-auto-env-constants-block.md](./archived/184-auto-env-constants-block.md)
- **Related**: [186-split-binary-asset-fetch-load.md](./archived/186-split-binary-asset-fetch-load.md)

## References

- `packages/editor/packages/editor-state/src/features/binary-assets/effect.ts`
- `packages/editor/packages/editor-state/src/features/project-config/schema.ts`
- `packages/editor/docs/editor-directives.md`
- `packages/examples/src/projects/samplePlayer.8f4e`

## Notes

- API break is intentional and accepted for pre-release status.
- Directive syntax must follow editor convention using semicolon comments (`; @...`).

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
