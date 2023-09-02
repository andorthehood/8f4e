import compile, { CompiledModuleLookup, CompileOptions, Module } from '@8f4e/compiler';

let previousCompiledModules: CompiledModuleLookup;

function compareArray(arr1: number[], arr2: number[]): boolean {
	return arr1.length === arr2.length && arr1.every((item, index) => item === arr2[index]);
}

function getMemoryValueChanges(compiledModules: CompiledModuleLookup, previous: CompiledModuleLookup | undefined) {
	const changes: { wordSize: number; wordAddress: number; value: number | number[]; isInteger: boolean }[] = [];

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

			if (Array.isArray(memory.default) && Array.isArray(previousMemory.default)) {
				if (!compareArray(memory.default, previousMemory.default)) {
					changes.push({
						wordSize: memory.wordSize,
						wordAddress: memory.wordAddress,
						value: memory.default,
						isInteger: memory.isInteger,
					});
				}
			} else {
				if (previousMemory.default !== memory.default) {
					changes.push({
						wordSize: memory.wordSize,
						wordAddress: memory.wordAddress,
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
			if (Array.isArray(change.value)) {
				change.value.forEach((item, index) => {
					memoryBufferInt[change.wordAddress + index] = item;
				});
			} else {
				memoryBufferInt[change.wordAddress] = change.value;
			}
		} else {
			if (Array.isArray(change.value)) {
				change.value.forEach((item, index) => {
					memoryBufferFloat[change.wordAddress + index] = item;
				});
			} else {
				memoryBufferFloat[change.wordAddress] = change.value;
			}
		}
	});

	previousCompiledModules = compiledModules;

	return { codeBuffer, compiledModules };
}
