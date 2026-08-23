import { ConstantResolverError, type ResolveConstantsSubProgramAST, resolveConstants } from '@8f4e/constant-resolver';
import type {
	CompiledFunction,
	CompiledModule,
	CompileOptions,
	CompilerCache,
	FunctionMetadata,
	FunctionMetadataLookup,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	ProjectBlock,
	ProjectObjectModel,
	SourceMetadata,
	ValidatedAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	createFunctionId,
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getEffectiveFunctionMetadata,
	getError,
} from '@8f4e/language-spec';
import { MemoryDefaultResolverError, resolveMemoryDefaults } from '@8f4e/memory-default-resolver';
import { MemoryPlannerError, planSubProgramMemoryLayout } from '@8f4e/memory-planner';
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

type CompilerDerivedSource = {
	code: string[];
	projectBlockId?: number;
	source?: SourceMetadata;
};

interface CompiledSubProgram {
	entryNames: string[];
	compiledModules: CompiledModule[];
	compiledFunctions: CompiledFunction[];
	functionTypeRegistry: FunctionTypeRegistry;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	cache: CompilerCache;
}

/** Internal layout settings for compiling one linkable sub-program. */
export interface CompileSubProgramOptions extends CompileOptions {
	/** Global WebAssembly index assigned to the first function defined by this sub-program. */
	startingFunctionIndex?: number;
}

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
	source?: SourceMetadata;
};

type CompilerSource = {
	code: string[];
	cacheKey: string;
	projectBlockId?: number;
	source?: SourceMetadata;
};

const DEFAULT_STARTING_MEMORY_WORD_ADDRESS = 1;

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
	subProgramAst: ResolveConstantsSubProgramAST,
	line: ValidatedAST['lines'][number]
): ValidatedAST | undefined {
	const groups = [subProgramAst.prototypes, subProgramAst.modules, subProgramAst.constants, subProgramAst.functions];
	for (const asts of groups) {
		const ast = asts.find(candidate => candidate.lines.includes(line));
		if (ast) {
			return ast;
		}
	}

	return undefined;
}

function wrapConstantResolverError(error: unknown, subProgramAst: ResolveConstantsSubProgramAST): unknown {
	if (!(error instanceof ConstantResolverError)) {
		return error;
	}

	const line = error.line;
	if (!line) {
		return error;
	}

	const ast = findAstContainingLine(subProgramAst, line);
	return getError(ErrorCode.CONSTANT_RESOLUTION_FAILED, line, ast ? getAstDiagnosticContext(ast) : undefined, {
		reason: `${error.detail} (${error.code})`,
	});
}

function wrapMemoryDefaultResolverError(error: unknown, subProgramAst: ResolveConstantsSubProgramAST): unknown {
	if (!(error instanceof MemoryDefaultResolverError)) {
		return error;
	}

	const ast = findAstContainingLine(subProgramAst, error.line);
	return getError(error.compilerErrorCode, error.line, ast ? getAstDiagnosticContext(ast) : undefined, error.details);
}

