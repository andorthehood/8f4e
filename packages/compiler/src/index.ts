import type {
	AST,
	CompiledFunctionLookup,
	CompiledModule,
	CompileInput,
	CompileOptions,
	CompileResult,
	CompilerCache,
	ConstantsAST,
	FunctionAST,
	FunctionMetadata,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	ModuleAST,
	PrototypeAST,
} from '@8f4e/compiler-spec';
import {
	DEFAULT_HOST_IMPORT_MODULE_NAME,
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	isMemoryDeclarationLine,
} from '@8f4e/compiler-spec';
import {
	call,
	createCodeSection,
	createDataCountSection,
	createDataSection,
	createExportSection,
	createFunction,
	createFunctionExport,
	createFunctionImport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createPassiveDataSegment,
	createTypeSection,
	i32const,
	memoryFill,
	memoryInit,
	WASM_MEMORY_PAGE_SIZE,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { compileToAST, createASTCache } from '@8f4e/tokenizer';
import { compileFunction } from './compileFunction';
import { compileModules } from './compileModules';
import { getError } from './compilerError';
import { HEADER, VERSION } from './consts';
import { createInitialMemoryDataSegments } from './initialMemoryDataSegments';
import {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
import { getCustomMemoryRegionName, validateMemoryRegionOptions } from './semantic/memoryRegions';
import { expandMacros, parseMacroDefinitions } from './utils/macroExpansion';

type ModuleCompilerSource = {
	code: string[];
	cacheKey: string;
	entryName: string;
};

type ParsedPrototypeSource = {
	ast: PrototypeAST;
	source: {
		code: string[];
	};
};

export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { compileFunction } from './compileFunction';
export { compileCodegenLine, compileLine } from './compileLine';
export { compileModule } from './compileModule';
export { compileModules } from './compileModules';
export { getError } from './compilerError';
export { serializeDiagnostic } from './diagnostic';
export type { InitialMemoryDataSegment } from './initialMemoryDataSegments';
export { default as instructions } from './instructionCompilers';
export {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
export { createCompilationContext } from './semantic/createCompilationContext';
export { isMemoryDeclarationInstruction } from './semantic/declarations';
export { default as normalizeCompileTimeArguments } from './semantic/normalizeCompileTimeArguments';
export { analyzeInstruction } from './stackAnalysis/analyzeInstruction';
export { expandMacros, parseMacroDefinitions } from './utils/macroExpansion';
export { createInitialMemoryDataSegments };

function createCompilerCache(): CompilerCache {
	return {
		ast: createASTCache<AST>(),
	};
}

const RESERVED_EXPORT_NAMES = new Set(['initDefaults']);

function assertUniqueFunctionExportNames(functions: CompiledFunctionLookup, entryNames: readonly string[]): void {
	const seen = new Set<string>();
	const builtInExportNames = new Set([...RESERVED_EXPORT_NAMES, ...entryNames]);

	for (const compiledFunction of Object.values(functions)) {
		const exportName = compiledFunction.exportName;
		if (!exportName) {
			continue;
		}

		const exportLine = compiledFunction.ast.exportLine ?? compiledFunction.ast.lines[0];
		if (builtInExportNames.has(exportName) || seen.has(exportName)) {
			throw getError(ErrorCode.DUPLICATE_EXPORT_NAME, exportLine, undefined, { identifier: exportName });
		}

		seen.add(exportName);
	}
}

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

function assertNoFunctionEntryNameCollisions(
	functions: readonly FunctionAST[],
	entryMetadata: FunctionMetadataLookup
): void {
	for (const ast of functions) {
		if (entryMetadata[ast.id]) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.functionLine, undefined, { identifier: ast.id });
		}
	}
}

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

function parseModuleAST(code: string[], cache: CompilerCache, cacheKey: string): ModuleAST {
	const ast = compileToAST(code, cache.ast, cacheKey);
	if (ast.type !== 'module') {
		throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
	}
	return ast;
}

function parseConstantsAST(code: string[], cache: CompilerCache, cacheKey: string): ConstantsAST {
	const ast = compileToAST(code, cache.ast, cacheKey);
	if (ast.type !== 'constants') {
		throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
	}
	return ast;
}

function parseFunctionAST(code: string[], cache: CompilerCache, cacheKey: string): FunctionAST {
	const ast = compileToAST(code, cache.ast, cacheKey);
	if (ast.type !== 'function') {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, ast.lines[0], undefined);
	}
	return ast;
}

