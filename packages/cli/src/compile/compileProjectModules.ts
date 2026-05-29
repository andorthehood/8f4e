import compile from '@8f4e/compiler';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';

import type { CompileOptions, CompiledModuleLookup, TestAssertionMetadata } from '@8f4e/compiler-spec';
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
	testAssertions?: TestAssertionMetadata[];
}

export default function compileProjectModules(
	blocks: ProjectCodeBlock[],
	options: CompileProjectModulesOptions
): CompileProjectModulesResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;
	const { moduleBlocks, functionBlocks, macroBlocks } = pickProjectCompilerBlocks(blocks);

	if (moduleBlocks.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			requiredMemoryBytes: 0,
			testAssertions: [],
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
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
		testAssertions: result.testAssertions ?? [],
	};
}
