import type { CompileOptions } from '@8f4e/compiler-spec';
import type { CompileProjectOptions, CompileProjectResult, ProjectDocument } from '../shared/types';
import compileProjectModules from './compileProjectModules';

export async function compileProject(
	project: ProjectDocument,
	options: CompileProjectOptions = {}
): Promise<CompileProjectResult> {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;

	const compilerOptions: CompileOptions = {
		startingMemoryWordAddress: options.compilerOptions?.startingMemoryWordAddress ?? 0,
		disableSharedMemory: options.compilerOptions?.disableSharedMemory,
	};

	const moduleResult = await compileProjectModules(project.codeBlocks, {
		compilerOptions,
		includeModules,
		includeWasm,
		resolveInclude: options.resolveInclude,
	});

	const outputProject: Record<string, unknown> = { ...project };
	if (includeModules && moduleResult.compiledModules !== undefined) {
		outputProject.compiledModules = moduleResult.compiledModules;
	}
	if (includeWasm && moduleResult.compiledWasm !== undefined) {
		outputProject.compiledWasm = moduleResult.compiledWasm;
	}

	return {
		outputProject,
		compilerOptions,
		compiledModules: moduleResult.compiledModules,
		compiledFunctions: undefined,
		compiledWasm: moduleResult.compiledWasm,
		requiredMemoryBytes: moduleResult.requiredMemoryBytes,
		requiredMemoryBytesByRegion: moduleResult.requiredMemoryBytesByRegion,
	};
}
