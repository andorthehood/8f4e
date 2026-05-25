# Pointer-Typed Memory Access

Date: 2026-05-25

This note captures an open language-design idea for making memory access stricter before 8f4e is released. The core question is whether memory operations should accept only pointer-typed values, and where integers should be allowed to become pointers.

This is not yet a decision or implementation plan.

## Short version

Memory instructions could become pointer-only operations.

Under that model, instructions such as `load`, `store`, dereferencing, `storeBytes`, and `memoryCopy` would require pointer-typed operands instead of accepting arbitrary integers as addresses.

Pointer-typed values would be treated as safe by memory instructions. Raw integers would not be trusted as addresses.

The main open question is how explicit the integer-to-pointer boundary should be:

- Require users to write `intToPtr`.
- Insert `intToPtr` automatically when the expected pointer type is unambiguous.
- Support both, with explicit `intToPtr` as the primitive and automatic conversion as syntax sugar.

## Motivation

The current compiler has been growing guard logic around memory access because integer stack values can be used as addresses.

That works, but it spreads the trust boundary across several instructions:

- `load` guards unproven addresses.
- `store` guards unproven destination addresses.
- pointer dereference may need to guard loaded pointer values.
- storing into pointer slots may need special handling when the new value is not proven safe.

A stricter language model could simplify this:

- memory instructions operate on pointers
- integers are not pointers
- only pointer-conversion logic validates raw addresses
- once a value is typed as a pointer, memory instructions trust it

This moves safety from repeated memory-operation guards into the type system and conversion boundary.

## Explicit `intToPtr`

An explicit conversion instruction could look like:

```text
push addressValue
intToPtr int*
load
```

The pointer type tells the compiler the required access width:

- `int8*` needs 1 byte in bounds
- `int16*` needs 2 bytes in bounds
- `int*`, `float*`, and `T**` need 4 bytes in bounds
- `float64*` needs 8 bytes in bounds

Possible behavior:

- constant integer address: validate at compile time
- out-of-bounds constant: compiler error
- dynamic integer address: emit runtime validation bytecode
- successful validation: produce a pointer-typed stack item
- failed runtime validation: produce a safe fallback pointer or skip the operation, depending on the chosen trap model

This makes `intToPtr` the only place where raw integer addresses are checked.

## Automatic conversion

Requiring `intToPtr` everywhere may make normal low-level code noisy.

The compiler could insert the conversion automatically when a memory instruction receives an integer but expects a pointer type.

For example, user code:

```text
push addressValue
load
```

could be treated like:

```text
push addressValue
intToPtr int*
load
```

This keeps source code compact while preserving a single conceptual trust boundary.

The caveat is type inference. Automatic conversion is only straightforward when the expected pointer type is unambiguous.

Examples that are likely unambiguous:

- `load8u` expects a pointer with 1 readable byte
- `load16s` expects a pointer with 2 readable bytes
- `loadFloat` expects a `float*`-like pointer
- dereferencing a known pointer slot has pointer metadata

Examples that may be ambiguous:

- generic `load` only implies a 4-byte load, not necessarily whether the semantic pointee is `int`, `float`, or pointer
- `store` can be ambiguous because `int` values and pointer values are both represented as i32 at runtime
- pointer-slot mutation should probably require pointer-type compatibility, not just an integer-shaped value

For ambiguous cases, explicit `intToPtr` may still be required.

## Store semantics

If memory access becomes pointer-typed, `store` should probably be driven by the destination pointer type rather than only by the value type.

For example:

```text
push value
push int8Pointer
store
```

should store 1 byte because the destination is `int8*`.

Likewise:

- `int16*` stores 2 bytes
- `int*` stores 4 bytes
- `float*` stores 4 bytes as float
- `float64*` stores 8 bytes as float64
- `T**` stores a 4-byte pointer value

This would make destination type compatibility important. Storing an `int` into an `int*` is fine, but storing an `int` into an `int**` should probably require conversion to the compatible pointer type first.

## Relationship to pointer mutation guards

The current pointer-mutation guard idea protects this pattern:

```text
push &ptr
push foo
store
```

If `ptr` is a pointer slot and `foo` is an unproven integer, the compiler can guard `foo` before storing it.

With pointer-only memory access, that special case may no longer be needed. The language can instead require the stored value to already be pointer-typed:

```text
push &ptr
push foo
intToPtr int*
store
```

or, when unambiguous, the compiler could insert that conversion.

That keeps pointer-slot mutation consistent with the rest of memory access: raw integers must pass through the pointer-conversion boundary before they are trusted as pointers.

## Open questions

- Should `intToPtr` be required in source, inserted automatically, or both?
- What should runtime `intToPtr` do when validation fails?
- Should failed validation return zero, preserve the old pointer, skip the memory operation, or trap?
- How should generic `load` infer a semantic pointer type?
- Should `load` be split or typed so its expected pointer type is always clear?
- Should `store` always use the destination pointer type to choose the store opcode and width?
- How strict should pointer-type compatibility be for `T**` slots?
- Which arithmetic operations preserve pointer typing, if any?
- Should there be an explicit unsafe escape hatch for arbitrary memory access?

