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
	ProjectMemoryExposuresByGroupPath,
	ValidatedAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import {
	createFunctionId,
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getEffectiveFunctionMetadata,
	getError,
	getProjectMemoryExposureTargetError,
} from '@8f4e/language-spec';
import { MemoryDefaultResolverError, resolveMemoryDefaults } from '@8f4e/memory-default-resolver';
import { MemoryPlannerError, planSubProgramMemoryLayout } from '@8f4e/memory-planner';
import { resolveMemoryReferences } from '@8f4e/memory-reference-resolver';
import type { ComposedProgram } from '@8f4e/program-composer/internal';
import { resolveSemanticReferences } from '@8f4e/semantic-reference-resolver';
import { analyzeStack } from '@8f4e/stack-analyzer';
import { compileFunction, compileModules } from '@8f4e/wasm-codegen';
import {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';

interface CompiledSubProgram {
	entryNames: string[];
	compiledModules: CompiledModule[];
	compiledFunctions: CompiledFunction[];
	functionTypeRegistry: FunctionTypeRegistry;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	projectMemoryExposuresByGroupPath: ProjectMemoryExposuresByGroupPath;
	cache: CompilerCache;
}

/** Internal layout settings for compiling one linkable sub-program. */
export interface CompileSubProgramOptions extends CompileOptions {
	/** Global WebAssembly index assigned to the first function defined by this sub-program. */
	startingFunctionIndex?: number;
}

const DEFAULT_STARTING_MEMORY_WORD_ADDRESS = 1;

/** Built-in WebAssembly export names that user functions are not allowed to reuse. */
const RESERVED_EXPORT_NAMES = ['initDefaults'];

function resolveProjectMemoryExposures(
	program: ComposedProgram,
	memoryPlan: MemoryLayoutPlan
): ProjectMemoryExposuresByGroupPath {
	const result: ProjectMemoryExposuresByGroupPath = {};
	for (const exposure of program.memoryExposures) {
		const targetMemory = memoryPlan.modules[exposure.targetModuleId]?.memory[exposure.targetMemoryName];
		if (!targetMemory) {
			throw getProjectMemoryExposureTargetError(
				exposure.groupPath,
				exposure.name,
				exposure.targetModuleId,
				exposure.targetMemoryName
			);
		}
		(result[exposure.groupPath] ??= []).push({
			...exposure,
			targetMemory,
		});
	}
	return result;
}

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
		...(ast.projectGroupPath !== undefined ? { projectGroupPath: ast.projectGroupPath } : {}),
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

function wrapConstantResolverError(
	error: unknown,
	program: ComposedProgram,
	subProgramAst: ResolveConstantsSubProgramAST
): unknown {
	if (!(error instanceof ConstantResolverError)) {
		return error;
	}

	const line = error.line;
	if (!line) {
		return error;
	}

	const ast = findAstContainingLine(subProgramAst, line);
	const projectConstantScope = program.projectConstantScopes.find(scope =>
		scope.lines.some(scopeLine => scopeLine === line)
	);
	const context = ast
		? getAstDiagnosticContext(ast)
		: projectConstantScope
			? { projectGroupPath: projectConstantScope.groupPath }
			: undefined;
	return getError(ErrorCode.CONSTANT_RESOLUTION_FAILED, line, context, {
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

/**
 * Compiles one composed program into emission-ready module, function, memory, and data-segment artifacts.
 *
 * @param program - Parsed and recursively composed program to compile.
 * @param options - Compiler options for this compilation pass.
 * @returns The compiled sub-program artifacts.
 */
export function compileSubProgram(program: ComposedProgram, options: CompileSubProgramOptions): CompiledSubProgram {
	const { ast: subProgramAst, entryNames, moduleEntryNames, cache } = program;
	assertUniqueModuleIds(subProgramAst.modules);
	let constantResolution: ReturnType<typeof resolveConstants>;
	try {
		constantResolution = resolveConstants({ ast: subProgramAst, projectConstantScopes: program.projectConstantScopes });
	} catch (error) {
		throw wrapConstantResolverError(error, program, subProgramAst);
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
	const projectMemoryExposuresByGroupPath = resolveProjectMemoryExposures(program, memoryPlan);
	const memoryReferenceResolution = resolveMemoryReferences({
		ast: subProgramAst,
		memoryPlan,
		memoryAliases: program.memoryAliases,
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
		memoryAliases: program.memoryAliases,
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
		projectMemoryExposuresByGroupPath,
		cache,
	};
}
