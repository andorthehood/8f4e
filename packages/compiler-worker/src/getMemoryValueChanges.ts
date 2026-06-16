import type { CompiledModuleLookup, MemoryValueChange } from '@8f4e/language-spec';
import compareObject from './compareObject';

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

		for (const [memoryIdentifier, memory] of Object.entries(compiledModule.memory)) {
			const memoryDefault = compiledModule.memoryDefaults[memoryIdentifier];
			const previousMemoryDefault = previousModule.memoryDefaults[memoryIdentifier];
			const defaultValue = memoryDefault.value;
			const previousDefaultValue = previousMemoryDefault.value;

			if (typeof defaultValue === 'object' && typeof previousDefaultValue === 'object') {
				if (!compareObject(defaultValue, previousDefaultValue)) {
					changes.push({
						memoryIndex: memory.memoryIndex,
						...(memory.memoryRegionName ? { memoryRegionName: memory.memoryRegionName } : {}),
						wordAlignedSize: memory.wordAlignedSize,
						wordAlignedAddress: memory.wordAlignedAddress,
						value: defaultValue,
						isInteger: memory.isInteger,
						isFloat64: memory.isFloat64,
						elementWordSize: memory.elementWordSize,
					});
				}
			} else {
				if (previousDefaultValue !== defaultValue) {
					changes.push({
						memoryIndex: memory.memoryIndex,
						...(memory.memoryRegionName ? { memoryRegionName: memory.memoryRegionName } : {}),
						wordAlignedSize: memory.wordAlignedSize,
						wordAlignedAddress: memory.wordAlignedAddress,
						value: defaultValue,
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
