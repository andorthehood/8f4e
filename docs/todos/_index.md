# TODO Index

This document provides a comprehensive index of all TODO items in the 8f4e project, organized by category and priority.

## Active TODOs (Open)

### 🔴 High Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
| 053 | Fix Runtime Reinitialization on Code Change | 🔴 | 4-6h | 2025-09-03 | Runtime destroys and recreates completely on every code change instead of syncing existing instance, causing audio glitches, performance degradation, and loss of runtime state |
| 091 | Optimize Dev Workflow with Nx Caching and Incremental Builds | 🔴 | 2-3d | 2025-11-07 | Replace current Vite-watches-all-sources setup with Nx-managed incremental builds to leverage caching and only rebuild affected packages |
| 199 | Add config block type attribute for project config | 🔴 | 1-2d | 2026-01-21 | Require `config project` markers, reject untyped `config`, and update examples/tests/docs accordingly |

### 🟡 Medium Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
| 121 | Add Pure Function Support to Compiler | 🟡 | 5-7d | 2025-12-09 | Compiler only accepts modules; add stack-only helper pipeline, `call` instruction, and WASM layout updates |
| 122 | Add Function Code Blocks to Editor | 🟡 | 3-4d | 2025-12-09 | Editor still only surfaces module/config blocks; introduce function blocks in UI/state and send them to the compiler |
| 123 | Add Memory Reinit Reason Reporting | 🟡 | 2-4h | 2025-12-14 | Add `MemoryReinitReason` to `compileAndUpdateMemory` results without changing existing memory reinit/recreate decision logic |
| 124 | Persist Code Block Grid Coordinates | 🟡 | 2-4h | 2025-12-15 | Add `gridX/gridY` to `CodeBlockGraphicData` and recompute cached `x/y` on drag and font grid changes |
| 128 | Add Non-Zero Guardrails for `remainder` | 🟡 | 1-2h | 2025-12-19 | Mirror `div`’s compile-time `isNonZero` guard so `remainder` can’t trap on a zero divisor |
| 130 | Add Instruction Compiler Validation Helper | 🟡 | 1-2d | 2025-12-20 | Introduce shared `withValidation` wrapper to centralize scope/operand checks while preserving existing error codes |
| 144 | Infer Validation Errors from Operand Rules | 🟡 | 4-6h | 2025-12-20 | Remove explicit type error overrides in `withValidation` and infer errors from operand rules |
| 146 | Investigate Index Arithmetic Support | 🟡 | 2-4h | 2025-12-25 | Assess impact and effort to add C-style index arithmetic beyond byte-only addressing |
| 149 | Extract Syntax Parsing and Errors into syntax-rules | 🟡 | 1-2d | 2025-12-25 | Archived - syntax helpers now integrated into `@8f4e/compiler/syntax` subpath |
| 150 | Add Test Module Type | 🟡 | 2-4d | 2025-12-28 | Introduce a test-specific module type with compiler/runtime support and editor tooling for automated verification |
| 151 | Split wasmUtils utilities and add in-source tests | 🟡 | 1-2d | 2025-12-29 | Split `wasmUtils` helpers into per-file modules and add in-source Vitest tests alongside utilities |
| 152 | Export Syntax Helpers via Compiler Subpath | 🟡 | 1-2d | 2025-12-29 | Merge syntax helpers into compiler while keeping lightweight `@8f4e/compiler/syntax` imports |
| 153 | Add Constants Code Blocks to Compiler | 🟡 | 1-2d | 2025-12-30 | Add named `constants` / `constantsEnd` blocks to define shared constants namespaces consumed via `use` |
| 154 | Split compiler utils and use syntax helpers | 🟡 | 1-2d | 2025-12-30 | Split `packages/compiler/src/utils.ts` into per-function modules with in-source tests and replace syntax checks with syntax helpers |
| 155 | Add Framebuffer Memory Accounting in glugglug | 🟡 | 2-4h | 2025-12-30 | Track estimated render target and cache framebuffer memory usage for debugging and profiling |
| 156 | Add GLSL Shader Code Blocks for Post-Process Effects | 🟡 | 2-4d | 2026-01-02 | Replace project `postProcessEffects` with vertex/fragment shader code blocks and derive effects from block pairs |
| 158 | Add Background Effects | 🟡 | 2-4d | 2026-01-02 | Add background-only effects analogous to post-process effects without impacting UI |
| 162 | Add subscribeToValue to State Manager | 🟡 | 2-4h | 2026-01-07 | Add matcher-based and primitive-value subscriptions that stay active until explicit unsubscribe |
| 164 | Decouple Web-UI Sprite/Grid Writes | 🟡 | 1-2d | 2026-01-08 | Move sprite lookups and grid sizing writes out of web-ui into the editor |
| 166 | Default Vertex Shader for Post-Process Effects | 🟡 | 2-4h | 2026-01-12 | Allow fragment-only post-process shaders by injecting a fullscreen-quad vertex shader default and update the ripple example |
| 167 | Decouple Syntax Highlighting for GLSL Blocks | 🟡 | 2-4h | 2026-01-12 | Add a GLSL highlighter path for shader blocks and keep 8f4e highlighting for everything else |
| 169 | Toggle Position Offsetters via Function Key | 🟡 | 1-2h | 2026-01-13 | Add a runtime toggle event and host key binding to disable memory-driven position offsets |
| 206 | Add Fraction Literals to Compiler | 🟡 | 2-4h | 2026-01-27 | Add `int/int` fraction parsing for numeric literals with division-by-zero checks |
| 207 | Add Fraction Literals to Stack Config Compiler | 🟡 | 2-4h | 2026-01-27 | Mirror compiler fraction parsing for stack-config numeric literals |
| 210 | Add WebMCP-based MCP server integration to the 8f4e editor | 🟡 | 2-4d | 2026-02-07 | Build a feature-flagged integration spike using the experimental WebMCP API to validate browser lifecycle, tooling, and fallback behavior |
| 211 | Add WASM memory to GLSL float uniform bindings via project config | 🟡 | 2-4d | 2026-02-08 | Add float-only config-driven uniform bindings using `memoryId`-encoded span (`module.value`, `module.buffer[i]`, `module.buffer[i:n]`) for postprocess/background shaders |
| 212 | Remove init/loop section distinction from compiler modules | 🟡 | 1-2d | 2026-02-08 | Simplify `@8f4e/compiler` internals by removing module init-vs-loop sectioning ahead of a dedicated memory-init special block |
| 217 | Add first compiler directive to skip module execution in cycle | 🟡 | 4-6h | 2026-02-09 | Add a hash-prefixed module directive that excludes module calls from global cycle while preserving memory compilation and initialization |
| 216 | Stop treating # as compiler comments | 🟡 | 2-4h | 2026-02-09 | Remove hash comment parsing from compiler syntax so `#` can be reserved for explicit compiler directives |
| 215 | Migrate editor directives to semicolon comments and reserve # for compiler directives | 🟡 | 4-6h | 2026-02-09 | Replace hash-prefixed editor directives with `; @instruction` comments, update examples/parsers, and keep `#` reserved for future compiler directives |
| 214 | Support buffer& end address in declaration initializers | 🟡 | 2-4h | 2026-02-08 | Make declaration defaults honor `buffer&` as end address (not start) and align behavior with `push` memory-reference semantics |
| 213 | Add Macro Support to Stack Config Language | 🟡 | 2-3d | 2026-02-08 | Reuse compiler macro parsing/expansion for stack config with call-site error mapping and macro identity in errors |
| 170 | Toggle Post-Process Effects via Function Key | 🟡 | 1-2h | 2026-01-13 | Add a runtime toggle event and host key binding to disable post-process effects |
| 173 | Add Scoped Constants to Stack Config Compiler | 🟡 | 1-2d | 2026-01-13 | Add scoped `const` command and constant-aware `push` for config blocks |
| 178 | Drop WebGL1 and move glugglug to WebGL2-only | 🟡 | 2-4d | 2026-01-15 | Remove WebGL1 fallback, update shaders, and use WebGL2-only renderer setup |
| 185 | Simplify post-process pipeline to a single effect | 🟡 | 1-2d | 2026-01-19 | Drop multi-effect chaining and run a single post-process pass |
| 186 | Split Binary Asset Fetch and Memory Load | 🟡 | 1-2d | 2026-01-19 | Split asset fetching from WASM memory loading with metadata-only state tracking |
| 191 | Add clearScope Instruction to Stack Config Compiler | 🟡 | 1-2h | 2026-01-20 | Add explicit scope reset instruction to make root resets clear in config blocks |
| 192 | Move editor-only directives to # and remove ignoredKeywords | 🟡 | 4-6h | 2026-01-21 | Make editor directives explicit with #, treat # as compiler comment, remove ignoredKeywords API |
| 195 | Update Example Code to Use %/^/! Prefixes | 🟡 | 2-4h | 2026-01-21 | Replace WORD_SIZE and manual integer limit constants in examples with element size and bounds prefixes |
| 200 | Add code block slider control directive | 🟡 | 1-2d | 2026-01-21 | Add a # slider directive to render an interactive horizontal slider inside code blocks and write values directly to a memory word |
| 204 | Expose sprite-generator color helpers | 🟡 | 0.5-1d | 2026-01-22 | Export RGB helpers (lighten/darken/alpha/mix) so users can derive custom color schemes |
| 205 | Move Runtime Definitions into Runtime Packages | 🟡 | 1-2d | 2026-01-23 | Move runtime schemas/defaults/factories into runtime packages and assemble host registries from package exports |
| 179 | Add glugglug shader error callback for editor logging | 🟡 | 2-4h | 2026-01-16 | Report shader compile/link failures with effect name/line, skip failed effects, log in editor |
| 180 | Load Binary Assets From Config URLs | 🟡 | 1-2d | 2026-01-16 | Allow config to declare URL-backed binary assets with module.memory targets, cached in the editor |
| 182 | Add Example Module Dependencies on Insert | 🟡 | 4-6h | 2026-01-17 | Add a dependencies field to example modules and insert missing dependency blocks alongside the requested module |
| 181 | Split Editor-State Types by Feature | 🟡 | 1-2d | 2026-01-16 | Break up monolithic editor-state types into feature-scoped modules and re-export via public API |
| 183 | Add Macro Code Blocks and Expansion | 🟡 | 2-4d | 2026-01-18 | Add `defmacro` blocks and `macro` usage expansion before program and config compilation |
| 002 | Enable Strict TypeScript in Editor Package | 🟡 | 2-3d | 2025-08-23 | Currently has 52 type errors when strict settings enabled, causing missing null checks and implicit any types that reduce type safety and developer experience |
| 025 | Separate Editor View Layer into Standalone Package | 🟡 | 3-5d | 2025-08-26 | Extract Canvas-based rendering and sprite management into `@8f4e/browser-view` package to make core editor a pure state machine compatible with any renderer |
| 026 | Separate Editor User Interactions into Standalone Package | 🟡 | 2-3d | 2025-08-26 | Extract DOM event handling and input logic into `@8f4e/browser-input` package to enable alternative input systems (touch, joystick, terminal) |
| 032 | Plan and Implement Comprehensive Test Coverage for Editor Package | 🟡 | 3-5d | 2025-08-27 | Currently has minimal test coverage with only config/midi tests, creating risks for refactoring and making bug verification difficult |
| 033 | Comprehensive Testing for Editor State Effects System | 🟡 | 2-3d | 2025-08-27 | Only runtime effects are tested; missing coverage for binary assets, code blocks, compiler integration, menu system, and other critical state management functions |
| 034 | Comprehensive Testing for Editor Event System | 🟡 | 1-2d | 2025-08-27 | Event routing and coordination layer has no test coverage, creating risks for subtle bugs when components interact during refactoring |
| 037 | Expand Editor Integration Testing Coverage | 🟡 | 2-3d | 2025-08-27 | Only feature flags integration tests exist; missing cross-component workflows, data flow, error propagation, and performance testing |
| 039 | Create Editor Test Utilities and Cross-Cutting Testing Infrastructure | 🟡 | 1-2d | 2025-08-27 | Need shared testing utilities, mocks, and fixtures to avoid duplicated setup code and inconsistent testing patterns across multiple test areas |
| 042 | Enable Runtime-Only Project Execution | 🟡 | 3-4h | 2025-08-27 | Currently requires full compiler infrastructure to run projects; need to include pre-compiled WASM bytecode for instant execution without compilation |
| 048 | Add 2D Engine Visual Regression Tests | 🟡 | 6-8h | 2025-08-28 | No automated visual testing means rendering bugs go undetected during refactoring; need pixel-perfect screenshot comparison using Jest + Puppeteer |
| 052 | Simplify Cache Rendering Order | 🟡 | 2-3d | 2025-09-03 | Complex segment-based system causes black quads when simplified; need to bind off-screen framebuffer for entire draw phase to eliminate manual segment tracking |
| 054 | Benchmark Unrolled vs Normal Loop in Audio Buffer Filler | 🟡 | 8-12h | 2025-09-07 | Current unrolled approach (128 direct calls) may hurt instruction cache performance; need empirical data comparing unrolled vs standard loops in WASM context |
| 055 | Implement Strength Reduction Compiler Optimization | 🟡 | 2-3d | 2025-09-08 | No optimization for patterns like `x * 2` → `x << 1`; missing performance gains from replacing expensive multiplication/division with bit shifts |
| 056 | Add One-Time Init Blocks Language Feature | 🟡 | 5-7d | 2025-09-09 | No language construct for one-time initialization; init code runs repeatedly in main loop with manual guards, causing inefficiency and potential bugs |
| 057 | Research JavaScript/WebAssembly Runtimes for Step-by-Step Execution | 🟡 | 8-12h | 2025-09-09 | Need advanced debugging capabilities (step-by-step execution, stack inspection, breakpoints) for better development experience; evaluating wabt.js, webassemblyjs, ts-wasm-runtime |
| 058 | Research C/C++ WebAssembly Runtimes on Linux with ALSA Audio Support | 🟡 | 4-6d | 2025-09-11 | Browser-only deployment limits use cases; need native Linux runtime with ALSA integration for server-side audio processing and professional audio infrastructure |
| 064 | Research WebAssembly Runtimes for ARM Microcontroller Support | 🟡 | 3-5d | 2025-09-10 | Browser runtimes limited to web; need embedded WASM runtime for ARM Cortex-M7 with real-time audio constraints and minimal memory footprint |
| 059 | Refactor Unit Tests into __tests__ Folders | 🟡 | 0.5-1d | 2025-09-04 | Inconsistent test organization makes discovery harder and complicates refactors; standardize to `packages/<pkg>/src/**/__tests__/*.test.ts` structure |
| 062 | Editor Command Queue Refactor | 🟡 | 3-4d | 2025-10-09 | Direct callback storage makes state non-serializable and couples effects to host functions; replace with typed command queue for better testability and side-effect observability |
| 069 | Extract Editor State Into Dedicated Package | 🟡 | 3d | 2025-10-21 | Split editor state logic into `@8f4e/editor-state` to remove deep imports, clarify boundaries, and enable reuse |
| 070 | Merge Editor State Types Into Editor State Package | 🟡 | 2-3d | 2025-10-21 | Consolidate the standalone types package back into `@8f4e/editor-state`, update configs/dependencies, and remove redundant aliases |
| 084 | Add Per-Code-Block Theme Variants | 🟡 | 2-3d | 2025-11-05 | Allow each color scheme to expose three block palettes selectable per code block |
| 085 | Highlight Paired Block Scopes | 🟡 | 2-3d | 2025-11-05 | Draw theme-colored rectangles behind start/end block pairs to show scope boundaries |
| 094 | Handle Large Binary Assets with OPFS | 🟡 | 1-2d | 2025-11-17 | Large binary imports always convert to base64 data URLs, causing freezes and storage bloat; add size-aware logic that routes big files into OPFS or a fallback store |
| 098 | Refactor createMockCodeBlock to options object | 🟡 | 4-6h | 2025-11-22 | Convert helper to options-only signature and migrate all tests/docs off positional overloads |
| 079 | Add Directional Navigation Function for Code Blocks | 🟡 | 4-6h | 2025-11-02 | Implemented spatial navigation algorithm for code blocks supporting keyboard-based navigation between blocks in all four directions |

