---
title: 'TODO: Restrict compiler directives to block prologue'
priority: Medium
effort: 2-4h
created: 2026-05-19
status: Open
completed: null
---

# TODO: Restrict compiler directives to block prologue

## Problem Description

Compiler directives can currently appear later in a module or function body. That makes directives feel retroactive or order-sensitive in a way that is easy to misread, especially for upcoming placement directives such as memory regions.

For module-level directives, the intended rule is that directives must appear directly after the `module` instruction and before any declaration or executable instruction. Existing module directives should follow the same rule so the language has one consistent prologue model.

## Proposed Solution

Add compiler validation that treats compiler directives as source-block prologue metadata.

- In modules, allow module compiler directives only immediately after `module`.
- In functions, apply the same prologue rule to function compiler directives immediately after `function`.
- Once any non-directive source line appears after the block start, reject later compiler directives.
- Keep comments and blank lines irrelevant because they are already skipped by the tokenizer/parser.

## Anti-Patterns

- Do not let directives appear after memory declarations and then retroactively affect those declarations.
- Do not special-case future region directives differently from existing compiler directives.
- Do not silently ignore misplaced directives; report a compiler diagnostic on the directive line.

## Implementation Plan

### Step 1: Define Directive Sets
- Centralize the known module/function compiler directives in compiler-owned code.
- Include existing directives such as `#skipExecution`, `#initOnly`, `#loopCap`, `#impure`, and `#export`.

### Step 2: Add Placement Validation
- Validate source-block AST order before codegen.
- For modules, reject compiler directives after the first non-directive line following `module`.
- For functions, reject compiler directives after the first non-directive line following `function`.

### Step 3: Add Diagnostics
- Add a dedicated compiler error code/message for misplaced compiler directives.
- Ensure diagnostics point at the misplaced directive line.

### Step 4: Add Tests And Docs
- Add compiler tests for valid prologue directives and invalid late directives.
- Update compiler instruction/directive docs to describe the prologue rule.

## Validation Checkpoints

- `npx nx run compiler:test -- compilerDirective`
- `npx nx run compiler:typecheck`

## Success Criteria

- [ ] Module directives are accepted directly after `module`.
- [ ] Module directives are rejected after declarations or executable instructions.
- [ ] Function directives are accepted directly after `function`.
- [ ] Function directives are rejected after params, locals, or executable instructions.
- [ ] Docs describe directives as block prologue metadata.

## Affected Components

- `packages/compiler/src` - directive placement validation and diagnostics.
- `packages/compiler-spec/src/errors.ts` - new compiler error code.
- `packages/compiler/docs` - directive placement documentation.
- `packages/compiler/packages/tokenizer/src` - only if the rule is better enforced during parsing.

## Risks & Considerations

- **Breaking change**: Existing projects with late `#loopCap`, `#skipExecution`, `#initOnly`, `#impure`, or `#export` directives will need to move them to the block prologue.
- **Phase ownership**: Placement depends on block context and should likely be a compiler semantic error unless the parser is extended to own source-block context.

## Related Items

- **Blocks**: `403-add-logical-memory-regions-for-multi-memory`
- **Related**: `381-add-follow-module-layout-directive.md`
- **Related**: `docs/brainstorming_notes/041-logical-memory-regions-for-multi-memory-runtimes.md`

