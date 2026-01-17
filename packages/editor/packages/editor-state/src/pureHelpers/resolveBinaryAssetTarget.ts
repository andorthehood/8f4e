import type { State } from '~/types';

export default function resolveBinaryAssetTarget(
	state: State,
	memoryId: string
): { moduleId: string; memoryName: string; byteAddress: number; byteLength: number } | null {
	const [moduleId, memoryName] = memoryId.split('.');
	if (!moduleId || !memoryName) {
		return null;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryName];
	if (!memory) {
		return null;
	}

	return {
		moduleId,
		memoryName,
		byteAddress: memory.byteAddress,
		byteLength: memory.wordAlignedSize * 4,
	};
}
