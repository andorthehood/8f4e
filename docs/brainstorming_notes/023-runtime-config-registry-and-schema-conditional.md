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
We can continue the runtime registry refactor once TODO 171 is completed and conditional schemas are supported in the config compiler.
