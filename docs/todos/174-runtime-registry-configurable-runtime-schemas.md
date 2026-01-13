---
title: 'TODO: Runtime Registry for Configurable Runtime Schemas'
priority: Medium
effort: 3-5d
created: 2026-01-13
status: Open
completed: null
---

# TODO: Runtime Registry for Configurable Runtime Schemas

## Problem Description

Editor-state hardcodes runtime ids, runtime config schemas, default runtime config, and runtime loading behavior. This prevents host apps from defining their own runtimes and runtime config shapes, and forces editor-state to embed app-specific details. With conditional schema support now available in the stack-config compiler, the runtime config schema can be generated from a registry instead of being hardcoded, but the editor package needs a clear contract for registry-driven runtime data.

## Proposed Solution

Introduce a runtime registry passed in at the root of editor-state options alongside an explicit `defaultRuntimeId`. Each registry entry supplies a runtime id, default config payload, stack-config schema, and a runtime factory function provided by the host app. Editor-state uses the registry to build a discriminated `oneOf` schema on the shared `runtime` field, seeds default state from the selected registry entry, and routes runtime loading through the registry instead of a hardcoded switch. Unknown runtime ids fall back to `defaultRuntimeId`.

## Implementation Plan

### Step 1: Define runtime registry options and types
- Add root-level options for `runtimeRegistry` and `defaultRuntimeId`.
- Define a `RuntimeRegistry` entry shape (id, defaults, schema, factory function).
- Replace `RuntimeType` and `Runtimes` unions with a `runtimeId: string` contract in editor-state types.

### Step 2: Generate config schema from the registry
- Update editor-state config schema generation to build a `oneOf` discriminated union keyed by `runtime`.
- Ensure each branch includes required runtime-specific properties and the runtime id enum entry.
- Validate during config compilation using the stack-config compiler’s conditional schema support.

### Step 3: Update default state and runtime loading
- Seed `defaultConfig` from the runtime entry selected by `defaultRuntimeId`.
- Update any runtime branching logic in editor-state to use the runtime id string.
- Replace the app-side runtime loader switch with a registry lookup; fall back to `defaultRuntimeId` when unknown runtime ids are requested.

### Step 4: Host app integration
- Thread runtime registry and default runtime id into editor init options in the app layer.
- Ensure runtime factory functions and schemas live outside editor packages and are provided by the host.

## Success Criteria

- [ ] Editor-state runtime selection uses `runtimeId: string` sourced from the registry.
- [ ] Config schema is generated from registry entries using `oneOf` on the `runtime` discriminator.
- [ ] Default state uses `defaultRuntimeId` with registry defaults.
- [ ] Runtime loading resolves factory functions via registry lookup with fallback to default.
- [ ] Host app can add a new runtime without changing editor-state source.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Replace runtime unions with runtime id string types.
- `packages/editor/packages/editor-state/src/configSchema.ts` - Generate conditional schema from registry.
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - Seed defaults from registry.
- `src/runtime-loader.ts` - Replace switch with registry lookup and fallback.
- `packages/editor/packages/editor-state/src/options.ts` (or equivalent) - Add root-level registry options.

## Risks & Considerations

- **Schema correctness**: Discriminated union must be precise to avoid invalid configs slipping through.
- **Registry completeness**: Missing schema/defaults in host-supplied registry could degrade validation; define required fields clearly.
- **Compatibility**: Update call sites to provide registry/defaults and keep editor initialization stable.
- **Breaking Changes**: Runtime type union removal is a public API change for editor-state consumers.

## Related Items

- **Depends on**: `docs/todos/archived/171-extend-config-schema-conditional-branches.md`
- **Related**: `docs/brainstorming_notes/023-runtime-config-registry-and-schema-conditional.md`

## References

- `packages/stack-config-compiler/src/schema/types.ts`
- `packages/editor/packages/editor-state/src/configSchema.ts`

## Notes

- Runtime discriminator key is `runtime` (shared property across all branches).
- Registry entries include id, schema, defaults, and factory function only for now.
- Unknown runtime ids fall back to `defaultRuntimeId`.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
