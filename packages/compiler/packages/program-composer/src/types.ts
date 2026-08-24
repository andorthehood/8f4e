import type {
	CompilerCache,
	SourceMetadata,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';

/** Stable traversal key for one project in a recursive object-model tree. */
export type ProjectUnitKey = string;

/** Function source produced by resolving a project's include blocks. */
export type CompilerDerivedSource = {
	code: string[];
	projectBlockId?: number;
	source?: SourceMetadata;
};

/** Include expansions keyed by the recursive project unit that owns them. */
export type IncludedFunctionsByProjectUnit = ReadonlyMap<ProjectUnitKey, readonly CompilerDerivedSource[]>;

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
	cache: CompilerCache;
}
