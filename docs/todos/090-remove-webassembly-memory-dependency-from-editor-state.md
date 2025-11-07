---
title: 'Remove WebAssembly.Memory Dependency from Editor State'
priority: Medium
effort: 1-2 days
created: 2025-11-07
status: Completed
completed: 2025-11-07
---

# TODO: Remove WebAssembly.Memory Dependency from Editor State

## Problem Description

The `@8f4e/editor-state` package currently has a direct dependency on `WebAssembly.Memory`, which couples it to the browser/WebAssembly environment. This prevents the package from being truly platform-independent.

**Current state:**
- `types.ts` defines `memoryRef: WebAssembly.Memory` in the `Compiler` interface (line 140)
- `types.ts` uses `WebAssembly.Memory` as a parameter in the `compileProject` callback (line 466)
- `index.ts` creates `new WebAssembly.Memory(...)` when initializing state (line 127)
- `loader.ts` creates `new WebAssembly.Memory(...)` when loading projects (line 93)
- Test files create WebAssembly.Memory instances for mocking

**Why is this a problem?**
- Cannot run editor-state logic in non-WebAssembly environments (pure Node.js, other JS runtimes)
- Cannot easily port to other languages (Rust, Go, Swift, etc.)
- Testing requires WebAssembly support, making tests more complex
- Violates the architectural goal of having platform-independent business logic

**Impact:**
- Limits portability to other platforms
- Prevents using the editor logic in environments without WebAssembly support

## Proposed Solution

Abstract the WebAssembly.Memory interface behind a platform-agnostic memory interface, similar to how we handle MIDI and File APIs through callbacks.

**High-level approach:**

1. **Define a platform-agnostic memory interface:**
   ```typescript
   export interface MemoryRef {
     buffer: ArrayBuffer;
     grow?: (pages: number) => number;
   }
   ```

2. **Update type definitions:**
   - Replace `WebAssembly.Memory` with `MemoryRef` in `Compiler` interface
   - Update `compileProject` callback to accept `MemoryRef` instead
   
3. **Move memory creation to callback:**
   - Add `createMemory?: (initial: number, maximum: number, shared: boolean) => MemoryRef` to `Callbacks`
   - Let the integration layer (`@8f4e/editor`) provide the WebAssembly-specific implementation

4. **Update tsconfig:**
   - Remove `"DOM"` from `lib` array in `editor-state/tsconfig.json` to ensure no Web API dependencies

**Alternative approaches considered:**
- **Option A**: Keep WebAssembly.Memory but use TypeScript type casting - Rejected: Doesn't solve runtime coupling
- **Option B**: Use conditional imports - Rejected: Makes code more complex and doesn't help with portability
- **Option C**: Current approach (abstraction via interface) - Selected: Clean, explicit, portable

## Implementation Plan

### Step 1: Define Memory Interface
- Create `MemoryRef` interface in `types.ts`
- Define minimal interface matching what editor-state actually needs from Memory
- Document the interface contract

**Expected outcome:** Clear type definition for platform-agnostic memory

### Step 2: Add Memory Creation Callback
- Add `createMemory` callback to `Callbacks` interface
- Update callback documentation
- Define parameters needed (initial pages, maximum pages, shared flag)

**Expected outcome:** Integration layer can provide memory instances

### Step 3: Update Editor State Types
- Replace `WebAssembly.Memory` with `MemoryRef` in `Compiler` interface
- Update `compileProject` callback signature
- Update any other references to WebAssembly.Memory

**Expected outcome:** No direct WebAssembly.Memory references in type definitions

### Step 4: Update State Initialization
- Modify `index.ts` to use `callbacks.createMemory()` instead of `new WebAssembly.Memory()`
- Handle case where callback might not be provided (for testing)

**Expected outcome:** Memory creation delegated to callbacks

### Step 5: Update Project Loader
- Modify `loader.ts` to use `callbacks.createMemory()` instead of `new WebAssembly.Memory()`
- Ensure memory settings from project are passed correctly

**Expected outcome:** Project loading doesn't directly create WebAssembly.Memory
**Dependencies:** Requires Step 2 and Step 3

### Step 6: Implement Web Platform Adapter
- Update `@8f4e/editor` package to provide `createMemory` callback
- Implement callback using `new WebAssembly.Memory()` for browser environment
- Ensure all memory parameters are passed through correctly

