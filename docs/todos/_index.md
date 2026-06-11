# TODO Index

This index is derived from the active files currently present in `docs/todos/`.

Active todo files are listed below.

## Active TODOs

### 🔴 High Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 269 | Add float64 support for round instruction | 🔴 | 1-3h | 2026-02-20 | `round` is missing explicit float64 support in the compiler instruction path. |
| 270 | Add float64 support for castToInt instruction | 🔴 | 1-3h | 2026-02-20 | `castToInt` is missing explicit float64 support in the compiler instruction path. |
| 271 | Add float64 support for loadFloat instruction | 🔴 | 1-3h | 2026-02-20 | `loadFloat` is missing explicit float64 support in the compiler instruction path. |
| 272 | Add float32/float64 width checks to localSet instruction | 🔴 | 1-3h | 2026-02-20 | `localSet` is missing explicit float64 support in the compiler instruction path. |
| 278 | Add storeWords with explicit count and word size | 🔴 | 1-2d | 2026-02-23 | `storeBytes <count>` covers contiguous byte writes, but there is no equivalent explicit instruction for contiguous multi-byte word writes. |
| 280 | Add reverse stack instruction with explicit item count | 🔴 | 4-8h | 2026-02-23 | 8f4e has `drop` and `clearStack`, but no primitive to reverse a contiguous segment of the stack. This forces instruction authors and users to emulate reversal manually, which is... |
| 305 | Reuse WASM instance across incremental compiles | 🔴 | 3-6h | 2026-03-14 | The compiler worker currently recreates the WebAssembly instance on every compile, even when memory can be reused and the runtime shape has not changed. |

