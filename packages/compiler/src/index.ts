import type { CompileProjectOptions, CompileResult, ProjectObjectModel } from '@8f4e/language-spec';
import { parseProjectSource, resolveProjectIncludesAsync } from '@8f4e/project-preparser';
import { createCompilerCache } from '@8f4e/sub-program';
import { deriveEffectiveMemorySize } from '@8f4e/wasm-codegen';
import { compileProjectObjectModel } from './compileProjectObjectModel';

export { serializeDiagnostic } from './diagnostic';
export { deriveEffectiveMemorySize, parseProjectSource };

/** Compiles a canonical project object directly into one complete WebAssembly program. */
export async function compileProject(
	project: ProjectObjectModel,
	options: CompileProjectOptions = {}
): Promise<CompileResult> {
	const { resolveInclude, cache = createCompilerCache(), ...compilerOptions } = options;
	const includedFunctions = await resolveProjectIncludesAsync(project.includes, resolveInclude ?? (() => undefined));
	return compileProjectObjectModel(project, compilerOptions, cache, includedFunctions);
}
