import type { CompileOptions, CompiledFunctionLookup, CompiledModuleMetadataLookup } from '@8f4e/compiler-types';

export interface ProjectCodeBlock {
	code: string[];
	disabled?: boolean;
}

export interface ProjectInput {
	codeBlocks: ProjectCodeBlock[];
	[key: string]: unknown;
}

export interface CompileProjectOptions {
	compilerOptions?: Partial<CompileOptions>;
	includeModules?: boolean;
	includeWasm?: boolean;
	includeFunctions?: boolean;
}

export interface CompileProjectResult {
	outputProject: Record<string, unknown>;
	compilerOptions?: CompileOptions;
	compiledModules?: CompiledModuleMetadataLookup;
	compiledFunctions?: CompiledFunctionLookup;
	compiledWasm?: string;
	requiredMemoryBytes?: number;
}

export type BlockType = 'module' | 'function' | 'constants' | 'macro' | 'unknown';
