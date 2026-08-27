import { describe, expect, it } from 'vitest';

import { removeDirective, updateDirectiveArgs, upsertDirective } from './index';

describe('directiveEditing with chained directives', () => {
	it('removeDirective preserves unrelated directives on the same line', () => {
		const code = ['module test', '; @group audio @favorite', 'moduleEnd'];

		expect(removeDirective(code, 'group')).toEqual(['module test', '; @favorite', 'moduleEnd']);
	});

	it('updateDirectiveArgs only rewrites the targeted directive on the line', () => {
		const code = ['module test', '; @group audio @favorite', 'moduleEnd'];

		expect(updateDirectiveArgs(code, 'group', ([groupName]) => [groupName, 'nonstick'])).toEqual([
			'module test',
			'; @group audio nonstick @favorite',
			'moduleEnd',
		]);
	});

	it('upsertDirective removes prior chained instances before inserting the canonical line', () => {
		const code = ['module test', '; @favorite @pos 1 2', 'moduleEnd'];

		expect(upsertDirective(code, 'pos', ['3', '4'])).toEqual(['module test', '; @pos 3 4', '; @favorite', 'moduleEnd']);
	});
});
