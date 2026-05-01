/**
 * Types for program-compiler feature - WebAssembly compilation and management.
 */

import type {
	CompileAndUpdateMemoryResult,
	CompiledFunctionLookup,
	CompiledModuleMetadataLookup,
} from '@8f4e/compiler-types';

/**
 * Compiler state tracking compilation progress and results.
 */
export interface Compiler {
	compilationTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	byteCodeSize: number;
	compiledModules: CompiledModuleMetadataLookup;
	requiredMemoryBytes: number;
	allocatedMemoryBytes: number;
	compiledFunctions?: CompiledFunctionLookup;
	hasMemoryBeenReinitialized: boolean;
}

/**
 * Result of a compilation operation.
 */
export interface CompilationResult extends Omit<CompileAndUpdateMemoryResult, 'memoryRef'> {
	byteCodeSize: number;
}
