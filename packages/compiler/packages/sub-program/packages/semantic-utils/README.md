# @8f4e/semantic-utils

Target-independent semantic helpers shared by the compiler pipeline and code generation packages.

This package owns reusable semantic context construction, memory-plan lookup helpers, and small stack/block utilities that are not specific to a bytecode target or a single compiler pass.

It should not emit WebAssembly bytes, allocate target-specific function indexes beyond language-level metadata, or materialize WASM sections.
