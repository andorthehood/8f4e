import { compileToAST } from '@8f4e/tokenizer';
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
	Type,
	call,
	i32const,
	memoryInit,
	createDataCountSection,
	createDataSection,
	createPassiveDataSegment,
	WASM_MEMORY_PAGE_SIZE,
} from '@8f4e/compiler-wasm-utils';

import { compileModule, compileFunction } from './compiler';
import createBufferFunctionBody from './wasmBuilders/createBufferFunctionBody';
import { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
import {
	assertUniqueModuleIds,
	collectNamespacesFromASTs,
	collectFunctionMetadataFromAsts,
} from './semantic/buildNamespace';
import { EXPORTED_FUNCTION_COUNT, GLOBAL_ALIGNMENT_BOUNDARY, HEADER, VERSION } from './consts';
import sortModules from './graphOptimizer';
import { createInitialMemoryDataSegments } from './initialMemoryDataSegments';

import type {
	AST,
	CompileOptions,
	CompiledModule,
	CompiledModuleLookup,
	CompiledFunctionLookup,
	FunctionTypeRegistry,
	Module,
	Namespaces,
} from '@8f4e/compiler-types';

export {
	I16_SIGNED_LARGEST_NUMBER,
	I16_SIGNED_SMALLEST_NUMBER,
	GLOBAL_ALIGNMENT_BOUNDARY,
	SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS,
	BYTE_MEMORY_ACCESS_WIDTH,
	HALF_WORD_MEMORY_ACCESS_WIDTH,
	WORD_MEMORY_ACCESS_WIDTH,
	DOUBLE_WORD_MEMORY_ACCESS_WIDTH,
} from './consts';
export { default as instructions } from './instructionCompilers';
export {
	prepassNamespace,
	assertUniqueModuleIds,
	collectNamespacesFromASTs,
	collectFunctionMetadataFromAsts,
} from './semantic/buildNamespace';
export { isMemoryDeclarationInstruction } from './semantic/declarations';
export { compileLine, compileCodegenLine } from './compiler';
export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from './utils/macroExpansion';
export { ErrorCode, getError } from './compilerError';
export { serializeDiagnostic } from './diagnostic';
export { createInitialMemoryDataSegments };
export type { InitialMemoryDataSegment } from './initialMemoryDataSegments';

export function compileModules(
	modules: AST[],
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: CompiledFunctionLookup,
	internalAllocator?: { nextByteAddress: number }
): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress ?? 0;
	const ns: Namespaces =
		namespaces ?? collectNamespacesFromASTs(modules, memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY, compiledFunctions);
	const allocator = internalAllocator ?? {
		nextByteAddress: Object.values(ns).reduce((max, namespace) => {
			const byteAddress = namespace.byteAddress ?? 0;
			const wordAlignedSize = namespace.wordAlignedSize ?? 0;
			return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
		}, 0),
	};

	return modules.map((ast, index) => {
		const module = compileModule(
			ast,
			ns,
			memoryAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			index,
			compiledFunctions,
			allocator
		);
		memoryAddress += module.wordAlignedSize;
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

export default function compile(
	modules: Module[],
	options: CompileOptions,
	functions?: Module[],
	macros?: Module[]
): {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	compiledFunctions?: CompiledFunctionLookup;
	requiredMemoryBytes: number;
} {
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
	const astModules = expandedModules.map(({ code, lineMetadata }) => compileToAST(code, lineMetadata));
	assertUniqueModuleIds(astModules);
	const dependencyOrderedModules = sortModules(astModules);

	const namespaces = collectNamespacesFromASTs(dependencyOrderedModules, GLOBAL_ALIGNMENT_BOUNDARY);

	// Compile functions first with WASM indices and type registry
	const astFunctions = expandedFunctions.map(({ code, lineMetadata }) => compileToAST(code, lineMetadata));

	// Collect pre-codegen function metadata so `call` target validation and
	// function-body codegen can rely on the same registry before compilation finishes.
	const functionMetadata = collectFunctionMetadataFromAsts(astFunctions, EXPORTED_FUNCTION_COUNT);

	// Create a shared type registry for all functions
	// Base type index is 3 (after the 3 built-in types)
	const functionTypeRegistry: FunctionTypeRegistry = {
		types: [],
		signatureMap: new Map(),
		baseTypeIndex: 3,
	};

	const compiledFunctions = astFunctions.map((ast, index) =>
		compileFunction(ast, namespaces, EXPORTED_FUNCTION_COUNT + index, functionTypeRegistry, functionMetadata)
	);
	const compiledFunctionsMap = Object.fromEntries(compiledFunctions.map(func => [func.id, func]));
	const totalModuleBytes = Object.values(namespaces).reduce((max, namespace) => {
		const byteAddress = namespace.byteAddress ?? 0;
		const wordAlignedSize = namespace.wordAlignedSize ?? 0;
		return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
	}, 0);
	const internalAllocator = { nextByteAddress: totalModuleBytes };

	// Extract the unique function types and type indices from the registry
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = compiledFunctions.map(func => func.typeIndex!);

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
	const requiredMemoryBytes =
		compiledModules.length === 0
			? internalAllocator.nextByteAddress
			: Math.max(
					compiledModules[compiledModules.length - 1].byteAddress +
						compiledModules[compiledModules.length - 1].wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY,
					internalAllocator.nextByteAddress
				);

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

	const initialMemoryDataSegments = createInitialMemoryDataSegments(compiledModules, requiredMemoryBytes);
	const memoryInitiatorFunction = [
		...initialMemoryDataSegments.flatMap((segment, index) => [
			...i32const(segment.byteAddress),
			...i32const(0),
			...i32const(segment.bytes.length),
			...memoryInit(index, 0),
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

	// Round up to whole wasm pages (64 KiB each); memory cannot be imported with fractional pages.
	const memorySizePages = Math.max(1, Math.ceil(requiredMemoryBytes / WASM_MEMORY_PAGE_SIZE));

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([Type.I32], [Type.I32]),
				createFunctionType([Type.I32, Type.I32], [Type.I32]),
				...uniqueUserFunctionTypes,
			]),
			...createImportSection([
				createMemoryImport('js', 'memory', memorySizePages, memorySizePages, !options.disableSharedMemory),
			]),
			...createFunctionSection([0x00, 0x00, 0x00, 0x00, ...userFunctionSignatureIndices, ...functionSignatures]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('initOnly', 0x02),
				createFunctionExport('buffer', 0x03),
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
	};
}
