import compile from '@8f4e/compiler';
import { type IncludeSourceResolverAsync, resolveIncludeSourceTreeAsync } from '@8f4e/include-resolver';
import type {
	CompiledModuleLookup,
	CompileInput,
	CompileOptions,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';
import {
	getDocumentProjectBlockType,
	prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync,
} from '@8f4e/project-preparser';
import { resolveStdlibInclude } from '../shared/stdlibResolver';
import type { ProjectBlock } from '../shared/types';

export interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	resolveInclude?: IncludeSourceResolverAsync;
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

function createIncludeResolutionSource(blocks: readonly ProjectBlock[]): string {
	return blocks
		.filter(block => !block.disabled)
		.filter(block => getDocumentProjectBlockType(block.code) === 'includes')
		.flatMap(block => block.code)
		.join('\n\n');
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
	const includeSourceTree = await resolveIncludeSourceTreeAsync(
		createIncludeResolutionSource(blocks),
		options.resolveInclude ?? resolveStdlibInclude
	);
	const compilerInput = await prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync(
		blocks,
		includeSourceTree
	);

	return compileCompilerInput(compilerInput, options);
}
