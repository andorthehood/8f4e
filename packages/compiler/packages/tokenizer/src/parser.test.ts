import { describe, expect, it } from 'vitest';
import {
	ArgumentType,
	isCompilerDirectiveLine,
	isMemoryDeclarationLine,
	isSemanticInstructionLine,
} from '@8f4e/compiler-spec';

import { compileToAST, compileToASTLines, parseLine } from './parser';
import { classifyIdentifier } from './syntax/parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntax/syntaxError';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('parseLine', () => {
	const fixtures: [number, string, CompilerASTLine][] = [
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
				hasExplicitMemoryDefault: true,
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
			},
		],
	];

	it.each(fixtures)('parses line %p as AST', (lineNumber, line, ast) => {
		expect(parseLine(line, lineNumber)).toStrictEqual(ast);
	});

	it('narrows semantic instructions in generated AST lines', () => {
		expect(isSemanticInstructionLine(parseLine('const SIZE 16', 0))).toBe(true);
		expect(isSemanticInstructionLine(parseLine('use math', 0))).toBe(true);
		expect(isSemanticInstructionLine(parseLine('module demo', 0))).toBe(true);
	});

	it('does not narrow runtime/codegen instructions as semantic instructions', () => {
		expect(isSemanticInstructionLine(parseLine('push 1', 0))).toBe(false);
		expect(isSemanticInstructionLine(parseLine('int value 1', 0))).toBe(false);
	});

	it('marks explicit memory defaults from source syntax', () => {
		const implicitScalarDefault = parseLine('int value', 0);
		const explicitScalarDefault = parseLine('int value 0', 0);
		const anonymousScalarDefault = parseLine('int 0', 0);
		const implicitArrayDefault = parseLine('int[] buffer 4', 0);
		const explicitArrayDefault = parseLine('int[] buffer 4 0', 0);

		expect(isMemoryDeclarationLine(implicitScalarDefault) && implicitScalarDefault.hasExplicitMemoryDefault).toBe(
			false
		);
		expect(isMemoryDeclarationLine(explicitScalarDefault) && explicitScalarDefault.hasExplicitMemoryDefault).toBe(true);
		expect(isMemoryDeclarationLine(anonymousScalarDefault) && anonymousScalarDefault.hasExplicitMemoryDefault).toBe(
			true
		);
		expect(isMemoryDeclarationLine(implicitArrayDefault) && implicitArrayDefault.hasExplicitMemoryDefault).toBe(false);
		expect(isMemoryDeclarationLine(explicitArrayDefault) && explicitArrayDefault.hasExplicitMemoryDefault).toBe(true);
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
	it('constructs module metadata from the source-block parse path', () => {
		const ast = compileToAST([
			'module target',
			'#region fastMemory',
			'int counter',
			'int sourceStart &source:buffer',
			'moduleEnd',
		]);

		expect(ast).toMatchObject({
			type: 'module',
			id: 'target',
			moduleLine: { instruction: 'module' },
			regionLine: { instruction: '#region' },
		});
		if (ast.type !== 'module') {
			throw new Error('Expected module AST');
		}
		expect(ast.memoryDeclarationLines.map(line => line.arguments[0].value)).toEqual(['counter', 'sourceStart']);
		expect(ast.memoryDeclarationLines[1].referencedNamespaceIds).toEqual(['source']);
	});

	it('constructs function metadata from the source-block parse path', () => {
		const ast = compileToAST([
			'const SCALE 2',
			'function mix',
			'#export mixExport',
			'param int left',
			'param float right',
			'push left',
			'functionEnd int float',
		]);

		expect(ast).toMatchObject({
			type: 'function',
			id: 'mix',
			functionLine: { instruction: 'function' },
			functionEndLine: { instruction: 'functionEnd' },
			exportLine: { instruction: '#export' },
			exportName: 'mixExport',
			signature: {
				parameters: ['int', 'float'],
				returns: ['int', 'float'],
			},
		});
		expect(ast.lines[0].instruction).toBe('const');
	});

	it('constructs imported function metadata from the source-block parse path', () => {
		const ast = compileToAST(['function hostLog', '#import "host-api" "log.value"', 'param int value', 'functionEnd']);

		expect(ast).toMatchObject({
			type: 'function',
			id: 'hostLog',
			importLine: { instruction: '#import' },
			import: {
				moduleName: 'host-api',
				fieldName: 'log.value',
			},
			signature: {
				parameters: ['int'],
				returns: [],
			},
		});
	});

	it('constructs constants metadata from the source-block parse path', () => {
		const ast = compileToAST(['constants sizes', 'const COUNT 4', 'constantsEnd']);

		expect(ast).toMatchObject({
			type: 'constants',
			id: 'sizes',
			constantsLine: { instruction: 'constants' },
		});
	});

	it('records namespace references from use lines while parsing lines', () => {
		const ast = compileToAST(['module target', 'use shared', 'moduleEnd']);

		expect(ast.lines[1].referencedNamespaceIds).toEqual(['shared']);
	});
});

