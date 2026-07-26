import type { CompileOptions, CompiledFunctionLookup, CompiledModuleLookup } from '@8f4e/compiler-spec';
import type { ProjectBlockType, ProjectCodeBlock, ProjectInput } from '@8f4e/tokenizer';

export type { ProjectCodeBlock, ProjectInput };

export interface CompileProjectOptions {
	compilerOptions?: Partial<CompileOptions>;
	includeModules?: boolean;
	includeWasm?: boolean;
	includeFunctions?: boolean;
}

export interface CompileProjectResult {
	outputProject: Record<string, unknown>;
	compilerOptions?: CompileOptions;
	compiledModules?: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	compiledWasm?: string;
	requiredMemoryBytes?: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
}

export type BlockTypeValue = ProjectBlockType;
