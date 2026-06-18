/**
 * Types for program-compiler feature - WebAssembly compilation and management.
 */

import type {
	CompileAndUpdateMemoryResult,
	CompiledFunctionLookup,
	CompiledModuleLookup,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';

/**
 * Compiler state tracking compilation progress and results.
 */
export interface Compiler {
	isCompiling: boolean;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
}

/**
 * Result of a compilation operation.
 */
export interface CompilationResult extends Omit<CompileAndUpdateMemoryResult, 'memoryRef'> {
	byteCodeSize: number;
}
