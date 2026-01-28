import type { CompileOptions, CompiledFunctionLookup, CompiledModuleLookup } from '@8f4e/compiler';

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
	configType?: string;
	defaultProjectConfig?: Record<string, unknown>;
	includeConfig?: boolean;
	includeModules?: boolean;
	includeWasm?: boolean;
	includeFunctions?: boolean;
}

export interface CompileProjectResult {
	outputProject: Record<string, unknown>;
	compiledProjectConfig?: Record<string, unknown>;
	compilerOptions?: CompileOptions;
	compiledModules?: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	compiledWasm?: string;
	allocatedMemorySize?: number;
	configSource: string;
}

export type BlockType = 'config' | 'module' | 'function' | 'constants' | 'unknown';