function parsePrototypeAST(code: string[], cache: CompilerCache, cacheKey: string): PrototypeAST {
	const ast = compileToAST(code, cache.ast, cacheKey);
	if (ast.type !== 'prototype') {
		throw getError(ErrorCode.MISSING_PROTOTYPE_ID, ast.lines[0], undefined);
	}
	for (const line of ast.lines) {
		if (line.instruction === 'prototype' || line.instruction === 'prototypeEnd') {
			continue;
		}
		if (!isMemoryDeclarationLine(line)) {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, undefined);
		}
	}
	return ast;
}

function collectPrototypeSources(prototypes: readonly ParsedPrototypeSource[]): Map<string, ParsedPrototypeSource> {
	const prototypeSourcesById = new Map<string, ParsedPrototypeSource>();

	for (const prototype of prototypes) {
		const existing = prototypeSourcesById.get(prototype.ast.id);
		if (existing) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, prototype.ast.prototypeLine, undefined, {
				identifier: prototype.ast.id,
			});
		}
		prototypeSourcesById.set(prototype.ast.id, prototype);
	}

	return prototypeSourcesById;
}

function expandModuleSourceShapes(
	source: ModuleCompilerSource,
	ast: ModuleAST,
	prototypeSourcesById: ReadonlyMap<string, ParsedPrototypeSource>
): ModuleCompilerSource {
	if (ast.shapeLines.length === 0) {
		return source;
	}

	const shapeLinesByLineNumber = new Map(ast.shapeLines.map(shapeLine => [shapeLine.lineNumber, shapeLine]));
	const code: string[] = [];

	for (let lineNumber = 0; lineNumber < source.code.length; lineNumber++) {
		const line = source.code[lineNumber];
		const shapeLine = shapeLinesByLineNumber.get(lineNumber);
		if (!shapeLine) {
			code.push(line);
			continue;
		}

		const prototypeId = shapeLine.arguments[0].value;
		const prototype = prototypeSourcesById.get(prototypeId);
		if (!prototype) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, shapeLine, undefined, { identifier: prototypeId });
		}

		for (const declarationLine of prototype.ast.memoryDeclarationLines) {
			const prototypeLineNumber = declarationLine.lineNumber;
			code.push(prototype.source.code[prototypeLineNumber] ?? '');
		}
	}

	return {
		...source,
		code,
	};
}

