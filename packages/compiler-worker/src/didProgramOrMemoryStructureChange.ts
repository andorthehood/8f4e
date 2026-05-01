import type { CompiledModuleMetadataLookup } from '@8f4e/compiler-types';

export default function didProgramOrMemoryStructureChange(
	compiledModules: CompiledModuleMetadataLookup,
	previous: CompiledModuleMetadataLookup | undefined,
	codeBufferLength?: number,
	previousCodeBufferLength?: number
) {
	if (!previous) {
		return true;
	}

	if (
		codeBufferLength !== undefined &&
		previousCodeBufferLength !== undefined &&
		codeBufferLength !== previousCodeBufferLength
	) {
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

		if (compiledModule.wordAlignedSize !== previousModule.wordAlignedSize) {
			return true;
		}
	}

	return false;
}
