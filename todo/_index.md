# TODO Index

This document provides a comprehensive index of all TODO items in the 8f4e project, organized by category and priority.

## Active TODOs (Open)

### 🔴 High Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
| 053 | Fix Runtime Reinitialization on Code Change | 🔴 | 4-6h | 2025-09-03 | Runtime destroys and recreates completely on every code change instead of syncing existing instance, causing audio glitches, performance degradation, and loss of runtime state |

### 🟡 Medium Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
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

### 🟢 Low Priority

| ID | Title | Priority | Effort | Created | Summary |
|----|-------|----------|--------|---------|---------|
| 016 | Runtime Loading UI Improvements | 🟢 | 2-3d | 2025-08-26 | After lazy loading implementation, users experience delays when switching runtimes with no visual feedback, causing confusion about system state |
| 035 | Complete MIDI Functionality Testing Coverage | 🟢 | 1d | 2025-08-27 | Only CC names are tested; missing coverage for MIDI enumerations and integration patterns across different MIDI devices |
| 036 | Complete Configuration System Testing Coverage | 🟢 | 1d | 2025-08-27 | Only feature flags are tested; missing coverage for configuration utilities, persistence, and edge cases |
| 038 | Comprehensive Testing for Editor Type System | 🟢 | 1d | 2025-08-27 | No test coverage for type definitions and validation utilities; need runtime validation tests to ensure type accuracy |

## Completed TODOs (Archived)

### Recently Completed

| ID | Title | Priority | Effort | Completed | Summary |
|----|-------|----------|--------|-----------|---------|
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
