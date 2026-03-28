# Compiler Design

Internal notes about compiler architecture and intended phase boundaries.

## Compile-Time Folding Pipeline

Compile-time resolution should be owned by one semantic stage instead of being spread across parser fallbacks, instruction routing, and codegen helpers.

The intended pipeline is:

1. Source code
2. Parsed AST
   - contains literals, identifiers, references, and compile-time expression forms
3. Semantic namespace pass
   - collects constants, memory declarations, `use` imports, and intermodule metadata availability
4. AST normalization / compile-time folding pass
   - rewrites compile-time-resolvable arguments to plain literals
5. Compilation / codegen
   - instruction compilers mostly see literals or true runtime identifiers
6. Late intermodule fixups only for forms that genuinely cannot be resolved earlier

In short:

- source code
- AST with literals and expressions
- AST with inlined values
- compilation

## Design Rule

Compile-time expressions should have one owner.

If a value can be resolved during semantic normalization, downstream instruction compilers and helper paths should not re-resolve it again.