### 🟢 Low Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
| 016 | Runtime Loading UI Improvements | 🟢 | 2-3d | 2025-08-26 | After lazy loading implementation, users experience delays when switching runtimes with no visual feedback, causing confusion about system state |
| 035 | Complete MIDI Functionality Testing Coverage | 🟢 | 1d | 2025-08-27 | Only CC names are tested; missing coverage for MIDI enumerations and integration patterns across different MIDI devices |
| 036 | Complete Configuration System Testing Coverage | 🟢 | 1d | 2025-08-27 | Only feature flags are tested; missing coverage for configuration utilities, persistence, and edge cases |
| 038 | Comprehensive Testing for Editor Type System | 🟢 | 1d | 2025-08-27 | No test coverage for type definitions and validation utilities; need runtime validation tests to ensure type accuracy |
| 176 | Document editor-state features with per-feature READMEs | 🟢 | 0.5-1d | 2026-01-14 | Add top-level feature READMEs for editor-state to capture purpose, events, and references |

## Completed TODOs (Archived)

### Recently Completed

| ID | Title | Priority | Effort | Completed | Summary |
|----|-------|----------|--------|-----------|---------|
| 202 | Skip reapplying compiled config when unchanged | 🟡 | 1-2d | 2026-01-22 | Added deep-equal utility to compare compiled config output after defaults are merged; config is only set in store when changed, reducing unnecessary store updates and downstream recomputations |
| 201 | Make minGridWidth a shared constant | 🟡 | 2-4h | 2026-01-22 | Introduced `CODE_BLOCK_MIN_GRID_WIDTH` constant in utils module; updated `getCodeBlockGridWidth` to use constant as default; replaced hardcoded values in effect.ts and codeBlockCreator; all 309 code-blocks tests passing |
| 194 | Add Unsigned int8/int16 Buffer Support (Compiler + Web-UI) | 🟡 | 1-2d | 2026-01-21 | Added `int8u[]`/`int16u[]` buffer declarations with unsigned min/max semantics and Uint8/Uint16 memory views in web-ui |
| 193 | Add Min/Max Value Prefixes for Memory Items | 🟡 | 4-6h | 2026-01-21 | Add `^name`/`!name` prefixes to push max finite and lowest finite values for a memory item’s element type |
| 177 | Add ~ import alias to editor-state | 🟢 | 0.5-1h | 2026-01-14 | Added `~` import alias to editor-state package for cleaner imports; configured TypeScript, Vite, and Vitest to resolve `~/*` to `src/*`; all typechecks, tests, and builds pass |
| 174 | Runtime Registry for Configurable Runtime Schemas | 🟡 | 3-5d | 2026-01-13 | Implemented runtime registry system with configurable schemas; added RuntimeRegistry and RuntimeRegistryEntry types; updated config schema generation to use registry; runtime effect now supports registry-based loading with fallback to defaultRuntimeId; created runtime registry in app layer with all four runtimes; all 460 tests passing |
| 172 | Decouple Line Numbers from Syntax Highlighting | 🟡 | 2-4h | 2026-01-13 | Decoupled line number rendering from syntax highlighting by passing raw code to highlighters and applying line-number colors in a separate pass; simplified regexes and made highlighters focus purely on code semantics |
| 171 | Add Conditional Schema Support to Stack Config Compiler | 🟡 | 2-4d | 2026-01-13 | Extended schema subset with oneOf/anyOf to validate runtime-specific config during compile; implemented post-compilation validation for discriminated unions and overlapping types |
| 165 | Add clipboard callbacks to editor-state | 🟡 | 2-4h | 2026-01-08 | Introduced `readClipboardText` and `writeClipboardText` callbacks to make editor-state portable; disabled clipboard menu items when callbacks are missing; added comprehensive tests; all navigator.clipboard calls now in editor package only |
| 163 | Web-UI Memory Ref Init And Views | 🟡 | 2-3d | 2026-01-07 | Moved web-ui memory access to a stable ref passed into init, creating int/float views internally and threading them into memory-dependent drawers; decoupled render layer from compiler state |
| 161 | Add Explicit Store Wait Helpers | 🟡 | 2-4h | 2026-01-04 | Added `waitForChange` and `waitForValue` Promise-based helpers to state-manager; both use strict equality, auto-unsubscribe after resolving, and support immediate resolution; comprehensive tests cover change-driven and immediate resolution with cleanup verification |
| 157 | Disable Compilation for Runtime-Ready Projects | 🟡 | 3-5h | 2026-01-02 | Added `disableCompilation` config flag to hard-block compilation and skip config/module compilation paths; comprehensive tests added covering compiler, config effects, and runtime-ready export |
| 147 | Split Memory Instruction Into int/float With Shared Helpers | 🟡 | 4-6h | 2025-12-25 | Split `memory.ts` into `int.ts`/`float.ts`, add shared helpers for argument parsing, pointer depth, and memory flags, split `memory.test.ts` into `int.test.ts`/`float.test.ts`; all tests pass, typecheck passes, lint passes |
| 148 | Consolidate syntax-related logic into syntax-rules package | 🟡 | 2-3d | 2025-12-25 | Archived - syntax logic consolidated into `@8f4e/compiler/syntax` subpath; superseded by TODO 152 |
| 127 | Update Deprecated npm Dependencies | 🟡 | 2-4h | 2025-12-20 | Upgraded ESLint from v8.57.0 to v9.39.2, added @eslint/js@9.39.2 and globals@16.5.0, updated typescript-eslint packages to 8.50.0, removed .eslintignore file; eliminated deprecation warnings for eslint, rimraf, and @humanwhocodes packages |
| 097 | Enforce Nx-Only Package Entrypoints | 🟡 | 0.5-1d | 2025-11-21 | Removed all package-level scripts from 11 packages; added missing Nx targets for screenshot test variants and dev:test; updated README.md with comprehensive Nx command examples; all workflows now use Nx targets exclusively |
| 095 | Split Loader/Save Effects into Dedicated Modules | 🟡 | 1-2d | 2025-11-17 | Replaced monolithic loader.ts and save.ts with three focused modules: projectImport.ts (session persistence, project loading), projectExport.ts (JSON/runtime-ready exports, storage quota), and editorSettings.ts (color scheme/font settings); added 48 comprehensive tests |
| 093 | Add Typecheck GitHub Action | 🟡 | 2-3h | 2025-11-09 | Added CI workflow step that runs `npm run typecheck` (Nx run-many) on push/PR to main and staging to block type regressions |
| 092 | Use Editor State Testing Utilities in Web-UI Tests | 🟡 | 4-6h | 2025-11-09 | Established testing pattern for web-ui by creating example unit tests using @8f4e/editor-state/testing utilities, documented patterns in README, and configured vitest to use node environment |
| 089 | Remove state.project Redundancy | 🟡 | 3-5d | 2025-11-06 | Successfully refactored editor state to eliminate duplicate data structures by creating dedicated serialization layer, migrating all code to use new state locations (projectInfo, compiler.*, graphicHelper.*), and establishing single source of truth for code blocks |
| 086 | Remove Legacy Code Block Collapse Remnants | 🟡 | 1-2d | 2025-11-05 | Removed all legacy collapse-related code including `isOpen` fields, `codeBlockOpener` effect, conditional rendering, and 140+ occurrences in example files |
| 083 | Cursor-Aware Horizontal Navigation | 🟡 | 1 day | 2025-11-03 | Implemented cursor-aware horizontal navigation for code blocks to improve spatial intuition when navigating between tall blocks and multiple neighbors |
| 074 | Consolidate Module and Arrow Drawing Loops | 🟡 | 0.5d | 2025-11-03 | Consolidated separate rendering passes for visible code blocks and off-screen arrow indicators into a single iteration pass with shared visibility helper, reducing duplicate iteration and maintenance overhead |
| 082 | Implement Edge-Based Code Block Navigation | 🟡 | 1-2d | 2025-02-14 | Replaced center-based heuristic with edge distance scoring for more intuitive directional navigation in staggered and diagonal layouts |
| 081 | Implement CSS-Like Viewport Animation for Code Block Navigation | 🟡 | 4-6 hours | 2025-11-03 | Added smooth viewport animations for code block navigation using Command+Arrow keys; animations isolated in web-ui layer with feature flag control |
| 080 | Calculate Centered Viewport Coordinates for Code Block | 🟡 | 3-4 hours | 2025-11-02 | Implemented utility function to calculate viewport coordinates that center a code block on screen with top-edge visibility constraint |
| 078 | Modularize Example Module Imports | 🟡 | 1-2d | 2025-11-01 | Implemented lazy loading using `import.meta.glob` for 76+ example modules; each module now code-split into separate chunk (0.2-2.2 KB), preventing main bundle from including unused module code |
| 077 | Add Sprite Generator Visual Regression Tests | 🟡 | 1-2d | 2025-11-01 | Added Playwright-based screenshot tests for sprite-generator package to ensure visual consistency and prevent rendering regressions |
| 076 | Precompute Font Bitmaps as Base64 Assets | 🟡 | 8-12h | 2025-11-01 | Reduced sprite-generator bundle size by 90% (79KB → 8KB) by precomputing font bitmaps at build time and encoding as Base64 instead of shipping ASCII art sources |
| 073 | Make Packages Self-Contained for Dist-First Usage | 🔴 | 2-3d | 2025-10-23 | Aligned Nx dev/build pipeline to consume dist artifacts, removed src/dist conditional in vite config, added package watch targets, and documented new workflow |
| 070 | Migrate Testing System to Vitest | 🔴 | 3-4d | 2025-10-21 | Migrated all packages from Jest to Vitest with improved ESM support and Vite integration; 243 tests passing across 11 packages |
| 071 | Front Matter Metadata Migration | 🟡 | 0.5-1d | 2025-10-21 | Migrated 70 TODO files from inline bold metadata format to YAML front matter for better parsing and automation |
| 070 | Merge Editor State Types Into Editor State Package | 🟡 | 2-3d | 2025-10-21 | Consolidated the standalone types package back into `@8f4e/editor-state`, updated configs/dependencies, and removed redundant aliases |
| 068 | Split Editor View Into @8f4e/web-ui Package | 🟡 | 3-5d | 2025-10-21 | Externalized canvas rendering layer into dedicated @8f4e/web-ui Nx package with shared state types, dynamic imports, and updated build wiring |
| 066 | Fix Color Scheme Persistence Bug | 🟡 | 2-3h | 2024-12-19 | Color scheme selection not persisted across browser reloads; reverts to default 'hackerman' instead of user's selected scheme |
| 063 | Compiler Object Output Refactor | 🟡 | 2-3d | Recent | Refactor compiler to output structured objects instead of raw arrays |
| 061 | Editor State Callbacks Refactor | 🟡 | 2-3d | Recent | Refactor editor state to use callback pattern instead of direct function calls |
| 060 | Lazy Load Editor Color Schemes | 🟢 | 1-2d | Recent | Implement lazy loading for color schemes to improve initial load time |
| 058 | Compiler AST Optional Output | 🟡 | 1-2d | Recent | Make AST output optional in compiler for better performance |
| 057 | Add Caching Config Option to 2D Engine | 🟢 | 1d | Recent | Add configuration option to enable/disable caching in 2D engine |
| 054 | Make Post-Process Shaders Project-Scoped | 🟡 | 2-3d | Recent | Scope post-process shaders to individual projects instead of global |
| 051 | Standardize Type Imports | 🟢 | 1d | Recent | Standardize import patterns for TypeScript types across packages |
| 050 | 2D Engine Cache Groups Renderer Approach | 🟡 | 3-4d | Recent | Implement cache groups using renderer approach in 2D engine |
| 049 | Add Sprite Generator Unit Tests | 🟢 | 1-2d | Recent | Add comprehensive unit tests for sprite generator package |
| 047 | Add 2D Engine Buffer Utilities Tests | 🟢 | 1d | Recent | Add unit tests for buffer utility functions in 2D engine |

