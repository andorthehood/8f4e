# TODO Index

This index is derived from the active files currently present in `docs/todos/`.

Active todo files: 67

## Active TODOs

### 🔴 High Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 257 | Fix collectConstants identifier RHS resolution | 🔴 | 2-4h | 2026-02-20 | collectConstants currently assumes every const RHS is a literal and force-casts arguments[1] to ArgumentLiteral. |
| 262 | Add float64 support for equal instruction | 🔴 | 1-3h | 2026-02-20 | equal is missing explicit float64 support in the compiler instruction path. |
| 263 | Add float64 support for lessThan instruction | 🔴 | 1-3h | 2026-02-20 | lessThan is missing explicit float64 support in the compiler instruction path. |
| 264 | Add float64 support for lessOrEqual instruction | 🔴 | 1-3h | 2026-02-20 | lessOrEqual is missing explicit float64 support in the compiler instruction path. |
| 265 | Add float64 support for greaterThan instruction | 🔴 | 1-3h | 2026-02-20 | greaterThan is missing explicit float64 support in the compiler instruction path. |
| 266 | Add float64 support for greaterOrEqual instruction | 🔴 | 1-3h | 2026-02-20 | greaterOrEqual is missing explicit float64 support in the compiler instruction path. |
| 267 | Add float64 support for greaterOrEqualUnsigned instruction | 🔴 | 1-3h | 2026-02-20 | greaterOrEqualUnsigned is missing explicit float64 support in the compiler instruction path. |
| 268 | Add float64 support for sqrt instruction | 🔴 | 1-3h | 2026-02-20 | sqrt is missing explicit float64 support in the compiler instruction path. |
| 269 | Add float64 support for round instruction | 🔴 | 1-3h | 2026-02-20 | round is missing explicit float64 support in the compiler instruction path. |
| 270 | Add float64 support for castToInt instruction | 🔴 | 1-3h | 2026-02-20 | castToInt is missing explicit float64 support in the compiler instruction path. |
| 271 | Add float64 support for loadFloat instruction | 🔴 | 1-3h | 2026-02-20 | loadFloat is missing explicit float64 support in the compiler instruction path. |
| 272 | Add float32/float64 width checks to localSet instruction | 🔴 | 1-3h | 2026-02-20 | localSet is missing explicit float64 support in the compiler instruction path. |
| 277 | Add storeBytes with explicit byte count argument | 🔴 | 4-8h | 2026-02-23 | 8f4e currently lacks a byte-oriented contiguous write instruction. |
| 278 | Add storeWords with explicit count and word size | 🔴 | 1-2d | 2026-02-23 | storeBytes <count> covers contiguous byte writes, but there is no equivalent explicit instruction for contiguous multi-byte word writes. |
| 279 | Extend push with compile-time string literals | 🔴 | 4-8h | 2026-02-23 | push currently accepts numeric literals and identifiers, but does not support string literals. This makes byte-sequence construction verbose because users must manually push each ASCII code. |
| 280 | Add reverse stack instruction with explicit item count | 🔴 | 4-8h | 2026-02-23 | 8f4e has dup, swap, drop, and clearStack, but no primitive to reverse a contiguous segment of the stack. This forces instruction authors and users to emulate reversal manually, which is verbose and error-prone for... |
| 301 | Refactor constant namespace collection and remove duplicated const parsing | 🔴 | 1-2d | 2026-03-14 | The compiler currently has two separate paths that parse and validate const declarations: |
| 305 | Reuse WASM instance across incremental compiles | 🔴 | 3-6h | 2026-03-14 | The compiler worker currently recreates the WebAssembly instance on every compile, even when memory can be reused and the runtime shape has not changed. |

