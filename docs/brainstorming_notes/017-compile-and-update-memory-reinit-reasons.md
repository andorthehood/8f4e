# `compileAndUpdateMemory`: return `reused` vs `recreated` with reason

## Goal

Have `compileAndUpdateMemory` return a structured result that indicates whether the WASM instance was reused or recreated, and (if recreated) why.

## Proposed result type

- `action: 'reused'`
- `action: 'recreated'` with a reason:
  - `no-instance`
  - `memory-size-changed`
  - `memory-structure-changed`

Suggested shape:

```ts
export type MemoryReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'memory-size-changed'; prevBytes: number; nextBytes: number }
	| { kind: 'memory-structure-changed'; prevSignature: string; nextSignature: string };

export type CompileAndUpdateMemoryResult =
	| { action: 'reused' }
	| { action: 'recreated'; reason: MemoryReinitReason };
```

## Memory structure checksum

## Current implementation context (`packages/compiler-worker`)

Today the “recreate or not” decision is primarily driven by a boolean helper:

- `didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules)` in `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts`
- Used as `memoryStructureChange` in `packages/compiler-worker/src/compileAndUpdateMemory.ts`

What it currently treats as a “program or memory structure change”:

- No previous compiled modules
- Module key count changed, or a module id is missing
- `loopFunction.length` changed
- `initFunctionBody.length` changed
- `wordAlignedSize` changed

Memory size changes are handled separately by `getOrCreateMemory(compilerOptions.memorySizeBytes, memoryStructureChange)`.

Also note: the WASM instance currently cannot be reused because `compileAndUpdateMemory` forces a reset via `hasMemoryBeenReset || true`. A true `action: 'reused'` path will require removing that unconditional reset (or replacing it with real code-change detection).

### Compiler output to use

The compiler currently emits enough data for a deterministic layout checksum via `compiledModules`:

- `compiledModules: CompiledModuleLookup` where each `CompiledModule` includes `memoryMap: MemoryMap`.
- `MemoryMap` entries include `DataStructure` with offsets, sizes, types, defaults, and flags (see `packages/compiler/src/types.ts`).
- The emitted object property order is the compilation/AST insertion order, so record order is available and significant.

### Requirements

- Use a non-cryptographic checksum, but minimize collisions.
- Treat offsets, types, order, and all available structure fields as meaningful (“everything”).
- No backward compatibility required for older compiler results (runtime can assume checksum is present).

### Proposed checksum

- Add `layoutChecksum` to compiler output, computed as `FNV-1a 64-bit` (`bigint`) over a canonical byte stream.
- Emit as a versioned string: `memlayout-v1-<16-hex>`.

Canonical byte stream rules (to be specified exactly during implementation):

- Feed modules in the compiler’s emitted module order.
- Feed `memoryMap` entries in the emitted property order (no sorting).
- For each entry, feed the identifier plus all `DataStructure` fields that represent structure and meaning (including offsets, sizes, types, defaults, and flags).
- Use tagged encoding to prevent ambiguity between fields/values.

## Runtime decision policy

- If there is no current instance: recreate (`no-instance`).
- If memory size differs: recreate (`memory-size-changed`).
  - Do not attempt `memory.grow` (memory size changes typically correspond to loading a new project).
- Else if layout checksum differs: recreate (`memory-structure-changed`).
- Else: reuse (`reused`).

## Implementation plan (current)

1. Inspect compiler `compiledModules` output (done).
2. Specify canonical ordered layout bytes (pending).
3. Add `FNV-1a 64-bit` checksum to compiler output (pending).
4. Plumb checksum into runtime decisions (`compileAndUpdateMemory`) (pending).
5. Update result type and tests (pending).
