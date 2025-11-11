import { describe, it, expect } from 'vitest';

import parseCodeBlock from './codeParser';

describe('parseCodeBlock', () => {
	it('returns empty array when no block instructions exist', () => {
		const code = ['push 1', 'add', 'store'];

		expect(parseCodeBlock(code)).toEqual([]);
	});

	it('parses simple blocks and records start/end positions', () => {
		const code = ['if condition', 'add', 'endIf'];

		expect(parseCodeBlock(code)).toEqual([
			{
				startInstruction: 'if',
				endInstruction: 'endIf',
				startLineNumber: 0,
				endLineNumber: 2,
				depth: 0,
			},
		]);
	});

	it('calculates depth for nested structures', () => {
		const code = ['if condition', 'for counter 0 10', 'endFor', 'endIf'];

		expect(parseCodeBlock(code)).toEqual([
			{
				startInstruction: 'if',
				endInstruction: 'endIf',
				startLineNumber: 0,
				endLineNumber: 3,
				depth: 0,
			},
			{
				startInstruction: 'for',
				endInstruction: 'endFor',
				startLineNumber: 1,
				endLineNumber: 2,
				depth: 1,
			},
		]);
	});

	it('leaves endLineNumber null when the block is never closed', () => {
		const code = ['for counter 0 10', 'add'];

		expect(parseCodeBlock(code)).toEqual([
			{
				startInstruction: 'for',
				endInstruction: 'endFor',
				startLineNumber: 0,
				endLineNumber: undefined,
				depth: 0,
			},
		]);
	});

	it('ignores unmatched end instructions', () => {
		const code = ['endIf', 'endFor'];

		expect(parseCodeBlock(code)).toEqual([]);
	});
});
