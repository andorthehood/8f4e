import { describe, expect, it } from 'vitest';
import { compileToAST, SyntaxErrorCode, SyntaxRulesError } from '../src';

describe('native assertion syntax', () => {
	it.each([
		{ start: 'module example', end: 'moduleEnd' },
		{ start: 'function example', end: 'functionEnd' },
	])('parses assertion instructions inside $start', ({ start, end }) => {
		const ast = compileToAST([start, 'assert', 'assertEqual', end]);
		expect(ast.lines.slice(1, 3)).toEqual([
			{ instruction: 'assert', arguments: [], lineNumber: 1 },
			{ instruction: 'assertEqual', arguments: [], lineNumber: 2 },
		]);
	});

	it.each(['assert', 'assertEqual'])('rejects source arguments to %s', instruction => {
		expect(() => compileToAST(['module example', `${instruction} 1`, 'moduleEnd'])).toThrowError(SyntaxRulesError);
	});

	it.each(['assert', 'assertEqual'])('rejects %s inside constants', instruction => {
		expect(() => compileToAST(['constants example', instruction, 'constantsEnd'])).toThrowError(
			expect.objectContaining({ code: SyntaxErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK })
		);
	});
});
