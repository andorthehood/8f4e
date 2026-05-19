import type { ASTCacheStats } from './cache';
import type { CompiledFunctionLookup, CompiledModuleLookup } from './compiled';

export type MemoryReinitReason =
	| { kind: 'no-instance' }
	| { kind: 'memory-size-changed'; prevBytes: number; nextBytes: number }
	| { kind: 'memory-structure-changed' };

export type MemoryAction = { action: 'reused' } | { action: 'recreated'; reason: MemoryReinitReason };

export type GetOrCreateMemoryResult = {
	memoryRef: WebAssembly.Memory;
	memoryAction: MemoryAction;
};

export type MemoryRefsByRegion = Record<string, WebAssembly.Memory>;

export type GetOrCreateWasmInstanceResult = {
	wasmInstanceRef: WebAssembly.Instance;
	hasWasmInstanceBeenReset: boolean;
};

export type CompileAndUpdateMemoryResult = {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
	allocatedMemoryBytes: number;
	allocatedMemoryBytesByRegion?: Record<string, number>;
	astCacheStats: ASTCacheStats;
	memoryRef: WebAssembly.Memory;
	memoryRefsByRegion?: MemoryRefsByRegion;
	hasWasmInstanceBeenReset: boolean;
	memoryAction: MemoryAction;
	initOnlyReran: boolean;
};
