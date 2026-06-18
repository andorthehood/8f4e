import type { ASTCacheStats } from './cache';
import type { CompiledFunctionLookup, CompiledModuleLookup } from './compiled';
import type { MemoryDefaults, MemoryLayoutPlan, MemoryPointerMetadataMap } from './memory';

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
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	requiredMemoryBytes: number;
	allocatedMemoryBytes: number;
	astCacheStats: ASTCacheStats;
	memoryRef: WebAssembly.Memory;
	hasWasmInstanceBeenReset: boolean;
	memoryAction: MemoryAction;
	initOnlyReran: boolean;
};
