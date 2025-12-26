import { describe, it, expect } from 'vitest';

import {
	hasMemoryReferencePrefix,
	hasMemoryReferencePrefixStart,
	hasMemoryReferencePrefixEnd,
	extractMemoryReferenceBase,
	isMemoryPointerIdentifier,
	extractMemoryPointerBase,
	hasElementCountPrefix,
	extractElementCountBase,
	hasElementWordSizePrefix,
	extractElementWordSizeBase,
	isIntermodularReference,
	getPointerDepth,
} from '../src/memoryIdentifierHelpers';

describe('memoryIdentifierHelpers', () => {
	describe('hasMemoryReferencePrefix', () => {
		it('detects & prefix', () => {
			expect(hasMemoryReferencePrefix('&myVar')).toBe(true);
		});

		it('detects & suffix', () => {
			expect(hasMemoryReferencePrefix('myVar&')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefix('myVar')).toBe(false);
		});

		it('returns false for other prefixes', () => {
			expect(hasMemoryReferencePrefix('*myVar')).toBe(false);
			expect(hasMemoryReferencePrefix('$myVar')).toBe(false);
		});
	});

	describe('hasMemoryReferencePrefixStart', () => {
		it('detects & prefix', () => {
			expect(hasMemoryReferencePrefixStart('&myVar')).toBe(true);
		});

		it('returns false for & suffix', () => {
			expect(hasMemoryReferencePrefixStart('myVar&')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefixStart('myVar')).toBe(false);
		});
	});

	describe('hasMemoryReferencePrefixEnd', () => {
		it('detects & suffix', () => {
			expect(hasMemoryReferencePrefixEnd('myVar&')).toBe(true);
		});

		it('returns false for & prefix', () => {
			expect(hasMemoryReferencePrefixEnd('&myVar')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefixEnd('myVar')).toBe(false);
		});
	});

	describe('extractMemoryReferenceBase', () => {
		it('removes & prefix', () => {
			expect(extractMemoryReferenceBase('&myVar')).toBe('myVar');
		});

		it('removes & suffix', () => {
			expect(extractMemoryReferenceBase('myVar&')).toBe('myVar');
		});

		it('returns unchanged for plain identifiers', () => {
			expect(extractMemoryReferenceBase('myVar')).toBe('myVar');
		});
	});

	describe('isMemoryPointerIdentifier', () => {
		it('detects * prefix', () => {
			expect(isMemoryPointerIdentifier('*myVar')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(isMemoryPointerIdentifier('myVar')).toBe(false);
		});

		it('returns false for other prefixes', () => {
			expect(isMemoryPointerIdentifier('&myVar')).toBe(false);
		});
	});

	describe('extractMemoryPointerBase', () => {
		it('removes * prefix', () => {
			expect(extractMemoryPointerBase('*myVar')).toBe('myVar');
		});

		it('returns unchanged for plain identifiers', () => {
			expect(extractMemoryPointerBase('myVar')).toBe('myVar');
		});
	});

	describe('hasElementCountPrefix', () => {
		it('detects $ prefix', () => {
			expect(hasElementCountPrefix('$myVar')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementCountPrefix('myVar')).toBe(false);
		});

		it('returns false for other prefixes', () => {
			expect(hasElementCountPrefix('&myVar')).toBe(false);
		});
	});

	describe('extractElementCountBase', () => {
		it('removes $ prefix', () => {
			expect(extractElementCountBase('$myVar')).toBe('myVar');
		});

		it('returns unchanged for plain identifiers', () => {
			expect(extractElementCountBase('myVar')).toBe('myVar');
		});
	});

	describe('hasElementWordSizePrefix', () => {
		it('detects % prefix', () => {
			expect(hasElementWordSizePrefix('%myVar')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementWordSizePrefix('myVar')).toBe(false);
		});

		it('returns false for other prefixes', () => {
			expect(hasElementWordSizePrefix('&myVar')).toBe(false);
		});
	});

	describe('extractElementWordSizeBase', () => {
		it('removes % prefix', () => {
			expect(extractElementWordSizeBase('%myVar')).toBe('myVar');
		});

		it('returns unchanged for plain identifiers', () => {
			expect(extractElementWordSizeBase('myVar')).toBe('myVar');
		});
	});

	describe('getPointerDepth', () => {
		it('returns 0 for non-pointer instructions', () => {
			expect(getPointerDepth('int')).toBe(0);
			expect(getPointerDepth('float')).toBe(0);
		});

		it('returns 1 for single pointer', () => {
			expect(getPointerDepth('int*')).toBe(1);
			expect(getPointerDepth('float*')).toBe(1);
		});

		it('returns 2 for double pointer', () => {
			expect(getPointerDepth('int**')).toBe(2);
			expect(getPointerDepth('float**')).toBe(2);
		});

		it('returns correct depth for multiple pointers', () => {
			expect(getPointerDepth('int***')).toBe(3);
		});
	});

	describe('isIntermodularReference', () => {
		it('detects valid intermodular reference', () => {
			expect(isIntermodularReference('&module.identifier')).toBe(true);
		});

		it('returns false for reference without ampersand', () => {
			expect(isIntermodularReference('module.identifier')).toBe(false);
		});

		it('returns false for reference with trailing ampersand', () => {
			expect(isIntermodularReference('&module.identifier&')).toBe(false);
		});

		it('returns false for reference with spaces', () => {
			expect(isIntermodularReference('&module .identifier')).toBe(false);
			expect(isIntermodularReference('&module. identifier')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(isIntermodularReference('&identifier')).toBe(false);
			expect(isIntermodularReference('identifier')).toBe(false);
		});

		it('returns false for identifiers with multiple dots', () => {
			expect(isIntermodularReference('&module.sub.identifier')).toBe(false);
		});
	});
});
