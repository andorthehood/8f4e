import compile, { deriveEffectiveMemorySize } from '@8f4e/compiler';
import type {
	CompileAndUpdateMemoryResult,
	CompiledModuleLookup,
	CompileInput,
	CompileOptions,
	CompilerCache,
	GetOrCreateWasmInstanceResult,
} from '@8f4e/language-spec';
import getMemoryValueChanges from './getMemoryValueChanges';
import getOrCreateMemory from './getOrCreateMemory';

let previousCompiledModules: CompiledModuleLookup | undefined;
let compilerCache: CompilerCache | undefined;

let wasmInstanceRef: WebAssembly.Instance | null = null;

async function getOrCreateWasmInstanceRef(
	codeBuffer: Uint8Array,
	memoryRef: WebAssembly.Memory,
	memoryWasRecreated: boolean
): Promise<GetOrCreateWasmInstanceResult> {
	if (wasmInstanceRef && !memoryWasRecreated) {
		return { wasmInstanceRef: wasmInstanceRef, hasWasmInstanceBeenReset: false };
	}

	const result = (await WebAssembly.instantiate(codeBuffer, {
		host: {
			memory: memoryRef,
		},
		// TODO: revisit this once in a while to check if types have been improved
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	wasmInstanceRef = result.instance;

	return { wasmInstanceRef: result.instance, hasWasmInstanceBeenReset: true };
}

export default async function compileAndUpdateMemory(
	input: CompileInput,
	compilerOptions: CompileOptions
): Promise<CompileAndUpdateMemoryResult> {
	const { codeBuffer, compiledModules, requiredMemoryBytes, compiledFunctions, cache } = compile(
		input,
		compilerOptions,
		compilerCache
	);
	compilerCache = cache;
	const allocatedMemoryBytes = deriveEffectiveMemorySize(requiredMemoryBytes);
	// We must recreate when size changes (even when shrinking) because the WASM module's
	// declared maximum must match the memory's maximum exactly
	const { memoryRef, memoryAction } = getOrCreateMemory(allocatedMemoryBytes, compiledModules, previousCompiledModules);

	const memoryWasRecreated = memoryAction.action === 'recreated';
	const { wasmInstanceRef, hasWasmInstanceBeenReset } = await getOrCreateWasmInstanceRef(
		codeBuffer,
		memoryRef,
		// TODO: add code change detection to this as well, until then we force reset
		memoryWasRecreated || true
	);
	const initDefaults = wasmInstanceRef.exports.initDefaults as CallableFunction;
	let initOnlyReran = false;

	// Memory needs initialization when:
	// - First compilation (!previousCompiledModules)
	// - Memory structure changed
	// - Memory was recreated
	const needsInitialization = !previousCompiledModules || memoryWasRecreated;

	if (needsInitialization) {
		initDefaults();
		initOnlyReran = false;
	} else {
		const memoryBufferInt = new Int32Array(memoryRef.buffer);
		const memoryBufferFloat = new Float32Array(memoryRef.buffer);
		const memoryBufferFloat64 = new Float64Array(memoryRef.buffer);
		const memoryValueChanges = getMemoryValueChanges(compiledModules, previousCompiledModules);

		memoryValueChanges.forEach(change => {
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

		initOnlyReran = false;
	}

	previousCompiledModules = compiledModules;

	return {
		codeBuffer,
		compiledModules,
		compiledFunctions,
		requiredMemoryBytes,
		allocatedMemoryBytes,
		astCacheStats: { ...cache.ast.stats },
		memoryRef,
		hasWasmInstanceBeenReset,
		memoryAction,
		initOnlyReran,
	};
}
