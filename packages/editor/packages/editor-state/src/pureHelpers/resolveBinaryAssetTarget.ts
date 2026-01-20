import type { State } from '~/types';

export default function resolveBinaryAssetTarget(
	state: State,
	memoryId: string
): { memoryId: string; byteAddress: number; memoryByteLength: number } | null {
	const [moduleId, memoryName] = memoryId.split('.');
	if (!moduleId || !memoryName) {
		return null;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryName];
	if (!memory) {
		return null;
	}

	return {
		memoryId,
		byteAddress: memory.byteAddress,
		memoryByteLength: memory.wordAlignedSize * 4,
	};
}
