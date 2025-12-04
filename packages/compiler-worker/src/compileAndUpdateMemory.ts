import compile, { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler';

import { didProgramOrMemoryStructureChange } from './didProgramOrMemoryStructureChange';
import { getMemoryValueChanges } from './getMemoryValueChanges';
import { getOrCreateMemory } from './getOrCreateMemory';

let previousCompiledModules: CompiledModuleLookup | undefined;

let wasmInstanceRef: WebAssembly.Instance | null = null;

async function getOrCreateWasmInstanceRef(
	codeBuffer: Uint8Array,
	memoryRef: WebAssembly.Memory,
	hasMemoryBeenReset: boolean
): Promise<{ wasmInstanceRef: WebAssembly.Instance; hasWasmInstanceBeenReset: boolean }> {
	if (wasmInstanceRef && !hasMemoryBeenReset) {
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
	compilerOptions: CompileOptions
): Promise<{
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	allocatedMemorySize: number;
	memoryRef: WebAssembly.Memory;
	hasMemoryBeenInitialized: boolean;
	hasMemoryBeenReset: boolean;
	hasWasmInstanceBeenReset: boolean;
}> {
	const { codeBuffer, compiledModules, allocatedMemorySize } = compile(modules, compilerOptions);
	const memoryStructureChange = didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules);
	// We must recreate when size changes (even when shrinking) because the WASM module's
	// declared maximum must match the memory's maximum exactly
	const { memoryRef, hasMemoryBeenReset } = getOrCreateMemory(compilerOptions.memorySizeBytes, memoryStructureChange);
	const { wasmInstanceRef, hasWasmInstanceBeenReset } = await getOrCreateWasmInstanceRef(
		codeBuffer,
		memoryRef,
		// TODO: add code change detection to this as well, until then we force reset
		hasMemoryBeenReset || true
	);
	const init = wasmInstanceRef.exports.init as CallableFunction;

	let hasMemoryBeenInitialized = false;

	if (!previousCompiledModules || memoryStructureChange) {
		init();
		hasMemoryBeenInitialized = true;
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
		allocatedMemorySize,
		memoryRef,
		hasMemoryBeenInitialized,
		hasMemoryBeenReset,
		hasWasmInstanceBeenReset,
	};
}
