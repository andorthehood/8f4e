import type {
	AST,
	CompiledFunctionLookup,
	CompiledModule,
	CompiledModuleLookup,
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
	Namespaces,
	ParsedLineMetadata,
	PrototypeAST,
	ShapeLine,
} from '@8f4e/compiler-spec';
import {
	DEFAULT_HOST_IMPORT_MODULE_NAME,
	ErrorCode,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getInstructionSpec,
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
import { compileToAST, createASTCache, parseLine } from '@8f4e/tokenizer';
import { compileFunction, compileModule } from './compiler';
import { getError } from './compilerError';
import { HEADER, VERSION } from './consts';
import { createInitialMemoryDataSegments } from './initialMemoryDataSegments';
import {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
import { getCustomMemoryRegionName, validateMemoryRegionOptions } from './semantic/memoryRegions';
import { convertExpandedLinesToCode, expandMacros, parseMacroDefinitions } from './utils/macroExpansion';

type ExpandedCompilerSource = {
	code: string[];
	lineMetadata: ParsedLineMetadata | undefined;
	cacheKey: string;
};

type ModuleCompilerSource = ExpandedCompilerSource & {
	entryName: string;
};

type ParsedPrototypeSource = {
	ast: PrototypeAST;
	source: ExpandedCompilerSource;
};

export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { compileCodegenLine, compileLine } from './compiler';
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
export { convertExpandedLinesToCode, expandMacros, parseMacroDefinitions } from './utils/macroExpansion';
export { createInitialMemoryDataSegments };

export function compileModules(
	modules: Array<ModuleAST | ConstantsAST>,
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: FunctionMetadataLookup,
	internalAllocator?: { nextByteAddress: number },
	typeRegistry?: FunctionTypeRegistry
): CompiledModule[] {
	const startingByteAddress = (options.startingMemoryWordAddress ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	const ns: Namespaces =
		namespaces ?? collectNamespacesFromASTs(modules, startingByteAddress, compiledFunctions, modules, options);
	const allocator = internalAllocator ?? {
		nextByteAddress: Object.values(ns).reduce((max, namespace) => {
			if (namespace.memoryIndex !== 0) {
				return max;
			}
			const byteAddress = namespace.byteAddress ?? 0;
			const wordAlignedSize = namespace.wordAlignedSize ?? 0;
			return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
		}, 0),
	};

	return modules.map((ast, index) => {
		const moduleStartingByteAddress =
			ns[ast.id]?.byteAddress !== undefined ? ns[ast.id].byteAddress : startingByteAddress;
		const module = compileModule(
			ast,
			ns,
			moduleStartingByteAddress,
			index,
			compiledFunctions,
			allocator,
			options,
			typeRegistry
		);
		return module;
	});
}

function stripASTFromCompiledModules(compiledModules: CompiledModuleLookup): CompiledModuleLookup {
	const strippedModules: CompiledModuleLookup = {};
	for (const [id, module] of Object.entries(compiledModules)) {
		const { ast, ...moduleWithoutAST } = module;
		strippedModules[id] = moduleWithoutAST as CompiledModule;
	}
	return strippedModules;
}

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

function parseModuleAST(
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined,
	cache: CompilerCache,
	cacheKey: string
): ModuleAST {
	const ast = compileToAST(code, lineMetadata, cache.ast, cacheKey);
	if (ast.type !== 'module') {
		throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
	}
	return ast;
}

function parseConstantsAST(
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined,
	cache: CompilerCache,
	cacheKey: string
): ConstantsAST {
	const ast = compileToAST(code, lineMetadata, cache.ast, cacheKey);
	if (ast.type !== 'constants') {
		throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
	}
	for (const line of ast.lines) {
		if (line.instruction === 'constants') {
			continue;
		}

		const spec = getInstructionSpec(line.instruction) as { allowedInConstantsBlocks?: boolean } | undefined;
		if (spec?.allowedInConstantsBlocks !== true) {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, undefined);
		}
	}
	return ast;
}

function parseFunctionAST(
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined,
	cache: CompilerCache,
	cacheKey: string
): FunctionAST {
	const ast = compileToAST(code, lineMetadata, cache.ast, cacheKey);
	if (ast.type !== 'function') {
		throw getError(ErrorCode.MISSING_FUNCTION_ID, ast.lines[0], undefined);
	}
	return ast;
}

function parsePrototypeAST(
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined,
	cache: CompilerCache,
	cacheKey: string
): PrototypeAST {
	const ast = compileToAST(code, lineMetadata, cache.ast, cacheKey);
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

function startsWithInstruction(line: string, instruction: string): boolean {
	const nextCharacter = line[instruction.length];
	return line === instruction || (line.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t'));
}

function getSourceLineMetadata(
	source: ExpandedCompilerSource,
	lineNumberAfterMacroExpansion: number
): ParsedLineMetadata[number] {
	return source.lineMetadata?.[lineNumberAfterMacroExpansion] ?? { callSiteLineNumber: lineNumberAfterMacroExpansion };
}

function getOriginalSourceLine(source: ExpandedCompilerSource, lineNumberAfterMacroExpansion: number): string {
	return source.code[lineNumberAfterMacroExpansion] ?? '';
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
	prototypeSourcesById: ReadonlyMap<string, ParsedPrototypeSource>
): ModuleCompilerSource {
	const code: string[] = [];
	const lineMetadata: ParsedLineMetadata = [];
	let expandedAnyShape = false;

	for (
		let lineNumberAfterMacroExpansion = 0;
		lineNumberAfterMacroExpansion < source.code.length;
		lineNumberAfterMacroExpansion++
	) {
		const line = source.code[lineNumberAfterMacroExpansion];
		const trimmed = line.trim();

		if (!startsWithInstruction(trimmed, 'shape')) {
			code.push(line);
			lineMetadata.push(getSourceLineMetadata(source, lineNumberAfterMacroExpansion));
			continue;
		}

		const sourceMetadata = getSourceLineMetadata(source, lineNumberAfterMacroExpansion);
		const shapeLine = parseLine(line, sourceMetadata.callSiteLineNumber, lineNumberAfterMacroExpansion) as ShapeLine;
		if (shapeLine.instruction !== 'shape') {
			code.push(line);
			lineMetadata.push(sourceMetadata);
			continue;
		}

		const prototypeId = shapeLine.arguments[0].value;
		const prototype = prototypeSourcesById.get(prototypeId);
		if (!prototype) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, shapeLine, undefined, { identifier: prototypeId });
		}

		expandedAnyShape = true;
		for (const declarationLine of prototype.ast.memoryDeclarationLines) {
			const prototypeLineNumber = declarationLine.lineNumberAfterMacroExpansion;
			code.push(getOriginalSourceLine(prototype.source, prototypeLineNumber));
			lineMetadata.push(getSourceLineMetadata(prototype.source, prototypeLineNumber));
		}
	}

	if (!expandedAnyShape) {
		return source;
	}

	return {
		...source,
		code,
		lineMetadata,
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
		const expanded = convertExpandedLinesToCode(expandMacros(prototype, macroDefinitions));
		return {
			...expanded,
			cacheKey: `prototype:${index}`,
		};
	}) satisfies ExpandedCompilerSource[];

	const astPrototypes = expandedPrototypes.map(({ code, lineMetadata, cacheKey }) => ({
		ast: parsePrototypeAST(code, lineMetadata, cache, cacheKey),
		source: { code, lineMetadata, cacheKey },
	})) satisfies ParsedPrototypeSource[];
	const prototypeSourcesById = collectPrototypeSources(astPrototypes);

	// Expand macros and prototype shapes in modules
	const expandedModules = entryModules.map(({ entryName, module, index }) => {
		const expanded = convertExpandedLinesToCode(expandMacros(module, macroDefinitions));
		return expandModuleSourceShapes(
			{
				...expanded,
				cacheKey: `entry:${entryName}:module:${index}`,
				entryName,
			},
			prototypeSourcesById
		);
	}) satisfies ModuleCompilerSource[];

	const expandedConstants = constants.map((constantsBlock, index) => {
		const expanded = convertExpandedLinesToCode(expandMacros(constantsBlock, macroDefinitions));
		return {
			...expanded,
			cacheKey: `constants:${index}`,
		};
	}) satisfies ExpandedCompilerSource[];

	// Expand macros in functions
	const expandedFunctions = functions.map((func, index) => {
		const expanded = convertExpandedLinesToCode(expandMacros(func, macroDefinitions));
		return {
			...expanded,
			cacheKey: `function:${index}`,
		};
	}) satisfies ExpandedCompilerSource[];

	// Compile to AST with line metadata for error mapping.
	const astModuleEntries = expandedModules.map(({ entryName, code, lineMetadata, cacheKey }) => ({
		entryName,
		ast: parseModuleAST(code, lineMetadata, cache, cacheKey),
	}));
	const astConstants = expandedConstants.map(({ code, lineMetadata, cacheKey }) =>
		parseConstantsAST(code, lineMetadata, cache, cacheKey)
	);
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
	const astFunctions = expandedFunctions.map(({ code, lineMetadata, cacheKey }) =>
		parseFunctionAST(code, lineMetadata, cache, cacheKey)
	);
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
	const compiledModulesMap = Object.fromEntries(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }]));
	const finalCompiledModules = options.includeAST
		? compiledModulesMap
		: stripASTFromCompiledModules(compiledModulesMap);

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
		compiledModules: finalCompiledModules,
		compiledFunctions: compiledFunctionsMap,
		requiredMemoryBytes,
		...(Object.keys(requiredMemoryBytesByRegion).length > 0 ? { requiredMemoryBytesByRegion } : {}),
		cache,
	};
}
