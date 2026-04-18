# @8f4e/compiler-memory-layout

This package owns public memory layout generation from tokenizer ASTs.

It is responsible for:

- parsing public memory declarations
- resolving constants and public address references needed by declarations
- assigning public byte and word addresses
- returning module memory maps for tooling such as live memory inspection

It is not responsible for wasm code generation or compiler-generated hidden storage.
Hidden/internal allocations belong to `@8f4e/compiler` codegen and are appended outside
the public memory layout returned by this package.

Consumers that need public addresses should import this package directly instead of
reading memory-layout helpers through `@8f4e/compiler`.
