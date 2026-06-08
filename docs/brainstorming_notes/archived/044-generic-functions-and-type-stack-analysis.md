# Generic Functions and Type-Stack Analysis

Date: 2026-05-08

This note captures a possible direction for adding generic functions to 8f4e, starting from a small repeated helper such as `storeAtInt` / `storeAtFloat`.

## Short version

8f4e could support generic functions with type parameters:

```8f4e
function storeAt<T>
#impure
param T* buffer
param int index
param T value

push buffer
push index
push sizeof(*buffer)
mul
add

push value
store

functionEnd
```

The compiler should probably specialize generic functions into concrete functions before normal codegen. That keeps the existing instruction compilers and Wasm type registry focused on concrete value types such as `int`, `float`, and `float64`.

## Useful terminology

The user-facing feature could be called:

- generic functions
- type parameters
- generics

The word "templates" also fits if the implementation is explicitly compile-time cloning and specialization, but "generic functions" is probably clearer for 8f4e source.

## Desired call-site behavior

The nicest source-level behavior would be type inference from the stack.

For example, if `storeAt<T>` has this signature:

```8f4e
param T* buffer
param int index
param T value
```

Then a plain call:

```8f4e
call storeAt
```

could infer `T = float` when the call-site stack contains:

```text
float* int float
```

and infer `T = int` when the stack contains:

```text
int* int int
```

The compiler could then rewrite the call internally to a concrete generated function name:

```8f4e
call storeAt__float
```

or:

```8f4e
call storeAt__int
```

An explicit call syntax such as `call storeAt<float>` could still be useful for cases where inference fails or would be ambiguous.

## Likely compiler stage

Generic specialization should happen after macro expansion and tokenization, but before ordinary function metadata collection and codegen.

Current rough pipeline:

```text
source
-> macro expansion
-> tokenizer AST
-> collect function metadata
-> compile functions
-> compile modules
```

Possible generic-aware pipeline:

```text
source
-> macro expansion
-> tokenizer AST
-> collect generic function declarations
-> analyze stack types at call sites
-> infer and generate concrete function ASTs
-> collect concrete function metadata
-> compile concrete functions
-> compile modules
```

This matters because `collectFunctionMetadataFromAsts(...)` currently assumes each function has one concrete name, one concrete signature, and one Wasm index. Generic definitions do not fit that shape directly.

## Why a separate normalization pass makes sense

The rest of the compiler already works best when richer source forms are normalized into simpler internal forms before codegen.

For generics, the normalized form should probably contain only concrete functions and concrete calls. That means downstream logic such as:

- `call` validation
- `param` registration
- `functionEnd` return checking
- stack type compatibility
- Wasm type registry insertion

can continue to operate on concrete types.

Avoid making every instruction compiler understand a type parameter like `T`; that would spread generic awareness through too much of the compiler.

## Type-stack analysis as a prerequisite

Inferring `T` from a plain `call storeAt` requires knowing the stack types at the call site. The compiler already tracks stack value types during instruction compilation through `context.stack`, but that tracking is coupled to bytecode emission.

Extracting reusable type-stack analysis would help generics and may also help future editor tooling, diagnostics, hovers, and stack visualization.

An analysis result could eventually look like:

```ts
interface StackAnalysisLine {
	line: AST[number];
	stackBefore: StackItem[];
	stackAfter: StackItem[];
}
```

Generic inference could then compare `stackBefore` with a generic function signature and produce concrete specializations.

## The tricky part: recursive compileSegment lowering

The current compiler is not a simple one-line-at-a-time stack-effect interpreter. Several instruction compilers use `compileSegment(...)` to lower one instruction into synthetic 8f4e source, while relying on the normal semantic pipeline to allocate locals, allocate internal resources, validate stack effects, and emit bytecode.

Examples include:

- `loop`
- `abs` for integers
- `min` / `max` for integers
- `ensureNonZero`
- `hasChanged`
- `risingEdge`
- `fallingEdge`
- `branchIfUnchanged`

This makes a naive separate analyzer hard, because the analyzer must understand those recursive lowerings too.

## Possible first refactor

A softer first step could be to separate "run semantic effects" from "emit bytecode" with an instruction sink or runner mode.

Conceptually:

```ts
interface InstructionSink {
	emit(byteCode: number[]): void;
	compileSegment(code: string[], context: CompilationContext): CompilationContext;
}
```

Codegen mode would use a real sink that appends Wasm bytes.

Analysis mode would use a sink where `emit(...)` is a no-op, but recursive `compileSegment(...)` still runs the same semantic pipeline over synthetic source.

The important distinction:

- analysis mode should skip bytecode emission
- analysis mode should still perform semantic state changes that affect types

Those semantic state changes include:

- stack updates
- locals and params
- constants
- block stack updates
- function signatures
- internal resource type declarations

Renaming or extracting `compileSegment(...)` into something like `runSegment(...)` could make this boundary clearer.

## First useful constraints

To keep the first version tractable:

- support generic functions only, not generic modules
- support type parameters that stand for concrete value types and pointer-to-value types
- require every inferred type parameter to be determined from parameter positions
- require all occurrences of the same type parameter to agree
- error if inference fails
- error if inference is ambiguous
- generate stable internal names for specializations

For example:

```text
storeAt<T> + T=float -> storeAt__float
storeAt<T> + T=int   -> storeAt__int
```

## Open questions

- What exact syntax should declare type parameters: `function storeAt<T>`, `function storeAt T`, or something more 8f4e-like?
- Should explicit type arguments be allowed at call sites from the beginning?
- How should generated function names avoid collisions with user-defined names?
- Should generic specializations appear in emitted AST/debug output?
- How should recursive generic functions or generic functions calling other generic functions be handled?
- Should `float64` be included in the first version?
- How should generic pointer types interact with `sizeof(*buffer)` and pointer-depth syntax validation?