### Major Infrastructure Completed

| ID | Title | Priority | Effort | Completed | Summary |
|----|-------|----------|--------|-----------|---------|
| 031 | Lazy Load Runtime Factories | 🟡 | 2-3d | 2025-08-26 | Implement lazy loading for runtime factory modules |
| 030 | Refactor Runtime Package Names | 🟡 | 1-2d | 2025-08-26 | Standardize runtime package naming conventions |
| 029 | Main Thread Logic Runtime | 🟡 | 3-4d | 2025-08-26 | Implement main thread logic runtime for synchronous execution |
| 028 | Remove localStorageId from Editor Options | 🟢 | 1d | 2025-08-26 | Clean up editor options by removing localStorageId parameter |
| 027 | Remove Project Parameter from initEditor | 🟡 | 1-2d | 2025-08-26 | Simplify editor initialization by removing project parameter |
| 024 | Outsource Project Loading/Saving | 🟡 | 2-3d | 2025-08-26 | Move project persistence logic out of editor package |
| 023 | Outsource Compiler from Editor | 🟡 | 2-3d | 2025-08-26 | Extract compiler functionality into separate package |
| 022 | Implement Modules/Projects Lazy Loading | 🟡 | 2-3d | 2025-08-26 | Add lazy loading for modules and projects |
| 021 | Refactor Modules/Projects to Async Callbacks | 🟡 | 2-3d | 2025-08-26 | Convert modules/projects to use async callback pattern |
| 020 | Rename Examples to Projects and Modules | 🟢 | 1d | 2025-08-26 | Reorganize examples into projects and modules structure |

