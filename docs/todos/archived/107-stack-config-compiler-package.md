---
title: 'TODO: Stack Config Compiler Package'
priority: Medium
effort: 2-3d
created: 2025-11-30
status: Completed
completed: 2025-12-01
---

# TODO: Stack Config Compiler Package

## Problem Description

The new stack-machine-inspired config language (see `docs/brainstorming_notes/013-stack-oriented-config-language.md`) currently exists only as a conceptual specification. There is no concrete compiler that can execute these stack-based config programs and emit usable JSON for the rest of the 8f4e toolchain.

Without a compiler:
- Config programs cannot be used as first-class configuration artifacts in projects.
- There is no way to validate or type-check stack-based configs against expected shapes.
- Editor and runtime code must continue to rely on ad-hoc JSON or TypeScript literals instead of a dedicated config language that matches 8f4e's stack-oriented execution model.

## Proposed Solution

Implement a new `@8f4e/stack-config-compiler` (name TBD) package that:
- Parses a simple line-based source format (one command per line) implementing the minimal instruction set (`push`, `set`, `append`, `scope`, `rescopeTop`, `rescope`, `endScope`).
- Executes commands against an in-memory stack machine:
  - `dataStack` for values
  - `scopeStack` for path segments
  - `config` for the mutable result object
- Produces a final JSON-compatible object representation suitable for:
  - Storing in projects
  - Feeding into the compiler/runtime
  - Being serialized for export/import.

Design considerations:
- Keep the VM separate from parsing so other frontends (e.g. AST-based, editor-driven builders) can reuse the same execution core.
- Make error reporting precise (line/column, command name, and failure reason) to keep the language debuggable.
- Consider a "strict" mode for catching unknown commands, extra tokens, and type conflicts eagerly.

## Implementation Plan

### Step 1: Define package skeleton and public API
- Create a new Nx project `@8f4e/stack-config-compiler` under `packages/`.
- Expose a single public API:
  - `compileConfig(source: string): { config: unknown | null; errors: { line: number; message: string }[] }`
- Document expected input format (line-based stack config source) and return type:
  - `config`: JSON-compatible object when there are no errors, otherwise `null`.
  - `errors`: array of error objects, each with a short human-readable `message` and 1-based `line` number.

### Step 2: Implement VM core for the config stack machine
- Implement an in-memory interpreter that:
  - Maintains `config`, `dataStack`, and `scopeStack`.
  - Implements the semantics of:
    - `push <literal>`
    - `set` (single/multi-value, scopes only)
    - `append` (single/multi-value append)
    - `scope <path>` / `rescopeTop <path>` / `rescope <path>` / `endScope`
  - Encodes path resolution purely via `scopeStack` (segments joined with `"."`).
- Add internal helpers for:
  - Pushing/splitting scopes
  - Navigating/creating nested objects/arrays under `config`.

### Step 3: Implement parser + integration with tests and editor/runtime
- Implement a minimal parser that turns a line-based program into an internal `Command[]` for the VM (not exposed publicly).
- Add Vitest unit tests for:
  - Happy-path examples from `013-stack-oriented-config-language.md`.
  - Error conditions (invalid literals, append on non-array, `rescopeTop` on empty scope, etc.).
- Wire the compiler into:
  - A small sample under `src/examples/` to demonstrate usage.
  - Optionally, editor integration later to allow editing and compiling stack configs from the UI.

## Success Criteria

- [ ] `@8f4e/stack-config-compiler` builds successfully via Nx as part of the workspace.
- [ ] `compileConfig` can take the example from `013-stack-oriented-config-language.md` and produce the documented JSON object with `errors.length === 0`.
- [ ] Error cases (type conflicts, invalid commands, invalid literals) produce clear error objects with `message` and `line`, and return `config: null` when errors are present.
- [ ] Unit tests cover the full command set and core error conditions.

## Affected Components

- `packages/*` — new `@8f4e/stack-config-compiler` package added.
- `docs/brainstorming_notes/013-stack-oriented-config-language.md` — used as the authoritative spec for behavior.
- `src/examples/*` — new example(s) showcasing stack config compilation to JSON.

## Risks & Considerations

- **Spec Drift**: The language spec in `013-stack-oriented-config-language.md` may evolve; the compiler must stay in sync and tests should reflect the spec as a source of truth.
- **Error Reporting Complexity**: Rich diagnostics (line/column, stack state introspection) add complexity; start simple and iterate.
- **Performance**: For now, performance is likely acceptable given config sizes; future work could optimize parsing/execution or add caching.
- **Breaking Changes**: Once projects start relying on stack-based configs, later changes to semantics will be harder; mark the package experimental initially.

## Related Items

- **Depends on**: Finalizing the core instruction set and semantics in `013-stack-oriented-config-language.md`.
- **Related**:
  - `023-compiler-outsource-from-editor` (compiler architecture)
  - `103-centralize-tooling-config-with-8f4e-config.md` (broader config story)

## References

- `docs/brainstorming_notes/013-stack-oriented-config-language.md`
- `docs/todos/023-editor-outsource-compiler.md` (if present)

## Notes

- Initial implementation can target plain JSON output; future iterations could:
  - Enforce schema validation.
  - Emit richer typed structures or metadata (e.g., source maps).
- Consider adding a CLI wrapper later (e.g. `npx 8f4e-config-compile input.stcfg > config.json`).