### 🟡 Medium Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 048 | Add 2D Engine Visual Regression Tests | 🟡 | 6-8 hours | 2025-08-28 | The 2D engine package currently lacks visual regression testing, which means: |
| 052 | 052 - Simplify Cache Rendering Order | 🟡 | 2-3 days | 2025-09-03 | The 2D engine supports caching of complex draw blocks via cacheGroup. The current implementation in CachedRenderer preserves draw order across different textures (sprite sheet vs cached textures) using a “segment”... |
| 054 | Benchmark Unrolled vs Normal Loop in Audio Buffer Filler | 🟡 | 8-12 hours | 2025-09-07 | The audio buffer filler loop is currently implemented using an unrolled approach in packages/compiler/src/index.ts (line 275): |
| 055 | Implement strength reduction optimization techniques in compiler | 🟡 | 2-3 days | 2025-09-08 | The compiler currently performs no strength reduction optimizations, missing opportunities to replace expensive operations with cheaper equivalent operations. Common cases include: |
| 058 | Research C/C++ WebAssembly Runtimes on Linux with ALSA Audio Support | 🟡 | 4-6 days | 2025-09-11 | The 8f4e project requires a native C/C++ runtime for Linux systems with ALSA audio integration to complement the existing browser-based WebAssembly runtimes. Currently, the project only supports browser environments... |
| 062 | Editor Command Queue Refactor | 🟡 | 3-4 days | 2025-10-09 | The editor state currently stores host callbacks directly (state.callbacks). This makes the state non-serializable, complicates testing, and tightly couples effects to host-provided functions. The approach also obscures... |
| 064 | Research WebAssembly Runtimes for ARM Microcontroller Support | 🟡 | 3-5 days | 2025-09-10 | The 8f4e project currently supports browser-based WebAssembly runtimes (WebWorker and AudioWorklet) but lacks native runtimes for embedded ARM microcontrollers. To implement the planned microcontroller runtime and... |
| 094 | Handle Large Binary Assets with OPFS | 🟡 | 1-2d | 2025-11-17 | Binary asset imports in src/storage-callbacks.ts:158 always serialize the uploaded file into a base64 data URL via arrayBufferToDataUrl. That works for icons and other tiny blobs, but anything larger than ~1 MB explodes... |
| 146 | Investigate index arithmetic support | 🟡 | 2-4 hours | 2025-12-25 | 8f4e currently only supports byte-level arithmetic for memory addresses. This makes index-style arithmetic (like C pointer/index math) cumbersome, error-prone, and inconsistent with expectations when working with arrays... |
| 150 | Add Test Module Type | 🟡 | 2-4d | 2025-12-28 | The current 8f4e workflow only supports runtime modules intended for execution, not for structured testing. Validation is largely manual or relies on ad-hoc harnesses, which makes it harder to express expected behavior,... |
| 155 | Add Framebuffer Memory Accounting in glugglug | 🟡 | 2-4h | 2025-12-30 | glugglug allocates render-to-texture and cache framebuffers, but there is no structured accounting for their estimated memory impact. This makes it difficult to reason about GPU memory usage when cache sizes grow or... |
| 170 | Toggle post-process effects via function key | 🟡 | 1-2h | 2026-01-13 | Post-process effects can take over the entire editor surface. If a fragment shader goes wrong, it can make the editor unreadable. We need a fast toggle to disable effects without relying on shader edits. |
| 179 | Add glugglug shader error callback for editor logging | 🟡 | 2-4h | 2026-01-16 | Fragment shader compile failures in glugglug currently throw or log without a structured path back to the editor. When a post-process effect shader fails, the error is uncaught and the UI cannot surface a meaningful... |
| 210 | Add WebMCP-based MCP server integration to the 8f4e editor | 🟡 | 2-4d | 2026-02-07 | The editor currently has no built-in MCP server integration path for browser-hosted workflows. That limits direct tool interoperability from within the 8f4e editor experience and makes experimentation with MCP-based... |
| 211 | Add WASM memory to GLSL float uniform bindings via project config | 🟡 | 2-4d | 2026-02-08 | Post-process and background shader effects currently support engine-owned shared uniform buffers, but there is no declarative way to bind shader uniforms to values in WebAssembly memory through stack config. |
| 240 | Add row-align context-menu action with fixed spacing | 🟡 | 4-8h | 2026-02-18 | There is no quick layout action to arrange multiple related code blocks into a clean horizontal row while keeping their relative left-to-right order. |
| 254 | Fix max/min helpers for float64 memory | 🟡 | 2-4h | 2026-02-19 | float64, float64*, and float64** are being included in inter-module resolution paths, so ^module.memory and !module.memory can target float64-backed memory items. |
| 261 | Update instruction test helpers for float64 and refactor call test | 🟡 | 2-4h | 2026-02-20 | packages/compiler/tests/instructions/testUtils.ts currently reads/writes all non-integer memory as float32 in shared helpers like moduleTesterWithFunctions. |
| 274 | Consolidate defaultFeatureFlags into a single source of truth | 🟡 | 2-4h | 2026-02-21 | There are currently two defaultFeatureFlags definitions: |
| 281 | Add Plus/Minus Support to Constant Expressions | 🟡 | 4-8h | 2026-02-23 | Compile-time constant expressions currently support only CONST*number and CONST/number with a single operator. This blocks simple offset-style expressions like SIZE+1 or SIZE-1 in const, declarations, push, and init. |
| 291 | Add int64 support across compiler, runtime, and docs | 🟡 | 2-4d | 2026-03-09 | The language already has dedicated float64 support, including 64-bit memory allocation and type-aware compiler paths, but there is no equivalent int64 support. |
| 292 | Refactor error systems and document syntax vs compiler error boundaries | 🟡 | 1-2d | 2026-03-09 | The compiler currently has two different error systems: |
| 293 | Add separate color for non-decimal literal base prefixes | 🟡 | 4-8h | 2026-03-09 | The editor currently highlights non-decimal numeric literals such as binary and hexadecimal values as a single token. That means the base prefix and the digits share the same color: |
| 297 | Add url editor directive for clickable links | 🟡 | 4-8h | 2026-03-12 | The editor currently has no directive for attaching a clickable external link to a code block. |
| 302 | Add jump editor directive for code block navigation | 🟡 | 4-8h | 2026-03-14 | The editor currently supports code block navigation through the context-menu jump flow, but there is no in-code directive for linking one code block to another. |
| 303 | Dedupe font atlas rows for identical text colors | 🟡 | 1-2h | 2026-03-14 | The sprite generator currently renders one full ASCII font row for every text color role, even when multiple roles resolve to the same color value. |
| 306 | Refactor graphOptimizer to precompute module dependencies | 🟡 | 4-8h | 2026-03-14 | packages/compiler/src/graphOptimizer.ts currently recomputes module ids and intermodular dependencies inside sort comparators. |
| 307 | Optimize state-manager selector tokenization and subscription lookup | 🟡 | 3-6h | 2026-03-14 | The state manager currently does repeated string splitting and repeated path traversal during every set(...) call. |
| 308 | Simplify memory instruction default value resolution | 🟡 | 4-8h | 2026-03-14 | Memory instruction argument handling is now split between a syntax-phase classifier and a semantic-phase resolver, but the semantic side still carries a long branch ladder with repeated lookup logic and several no-op... |
| 309 | Extract shared module memory identifier parser | 🟡 | 2-4h | 2026-03-14 | The codebase currently parses `module.memory` identifiers in multiple places with slightly different local logic. |
| 310 | Simplify compiler project flattening and compilable block checks | 🟡 | 1-3h | 2026-03-14 | The editor compiler effect currently does more array work and duplicated block-type checks than necessary during project flattening and recompile triggering. |
### 🟢 Low Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 016 | Runtime Loading UI Improvements | 🟢 | 2-3 days | 2025-08-26 | After implementing lazy loading for runtimes (TODO: 015), users will experience a delay when switching between runtime types. Currently, there's no visual feedback during this loading process, which could lead to... |
| 057 | Research JavaScript/WebAssembly Runtimes for Step-by-Step Execution | 🟢 | 8-12 hours | 2025-09-09 | The 8f4e project currently uses WebAssembly for executing compiled code with basic debugging capabilities (debug instruction parser exists). To enhance the development experience and enable advanced debugging features,... |
| 203 | Use CodeBlock id instead of recomputing from code | 🟢 | 2-4 days | 2026-01-22 | The system frequently derives code block IDs by calling getCodeBlockId(code) during updates and rendering. This is redundant because CodeBlockGraphicData.id is intended to be the canonical ID. Recomputing on every... |
| 295 | Unify code render rows and width derivation | 🟢 | 2-4h | 2026-03-09 | The editor currently derives rendered code rows and code-block width through separate code paths: |
