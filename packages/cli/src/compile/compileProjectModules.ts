import compile from '@8f4e/compiler';
import type {
	CompiledModuleLookup,
	CompileInput,
	CompileOptions,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';
import { prepareCompilerInputFromProjectBlocksAsync } from '@8f4e/project-preparser';
import type { ProjectBlock } from '../shared/types';

export interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
}

export interface CompileProjectModulesResult {
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

export function compileCompilerInput(
	compilerInput: CompileInput,
	options: Pick<CompileProjectModulesOptions, 'compilerOptions'>
): CompileProjectModulesResult {
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

export default async function compileProjectModules(
	blocks: ProjectBlock[],
	options: CompileProjectModulesOptions
): Promise<CompileProjectModulesResult> {
	const compilerInput = await prepareCompilerInputFromProjectBlocksAsync(blocks);

	return compileCompilerInput(compilerInput, options);
}
