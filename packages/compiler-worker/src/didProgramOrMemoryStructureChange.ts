import type { CompiledModule, CompiledModuleLookup, DataStructure } from '@8f4e/compiler-spec';

function didMemoryItemStructureChange(current: DataStructure, previous: DataStructure): boolean {
	return (
		current.numberOfElements !== previous.numberOfElements ||
		current.elementWordSize !== previous.elementWordSize ||
		current.type !== previous.type ||
		current.memoryIndex !== previous.memoryIndex ||
		current.memoryRegionName !== previous.memoryRegionName ||
		current.byteAddress !== previous.byteAddress ||
		current.wordAlignedSize !== previous.wordAlignedSize ||
		current.wordAlignedAddress !== previous.wordAlignedAddress ||
		current.isInteger !== previous.isInteger ||
		current.isFloat64 !== previous.isFloat64 ||
		current.pointeeBaseType !== previous.pointeeBaseType ||
		current.pointeeMemoryIndex !== previous.pointeeMemoryIndex ||
		current.pointeeMemoryRegionName !== previous.pointeeMemoryRegionName ||
		current.pointeeElementCount !== previous.pointeeElementCount ||
		current.pointerDepth !== previous.pointerDepth ||
		current.isUnsigned !== previous.isUnsigned
	);
}

function didMemoryMapStructureChange(current: CompiledModule, previous: CompiledModule): boolean {
	const currentKeys = Object.keys(current.memoryMap);
	const previousKeys = Object.keys(previous.memoryMap);

	if (currentKeys.length !== previousKeys.length) {
		return true;
	}

	for (const [id, memoryItem] of Object.entries(current.memoryMap)) {
		const previousMemoryItem = previous.memoryMap[id];
		if (!previousMemoryItem || didMemoryItemStructureChange(memoryItem, previousMemoryItem)) {
			return true;
		}
	}

	return false;
}

export default function didProgramOrMemoryStructureChange(
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

		if (compiledModule.cycleFunction.length !== previousModule.cycleFunction.length) {
			return true;
		}

		if (compiledModule.initFunctionBody.length !== previousModule.initFunctionBody.length) {
			return true;
		}

		if (
			compiledModule.memoryIndex !== previousModule.memoryIndex ||
			compiledModule.memoryRegionName !== previousModule.memoryRegionName ||
			compiledModule.byteAddress !== previousModule.byteAddress ||
			compiledModule.wordAlignedAddress !== previousModule.wordAlignedAddress
		) {
			return true;
		}

		if (compiledModule.wordAlignedSize !== previousModule.wordAlignedSize) {
			return true;
		}

		if (didMemoryMapStructureChange(compiledModule, previousModule)) {
			return true;
		}
	}

	return false;
}
