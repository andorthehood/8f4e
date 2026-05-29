import compile from '@8f4e/compiler';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';

import type { AssertionMetadata, CompileOptions, CompiledModuleLookup } from '@8f4e/compiler-spec';
import type { ProjectCodeBlock } from '../shared/types';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	includeModules?: boolean;
	includeWasm?: boolean;
}

interface CompileProjectModulesResult {
	compiledModules?: CompiledModuleLookup;
	compiledWasm?: string;
	requiredMemoryBytes?: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
	assertions?: AssertionMetadata[];
}

function hasModuleBlocks(groups: Record<string, unknown[]>): boolean {
	return Object.values(groups).some(group => group.length > 0);
}

export default function compileProjectModules(
	blocks: ProjectCodeBlock[],
	options: CompileProjectModulesOptions
): CompileProjectModulesResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;
	const { groups, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(blocks);

	if (!hasModuleBlocks(groups) && constantsBlocks.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			requiredMemoryBytes: 0,
			assertions: [],
		};
	}

	const result = compile(
		{
			groups,
			constants: constantsBlocks,
			functions: functionBlocks,
			macros: macroBlocks,
		},
		options.compilerOptions
	);

	return {
		compiledModules: includeModules ? result.compiledModules : undefined,
		compiledWasm: includeWasm ? Buffer.from(result.codeBuffer).toString('base64') : undefined,
		requiredMemoryBytes: result.requiredMemoryBytes,
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
		assertions: result.assertions ?? [],
	};
}
