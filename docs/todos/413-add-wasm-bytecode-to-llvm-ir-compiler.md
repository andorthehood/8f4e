---
title: 'TODO: Add WASM bytecode to LLVM IR compiler'
priority: Medium
effort: 3-5 days
created: 2026-05-24
issue: null
status: Open
completed: null
---

# TODO: Add WASM Bytecode to LLVM IR Compiler

## Problem Description

8f4e currently treats WebAssembly bytecode as the native compiler output. That is intentional: the live editor benefits from a simple, fast compiler path that can emit compact browser-ready bytecode without routing every edit through a larger native-code toolchain.

For non-browser embedding, especially when linking 8f4e programs into C/C++ firmware or host applications, WebAssembly bytecode is less convenient than object files or target-specific native code. A separate converter from 8f4e's supported WebAssembly subset to LLVM IR would let 8f4e keep WebAssembly as its primary output while enabling downstream native compilation through LLVM.

Current constraints that make this feasible:
- 8f4e supports a limited WebAssembly subset rather than arbitrary WebAssembly modules.
- Linear memory is fixed-size; there is no `memory.grow`.
- Tables and general indirect-call machinery are not supported.
- Target memory limits can be enforced by the converter or surrounding build tooling.

Impact:
- 8f4e programs could be linked into other programs as normal object files after LLVM lowers the generated IR.
- Embedded targets could reject programs that exceed target RAM/Flash limits instead of requiring a general WebAssembly runtime.
- The live editor compiler can stay focused on fast WebAssembly output.

## Proposed Solution

Add a standalone bytecode-to-LLVM IR compiler that consumes 8f4e-generated WebAssembly bytecode and emits LLVM IR for the supported subset.

High-level approach:
- Parse or reuse existing WebAssembly bytecode utilities for module/function/memory/export decoding.
- Lower 8f4e-compatible WebAssembly functions to LLVM functions.
- Represent fixed linear memory as an LLVM global byte array.
- Lower WebAssembly locals and operand-stack values into LLVM SSA values or temporary allocas.
- Emit plain C ABI-compatible function symbols so C/C++ programs can call exported 8f4e functions.
- Allow generated LLVM IR to call declared host shim functions for platform-specific IO.

Example pipeline:

```text
8f4e source
  -> 8f4e compiler
  -> WebAssembly bytecode
  -> 8f4e WASM-to-LLVM compiler
  -> LLVM IR
  -> llc/clang
  -> object file
  -> linked C/C++ program or firmware image
```

Alternative approaches considered:
- Emit LLVM IR directly from the main 8f4e compiler. This would make native targets first-class earlier, but it would also complicate the fast live-editor compilation path.
- Emit C from WebAssembly bytecode. This may be more portable across non-LLVM toolchains, but it gives up LLVM optimization and native backend integration.
- Use a WebAssembly runtime on each target. This preserves bytecode portability, but embedded targets may not want runtime size, startup, or memory overhead.

## Anti-Patterns

- Do not attempt to support arbitrary WebAssembly modules in the first version. This converter should target the 8f4e subset.
- Do not add LLVM as a required dependency for normal browser/editor compilation.
- Do not introduce `memory.grow`, tables, or runtime module machinery just to mirror full WebAssembly behavior.
- Do not assume all C compilers accept LLVM IR. The expected link path is LLVM IR to object file, then object-file linking with the host program.

## Implementation Plan

### Step 1: Define the 8f4e WebAssembly Subset Contract
- Document exactly which WebAssembly sections, value types, opcodes, imports, exports, and memory features the converter accepts.
- Decide how unsupported bytecode fails: diagnostic format, source/module context, and exit codes for CLI usage.
- Expected outcome: a small compatibility document and test fixture list.
- Dependencies: existing compiler bytecode output and wasm-utils package behavior.

### Step 2: Create a Package/CLI Boundary
- Add a dedicated package, likely under `packages/compiler/packages/wasm-to-llvm` or an equivalent compiler-adjacent location.
- Expose a library API for conversion and a CLI entry point for build scripts.
- Keep the package optional for editor builds so LLVM-related workflows do not slow or bloat the live path.
- Expected outcome: empty converter package with Nx build/test targets.
- Dependencies: workspace package conventions and Nx project setup.

### Step 3: Decode 8f4e WebAssembly Modules
- Reuse existing wasm-utils where possible to inspect module sections, function bodies, memory declarations, imports, and exports.
- Add focused parsing helpers only for bytecode structures needed by the supported subset.
- Expected outcome: converter can load fixtures and produce a typed module representation.
- Dependencies: Step 1 and Step 2.

### Step 4: Lower Core Instructions to LLVM IR
- Map WebAssembly numeric operations to LLVM integer/float operations with correct wrapping and comparison semantics.
- Map structured control flow to LLVM basic blocks.
- Map locals to LLVM values and model the WebAssembly operand stack during lowering.
- Expected outcome: simple arithmetic and branching functions compile to valid LLVM IR.
- Dependencies: Step 3.

