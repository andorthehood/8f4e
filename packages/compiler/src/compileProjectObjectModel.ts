import type {
	CompileOptions,
	CompileResult,
	CompilerCache,
	ProjectObjectModel,
	SourceMetadata,
} from '@8f4e/language-spec';
import { compileSubProgram, createCompilerCache } from '@8f4e/sub-program/internal';
import { emitWasmProgram } from '@8f4e/wasm-codegen';

type CompilerDerivedSource = {
	code: string[];
	projectBlockId?: number;
	source?: SourceMetadata;
};

/** Synchronous compiler stage used after asynchronous project dependencies have been resolved. */
export function compileProjectObjectModel(
	project: ProjectObjectModel,
	options: CompileOptions,
	cache: CompilerCache = createCompilerCache(),
	includedFunctions: readonly CompilerDerivedSource[] = []
): CompileResult {
	return emitWasmProgram(compileSubProgram(project, options, cache, includedFunctions), options);
}
