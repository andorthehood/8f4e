---
title: 'TODO: Add Scoped Constants to Stack Config Compiler'
priority: Medium
effort: 1-2d
created: 2026-01-13
status: Completed
completed: 2026-01-13
---

# TODO: Add Scoped Constants to Stack Config Compiler

## Problem Description

The stack config compiler has no constant support. Config blocks must repeat literal values and path segments, which makes configs noisy and hard to maintain. It also makes refactors brittle because updates require editing many lines.

## Proposed Solution

Add a `const` command that defines a literal value in the current scope. Constants resolve only within the current and nested scopes and are discarded when the scope is popped. `push` should accept either a literal or an uppercase constant name and return an exec error if the constant is unknown.

## Implementation Plan

### Step 1: Extend command and VM types
- Add `const` to command types and define command fields for names/identifiers
- Add a scoped constants stack to VM state

### Step 2: Parse const and push identifiers
- Parse `const NAME <literal>` with uppercase-only name validation
- Allow `push NAME` to resolve constants when literal parsing fails

### Step 3: Execute const and update scope handling
- Implement const execution with per-scope definition and same-scope redefinition error
- Maintain constants stack alongside scope stack for scope/rescope/pop commands
- Resolve constants from nearest scope in push execution

### Step 4: Add tests
- Parsing: const syntax, invalid names, push identifier
- Execution: scoped visibility, shadowing, unknown constant errors, scope cleanup

## Success Criteria

- [ ] `const NAME <literal>` defines a constant in the current scope only
- [ ] `push NAME` resolves constants with proper shadowing behavior
- [ ] Unknown constants and same-scope redefinitions return exec errors
- [ ] Tests cover parsing, scoping, and execution edge cases

## Affected Components

- `packages/stack-config-compiler/src/types.ts` - command and VM state types
- `packages/stack-config-compiler/src/parser/parseLine.ts` - const parsing and push identifiers
- `packages/stack-config-compiler/src/commands/push.ts` - constant resolution
- `packages/stack-config-compiler/src/commands/const.ts` - new const command
- `packages/stack-config-compiler/src/commands/scope.ts` - constants stack growth
- `packages/stack-config-compiler/src/commands/popScope.ts` - constants stack pop
- `packages/stack-config-compiler/src/commands/rescope.ts` - constants stack reset
- `packages/stack-config-compiler/src/commands/rescopeTop.ts` - constants stack pop/push
- `packages/stack-config-compiler/src/commands/rescopeSuffix.ts` - constants stack suffix pop/push
- `packages/stack-config-compiler/src/vm/createVMState.ts` - constants stack init
- `packages/stack-config-compiler/src/vm/executeCommand.ts` - const command wiring

## Risks & Considerations

- **Parsing ambiguity**: `push FOO` should prefer literal parsing first, then accept uppercase identifiers
- **Scope mismatch**: constants stack must stay aligned with scope stack on all scope operations
- **Breaking changes**: none expected; new command only

## Related Items

- **Related**: `docs/todos/171-add-conditional-schema-support-to-stack-config-compiler.md`

## References

- None
