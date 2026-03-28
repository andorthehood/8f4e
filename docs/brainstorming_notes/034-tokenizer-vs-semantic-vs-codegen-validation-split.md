# Tokenizer vs Semantic vs Codegen Validation Split

This note captures a useful boundary for moving error handling out of instruction compilers.

The current compiler still does too much validation late, inside instruction compilers. A cleaner design is to decide which class of error belongs to:

- tokenizer
- semantic pass
- codegen

## Principle

The split should be based on what information is required to detect the error.

- If source text alone is enough, it belongs in the tokenizer.
- If names, scopes, layout, or collected declarations are required, it belongs in the semantic pass.
- If emitted stack state, resolved operand types, or lowering details are required, it belongs in codegen.

## Move To Tokenizer

These are syntax-only problems that can be detected before semantic context exists:

- unknown instruction name
- wrong number of arguments
- invalid raw argument shape for an instruction position
- malformed numeric literal syntax
- malformed compile-time expression syntax
- malformed string literal syntax
- malformed pointer syntax such as invalid `*` depth
- malformed address/reference/query syntax
- malformed intermodule reference token shape
- block start/end shape errors detectable from syntax alone
- malformed directive syntax such as `#skipExecution`

Examples:

- `push` with zero arguments
- `add 1`
- malformed `sizeof(` expression
- malformed `&module::buffer`
- invalid numeric token like `1e+`

These should produce syntax errors from `@8f4e/tokenizer`.

## Move To Semantic Pass

These are not syntax errors, but they should still be resolved before codegen:

- undeclared constant
- undeclared memory item
- undeclared module or intermodule target
- duplicate declarations
- invalid scope usage once scope context is known
- const resolution failures
- memory/default/init target existence checks
- intermodule reference existence and availability checks
- address resolution validity once layout is known
- compile-time value resolution failures after parsing succeeded
- local existence checks, if they can be resolved before codegen
- block/module/function structural errors that need context rather than token shape

Examples:

- `push SIZE` where `SIZE` was never declared
- `init foo 1` where `foo` does not exist
- `push sizeof(source:buffer)` where `source` is not a known module
- duplicate `const SIZE ...`

These should become compiler semantic errors discovered during semantic collection / normalization, not during codegen.

## Keep In Codegen

These still need actual compilation context or lowered operand information:

- stack shape and operand availability
- resolved operand type compatibility
- wasm/codegen constraints
- local index allocation and use correctness, if still owned by codegen
- errors that depend on emitted control flow or final lowered representation

Examples:

- operand type mismatch after resolution
- invalid stack state for an arithmetic instruction
- codegen-only lowering constraint violations

## Practical Goal

Instruction compilers should not remain the default place where argument count, raw argument shape, or identifier existence are discovered.

The intended direction is:

1. tokenizer validates syntax and argument shape
2. semantic pass validates existence and resolves compile-time meaning
3. codegen assumes those phases already succeeded and focuses on lowering/runtime rules

## Near-Term Implication

This suggests at least three cleanup tracks:

- move arity and raw argument-shape validation into `@8f4e/tokenizer`
- move const/memory/module existence checks into the semantic pass
- shrink instruction compiler validation to stack/type/codegen concerns only

This should make instruction compilers smaller and make the tokenizer/compiler boundary much clearer.
