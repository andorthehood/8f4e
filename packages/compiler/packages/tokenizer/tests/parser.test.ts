import { describe, expect, it } from 'vitest';

import { compileToAST, parseLine } from '../src/parser';
import { SyntaxRulesError } from '../src/syntax/syntaxError';

describe('parseLine', () => {
	it('flags semantic-only instructions in generated AST lines', () => {
		expect(parseLine('const SIZE 16', 0).isSemanticOnly).toBe(true);
		expect(parseLine('use math', 0).isSemanticOnly).toBe(true);
		expect(parseLine('module demo', 0).isSemanticOnly).toBe(true);
		expect(parseLine('init value 1', 0).isSemanticOnly).toBe(true);
	});

	it('leaves runtime/codegen instructions unflagged', () => {
		expect(parseLine('push 1', 0).isSemanticOnly).toBe(false);
		expect(parseLine('int value 1', 0).isSemanticOnly).toBe(false);
	});

	it('rejects wrong arity and raw argument shape in tokenizer', () => {
		expect(() => parseLine('push', 0)).toThrowError(SyntaxRulesError);
		expect(() => parseLine('mapBegin bool', 0)).toThrowError(SyntaxRulesError);
		expect(() => parseLine('storeBytes -1', 0)).toThrowError(SyntaxRulesError);
		expect(() => parseLine('map "AB" 1', 0)).toThrowError(SyntaxRulesError);
	});
});

describe('compileToAST', () => {
	it('pairs if with ifEnd metadata without rewriting source arguments', () => {
		const ast = compileToAST(['push 1', 'if', 'push 10', 'ifEnd int']);

		expect(ast[1]).toMatchObject({
			instruction: 'if',
			arguments: [],
			ifBlock: {
				matchingIfEndIndex: 3,
				resultType: 'int',
				hasElse: false,
			},
		});
		expect(ast[3]).toMatchObject({
			instruction: 'ifEnd',
			ifEndBlock: {
				matchingIfIndex: 1,
				resultType: 'int',
			},
		});
	});

	it('tracks else on the paired if metadata', () => {
		const ast = compileToAST(['push 1', 'if', 'push 10', 'else', 'push 20', 'ifEnd']);

		expect(ast[1].ifBlock).toMatchObject({
			matchingIfEndIndex: 5,
			resultType: null,
			hasElse: true,
		});
	});

	it('rejects else without an open if block', () => {
		expect(() => compileToAST(['else'])).toThrowError(SyntaxRulesError);
	});

	it('rejects unclosed if blocks', () => {
		expect(() => compileToAST(['push 1', 'if', 'push 10'])).toThrowError(SyntaxRulesError);
	});

	it('pairs block with blockEnd metadata without rewriting source arguments', () => {
		const ast = compileToAST(['block', 'push 10', 'blockEnd int']);

		expect(ast[0]).toMatchObject({
			instruction: 'block',
			arguments: [],
			blockBlock: {
				matchingBlockEndIndex: 2,
				resultType: 'int',
			},
		});
		expect(ast[2]).toMatchObject({
			instruction: 'blockEnd',
			blockEndBlock: {
				matchingBlockIndex: 0,
				resultType: 'int',
			},
		});
	});

	it('pairs block with blockEnd float metadata', () => {
		const ast = compileToAST(['block', 'push 1.0', 'blockEnd float']);

		expect(ast[0].blockBlock).toMatchObject({
			matchingBlockEndIndex: 2,
			resultType: 'float',
		});
		expect(ast[2].blockEndBlock).toMatchObject({
			matchingBlockIndex: 0,
			resultType: 'float',
		});
	});

	it('pairs bare block with bare blockEnd as no-result', () => {
		const ast = compileToAST(['block', 'push 1', 'blockEnd']);

		expect(ast[0].blockBlock).toMatchObject({
			matchingBlockEndIndex: 2,
			resultType: null,
		});
		expect(ast[2].blockEndBlock).toMatchObject({
			matchingBlockIndex: 0,
			resultType: null,
		});
	});

	it('rejects block with a type argument', () => {
		expect(() => compileToAST(['block int'])).toThrowError(SyntaxRulesError);
	});

	it('rejects blockEnd with an invalid type argument', () => {
		expect(() => compileToAST(['block', 'blockEnd void'])).toThrowError(SyntaxRulesError);
	});

	it('rejects unexpected blockEnd without a matching block', () => {
		expect(() => compileToAST(['blockEnd'])).toThrowError(SyntaxRulesError);
	});

	it('rejects unclosed block blocks', () => {
		expect(() => compileToAST(['block', 'push 1'])).toThrowError(SyntaxRulesError);
	});
});
