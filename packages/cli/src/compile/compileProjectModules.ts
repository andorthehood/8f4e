import compile from '@8f4e/compiler';
import type {
	CompiledModuleLookup,
	CompileOptions,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';
import { type ProjectIncludeResolverAsync, prepareCompilerInputFromProjectBlocksAsync } from '@8f4e/project-preparser';
import { resolveStdlibInclude } from '../shared/stdlibResolver';
import type { ProjectBlock } from '../shared/types';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	resolveInclude?: ProjectIncludeResolverAsync;
}

interface CompileProjectModulesResult {
	compiledModules: CompiledModuleLookup;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	compiledWasm: string;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
}

function hasModuleBlocks(entries: Record<string, unknown[]>): boolean {
	return Object.values(entries).some(entry => entry.length > 0);
}

export default async function compileProjectModules(
	blocks: ProjectBlock[],
	options: CompileProjectModulesOptions
): Promise<CompileProjectModulesResult> {
	const compilerInput = await prepareCompilerInputFromProjectBlocksAsync(blocks, {
		resolveInclude: options.resolveInclude ?? resolveStdlibInclude,
	});

	if (!hasModuleBlocks(compilerInput.entries) && compilerInput.constants.length === 0) {
		return {
			compiledModules: {},
			memoryPlan: { modules: {}, moduleList: [], nextByteAddressByMemoryIndex: {} },
			memoryDefaultsByModuleId: {},
			pointerMetadataByModuleId: {},
			compiledWasm: '',
			requiredMemoryBytes: 0,
		};
	}

	const result = compile(compilerInput, options.compilerOptions);

	return {
		compiledModules: result.compiledModules,
		memoryPlan: result.memoryPlan,
		memoryDefaultsByModuleId: result.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: result.pointerMetadataByModuleId,
		compiledWasm: Buffer.from(result.codeBuffer).toString('base64'),
		requiredMemoryBytes: result.requiredMemoryBytes,
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
	};
}
