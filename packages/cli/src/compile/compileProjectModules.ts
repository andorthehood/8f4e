import compile from '@8f4e/compiler';
import type { CompiledModuleLookup, CompileOptions } from '@8f4e/compiler-spec';
import { pickProjectCompilerBlocks } from '@8f4e/tokenizer';
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
}

function hasModuleBlocks(entries: Record<string, unknown[]>): boolean {
	return Object.values(entries).some(entry => entry.length > 0);
}

export default function compileProjectModules(
	blocks: ProjectCodeBlock[],
	options: CompileProjectModulesOptions
): CompileProjectModulesResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;
	const { entries, constantsBlocks, functionBlocks, prototypeBlocks } = pickProjectCompilerBlocks({
		codeBlocks: blocks,
		groups: [],
	});

	if (!hasModuleBlocks(entries) && constantsBlocks.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			requiredMemoryBytes: 0,
		};
	}

	const result = compile(
		{
			entries,
			constants: constantsBlocks,
			functions: functionBlocks,
			prototypes: prototypeBlocks,
		},
		options.compilerOptions
	);

	return {
		compiledModules: includeModules ? result.compiledModules : undefined,
		compiledWasm: includeWasm ? Buffer.from(result.codeBuffer).toString('base64') : undefined,
		requiredMemoryBytes: result.requiredMemoryBytes,
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
	};
}
