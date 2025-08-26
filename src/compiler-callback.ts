import type { Project, CompilationResult } from '@8f4e/editor';
import compile, { type CompileOptions, type Module, type CompiledModuleLookup } from '@8f4e/compiler';

let previousCompiledModules: CompiledModuleLookup;

function compareMap(arr1: Map<number, number>, arr2: Map<number, number>): boolean {
	if (arr1.size !== arr2.size) {
		return false;
	}

	for (const [key, value] of arr1) {
		if (arr2.get(key) !== value) {
			return false;
		}
	}

	return true;
}

function getMemoryValueChanges(compiledModules: CompiledModuleLookup, previous: CompiledModuleLookup | undefined) {
	const changes: {
		wordAlignedSize: number;
		wordAlignedAddress: number;
		value: number | Map<number, number>;
		isInteger: boolean;
	}[] = [];

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

/**
 * Implementation of the compile callback that uses the existing compiler infrastructure.
 * This function receives project data and returns compiled modules, code buffer, and memory information.
 */
export async function compileProject(project: Project, options: CompileOptions): Promise<CompilationResult> {
	// Convert project code blocks to modules format expected by compiler
	const modules: Module[] = project.codeBlocks.map(codeBlock => ({
		code: codeBlock.code,
	}));

	// Create WebAssembly memory instance
	const memoryRef = new WebAssembly.Memory({
		initial: options.initialMemorySize,
		maximum: options.maxMemorySize,
		shared: true,
	});

	try {
		// Compile the modules to get the code buffer and compiled modules
		const { codeBuffer, compiledModules, allocatedMemorySize } = compile(modules, options);
		
		// @ts-ignore - WebAssembly.instantiate expects imports object
		const { instance } = await WebAssembly.instantiate(codeBuffer, {
			js: {
				memory: memoryRef,
			},
		});

		const init = instance.exports.init as CallableFunction;

		const memoryStructureChange = didProgramOrMemoryStructureChange(compiledModules, previousCompiledModules);

		if (!previousCompiledModules || memoryStructureChange) {
			init();
		} else {
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
		}

		previousCompiledModules = compiledModules;

		return {
			compiledModules,
			codeBuffer,
			allocatedMemorySize,
			memoryRef,
			buildErrors: [], // Always empty array on success
		};
	} catch (error) {
		// Throw the error so the editor can catch it and convert to BuildError format
		throw error;
	}
}