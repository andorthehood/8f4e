import { describe, expect, it } from 'vitest';

import { getBlockType, isCompilableBlockType } from './getBlockType';

describe('getBlockType', () => {
	it('detects module blocks', () => {
		expect(getBlockType(['module foo', 'moduleEnd'])).toBe('module');
	});

	it('detects function blocks', () => {
		expect(getBlockType(['function foo', 'functionEnd'])).toBe('function');
	});

	it('detects constants blocks', () => {
		expect(getBlockType(['constants', 'constantsEnd'])).toBe('constants');
	});

	it('returns unknown for mixed markers', () => {
		expect(getBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
	});
});

describe('isCompilableBlockType', () => {
	it('returns true for compilable block types', () => {
		expect(isCompilableBlockType('module')).toBe(true);
		expect(isCompilableBlockType('function')).toBe(true);
		expect(isCompilableBlockType('constants')).toBe(true);
		expect(isCompilableBlockType('macro')).toBe(true);
	});

	it('returns false for non-compilable block types', () => {
		expect(isCompilableBlockType('unknown')).toBe(false);
		expect(isCompilableBlockType('note')).toBe(false);
		expect(isCompilableBlockType(undefined)).toBe(false);
	});
});
