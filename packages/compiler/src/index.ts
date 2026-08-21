import type { CompileOptions, CompileResult, SubProgramSource } from '@8f4e/language-spec';
import { compileSubProgram, createCompilerCache } from '@8f4e/sub-program';
import { deriveEffectiveMemorySize, emitWasmProgram } from '@8f4e/wasm-codegen';

export { serializeDiagnostic } from './diagnostic';
export { deriveEffectiveMemorySize };

/**
 * Compiles source input into a complete WebAssembly binary program.
 *
 * @param input - Compiler input program to process.
 * @param options - Compiler options for the operation.
 * @param cache - Optional compiler cache used to reuse parsed artifacts.
 * @returns Compiled WebAssembly program and related metadata.
 */
export default function compile(
	input: SubProgramSource,
	options: CompileOptions,
	cache = createCompilerCache()
): CompileResult {
	return emitWasmProgram(compileSubProgram(input, options, cache), options);
}
