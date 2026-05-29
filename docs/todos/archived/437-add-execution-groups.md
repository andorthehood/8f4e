---
title: 'TODO: Add execution entries'
priority: Medium
effort: 2-4d
created: 2026-05-29
issue: null
status: Completed
completed: 2026-05-29
---

# TODO: Add execution entries

## Problem Description

8f4e currently uses special module-level directives such as `#initOnly` and `#test` to decide which compiled dispatcher should execute a module. These directives are growing into a parallel entry system, but the language does not yet have a first-class structural way to describe execution entries.

The current built-in exports also make the next design awkward:

- `cycle` is effectively the main runtime entry.
- `initOnly` is effectively a separately callable initialization entry.
- `runTests` is effectively the test entry.
- `init` currently initializes memory defaults and then runs init-only modules, so it conflicts with a future user-authored `entry init` export.

Because the project is unreleased and all known 8f4e source lives in this repository, this can be a breaking language/API cleanup rather than a compatibility layer.

## Proposed Solution

Introduce explicit execution entries:

```8f4e
entry main
module foo
moduleEnd
entryEnd
entry init
module setup
moduleEnd
entryEnd
entry test
module fooTest
moduleEnd
entryEnd
```

Entries are execution partitions only. They are not lexical scopes, namespaces, or visibility boundaries. Functions, constants, memory-like shared declarations, and other non-module source blocks remain outside entries for now.

Every entry becomes a WebAssembly export with the same name:

```ts
instance.exports.initDefaults();
instance.exports.init();
instance.exports.main();
instance.exports.test();
```

Rename the current built-in memory/default initializer from `init` to `initDefaults`. After this change, `initDefaults` should only zero imported memories and apply declared defaults. It should not run user modules. The host decides when to call exported execution entries, including `init`, `main`, and `test`.

## Design Decisions

- `entry <name>` starts an execution entry.
- `entryEnd` closes the current execution entry.
- Entry names must be unique across a compiled program.
- Entries may only wrap `module ... moduleEnd` blocks for now.
- Function and constants blocks remain top-level.
- Entries do not create lexical scopes and do not affect name resolution.
- Every module belongs to exactly one entry.
- Empty entries are valid and export a no-op function.
- Every entry is exported with its entry name.
- `entry main` replaces the old `cycle` dispatcher/export.
- `entry init` replaces the old `#initOnly` / `initOnly` dispatcher/export.
- `entry test` replaces `#test` / `runTests`.
- Module execution order inside an entry follows source module order.
- Entry declaration order has no lifecycle meaning. Entries are called by the host, potentially independently or asynchronously.
- Existing examples should be migrated to explicit entries instead of preserving ungrouped module behavior.

## Anti-Patterns

- Do not implement entries as lexical scopes or namespaces.
- Do not keep `#test` and `#initOnly` as long-term alternate syntax.
- Do not make `initDefaults` execute user modules.
- Do not add fallback behavior for ungrouped modules after migrating the repository examples.
- Do not special-case `main`, `init`, or `test` beyond host/runtime convention. They should be ordinary entry exports.

## Implementation Plan

### Step 1: Add syntax and AST support

- Add `entry` / `entryEnd` source block parsing.
- Validate that only module blocks appear inside entries.
- Validate that function and constants blocks remain top-level.
- Validate that entry names are unique.
- Validate that each module belongs to exactly one entry.
- Decide whether entry ids reuse the existing identifier rules or need an explicit export-safe identifier rule.

### Step 2: Replace Directive-Based Module Classification

- Remove `#test` and `#initOnly` as the primary grouping mechanism.
- Store each module's owning execution entry in module AST / compiled module metadata.
- Keep `assert` valid in any module; test execution is determined by whether the module belongs to `entry test`.
- Remove module filtering based on test/init directives and replace it with entry-based dispatch generation.

### Step 3: Generate Entry Exports

- Generate one dispatcher function per entry.
- Each dispatcher calls the entry's modules in source order.
- Export every entry dispatcher under the entry name.
- Rename `cycle` to `main`.
- Rename `runTests` to `test`.
- Rename `initOnly` to `init`.

### Step 4: Rename Default Initialization

- Rename the current built-in `init` export to `initDefaults`.
- Ensure `initDefaults` only zeroes required memory and applies initial data segments.
- Remove init-only module calls from the default initializer.
- Update runtime callers to call `initDefaults` before calling entry exports.

### Step 5: Migrate Examples And Tests

- Wrap all repository 8f4e modules in explicit entries.
- Use `entry main` for normal runtime modules.
- Use `entry init` for modules that previously used `#initOnly`.
- Use `entry test` for modules that previously used `#test`.
- Update example mocks and test fixtures to the new grouping syntax.

### Step 6: Update Hosts And Public APIs

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

- [ ] 8f4e source supports `entry <name>` / `entryEnd` around module blocks.
- [ ] Entry names are unique and every module belongs to exactly one entry.
- [ ] `initDefaults` initializes memory defaults without executing user modules.
- [ ] `main`, `init`, `test`, and any other entry names are exported as WebAssembly functions.
- [ ] Existing examples are migrated to explicit entries.
- [ ] `#test`, `#initOnly`, `cycle`, `initOnly`, and `runTests` are removed or replaced in repository code.
- [ ] Runtime and CLI callers use `initDefaults` plus the appropriate entry export.

## Affected Components

- `packages/compiler/packages/tokenizer` - Entry block syntax, validation, and AST shape.
- `packages/compiler-spec` - Source block types, compiled module metadata, and export/result types.
- `packages/compiler/src` - Entry-aware module collection, dispatcher generation, and initializer rename.
- `packages/compiler-worker` - Memory default initialization and entry export invocation.
- `packages/runtime-web-worker` - Runtime export names and execution loop.
- `packages/cli` - Run/test commands and runtime runner export names.
- `packages/examples` - Migration of all 8f4e module files to explicit entries.
- `docs` - Language documentation and migration notes.

## Risks & Considerations

- **Initializer semantics**: Moving user init modules out of `initDefaults` changes host responsibility. Runtime callers must explicitly call `init` when they want user initialization.
- **Export name validation**: Entry names become WebAssembly export names, so invalid or reserved names should be rejected early.
- **Entry/source ordering**: Module order inside an entry must remain deterministic after include/project flattening.
- **Editor impact**: If the editor has layout or block-type assumptions around modules/constants/functions, entry blocks may need explicit UI support.
- **Breaking changes**: This intentionally breaks old `cycle`, `init`, `initOnly`, `runTests`, `#test`, and `#initOnly` usage because the project is not released.

## Related Items

- **Related**: [TODO 150: Add #test directive and assert runner](./150-add-test-module-type.md)
- **Related**: [TODO 377: Batch-parse modules and validate shared ids](./377-batch-parse-modules-and-validate-shared-ids.md)
- **Related**: [TODO 378: Make parser stateful for block pairing and owning block context](./378-make-parser-stateful-for-block-pairing-and-owning-block-context.md)

## Notes

- This TODO records the design discussion from 2026-05-29.
- The current compiler `init` export fills memory with zeroes, applies passive data segments for defaults, and then runs `initOnly` modules. The planned `initDefaults` export should stop before any user module execution.
- `main`, `init`, and `test` are conventions, not special scoping forms.
- Archived after verification on 2026-05-29: `entry` / `entryEnd` syntax is parsed from repository examples, compiler input is grouped as `entries`, every entry is exported by name, `initDefaults` is the memory-default initializer, old test/init-only directives are removed, and runtime/CLI callers use the new entry exports.
