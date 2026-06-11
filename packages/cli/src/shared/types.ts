import type { CompiledFunctionLookup, CompiledModuleLookup, CompileOptions } from '@8f4e/compiler-spec';
import type {
	ProjectBlock,
	ProjectBlockType,
	ProjectDocument,
	ProjectIncludeResolverAsync,
} from '@8f4e/project-preparser';

export type { ProjectBlock, ProjectDocument };

export interface CompileProjectOptions {
	compilerOptions?: Partial<CompileOptions>;
	includeModules?: boolean;
	includeWasm?: boolean;
	includeFunctions?: boolean;
	resolveInclude?: ProjectIncludeResolverAsync;
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
