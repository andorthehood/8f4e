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
import type {
	CompiledFunction,
	CompiledModule,
	CompileOptions,
	CompileResult,
	CompilerCache,
	FunctionTypeRegistry,
	MemoryDefaults,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
} from '@8f4e/language-spec';
import {
	DEFAULT_HOST_IMPORT_MODULE_NAME,
	GLOBAL_ALIGNMENT_BOUNDARY,
	getCustomMemoryRegionName,
} from '@8f4e/language-spec';
import createInitialMemoryDataSegments from './initialMemoryDataSegments/createInitialMemoryDataSegments';

/** Linkable compiler output consumed by the WebAssembly emitter. */
export type WasmProgramInput = {
	entryNames: string[];
	compiledModules: CompiledModule[];
	compiledFunctions: CompiledFunction[];
	functionTypeRegistry: FunctionTypeRegistry;
	memoryPlan: MemoryLayoutPlan;
	memoryDefaultsByModuleId: Record<string, MemoryDefaults>;
	pointerMetadataByModuleId: Record<string, MemoryPointerMetadataMap>;
	cache: CompilerCache;
};

/** Calculates required byte size for each WebAssembly memory index. */
function getRequiredMemoryBytesByIndex(memoryPlan: MemoryLayoutPlan) {
	return memoryPlan.moduleList.reduce<Record<number, number>>((result, item) => {
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

/**
 * Emits a complete WebAssembly binary from compiled modules, functions, and planned memory facts.
 *
 * @param program - Linkable compiler output for one source program.
 * @param options - Compiler options relevant to WebAssembly emission.
 * @returns Compiled WebAssembly program and related metadata.
 */
export function emitWasmProgram(
	program: WasmProgramInput,
	options: Pick<CompileOptions, 'disableSharedMemory' | 'memoryRegions'>
): CompileResult {
	const {
		entryNames,
		compiledModules,
		compiledFunctions,
		functionTypeRegistry,
		memoryPlan,
		memoryDefaultsByModuleId,
		pointerMetadataByModuleId,
		cache,
	} = program;
	const requiredMemoryBytesByIndexFromModules = getRequiredMemoryBytesByIndex(memoryPlan);
	const requiredMemoryBytes = requiredMemoryBytesByIndexFromModules[0] ?? 0;
	const requiredMemoryBytesByIndex: Record<number, number> = {
		...requiredMemoryBytesByIndexFromModules,
		0: requiredMemoryBytes,
	};
	const requiredMemoryBytesByRegion = getRequiredMemoryBytesByRegion(
		requiredMemoryBytesByIndex,
		options.memoryRegions ?? []
	);
	const initialMemoryDataSegments = createInitialMemoryDataSegments(memoryPlan, memoryDefaultsByModuleId);
	const cycleFunctions = compiledModules.map(({ cycleFunction }) => cycleFunction);
	const functionSignatures = compiledModules.map(() => 0x00);
	const importedUserFunctions = compiledFunctions.filter(func => func.import);
	const definedFunctions = compiledFunctions.filter(func => !func.import);
	const importedFunctionCount = importedUserFunctions.length;
	const builtInFunctionCount = 1 + entryNames.length;
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
		compiledModules: Object.fromEntries(compiledModules.map(module => [module.id, module])),
		compiledFunctions: Object.fromEntries(compiledFunctions.map(func => [func.id, func])),
		memoryPlan,
		memoryDefaultsByModuleId,
		pointerMetadataByModuleId,
		requiredMemoryBytes,
		...(Object.keys(requiredMemoryBytesByRegion).length > 0 ? { requiredMemoryBytesByRegion } : {}),
		cache,
	};
}
