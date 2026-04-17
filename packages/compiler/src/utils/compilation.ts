import type { CompilationContext, MemoryMap } from '../types';

export function calculateWordAlignedSizeOfMemory(memory: MemoryMap): number {
	return Object.values(memory).reduce((accumulator, current) => {
		return accumulator + current.wordAlignedSize;
	}, 0);
}

export function saveByteCode(context: CompilationContext, byteCode: number[]): CompilationContext {
	context.byteCode.push(...byteCode);
	return context;
}