function wrapMemoryPlannerError(error: unknown, subProgramAst: ResolveConstantsSubProgramAST): unknown {
	if (!(error instanceof MemoryPlannerError)) {
		return error;
	}

	const ast = findAstContainingLine(subProgramAst, error.line);
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

function createCompilerSource(module: CompilerDerivedSource | ProjectBlock, cacheKey: string): CompilerSource {
	return {
		code: module.code,
		cacheKey,
		...('id' in module ? { projectBlockId: module.id } : { projectBlockId: module.projectBlockId }),
		...('source' in module ? { source: module.source } : {}),
	};
}

function getAllProjectBlocks(project: ProjectObjectModel): ProjectBlock[] {
	return [
		...project.modules,
		...project.functions,
		...project.constants,
		...project.prototypes,
		...project.includes,
		...project.notes,
		...project.unknown,
	];
}

function assertUniqueProjectBlockIds(project: ProjectObjectModel): void {
	const ids = new Set<number>();
	for (const block of getAllProjectBlocks(project)) {
		if (!Number.isInteger(block.id)) throw new Error('Project block is missing numeric id');
		if (ids.has(block.id)) throw new Error(`Project contains duplicate block id ${block.id}`);
		ids.add(block.id);
	}
}

/**
 * Compiles one source sub-program into emission-ready module, function, memory, and data-segment artifacts.
 *
 * @param input - Closed source sub-program to compile.
 * @param options - Compiler options for this compilation pass.
 * @param cache - Compiler cache used for reusable validated ASTs.
 * @returns The compiled sub-program artifacts.
 */
export function compileSubProgram(
	project: ProjectObjectModel,
	options: CompileSubProgramOptions,
	cache = createCompilerCache(),
	includedFunctions: readonly CompilerDerivedSource[] = []
): CompiledSubProgram {
	assertUniqueProjectBlockIds(project);
	const modules = project.modules.filter(block => !block.disabled);
	const constants = project.constants.filter(block => !block.disabled);
	const functions = project.functions.filter(block => !block.disabled);
	const prototypes = project.prototypes.filter(block => !block.disabled);
	const inputEntryNames = [...new Set(['main', ...modules.map(module => module.entry)])];

	const prototypeSources = prototypes.map((prototype, index) => {
		return createCompilerSource(prototype, `prototype:${index}`);
	});

	const astPrototypes = prototypeSources.map(source => compileSourceToAST<ValidatedPrototypeAST>(source, cache));

	const moduleIndexByEntry = new Map<string, number>();
	const moduleSources = modules.map(module => {
		const index = moduleIndexByEntry.get(module.entry) ?? 0;
		moduleIndexByEntry.set(module.entry, index + 1);
		return {
			code: module.code,
			cacheKey: `entry:${module.entry}:module:${index}`,
			entryName: module.entry,
			projectBlockId: module.id,
		};
	}) satisfies ModuleCompilerSource[];

	const constantsSources = constants.map((constantsBlock, index) => {
		return createCompilerSource(constantsBlock, `constants:${index}`);
	});

	const functionSources = [
		...functions.map((func, index) => createCompilerSource(func, `function:${index}`)),
		...includedFunctions.map((func, index) => createCompilerSource(func, `include:function:${index}`)),
	];

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
	const subProgramAst: ResolveConstantsSubProgramAST<
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
		constantResolution = resolveConstants({ ast: subProgramAst });
	} catch (error) {
		throw wrapConstantResolverError(error, subProgramAst);
	}

	let memoryPlan: ReturnType<typeof planSubProgramMemoryLayout>;
	try {
		memoryPlan = planSubProgramMemoryLayout({
			prototypes: subProgramAst.prototypes,
			modules: subProgramAst.modules,
			constantReferences: constantResolution.references,
			startingByteAddress:
				(options.startingMemoryWordAddress ?? DEFAULT_STARTING_MEMORY_WORD_ADDRESS) * GLOBAL_ALIGNMENT_BOUNDARY,
			memoryRegions: options.memoryRegions,
		});
	} catch (error) {
		throw wrapMemoryPlannerError(error, subProgramAst);
	}
	const memoryReferenceResolution = resolveMemoryReferences({
		ast: subProgramAst,
		memoryPlan,
		constantReferences: constantResolution.references,
	});
	const prototypeShapesById = indexPrototypeShapes(subProgramAst.prototypes);
	let memoryDefaultResolution: ReturnType<typeof resolveMemoryDefaults>;
	try {
		memoryDefaultResolution = resolveMemoryDefaults({
			memoryPlan,
			memoryReferences: memoryReferenceResolution.references,
		});
	} catch (error) {
		throw wrapMemoryDefaultResolverError(error, subProgramAst);
	}

	const namespaces = collectNamespacesFromASTs(subProgramAst.modules, memoryPlan, memoryDefaultResolution);

	const importedUserFunctionCount = subProgramAst.functions.filter(ast => ast.importLine).length;
	const importedFunctionCount = importedUserFunctionCount;
	const builtInFunctionCount = 1 + entryNames.length;
	const userDefinedFunctionBaseIndex = options.startingFunctionIndex ?? importedFunctionCount + builtInFunctionCount;

	const entryFunctionMetadata = createEntryFunctionMetadata(entryNames, importedFunctionCount);
	const userFunctionMetadata = collectFunctionMetadataFromAsts(subProgramAst.functions, {
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
		ast: subProgramAst,
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
			modules: subProgramAst.modules,
			functions: subProgramAst.functions,
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

	const compiledFunctions = subProgramAst.functions.map(ast => {
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
		subProgramAst.modules,
		options,
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