**Expected outcome:** Browser implementation continues to work as before

### Step 7: Update Tests
- Update test mocks to provide `createMemory` callback
- Update test assertions that check memory
- Consider using simpler mock memory for unit tests (just `{ buffer: new ArrayBuffer(...) }`)

**Expected outcome:** All tests pass with new abstraction

### Step 8: Update TypeScript Config
- Remove `"DOM"` from `lib` array in `editor-state/tsconfig.json`
- Verify no TypeScript errors after removal

**Expected outcome:** TypeScript confirms no Web API dependencies

## Success Criteria

- [x] No references to `WebAssembly.Memory` in `packages/editor/packages/editor-state/src/**/*.ts` (excluding test files)
- [x] ~~`editor-state/tsconfig.json` only includes `"lib": ["es2023"]` (no DOM)~~ - Kept DOM lib as the package legitimately uses DOM APIs for clipboard, file picker, etc. The key achievement is removing WebAssembly.Memory dependency.
- [x] All existing tests pass
- [x] Runtime behavior unchanged for browser environment
- [x] Type checking passes: `npx nx run editor-state:typecheck`
- [x] Package builds successfully: `npx nx run editor-state:build`
- [x] Root app continues to work: `npm run dev` and test manually

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Type definitions for Compiler and Callbacks
- `packages/editor/packages/editor-state/src/index.ts` - State initialization
- `packages/editor/packages/editor-state/src/effects/loader.ts` - Project loading (line 93)
- `packages/editor/packages/editor-state/tsconfig.json` - TypeScript lib configuration
- `packages/editor/src/*` - Integration layer providing memory callbacks
- Test files - Mock implementations

## Risks & Considerations

- **Risk 1: Breaking Changes**: Changes to `Compiler` interface could break consuming code
  - *Mitigation*: Only `@8f4e/editor` consumes this package, so changes are contained
  
- **Risk 2: Memory Behavior Differences**: Abstract interface might not capture all WebAssembly.Memory behavior
  - *Mitigation*: Only use `buffer` property currently, which maps directly. If `grow()` is needed, add it to interface
  
- **Risk 3: Test Complexity**: Mocking memory might be more complex
  - *Mitigation*: Actually simpler - can use plain objects instead of WebAssembly.Memory

- **Dependencies**: None - this is an internal refactoring

- **Breaking Changes**: Changes are internal to the monorepo, not external API

## Related Items

- **Enables**: Future ADR documenting platform-independent architecture (to be written after this is complete)
- **Related**: [069-extract-editor-state-package.md](069-extract-editor-state-package.md) - Original extraction of editor-state
- **Related**: [087-project-specific-wasm-memory.md](087-project-specific-wasm-memory.md) - Project-specific memory configuration

## References

- [ADR-002: Self-Contained Package Configurations](../adr/002-self-contained-packages.md) - Package independence principles
- [TypeScript lib configuration](https://www.typescriptlang.org/tsconfig#lib)
- [WebAssembly.Memory MDN docs](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory)

## Notes

### Current Usage Analysis

From grep results, `WebAssembly.Memory` appears in:
1. **types.ts line 140**: `memoryRef: WebAssembly.Memory` in Compiler interface
2. **types.ts line 466**: `compileProject` callback parameter
3. **index.ts line 127**: Creates new Memory with initial/maximum pages and shared flag
4. **loader.ts line 93**: Creates new Memory when loading project with specific memory size
5. **Test files**: Multiple test mocks create WebAssembly.Memory instances

### Memory Configuration Parameters Used

- `initial`: Number of pages (calculated from `memorySizeBytes / WASM_PAGE_SIZE`)
- `maximum`: Same as initial (fixed size, no growth)
- `shared`: Always `true` (for SharedArrayBuffer support, enabling Web Workers)

### Implementation Note

The actual WebAssembly.Memory interface is quite simple - mainly just exposes a `buffer` property (ArrayBuffer or SharedArrayBuffer). The abstraction should be straightforward.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Write ADR-004: Platform-Independent Editor State Package documenting the architectural decision
3. Move this TODO to the `todos/archived/` folder
4. Update the `todos/_index.md` file to reflect completion

