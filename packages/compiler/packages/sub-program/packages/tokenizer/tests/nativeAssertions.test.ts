import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileToAST, SyntaxErrorCode, SyntaxRulesError } from '../src';

describe('native assertion syntax', () => {
	it.each([
		{ start: 'module example', end: 'moduleEnd' },
		{ start: 'function example', end: 'functionEnd' },
	])('parses assertion instructions inside $start', ({ start, end }) => {
		const ast = compileToAST([start, 'assert', 'assertEqual 3', end]);
		expect(ast.lines.slice(1, 3)).toEqual([
			{ instruction: 'assert', arguments: [], lineNumber: 1 },
			{
				instruction: 'assertEqual',
				arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				lineNumber: 2,
			},
		]);
	});

	it('rejects source arguments to assert', () => {
		expect(() => compileToAST(['module example', 'assert 1', 'moduleEnd'])).toThrowError(SyntaxRulesError);
	});

	it.each([
		{ instruction: 'assertEqual', code: SyntaxErrorCode.MISSING_ARGUMENT },
		{ instruction: 'assertEqual 1 2', code: SyntaxErrorCode.INVALID_ARGUMENT },
		{ instruction: 'assertEqual "AB"', code: SyntaxErrorCode.INVALID_ARGUMENT },
	])('rejects invalid equality syntax: $instruction', ({ instruction, code }) => {
		expect(() => compileToAST(['module example', instruction, 'moduleEnd'])).toThrowError(
			expect.objectContaining({ code })
		);
	});

	it.each(['assert', 'assertEqual 1'])('rejects %s inside constants', instruction => {
		expect(() => compileToAST(['constants example', instruction, 'constantsEnd'])).toThrowError(
			expect.objectContaining({ code: SyntaxErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK })
		);
	});
});
