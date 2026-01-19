import compile, { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler';

import getMemoryValueChanges from './getMemoryValueChanges';
import getOrCreateMemory from './getOrCreateMemory';

import type { CompileAndUpdateMemoryResult, GetOrCreateWasmInstanceResult } from './types';

let previousCompiledModules: CompiledModuleLookup | undefined;

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
		js: {
			memory: memoryRef,
		},
		// TODO: revisit this once in a while to check if types have been improved
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };

	wasmInstanceRef = result.instance;

	return { wasmInstanceRef: result.instance, hasWasmInstanceBeenReset: true };
}

export default async function compileAndUpdateMemory(
	modules: Module[],
	compilerOptions: CompileOptions,
	functions?: Module[]
): Promise<CompileAndUpdateMemoryResult> {
	const { codeBuffer, compiledModules, allocatedMemorySize, compiledFunctions } = compile(
		modules,
		compilerOptions,
		functions
	);
	// We must recreate when size changes (even when shrinking) because the WASM module's
	// declared maximum must match the memory's maximum exactly
	const { memoryRef, memoryAction } = getOrCreateMemory(
		compilerOptions.memorySizeBytes,
		compiledModules,
		previousCompiledModules
	);

	const memoryWasRecreated = memoryAction.action === 'recreated';
	const { wasmInstanceRef, hasWasmInstanceBeenReset } = await getOrCreateWasmInstanceRef(
		codeBuffer,
		memoryRef,
		// TODO: add code change detection to this as well, until then we force reset
		memoryWasRecreated || true
	);
	const init = wasmInstanceRef.exports.init as CallableFunction;

	// Memory needs initialization when:
	// - First compilation (!previousCompiledModules)
	// - Memory structure changed
	// - Memory was recreated
	const needsInitialization = !previousCompiledModules || memoryWasRecreated;

	if (needsInitialization) {
		init();
	} else {
		const memoryBufferInt = new Int32Array(memoryRef.buffer);
		const memoryBufferFloat = new Float32Array(memoryRef.buffer);
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
	}

	previousCompiledModules = compiledModules;

	return {
		codeBuffer,
		compiledModules,
		compiledFunctions,
		allocatedMemorySize,
		memoryRef,
		hasWasmInstanceBeenReset,
		memoryAction,
	};
}
