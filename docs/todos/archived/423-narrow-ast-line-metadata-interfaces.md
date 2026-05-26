---
title: 'TODO: Narrow AST line metadata interfaces'
priority: Medium
effort: 4-8h
created: 2026-05-26
issue: null
status: Completed
completed: 2026-05-26
---

# TODO: Narrow AST line metadata interfaces

## Problem Description

Recent compiler AST cleanup moved several facts earlier into tokenizer/parser-owned AST metadata so later compiler phases do not rediscover them by looping over AST lines or arguments. That direction is correct, but `ASTLineBase` in `packages/compiler-spec/src/ast.ts` is still carrying metadata fields that only apply to specific instruction lines.

Examples include:

- `isSemanticOnly`
- `isMemoryDeclaration`
- `isBlockPrologue`
- `hasExplicitMemoryDefault`
- `ifBlock`
- `ifEndBlock`
- `blockBlock`
- `blockEndBlock`

Keeping these fields on the shared base type makes every line appear capable of carrying every kind of metadata. That weakens the type interface and encourages runtime ambiguity checks such as `if (line.isMemoryDeclaration)` or optional metadata reads on unrelated instructions.

The overall goal is to use strict, specific types where applicable instead of handling ambiguity during runtime. AST metadata should live on the line interface that owns it. Agents picking up this task should not solve it by hiding fields, adding compatibility wrappers, or creating a generic metadata bag.

## Proposed Solution

Move line metadata out of `ASTLineBase` and into the instruction-specific line interfaces that can actually carry that metadata.

Suggested ownership:

- `hasExplicitMemoryDefault` belongs on memory declaration lines.
- `referencedModuleIds` belongs on memory declaration lines.
- `referencedNamespaceIds` belongs only on namespace-referencing semantic/declaration lines such as `use`, `const`, and memory declaration lines.
- `ifBlock` belongs on `IfLine`.
- `ifEndBlock` belongs on `IfEndLine`.
- `blockBlock` belongs on `BlockLine`.
- `blockEndBlock` belongs on `BlockEndLine`.
- `isBlockPrologue` belongs on compiler directive lines that can appear in source-block prologues.
- `isSemanticOnly` should become a type guard or narrower line union instead of a base optional flag.
- `isMemoryDeclaration` should be replaced at consumers with the existing `isMemoryDeclarationLine(...)` type guard where possible.

This should make the compiler interfaces say what is true rather than relying on broad optional fields and runtime checks.

## Anti-Patterns

- Do not keep compatibility aliases, wrapper types, or re-exports for the old broad base-field shape.
- Do not create `metadata?: { ... }` as a generic bag for unrelated line facts.
- Do not hide new or moved fields from snapshots to make the PR look smaller.
- Do not replace one broad runtime check with another broad runtime check under a helper name.
- Do not add fallback codegen checks for facts that tokenizer/parser typing should guarantee.

## Implementation Plan

### Step 1: Inventory base metadata fields

- Review every field on `ASTLineBase`.
- Classify each field as either core line identity or instruction-specific metadata.
- Keep only core identity on the base: line numbers, instruction, and typed arguments.

### Step 2: Move block metadata to block line types

- Move `ifBlock` to `IfLine`.
- Move `ifEndBlock` to `IfEndLine`.
- Move `blockBlock` to `BlockLine`.
- Move `blockEndBlock` to `BlockEndLine`.
- Update parser assignments to use the narrowed line types rather than base-line writes.
- Update consumers such as block instruction compilers to receive/read the narrowed line types.

### Step 3: Move memory metadata to memory declaration lines

- Move `hasExplicitMemoryDefault` fully onto `MemoryDeclarationLine`.
- Keep `referencedModuleIds` and memory-line namespace reference metadata on memory declaration lines.
- Replace broad `line.isMemoryDeclaration` checks with `isMemoryDeclarationLine(line)` where a type guard is the actual contract.

### Step 4: Move semantic/prologue metadata to specific semantic/directive lines

- Replace broad `line.isSemanticOnly` checks with a type guard or semantic-line union.
- Move `isBlockPrologue` to compiler directive line types that can actually be prologue metadata.
- Update semantic application and namespace/layout loops to consume the narrowed contracts.

### Step 5: Update tests and snapshots honestly

- Update parser tests to assert the narrower line-specific metadata.
- Update AST snapshots if visible serialized line shape changes.
- Do not hide metadata or skip snapshot updates for cosmetic reasons.

## Validation Checkpoints

- `rg -n "isSemanticOnly|isMemoryDeclaration|isBlockPrologue|hasExplicitMemoryDefault|ifBlock|ifEndBlock|blockBlock|blockEndBlock" packages/compiler-spec/src/ast.ts packages/compiler/src packages/compiler/packages/tokenizer/src -g '*.ts'`
- `npx nx run @8f4e/tokenizer:typecheck`
- `npx nx run compiler:typecheck`
- `npx nx run @8f4e/tokenizer:test`
- `npx nx run compiler:test`

## Success Criteria

- [x] `ASTLineBase` only contains core line identity fields.
- [x] Instruction-specific metadata lives on instruction-specific line interfaces.
- [x] Compiler consumers use type guards or narrowed line types instead of broad optional base fields.
- [x] Parser assignments are typed against the specific line shape that owns each metadata field.
- [x] No compatibility layers, hidden metadata, or generic metadata bags are introduced.
- [x] Snapshot changes are updated honestly when the public AST shape changes.

## Affected Components

- `packages/compiler-spec/src/ast.ts` - AST line type definitions and type guards.
- `packages/compiler/packages/tokenizer/src/parser.ts` - parser-owned metadata assignment.
- `packages/compiler/packages/tokenizer/src/parser.test.ts` - parser metadata coverage.
- `packages/compiler/src/compiler.ts` - semantic/memory routing in compile loops.
- `packages/compiler/src/semantic/` - namespace discovery/layout and normalization routing.
- `packages/compiler/src/instructionCompilers/` - block instruction metadata consumers.

## Risks & Considerations

- **Diff size**: Moving `isSemanticOnly` and `isMemoryDeclaration` may update many snapshots because false fields can disappear from unrelated lines. This is acceptable if the new type contract is clearer.
- **Avoid half-cleaning**: Moving only one metadata field leaves `ASTLineBase` as a broad optional-field surface. Treat the remaining fields consistently.
- **No compatibility preservation**: The project is not released yet. Update callers directly and delete old paths rather than keeping shims.
- **Type guards should express ownership**: A helper is acceptable when it narrows to a real line subset. It should not merely hide the same broad optional-field check.

## Related Items

- **Follows up**: `docs/todos/421-clean-up-ast-construction-helper-scans.md`
- **Related**: `docs/todos/420-add-typed-compiler-ast-group-indexes.md`
- **Related**: `docs/todos/378-make-parser-stateful-for-block-pairing-and-owning-block-context.md`
- **Related**: `docs/agent_failure_notes/043-hidden-metadata-to-avoid-snapshot-updates.md`
- **Related**: `docs/agent_failure_notes/054-moving-runtime-discovery-into-ast-construction.md`

## Notes

- This todo exists because moving facts earlier into the AST is not enough by itself. The AST type interface must also become more precise.
- Future agents should optimize for the correct type boundary, not for a smaller-looking PR.
