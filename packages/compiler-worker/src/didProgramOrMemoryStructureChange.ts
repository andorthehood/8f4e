import type { CompiledModuleLookup } from '@8f4e/compiler-spec';

function didRegionPlacementChange(
	current: { memoryIndex?: number; memoryRegionName?: string },
	previous: { memoryIndex?: number; memoryRegionName?: string }
): boolean {
	return current.memoryIndex !== previous.memoryIndex || current.memoryRegionName !== previous.memoryRegionName;
}

function didMemoryMapRegionPlacementChange(
	compiledModule: CompiledModuleLookup[string],
	previousModule: CompiledModuleLookup[string]
): boolean {
	const memoryKeys = Object.keys(compiledModule.memoryMap);
	const previousMemoryKeys = Object.keys(previousModule.memoryMap);
	if (memoryKeys.length !== previousMemoryKeys.length) {
		return true;
	}

	for (const [id, data] of Object.entries(compiledModule.memoryMap)) {
		const previousData = previousModule.memoryMap[id];
		if (!previousData || didRegionPlacementChange(data, previousData)) {
			return true;
		}
	}

	return false;
}

function didInternalResourcesChange(
	compiledModule: CompiledModuleLookup[string],
	previousModule: CompiledModuleLookup[string]
): boolean {
	const resources = compiledModule.internalResources ?? {};
	const previousResources = previousModule.internalResources ?? {};
	const resourceKeys = Object.keys(resources);
	const previousResourceKeys = Object.keys(previousResources);

	if (resourceKeys.length !== previousResourceKeys.length) {
		return true;
	}

	for (const [id, resource] of Object.entries(resources)) {
		const previousResource = previousResources[id];
		if (!previousResource) {
			return true;
		}

		if (
			didRegionPlacementChange(resource, previousResource) ||
			resource.byteAddress !== previousResource.byteAddress ||
			resource.wordAlignedAddress !== previousResource.wordAlignedAddress ||
			resource.wordAlignedSize !== previousResource.wordAlignedSize ||
			resource.elementWordSize !== previousResource.elementWordSize ||
			resource.default !== previousResource.default ||
			resource.storageType !== previousResource.storageType
		) {
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

		if (compiledModule.wordAlignedSize !== previousModule.wordAlignedSize) {
			return true;
		}

		if (
			compiledModule.memoryIndex !== previousModule.memoryIndex ||
			compiledModule.memoryRegionName !== previousModule.memoryRegionName
		) {
			return true;
		}

		if (didMemoryMapRegionPlacementChange(compiledModule, previousModule)) {
			return true;
		}

		if (didInternalResourcesChange(compiledModule, previousModule)) {
			return true;
		}
	}

	return false;
}
