# @8f4e/compiler

Core compiler that transforms 8f4e source into WebAssembly plus runtime metadata. It exposes the main compiler API along with a `syntax` export used by editor tooling.

## Responsibilities

- Parse and validate 8f4e source.
- Compile instructions into WebAssembly modules.
- Provide syntax helpers for highlighting and tooling.
