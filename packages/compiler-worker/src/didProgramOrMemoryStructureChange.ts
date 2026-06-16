import type { CompiledModuleLookup, PlannedMemoryDeclaration } from '@8f4e/compiler-spec';

function didMemoryDeclarationChange(current: PlannedMemoryDeclaration, previous: PlannedMemoryDeclaration): boolean {
	return (
		current.type !== previous.type ||
		current.numberOfElements !== previous.numberOfElements ||
		current.elementWordSize !== previous.elementWordSize ||
		current.memoryIndex !== previous.memoryIndex ||
		current.memoryRegionName !== previous.memoryRegionName ||
		current.byteAddress !== previous.byteAddress ||
		current.wordAlignedAddress !== previous.wordAlignedAddress ||
		current.wordAlignedSize !== previous.wordAlignedSize ||
		current.isInteger !== previous.isInteger ||
		current.isFloat64 !== previous.isFloat64 ||
		current.pointeeBaseType !== previous.pointeeBaseType ||
		current.pointerDepth !== previous.pointerDepth ||
		current.isUnsigned !== previous.isUnsigned
	);
}

function didMemoryStructureChange(
	current: CompiledModuleLookup[string]['memory'],
	previous: CompiledModuleLookup[string]['memory']
): boolean {
	const currentMemoryIds = Object.keys(current);
	const previousMemoryIds = Object.keys(previous);
	if (currentMemoryIds.length !== previousMemoryIds.length) {
		return true;
	}

	return currentMemoryIds.some(memoryId => {
		const previousDeclaration = previous[memoryId];
		return !previousDeclaration || didMemoryDeclarationChange(current[memoryId]!, previousDeclaration);
	});
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

		if (compiledModule.wordAlignedSize !== previousModule.wordAlignedSize) {
			return true;
		}

		if (didMemoryStructureChange(compiledModule.memory, previousModule.memory)) {
			return true;
		}
	}

	return false;
}