### 🟡 Medium Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 048 | Add 2D Engine Visual Regression Tests | 🟡 | 6-8 hours | 2025-08-28 | The 2D engine package currently lacks visual regression testing, which means: |
| 052 | Simplify Cache Rendering Order | 🟡 | 2–3 days | 2025-09-03 | The 2D engine supports caching of complex draw blocks via `cacheGroup`. The current implementation in `CachedRenderer` preserves draw order across different textures (sprite she... |
| 054 | Benchmark Unrolled vs Normal Loop in Audio Buffer Filler | 🟡 | 8-12 hours | 2025-09-07 | The audio buffer filler loop is currently implemented using an unrolled approach in `packages/compiler/src/index.ts` (line 275): |
| 058 | Research C/C++ WebAssembly Runtimes on Linux with ALSA Audio Support | 🟡 | 4-6 days | 2025-09-11 | The 8f4e project requires a native C/C++ runtime for Linux systems with ALSA audio integration to complement the existing browser-based WebAssembly runtimes. Currently, the proj... |
| 062 | Editor Command Queue Refactor | 🟡 | 3-4 days | 2025-10-09 | The editor state currently stores host callbacks directly (`state.callbacks`). This makes the state non-serializable, complicates testing, and tightly couples effects to host-pr... |
| 064 | Research WebAssembly Runtimes for ARM Microcontroller Support | 🟡 | 3-5 days | 2025-09-10 | The 8f4e project currently supports browser-based WebAssembly runtimes (WebWorker and AudioWorklet) but lacks native runtimes for embedded ARM microcontrollers. To implement the... |
| 155 | Add Framebuffer Memory Accounting in glugglug | 🟡 | 2-4h | 2025-12-30 | glugglug allocates render-to-texture and cache framebuffers, but there is no structured accounting for their estimated memory impact. This makes it difficult to reason about GPU... |
| 170 | Toggle post-process effects via function key | 🟡 | 1-2h | 2026-01-13 | Post-process effects can take over the entire editor surface. If a fragment shader goes wrong, it can make the editor unreadable. We need a fast toggle to disable effects withou... |
| 179 | Add glugglug shader error callback for editor logging | 🟡 | 2-4h | 2026-01-16 | Fragment shader compile failures in glugglug currently throw or log without a structured path back to the editor. |
| 211 | Add WASM memory to GLSL float uniform bindings via project config | 🟡 | 2-4d | 2026-02-08 | Post-process and background shader effects currently support engine-owned shared uniform buffers, but there is no declarative way to bind shader uniforms to values in WebAssembl... |
| 240 | Add row-align context-menu action with fixed spacing | 🟡 | 4-8h | 2026-02-18 | There is no quick layout action to arrange multiple related code blocks into a clean horizontal row while keeping their relative left-to-right order. |
| 261 | Update instruction test helpers for float64 and refactor call test | 🟡 | 2-4h | 2026-02-20 | `packages/compiler/tests/instructions/testUtils.ts` currently reads/writes all non-integer memory as float32 in shared helpers like `moduleTesterWithFunctions`. |
| 274 | Consolidate defaultFeatureFlags into a single source of truth | 🟡 | 2-4h | 2026-02-21 | There are currently two `defaultFeatureFlags` definitions: |
| 291 | Add int64 support across compiler, runtime, and docs | 🟡 | 2-4d | 2026-03-09 | The language already has dedicated `float64` support, including 64-bit memory allocation and type-aware compiler paths, but there is no equivalent `int64` support. |
| 297 | Add url editor directive for clickable links | 🟡 | 4-8h | 2026-03-12 | The editor currently has no directive for attaching a clickable external link to a code block. |
| 302 | Add jump editor directive for code block navigation | 🟡 | 4-8h | 2026-03-14 | The editor currently supports code block navigation through the context-menu jump flow, but there is no in-code directive for linking one code block to another. |
| 307 | Optimize state-manager selector tokenization and subscription lookup | 🟡 | 3-6h | 2026-03-14 | The state manager currently does repeated string splitting and repeated path traversal during every `set(...)` call. |
| 315 | Optimize global editor directive recomputation | 🟡 | 3-6h | 2026-03-16 | The global editor directives effect currently rescans every code block whenever: |
| 320 | Add `&*name` pointee start address prefix for pointers | 🟡 | 2-4h | 2026-03-26 | 8f4e already supports `&name` to push the start byte address of a memory item and `*name` to dereference a pointer. However, there is no compile-time identifier form for "start... |
| 321 | Add `*name&` pointee end address suffix for pointers | 🟡 | 2-4h | 2026-03-26 | 8f4e supports `name&` to push the start byte address of the last word-aligned chunk covering a memory item. That gives users an address-oriented way to reference the end of an a... |
| 376 | Add ASCII scene renderer for editor snapshot tests | 🟡 | 1-2d | 2026-04-08 | The editor currently has strong unit coverage for directive parsing, layout derivation, and individual widget geometry, but it does not have a cheap whole-scene regression layer... |
| 377 | Batch-parse modules and validate shared ids | 🟡 | 4-8h | 2026-04-08 | The compiler currently parses each module independently by mapping `compileToAST(...)` over the module list in `packages/compiler/src/index.ts`. |
| 378 | Make parser stateful for block pairing and owning block context | 🟡 | 4-8h | 2026-04-08 | The tokenizer/parser already owns some cross-line structural syntax concerns such as `if` pairing and block-closure validation, but that statefulness is still too narrow in two... |
| 380 | Remove hardcoded AudioWorklet buffer size from runtime contract | 🟡 | 1-2 days | 2026-04-21 | The AudioWorklet runtime currently injects `const AUDIO_BUFFER_SIZE 128` as an auto-managed environment constant in `packages/runtime-audio-worklet/src/runtimeDirectives.ts`. |
| 381 | Add #follow module layout directive | 🟡 | 1-2 days | 2026-04-21 | The compiler currently assigns module memory layout from a dependency-aware but otherwise loose ordering model: |
| 383 | Extend CLI run with tracing and derived debug signals | 🟡 | 1-2d | 2026-04-23 | The new `cli run` command is already useful for inspecting final state after a fixed |
| 384 | Add compiler algorithmic regression metrics | 🟡 | 1-2 days | 2026-04-28 | The compiler has snapshot coverage for many structural outputs, but there is no release-level signal for algorithmic regressions. |
| 385 | Guard i32.div_s signed overflow | 🟡 | 2-4h | 2026-04-30 | The `div` instruction emits WebAssembly `i32.div_s` for integer operands. The compiler already rejects division when the divisor is not known to be non-zero, which prevents the... |
| 386 | Guard i32.rem_s divisor zero | 🟡 | 2-4h | 2026-04-30 | The `remainder` instruction emits WebAssembly `i32.rem_s` for integer operands. WebAssembly has no non-trapping variant for integer remainder. The raw opcode traps when the divi... |
| 390 | Add compiler passive data inputs for array initialization | 🟡 | 1-2d | 2026-05-04 | The compiler now uses passive data segments to restore declared initial memory, but every segment is still derived from source-level memory declarations and compiler-owned inter... |
| 398 | Add compiler peephole arithmetic strength reduction | 🟡 | 1-2 days | 2026-05-12 | The compiler now has compile-time folding and stack-level integer metadata, but runtime arithmetic codegen still emits direct WebAssembly arithmetic operations even when the top... |
| 400 | Add serial input editor environment plugin | 🟡 | 1-2d | 2026-05-13 | Add a Web Serial editor environment plugin with `@info serial`, fixed-size `@serialIn` framing, and `@serialInCallback` fanout to exported 8f4e functions. |
| 401 | Tighten runtime browser API typing | 🟡 | 2-4h | 2026-05-18 | Browser runtime packages cross platform-specific API boundaries and currently rely on broad `any` casts and `@ts-expect-error` comments in production runtime code. |
| 406 | Review repeated compiler namespace prepass work | 🟡 | 1-2d | 2026-05-19 | Namespace discovery, layout, scalar default handling, and module compilation currently rerun semantic prepass work that may be reusable or collapsible. |
| 407 | Optimize normalizeArgumentsAtIndexes | 🟡 | 1-3h | 2026-05-19 | `normalizeArgumentsAtIndexes` maps every argument and checks `indexes.includes(index)`, which can add avoidable work for large memory declarations. |
| 408 | Reduce tokenizer identifier classification work | 🟡 | 1-2d | 2026-05-19 | `classifyIdentifier` runs many ordered reference-shape checks for every identifier; cheap prefix/suffix dispatch could avoid most checks for plain identifiers. |
| 424 | Rename layout word fields to allocation-unit terminology | 🟡 | 4-8h | 2026-05-26 | Separate typed word-size metadata from compiler allocation-grid layout by renaming the 4-byte layout constant and word-aligned fields to allocation-unit terminology. |
| 425 | Split StackItem into value and address variants | 🟡 | 1-2d | 2026-05-26 | Replace the broad optional-field `StackItem` shape with a discriminated `value | address` union so memory codegen can use narrowed address metadata without optional-chain fallbacks. |
| 426 | Decide compiler broad type splitting strategy | 🟡 | 2-4h | 2026-05-26 | Decide migration boundaries for broad compiler-spec shapes such as `DataStructure`, `LocalBinding`, `CompilationContext`, `MapBlockState`, `CollectedNamespace`, and address-bearing constants before implementing more type splits. |
| 427 | Add depth-aware pointer metadata query dereferencing | 🟡 | 2-4h | 2026-05-27 | `sizeof(**ptr)` and `max(**ptr)` should carry explicit dereference depth and resolve against double-pointer metadata instead of targeting a literal `*ptr` identifier. |
| 429 | Unify metadata query argument shape | 🟡 | 2-4h | 2026-05-27 | Replace per-helper metadata query reference kinds with one structured query shape carrying query kind, target scope, and dereference depth. |
| 430 | Nest pointer metadata shape | 🟡 | 4-8h | 2026-05-27 | Move scattered pointer fields into a shared nested pointer metadata shape used consistently by memory, locals, and stack address metadata. |
| 431 | Separate pointer type and provenance facts | 🟡 | 2-4h | 2026-05-27 | Model declared pointer type facts separately from value provenance facts so helpers like `count(*ptr)` only use explicit count provenance. |
| 432 | Centralize compile-time metadata query resolution | 🟡 | 2-4h | 2026-05-27 | Split metadata query resolution into target lookup and query evaluation so local, intermodule, and pointer helpers share one resolver path. |
| 434 | Show const values in declaration tooltips | 🟡 | 2-4h | 2026-05-28 | Selected-line tooltips should show resolved value and type rows for highlighted `const` declaration lines when compiler metadata is available. |
| 435 | Add polymorphic function overloads | 🟡 | 1-2d | 2026-05-29 | Allow global functions to share a source name when their exact parameter signatures differ, using signature-derived ids and stack-based call resolution. |
| 446 | Store project block type during project parse | 🟡 | 2-4h | 2026-06-01 | Carry parser-known project block type metadata forward so compiler block picking does not rescan raw block source. |
| 448 | Move prototype content validation to parser | 🟡 | 4-8h | 2026-06-01 | Move executable-line rejection for prototypes from compiler-side `parsePrototypeAST()` into parser-owned block validation. |
| 449 | Add function paramShape instruction | 🟡 | 1-2d | 2026-06-08 | Let functions import a prototype-shaped pointer parameter list with `paramShape`, keeping prototypes memory-shape-only and behavior in normal functions. |
| 450 | Generalize instruction placement config | 🟡 | 4-8h | 2026-06-08 | Make instruction placement metadata generic enough to express shared source-placement checks, starting with named prologue rules for directives and function parameters. |
| 451 | Add pushShape instruction | 🟡 | 4-8h | 2026-06-08 | Add `pushShape <prototypeId>` so shaped modules can push effective memory addresses in prototype order and feed functions that use `paramShape`. |
| 452 | Add Reachability-Based Function Pruning | 🟡 | 1-2d | 2026-06-10 | Replace conservative function pruning with a reachability pass so functions only called by uncalled functions are also omitted. |
| 453 | Add indirect calls and function reference type | 🟡 | 2-4d | 2026-06-11 | Add typed function references backed by WebAssembly table indices so 8f4e can store, load, and call runtime-selected functions through `call_indirect`. |

### 🟢 Low Priority

| ID | Title | Priority | Effort | Created | Summary |
| ---- | ----- | -------- | ------ | ------- | ------- |
| 016 | Runtime Loading UI Improvements | 🟢 | 2-3 days | 2025-08-26 | After implementing lazy loading for runtimes (TODO: 015), users will experience a delay when switching between runtime types. Currently, there's no visual feedback during this l... |
| 057 | Research JavaScript/WebAssembly Runtimes for Step-by-Step Execution | 🟢 | 8-12 hours | 2025-09-09 | The 8f4e project currently uses WebAssembly for executing compiled code with basic debugging capabilities (debug instruction parser exists). To enhance the development experienc... |
| 203 | Use CodeBlock name instead of recomputing from code | 🟢 | 2-4 days | 2026-01-22 | The system frequently derives source-level block names by calling `getCodeBlockNameFromSource(code)` during updates and rendering. This is redundant because `CodeBlockGraphicData.name` is intended to... |
| 295 | Unify code render rows and width derivation | 🟢 | 2-4h | 2026-03-09 | The editor currently derives rendered code rows and code-block width through separate code paths: |
| 364 | Centralize alwaysOnTop code block partition logic | 🟢 | 1-2 hours | 2026-04-03 | The `@alwaysOnTop` behavior is implemented through repeated ad hoc array partitioning of `graphicHelper.codeBlocks`. The same "normal blocks first, always-on-top blocks last" ru... |
| 388 | Add PixelCode font to sprite-generator | 🟢 | 4-8h | 2026-05-02 | The editor sprite-generator has several bundled bitmap fonts, but it does not include PixelCode/Pixel Code. PixelCode is an upstream pixel font aimed at programming, which makes... |
| 389 | Add EagleSpCGA Alt3 8x8 font to sprite-generator | 🟢 | 4-8h | 2026-05-04 | The editor sprite-generator has several bundled bitmap fonts, including a few compact 8-pixel-high options, but it does not include EagleSpCGA Alt3 8x8. That leaves the editor w... |

## Completed TODOs

| ID | Title | Completed | Notes |
| ---- | ----- | --------- | ----- |
| 441 | Migrate binary asset directives to config | 2026-06-04 | Binary asset loading now uses schema-backed `@config bin...` entries; old `@defAsset` / `@loadAsset` parsing and compatibility names were removed. |
| 440 | Migrate keyboard memory directives to config | 2026-06-04 | Keyboard memory targets now use schema-backed `@config keyboard...` entries, and the keyboard plugin activates from config paths instead of custom directives. |
| 439 | Migrate @midiIn to config directive | 2026-06-04 | MIDI input bindings now use schema-backed `@config midi.inputs...` entries, with no live `@midiIn` support remaining. |
| 447 | Remove duplicated constants block validation | 2026-06-01 | `parseConstantsAST()` now only asserts block type; invalid constants-block contents are rejected by the shared instruction-spec validation path during namespace collection. |
| 444 | Use parser-collected shape lines for prototype expansion | 2026-06-01 | Module ASTs now carry parser-collected `shapeLines`, and prototype expansion uses those parsed lines instead of rescanning/reparsing shaped module source. |
| 438 | Add generic function imports | 2026-05-29 | `#import <field-name>` now declares host-provided functions, imported functions participate in normal `call` resolution and stack typing, WebAssembly import/function indexes are emitted correctly, and invalid import shapes have compiler coverage. |
| 437 | Add execution entries | 2026-05-29 | `entry` / `entryEnd` now partitions modules into exported execution entries, `initDefaults` only initializes memory defaults, old test/init-only grouping was removed, and examples/runtime/CLI paths use the new entry exports. |
| 150 | Add Test Module Type | 2026-05-29 | Completed by the `entry test` CLI test runner flow and superseded by execution entries plus generic function imports. |
| 433 | Add dash argument continuation lines | 2026-05-28 | Parser now folds `- <arg>` continuation lines into the previous source instruction before validation; docs and tokenizer coverage describe valid and invalid forms. |
| 428 | Add pointer-aware count and min metadata queries | 2026-05-27 | `min(*ptr)` and `count(*ptr)` now classify explicitly and resolve from pointer metadata; pointer count uses tracked memory-start pointee element counts when available and falls back to `1`. |
| 323 | Add `min(*name)` pointee min value prefix for pointers | 2026-05-27 | Completed as part of pointer-aware metadata query work; `min(*name)` now has parser, semantic, helper, docs, and public compiler coverage. |
| 423 | Narrow AST line metadata interfaces | 2026-05-26 | `ASTLineBase` now only carries core line identity; memory, semantic, directive, and block metadata live on concrete line interfaces, and snapshots were updated to show the narrower public AST shape. |
| 410 | Consolidate release action commits | 2026-05-19 | Release workflow now uses the two-commit fallback: Nx keeps the version commit, and bundle-size, bytecode-size, compiler-coverage, and docs-coverage logs are committed together as release metrics before the atomic tag push. |
| 409 | Track block context flags during stack analysis | 2026-05-19 | Stack analysis now carries cached block-context flags, `validateInstruction` reads them directly, and shared block-stack helpers maintain the flags with focused test coverage. |
| 405 | Avoid AST cache hashing when no cache entry exists | 2026-05-19 | Tokenizer AST cache lookup now skips `hashSource(...)` on initial misses and obvious line-count misses while preserving hash validation for existing same-line-count entries. |
| 421 | Clean up AST construction helper scans | 2026-05-26 | Tokenizer AST construction now accumulates module/function/constants metadata through source-block-specific builders during parsing; generic post-processing scans over `CompilerASTLine[]` were removed. |
| 422 | Split namespace discovery and layout prepass | 2026-05-26 | Namespace discovery now uses an explicit internal discovery path, final layout/default resolution uses `layoutNamespace(...)`, and the old mode flag/prepass naming was removed without typed-AST compatibility wrappers. |
| 419 | Merge instruction source argument specs into instruction specs | 2026-05-26 | Source argument arity and shape metadata now lives in compiler-spec instruction specs; tokenizer validation consumes the shared contract, and duplicated argument/no-argument tables were removed without compatibility shims. |
| 420 | Add typed compiler AST entry indexes | 2026-05-26 | Compiler-owned AST inputs now use typed module/function/constants entry objects with required ids and derived metadata, so compiler passes no longer rediscover those facts from raw line arrays. |
| 417 | Tighten compiler AST union and source block types | 2026-05-25 | Compiler AST lines are now a discriminated union with source-block tuple types; tokenizer validation owns fixed arity, and namespace metadata no longer revalidates syntax-guaranteed prologue or return shapes. |
| 416 | Add resolved identifier line forms | 2026-05-25 | Semantic normalization now carries resolved memory, local, pointer, function, and local-set targets through stack analysis and codegen; old push-target rediscovery was removed. |
| 415 | Discriminate compiler block stack frames | 2026-05-25 | Block stack frames are now a discriminated union; map frames require `mapState`, loop frames require counter metadata, and codegen consumers no longer use the old block-frame non-null assertions. |
| 418 | Replace serialized function type registry keys | 2026-05-25 | Function type registry signatures are now typed records with structural equality through a registry helper; serialized JSON keys and `signatureMap` were removed without compatibility shims. |
| 414 | Split compiler context phase types | 2026-05-25 | Namespace prepass, module compilation, and function compilation now use phase-specific context types; function codegen receives required signature/type-registry state and module layout fallbacks were removed. |
| 413 | Split compiled function lifecycle types | 2026-05-25 | Pre-codegen function metadata is now separate from final compiled function output; final functions require `wasmIndex`, `typeIndex`, and `ast`, removing lifecycle-field non-null assertions from compiler assembly. |
| 411 | Move compiler analysis metadata into instruction specs | 2026-05-25 | Generic fixed stack effects, block-close behavior, and memory operation metadata now live in `instructionSpecs.ts`; stack analysis and memory codegen consume the metadata while dynamic function, map, and arithmetic metadata algorithms stay explicit. |
| 412 | Expose compiler stack analysis results | 2026-05-21 | `includeStackAnalysis` now returns compact per-line stack analysis for compiled modules and functions, independently from AST output. |
| 397 | Finish compiler stack analysis/codegen separation | 2026-05-20 | Stack analysis now produces analyzed lines for codegen, and instruction emitters consume analysis results instead of mutating validation stack state directly. |
| 399 | Consolidate instruction compiler utilities | 2026-05-12 | Instruction-compiler-only helpers moved under `packages/compiler/src/instructionCompilers/utils/`; `saveByteCode` split out, unused word-alignment helper removed, and numeric binary instruction codegen centralized. |
| 055 | Implement strength reduction optimization techniques in compiler | 2026-05-12 | Archived original TODO; remaining bytecode peephole optimization work is tracked in `398`. |
| 392 | Move shared compiler constants to compiler-spec | 2026-05-11 | Shared memory layout, integer range, logic level, memory access-width, and Wasm page constants now resolve from `@8f4e/compiler-spec`; compiler-only bytecode header/export-count constants remain private. |
| 394 | Extract compiler stack analysis into a separate pass | 2026-05-08 | `withValidation` was removed, stack validation helpers moved under `packages/compiler/src/stackAnalysis/`, and compiler instruction contracts were centralized in `instructionSpecs.ts`; remaining codegen separation is tracked in `397`. |
| 381 | Review compiler compileSegment usage for unnecessary self-compilation | 2026-05-08 | Archived after verification: no current compiler `compileSegment(...)` call sites remain under `packages/compiler/src`; removal landed in `e73dd2486`. |
| 387 | Add lazy editor environment plugins | 2026-05-01 | Directive-triggered lazy editor environment plugins now load keyboard memory and binary asset integrations only when matching directives are present. |
| 262 | Add float64 support for equal instruction | 2026-05-10 | `equal` now emits `F64_EQ` for float64 operands and has unit/public regression coverage. |
| 263 | Add float64 support for lessThan instruction | 2026-05-10 | `lessThan` now emits `F64_LT` for float64 operands and has unit/public regression coverage. |
| 264 | Add float64 support for lessOrEqual instruction | 2026-05-10 | `lessOrEqual` now emits `F64_LE` for float64 operands and has unit/public regression coverage. |
| 265 | Add float64 support for greaterThan instruction | 2026-05-10 | `greaterThan` now emits `F64_GT` for float64 operands and has unit/public regression coverage. |
| 266 | Add float64 support for greaterOrEqual instruction | 2026-05-10 | `greaterOrEqual` now emits `F64_GE` for float64 operands and has unit/public regression coverage. |
| 267 | Add float64 support for greaterOrEqualUnsigned instruction | 2026-05-10 | `greaterOrEqualUnsigned` now emits `F64_GE` for float64 operands and has unit/public regression coverage. |
| 268 | Add float64 support for sqrt instruction | 2026-05-10 | `sqrt` now emits `F64_SQRT`, preserves float64 metadata, and no longer marks the result as always non-zero. |
| 395 | Add exported 8f4e functions | 2026-05-10 | `#export <exportedName>` now exports user functions through the generated WebAssembly ABI with positional JS numeric arguments and duplicate-name validation. |
| 396 | Add MIDI input editor environment plugin | 2026-05-11 | The editor MIDI plugin now lazy-loads from `@midiIn`, lists devices via `@info midi`, and forwards MIDI input bytes to exported 8f4e callbacks through a shared-memory Wasm instance. |
| 402 | Restrict compiler directives to block prologue | 2026-05-19 | Compiler directives are now validated as module/function prologue metadata, with late directives rejected by a dedicated compiler diagnostic. |
| 404 | Refactor address metadata into first-class shape | 2026-05-19 | Address metadata now lives under `StackItem.address` / normalized literal `address`, replacing scattered safe/clamp/access-width fields. |
| 403 | Add logical memory regions for multi-memory | 2026-05-19 | `#region` and `memoryRegions` now allocate module declarations into logical Wasm memories, preserve address/pointer provenance through memory operations, and plumb extra memories through compiler-worker, runtimes, and CLI. |
| 391 | Add compiler AST cache for incremental compiles | 2026-05-04 | `compile()` now returns and accepts an opaque AST cache for unchanged expanded module and function inputs. |
| 329 | Replace literal-only const collection with semantic namespace prepass | 2026-03-27 | Replaced `collectConstants(ast)` bootstrap with semantic namespace prepass. |
| 330 | Centralize compile-time folding as an AST normalization pass | 2026-03-27 | Compile-time folding now runs as a semantic normalization pass before codegen. |
| 331 | Delete duplicate downstream compile-time resolution paths | 2026-03-27 | Removed duplicate downstream compile-time resolution, including old `push` metadata fallbacks. |
| 370 | Move if result type to ifEnd and drop explicit void | 2026-04-08 | `if`/`ifEnd` pairing now happens in the tokenizer/parser, with source-faithful AST metadata and no compiler-side rewrite pass. |
| 332 | Extract syntax and AST parsing into a separate compiler package | 2026-03-27 | `source -> AST` now lives in `packages/tokenizer`. |
| 334 | Move locals out of namespace and into codegen state | 2026-03-27 | Locals now live in `CompilationContext.locals` instead of `namespace.locals`. |
| 340 | Move compiler-generated hidden resources into a separate internal address space | 2026-03-27 | Hidden resources now allocate separately from user/module memory and no longer affect module layout. |
| 319 | Add `sizeof(*name)` pointee element word size prefix for pointers | 2026-03-30 | Pointer metadata now supports `sizeof(*name)` for pointee element word size. |
| 322 | Add `^*name` pointee max value prefix for pointers | 2026-03-30 | Pointer metadata now supports `^*name` for pointee max value. |
| 324 | Add `int16*` pointer types to compiler and runtime | 2026-03-30 | Compiler, runtime metadata, and docs now support `int16*` pointer types. |
| 325 | Add literal-only `*` and `/` folding at argument parse time | 2026-03-30 | Tokenizer now folds literal-only mul/div expressions to literals during argument parsing, with parser and compiler integration coverage. |
| 326 | Unify remaining editor/runtime memory ids to `module:memory` syntax | 2026-03-30 | Editor/runtime cross-module memory-id plumbing now consistently uses `module:memory`; compiler metadata-operator dot syntax remains intentionally separate. |
| 343 | Move arity and raw argument-shape validation into tokenizer | 2026-03-28 | Tokenizer now owns the syntax-only arity and raw argument-shape validation surface. |
| 344 | Move identifier existence validation into semantic pass and shrink codegen validation | 2026-03-29 | Identifier existence validation now lives in semantic normalization/prepass instead of being rediscovered in codegen. |
| 345 | Tighten tokenizer-to-compiler contract with typed AST lines | 2026-03-29 | Parsed and normalized AST stages now have stronger typed contracts across tokenizer, semantics, and compiler consumers. |
| 346 | Split semantic normalization into instruction-specific files | 2026-03-28 | normalization/ folder with per-instruction files; normalizeCompileTimeArguments.ts is now a thin dispatcher wrapper. |
| 347 | Move function name collection and call target validation into semantic prepass | 2026-03-29 | Function IDs now collected via `collectFunctionIdsFromAsts()` before codegen; `call` target existence validated in `normalizeCall` before codegen. |
| 348 | Add viewport-anchored code block directive | 2026-03-30 | Archived by user request. |
| 349 | Add always-on-top editor directive for code blocks | 2026-03-30 | Archived by user request. |
| 308 | Simplify memory instruction default value resolution | 2026-03-31 | `memoryInstructionParser.ts` now centralizes split-byte and default-value resolution into smaller semantic helpers. |
| 350 | Remove intermodule default placeholder handling from memory parser | 2026-03-31 | Removed the fake `0` intermodule-default path from `memoryInstructionParser.ts`; deferred state is now owned earlier in semantic normalization. |
| 351 | Update editor intermodule reference renaming for current syntax | 2026-03-31 | Editor paste/rename flows now rewrite the current `module:`-based intermodule syntax and function-style queries instead of obsolete dotted/operator forms. |
| 352 | Unify semantic const collection and namespace import rules | 2026-03-31 | Module compilation now reapplies semantic lines directly instead of seeding const/import state from copied prepass snapshots. |
| 306 | Refactor graphOptimizer to precompute module dependencies | 2026-03-31 | `graphOptimizer.ts` now precomputes per-module metadata and shared intermodule dependency extraction before deterministic ordering. |
| 336 | Move identifier reference classification into tokenizer | 2026-03-30 | Identifier-shaped argument classification now lives in tokenizer metadata instead of compiler-side raw string reclassification. |
| 337 | Add structured address and query extraction to tokenizer | 2026-03-30 | Address/query identifier structure now flows through AST metadata instead of compiler-side syntax reconstruction. |
| 338 | Add richer compile-time expression AST nodes | 2026-03-30 | Compile-time expression nodes now carry richer parsed structure and precomputed intermodule metadata for compiler consumers. |
| 339 | Add instruction classification metadata to AST lines | 2026-03-30 | AST lines now carry parser-owned instruction classification metadata used for compiler routing. |
| 341 | Inline address references during semantic normalization | 2026-03-30 | Local `&name` and `name&` address references are now inlined to literals during semantic normalization; `pushMemoryReference.ts` deleted. |
| 342 | Inline intermodule address references during semantic normalization | 2026-03-30 | Intermodule `&module:memory`, `module:memory&`, `&module:`, and `module:&` address references are now inlined to literals in `resolveCompileTimeOperand` once cross-module layout is known. |
| 301 | Refactor constant namespace collection and remove duplicated const parsing | 2026-03-30 | Superseded by the current semantic const pipeline; the remaining work is tracked in `352`. |
| 310 | Simplify compiler project flattening and compilable block checks | 2026-03-30 | Archived by user request as already completed. |
| 309 | Extract shared module memory identifier parser | 2026-03-30 | Superseded by later tokenizer/compiler metadata work; the remaining issue is editor-side obsolete source-syntax renaming, tracked separately in `351`. |
| 353 | Nest tokenizer package under compiler | 2026-03-31 | Tokenizer now lives at `packages/compiler/packages/tokenizer`; Nx and TypeScript path resolution updated to the nested layout. |
| 254 | Fix max/min helpers for float64 memory | 2026-04-02 | `getElementMaxValue`/`getElementMinValue` now branch on `elementWordSize === 8` and return correct float64 bounds. |
| 257 | Fix collectConstants identifier RHS resolution | 2026-04-02 | Superseded by semantic normalization refactor; constant RHS now resolved via the normalization pipeline without force-casting. |
| 292 | Refactor error systems and document syntax vs compiler error boundaries | 2026-04-02 | `errors.ts` renamed to `compilerError.ts`; `SyntaxRulesError` centralized; policy comments added to both modules. |
| 303 | Dedupe font atlas rows for identical text colors | 2026-03-31 | Sprite generator now deduplicates font atlas rows for identical text color roles. |
| 354 | Extract WASM Utils to Separate Package | 2026-04-02 | WASM utility functions extracted from `packages/compiler/src/wasmUtils` into a nested package at `packages/compiler/packages/wasm-utils`. |
| 355 | Replace `isPointingToInt8`/`isPointingToInt16` booleans with a single `pointeeBaseType` field | 2026-04-07 | Archived after completion; `DataStructure` pointer metadata now uses `pointeeBaseType` as the single source of truth. |
| 356 | Consolidate declaration compilers into a single factory | 2026-04-08 | Archived after completion; scalar declaration compilers now share `createDeclarationCompiler` instead of duplicating per-type implementation logic. |
| 357 | Reuse single-block recompute in bulk viewport-anchored loop | 2026-04-15 | Archived after completion; viewport-anchored recomputation now delegates through one shared single-block path using the rounded viewport dimensions expected by the resolver. |
| 358 | Convert worldPositionToAnchoredPos to use an input object | 2026-04-15 | Archived after completion; viewport anchored reverse-position conversion now uses a named input object instead of an 11-argument positional call signature. |
| 359 | Audit borderLineCoordinates use of raw vs rounded viewport dimensions | 2026-04-15 | Archived after completion; offscreen arrow border lines intentionally continue using raw viewport dimensions so indicators target the visible pixel edge rather than the grid-snapped anchored-position bounds. |
| 362 | Refactor ArgumentIdentifier to a discriminated union | 2026-04-15 | Archived after completion; tokenizer identifier nodes now use a real discriminated union, and compiler consumers no longer rely on non-null assertions for reference-kind-specific fields. |
| 360 | Use `createMockState` in viewport-anchored dragging integration test | 2026-04-07 | Archived after completion; the viewport-anchored dragging test now relies on shared mock-state defaults instead of a hand-built state literal. |
| 365 | Unify editor directive parsing and alias normalization | 2026-04-15 | Archived after completion; editor directive parsing and alias normalization now share a single implementation path across direct parsing and cached directive derivation. |
| 366 | Add configurable loop cap directive and loop override | 2026-04-08 | Archived after completion; loop guards now support configurable ambient defaults and per-loop overrides instead of a fixed hardcoded cap only. |
| 367 | Refactor compiler directive plumbing and loop guard config | 2026-04-08 | Archived after completion; compiler directive handling and loop-guard configuration were cleaned up to remove repeated plumbing and centralize defaults. |
| 372 | Make `push <local>` fully equivalent to `localGet` | 2026-04-07 | Archived after completion; `push <local>` now matches `localGet` for local-read semantics, including metadata and identifier-resolution behavior. |
| 373 | Remove `localGet` and migrate sources to `push` | 2026-04-07 | Archived after completion; active compiler-owned sources, tests, docs, fixtures, and examples now use `push` for local reads. |
| 374 | Add local-vs-memory name collision errors | 2026-04-07 | Archived after completion; local declarations now fail immediately when they reuse a memory identifier in the same namespace. |
