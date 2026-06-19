import { resolveIncludeSourceTreeAsync } from '@8f4e/include-resolver';
import type { CompileOptions } from '@8f4e/language-spec';
import { prepareCompilerInputFromProjectSourceTreeAsync } from '@8f4e/project-preparser';
import parse8f4eToProject from '../shared/parse8f4e';
import { resolveStdlibInclude } from '../shared/stdlibResolver';
import type { CompileProjectOptions, CompileProjectResult, ProjectDocument } from '../shared/types';
import compileProjectModules, { type CompileProjectModulesResult, compileCompilerInput } from './compileProjectModules';

function resolveCompilerOptions(options: CompileProjectOptions): CompileOptions {
	return {
		startingMemoryWordAddress: options.compilerOptions?.startingMemoryWordAddress ?? 0,
		disableSharedMemory: options.compilerOptions?.disableSharedMemory,
	};
}

function toCompileProjectResult(
	project: ProjectDocument,
	compilerOptions: CompileOptions,
	moduleResult: CompileProjectModulesResult,
	options: CompileProjectOptions
): CompileProjectResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;

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

export async function compileProject(
	project: ProjectDocument,
	options: CompileProjectOptions = {}
): Promise<CompileProjectResult> {
	const compilerOptions = resolveCompilerOptions(options);
	const moduleResult = await compileProjectModules([...project.codeBlocks, ...(options.extraCodeBlocks ?? [])], {
		compilerOptions,
		resolveInclude: options.resolveInclude,
	});

	return toCompileProjectResult(project, compilerOptions, moduleResult, options);
}

export async function compileProjectSource(
	source: string,
	options: CompileProjectOptions = {}
): Promise<CompileProjectResult> {
	const compilerOptions = resolveCompilerOptions(options);
	const sourceTree = await resolveIncludeSourceTreeAsync(source, options.resolveInclude ?? resolveStdlibInclude);
	const project = parse8f4eToProject(sourceTree.source);
	const compilerInput = await prepareCompilerInputFromProjectSourceTreeAsync(sourceTree, {
		extraBlocks: options.extraCodeBlocks,
	});
	const moduleResult = compileCompilerInput(compilerInput, { compilerOptions });

	return toCompileProjectResult(project, compilerOptions, moduleResult, options);
}
