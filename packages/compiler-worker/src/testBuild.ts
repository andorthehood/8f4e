import compile, { CompileOptions, CompiledModuleLookup, Module } from '@8f4e/compiler';

let previousCompiledModules: CompiledModuleLookup;

function compareMap(arr1: Map<number, number>, arr2: Map<number, number>): boolean {
	return (
		arr1.size === arr2.size &&
		Array.from(arr1.values()).every((item, index) => item === arr2[index]) &&
		Array.from(arr1.keys()).every((item, index) => item === arr2[index])
	);
}

function getMemoryValueChanges(compiledModules: CompiledModuleLookup, previous: CompiledModuleLookup | undefined) {
	const changes: { wordAlignedSize: number; wordAlignedAddress: number; value: number | Map<number, number>; isInteger: boolean }[] =
		[];

	if (!previous) {
		return [];
	}

	for (const [id, compiledModule] of compiledModules) {
		const previousModule = previous.get(id);
		if (!previousModule) {
			break;
		}

		for (const [memoryIdentifier, memory] of compiledModule.memoryMap) {
			const previousMemory = previousModule.memoryMap.get(memoryIdentifier);
			if (!previousMemory) {
				break;
			}

			if (memory.default instanceof Map && previousMemory.default instanceof Map) {
				if (!compareMap(memory.default, previousMemory.default)) {
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

	if (compiledModules.size !== previous.size) {
		return true;
	}

	for (const [id, compiledModule] of compiledModules) {
		const previousModule = previous.get(id);
		if (!previousModule) {
			return true;
		}

		if (compiledModule.functionBody.length !== previousModule.functionBody.length) {
			return true;
		}

		if (compiledModule.memoryWordSize !== previousModule.memoryWordSize) {
			return true;
		}
	}

	return false;
}

export default async function testBuild(
	memoryRef: WebAssembly.Memory,
	modules: Module[],
	compilerOptions: CompileOptions
): Promise<{ codeBuffer: Uint8Array; compiledModules: CompiledModuleLookup }> {
	const { codeBuffer, compiledModules } = compile(modules, compilerOptions);
	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const init = instance.exports.init as CallableFunction;

	if (!previousCompiledModules || didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules)) {
		init();
	}

	const memoryBufferInt = new Int32Array(memoryRef.buffer);
	const memoryBufferFloat = new Float32Array(memoryRef.buffer);
	const memoryValueChanges = getMemoryValueChanges(compiledModules, previousCompiledModules);

	memoryValueChanges.forEach(change => {
		if (change.isInteger) {
			if (change.value instanceof Map) {
				change.value.forEach((item, index) => {
					memoryBufferInt[change.wordAlignedAddress + index] = item;
				});
			} else {
				memoryBufferInt[change.wordAlignedAddress] = change.value;
			}
		} else {
			if (change.value instanceof Map) {
				change.value.forEach((item, index) => {
					memoryBufferFloat[change.wordAlignedAddress + index] = item;
				});
			} else {
				memoryBufferFloat[change.wordAlignedAddress] = change.value;
			}
		}
	});

	previousCompiledModules = compiledModules;

	return { codeBuffer, compiledModules };
}
