# ADR-001: Do Not Validate Programmer Input in Render Hot Paths

**Date**: 2026-08-19

**Status**: Accepted

## Context

`glugglug2` is a performance-first WebGL2 sprite renderer. During each render cycle, callers may invoke `drawSprite()` many times to append position, size, and sprite-id data to one reusable instance buffer. Work performed by `drawSprite()` is multiplied by the number of sprites and frames, making it the package's primary CPU hot path. `renderFrame()` and its renderer `beginFrame()` and `flush()` phases also execute once per frame, so lifecycle checks there create recurring work even when the engine is used correctly.

The initial implementation performed programmer-input validation for every sprite. It checked engine and renderer lifecycle state, verified that calls occurred inside a render callback, checked whether the sprite identifier existed, and called `Number.isFinite()` for all four rectangle values. These checks provided friendlier errors, but repeated validation is not part of producing valid instance data and adds branches and function calls to every sprite submission.

The package already has cold paths where structural validation can happen without multiplying its cost per sprite. Examples include construction, shader compilation and linking, `setSpriteAtlas()`, atlas metadata preparation, explicit resize, and resource destruction.

## Decision

`drawSprite()` does not validate programmer input. Per-frame rendering also does not check whether the engine or renderer
was destroyed. Calling `renderFrame()` after destruction, or destroying the engine from inside a frame and continuing
that frame, is a programmer error with unspecified consequences.

Invalid calls are programmer errors with unspecified consequences. The package does not guarantee a particular exception, diagnostic, recovery behavior, or rendered result for:

- unknown or stale sprite identifiers;
- calls made outside the intended render callback;
- calls made after engine destruction;
- non-finite positions or dimensions;
- otherwise malformed per-sprite values.

Callers are responsible for supplying identifiers from the active atlas and valid finite rectangle values. When an application accepts untrusted or dynamically shaped input, it must validate or normalize that input before entering the sprite-submission loop.

Validation remains appropriate on cold operations, including:

- WebGL2 context and resource creation;
- shader compilation and program linking;
- atlas dimensions, sprite source rectangles, and lookup capacity during `setSpriteAtlas()`;
- atlas replacement while a frame is being built;
- one-time continuous render-loop startup;
- explicit canvas resize dimensions;
- resource cleanup.

The sprite hot path still performs work required for rendering:

- normalize and resolve the public sprite identifier;
- resolve omitted destination dimensions from atlas metadata;
- ensure the reusable instance buffer has capacity;
- write the five instance fields.

Identifier lookup, default-size resolution, and buffer-capacity handling are rendering operations rather than programmer-input validation and therefore remain.

## Rationale

The package favors predictable hot-path cost and minimal per-sprite work over friendly runtime diagnostics. This follows the repository-wide principle in [ADR-004: Prioritize Render Path Performance in Data Structure Selection](../../../../../../docs/adr/004-prioritize-render-path-performance.md).

TypeScript types, focused tests, atlas validation, and application-level validation provide safeguards without requiring every correctly written `drawSprite()` call to pay the validation cost.

## Consequences

### Positive

- Each sprite submission and render cycle performs fewer branches and runtime checks.
- The default and only drawing API is the performance-oriented path; callers do not need to opt into a separate unsafe variant.
- Cold-path validation remains available where its cost is not multiplied by sprite count.
- The implementation communicates that `glugglug2` is a low-level renderer rather than an input-sanitization boundary.

### Negative

- Invalid sprite calls may fail indirectly, render incorrectly, contaminate instance data, or appear to work; none of these outcomes are stable API behavior.
- Errors caused by bad per-sprite data may be harder to diagnose because they are not rejected at the call site.
- JavaScript consumers do not receive the protection that TypeScript types provide.
- Callers handling external data must add validation before the render loop themselves.

### Neutral

- Buffer growth checks remain because capacity management is required for correct instance storage and reusable allocation behavior.
- Public string sprite identifiers still require lookup and normalization; this decision removes validation, not necessary sprite resolution.
- This decision applies to sprite submission and per-frame orchestration. It does not prohibit validation during setup,
  explicit configuration, resource cleanup, or one-time continuous-loop startup.

## Alternatives Considered

### Validate every `drawSprite()` call

Rejected because it makes every valid sprite submission pay for diagnostics intended only for invalid programmer input.

### Provide separate checked and unchecked drawing methods

Rejected because it expands the API, duplicates behavior, and makes the slower path appear to be the default or safer architectural choice. `glugglug2` is explicitly performance-first, so the primary drawing method should express that contract directly.

### Enable validation only in development builds

Not adopted for the MVP. It would introduce build-mode behavior differences and additional configuration. This can be reconsidered if debugging experience becomes a demonstrated problem, provided production `drawSprite()` remains free of validation branches.

## Reconsideration Triggers

Revisit this decision if profiling shows validation has negligible cost at real editor sprite counts and invalid calls are a recurring source of expensive failures, or if `glugglug2` becomes a public trust boundary that routinely accepts unvalidated external data.
