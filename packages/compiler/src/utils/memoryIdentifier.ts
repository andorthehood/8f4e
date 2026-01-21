import extractElementCountBase from '../syntax/extractElementCountBase';
import extractElementWordSizeBase from '../syntax/extractElementWordSizeBase';
import extractMemoryPointerBase from '../syntax/extractMemoryPointerBase';
import extractMemoryReferenceBase from '../syntax/extractMemoryReferenceBase';
import extractElementMaxBase from '../syntax/extractElementMaxBase';
import extractElementMinBase from '../syntax/extractElementMinBase';
import hasElementCountPrefix from '../syntax/hasElementCountPrefix';
import hasElementWordSizePrefix from '../syntax/hasElementWordSizePrefix';
import hasMemoryReferencePrefix from '../syntax/hasMemoryReferencePrefix';
import hasElementMaxPrefix from '../syntax/hasElementMaxPrefix';
import hasElementMinPrefix from '../syntax/hasElementMinPrefix';
import isMemoryPointerSyntax from '../syntax/isMemoryPointerIdentifier';

import type { MemoryMap } from '../types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return Object.hasOwn(memoryMap, name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasMemoryReferencePrefix(name) && Object.hasOwn(memoryMap, extractMemoryReferenceBase(name));
}

export function isMemoryPointerIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return isMemoryPointerSyntax(name) && Object.hasOwn(memoryMap, extractMemoryPointerBase(name));
}

export function isElementCountIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementCountPrefix(name) && Object.hasOwn(memoryMap, extractElementCountBase(name));
}

export function isElementWordSizeIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementWordSizePrefix(name) && Object.hasOwn(memoryMap, extractElementWordSizeBase(name));
}

export function isElementMaxIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementMaxPrefix(name) && Object.hasOwn(memoryMap, extractElementMaxBase(name));
}

export function isElementMinIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasElementMinPrefix(name) && Object.hasOwn(memoryMap, extractElementMinBase(name));
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

		describe('isMemoryReferenceIdentifier', () => {
			it('returns true for memory references with & prefix', () => {
				expect(isMemoryReferenceIdentifier(mockMemory, '&foo')).toBe(true);
				expect(isMemoryReferenceIdentifier(mockMemory, '&bar')).toBe(true);
			});

			it('returns true for memory references with & suffix', () => {
				expect(isMemoryReferenceIdentifier(mockMemory, 'foo&')).toBe(true);
				expect(isMemoryReferenceIdentifier(mockMemory, 'bar&')).toBe(true);
			});

			it('returns false for non-existing memory references', () => {
				expect(isMemoryReferenceIdentifier(mockMemory, '&baz')).toBe(false);
				expect(isMemoryReferenceIdentifier(mockMemory, 'baz&')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isMemoryReferenceIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isMemoryPointerIdentifier', () => {
			it('returns true for memory pointers with * prefix', () => {
				expect(isMemoryPointerIdentifier(mockMemory, '*foo')).toBe(true);
				expect(isMemoryPointerIdentifier(mockMemory, '*bar')).toBe(true);
			});

			it('returns false for non-existing memory pointers', () => {
				expect(isMemoryPointerIdentifier(mockMemory, '*baz')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isMemoryPointerIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementCountIdentifier', () => {
			it('returns true for element count with $ prefix', () => {
				expect(isElementCountIdentifier(mockMemory, '$foo')).toBe(true);
				expect(isElementCountIdentifier(mockMemory, '$bar')).toBe(true);
			});

			it('returns false for non-existing element count', () => {
				expect(isElementCountIdentifier(mockMemory, '$baz')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementCountIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementWordSizeIdentifier', () => {
			it('returns true for element word size with % prefix', () => {
				expect(isElementWordSizeIdentifier(mockMemory, '%foo')).toBe(true);
				expect(isElementWordSizeIdentifier(mockMemory, '%bar')).toBe(true);
			});

			it('returns false for non-existing element word size', () => {
				expect(isElementWordSizeIdentifier(mockMemory, '%baz')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementWordSizeIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementMaxIdentifier', () => {
			it('returns true for element max with ^ prefix', () => {
				expect(isElementMaxIdentifier(mockMemory, '^foo')).toBe(true);
				expect(isElementMaxIdentifier(mockMemory, '^bar')).toBe(true);
			});

			it('returns false for non-existing element max', () => {
				expect(isElementMaxIdentifier(mockMemory, '^baz')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementMaxIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementMinIdentifier', () => {
			it('returns true for element min with ! prefix', () => {
				expect(isElementMinIdentifier(mockMemory, '!foo')).toBe(true);
				expect(isElementMinIdentifier(mockMemory, '!bar')).toBe(true);
			});

			it('returns false for non-existing element min', () => {
				expect(isElementMinIdentifier(mockMemory, '!baz')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementMinIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});
	});
}
