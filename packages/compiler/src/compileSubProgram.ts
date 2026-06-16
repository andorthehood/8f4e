import { ConstantInliningError, type InlineConstantsProjectAST, inlineConstantsInASTs } from '@8f4e/constant-inliner';
import type {
	CompiledFunction,
	CompiledFunctionLookup,
	CompiledModule,
	CompiledModuleLookup,
	CompileInput,
	CompileOptions,
	CompilerCache,
	FunctionMetadata,
	FunctionMetadataLookup,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryDeclarationLine,
	MemoryLayoutPlan,
	Module,
	NamespaceBuildContext,
	Namespaces,
	SemanticInstructionLine,
	ShapeLine,
	ValidatedAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	ArgumentType,
	createFunctionId,
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getCustomMemoryRegionName,
	getDefaultMemoryRegion,
	getEffectiveFunctionMetadata,
	getError,
	isArrayMemoryDeclarationLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
	validateMemoryRegionOptions,
} from '@8f4e/language-spec';
import { MemoryDefaultResolverError, resolveMemoryDefaults } from '@8f4e/memory-default-resolver';
import { type MemoryLayoutSourceModule, MemoryPlannerError, planMemoryLayout } from '@8f4e/memory-planner';
import { inlineMemoryReferences } from '@8f4e/memory-reference-inliner';
import { analyzeStack } from '@8f4e/stack-analyzer';
import { compileToAST, createASTCache, SyntaxRulesError } from '@8f4e/tokenizer';
import { compileFunction } from './compileFunction';
import { compileModules } from './compileModules';
import createInitialMemoryDataSegments from './initialMemoryDataSegments/createInitialMemoryDataSegments';
import type { InitialMemoryDataSegment } from './initialMemoryDataSegments/types';
import {
	applySemanticLine,
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
import { createCompilationContext } from './semantic/createCompilationContext';
import {
	normalizeArgumentsAtIndexes,
	validateOrDeferUnresolvedIdentifier,
	validateOrDeferValueExpression,
} from './semantic/normalization/helpers';

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
	/** Number of imported user functions emitted before built-ins and defined functions. */
	importedFunctionCount: number;
	/** Number of built-in helper functions emitted before user-defined functions. */
	builtInFunctionCount: number;
	/** Compiled module bodies in source order. */
	compiledModules: CompiledModule[];
	/** Compiled module lookup keyed by module id. */
	compiledModulesMap: CompiledModuleLookup;
	/** Compiled user functions in source order. */
	compiledFunctions: CompiledFunction[];
	/** Compiled function lookup keyed by function id. */
	compiledFunctionsMap: CompiledFunctionLookup;
	/** User functions imported from the host environment. */
	importedUserFunctions: CompiledFunction[];
	/** User functions defined by the source program. */
	definedFunctions: CompiledFunction[];
	/** Function type table accumulated while compiling calls and definitions. */
	functionTypeRegistry: FunctionTypeRegistry;
	/** Required linear-memory byte size keyed by WebAssembly memory index. */
	requiredMemoryBytesByIndex: Record<number, number>;
	/** Required byte size for default memory. */
	requiredMemoryBytes: number;
	/** Required byte size keyed by configured custom memory region name. */
	requiredMemoryBytesByRegion: Record<string, number>;
	/** Initial data segments that materialize memory defaults. */
	initialMemoryDataSegments: InitialMemoryDataSegment[];
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

/** Calculates required byte size for each WebAssembly memory index. */
function getRequiredMemoryBytesByIndex(
	items: Pick<CompiledModule, 'memoryIndex' | 'byteAddress' | 'wordAlignedSize'>[]
) {
	return items.reduce<Record<number, number>>((result, item) => {
		const memoryIndex = item.memoryIndex;
		const requiredBytes = item.byteAddress + item.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
		result[memoryIndex] = Math.max(result[memoryIndex] ?? 0, requiredBytes);
		return result;
	}, {});
}

/** Converts non-default memory byte requirements into configured memory region names. */
function getRequiredMemoryBytesByRegion(
	requiredMemoryBytesByIndex: Record<number, number>,
	memoryRegions: readonly string[]
): Record<string, number> {
	const result: Record<string, number> = {};

	for (const [memoryIndexString, requiredBytes] of Object.entries(requiredMemoryBytesByIndex)) {
		const memoryIndex = Number(memoryIndexString);
		if (memoryIndex === 0 || requiredBytes <= 0) {
			continue;
		}

		result[getCustomMemoryRegionName(memoryRegions, memoryIndex)] = requiredBytes;
	}

	return result;
}

/** Indexes prototype ASTs by id and rejects duplicate prototype declarations. */
function collectPrototypeShapes(prototypes: readonly ValidatedPrototypeAST[]): Record<string, ValidatedPrototypeAST> {
	const prototypeShapesById: Record<string, ValidatedPrototypeAST> = {};

	for (const prototype of prototypes) {
		const existing = prototypeShapesById[prototype.id];
		if (existing) {
			throw getError(
				ErrorCode.DUPLICATE_IDENTIFIER,
				prototype.prototypeLine,
				{
					codeBlockType: prototype.type,
					...(prototype.projectBlockId !== undefined ? { projectBlockId: prototype.projectBlockId } : {}),
				},
				{
					identifier: prototype.id,
				}
			);
		}
		prototypeShapesById[prototype.id] = prototype;
	}

	return prototypeShapesById;
}

function createMemoryLayoutSourceBuildContext(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress: number,
	options: Pick<CompileOptions, 'memoryRegions'>
): NamespaceBuildContext {
	const currentMemoryRegion = getDefaultMemoryRegion();
	return createCompilationContext<NamespaceBuildContext>({
		namespace: {
			namespaces,
			moduleName: undefined,
			prototypeShapeIds: [],
		},
		locals: {},
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: 0,
		currentMemoryIndex: currentMemoryRegion.memoryIndex,
		...(currentMemoryRegion.memoryRegionName ? { currentMemoryRegionName: currentMemoryRegion.memoryRegionName } : {}),
		memoryDefaults: {},
		pointerMetadata: {},
		memoryRegions: options.memoryRegions ?? [],
		mode: 'module',
		codeBlockType: ast.type,
		projectBlockId: ast.projectBlockId,
	});
}

function isShapeLine(line: SemanticInstructionLine): line is ShapeLine {
	return line.instruction === 'shape';
}

function normalizeLayoutMemoryDeclarationLine(
	line: MemoryDeclarationLine,
	context: NamespaceBuildContext
): MemoryDeclarationLine {
	if (!isArrayMemoryDeclarationLine(line)) {
		return line;
	}

	const { line: normalizedLine } = normalizeArgumentsAtIndexes(line, context, [1]);
	const elementCount = normalizedLine.arguments[1];
	if (elementCount.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferValueExpression(elementCount, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${elementCount.left.value}${elementCount.operator}${elementCount.right.value}`,
			});
		}
	}
	if (elementCount.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(elementCount, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: elementCount.value });
		}
	}

	return normalizedLine;
}

function collectModuleMemoryLayoutSourceLines(
	ast: ValidatedModuleAST,
	namespaces: Namespaces,
	startingByteAddress: number,
	options: Pick<CompileOptions, 'memoryRegions'>
): MemoryLayoutSourceModule {
	const sourceModule: MemoryLayoutSourceModule = {
		id: ast.id,
		moduleLine: ast.moduleLine,
		...(ast.regionLine ? { regionLine: ast.regionLine } : {}),
		lines: [],
	};
	const context = createMemoryLayoutSourceBuildContext(ast, namespaces, startingByteAddress, options);

	for (const line of ast.lines) {
		if (isMemoryDeclarationLine(line)) {
			sourceModule.lines = [...sourceModule.lines, normalizeLayoutMemoryDeclarationLine(line, context)];
			continue;
		}

		if (!isSemanticInstructionLine(line)) {
			continue;
		}

		if (!isShapeLine(line)) {
			applySemanticLine(line, context);
			continue;
		}

		sourceModule.lines = [...sourceModule.lines, line];
	}

	return sourceModule;
}

function createMemoryLayoutSourceModules(
	asts: readonly ValidatedModuleAST[],
	namespaces: Namespaces,
	startingByteAddress: number,
	options: Pick<CompileOptions, 'memoryRegions'>
): MemoryLayoutSourceModule[] {
	return asts.map(ast => collectModuleMemoryLayoutSourceLines(ast, namespaces, startingByteAddress, options));
}

function planProjectMemoryLayout(
	asts: readonly ValidatedModuleAST[],
	prototypes: readonly ValidatedPrototypeAST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	options: Pick<CompileOptions, 'memoryRegions'> = {}
): MemoryLayoutPlan {
	validateMemoryRegionOptions(options, asts[0]?.lines[0]);
	const namespaces: Namespaces = {};

	return planMemoryLayout({
		prototypes,
		modules: createMemoryLayoutSourceModules(asts, namespaces, startingByteAddress, options),
		startingByteAddress,
		memoryRegions: options.memoryRegions ?? [],
	});
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
	projectAst: InlineConstantsProjectAST,
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

function wrapConstantInliningError(error: unknown, projectAst: InlineConstantsProjectAST): unknown {
	if (!(error instanceof ConstantInliningError)) {
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

function wrapMemoryDefaultResolverError(error: unknown, projectAst: InlineConstantsProjectAST): unknown {
	if (!(error instanceof MemoryDefaultResolverError)) {
		return error;
	}

	const ast = findAstContainingLine(projectAst, error.line);
	return getError(error.compilerErrorCode, error.line, ast ? getAstDiagnosticContext(ast) : undefined, error.details);
}

function wrapMemoryPlannerError(error: unknown, projectAst: InlineConstantsProjectAST): unknown {
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
	validateMemoryRegionOptions(options);
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
	const projectAst: InlineConstantsProjectAST<
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
	let constantInlinedAst: typeof projectAst;
	try {
		constantInlinedAst = inlineConstantsInASTs({ ast: projectAst }).ast;
	} catch (error) {
		throw wrapConstantInliningError(error, projectAst);
	}

	const constantInlinedPrototypeShapesById = collectPrototypeShapes(constantInlinedAst.prototypes);
	let memoryPlan: ReturnType<typeof planProjectMemoryLayout>;
	try {
		memoryPlan = planProjectMemoryLayout(
			constantInlinedAst.modules,
			Object.values(constantInlinedPrototypeShapesById),
			GLOBAL_ALIGNMENT_BOUNDARY,
			options
		);
	} catch (error) {
		throw wrapMemoryPlannerError(error, constantInlinedAst);
	}
	const {
		ast: {
			prototypes: inlinedAstPrototypes,
			modules: inlinedAstModules,
			constants: inlinedAstConstants,
			functions: inlinedAstFunctions,
		},
	} = inlineMemoryReferences({
		ast: constantInlinedAst,
		memoryPlan,
	});
	const inlinedProjectAst = {
		prototypes: inlinedAstPrototypes,
		modules: inlinedAstModules,
		constants: inlinedAstConstants,
		functions: inlinedAstFunctions,
	};
	const inlinedPrototypeShapesById = collectPrototypeShapes(inlinedAstPrototypes);
	let memoryDefaultResolution: ReturnType<typeof resolveMemoryDefaults>;
	try {
		memoryDefaultResolution = resolveMemoryDefaults({
			memoryPlan,
		});
	} catch (error) {
		throw wrapMemoryDefaultResolverError(error, inlinedProjectAst);
	}

	const namespaces = collectNamespacesFromASTs(inlinedAstModules, memoryPlan, memoryDefaultResolution, options);

	const importedUserFunctionCount = inlinedAstFunctions.filter(ast => ast.import).length;
	const importedFunctionCount = importedUserFunctionCount;
	const builtInFunctionCount = 1 + entryNames.length;
	const userDefinedFunctionBaseIndex = importedFunctionCount + builtInFunctionCount;

	const entryFunctionMetadata = createEntryFunctionMetadata(entryNames, importedFunctionCount);
	const userFunctionMetadata = collectFunctionMetadataFromAsts(inlinedAstFunctions, {
		importedFunctionBaseIndex: 0,
		definedFunctionBaseIndex: userDefinedFunctionBaseIndex,
		reservedFunctionIds: entryNames,
		reservedExportNames: [...RESERVED_EXPORT_NAMES, ...entryNames],
		prototypeShapes: inlinedPrototypeShapesById,
	});
	const functionRegistry = mergeFunctionRegistries(entryFunctionMetadata, userFunctionMetadata);

	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3,
	};
	const stackReport = analyzeStack({
		ast: {
			modules: inlinedAstModules,
			functions: inlinedAstFunctions,
		},
		namespaces,
		memoryPlan,
		memoryDefaultsByModuleId: memoryDefaultResolution.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: memoryDefaultResolution.pointerMetadataByModuleId,
		functions: functionRegistry,
		functionTypeRegistry,
		memoryRegions: options.memoryRegions ?? [],
		prototypeShapes: inlinedPrototypeShapesById,
	});

	const compiledFunctions = inlinedAstFunctions.map(ast => {
		const signatureMetadata = getEffectiveFunctionMetadata(ast, inlinedPrototypeShapesById);
		const functionId = createFunctionId(ast.name, signatureMetadata.signature.parameters);
		return compileFunction(
			ast,
			namespaces,
			functionTypeRegistry,
			functionRegistry,
			stackReport.functions[functionId],
			options
		);
	});
	const importedUserFunctions = compiledFunctions.filter(func => func.import);
	const definedFunctions = compiledFunctions.filter(func => !func.import);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));

	const compiledModules = compileModules(
		inlinedAstModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		memoryPlan,
		stackReport,
		functionRegistry,
		functionTypeRegistry,
		inlinedPrototypeShapesById
	).map((module, index) => ({
		...module,
		executionEntryName: moduleEntryNames[index],
	}));

	const requiredMemoryBytesByIndexFromModules = getRequiredMemoryBytesByIndex(compiledModules);
	const requiredMemoryBytes = requiredMemoryBytesByIndexFromModules[0] ?? 0;
	const requiredMemoryBytesByIndex: Record<number, number> = {
		...requiredMemoryBytesByIndexFromModules,
		0: requiredMemoryBytes,
	};
	const requiredMemoryBytesByRegion = getRequiredMemoryBytesByRegion(
		requiredMemoryBytesByIndex,
		options.memoryRegions ?? []
	);
	const initialMemoryDataSegments = createInitialMemoryDataSegments(
		memoryPlan,
		memoryDefaultResolution.memoryDefaultsByModuleId
	);
	const compiledModulesMap = Object.fromEntries(compiledModules.map(module => [module.id, module]));

	return {
		entryNames,
		importedFunctionCount,
		builtInFunctionCount,
		compiledModules,
		compiledModulesMap,
		compiledFunctions,
		compiledFunctionsMap,
		importedUserFunctions,
		definedFunctions,
		functionTypeRegistry,
		requiredMemoryBytesByIndex,
		requiredMemoryBytes,
		requiredMemoryBytesByRegion,
		initialMemoryDataSegments,
		memoryPlan,
		memoryDefaultsByModuleId: memoryDefaultResolution.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: memoryDefaultResolution.pointerMetadataByModuleId,
		cache,
	};
}
