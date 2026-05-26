---
title: 'TODO: Add typed compiler AST group indexes'
priority: Medium
effort: 1-2d
created: 2026-05-26
issue: null
status: Done
completed: 2026-05-26
---

# TODO: Add typed compiler AST group indexes

## Problem Description

Compiler passes still rediscover facts by traversing AST line arrays with searches such as `.find(...)`, `.some(...)`, and repeated full-array loops. That keeps compiler code responsible for answering questions that the parser or AST construction phase could answer once.

The current AST contract is primarily line-array based: `AST = CompilerASTLine[]`, with tuple aliases such as `ModuleAst`, `FunctionAst`, and `ConstantsAst`. Those tuple types help with start/end line shape, but they do not give the compiler a typed top-level object with required metadata for the group being compiled.

This matters because repeated AST scans tend to preserve ambiguity:

- a module compiler can end up searching for the module id instead of receiving a `ModuleAST` object that already has one;
- function compilation can rediscover function id, parameters, results, or directives from lines instead of reading required `FunctionAST` metadata;
- cross-module orchestration can rebuild function id lists or lookup maps instead of receiving them from a parser-owned or AST-construction-owned index;
- defensive runtime checks remain tempting because the type interface does not prove which top-level group is being compiled.

## Proposed Solution

Introduce specific discriminated AST object types for compiler-owned top-level groups. Each group type should carry only the metadata that is required and valid for that group.

The intended direction is conceptually:

```ts
type CompilerASTGroup =
	| ModuleAST
	| FunctionAST
	| ConstantsAST;

type ModuleAST = {
	type: 'module';
	id: string;
	lines: ModuleAst;
	// other module-only indexes that remove real compiler searches
};

type FunctionAST = {
	type: 'function';
	id: string;
	lines: FunctionAst;
	params: readonly FunctionParam[];
	results: readonly FunctionResult[];
	// other function-only metadata that remove real compiler searches
};

type CompilerASTBatch = {
	modules: readonly ModuleAST[];
	functions: readonly FunctionAST[];
	functionsById: ReadonlyMap<string, FunctionAST>;
};
```

The final names and exact fields should follow the current compiler-spec style. The important constraint is the shape: use discriminated, group-specific objects with required metadata, not one generic AST object with optional fields.

Useful metadata candidates:

- top-level group id;
- function parameter and result metadata;
- function lookup by id where current orchestration searches parsed function arrays;
- compiler directive metadata that is already validated as prologue-only;
- memory declaration indexes for module compilation, if current passes repeatedly rediscover them;
- constants/use metadata, if current namespace work repeatedly scans the same lines.

## Anti-Patterns

- Do not create a generic `CompilerAST` object with optional fields such as `id?`, `functionIds?`, `signature?`, or `metadata?: Record<string, unknown>`.
- Do not add metadata for group types that the compiler does not actually parse or own.
- Do not put cross-group lookup metadata on an individual group object unless that group truly owns it; use a typed batch/program parse result for cross-group indexes.
- Do not keep line-array-only APIs as compatibility layers once the typed group objects are introduced.
- Do not hide metadata on AST arrays through non-enumerable properties or test-avoidance tricks.
- Do not add runtime fallback searches for metadata that should be required by the relevant AST group type.
- Do not duplicate indexes that can be derived once from the owning AST construction step.

## Implementation Plan

### Step 1: Inventory repeated AST scans

- Review compiler and compiler-spec code for `.find(...)`, `.some(...)`, `.filter(...)`, `.map(...)`, and manual `for` loops over AST lines.
- Classify each scan as either necessary sequential compilation work or metadata/index discovery that can move to typed AST construction.
- Record the concrete fields needed by `ModuleAST`, `FunctionAST`, and any other real compiler-owned group type.

### Step 2: Define typed top-level AST group objects

- Add discriminated AST group object types in `packages/compiler-spec/src/ast.ts` or a focused adjacent module.
- Keep existing line tuple types as the `lines` payload where they remain useful.
- Make group-specific metadata required on the group that owns it.

