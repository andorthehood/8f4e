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
	FunctionTypeRegistry,
	Module,
	ValidatedAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { compileToAST, createASTCache, SyntaxRulesError } from '@8f4e/tokenizer';
import { compileFunction } from './compileFunction';
import { compileModules } from './compileModules';
import { getError } from './compilerError';
import createInitialMemoryDataSegments from './initialMemoryDataSegments/createInitialMemoryDataSegments';
import type { InitialMemoryDataSegment } from './initialMemoryDataSegments/types';
import {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
import { getCustomMemoryRegionName, validateMemoryRegionOptions } from './semantic/memoryRegions';

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
};

type CompilerSource = {
	code: string[];
	cacheKey: string;
	projectBlockId?: number;
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
function createEntryFunctionMetadata(
	entryNames: readonly string[],
	importedFunctionCount: number
): FunctionMetadataLookup {
	return Object.fromEntries(
		entryNames.map((entryName, index) => [
			entryName,
			{
				id: entryName,
				signature: { parameters: [], returns: [] },
				wasmIndex: importedFunctionCount + 1 + index,
			} satisfies FunctionMetadata,
		])
	);
}

/** Calculates required byte size for each WebAssembly memory index. */
function getRequiredMemoryBytesByIndex(
	items: Array<{ memoryIndex: number; byteAddress?: number; wordAlignedSize?: number }>
): Record<number, number> {
	return items.reduce<Record<number, number>>((result, item) => {
		const memoryIndex = item.memoryIndex;
		const requiredBytes = (item.byteAddress ?? 0) + (item.wordAlignedSize ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
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

function attachProjectBlockIdToSyntaxError(error: unknown, projectBlockId: number | undefined): unknown {
	if (!(error instanceof SyntaxRulesError) || projectBlockId === undefined) {
		return error;
	}

	error.context = {
		...error.context,
		projectBlockId,
	};
	return error;
}

function attachProjectBlockIdToAst<TAst extends ValidatedAST>(ast: TAst, projectBlockId: number | undefined): TAst {
	if (projectBlockId === undefined) {
		return ast;
	}

	return {
		...ast,
		projectBlockId,
	} as TAst;
}

function compileSourceToAST<TAst extends ValidatedAST>(source: CompilerSource, cache: CompilerCache): TAst {
	try {
		const ast = compileToAST(source.code, cache.ast, source.cacheKey) as TAst;
		return attachProjectBlockIdToAst(ast, source.projectBlockId);
	} catch (error) {
		throw attachProjectBlockIdToSyntaxError(error, source.projectBlockId);
	}
}

function createCompilerSource(module: Module, cacheKey: string): CompilerSource {
	return {
		code: module.code,
		cacheKey,
		projectBlockId: module.projectBlockId,
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
	const prototypeShapesById = collectPrototypeShapes(astPrototypes);

	const moduleSources = entryModules.map(({ entryName, module, index }) => {
		return {
			code: module.code,
			cacheKey: `entry:${entryName}:module:${index}`,
			entryName,
			projectBlockId: module.projectBlockId,
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
	const entryNames = inputEntryNames;
	const astModules = astModuleEntries.map(({ ast }) => ast);
	const moduleEntryNames = astModuleEntries.map(({ entryName }) => entryName);
	assertUniqueModuleIds(astModules);

	const namespaceAsts = [...astModules, ...astConstants];
	const namespaces = collectNamespacesFromASTs(
		namespaceAsts,
		GLOBAL_ALIGNMENT_BOUNDARY,
		undefined,
		astModules,
		options,
		prototypeShapesById
	);

	const astFunctions = functionSources.map(source => compileSourceToAST<ValidatedFunctionAST>(source, cache));
	const importedUserFunctionCount = astFunctions.filter(ast => ast.import).length;
	const importedFunctionCount = importedUserFunctionCount;
	const builtInFunctionCount = 1 + entryNames.length;
	const userDefinedFunctionBaseIndex = importedFunctionCount + builtInFunctionCount;

	const entryFunctionMetadata = createEntryFunctionMetadata(entryNames, importedFunctionCount);
	const userFunctionMetadata = collectFunctionMetadataFromAsts(astFunctions, {
		importedFunctionBaseIndex: 0,
		definedFunctionBaseIndex: userDefinedFunctionBaseIndex,
		reservedFunctionIds: entryNames,
		reservedExportNames: [...RESERVED_EXPORT_NAMES, ...entryNames],
		prototypeShapes: prototypeShapesById,
	});
	const functionMetadata = { ...entryFunctionMetadata, ...userFunctionMetadata };

	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map(ast =>
		compileFunction(ast, namespaces, functionTypeRegistry, functionMetadata[ast.id], functionMetadata, options)
	);
	const importedUserFunctions = compiledFunctions.filter(func => func.import);
	const definedFunctions = compiledFunctions.filter(func => !func.import);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));

	const compiledModules = compileModules(
		astModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		functionMetadata,
		functionTypeRegistry,
		prototypeShapesById
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
	const initialMemoryDataSegments = createInitialMemoryDataSegments(compiledModules);
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
		cache,
	};
}
