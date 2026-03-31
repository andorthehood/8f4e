import type { MemoryMap } from '../types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('memoryIdentifier utilities', () => {
		const mockMemory: MemoryMap = {
			foo: {} as unknown as MemoryMap[string],
			bar: {} as unknown as MemoryMap[string],
		};

		describe('isMemoryIdentifier', () => {
			it('returns true for existing memory identifiers', () => {
				expect(isMemoryIdentifier(mockMemory, 'foo')).toBe(true);
				expect(isMemoryIdentifier(mockMemory, 'bar')).toBe(true);
			});

			it('returns false for non-existing memory identifiers', () => {
				expect(isMemoryIdentifier(mockMemory, 'baz')).toBe(false);
				expect(isMemoryIdentifier(mockMemory, '')).toBe(false);
			});
		});
	});
}
