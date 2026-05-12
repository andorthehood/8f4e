import compile from '@8f4e/compiler';
import { compiledModuleBlockTypes, documentBlockInstructionByType } from '@8f4e/compiler-spec';

import getBlockType from '../shared/getBlockType';

import type { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler-spec';
import type { ProjectCodeBlock } from '../shared/types';

const compiledModuleBlockTypeSet = new Set<string>(compiledModuleBlockTypes);
const functionBlockType = documentBlockInstructionByType.function.type;
const macroBlockType = documentBlockInstructionByType.macro.type;

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	includeModules?: boolean;
	includeWasm?: boolean;
}

interface CompileProjectModulesResult {
	compiledModules?: CompiledModuleLookup;
	compiledWasm?: string;
	requiredMemoryBytes?: number;
}

export default function compileProjectModules(
	blocks: ProjectCodeBlock[],
	options: CompileProjectModulesOptions
): CompileProjectModulesResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;

	const moduleBlocks: Module[] = [];
	const functionBlocks: Module[] = [];
	const macroBlocks: Module[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getBlockType(block.code);
		if (compiledModuleBlockTypeSet.has(blockType)) {
			moduleBlocks.push({ code: block.code });
			continue;
		}
		if (blockType === functionBlockType) {
			functionBlocks.push({ code: block.code });
			continue;
		}
		if (blockType === macroBlockType) {
			macroBlocks.push({ code: block.code });
		}
	}

	if (moduleBlocks.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			requiredMemoryBytes: 0,
		};
	}

	const result = compile(
		moduleBlocks,
		options.compilerOptions,
		functionBlocks.length > 0 ? functionBlocks : undefined,
		macroBlocks.length > 0 ? macroBlocks : undefined
	);

	return {
		compiledModules: includeModules ? result.compiledModules : undefined,
		compiledWasm: includeWasm ? Buffer.from(result.codeBuffer).toString('base64') : undefined,
		requiredMemoryBytes: result.requiredMemoryBytes,
	};
}