### Early Infrastructure Completed

| ID | Title | Priority | Effort | Completed | Summary |
|----|-------|----------|--------|-----------|---------|
| 019 | Pass Runtime Instances Through Options | 🟡 | 1-2d | 2025-08-26 | Refactor to pass runtime instances through options instead of global state |
| 018 | Feature Flags Config | 🟢 | 1d | 2025-08-26 | Implement feature flags configuration system |
| 017 | Lazy Load Examples | 🟢 | 1-2d | 2025-08-26 | Implement lazy loading for example modules |
| 015 | Lazy Load Runtimes | 🟡 | 2-3d | 2025-08-26 | Implement lazy loading for runtime modules |
| 014 | Migrate to Nx | 🔴 | 3-5d | 2025-08-26 | Migrate project from custom build system to Nx monorepo |
| 013 | Fix npm ls Errors | 🟢 | 1d | 2025-08-26 | Fix npm dependency listing errors |
| 012 | Refactor Jest Configs to ESModules | 🟡 | 1-2d | 2025-08-26 | Convert Jest configurations to use ES modules |
| 011 | Research Special File Type Handling | 🟢 | 1d | 2025-08-26 | Research handling of special file types in build system |
| 010 | Audit Import/Export Patterns | 🟡 | 1-2d | 2025-08-26 | Audit and standardize import/export patterns across packages |
| 009 | Standardize package.json Fields | 🟢 | 1d | 2025-08-26 | Standardize package.json field structure across packages |

