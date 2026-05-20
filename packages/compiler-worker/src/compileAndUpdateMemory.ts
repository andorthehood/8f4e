import compile, { deriveEffectiveMemorySize } from '@8f4e/compiler';

import getMemoryValueChanges from './getMemoryValueChanges';
import getOrCreateMemory from './getOrCreateMemory';
import didProgramOrMemoryStructureChange from './didProgramOrMemoryStructureChange';

import type {
	CompileAndUpdateMemoryResult,
	CompileOptions,
	CompiledModuleLookup,
	CompilerCache,
	GetOrCreateWasmInstanceResult,
	Module,
} from '@8f4e/compiler-spec';

let previousCompiledModules: CompiledModuleLookup | undefined;
let compilerCache: CompilerCache | undefined;

let wasmInstanceRef: WebAssembly.Instance | null = null;
let regionMemoryRefCache: Record<string, WebAssembly.Memory> = {};
let currentRegionMemorySizes: Record<string, number> = {};

function getRegionName(memoryIndex: number, compilerOptions: CompileOptions): string {
	return compilerOptions.memoryRegions?.[memoryIndex - 1] ?? `memory${memoryIndex}`;
}

function getRegionImportNames(compiledModules: CompiledModuleLookup, compilerOptions: CompileOptions): string[] {
	const maxUsedMemoryIndex = Math.max(0, ...Object.values(compiledModules).map(module => module.memoryIndex ?? 0));

	return Array.from({ length: maxUsedMemoryIndex }, (_, index) => getRegionName(index + 1, compilerOptions));
}

function getOrCreateRegionMemories(
	regionNames: string[],
	allocatedMemoryBytesByRegion: Record<string, number>,
	memoryStructureChanged: boolean
): { memoryRefsByRegion: Record<string, WebAssembly.Memory>; regionMemoryWasRecreated: boolean } {
	const nextMemoryRefsByRegion: Record<string, WebAssembly.Memory> = {};
	let regionMemoryWasRecreated = false;

	for (const regionName of regionNames) {
		const allocatedMemoryBytes = allocatedMemoryBytesByRegion[regionName] ?? deriveEffectiveMemorySize(0);
		const shouldRecreate =
			memoryStructureChanged ||
			!regionMemoryRefCache[regionName] ||
			currentRegionMemorySizes[regionName] !== allocatedMemoryBytes;

		if (shouldRecreate) {
			const pages = Math.ceil(allocatedMemoryBytes / 65536);
			regionMemoryRefCache[regionName] = new WebAssembly.Memory({
				initial: pages,
				maximum: pages,
				shared: true,
			});
			currentRegionMemorySizes[regionName] = allocatedMemoryBytes;
			regionMemoryWasRecreated = true;
		}

		nextMemoryRefsByRegion[regionName] = regionMemoryRefCache[regionName];
	}

	regionMemoryRefCache = Object.fromEntries(
		Object.entries(regionMemoryRefCache).filter(([regionName]) => regionNames.includes(regionName))
	);
	currentRegionMemorySizes = Object.fromEntries(
		Object.entries(currentRegionMemorySizes).filter(([regionName]) => regionNames.includes(regionName))
	);

	return { memoryRefsByRegion: nextMemoryRefsByRegion, regionMemoryWasRecreated };
}

async function getOrCreateWasmInstanceRef(
	codeBuffer: Uint8Array,
	memoryRef: WebAssembly.Memory,
	memoryRefsByRegion: Record<string, WebAssembly.Memory>,
	memoryWasRecreated: boolean
): Promise<GetOrCreateWasmInstanceResult> {
	if (wasmInstanceRef && !memoryWasRecreated) {
		return { wasmInstanceRef: wasmInstanceRef, hasWasmInstanceBeenReset: false };
	}

	const result = (await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
			...memoryRefsByRegion,
		},
		// TODO: revisit this once in a while to check if types have been improved
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	wasmInstanceRef = result.instance;

	return { wasmInstanceRef: result.instance, hasWasmInstanceBeenReset: true };
}

