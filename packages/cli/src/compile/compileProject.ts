import type { CompileOptions } from '@8f4e/language-spec';
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
		resolveInclude: options.resolveInclude,
	});

	const outputProject: Record<string, unknown> = { ...project };
	if (includeModules) {
		outputProject.compiledModules = moduleResult.compiledModules;
		outputProject.memoryPlan = moduleResult.memoryPlan;
		outputProject.memoryDefaultsByModuleId = moduleResult.memoryDefaultsByModuleId;
		outputProject.pointerMetadataByModuleId = moduleResult.pointerMetadataByModuleId;
	}
	if (includeWasm) {
		outputProject.compiledWasm = moduleResult.compiledWasm;
	}

	return {
		outputProject,
		compilerOptions,
		compiledModules: moduleResult.compiledModules,
		memoryPlan: moduleResult.memoryPlan,
		memoryDefaultsByModuleId: moduleResult.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: moduleResult.pointerMetadataByModuleId,
		compiledFunctions: undefined,
		compiledWasm: moduleResult.compiledWasm,
		requiredMemoryBytes: moduleResult.requiredMemoryBytes,
		requiredMemoryBytesByRegion: moduleResult.requiredMemoryBytesByRegion,
	};
}
