---
title: 'TODO: Add execution groups'
priority: Medium
effort: 2-4d
created: 2026-05-29
issue: null
status: Open
completed: null
---

# TODO: Add execution groups

## Problem Description

8f4e currently uses special module-level directives such as `#initOnly` and `#test` to decide which compiled dispatcher should execute a module. These directives are growing into a parallel grouping system, but the language does not yet have a first-class structural way to describe execution groups.

The current built-in exports also make the next design awkward:

- `cycle` is effectively the main runtime group.
- `initOnly` is effectively a separately callable initialization group.
- `runTests` is effectively the test group.
- `init` currently initializes memory defaults and then runs init-only modules, so it conflicts with a future user-authored `group init` export.

Because the project is unreleased and all known 8f4e source lives in this repository, this can be a breaking language/API cleanup rather than a compatibility layer.

## Proposed Solution

Introduce explicit execution groups:

```8f4e
group main
module foo
moduleEnd
groupEnd

group init
module setup
moduleEnd
groupEnd

group test
module fooTest
moduleEnd
groupEnd
```

Groups are execution partitions only. They are not lexical scopes, namespaces, or visibility boundaries. Functions, constants, memory-like shared declarations, and other non-module source blocks remain outside groups for now.

Every group becomes a WebAssembly export with the same name:

```ts
instance.exports.initDefaults();
instance.exports.init();
instance.exports.main();
instance.exports.test();
```

Rename the current built-in memory/default initializer from `init` to `initDefaults`. After this change, `initDefaults` should only zero imported memories and apply declared defaults. It should not run user modules. The host decides when to call exported execution groups, including `init`, `main`, and `test`.

## Design Decisions

- `group <name>` starts an execution group.
- `groupEnd` closes the current execution group.
- Group names must be unique across a compiled program.
- Groups may only wrap `module ... moduleEnd` blocks for now.
- Function and constants blocks remain top-level.
- Groups do not create lexical scopes and do not affect name resolution.
- Every module belongs to exactly one group.
- Empty groups are valid and export a no-op function.
- Every group is exported with its group name.
- `group main` replaces the old `cycle` dispatcher/export.
- `group init` replaces the old `#initOnly` / `initOnly` dispatcher/export.
- `group test` replaces `#test` / `runTests`.
- Module execution order inside a group follows source module order.
- Group declaration order has no lifecycle meaning. Groups are called by the host, potentially independently or asynchronously.
- Existing examples should be migrated to explicit groups instead of preserving ungrouped module behavior.

## Anti-Patterns

- Do not implement groups as lexical scopes or namespaces.
- Do not keep `#test` and `#initOnly` as long-term alternate syntax.
- Do not make `initDefaults` execute user modules.
- Do not add fallback behavior for ungrouped modules after migrating the repository examples.
- Do not special-case `main`, `init`, or `test` beyond host/runtime convention. They should be ordinary group exports.

## Implementation Plan

### Step 1: Add syntax and AST support

- Add `group` / `groupEnd` source block parsing.
- Validate that only module blocks appear inside groups.
- Validate that function and constants blocks remain top-level.
- Validate that group names are unique.
- Validate that each module belongs to exactly one group.
- Decide whether group ids reuse the existing identifier rules or need an explicit export-safe identifier rule.

### Step 2: Replace directive-based module classification

- Remove `#test` and `#initOnly` as the primary grouping mechanism.
- Store each module's owning execution group in module AST / compiled module metadata.
- Keep `assert` valid in any module; test execution is determined by whether the module belongs to `group test`.
- Remove module filtering based on test/init directives and replace it with group-based dispatch generation.

### Step 3: Generate group exports

- Generate one dispatcher function per group.
- Each dispatcher calls the group's modules in source order.
- Export every group dispatcher under the group name.
- Rename `cycle` to `main`.
- Rename `runTests` to `test`.
- Rename `initOnly` to `init`.

### Step 4: Rename default initialization

- Rename the current built-in `init` export to `initDefaults`.
- Ensure `initDefaults` only zeroes required memory and applies initial data segments.
- Remove init-only module calls from the default initializer.
- Update runtime callers to call `initDefaults` before calling group exports.

### Step 5: Migrate examples and tests

- Wrap all repository 8f4e modules in explicit groups.
- Use `group main` for normal runtime modules.
- Use `group init` for modules that previously used `#initOnly`.
- Use `group test` for modules that previously used `#test`.
- Update example mocks and test fixtures to the new grouping syntax.

### Step 6: Update hosts and public APIs

- Update CLI run paths to call `initDefaults` and then `main`.
- Update CLI test paths to call `initDefaults` and then `test`.
- Update editor/compiler-worker initialization to use `initDefaults`.
- Update runtime packages to use `main` instead of `cycle`.
- Update TypeScript types, docs, and tests for the new export names.

## Validation Checkpoints

- `npx nx run @8f4e/tokenizer:test`
- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/examples:test`
- `npx nx run-many --target=typecheck --all`
- `npx nx run-many --target=lint --all`
- Run CLI examples through the normal run command and test command after migration.

## Success Criteria

- [ ] 8f4e source supports `group <name>` / `groupEnd` around module blocks.
- [ ] Group names are unique and every module belongs to exactly one group.
- [ ] `initDefaults` initializes memory defaults without executing user modules.
- [ ] `main`, `init`, `test`, and any other group names are exported as WebAssembly functions.
- [ ] Existing examples are migrated to explicit groups.
- [ ] `#test`, `#initOnly`, `cycle`, `initOnly`, and `runTests` are removed or replaced in repository code.
- [ ] Runtime and CLI callers use `initDefaults` plus the appropriate group export.

## Affected Components

- `packages/compiler/packages/tokenizer` - Group block syntax, validation, and AST shape.
- `packages/compiler-spec` - Source block types, compiled module metadata, and export/result types.
- `packages/compiler/src` - Group-aware module collection, dispatcher generation, and initializer rename.
- `packages/compiler-worker` - Memory default initialization and group export invocation.
- `packages/runtime-web-worker` - Runtime export names and execution loop.
- `packages/cli` - Run/test commands and runtime runner export names.
- `packages/examples` - Migration of all 8f4e module files to explicit groups.
- `docs` - Language documentation and migration notes.

## Risks & Considerations

- **Initializer semantics**: Moving user init modules out of `initDefaults` changes host responsibility. Runtime callers must explicitly call `init` when they want user initialization.
- **Export name validation**: Group names become WebAssembly export names, so invalid or reserved names should be rejected early.
- **Group/source ordering**: Module order inside a group must remain deterministic after include/project flattening.
- **Editor impact**: If the editor has layout or block-type assumptions around modules/constants/functions, group blocks may need explicit UI support.
- **Breaking changes**: This intentionally breaks old `cycle`, `init`, `initOnly`, `runTests`, `#test`, and `#initOnly` usage because the project is not released.

## Related Items

- **Related**: [TODO 150: Add #test directive and assert runner](./150-add-test-module-type.md)
- **Related**: [TODO 377: Batch-parse modules and validate shared ids](./377-batch-parse-modules-and-validate-shared-ids.md)
- **Related**: [TODO 378: Make parser stateful for block pairing and owning block context](./378-make-parser-stateful-for-block-pairing-and-owning-block-context.md)

## Notes

- This TODO records the design discussion from 2026-05-29.
- The current compiler `init` export fills memory with zeroes, applies passive data segments for defaults, and then runs `initOnly` modules. The planned `initDefaults` export should stop before any user module execution.
- `main`, `init`, and `test` are conventions, not special scoping forms.
