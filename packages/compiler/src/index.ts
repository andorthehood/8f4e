import { compileToAST, createASTCache } from '@8f4e/tokenizer';
import {
	createCodeSection,
	createFunction,
	createExportSection,
	createFunctionExport,
	createFunctionImport,
	createImportSection,
	createMemoryImport,
	createFunctionSection,
	createFunctionType,
	createTypeSection,
	call,
	i32const,
	memoryFill,
	memoryInit,
	createDataCountSection,
	createDataSection,
	createPassiveDataSegment,
	WASM_MEMORY_PAGE_SIZE,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import { ErrorCode, getInstructionSpec, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';

import { compileModule, compileFunction } from './compiler';
import createBufferFunctionBody from './wasmBuilders/createBufferFunctionBody';
import { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
import {
	assertUniqueModuleIds,
	collectNamespacesFromASTs,
	collectFunctionMetadataFromAsts,
} from './semantic/buildNamespace';
import { HEADER, VERSION } from './consts';
import { createInitialMemoryDataSegments } from './initialMemoryDataSegments';
import { getError } from './compilerError';
import { getCustomMemoryRegionName, validateMemoryRegionOptions } from './semantic/memoryRegions';

import type {
	CompileOptions,
	CompileInput,
	CompileResult,
	CompiledModule,
	CompiledModuleLookup,
	CompiledFunctionLookup,
	AST,
	ConstantsAST,
	CompilerCache,
	FunctionAST,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	ModuleAST,
	Namespaces,
	ParsedLineMetadata,
	TestAssertionMetadata,
} from '@8f4e/compiler-spec';

type ExpandedCompilerSource = {
	code: string[];
	lineMetadata: ParsedLineMetadata | undefined;
	cacheKey: string;
};

type ModuleCompilerSource = ExpandedCompilerSource & {
	groupName: string;
};

export { default as instructions } from './instructionCompilers';
export {
	assertUniqueModuleIds,
	collectFunctionMetadataFromAsts,
	collectNamespacesFromASTs,
} from './semantic/buildNamespace';
export { isMemoryDeclarationInstruction } from './semantic/declarations';
export { compileLine, compileCodegenLine } from './compiler';
export { analyzeInstruction } from './stackAnalysis/analyzeInstruction';
export { createCompilationContext } from './semantic/createCompilationContext';
export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
export { getError } from './compilerError';
export { serializeDiagnostic } from './diagnostic';
export { createInitialMemoryDataSegments };
export { default as normalizeCompileTimeArguments } from './semantic/normalizeCompileTimeArguments';
export type { InitialMemoryDataSegment } from './initialMemoryDataSegments';

export function compileModules(
	modules: Array<ModuleAST | ConstantsAST>,
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: FunctionMetadataLookup,
	internalAllocator?: { nextByteAddress: number },
	testOptions: {
		testAssertions?: TestAssertionMetadata[];
		assertFailureFunctionIndex?: number;
	} = {}
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
		const module = compileModule(ast, ns, moduleStartingByteAddress, index, compiledFunctions, allocator, {
			...options,
			...testOptions,
		});
		return module;
	});
}

function stripASTFromCompiledModules(compiledModules: CompiledModuleLookup): CompiledModuleLookup {
	const strippedModules: CompiledModuleLookup = {};
	for (const [id, module] of Object.entries(compiledModules)) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const RESERVED_EXPORT_NAMES = new Set(['initDefaults', 'buffer']);

function assertUniqueFunctionExportNames(functions: CompiledFunctionLookup, groupNames: readonly string[]): void {
	const seen = new Set<string>();
	const builtInExportNames = new Set([...RESERVED_EXPORT_NAMES, ...groupNames]);

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

function createGroupNameList(inputGroupNames: string[], includeTestRunner: boolean): string[] {
	return inputGroupNames.filter(groupName => groupName !== 'test' || includeTestRunner);
}

export default function compile(
	input: CompileInput,
	options: CompileOptions,
	cache = createCompilerCache()
): CompileResult {
	validateMemoryRegionOptions(options);
	const inputGroupNames = Object.keys(input.groups);
	const groupedModules = Object.entries(input.groups).flatMap(([groupName, modules]) =>
		modules.map((module, index) => ({ groupName, module, index }))
	);
	const constants = input.constants ?? [];
	const functions = input.functions ?? [];
	const macros = input.macros ?? [];
	const shouldExpandMacros = input.macros !== undefined;
	// Parse and expand macros if provided
	const macroDefinitions = shouldExpandMacros ? parseMacroDefinitions(macros) : new Map();

	// Expand macros in modules
	const expandedModules = groupedModules.map(({ groupName, module, index }) => {
		const expanded = shouldExpandMacros
			? convertExpandedLinesToCode(expandMacros(module, macroDefinitions))
			: { code: module.code, lineMetadata: undefined };
		return {
			...expanded,
			cacheKey: `group:${groupName}:module:${index}`,
			groupName,
		};
	}) satisfies ModuleCompilerSource[];

	const expandedConstants = constants.map((constantsBlock, index) => {
		const expanded = shouldExpandMacros
			? convertExpandedLinesToCode(expandMacros(constantsBlock, macroDefinitions))
			: { code: constantsBlock.code, lineMetadata: undefined };
		return {
			...expanded,
			cacheKey: `constants:${index}`,
		};
	}) satisfies ExpandedCompilerSource[];

	// Expand macros in functions
	const expandedFunctions = functions.map((func, index) => {
		const expanded = shouldExpandMacros
			? convertExpandedLinesToCode(expandMacros(func, macroDefinitions))
			: { code: func.code, lineMetadata: undefined };
		return {
			...expanded,
			cacheKey: `function:${index}`,
		};
	}) satisfies ExpandedCompilerSource[];

	// Compile to AST with line metadata for error mapping.
	const astModuleEntries = expandedModules.map(({ groupName, code, lineMetadata, cacheKey }) => ({
		groupName,
		ast: parseModuleAST(code, lineMetadata, cache, cacheKey),
	}));
	const astConstants = expandedConstants.map(({ code, lineMetadata, cacheKey }) =>
		parseConstantsAST(code, lineMetadata, cache, cacheKey)
	);
	const testModuleIds = astModuleEntries.filter(({ groupName }) => groupName === 'test').map(({ ast }) => ast.id);
	const activeModuleEntries = astModuleEntries.filter(entry => options.includeTestRunner || entry.groupName !== 'test');
	const groupNames = createGroupNameList(inputGroupNames, options.includeTestRunner === true);
	const activeAstModules = activeModuleEntries.map(({ ast }) => ast);
	const activeModuleGroupNames = activeModuleEntries.map(({ groupName }) => groupName);
	assertUniqueModuleIds(activeAstModules);
	const hasAssertInstruction =
		options.includeTestRunner === true &&
		activeAstModules.some(ast => ast.lines.some(line => line.instruction === 'assert'));
	const importedFunctionCount = hasAssertInstruction ? 1 : 0;
	const assertFailureFunctionIndex = hasAssertInstruction ? 0 : undefined;
	const assertFailureTypeIndex = 3;
	const builtInFunctionCount = 2 + groupNames.length;
	const userFunctionBaseIndex = importedFunctionCount + builtInFunctionCount;
	const testAssertions: TestAssertionMetadata[] = [];

	const namespaceAsts = [...activeAstModules, ...astConstants];
	const namespaces = collectNamespacesFromASTs(
		namespaceAsts,
		GLOBAL_ALIGNMENT_BOUNDARY,
		undefined,
		activeAstModules,
		options
	);

	// Compile functions first with WASM indices and type registry
	const astFunctions = expandedFunctions.map(({ code, lineMetadata, cacheKey }) =>
		parseFunctionAST(code, lineMetadata, cache, cacheKey)
	);

	// Collect pre-codegen function metadata so `call` target validation and
	// function-body codegen can rely on the same registry before compilation finishes.
	const functionMetadata = collectFunctionMetadataFromAsts(astFunctions, userFunctionBaseIndex);

	// Create a shared type registry for all functions
	// Base type index is after the built-in function types and optional assert failure import type.
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3 + (hasAssertInstruction ? 1 : 0),
	};

	const compiledFunctions = astFunctions.map((ast, index) =>
		compileFunction(ast, namespaces, userFunctionBaseIndex + index, functionTypeRegistry, functionMetadata, options)
	);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));
	assertUniqueFunctionExportNames(compiledFunctionsMap, groupNames);
	const requiredMemoryBytesByIndexFromNamespaces = getRequiredMemoryBytesByIndex(Object.values(namespaces));
	const totalModuleBytes = requiredMemoryBytesByIndexFromNamespaces[0] ?? 0;
	const internalAllocator = { nextByteAddress: totalModuleBytes };

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = compiledFunctions.map(func => func.typeIndex);

	// Compile all modules in input order so editor layout can drive execution order.
	const compiledModules = compileModules(
		activeAstModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		compiledFunctionsMap,
		internalAllocator,
		{
			...(hasAssertInstruction ? { testAssertions, assertFailureFunctionIndex } : {}),
		}
	).map((module, index) => ({
		...module,
		executionGroupName: activeModuleGroupNames[index],
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
	const userFunctionCount = compiledFunctions.length;
	const getCompiledModuleFunctionIndex = (module: CompiledModule) =>
		importedFunctionCount + builtInFunctionCount + userFunctionCount + module.index;
	const groupDispatcherFunctions = groupNames.map(groupName =>
		createFunction(
			[],
			compiledModules.flatMap(module =>
				module.executionGroupName === groupName && !module.skipExecutionInCycle
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

	// Apply defaults for buffer options
	const bufferSize = options.bufferSize ?? 128;
	const bufferStrategy = options.bufferStrategy ?? 'loop';

	// Create buffer function (includes locals and body)
	const mainGroupIndex = groupNames.indexOf('main');
	const mainGroupFunctionIndex = mainGroupIndex >= 0 ? importedFunctionCount + 2 + mainGroupIndex : undefined;
	const bufferFunction =
		mainGroupFunctionIndex === undefined
			? createFunction([], [])
			: createBufferFunctionBody(bufferSize, bufferStrategy, mainGroupFunctionIndex);

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
		return createMemoryImport('js', importName, memorySizePages, memorySizePages, !options.disableSharedMemory);
	});
	const functionImports = hasAssertInstruction
		? [createFunctionImport('test', 'assertFailed', assertFailureTypeIndex)]
		: [];

	const builtInFunctionSignatures = [0x00, 0x00, ...groupNames.map(() => 0x00)];
	const builtInFunctionBodies = [
		createFunction([], memoryInitiatorFunction),
		bufferFunction,
		...groupDispatcherFunctions,
	];
	const builtInExports = [
		createFunctionExport('initDefaults', importedFunctionCount),
		createFunctionExport('buffer', importedFunctionCount + 1),
		...groupNames.map((groupName, index) => createFunctionExport(groupName, importedFunctionCount + 2 + index)),
	];

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([WASM_TYPE_I32], [WASM_TYPE_I32]),
				createFunctionType([WASM_TYPE_I32, WASM_TYPE_I32], [WASM_TYPE_I32]),
				...(hasAssertInstruction ? [createFunctionType([WASM_TYPE_I32, WASM_TYPE_I32, WASM_TYPE_I32], [])] : []),
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
			...createCodeSection([...builtInFunctionBodies, ...compiledFunctions.map(func => func.body), ...cycleFunctions]),
			...(initialMemoryDataSegments.length > 0
				? createDataSection(initialMemoryDataSegments.map(segment => createPassiveDataSegment(segment.bytes)))
				: []),
		]),
		compiledModules: finalCompiledModules,
		compiledFunctions: compiledFunctionsMap,
		...(testModuleIds.length > 0 ? { testModuleIds } : {}),
		...(testAssertions.length > 0 ? { testAssertions } : {}),
		requiredMemoryBytes,
		...(Object.keys(requiredMemoryBytesByRegion).length > 0 ? { requiredMemoryBytesByRegion } : {}),
		cache,
	};
}
