import { describe, expect, it } from 'vitest';
import { compileToAST } from '../src';
import { SyntaxRulesError } from '../src/syntax/syntaxError';

describe('mapEnd syntax', () => {
	it('rejects an omitted output type during syntax validation', () => {
		expect(() => compileToAST(['module test', 'mapBegin int', 'push 1', 'mapEnd', 'moduleEnd'])).toThrow(
			SyntaxRulesError
		);
	});
});
