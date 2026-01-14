# Config blocks schema validation

## Context
Config blocks are compiled independently in `packages/editor/packages/editor-state/src/effects/config.ts`, then deep merged. This prevents full-schema validation because combinators and required fields need the complete, merged config.

## Proposal
Compile all config blocks as one combined source for schema validation, then map errors back to the originating block by line ranges.

### Steps
1. Build a single `source` by concatenating config block sources in creation order, separated by a blank line.
2. Track `{ blockId, startLine, endLine }` per block while building the combined source. Use `creationIndex` for `blockId` (it is already the canonical `codeBlockId` for config errors).
3. Call `compileConfig(source, configSchema)` once.
4. Map each error line to a blockId using the line ranges; convert to block-local line numbers for UI display.
5. Use the returned `config` directly (no per-block merge), then deep-merge it over `defaultConfig` as today.

### Benefits
- Full-schema validation works (required fields, oneOf/anyOf, etc.).
- Errors still appear on the originating config block.
- Single compile path matches the true runtime config.

### Notes
If per-block compilation must remain, a fallback is to run post-merge schema validation and surface the errors as global config errors. That is less precise for block attribution.
