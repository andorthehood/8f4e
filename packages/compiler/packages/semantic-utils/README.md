# @8f4e/semantic-utils

Target-independent semantic helpers shared by the compiler pipeline and code generation packages.

This package owns reusable semantic context construction, value-argument normalization, semantic line application, memory-plan lookup helpers, and small stack/block utilities that are not specific to a bytecode target.

It should not emit WebAssembly bytes, allocate target-specific function indexes beyond language-level metadata, or materialize WASM sections.
