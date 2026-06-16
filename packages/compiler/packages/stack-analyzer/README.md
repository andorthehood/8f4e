# @8f4e/stack-analyzer

`@8f4e/stack-analyzer` owns semantic stack validation and stack-effect analysis for compiler instruction lines.

```ts
const analyzedLine = analyzeInstruction(line, context);
```

The package consumes normalized compiler lines and the active compilation context for the block being compiled. It mutates the context stack as it analyzes each line, and it returns the analyzed line with a `stackAnalysis` snapshot containing:

- stack state before and after the instruction
- consumed operands
- produced stack items
- branch-dropped stack items when an instruction discards the remaining stack

The stack analyzer is responsible for:

- operand count and operand type checks declared by instruction specs
- instruction-specific stack effects not expressible in the central instruction spec
- function call overload matching from the current namespace registry
- function return stack validation
- block result stack validation
- map input/output stack compatibility
- address, pointer, clamp-range, and known-integer stack metadata propagation
- `push`, pointer dereference, and `pushShape` stack item production after semantic normalization

It is not responsible for parsing, syntax validation, identifier resolution, namespace construction, memory layout planning, memory default resolution, memory-reference inlining, local declaration creation, or WASM/codegen emission. Those earlier passes must provide the resolved line metadata and context facts that stack analysis reads.

The public package entrypoint exports `analyzeInstruction` for compiler orchestration. Internal helper modules remain package-private unless a compiler pass genuinely needs a new analyzer-level API.
