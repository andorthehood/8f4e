# ADR-006: Lazy-Load Optional Runtime Implementations and Schemas

**Date**: 2026-03-16

**Status**: Accepted

## Context

The application supports multiple runtime backends, but most sessions only need one runtime at startup. Some runtimes also require extra browser-specific assets or setup, such as worker constructors, worklet URLs, or runtime-specific configuration schemas.

Loading all runtime implementations eagerly would:

1. Increase initial bundle and startup cost for the default editor path.
2. Force users who only need the default runtime to pay for optional runtimes they never select.
3. Front-load initialization work for browser features that may never be used.
4. Increase coupling between startup code and specialized runtime packages.

At the same time, runtime configuration must still be representable before the full implementation is loaded so the editor can hold valid runtime-specific state.

## Decision

We load the default runtime eagerly and **lazy-load optional runtime implementations and full schemas on first use**.

The runtime registry exposes optional runtimes through lightweight placeholder entries that provide:

- a stable runtime id
- default configuration values
- a minimal permissive stub schema
- a factory that triggers asynchronous loading exactly once

When the optional runtime is first selected:

1. The implementation module and any associated worker/worklet asset are loaded.
2. The stub schema is replaced in place with the runtime's full schema.
3. Runtime configuration is revalidated against the full schema.
4. The resolved runtime factory is instantiated unless the placeholder instance has already been destroyed.

This pattern is implemented in `src/runtime-registry.ts`.

## Consequences

### Positive

1. **Lower startup cost**: The default application path loads less code.
2. **Pay-for-use loading**: Specialized runtimes only load when selected.
3. **Preserved UX for configuration editing**: Runtime config can exist before the full schema arrives.
4. **Race-safe initialization**: A cached promise prevents duplicate runtime loads.
5. **Extensible runtime registry**: Adding another optional runtime follows the same pattern.

### Negative

1. **More complex runtime registry logic**: Placeholder schemas and deferred factories are harder to reason about than eager imports.
2. **Schema swap timing exists**: Validation initially runs against a stub schema until the real schema arrives.
3. **First-use latency**: Selecting an optional runtime incurs an asynchronous load the first time.

## Alternatives Considered

### 1. Eagerly Load All Runtimes at Startup

Rejected because it increases startup cost and unnecessarily loads specialized runtime code for users who never select it.

### 2. Lazy-Load Implementations but Keep Full Schemas Eager

Rejected because it still pulls optional runtime modules or requires schema duplication outside their owning packages.

### 3. Block Runtime Selection Until Full Metadata Is Loaded

Rejected because it would complicate the editor flow and make configuration handling more brittle.

## Related Decisions

- [ADR-007: Prefer Off-Main-Thread Runtime Execution](007-prefer-off-main-thread-runtime-execution.md)

