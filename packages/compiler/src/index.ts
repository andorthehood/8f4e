import { compileToAST, createASTCache } from '@8f4e/tokenizer';
import {
	createCodeSection,
	createFunction,
	createExportSection,
	createFunctionExport,
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
import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';

import { compileModule, compileFunction } from './compiler';
import createBufferFunctionBody from './wasmBuilders/createBufferFunctionBody';
import { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
import {
	assertUniqueModuleIds,
	collectNamespacesFromASTs,
	collectFunctionMetadataFromAsts,
} from './semantic/buildNamespace';
import { EXPORTED_FUNCTION_COUNT, HEADER, VERSION } from './consts';
import sortModules from './graphOptimizer';
import { createInitialMemoryDataSegments } from './initialMemoryDataSegments';
import { getError } from './compilerError';
import { getCustomMemoryRegionName, validateMemoryRegionOptions } from './semantic/memoryRegions';

import type {
	CompileOptions,
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
	Module,
	ModuleAST,
	Namespaces,
	ParsedLineMetadata,
} from '@8f4e/compiler-spec';

export { default as instructions } from './instructionCompilers';
export {
	layoutNamespace,
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
	internalAllocator?: { nextByteAddress: number }
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
		const module = compileModule(ast, ns, moduleStartingByteAddress, index, compiledFunctions, allocator, options);
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

const BUILT_IN_EXPORT_NAMES = new Set(['init', 'cycle', 'initOnly', 'buffer']);

function assertUniqueFunctionExportNames(functions: CompiledFunctionLookup): void {
	const seen = new Set<string>();

	for (const compiledFunction of Object.values(functions)) {
		const exportName = compiledFunction.exportName;
		if (!exportName) {
			continue;
		}

		const exportLine = compiledFunction.ast.exportLine ?? compiledFunction.ast.lines[0];
		if (BUILT_IN_EXPORT_NAMES.has(exportName) || seen.has(exportName)) {
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

function parseModuleOrConstantsAST(
	code: string[],
	lineMetadata: ParsedLineMetadata | undefined,
	cache: CompilerCache,
	cacheKey: string
): ModuleAST | ConstantsAST {
	const ast = compileToAST(code, lineMetadata, cache.ast, cacheKey);
	if (ast.type === 'function') {
		throw getError(ErrorCode.MISSING_MODULE_ID, ast.lines[0], undefined);
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

export default function compile(
	modules: Module[],
	options: CompileOptions,
	functions?: Module[],
	macros?: Module[],
	cache = createCompilerCache()
): CompileResult {
	validateMemoryRegionOptions(options);
	// Parse and expand macros if provided
	const macroDefinitions = macros ? parseMacroDefinitions(macros) : new Map();

	// Expand macros in modules
	const expandedModules = macros
		? modules.map(module => {
				const expanded = expandMacros(module, macroDefinitions);
				return convertExpandedLinesToCode(expanded);
			})
		: modules.map(module => ({ code: module.code, lineMetadata: undefined }));

	// Expand macros in functions
	const expandedFunctions =
		macros && functions
			? functions.map(func => {
					const expanded = expandMacros(func, macroDefinitions);
					return convertExpandedLinesToCode(expanded);
				})
			: (functions?.map(func => ({ code: func.code, lineMetadata: undefined })) ?? []);

	// Compile to AST with line metadata for error mapping.
	const astModules = expandedModules.map(({ code, lineMetadata }, index) =>
		parseModuleOrConstantsAST(code, lineMetadata, cache, `module:${index}`)
	);
	assertUniqueModuleIds(astModules);
	const dependencyOrderedModules = sortModules(astModules);

	const namespaces = collectNamespacesFromASTs(
		dependencyOrderedModules,
		GLOBAL_ALIGNMENT_BOUNDARY,
		undefined,
		dependencyOrderedModules,
		options
	);

	// Compile functions first with WASM indices and type registry
	const astFunctions = expandedFunctions.map(({ code, lineMetadata }, index) =>
		parseFunctionAST(code, lineMetadata, cache, `function:${index}`)
	);

	// Collect pre-codegen function metadata so `call` target validation and
	// function-body codegen can rely on the same registry before compilation finishes.
	const functionMetadata = collectFunctionMetadataFromAsts(astFunctions, EXPORTED_FUNCTION_COUNT);

	// Create a shared type registry for all functions
	// Base type index is 3 (after the 3 built-in types)
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatures: [],
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map((ast, index) =>
		compileFunction(ast, namespaces, EXPORTED_FUNCTION_COUNT + index, functionTypeRegistry, functionMetadata, options)
	);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));
	assertUniqueFunctionExportNames(compiledFunctionsMap);
	const requiredMemoryBytesByIndexFromNamespaces = getRequiredMemoryBytesByIndex(Object.values(namespaces));
	const totalModuleBytes = requiredMemoryBytesByIndexFromNamespaces[0] ?? 0;
	const internalAllocator = { nextByteAddress: totalModuleBytes };

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = compiledFunctions.map(func => func.typeIndex);

	// Compile all modules in dependency order to preserve the established physical layout.
	const compiledModules = compileModules(
		dependencyOrderedModules,
		{
			...options,
			startingMemoryWordAddress: 1,
		},
		namespaces,
		compiledFunctionsMap,
		internalAllocator
	);

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
	// Generate cycle dispatcher calls, skipping modules with skipExecutionInCycle or initOnlyExecution flags
	const cycleFunction = compiledModules.flatMap(module =>
		module.skipExecutionInCycle || module.initOnlyExecution
			? []
			: call(module.index + EXPORTED_FUNCTION_COUNT + userFunctionCount)
	);

	// Generate init-only module calls (run after memory initialization)
	// Skip if skipExecutionInCycle is true (precedence rule)
	const initOnlyModuleCalls = compiledModules.flatMap(module =>
		module.initOnlyExecution && !module.skipExecutionInCycle
			? call(module.index + EXPORTED_FUNCTION_COUNT + userFunctionCount)
			: []
	);
	const initOnlyFunction = createFunction([], initOnlyModuleCalls);

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
		...initOnlyModuleCalls,
	];

	// Apply defaults for buffer options
	const bufferSize = options.bufferSize ?? 128;
	const bufferStrategy = options.bufferStrategy ?? 'loop';

	// Create buffer function (includes locals and body)
	const bufferFunction = createBufferFunctionBody(bufferSize, bufferStrategy, 1);

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
			...createImportSection(memoryImports),
			...createFunctionSection([0x00, 0x00, 0x00, 0x00, ...userFunctionSignatureIndices, ...functionSignatures]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('initOnly', 0x02),
				createFunctionExport('buffer', 0x03),
				...compiledFunctions
					.filter((func): func is typeof func & { exportName: string } => !!func.exportName)
					.map(func => createFunctionExport(func.exportName, func.wasmIndex)),
			]),
			...(initialMemoryDataSegments.length > 0 ? createDataCountSection(initialMemoryDataSegments.length) : []),
			...createCodeSection([
				createFunction([], memoryInitiatorFunction),
				createFunction([], cycleFunction),
				initOnlyFunction,
				bufferFunction,
				...compiledFunctions.map(func => func.body),
				...cycleFunctions,
			]),
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
