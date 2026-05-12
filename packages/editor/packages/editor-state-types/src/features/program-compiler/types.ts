/**
 * Types for program-compiler feature - WebAssembly compilation and management.
 */

import type { CompileAndUpdateMemoryResult, CompiledFunctionLookup, CompiledModuleLookup } from '@8f4e/compiler-spec';

/**
 * Compiler state tracking compilation progress and results.
 */
export interface Compiler {
	isCompiling: boolean;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
}

/**
 * Result of a compilation operation.
 */
export interface CompilationResult extends Omit<CompileAndUpdateMemoryResult, 'memoryRef'> {
	byteCodeSize: number;
}