### Step 5: Lower Fixed Linear Memory
- Emit fixed memory as an LLVM global byte array sized from the WebAssembly memory declaration or converter target config.
- Lower loads/stores with explicit little-endian semantics where required for cross-target correctness.
- Decide trap/checking policy for out-of-bounds access: checked mode, unchecked embedded mode, or target-configured mode.
- Expected outcome: memory read/write programs compile and pass native execution tests.
- Dependencies: Step 4.

### Step 6: Define the C ABI Surface
- Export selected 8f4e functions as plain C-callable symbols.
- Allow host imports to become LLVM `declare` statements with documented C signatures.
- Generate or document matching C headers for exported functions and host shims.
- Expected outcome: a C test program can link against converted 8f4e object code.
- Dependencies: Step 4 and Step 5.

### Step 7: Add Target Configuration
- Support target limits such as memory size, stack budget, pointer/address width assumptions, trap mode, and symbol prefixing.
- Reject configurations that cannot satisfy the module's fixed memory requirements.
- Include an AVR-oriented example path without making AVR the only supported target.
- Expected outcome: deterministic target-limit diagnostics and example build commands.
- Dependencies: Step 5 and Step 6.

### Step 8: Validate Through Native Toolchains
- Test LLVM IR with `llvm-as`, `opt`, `llc`, and/or `clang` where available.
- Add at least one host-native object-file linking test with a small C program.
- Add an embedded-target documentation example, such as `llc -march=avr` plus `avr-gcc` object linking, even if it is not run in CI initially.
- Expected outcome: tested round-trip from 8f4e bytecode to linked native executable/object.
- Dependencies: all previous steps.

## Validation Checkpoints

- `npx nx run <wasm-to-llvm-project>:test`
- `npx nx run <wasm-to-llvm-project>:build`
- `llvm-as generated.ll -o generated.bc`
- `llc -filetype=obj generated.bc -o generated.o`
- Link `generated.o` with a small C harness that calls an exported 8f4e function.
- Confirm normal `npx nx run app:build` does not require LLVM tools.

## Success Criteria

- [ ] 8f4e-generated WebAssembly bytecode can be converted to valid LLVM IR for the documented subset.
- [ ] Fixed linear memory is represented without requiring a WebAssembly runtime.
- [ ] Exported 8f4e functions are callable from C via stable C ABI declarations.
- [ ] Host shim imports can be declared in LLVM IR and implemented by C code.
- [ ] Target memory limits are enforced before object generation.
- [ ] The live editor/compiler path continues to emit WebAssembly directly and does not require LLVM.
- [ ] Documentation includes example commands for object generation and C linking.

## Affected Components

- `packages/compiler/` - Provides the WebAssembly bytecode produced by the native compiler path.
- `packages/compiler/packages/wasm-utils/` - Likely source of reusable WebAssembly decoding helpers.
- Future `packages/compiler/packages/wasm-to-llvm/` - New converter package and CLI.
- `docs/` - Needs architecture and linking documentation once implemented.
- Native/embedded build tooling - May consume generated LLVM IR or object files.

## Risks & Considerations

- **LLVM toolchain availability**: Not all target C toolchains consume LLVM IR directly. Mitigate by documenting the object-file linking path.
- **Backend maturity**: LLVM target quality varies, especially for smaller embedded architectures. Keep generated IR conservative and test target examples separately.
- **C ABI mismatch**: Exported symbol names and integer widths must be stable. Mitigate with generated or documented headers.
- **Trap semantics**: WebAssembly traps do not map naturally to all embedded targets. Make trap behavior explicit in target configuration.
- **Optimization expectations**: Lowering from bytecode loses some high-level source intent. Accept this tradeoff to preserve the simple, fast WebAssembly-first compiler.
- **Breaking Changes**: None expected for existing browser/editor users if the converter remains optional.

## Related Items

- **Related**: [TODO 064: Research WebAssembly Runtimes for ARM Microcontroller Support](064-webassembly-runtimes-arm-microcontroller-research.md)
- **Related**: [TODO 058: Research C/C++ WebAssembly Runtimes on Linux with ALSA Audio Support](058-cpp-webassembly-runtimes-linux-alsa-research.md)
- **Related**: [TODO 395: Add exported 8f4e functions](archived/395-add-exported-8f4e-functions.md)
- **Blocks**: Native object-file linking workflows for 8f4e programs.

## References

- [LLVM Language Reference Manual](https://llvm.org/docs/LangRef.html)
- [LLVM AVR Backend](https://llvm.org/docs/AVRUsage.html)
- [WebAssembly Core Specification](https://webassembly.github.io/spec/core/)

## Notes

- Keep WebAssembly as 8f4e's native output. The converter exists for deployment/linking workflows, not for the live editor's hot path.
- Prefer a small, explicit subset and good diagnostics over partial support for arbitrary WebAssembly.
- A later C backend may still be useful for non-LLVM embedded toolchains.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `docs/todos/archived/` folder.
3. Update `docs/todos/_index.md` to move the entry to "Completed TODOs" with the completion date.
