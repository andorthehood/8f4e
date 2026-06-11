import compile from '@8f4e/compiler';
import type { CompiledModuleLookup, CompileOptions } from '@8f4e/compiler-spec';
import { type ProjectIncludeResolverAsync, prepareCompilerInputFromProjectBlocksAsync } from '@8f4e/project-preparser';
import { resolveStdlibInclude } from '../shared/stdlibResolver';
import type { ProjectBlock } from '../shared/types';

interface CompileProjectModulesOptions {
	compilerOptions: CompileOptions;
	includeModules?: boolean;
	includeWasm?: boolean;
	resolveInclude?: ProjectIncludeResolverAsync;
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

export default async function compileProjectModules(
	blocks: ProjectBlock[],
	options: CompileProjectModulesOptions
): Promise<CompileProjectModulesResult> {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;
	const compilerInput = await prepareCompilerInputFromProjectBlocksAsync(blocks, {
		resolveInclude: options.resolveInclude ?? resolveStdlibInclude,
	});

	if (!hasModuleBlocks(compilerInput.entries) && compilerInput.constants.length === 0) {
		return {
			compiledModules: includeModules ? {} : undefined,
			compiledWasm: includeWasm ? '' : undefined,
			requiredMemoryBytes: 0,
		};
	}

	const result = compile(compilerInput, options.compilerOptions);

	return {
		compiledModules: includeModules ? result.compiledModules : undefined,
		compiledWasm: includeWasm ? Buffer.from(result.codeBuffer).toString('base64') : undefined,
		requiredMemoryBytes: result.requiredMemoryBytes,
		requiredMemoryBytesByRegion: result.requiredMemoryBytesByRegion,
	};
}
