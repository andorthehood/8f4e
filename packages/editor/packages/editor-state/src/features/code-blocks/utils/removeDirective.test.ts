import { describe, it, expect } from 'vitest';

import removeDirective from './removeDirective';

describe('removeDirective', () => {
	it('should remove directive when present', () => {
		const code = ['module test', '; @group myGroup', '', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should remove all occurrences of directive', () => {
		const code = ['module test', '; @group first', '', '; @group second', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle directive with trailing whitespace', () => {
		const code = ['module test', '; @favorite  ', '', 'moduleEnd'];
		const result = removeDirective(code, 'favorite');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle indented directive', () => {
		const code = ['module test', '  ; @favorite', '', 'moduleEnd'];
		const result = removeDirective(code, 'favorite');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle directive with extra whitespace', () => {
		const code = ['module test', ';   @group   myGroup', '', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should not remove other directives', () => {
		const code = ['module test', '; @group myGroup', '; @favorite', '', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '; @favorite', '', 'moduleEnd']);
	});

	it('should be no-op when directive is not present', () => {
		const code = ['module test', '', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle directive with additional text', () => {
		const code = ['module test', '; @group myGroup extra text', '', 'moduleEnd'];
		const result = removeDirective(code, 'group');
		expect(result).toEqual(['module test', '', 'moduleEnd']);
	});

	it('should handle different directive names', () => {
		const code = ['module test', '; @favorite', '; @group test', '', 'moduleEnd'];
		const resultGroup = removeDirective(code, 'group');
		expect(resultGroup).toEqual(['module test', '; @favorite', '', 'moduleEnd']);

		const resultFavorite = removeDirective(code, 'favorite');
		expect(resultFavorite).toEqual(['module test', '; @group test', '', 'moduleEnd']);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = removeDirective(code, 'group');
		expect(result).toEqual([]);
	});

	it('should not mutate original array', () => {
		const code = ['module test', '; @group myGroup', '', 'moduleEnd'];
		const original = [...code];
		removeDirective(code, 'group');
		expect(code).toEqual(original);
	});
});
