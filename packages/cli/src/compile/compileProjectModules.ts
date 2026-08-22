import { compileProject } from '@8f4e/compiler';
import type {
	CompiledFunctionLookup,
	CompiledModuleLookup,
	CompileOptions,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	ProjectIncludeResolver,
	ProjectObjectModel,
} from '@8f4e/language-spec';
import { resolveStdlibInclude } from '../shared/stdlibResolver';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	resolveInclude?: ProjectIncludeResolver;
}

interface CompileProjectModulesResult {
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	compiledWasm: string;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
}

export default async function compileProjectModules(
	project: ProjectObjectModel,
	options: CompileProjectModulesOptions
): Promise<CompileProjectModulesResult> {
	if (!project.modules.some(block => !block.disabled) && !project.constants.some(block => !block.disabled)) {
		return {
			compiledModules: {},
			memoryPlan: { modules: {}, moduleList: [], nextByteAddressByMemoryIndex: {} },
			memoryDefaultsByModuleId: {},
			pointerMetadataByModuleId: {},
			compiledWasm: '',
			requiredMemoryBytes: 0,
		};
	}

	const result = await compileProject(project, {
		...options.compilerOptions,
		resolveInclude: options.resolveInclude ?? resolveStdlibInclude,
	});

	return {
		compiledModules: result.compiledModules,
		compiledFunctions: result.compiledFunctions,
		memoryPlan: result.memoryPlan,
		memoryDefaultsByModuleId: result.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: result.pointerMetadataByModuleId,
		compiledWasm: Buffer.from(result.codeBuffer).toString('base64'),
		requiredMemoryBytes: result.requiredMemoryBytes,
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
	};
}
