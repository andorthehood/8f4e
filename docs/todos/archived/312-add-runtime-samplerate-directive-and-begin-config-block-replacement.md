---
title: 'TODO: Add runtime sampleRate directive and begin config block replacement'
priority: Medium
effort: 1-2d
created: 2026-03-16
completed: 2026-03-16
status: Completed
---

# TODO: Add runtime sampleRate directive and begin config block replacement

## Problem Description

Project runtime configuration currently depends on legacy stack-config `config project` blocks, including `runtimeSettings.sampleRate`.

That is no longer the desired direction.
The goal is to replace stack-config-based project configuration with lightweight source-level runtime directives that can appear in any code block while still applying globally to the whole project.

The first migration step should be `sampleRate`, since it is explicit project/runtime configuration, cannot be inferred safely like memory size, and is already used by runtime settings and generated environment constants.

## Proposed Solution

Introduce a new runtime-directive syntax:

```txt
; ~sampleRate 44100
```

Key semantics:

- runtime directives are distinct from editor-only `; @...` directives
- `; ~sampleRate ...` is valid in any code block type
- runtime directives are always project-global regardless of location
- `sampleRate` is resolved by scanning the whole project in project order
- duplicate identical values are allowed
- conflicting values are errors

This directive should become the new source of truth for sample rate.
Do not merge it with legacy stack-config project config.
Since the software is not released yet, it is acceptable to update example projects and remove or bypass legacy `sampleRate` config handling rather than preserving backwards compatibility.

## Anti-Patterns

- Do not implement `~sampleRate` as an editor directive under the `@` directive system.
- Do not merge `~sampleRate` with stack-config project config semantics.
- Do not treat the directive as block-local based on where it appears.
- Do not silently choose one conflicting sample rate over another.
- Do not keep stack-config as the conceptual source of truth for sample rate after adding the directive.

## Implementation Plan

### Step 1: Add a shared runtime-directive parser
- Create a new parsing path for comment lines matching `; ~<name> <args...>`.
- Keep it separate from editor directives and separate from stack-config compilation.
- Support only `sampleRate` initially.

### Step 2: Add project-wide runtime-directive resolution
- Scan all code blocks in project order regardless of block type.
- Collect all `~sampleRate` directives into a project-global resolution result.
- Allow repeated identical values and reject conflicting values.

### Step 3: Feed sample rate into runtime/editor state
- Introduce or reuse a project-level resolved runtime-directives state surface.
- Make runtime setup and env-constant generation read the resolved `sampleRate` from this new source.
- Remove the need for stack-config-derived `runtimeSettings.sampleRate` in the active path.

### Step 4: Update examples and docs
- Replace legacy sample-rate config usage in example projects with `; ~sampleRate ...`.
- Update documentation to describe `~sampleRate` as the new configuration path.
- Mark stack-config project config as legacy or remove sample-rate references from it if that path is being retired immediately.

### Step 5: Add tests for the new directive model
- Parse valid and invalid `~sampleRate` lines.
- Verify collection from modules, functions, constants, shaders, and config blocks.
- Verify duplicate-same-value acceptance and conflicting-value rejection.
- Verify runtime/env behavior uses directive-derived sample rate.

## Validation Checkpoints

- `npx nx run-many --target=test --projects=editor,cli,compiler-worker`
- `npx nx run-many --target=typecheck --projects=editor,cli,compiler-worker`
- `rg -n "~sampleRate|runtimeSettings|SAMPLE_RATE" packages/editor packages/cli packages/examples docs`

## Success Criteria

- [ ] `; ~sampleRate 44100` is recognized as a runtime directive.
- [ ] The directive is valid in any code block type and still resolves project-globally.
- [ ] Conflicting `~sampleRate` declarations produce a structured error.
- [ ] Runtime setup and generated sample-rate-related constants use the directive-derived value.
- [ ] Example projects no longer need legacy stack-config sample-rate declarations.
- [ ] `sampleRate` is no longer conceptually owned by stack-config project config.

## Affected Components

- `packages/editor/packages/editor-state/src/` - runtime-directive parsing, resolution, and state application
- `packages/editor/packages/editor-state/src/features/code-blocks/features/auto-env-constants/` - generated sample-rate constants
- `packages/examples/src/projects/` - migration from legacy config to `~sampleRate`
- `docs/usage.md` - runtime directive documentation
- legacy project-config flow - removal or narrowing of `sampleRate` ownership

## Risks & Considerations

- **Global-anywhere discoverability**: allowing directives in any block type makes them easy to author but harder to locate, so conflict errors and docs need to be explicit.
- **Architecture drift**: if runtime directives are forced through the old config pipeline, the migration goal will get blurred.
- **Partial migration**: this is only the first directive, so the intermediate architecture should make it easy to add `~runtime` and other future directives.

## Related Items

- **Related**: `docs/todos/311-derive-memory-size-from-compiled-program-footprint.md`
- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`

## Notes

- This TODO intentionally treats stack-config project config as legacy.
- The directive system introduced here is the start of a replacement path, not an additive compatibility layer.
