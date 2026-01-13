# Runtime registry and conditional config schemas

## Context
The editor-state currently hardcodes available runtimes and runtime config schemas. The goal is to decouple runtime selection and validation by passing runtime descriptions through options and making runtime config schemas configurable.

## Current hardcoded areas
- `packages/editor/packages/editor-state/src/types.ts` defines `RuntimeType` and `Runtimes` unions.
- `packages/editor/packages/editor-state/src/configSchema.ts` hardcodes runtime enum and runtime-specific fields.
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` hardcodes default runtime settings.
- `src/runtime-loader.ts` switches on `RuntimeType` to lazy load runtime factories.

## Decoupling idea
- Introduce a runtime registry (passed via editor-state `Options`) with runtime metadata, default config, and a schema per runtime.
- Generate the config schema at runtime from the registry (dynamic enum + runtime entries).
- Replace runtime unions with a string runtime id and let hosts narrow via their registry.
- Use registry defaults for `defaultConfig`.
- App-side runtime loader becomes a registry lookup instead of a switch.

## Schema limitation and workaround
The stack-config compiler schema only supports `type`, `enum`, `properties`, `required`, `items`, and `additionalProperties`. It does not support conditional rules like `oneOf`/`anyOf`, so you cannot enforce runtime-specific configs using a discriminated union within the current schema subset.

Workaround: allow a permissive schema during config compilation and validate runtime configs after compile using the runtime-specific schema.

## Proposed compiler extension
Extend the stack-config compiler schema to support conditional combinators (`oneOf`/`anyOf`) so runtime-specific validation can happen during compilation. This enables generated schemas from a runtime registry to enforce per-runtime config requirements without a second validation pass.

Related TODO: `docs/todos/171-extend-config-schema-conditional-branches.md`.

## Next step
TODO 171 is completed (conditional `oneOf`/`anyOf` is now supported in the stack-config compiler), so we can move forward with the runtime registry refactor.

## Follow-up work
- Define a `RuntimeRegistry` shape in editor-state options with runtime metadata, defaults, per-runtime schemas, and a runtime factory function. Each entry includes a stable runtime id, default config payload, stack-config schema, and the factory function supplied by the host app.
- Replace `RuntimeType`/`Runtimes` unions with string runtime ids sourced from the registry. Update editor-state types, config schema helpers, and any runtime-specific branching to use `runtimeId: string` so host apps can narrow via their registry.
- Generate the config schema using `oneOf` branches per runtime id + schema, and validate during config compilation. Build a discriminated union on the `runtime` field with required runtime-specific properties (the shared `runtime` key is the discriminator).
- Update default state creation to use registry defaults. Choose a default runtime id from an explicit option, then seed `defaultConfig` from the matching runtime defaults while keeping existing project defaults intact.
- Swap the app-side runtime loader switch with a registry lookup. Resolve runtime factories via the registry keyed by runtime id, and fall back to the default runtime id when an unknown runtime id is requested.

## Decisions locked in
- Runtime factory loading lives in the editor package, but registry entries provide the factory function and config schema.
- Registry entry fields are limited to runtime id, schema, defaults, and factory function for now.
- Default runtime id is an explicit option (not inferred from registry ordering) and lives at the root of editor-state options alongside the runtime registry.
- Runtime registry also lives at the root of editor-state options.
- The runtime discriminator key is `runtime`.
- Unknown runtime ids fall back to the explicit default runtime id.