### Build System & Configuration Completed

| ID | Title | Priority | Effort | Completed | Summary |
|----|-------|----------|--------|-----------|---------|
| 008 | Adjust TypeScript Configuration | 🟡 | 1d | 2025-08-26 | Adjust TypeScript configuration for better type checking |
| 007 | Remove browserslist | 🟢 | 0.5d | 2025-08-26 | Remove browserslist configuration (not needed) |
| 006 | Render to Texture Capability | 🟡 | 2-3d | 2025-08-26 | Add render-to-texture capability to 2D engine |
| 005 | Cleanup Script | 🟢 | 0.5d | 2025-08-26 | Add cleanup script for build artifacts |
| 004 | ts-ignore to ts-expect-error | 🟢 | 1d | 2025-08-26 | Replace @ts-ignore with @ts-expect-error for better type safety |
| 003 | Standardize Build Scripts | 🟡 | 1-2d | 2025-08-26 | Standardize build script patterns across packages |
| 001 | Vite Migration | 🔴 | 3-5d | 2025-08-26 | Migrate from custom build system to Vite |

## Notes

- Priority levels: 🔴 High, 🟡 Medium, 🟢 Low
- Effort estimates are in hours (h) or days (d)
- This index is automatically generated and should be updated when TODOs are added, completed, or modified
- Completed TODOs are moved to the `archived/` folder
- TODO IDs are assigned chronologically when created