### Step 3: Build group objects during parsing or AST construction

- Update tokenizer/parser APIs or add a focused AST grouping helper so compiler orchestration receives typed group objects.
- Preserve cache behavior deliberately: cached AST data should include the typed group object or a clearly equivalent typed payload.
- Update tests and snapshots directly instead of keeping old line-array compatibility paths.

### Step 4: Remove compiler rediscovery paths

- Replace compiler searches for group id, function signature, function lookup, and repeated declaration/directive discovery with reads from the typed AST group.
- Delete fallback helpers, old aliases, and transitional adapters once callers move to the new type.
- Keep runtime validation only for semantic facts that cannot be known from AST construction.

## Validation Checkpoints

- `rg -n "\\.find\\(|\\.some\\(|\\.filter\\(|\\.map\\(|for \\(.* of .*ast" packages/compiler/src packages/compiler-spec/src packages/compiler/packages/tokenizer/src -g '*.ts'`
- `rg -n "id\\?|functionIds\\?|signature\\?|metadata\\?:|Record<string, unknown>" packages/compiler-spec/src packages/compiler/src packages/compiler/packages/tokenizer/src -g '*.ts'`
- `npx nx run compiler-spec:typecheck`
- `npx nx run @8f4e/tokenizer:typecheck`
- `npx nx run compiler:typecheck`
- `npx nx run @8f4e/tokenizer:test`
- `npx nx run compiler:test`

## Success Criteria

- [ ] Compiler-owned top-level AST groups are represented as discriminated object types, not only raw line arrays.
- [ ] Module and function AST objects expose required ids and group-specific metadata through their types.
- [ ] Compiler code no longer re-traverses AST lines to rediscover metadata that belongs to typed AST group construction.
- [ ] No generic optional metadata bag or compatibility line-array wrapper remains.
- [ ] Tests and snapshots reflect the new AST contract directly.

## Affected Components

- `packages/compiler-spec/src/ast.ts` - AST group object types and exported contracts.
- `packages/compiler/packages/tokenizer/src/parser.ts` - AST construction and cache integration.
- `packages/compiler-spec/src/cache.ts` - cached AST payload shape if the public cache stores grouped AST objects.
- `packages/compiler/src/index.ts` - module/function parse orchestration and compile entry point.
- `packages/compiler/src/compiler.ts` - compilation entry points that currently accept line arrays.
- `packages/compiler/src/semantic/` - namespace/prepass code that may rediscover group metadata.
- `packages/compiler/src/graphOptimizer.ts` - module metadata extraction and dependency sorting.
- `packages/compiler/tests/` and `packages/compiler/packages/tokenizer/src/` - AST snapshots and compiler/tokenizer coverage.

## Risks & Considerations

- **Scope control**: Only move metadata that removes real compiler rediscovery. Do not turn AST objects into broad compiler context containers.
- **Type clarity**: Every metadata field should belong to exactly one group type. If a field is optional on every group, the model is probably too generic.
- **Cache shape**: AST cache changes should be made intentionally and tested, because cache entries currently store `AST`.
- **Related prepass work**: This may simplify TODO 406, but it should stay focused on AST group structure rather than solving all namespace/prepass repetition at once.

## Related Items

- **Related**: `docs/todos/406-review-compiler-namespace-prepass-repetition.md`
- **Related**: `docs/todos/378-make-parser-stateful-for-block-pairing-and-owning-block-context.md`
- **Related**: `docs/todos/377-batch-parse-modules-and-validate-shared-ids.md`
- **Related**: `docs/todos/archived/417-tighten-compiler-ast-union-and-source-block-types.md`

## Notes

- The goal is to remove code by making the compiler's input types stronger. If the implementation adds more runtime checks, fallback paths, or compatibility layers, it is moving in the wrong direction.
- This todo follows the broader project rule that compatibility layers should not be kept. Update callers, fixtures, snapshots, and tests to the new typed AST group contract in the same change.
