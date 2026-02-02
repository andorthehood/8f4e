import compile, { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler';

import getBlockType from '../shared/getBlockType';

import type { ProjectCodeBlock } from '../shared/types';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	includeModules?: boolean;
	includeWasm?: boolean;
}

interface CompileProjectModulesResult {
	compiledModules?: CompiledModuleLookup;
	compiledWasm?: string;
	allocatedMemorySize?: number;
}

export default function compileProjectModules(
	blocks: ProjectCodeBlock[],
	options: CompileProjectModulesOptions
): CompileProjectModulesResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;

	const moduleBlocks: Module[] = [];
	const functionBlocks: Module[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getBlockType(block.code);
		if (blockType === 'module' || blockType === 'constants') {
			moduleBlocks.push({ code: block.code });
			continue;
		}
		if (blockType === 'function') {
			functionBlocks.push({ code: block.code });
		}
	}

	if (moduleBlocks.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			allocatedMemorySize: 0,
		};
	}

	const result = compile(moduleBlocks, options.compilerOptions, functionBlocks.length > 0 ? functionBlocks : undefined);

	return {
		compiledModules: includeModules ? result.compiledModules : undefined,
		compiledWasm: includeWasm ? Buffer.from(result.codeBuffer).toString('base64') : undefined,
		allocatedMemorySize: result.allocatedMemorySize,
	};
}
