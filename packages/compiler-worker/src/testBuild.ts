import compile, { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler';

let previousCompiledModules: CompiledModuleLookup | undefined;

export function resetCompiledModulesCache(): void {
	previousCompiledModules = undefined;
}

function compareObject(obj1: Record<string, number>, obj2: Record<string, number>): boolean {
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) {
		return false;
	}

	for (const key of keys1) {
		if (obj2[key] !== obj1[key]) {
			return false;
		}
	}

	return true;
}

function getMemoryValueChanges(compiledModules: CompiledModuleLookup, previous: CompiledModuleLookup | undefined) {
	const changes: {
		wordAlignedSize: number;
		wordAlignedAddress: number;
		value: number | Record<string, number>;
		isInteger: boolean;
	}[] = [];

	if (!previous) {
		return [];
	}

	for (const [id, compiledModule] of Object.entries(compiledModules)) {
		const previousModule = previous[id];
		if (!previousModule) {
			break;
		}

		for (const [memoryIdentifier, memory] of Object.entries(compiledModule.memoryMap)) {
			const previousMemory = previousModule.memoryMap[memoryIdentifier];
			if (!previousMemory) {
				break;
			}

			if (typeof memory.default === 'object' && typeof previousMemory.default === 'object') {
				if (!compareObject(memory.default, previousMemory.default)) {
					changes.push({
						wordAlignedSize: memory.wordAlignedSize,
						wordAlignedAddress: memory.wordAlignedAddress,
						value: memory.default,
						isInteger: memory.isInteger,
					});
				}
			} else {
				if (previousMemory.default !== memory.default) {
					changes.push({
						wordAlignedSize: memory.wordAlignedSize,
						wordAlignedAddress: memory.wordAlignedAddress,
						value: memory.default,
						isInteger: memory.isInteger,
					});
				}
			}
		}
	}

	return changes;
}

function didProgramOrMemoryStructureChange(
	compiledModules: CompiledModuleLookup,
	previous: CompiledModuleLookup | undefined
) {
	if (!previous) {
		return true;
	}

	const currentKeys = Object.keys(compiledModules);
	const previousKeys = Object.keys(previous);

	if (currentKeys.length !== previousKeys.length) {
		return true;
	}

	for (const [id, compiledModule] of Object.entries(compiledModules)) {
		const previousModule = previous[id];
		if (!previousModule) {
			return true;
		}

		if (compiledModule.loopFunction.length !== previousModule.loopFunction.length) {
			return true;
		}

		if (compiledModule.initFunctionBody.length !== previousModule.initFunctionBody.length) {
			return true;
		}

		if (compiledModule.wordAlignedSize !== previousModule.wordAlignedSize) {
			return true;
		}
	}

	return false;
}

// Create WebAssembly memory for compilation
// This memory is shared with the compiler worker and runtimes
let memoryRefCache: WebAssembly.Memory | null = null;
let currentMemorySize = 0;
const WASM_PAGE_SIZE = 65536; // 64KiB per page

export function getOrCreateMemory(memorySizeBytes: number): WebAssembly.Memory {
	const pages = Math.ceil(memorySizeBytes / WASM_PAGE_SIZE);

	if (!memoryRefCache) {
		memoryRefCache = new WebAssembly.Memory({
			initial: pages,
			maximum: pages,
			shared: true,
		});
	}

	return memoryRefCache;
}

export default async function testBuild(
	modules: Module[],
	compilerOptions: CompileOptions
): Promise<{
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
	allocatedMemorySize: number;
	memoryRef: WebAssembly.Memory;
}> {
	const { codeBuffer, compiledModules, allocatedMemorySize } = compile(modules, compilerOptions);
	const memoryStructureChange = didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules);
	// We must recreate when size changes (even when shrinking) because the WASM module's
	// declared maximum must match the memory's maximum exactly
	const memorySizeChange = currentMemorySize !== compilerOptions.memorySizeBytes;
	currentMemorySize = compilerOptions.memorySizeBytes;

	if (memoryStructureChange || memorySizeChange) {
		memoryRefCache = null;
	}

	// Create new memory only if it doesn't exist or if the size differs
	const memoryRef = getOrCreateMemory(compilerOptions.memorySizeBytes);

	const result = (await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
		// TODO: revisit this once in a while to check if types have been improved
	})) as unknown as { instance: WebAssembly.Instance; module: WebAssembly.Module };
	const instance = result.instance;

	const init = instance.exports.init as CallableFunction;

	if (!previousCompiledModules || memoryStructureChange) {
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

	return { codeBuffer, compiledModules, allocatedMemorySize, memoryRef };
}
