/**
 * Types for program-compiler feature - WebAssembly compilation and management.
 */

import type { CompiledModuleLookup, CompiledFunctionLookup } from '@8f4e/compiler';
import type { CompileAndUpdateMemoryResult } from '@8f4e/compiler-worker/types';

/**
 * Compiler state tracking compilation progress and results.
 */
export interface Compiler {
	compilationTime: number;
	isCompiling: boolean;
	lastCompilationStart: number;
	byteCodeSize: number;
	compiledModules: CompiledModuleLookup;
	allocatedMemorySize: number;
	compiledFunctions?: CompiledFunctionLookup;
	hasMemoryBeenReinitialized: boolean;
}

/**
 * Result of a compilation operation.
 */
export interface CompilationResult extends Omit<CompileAndUpdateMemoryResult, 'memoryRef'> {
	byteCodeSize: number;
}
