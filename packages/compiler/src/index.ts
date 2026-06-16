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
	createWasmVersion,
	i32const,
	memoryFill,
	memoryInit,
	WASM_HEADER,
	WASM_MEMORY_PAGE_SIZE,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';
import type { CompileInput, CompileOptions, CompileResult } from '@8f4e/language-spec';
import { DEFAULT_HOST_IMPORT_MODULE_NAME, getCustomMemoryRegionName } from '@8f4e/language-spec';
import { compileSubProgram, createCompilerCache } from './compileSubProgram';

export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { serializeDiagnostic } from './diagnostic';

/**
 * Compiles source input into a complete WebAssembly binary program.
 *
 * @param input - Compiler input program to process.
 * @param options - Compiler options for the operation.
 * @param cache - Optional compiler cache used to reuse parsed artifacts.
 * @returns Compiled WebAssembly program and related metadata.
 */
export default function compile(
	input: CompileInput,
	options: CompileOptions,
	cache = createCompilerCache()
): CompileResult {
	const subProgram = compileSubProgram(input, options, cache);
	const {
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
	} = subProgram;
	const cycleFunctions = compiledModules.map(({ cycleFunction }) => cycleFunction);
	const functionSignatures = compiledModules.map(() => 0x00);
	const uniqueUserFunctionTypes = functionTypeRegistry.types;
	const userFunctionSignatureIndices = definedFunctions.map(func => func.typeIndex);
	const userFunctionCount = definedFunctions.length;
	const getCompiledModuleFunctionIndex = (module: (typeof compiledModules)[number]) =>
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
	const maxUsedMemoryIndex = Math.max(0, ...Object.keys(requiredMemoryBytesByIndex).map(Number));
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
	const wasmVersion = createWasmVersion(1);

	return {
		codeBuffer: Uint8Array.from([
			...WASM_HEADER,
			...wasmVersion,
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
		memoryPlan: subProgram.memoryPlan,
		memoryDefaultsByModuleId: subProgram.memoryDefaultsByModuleId,
		pointerMetadataByModuleId: subProgram.pointerMetadataByModuleId,
		requiredMemoryBytes,
		...(Object.keys(requiredMemoryBytesByRegion).length > 0 ? { requiredMemoryBytesByRegion } : {}),
		cache: subProgram.cache,
	};
}
