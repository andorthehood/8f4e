import { describe, it, expect } from 'vitest';

import { createWatchDirectiveData } from './data';
import watchDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parseWatchDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [watchDirective]).map(directive =>
		createWatchDirectiveData(directive.args, directive.rawRow)
	);
}

describe('watch directive data', () => {
	it('should parse debug instruction with id', () => {
		const code = ['; @watch myVar'];
		const result = parseWatchDirectiveData(code);

		expect(result).toEqual([
			{
				id: 'myVar',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple debug instructions', () => {
		const code = ['; @watch var1', 'mov a b', '; @watch var2', 'add c d', '; @watch var3'];
		const result = parseWatchDirectiveData(code);

		expect(result).toEqual([
			{
				id: 'var1',
				lineNumber: 0,
			},
			{
				id: 'var2',
				lineNumber: 2,
			},
			{
				id: 'var3',
				lineNumber: 4,
			},
		]);
	});

	it('should return empty array when no debug instructions found', () => {
		const code = ['mov a b', 'add c d', 'sub e f'];
		const result = parseWatchDirectiveData(code);

		expect(result).toEqual([]);
	});

	it('should handle empty code array', () => {
		const code: string[] = [];
		const result = parseWatchDirectiveData(code);

		expect(result).toEqual([]);
	});

	it('should preserve correct line numbers', () => {
		const code = ['nop', 'nop', '; @watch var1', 'nop', 'nop', '; @watch var2'];
		const result = parseWatchDirectiveData(code);

		expect(result).toEqual([
			{
				id: 'var1',
				lineNumber: 2,
			},
			{
				id: 'var2',
				lineNumber: 5,
			},
		]);
	});
});
