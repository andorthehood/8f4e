import type {
	CompilerCache,
	ProjectGroupPath,
	ProjectMemoryExposure,
	ProjectModuleId,
	SourceMetadata,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';

/** Function source produced by resolving a project's include blocks. */
export type CompilerDerivedSource = {
	code: string[];
	projectBlockId?: number;
	source?: SourceMetadata;
};

/** Include expansions keyed by the canonical path of the project group that owns them. */
export type IncludedFunctionsByProjectGroupPath = ReadonlyMap<ProjectGroupPath, readonly CompilerDerivedSource[]>;

/** A group memory exposure with its canonical group and backing-module identities. */
export interface ComposedProjectMemoryExposure extends ProjectMemoryExposure {
	groupPath: ProjectGroupPath;
	targetModuleId: ProjectModuleId;
}

/** One globally planned AST assembled from a recursive project tree. */
export interface ComposedProgram {
	entryNames: string[];
	moduleEntryNames: string[];
	ast: {
		prototypes: ValidatedPrototypeAST[];
		modules: ValidatedModuleAST[];
		constants: ValidatedConstantsAST[];
		functions: ValidatedFunctionAST[];
	};
	memoryExposures: ComposedProjectMemoryExposure[];
	cache: CompilerCache;
}
