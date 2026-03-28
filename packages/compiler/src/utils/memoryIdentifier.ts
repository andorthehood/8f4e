import { extractElementCountBase } from '@8f4e/tokenizer';
import { extractElementWordSizeBase } from '@8f4e/tokenizer';
import { extractPointeeElementWordSizeBase } from '@8f4e/tokenizer';
import { extractMemoryPointerBase } from '@8f4e/tokenizer';
import { extractMemoryReferenceBase } from '@8f4e/tokenizer';
import { extractElementMaxBase } from '@8f4e/tokenizer';
import { extractPointeeElementMaxBase } from '@8f4e/tokenizer';
import { extractElementMinBase } from '@8f4e/tokenizer';
import { hasElementCountPrefix } from '@8f4e/tokenizer';
import { hasElementWordSizePrefix } from '@8f4e/tokenizer';
import { hasPointeeElementWordSizePrefix } from '@8f4e/tokenizer';
import { hasMemoryReferencePrefix } from '@8f4e/tokenizer';
import { hasElementMaxPrefix } from '@8f4e/tokenizer';
import { hasPointeeElementMaxPrefix } from '@8f4e/tokenizer';
import { hasElementMinPrefix } from '@8f4e/tokenizer';
import { isMemoryPointerSyntax } from '@8f4e/tokenizer';

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

export function isPointeeElementWordSizeIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasPointeeElementWordSizePrefix(name) && Object.hasOwn(memoryMap, extractPointeeElementWordSizeBase(name));
}

export function isPointeeElementMaxIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return hasPointeeElementMaxPrefix(name) && Object.hasOwn(memoryMap, extractPointeeElementMaxBase(name));
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
			it('returns true for element count with count() syntax', () => {
				expect(isElementCountIdentifier(mockMemory, 'count(foo)')).toBe(true);
				expect(isElementCountIdentifier(mockMemory, 'count(bar)')).toBe(true);
			});

			it('returns false for non-existing element count', () => {
				expect(isElementCountIdentifier(mockMemory, 'count(baz)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementCountIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementWordSizeIdentifier', () => {
			it('returns true for element word size with sizeof() syntax', () => {
				expect(isElementWordSizeIdentifier(mockMemory, 'sizeof(foo)')).toBe(true);
				expect(isElementWordSizeIdentifier(mockMemory, 'sizeof(bar)')).toBe(true);
			});

			it('returns false for non-existing element word size', () => {
				expect(isElementWordSizeIdentifier(mockMemory, 'sizeof(baz)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementWordSizeIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementMaxIdentifier', () => {
			it('returns true for element max with max() syntax', () => {
				expect(isElementMaxIdentifier(mockMemory, 'max(foo)')).toBe(true);
				expect(isElementMaxIdentifier(mockMemory, 'max(bar)')).toBe(true);
			});

			it('returns false for non-existing element max', () => {
				expect(isElementMaxIdentifier(mockMemory, 'max(baz)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementMaxIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isElementMinIdentifier', () => {
			it('returns true for element min with min() syntax', () => {
				expect(isElementMinIdentifier(mockMemory, 'min(foo)')).toBe(true);
				expect(isElementMinIdentifier(mockMemory, 'min(bar)')).toBe(true);
			});

			it('returns false for non-existing element min', () => {
				expect(isElementMinIdentifier(mockMemory, 'min(baz)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isElementMinIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isPointeeElementWordSizeIdentifier', () => {
			it('returns true for pointee element word size with sizeof(*) syntax', () => {
				expect(isPointeeElementWordSizeIdentifier(mockMemory, 'sizeof(*foo)')).toBe(true);
				expect(isPointeeElementWordSizeIdentifier(mockMemory, 'sizeof(*bar)')).toBe(true);
			});

			it('returns false for non-existing pointee element word size', () => {
				expect(isPointeeElementWordSizeIdentifier(mockMemory, 'sizeof(*baz)')).toBe(false);
			});

			it('returns false for plain sizeof() form', () => {
				expect(isPointeeElementWordSizeIdentifier(mockMemory, 'sizeof(foo)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isPointeeElementWordSizeIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});

		describe('isPointeeElementMaxIdentifier', () => {
			it('returns true for pointee element max with max(*) syntax', () => {
				expect(isPointeeElementMaxIdentifier(mockMemory, 'max(*foo)')).toBe(true);
				expect(isPointeeElementMaxIdentifier(mockMemory, 'max(*bar)')).toBe(true);
			});

			it('returns false for non-existing pointee element max', () => {
				expect(isPointeeElementMaxIdentifier(mockMemory, 'max(*baz)')).toBe(false);
			});

			it('returns false for plain max() form', () => {
				expect(isPointeeElementMaxIdentifier(mockMemory, 'max(foo)')).toBe(false);
			});

			it('returns false for plain identifiers', () => {
				expect(isPointeeElementMaxIdentifier(mockMemory, 'foo')).toBe(false);
			});
		});
	});
}
