# @8f4e/tokenizer

`@8f4e/tokenizer` parses a single compiler source block into a validated AST.

```ts
const ast = compileToAST(sourceLines, cache, cacheKey);
```

The tokenizer owns source-to-AST parsing and syntax-level validation that can be decided from tokens, block placement, or argument shape alone. It also exports focused syntax helpers for argument parsing, memory-reference token classification, block classification, and instruction argument validation.

This package owns:

- Source line tokenization and AST construction.
- Source block structure validation.
- Instruction placement and syntax-level argument validation.
- Literal, identifier, compile-time operand, string literal, pointer-depth, and memory-reference token parsing.
- Optional AST caching for repeated compilation of unchanged source blocks.

This package does not own:

- Project document parsing. That belongs to `@8f4e/project-preparser`.
- Constant inlining, memory reference inlining, or memory layout planning.
- Symbol resolution, scope checks, stack analysis, type compatibility, or code generation.
- Semantic compiler errors that require compiler state.

Syntax errors belong to `src/syntax/syntaxError.ts`; semantic errors belong to later compiler phases.