describe('compileToASTLines', () => {
	it('folds dash argument continuation lines into the previous instruction', () => {
		const split = compileToASTLines(['float*', '- readHead', '- &source:samples']);
		const singleLine = compileToASTLines(['float* readHead &source:samples']);

		expect(split).toEqual(singleLine);
		expect(split).toHaveLength(1);
		expect(split[0]).toMatchObject({
			instruction: 'float*',
			arguments: [
				{ type: ArgumentType.IDENTIFIER, value: 'readHead' },
				{ type: ArgumentType.IDENTIFIER, value: '&source:samples' },
			],
			referencedNamespaceIds: ['source'],
			hasExplicitMemoryDefault: true,
		});
	});

	it('allows dash argument continuation after any source instruction', () => {
		const ast = compileToASTLines(['push', '- 1']);

		expect(ast).toEqual(compileToASTLines(['push 1']));
	});

	it.each([
		{
			name: 'negative numeric literal',
			split: ['push', '- -1'],
			singleLine: ['push -1'],
		},
		{
			name: 'quoted string literal with spaces',
			split: ['push', '- "hello world"'],
			singleLine: ['push "hello world"'],
		},
		{
			name: 'compile-time expression',
			split: ['const SIZE', '- 2*4'],
			singleLine: ['const SIZE 2*4'],
		},
		{
			name: 'array declaration with hex and negative initializer values',
			split: ['int[]', '- values', '- 4', '- 0xA8', '- -1'],
			singleLine: ['int[] values 4 0xA8 -1'],
		},
	])('preserves $name continuation arguments', ({ split, singleLine }) => {
		expect(compileToASTLines(split)).toEqual(compileToASTLines(singleLine));
	});

	it('rejects bare dash argument continuation lines', () => {
		expect(() => compileToASTLines(['push 1', '-'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.MISSING_ARGUMENT })
		);
	});

	it('rejects dash argument continuation lines with multiple arguments', () => {
		expect(() => compileToASTLines(['push', '- 1 2'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.INVALID_ARGUMENT })
		);
	});

	it('rejects dash argument continuation lines without a previous instruction', () => {
		expect(() => compileToASTLines(['- 1'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.INVALID_ARGUMENT })
		);
	});

	it('uses callSiteLineNumber from lineMetadata when provided', () => {
		const code = ['push 10', 'push 20', 'add'];
		const lineMetadata = [
			{ callSiteLineNumber: 5 },
			{ callSiteLineNumber: 5, macroId: 'double' },
			{ callSiteLineNumber: 5, macroId: 'double' },
		];

		const ast = compileToASTLines(code, lineMetadata);

		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(5);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});

	it('uses actual line numbers when lineMetadata is not provided', () => {
		const ast = compileToASTLines(['push 10', 'push 20', 'add']);

		expect(ast).toHaveLength(3);
		expect(ast[0].lineNumberBeforeMacroExpansion).toBe(0);
		expect(ast[1].lineNumberBeforeMacroExpansion).toBe(1);
		expect(ast[2].lineNumberBeforeMacroExpansion).toBe(2);
		expect(ast[0].lineNumberAfterMacroExpansion).toBe(0);
		expect(ast[1].lineNumberAfterMacroExpansion).toBe(1);
		expect(ast[2].lineNumberAfterMacroExpansion).toBe(2);
	});

	it('marks directives in module and function prologues', () => {
		const ast = compileToASTLines([
			'module test',
			'#skipExecution',
			'#region sampleMemory',
			'int counter',
			'moduleEnd',
			'function readValue',
			'#impure',
			'#export readValue',
			'param int address',
			'functionEnd int',
		]);

		expect(isCompilerDirectiveLine(ast[1]) && ast[1].isBlockPrologue).toBe(true);
		expect(isCompilerDirectiveLine(ast[2]) && ast[2].isBlockPrologue).toBe(true);
		expect(isCompilerDirectiveLine(ast[3])).toBe(false);
		expect(isCompilerDirectiveLine(ast[6]) && ast[6].isBlockPrologue).toBe(true);
		expect(isCompilerDirectiveLine(ast[7]) && ast[7].isBlockPrologue).toBe(true);
		expect(isCompilerDirectiveLine(ast[8])).toBe(false);
	});

	it('rejects module directives after the module prologue', () => {
		expect(() => compileToASTLines(['module test', 'int counter', '#skipExecution', 'moduleEnd'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE })
		);
	});

	it('rejects function directives after the function prologue', () => {
		expect(() => compileToASTLines(['function readValue', 'param int address', '#impure', 'functionEnd int'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE })
		);
	});

	it('rejects directives nested inside non-prologue blocks', () => {
		expect(() => compileToASTLines(['module test', 'if', '#loopCap 20', 'ifEnd', 'moduleEnd'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE })
		);
	});

	it('rejects directives before any module or function prologue', () => {
		expect(() => compileToASTLines(['#skipExecution'])).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE })
		);
	});

	it('pairs if with ifEnd metadata without rewriting source arguments', () => {
		const ast = compileToASTLines(['push 1', 'if', 'push 10', 'ifEnd int']);

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
		const ast = compileToASTLines(['push 1', 'if', 'push 10', 'else', 'push 20', 'ifEnd']);

		expect(ast[1].ifBlock).toMatchObject({
			matchingIfEndIndex: 5,
			resultType: null,
			hasElse: true,
		});
	});

	it('rejects else without an open if block', () => {
		expect(() => compileToASTLines(['else'])).toThrowError(SyntaxRulesError);
	});

	it('rejects unclosed if blocks', () => {
		expect(() => compileToASTLines(['push 1', 'if', 'push 10'])).toThrowError(SyntaxRulesError);
	});

	it('pairs block with blockEnd metadata without rewriting source arguments', () => {
		const ast = compileToASTLines(['block', 'push 10', 'blockEnd int']);

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
		const ast = compileToASTLines(['block', 'push 1.0', 'blockEnd float']);

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
		const ast = compileToASTLines(['block', 'push 1', 'blockEnd']);

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
		expect(() => compileToASTLines(['block int'])).toThrowError(SyntaxRulesError);
	});

	it('rejects blockEnd with an invalid type argument', () => {
		expect(() => compileToASTLines(['block', 'blockEnd void'])).toThrowError(SyntaxRulesError);
	});

	it('rejects unexpected blockEnd without a matching block', () => {
		expect(() => compileToASTLines(['blockEnd'])).toThrowError(SyntaxRulesError);
	});

	it('does not treat inherited object keys as block end instructions', () => {
		expect(() => compileToASTLines(['block', 'constructor', 'blockEnd'])).not.toThrow();
	});

	it('rejects unclosed block blocks', () => {
		expect(() => compileToASTLines(['block', 'push 1'])).toThrowError(SyntaxRulesError);
	});

	it('exposes line location in block structure errors via the line property', () => {
		let thrownError: SyntaxRulesError | undefined;
		try {
			compileToASTLines(['push 1', 'if', 'push 10']);
		} catch (error) {
			thrownError = error as SyntaxRulesError;
		}
		expect(thrownError).toBeInstanceOf(SyntaxRulesError);
		expect(thrownError?.line?.lineNumberBeforeMacroExpansion).toBe(1);
		expect(thrownError?.line?.lineNumberAfterMacroExpansion).toBe(1);
		expect(thrownError?.line?.instruction).toBe('if');
	});
});
