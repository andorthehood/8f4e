import { describe, expect, it } from 'vitest';

import { compileToAST, parseLine } from './parser';
import { ArgumentType, classifyIdentifier } from './syntax/parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

import type { AST } from './types';

describe('parseLine', () => {
	const fixtures: [number, string, AST[number]][] = [
		[
			1,
			'int alpha 1',
			{
				arguments: [
					classifyIdentifier('alpha'),
					{
						type: ArgumentType.LITERAL,
						value: 1,
						isInteger: true,
					},
				],
				instruction: 'int',
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				isSemanticOnly: false,
				isMemoryDeclaration: true,
			},
		],
		[
			100,
			'push 0xff',
			{
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 255,
						isInteger: true,
						isHex: true,
					},
				],
				instruction: 'push',
				lineNumberBeforeMacroExpansion: 100,
				lineNumberAfterMacroExpansion: 100,
				isSemanticOnly: false,
				isMemoryDeclaration: false,
			},
		],
	];

	it.each(fixtures)('parses line %p as AST', (lineNumber, line, ast) => {
		expect(parseLine(line, lineNumber)).toStrictEqual(ast);
	});

	it('flags semantic-only instructions in generated AST lines', () => {
		expect(parseLine('const SIZE 16', 0).isSemanticOnly).toBe(true);
		expect(parseLine('use math', 0).isSemanticOnly).toBe(true);
		expect(parseLine('module demo', 0).isSemanticOnly).toBe(true);
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

	it('parses a quoted string argument as STRING_LITERAL', () => {
		const result = parseLine('push "hello"', 0);
		expect(result.instruction).toBe('push');
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'hello' }]);
	});

	it('parses a quoted string with spaces as a single argument', () => {
		const result = parseLine('push "hello world"', 0);
		expect(result.arguments).toHaveLength(1);
		expect(result.arguments[0]).toEqual({ type: ArgumentType.STRING_LITERAL, value: 'hello world' });
	});

	it('preserves a quoted semicolon inside a string', () => {
		const result = parseLine('push "a;b"', 0);
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'a;b' }]);
	});

	it('handles escape sequences inside a quoted string', () => {
		const result = parseLine('push "a\\nb"', 0);
		expect(result.arguments).toEqual([{ type: ArgumentType.STRING_LITERAL, value: 'a\nb' }]);
	});

	it('throws on unterminated string literal', () => {
		expect(() => parseLine('push "hello', 0)).toThrow('Unterminated string literal');
	});

	it('adds line metadata to parse-time syntax errors', () => {
		try {
			parseLine('push 1e309', 7, 12);
			throw new Error('Expected parseLine to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.INVALID_NUMERIC_LITERAL);
			expect((error as SyntaxRulesError).line).toEqual(
				expect.objectContaining({
					lineNumberBeforeMacroExpansion: 7,
					lineNumberAfterMacroExpansion: 12,
					instruction: 'push',
				})
			);
		}
	});

	it('exposes instruction in line metadata for argument-level errors', () => {
		let thrownError: SyntaxRulesError | undefined;
		try {
			parseLine('push', 5, 8);
		} catch (error) {
			thrownError = error as SyntaxRulesError;
		}
		expect(thrownError).toBeInstanceOf(SyntaxRulesError);
		expect(thrownError?.line?.lineNumberBeforeMacroExpansion).toBe(5);
		expect(thrownError?.line?.lineNumberAfterMacroExpansion).toBe(8);
		expect(thrownError?.line?.instruction).toBe('push');
	});

	it('parses array declarations with more than seven initializer values', () => {
		const result = parseLine('int[] notes 12 48 50 53 55 57 60 62 64', 0);

		expect(result.instruction).toBe('int[]');
		expect(result.arguments).toHaveLength(10);
		expect(result.arguments.slice(2)).toEqual([
			{ type: ArgumentType.LITERAL, value: 48, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 50, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 53, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 55, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 57, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 60, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 62, isInteger: true },
			{ type: ArgumentType.LITERAL, value: 64, isInteger: true },
		]);
	});
});

describe('compileToAST', () => {
	it('uses callSiteLineNumber from lineMetadata when provided', () => {
		const code = ['push 10', 'push 20', 'add'];
		const lineMetadata = [
			{ callSiteLineNumber: 5 },
			{ callSiteLineNumber: 5, macroId: 'double' },
			{ callSiteLineNumber: 5, macroId: 'double' },
		];

		const ast = compileToAST(code, lineMetadata);

		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});

	it('uses actual line numbers when lineMetadata is not provided', () => {
		const ast = compileToAST(['push 10', 'push 20', 'add']);

		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(0);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(1);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(2);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});

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

	it('exposes line location in block structure errors via the line property', () => {
		let thrownError: SyntaxRulesError | undefined;
		try {
			compileToAST(['push 1', 'if', 'push 10']);
		} catch (error) {
			thrownError = error as SyntaxRulesError;
		}
		expect(thrownError).toBeInstanceOf(SyntaxRulesError);
		expect(thrownError?.line?.lineNumberBeforeMacroExpansion).toBe(1);
		expect(thrownError?.line?.lineNumberAfterMacroExpansion).toBe(1);
		expect(thrownError?.line?.instruction).toBe('if');
	});
});
