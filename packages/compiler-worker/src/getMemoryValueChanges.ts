import compareObject from './compareObject';

import type { CompiledModuleLookup } from '@8f4e/compiler';
import type { MemoryValueChange } from './types';

export default function getMemoryValueChanges(
	compiledModules: CompiledModuleLookup,
	previous: CompiledModuleLookup | undefined
): MemoryValueChange[] {
	const changes: MemoryValueChange[] = [];

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
						isFloat64: memory.isFloat64,
						elementWordSize: memory.elementWordSize,
					});
				}
			} else {
				if (previousMemory.default !== memory.default) {
					changes.push({
						wordAlignedSize: memory.wordAlignedSize,
						wordAlignedAddress: memory.wordAlignedAddress,
						value: memory.default,
						isInteger: memory.isInteger,
						isFloat64: memory.isFloat64,
						elementWordSize: memory.elementWordSize,
					});
				}
			}
		}
	}

	return changes;
}