export default function compile(
	input: CompileInput,
	options: CompileOptions,
	cache = createCompilerCache()
): CompileResult {
	validateMemoryRegionOptions(options);
	const inputEntryNames = Object.keys(input.entries);
	const entryModules = Object.entries(input.entries).flatMap(([entryName, modules]) =>
		modules.map((module, index) => ({ entryName, module, index }))
	);
	const { constants, functions, prototypes, macros } = input;
	const macroDefinitions = parseMacroDefinitions(macros);

	const expandedPrototypes = prototypes.map((prototype, index) => {
		return {
			code: expandMacros(prototype, macroDefinitions),
			cacheKey: `prototype:${index}`,
		};
	});

	const astPrototypes = expandedPrototypes.map(({ code, cacheKey }) => ({
		ast: parsePrototypeAST(code, cache, cacheKey),
		source: { code },
	})) satisfies ParsedPrototypeSource[];
	const prototypeSourcesById = collectPrototypeSources(astPrototypes);

	// Expand macros and prototype shapes in modules
	const expandedModuleSources = entryModules.map(({ entryName, module, index }) => {
		return {
			code: expandMacros(module, macroDefinitions),
			cacheKey: `entry:${entryName}:module:${index}`,
			entryName,
		};
	}) satisfies ModuleCompilerSource[];

	const expandedConstants = constants.map((constantsBlock, index) => {
		return {
			code: expandMacros(constantsBlock, macroDefinitions),
			cacheKey: `constants:${index}`,
		};
	});

	// Expand macros in functions
	const expandedFunctions = functions.map((func, index) => {
		return {
			code: expandMacros(func, macroDefinitions),
			cacheKey: `function:${index}`,
		};
	});

	const astModuleEntries = expandedModuleSources.map(source => {
		const ast = parseModuleAST(source.code, cache, source.cacheKey);
		if (!ast.containsShape) {
			return { entryName: source.entryName, ast };
		}

		const expandedSource = expandModuleSourceShapes(source, ast, prototypeSourcesById);
		return {
			entryName: source.entryName,
			ast: expandedSource === source ? ast : parseModuleAST(expandedSource.code, cache, expandedSource.cacheKey),
		};
	});
	const astConstants = expandedConstants.map(({ code, cacheKey }) => parseConstantsAST(code, cache, cacheKey));
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
		options
	);

	// Compile functions first with WASM indices and type registry
	const astFunctions = expandedFunctions.map(({ code, cacheKey }) => parseFunctionAST(code, cache, cacheKey));
	const importedUserFunctionCount = astFunctions.filter(ast => ast.import).length;
	const importedFunctionCount = importedUserFunctionCount;
	const builtInFunctionCount = 1 + entryNames.length;
	const userDefinedFunctionBaseIndex = importedFunctionCount + builtInFunctionCount;

	// Collect pre-codegen function metadata so `call` target validation and
	// function-body codegen can rely on the same registry before compilation finishes.
	const entryFunctionMetadata = createEntryFunctionMetadata(entryNames, importedFunctionCount);
	assertNoFunctionEntryNameCollisions(astFunctions, entryFunctionMetadata);
	const userFunctionMetadata = collectFunctionMetadataFromAsts(astFunctions, 0, userDefinedFunctionBaseIndex);
	const functionMetadata = { ...entryFunctionMetadata, ...userFunctionMetadata };

	// Create a shared type registry for all functions
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map(ast =>
		compileFunction(
			ast,
			namespaces,
			functionMetadata[ast.id].wasmIndex,
			functionTypeRegistry,
			functionMetadata,
			options
		)
	);
	const importedUserFunctions = compiledFunctions.filter(func => func.import);
	const definedFunctions = compiledFunctions.filter(func => !func.import);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));
	assertUniqueFunctionExportNames(compiledFunctionsMap, entryNames);
	const requiredMemoryBytesByIndexFromNamespaces = getRequiredMemoryBytesByIndex(Object.values(namespaces));
	const totalModuleBytes = requiredMemoryBytesByIndexFromNamespaces[0] ?? 0;
	const internalAllocator = { nextByteAddress: totalModuleBytes };

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = definedFunctions.map(func => func.typeIndex);

	// Compile all modules in input order so editor layout can drive execution order.
	const compiledModules = compileModules(
		astModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		functionMetadata,
		internalAllocator,
		functionTypeRegistry
	).map((module, index) => ({
		...module,
		executionEntryName: moduleEntryNames[index],
	}));

	const cycleFunctions = compiledModules.map(({ cycleFunction }) => cycleFunction);
	const functionSignatures = compiledModules.map(() => 0x00);

	// Calculate the required memory footprint from the compiled program.
	const requiredMemoryBytesByIndexFromModules = getRequiredMemoryBytesByIndex(compiledModules);
	const requiredMemoryBytes = Math.max(
		requiredMemoryBytesByIndexFromModules[0] ?? 0,
		internalAllocator.nextByteAddress
	);
	const requiredMemoryBytesByIndex: Record<number, number> = {
		...requiredMemoryBytesByIndexFromModules,
		0: requiredMemoryBytes,
	};
	const requiredMemoryBytesByRegion = getRequiredMemoryBytesByRegion(
		requiredMemoryBytesByIndex,
		options.memoryRegions ?? []
	);
	const maxUsedMemoryIndex = Math.max(0, ...Object.keys(requiredMemoryBytesByIndex).map(Number));

	// Offset for user functions and module functions
	const userFunctionCount = definedFunctions.length;
	const getCompiledModuleFunctionIndex = (module: CompiledModule) =>
		importedFunctionCount + builtInFunctionCount + userFunctionCount + module.index;
	const entryDispatcherFunctions = entryNames.map(entryName =>
		createFunction(
			[],
			compiledModules.flatMap(module =>
				module.executionEntryName === entryName && !module.skipExecutionInCycle
					? call(getCompiledModuleFunctionIndex(module))
					: []
			)
		)
	);

	const initialMemoryDataSegments = createInitialMemoryDataSegments(compiledModules);
	const memoryInitiatorFunction = [
		...Object.entries(requiredMemoryBytesByIndex).flatMap(([memoryIndexString, requiredBytes]) => {
			const memoryIndex = Number(memoryIndexString);
			return requiredBytes > 0
				? [...i32const(0), ...i32const(0), ...i32const(requiredBytes), ...memoryFill(memoryIndex)]
				: [];
		}),
		...initialMemoryDataSegments.flatMap((segment, index) => [
			...i32const(segment.byteAddress),
			...i32const(0),
			...i32const(segment.bytes.length),
			...memoryInit(index, segment.memoryIndex),
		]),
	];

	// Strip AST from final result if not requested
	const compiledModulesMap = Object.fromEntries(compiledModules.map(module => [module.id, module]));

	const memoryImports = Array.from({ length: maxUsedMemoryIndex + 1 }, (_, memoryIndex) => {
		const requiredBytes = requiredMemoryBytesByIndex[memoryIndex] ?? 0;
		const memorySizePages = Math.max(1, Math.ceil(requiredBytes / WASM_MEMORY_PAGE_SIZE));
		const importName =
			memoryIndex === 0 ? 'memory' : getCustomMemoryRegionName(options.memoryRegions ?? [], memoryIndex);
		return createMemoryImport(
			DEFAULT_HOST_IMPORT_MODULE_NAME,
			importName,
			memorySizePages,
			memorySizePages,
			!options.disableSharedMemory
		);
	});
	const functionImports = [
		...importedUserFunctions.map(func =>
			createFunctionImport(func.import!.moduleName, func.import!.fieldName, func.typeIndex)
		),
	];

	const builtInFunctionSignatures = [0x00, ...entryNames.map(() => 0x00)];
	const builtInFunctionBodies = [createFunction([], memoryInitiatorFunction), ...entryDispatcherFunctions];
	const builtInExports = [
		createFunctionExport('initDefaults', importedFunctionCount),
		...entryNames.map((entryName, index) => createFunctionExport(entryName, importedFunctionCount + 1 + index)),
	];

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([WASM_TYPE_I32], [WASM_TYPE_I32]),
				createFunctionType([WASM_TYPE_I32, WASM_TYPE_I32], [WASM_TYPE_I32]),
				...uniqueUserFunctionTypes,
			]),
			...createImportSection([...functionImports, ...memoryImports]),
			...createFunctionSection([...builtInFunctionSignatures, ...userFunctionSignatureIndices, ...functionSignatures]),
			...createExportSection([
				...builtInExports,
				...compiledFunctions
					.filter((func): func is typeof func & { exportName: string } => !!func.exportName)
					.map(func => createFunctionExport(func.exportName, func.wasmIndex)),
			]),
			...(initialMemoryDataSegments.length > 0 ? createDataCountSection(initialMemoryDataSegments.length) : []),
			...createCodeSection([...builtInFunctionBodies, ...definedFunctions.map(func => func.body), ...cycleFunctions]),
			...(initialMemoryDataSegments.length > 0
				? createDataSection(initialMemoryDataSegments.map(segment => createPassiveDataSegment(segment.bytes)))
				: []),
		]),
		compiledModules: compiledModulesMap,
		compiledFunctions: compiledFunctionsMap,
		requiredMemoryBytes,
		...(Object.keys(requiredMemoryBytesByRegion).length > 0 ? { requiredMemoryBytesByRegion } : {}),
		cache,
	};
}
