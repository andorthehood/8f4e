# Possible Future Semantics Package Extraction

This note captures a possible future package boundary for the semantic pass.

## Summary

Extracting the semantic pass into its own package could make sense later, but it is probably premature right now.

The direction itself is sound:

- tokenizer owns `source -> AST`
- semantics owns `AST -> validated/planned/normalized semantic artifact`
- compiler owns `semantic artifact -> wasm/module output`

That is a coherent long-term shape.

## Why It Could Make Sense

A dedicated semantics package could eventually own:

- namespace collection
- declaration planning
- compile-time normalization
- existence validation
- dependency extraction
- memory planning inputs and outputs

Then the compiler package would stop mixing semantic planning with code generation and would consume a more explicit semantic artifact instead.

Possible future package split:

- `@8f4e/tokenizer`
- `@8f4e/semantics`
- `@8f4e/compiler`

## Why It Is Probably Too Early

The semantic layer is improved, but it is still not stable enough to freeze into a separate package boundary.

Current reasons to wait:

- semantic code still lives close to compiler-specific context and types
- some validation responsibilities are still being moved out of instruction compilers
- tokenizer/compiler boundary is cleaner than semantic/codegen boundary
- some data structures are still shared too casually between semantic planning and codegen
- semantic outputs are not yet explicit enough to serve as a clean package API

If extracted now, the likely result would be packaging current internal coupling instead of defining a durable abstraction.

## Better Order

The safer sequence is:

1. continue tightening the semantic layer inside `packages/compiler/src/semantic`
2. move more validation out of codegen and into tokenizer/semantic phases
3. make semantic outputs more explicit and stable
4. only then consider extracting a sibling package

So the next step is not package extraction yet. The next step is to stabilize the semantic subsystem where it currently lives.

## Intended Future Boundary

If the extraction becomes worthwhile later, the desired boundary would look like this:

- `@8f4e/tokenizer`
  - source text to AST
- `@8f4e/semantics`
  - AST to validated/planned/normalized semantic IR
- `@8f4e/compiler`
  - semantic IR to compiled output

That would likely be the cleanest eventual architecture, but it should follow semantic stabilization, not precede it.
