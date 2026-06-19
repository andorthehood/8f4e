import { ConstantResolverError, type ResolveConstantsProjectAST, resolveConstants } from '@8f4e/constant-resolver';
import type {
	CompiledFunction,
	CompiledModule,
	CompileInput,
	CompileOptions,
	CompilerCache,
	FunctionMetadata,
	FunctionMetadataLookup,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	Module,
	ValidatedAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { createFunctionId, ErrorCode, getEffectiveFunctionMetadata, getError } from '@8f4e/language-spec';
import { MemoryDefaultResolverError, resolveMemoryDefaults } from '@8f4e/memory-default-resolver';
import { MemoryPlannerError, planProjectMemoryLayout } from '@8f4e/memory-planner';
import { resolveMemoryReferences } from '@8f4e/memory-reference-resolver';
import { resolveSemanticReferences } from '@8f4e/semantic-reference-resolver';
import { analyzeStack } from '@8f4e/stack-analyzer';
import { compileToAST, createASTCache, SyntaxRulesError } from '@8f4e/tokenizer';
import { compileFunction, compileModules } from '@8f4e/wasm-codegen';
import {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';

/** Module source paired with cache and execution-entry metadata. */
type ModuleCompilerSource = {
	/** Source lines to parse. */
	code: string[];
	/** Stable cache namespace for the source lines. */
	cacheKey: string;
	/** Public entry that should dispatch to the compiled module. */
	entryName: string;
	/** Project code block creation index that produced this source, when compiling a project. */
	projectBlockId?: number;
	/** Source origin metadata for blocks expanded before compilation. */
	source?: Module['source'];
};

type CompilerSource = {
	code: string[];
	cacheKey: string;
	projectBlockId?: number;
	source?: Module['source'];
};

/** Compiled units and layout metadata for one independently compiled source program. */
export type CompiledSubProgram = {
	/** Public entry names generated for this source program. */
	entryNames: string[];
	/** Compiled module bodies in source order. */
	compiledModules: CompiledModule[];
	/** Compiled user functions in source order. */
	compiledFunctions: CompiledFunction[];
	/** Function type table accumulated while compiling calls and definitions. */
	functionTypeRegistry: FunctionTypeRegistry;
	/** Project memory layout produced by the memory planner. */
	memoryPlan: MemoryLayoutPlan;
	/** Resolved memory defaults keyed by module id. */
	memoryDefaultsByModuleId: ReturnType<typeof resolveMemoryDefaults>['memoryDefaultsByModuleId'];
	/** Resolved pointer metadata keyed by module id. */
	pointerMetadataByModuleId: ReturnType<typeof resolveMemoryDefaults>['pointerMetadataByModuleId'];
	/** Cache instance carrying validated AST entries for this compilation. */
	cache: CompilerCache;
};

/**
 * Creates the default compiler cache used for validated AST reuse.
 *
 * @returns A compiler cache ready to store validated ASTs.
 */
export function createCompilerCache(): CompilerCache {
	return {
		ast: createASTCache<ValidatedAST>(),
	};
}

/** Built-in WebAssembly export names that user functions are not allowed to reuse. */
const RESERVED_EXPORT_NAMES = ['initDefaults'];

/** Creates synthetic metadata for generated entry dispatcher functions. */
function createEntryFunctionMetadata(entryNames: readonly string[], importedFunctionCount: number): FunctionRegistry {
	const byId: FunctionMetadataLookup = {};
	const arityByName: FunctionRegistry['arityByName'] = {};

	entryNames.forEach((entryName, index) => {
		const parameters: FunctionMetadata['signature']['parameters'] = [];
		const metadata: FunctionMetadata = {
			id: createFunctionId(entryName, parameters),
			name: entryName,
			signature: { parameters, returns: [] },
			wasmIndex: importedFunctionCount + 1 + index,
		};
		byId[metadata.id] = metadata;
		arityByName[entryName] = parameters.length;
	});

	return { byId, arityByName };
}

/** Merges function registries while preserving source-name arity metadata. */
function mergeFunctionRegistries(...registries: FunctionRegistry[]): FunctionRegistry {
	const byId: FunctionMetadataLookup = {};
	const arityByName: FunctionRegistry['arityByName'] = {};

	for (const registry of registries) {
		Object.assign(byId, registry.byId);
		Object.assign(arityByName, registry.arityByName);
	}

	return { byId, arityByName };
}

function indexPrototypeShapes(prototypes: readonly ValidatedPrototypeAST[]): Record<string, ValidatedPrototypeAST> {
	return Object.fromEntries(prototypes.map(prototype => [prototype.id, prototype]));
}

function getAstDiagnosticId(ast: ValidatedAST): string | undefined {
	if (ast.type === 'function') {
		return ast.name;
	}

	return ast.id;
}

function getAstDiagnosticContext(ast: ValidatedAST) {
	return {
		codeBlockId: getAstDiagnosticId(ast),
		codeBlockType: ast.type,
		...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
		...(ast.source !== undefined ? { source: ast.source } : {}),
	};
}

function findAstContainingLine(
	projectAst: ResolveConstantsProjectAST,
	line: ValidatedAST['lines'][number]
): ValidatedAST | undefined {
	const groups = [projectAst.prototypes, projectAst.modules, projectAst.constants, projectAst.functions];
	for (const asts of groups) {
		const ast = asts.find(candidate => candidate.lines.includes(line));
		if (ast) {
			return ast;
		}
	}

	return undefined;
}

function wrapConstantResolverError(error: unknown, projectAst: ResolveConstantsProjectAST): unknown {
	if (!(error instanceof ConstantResolverError)) {
		return error;
	}

	const line = error.line;
	if (!line) {
		return error;
	}

	const ast = findAstContainingLine(projectAst, line);
	return getError(ErrorCode.CONSTANT_RESOLUTION_FAILED, line, ast ? getAstDiagnosticContext(ast) : undefined, {
		reason: `${error.detail} (${error.code})`,
	});
}

function wrapMemoryDefaultResolverError(error: unknown, projectAst: ResolveConstantsProjectAST): unknown {
	if (!(error instanceof MemoryDefaultResolverError)) {
		return error;
	}

	const ast = findAstContainingLine(projectAst, error.line);
	return getError(error.compilerErrorCode, error.line, ast ? getAstDiagnosticContext(ast) : undefined, error.details);
}

function wrapMemoryPlannerError(error: unknown, projectAst: ResolveConstantsProjectAST): unknown {
	if (!(error instanceof MemoryPlannerError)) {
		return error;
	}

	const ast = findAstContainingLine(projectAst, error.line);
	return getError(error.compilerErrorCode, error.line, ast ? getAstDiagnosticContext(ast) : undefined, error.details);
}

function attachSourceMetadataToSyntaxError(source: CompilerSource, error: unknown): unknown {
	if (!(error instanceof SyntaxRulesError) || (source.projectBlockId === undefined && source.source === undefined)) {
		return error;
	}

	error.context = {
		...error.context,
		...(source.projectBlockId !== undefined ? { projectBlockId: source.projectBlockId } : {}),
		...(source.source !== undefined ? { source: source.source } : {}),
	};
	return error;
}

function attachSourceMetadataToAst<TAst extends ValidatedAST>(ast: TAst, source: CompilerSource): TAst {
	if (source.projectBlockId === undefined && source.source === undefined) {
		return ast;
	}

	return {
		...ast,
		...(source.projectBlockId !== undefined ? { projectBlockId: source.projectBlockId } : {}),
		...(source.source !== undefined ? { source: source.source } : {}),
	} as TAst;
}

function compileSourceToAST<TAst extends ValidatedAST>(source: CompilerSource, cache: CompilerCache): TAst {
	try {
		const ast = compileToAST(source.code, cache.ast, source.cacheKey) as TAst;
		return attachSourceMetadataToAst(ast, source);
	} catch (error) {
		throw attachSourceMetadataToSyntaxError(source, error);
	}
}

function createCompilerSource(module: Module, cacheKey: string): CompilerSource {
	return {
		code: module.code,
		cacheKey,
		projectBlockId: module.projectBlockId,
		source: module.source,
	};
}

/**
 * Compiles one source program into linkable module, function, memory, and data-segment artifacts.
 *
 * @param input - Compiler input program to compile.
 * @param options - Compiler options for this compilation pass.
 * @param cache - Compiler cache used for reusable validated ASTs.
 * @returns The compiled sub-program artifacts.
 */
export function compileSubProgram(
	input: CompileInput,
	options: CompileOptions,
	cache = createCompilerCache()
): CompiledSubProgram {
	const inputEntryNames = Object.keys(input.entries);
	const entryModules = Object.entries(input.entries).flatMap(([entryName, modules]) =>
		modules.map((module, index) => ({ entryName, module, index }))
	);
	const { constants, functions, prototypes } = input;

	const prototypeSources = prototypes.map((prototype, index) => {
		return createCompilerSource(prototype, `prototype:${index}`);
	});

	const astPrototypes = prototypeSources.map(source => compileSourceToAST<ValidatedPrototypeAST>(source, cache));

	const moduleSources = entryModules.map(({ entryName, module, index }) => {
		return {
			code: module.code,
			cacheKey: `entry:${entryName}:module:${index}`,
			entryName,
			projectBlockId: module.projectBlockId,
			source: module.source,
		};
	}) satisfies ModuleCompilerSource[];

	const constantsSources = constants.map((constantsBlock, index) => {
		return createCompilerSource(constantsBlock, `constants:${index}`);
	});

	const functionSources = functions.map((func, index) => {
		return createCompilerSource(func, `function:${index}`);
	});

	const astModuleEntries = moduleSources.map(source => {
		const ast = compileSourceToAST<ValidatedModuleAST>(source, cache);
		return {
			entryName: source.entryName,
			ast,
		};
	});
	const astConstants = constantsSources.map(source => compileSourceToAST<ValidatedConstantsAST>(source, cache));
	const astFunctions = functionSources.map(source => compileSourceToAST<ValidatedFunctionAST>(source, cache));
	const entryNames = inputEntryNames;
	const astModules = astModuleEntries.map(({ ast }) => ast);
	const moduleEntryNames = astModuleEntries.map(({ entryName }) => entryName);
	assertUniqueModuleIds(astModules);
	const projectAst: ResolveConstantsProjectAST<
		ValidatedPrototypeAST,
		ValidatedModuleAST,
		ValidatedConstantsAST,
		ValidatedFunctionAST
	> = {
		prototypes: astPrototypes,
		modules: astModules,
		constants: astConstants,
		functions: astFunctions,
	};
	let constantResolution: ReturnType<typeof resolveConstants>;
	try {
		constantResolution = resolveConstants({ ast: projectAst });
	} catch (error) {
		throw wrapConstantResolverError(error, projectAst);
	}

	let memoryPlan: ReturnType<typeof planProjectMemoryLayout>;
	try {
		memoryPlan = planProjectMemoryLayout({
			prototypes: projectAst.prototypes,
			modules: projectAst.modules,
			constantReferences: constantResolution.references,
			memoryRegions: options.memoryRegions,
		});
	} catch (error) {
		throw wrapMemoryPlannerError(error, projectAst);
	}
	const memoryReferenceResolution = resolveMemoryReferences({
		ast: projectAst,
		memoryPlan,
		constantReferences: constantResolution.references,
	});
	const prototypeShapesById = indexPrototypeShapes(projectAst.prototypes);
	let memoryDefaultResolution: ReturnType<typeof resolveMemoryDefaults>;
	try {
		memoryDefaultResolution = resolveMemoryDefaults({
			memoryPlan,
			memoryReferences: memoryReferenceResolution.references,
		});
	} catch (error) {
		throw wrapMemoryDefaultResolverError(error, projectAst);
	}

	const namespaces = collectNamespacesFromASTs(projectAst.modules, memoryPlan, memoryDefaultResolution);

	const importedUserFunctionCount = projectAst.functions.filter(ast => ast.importLine).length;
	const importedFunctionCount = importedUserFunctionCount;
	const builtInFunctionCount = 1 + entryNames.length;
	const userDefinedFunctionBaseIndex = importedFunctionCount + builtInFunctionCount;

	const entryFunctionMetadata = createEntryFunctionMetadata(entryNames, importedFunctionCount);
	const userFunctionMetadata = collectFunctionMetadataFromAsts(projectAst.functions, {
		importedFunctionBaseIndex: 0,
		definedFunctionBaseIndex: userDefinedFunctionBaseIndex,
		reservedFunctionIds: entryNames,
		reservedExportNames: [...RESERVED_EXPORT_NAMES, ...entryNames],
		prototypeShapes: prototypeShapesById,
	});
	const functionRegistry = mergeFunctionRegistries(entryFunctionMetadata, userFunctionMetadata);

	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3,
	};
	const semanticReferences = resolveSemanticReferences({
		ast: projectAst,
		namespaces,
		memoryPlan,
		memoryDefaultsByModuleId: memoryDefaultResolution.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: memoryDefaultResolution.pointerMetadataByModuleId,
		constantReferences: constantResolution.references,
		memoryReferences: memoryReferenceResolution.references,
		functions: functionRegistry,
		functionTypeRegistry,
		memoryRegions: options.memoryRegions ?? [],
		prototypeShapes: prototypeShapesById,
	}).references;
	const stackReport = analyzeStack({
		ast: {
			modules: projectAst.modules,
			functions: projectAst.functions,
		},
		semanticReferences,
		namespaces,
		memoryPlan,
		memoryDefaultsByModuleId: memoryDefaultResolution.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: memoryDefaultResolution.pointerMetadataByModuleId,
		functions: functionRegistry,
		functionTypeRegistry,
		memoryRegions: options.memoryRegions ?? [],
		prototypeShapes: prototypeShapesById,
	});

	const compiledFunctions = projectAst.functions.map(ast => {
		const signatureMetadata = getEffectiveFunctionMetadata(ast, prototypeShapesById);
		const functionId = createFunctionId(ast.name, signatureMetadata.signature.parameters);
		return compileFunction(
			ast,
			namespaces,
			functionTypeRegistry,
			functionRegistry,
			semanticReferences.functions[functionId],
			stackReport.functions[functionId],
			options
		);
	});
	const compiledModules = compileModules(
		projectAst.modules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		memoryPlan,
		semanticReferences,
		stackReport,
		functionRegistry,
		functionTypeRegistry,
		prototypeShapesById
	).map((module, index) => ({
		...module,
		executionEntryName: moduleEntryNames[index],
	}));

	return {
		entryNames,
		compiledModules,
		compiledFunctions,
		functionTypeRegistry,
		memoryPlan,
		memoryDefaultsByModuleId: memoryDefaultResolution.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: memoryDefaultResolution.pointerMetadataByModuleId,
		cache,
	};
}
