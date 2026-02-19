import type { CompiledFunctionLookup, CompiledModuleLookup } from '@8f4e/compiler';

export type MemoryReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'memory-size-changed'; prevBytes: number; nextBytes: number }
	| { kind: 'memory-structure-changed' };

export type MemoryAction = { action: 'reused' } | { action: 'recreated'; reason: MemoryReinitReason };

export type GetOrCreateMemoryResult = {
	memoryRef: WebAssembly.Memory;
	memoryAction: MemoryAction;
};

export type GetOrCreateWasmInstanceResult = {
	wasmInstanceRef: WebAssembly.Instance;
	hasWasmInstanceBeenReset: boolean;
};

export type CompileAndUpdateMemoryResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	allocatedMemorySize: number;
	memoryRef: WebAssembly.Memory;
	hasWasmInstanceBeenReset: boolean;
	memoryAction: MemoryAction;
	initOnlyReran: boolean;
};

export type MemoryValueChange = {
	wordAlignedSize: number;
	wordAlignedAddress: number;
	value: number | Record<string, number>;
	isInteger: boolean;
};
