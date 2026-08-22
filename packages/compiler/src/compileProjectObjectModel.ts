import type { CompileOptions, CompileResult, CompilerCache, Module, ProjectObjectModel } from '@8f4e/language-spec';
import { compileSubProgram, createCompilerCache } from '@8f4e/sub-program';
import { emitWasmProgram } from '@8f4e/wasm-codegen';

/** Synchronous compiler stage used after asynchronous project dependencies have been resolved. */
export function compileProjectObjectModel(
	project: ProjectObjectModel,
	options: CompileOptions,
	cache: CompilerCache = createCompilerCache(),
	includedFunctions: readonly Module[] = []
): CompileResult {
	return emitWasmProgram(compileSubProgram(project, options, cache, includedFunctions), options);
}
