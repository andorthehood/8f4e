import type {
	CompiledFunctionLookup,
	CompiledModuleLookup,
	CompileOptions,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';
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
	extraCodeBlocks?: ProjectBlock[];
}

export interface CompileProjectResult {
	outputProject: Record<string, unknown>;
	compilerOptions?: CompileOptions;
	compiledModules: CompiledModuleLookup;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	compiledFunctions?: CompiledFunctionLookup;
	compiledWasm: string;
	requiredMemoryBytes: number;
	requiredMemoryBytesByRegion?: Record<string, number>;
}

export type BlockTypeValue = ProjectBlockType;
