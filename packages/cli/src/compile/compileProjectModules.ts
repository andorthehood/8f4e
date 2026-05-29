import compile from '@8f4e/compiler';
import { compileToAST, getProjectBlockType, pickProjectCompilerBlocks } from '@8f4e/tokenizer';

import type { AssertionMetadata, CompileOptions, CompiledModuleLookup } from '@8f4e/compiler-spec';
import type { ProjectCodeBlock } from '../shared/types';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	includeMocks?: boolean;
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

function isMockBlock(block: ProjectCodeBlock): boolean {
	const blockType = getProjectBlockType(block.code);
	if (blockType !== 'module' && blockType !== 'function' && blockType !== 'constants') {
		return false;
	}

	return compileToAST(block.code).lines.some(line => line.instruction === '#mock');
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
	const includeMocks = options.includeMocks ?? false;
	const compilerBlocks = includeMocks ? blocks : blocks.filter(block => block.disabled || !isMockBlock(block));
	const { groups, constantsBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(compilerBlocks);

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
