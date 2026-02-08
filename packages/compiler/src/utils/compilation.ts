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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compilation utilities', () => {
		describe('calculateWordAlignedSizeOfMemory', () => {
			it('calculates total word aligned size correctly', () => {
				const memory: MemoryMap = {
					var1: { wordAlignedSize: 5 } as unknown as MemoryMap[string],
					var2: { wordAlignedSize: 10 } as unknown as MemoryMap[string],
					var3: { wordAlignedSize: 3 } as unknown as MemoryMap[string],
				};
				expect(calculateWordAlignedSizeOfMemory(memory)).toBe(18);
			});

			it('returns 0 for empty memory map', () => {
				expect(calculateWordAlignedSizeOfMemory({})).toBe(0);
			});

			it('handles single memory item', () => {
				const memory: MemoryMap = {
					var1: { wordAlignedSize: 42 } as unknown as MemoryMap[string],
				};
				expect(calculateWordAlignedSizeOfMemory(memory)).toBe(42);
			});
		});

		describe('saveByteCode', () => {
			it('saves bytecode to the context', () => {
				const context = {
					blockStack: [],
					byteCode: [],
				} as unknown as CompilationContext;

				const result = saveByteCode(context, [1, 2, 3]);
				expect(result.byteCode).toEqual([1, 2, 3]);
			});

			it('appends to existing bytecode', () => {
				const context = {
					blockStack: [],
					byteCode: [1, 2],
				} as unknown as CompilationContext;

				const result = saveByteCode(context, [3, 4]);
				expect(result.byteCode).toEqual([1, 2, 3, 4]);
			});
		});
	});
}
