# `compileAndUpdateMemory`: return `reused` vs `recreated` with reason

## Goal

Have `compileAndUpdateMemory` return a structured result that indicates whether the WASM instance was reused or recreated, and (if recreated) why.

Clarify two related but distinct decisions:

- **WASM instance reuse**: do we keep the existing `WebAssembly.Instance` or instantiate a new one?
- **Memory reuse**: do we keep the existing `WebAssembly.Memory` or allocate a new one?

## Proposed result type

- `instance.action: 'reused' | 'recreated'`
- `memory.action: 'reused' | 'recreated'`
- When an action is `recreated`, include a structured reason.

Suggested shape:

```ts
export type WasmInstanceReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'code-changed'; prevChecksum: string; nextChecksum: string }
	| { kind: 'memory-recreated' };

export type MemoryReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'memory-size-changed'; prevBytes: number; nextBytes: number }
	| { kind: 'memory-structure-changed'; prevSignature: string; nextSignature: string };

export type CompileAndUpdateMemoryResult = {
	instance:
		| { action: 'reused' }
		| { action: 'recreated'; reason: WasmInstanceReinitReason };
	memory:
		| { action: 'reused' }
		| { action: 'recreated'; reason: MemoryReinitReason };
};
```

For `MemoryReinitReason`, `kind: 'no-instance'` means “there is no existing memory to reuse”.

## Memory structure checksum

Motivation: `didProgramOrMemoryStructureChange` currently mixes “program changed” and “memory layout changed”, and relies on weak signals (array lengths). A deterministic layout signature makes memory reuse decisions both:

- cheaper to compute (no deep diffs at runtime), and
- easier to explain/debug via reason payloads.

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

Also note: the WASM instance currently cannot be reused because `compileAndUpdateMemory` forces a reset via `hasMemoryBeenReset || true`. A true reuse path requires removing that unconditional reset and replacing it with real code-change detection (see “WASM code checksum” below).

### Compiler output to use

The compiler currently emits enough data for a deterministic layout checksum via `compiledModules`:

- `compiledModules: CompiledModuleLookup` where each `CompiledModule` includes `memoryMap: MemoryMap`.
- `MemoryMap` entries include `DataStructure` with offsets, sizes, types, defaults, and flags (see `packages/compiler/src/types.ts`).
- The emitted object property order is the compilation/AST insertion order, so record order is available and significant.

### Requirements

- Use a non-cryptographic checksum, but minimize collisions.
- Treat offsets, types, order, and all available structure fields as meaningful (“everything”).
- No backward compatibility required for older compiler results: runtime assumes checksums are present and should treat missing checksums as an error (not “changed”).

### Proposed checksum

- Add `layoutChecksum` to compiler output, computed as `FNV-1a 64-bit` (`bigint`) over a canonical byte stream.
- Emit as a versioned string: `memlayout-v1-<16-hex>`.

Canonical byte stream rules (to be specified exactly during implementation):

- Feed modules in a defined order.
  - Prefer emitting an explicit ordered list of module ids/keys from the compiler (to avoid JS object enumeration edge cases, especially integer-like keys).
- Feed `memoryMap` entries in a defined order.
  - Prefer emitting an explicit ordered list of data structure keys from the compiler (same reasoning).
- For each entry, feed the identifier plus all `DataStructure` fields that represent structure and meaning.
  - From `packages/compiler/src/types.ts`, `DataStructure` fields are:
    - `numberOfElements`, `elementWordSize`, `type`
    - `byteAddress`, `wordAlignedSize`, `wordAlignedAddress`
    - `default` (number or record)
    - `isInteger`, `id`, `isPointer`, `isPointingToInteger`, `isPointingToPointer`
- Use tagged encoding to prevent ambiguity between fields/values.

Encoding sketch for `memlayout-v1` (not final, but concrete enough to implement against):

- Start with ASCII `memlayout-v1\0` as a domain separator.
- Encode all integers as unsigned little-endian (`u32` unless a value may exceed; keep it consistent).
- Encode booleans as a single byte `0x00`/`0x01`.
- Encode strings as `u32 byteLength` + UTF-8 bytes.
- Encode `default`:
  - If number: a tag byte `0x00` then `f64` little-endian.
  - If record: a tag byte `0x01`, then `u32 entryCount`, then for each entry:
    - key string, then `f64` value
    - Sort record keys lexicographically to avoid non-semantic ordering affecting the checksum.

Note: `memoryMap`/module ordering should remain significant; only the `default` record keys should be sorted (since it behaves like a map, not a sequence).

## WASM code checksum

Instance reuse needs a “code unchanged” signal. The current helper only compares `loopFunction.length` and `initFunctionBody.length`, which can miss changes that preserve length.

Proposed approach:

- Compute a `codeChecksum` as `FNV-1a 64-bit` over `codeBuffer` bytes.
- Store `previousCodeChecksum` in `packages/compiler-worker` and recreate the instance when it changes.
- Emit as a versioned string: `wasmcode-v1-<16-hex>`.

## Runtime decision policy

Memory decision:

- If there is no current memory: recreate (`no-instance`).
- If memory size differs: recreate (`memory-size-changed`).
  - Do not attempt `memory.grow` (memory size changes typically correspond to loading a new project, and `maximum` must match exactly).
- Else if layout signature differs: recreate (`memory-structure-changed`).
- Else: reuse.

Instance decision:

- If there is no current instance: recreate (`no-instance`).
- Else if memory was recreated: recreate (`memory-recreated`) (new memory import => must re-instantiate).
- Else if code checksum differs: recreate (`code-changed`).
- Else: reuse.

## Implementation plan (current)

1. Inspect compiler `compiledModules` output (done).
2. Specify canonical ordered layout bytes (pending).
3. Add `FNV-1a 64-bit` layout checksum to compiler output (pending).
4. Add `FNV-1a 64-bit` code checksum for `codeBuffer` (pending).
5. Plumb checksums into runtime decisions (`compileAndUpdateMemory`) (pending).
6. Update result type and tests (pending).