export default async function compileAndUpdateMemory(
	modules: Module[],
	compilerOptions: CompileOptions,
	functions?: Module[],
	macros?: Module[]
): Promise<CompileAndUpdateMemoryResult> {
	const { codeBuffer, compiledModules, requiredMemoryBytes, requiredMemoryBytesByRegion, compiledFunctions, cache } =
		compile(modules, compilerOptions, functions, macros, compilerCache);
	compilerCache = cache;
	const allocatedMemoryBytes = deriveEffectiveMemorySize(requiredMemoryBytes);
	const allocatedMemoryBytesByRegion = Object.fromEntries(
		Object.entries(requiredMemoryBytesByRegion ?? {}).map(([regionName, requiredBytes]) => [
			regionName,
			deriveEffectiveMemorySize(requiredBytes),
		])
	);
	// We must recreate when size changes (even when shrinking) because the WASM module's
	// declared maximum must match the memory's maximum exactly
	const { memoryRef, memoryAction } = getOrCreateMemory(allocatedMemoryBytes, compiledModules, previousCompiledModules);
	const memoryStructureChanged = didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules);
	const { memoryRefsByRegion, regionMemoryWasRecreated } = getOrCreateRegionMemories(
		getRegionImportNames(compiledModules, compilerOptions),
		allocatedMemoryBytesByRegion,
		memoryStructureChanged
	);

	const memoryWasRecreated = memoryAction.action === 'recreated' || regionMemoryWasRecreated;
	const { wasmInstanceRef, hasWasmInstanceBeenReset } = await getOrCreateWasmInstanceRef(
		codeBuffer,
		memoryRef,
		memoryRefsByRegion,
		// TODO: add code change detection to this as well, until then we force reset
		memoryWasRecreated || true
	);
	const init = wasmInstanceRef.exports.init as CallableFunction;
	const runInitOnly = wasmInstanceRef.exports.initOnly as CallableFunction | undefined;
	const hasInitOnlyModules = Object.values(compiledModules).some(
		module => module.initOnlyExecution && !module.skipExecutionInCycle
	);
	let initOnlyReran = false;

	// Memory needs initialization when:
	// - First compilation (!previousCompiledModules)
	// - Memory structure changed
	// - Memory was recreated
	const needsInitialization = !previousCompiledModules || memoryWasRecreated;

	if (needsInitialization) {
		init();
		initOnlyReran = false;
	} else {
		const memoryValueChanges = getMemoryValueChanges(compiledModules, previousCompiledModules);

		const hasDefaultChanges = memoryValueChanges.length > 0;
		memoryValueChanges.forEach(change => {
			const targetMemory =
				(change.memoryIndex ?? 0) === 0
					? memoryRef
					: memoryRefsByRegion[change.memoryRegionName ?? getRegionName(change.memoryIndex ?? 0, compilerOptions)];
			const memoryBufferInt = new Int32Array(targetMemory.buffer);
			const memoryBufferFloat = new Float32Array(targetMemory.buffer);
			const memoryBufferFloat64 = new Float64Array(targetMemory.buffer);
			if (change.isInteger) {
				if (typeof change.value === 'object') {
					Object.entries(change.value).forEach(([index, item]) => {
						memoryBufferInt[change.wordAlignedAddress + parseInt(index, 10)] = item;
					});
				} else {
					memoryBufferInt[change.wordAlignedAddress] = change.value;
				}
			} else if (change.elementWordSize === 8 && !change.isInteger) {
				const float64Index = change.wordAlignedAddress / 2;
				if (typeof change.value === 'object') {
					Object.entries(change.value).forEach(([index, item]) => {
						memoryBufferFloat64[float64Index + parseInt(index, 10)] = item;
					});
				} else {
					memoryBufferFloat64[float64Index] = change.value;
				}
			} else {
				if (typeof change.value === 'object') {
					Object.entries(change.value).forEach(([index, item]) => {
						memoryBufferFloat[change.wordAlignedAddress + parseInt(index, 10)] = item;
					});
				} else {
					memoryBufferFloat[change.wordAlignedAddress] = change.value;
				}
			}
		});

		if (hasDefaultChanges && hasInitOnlyModules) {
			runInitOnly?.();
			initOnlyReran = Boolean(runInitOnly);
		}
	}

	previousCompiledModules = compiledModules;

	return {
		codeBuffer,
		compiledModules,
		compiledFunctions,
		requiredMemoryBytes,
		...(requiredMemoryBytesByRegion ? { requiredMemoryBytesByRegion } : {}),
		allocatedMemoryBytes,
		...(Object.keys(allocatedMemoryBytesByRegion).length > 0 ? { allocatedMemoryBytesByRegion } : {}),
		astCacheStats: { ...cache.ast.stats },
		memoryRef,
		...(Object.keys(memoryRefsByRegion).length > 0 ? { memoryRefsByRegion } : {}),
		hasWasmInstanceBeenReset,
		memoryAction,
		initOnlyReran,
	};
}
