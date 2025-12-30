import { isInstructionIsInsideBlock } from './blockStack';

import { BLOCK_TYPE } from '../types';

import type { CompilationContext, MemoryMap } from '../types';

export function calculateWordAlignedSizeOfMemory(memory: MemoryMap): number {
	return Object.values(memory).reduce((accumulator, current) => {
		return accumulator + current.wordAlignedSize;
	}, 0);
}

export function saveByteCode(context: CompilationContext, byteCode: number[]): CompilationContext {
	if (isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.INIT)) {
		context.initSegmentByteCode.push(...byteCode);
	} else {
		context.loopSegmentByteCode.push(...byteCode);
	}
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
			it('saves to init segment when inside INIT block', () => {
				const context = {
					blockStack: [
						{
							blockType: BLOCK_TYPE.INIT,
							expectedResultIsInteger: false,
							hasExpectedResult: false,
						},
					],
					initSegmentByteCode: [],
					loopSegmentByteCode: [],
				} as unknown as CompilationContext;

				const result = saveByteCode(context, [1, 2, 3]);
				expect(result.initSegmentByteCode).toEqual([1, 2, 3]);
				expect(result.loopSegmentByteCode).toEqual([]);
			});

			it('saves to loop segment when not inside INIT block', () => {
				const context = {
					blockStack: [
						{
							blockType: BLOCK_TYPE.LOOP,
							expectedResultIsInteger: false,
							hasExpectedResult: false,
						},
					],
					initSegmentByteCode: [],
					loopSegmentByteCode: [],
				} as unknown as CompilationContext;

				const result = saveByteCode(context, [4, 5, 6]);
				expect(result.initSegmentByteCode).toEqual([]);
				expect(result.loopSegmentByteCode).toEqual([4, 5, 6]);
			});

			it('appends to existing bytecode', () => {
				const context = {
					blockStack: [],
					initSegmentByteCode: [],
					loopSegmentByteCode: [1, 2],
				} as unknown as CompilationContext;

				const result = saveByteCode(context, [3, 4]);
				expect(result.loopSegmentByteCode).toEqual([1, 2, 3, 4]);
			});
		});
	});
}
