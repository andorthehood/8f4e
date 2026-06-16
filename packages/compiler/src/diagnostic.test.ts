import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';
import { SyntaxErrorCode, SyntaxRulesError } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import { serializeDiagnostic } from './diagnostic';

const stubLine = {
	lineNumber: 5,
	instruction: 'push',
	arguments: [],
} as CompilerASTLine;

describe('serializeDiagnostic', () => {
	describe('syntax errors', () => {
		it('serializes a SyntaxRulesError with line into CompilerDiagnostic', () => {
			const err = new SyntaxRulesError(
				SyntaxErrorCode.MISSING_ARGUMENT,
				'Missing arg.',
				{
					lineNumber: 5,
					instruction: 'if',
				},
				{
					projectBlockId: 12,
				}
			);

			const result = serializeDiagnostic(err);

			expect(result).toEqual({
				code: SyntaxErrorCode.MISSING_ARGUMENT,
				message: 'Missing arg.',
				line: {
					lineNumber: 5,
					instruction: 'if',
				},
				context: {
					projectBlockId: 12,
				},
			});
		});

		it('serializes a SyntaxRulesError without line into CompilerDiagnostic', () => {
			const err = new SyntaxRulesError(SyntaxErrorCode.INVALID_IDENTIFIER);

			const result = serializeDiagnostic(err);

			expect(result.code).toBe(SyntaxErrorCode.INVALID_IDENTIFIER);
			expect(result.message).toBe('Invalid identifier.');
			expect(result.line).toEqual({
				lineNumber: 0,
			});
			expect(result.context).toEqual({});
		});
	});

	describe('compiler errors', () => {
		it('serializes a compiler Error object into CompilerDiagnostic', () => {
			const compilerErr = getError(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION, stubLine, undefined);

			const result = serializeDiagnostic(compilerErr);

			expect(result.code).toBe(ErrorCode.MEMORY_ACCESS_IN_PURE_FUNCTION);
			expect(result.message).toContain('Memory declarations are not allowed in functions');
			expect(result.line).toEqual({
				lineNumber: 5,
				instruction: 'push',
				arguments: [],
			});
			expect(result.context).toEqual({});
		});

		it('includes codeBlockId and codeBlockType from context', () => {
			const context = {
				codeBlockId: 'my_module',
				codeBlockType: 'module' as const,
			};
			const compilerErr = getError(ErrorCode.UNDECLARED_IDENTIFIER, stubLine, context as never);

			const result = serializeDiagnostic(compilerErr);

			expect(result.context).toEqual({
				codeBlockId: 'my_module',
				codeBlockType: 'module',
			});
		});
	});

	describe('unified shape contract', () => {
		it('syntax and compiler errors both expose code, message, line, context at top level', () => {
			const syntaxErr = new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, 'Missing.', {
				lineNumber: 7,
			});
			const compilerErr = getError(ErrorCode.UNDEFINED_FUNCTION, stubLine);

			const syntax = serializeDiagnostic(syntaxErr);
			const compiler = serializeDiagnostic(compilerErr);

			// Both must expose same top-level fields — no stage-specific special casing needed
			for (const d of [syntax, compiler]) {
				expect(typeof d.code).toBe('number');
				expect(typeof d.message).toBe('string');
				expect(d.line).toBeDefined();
				expect(d.context).toBeDefined();
			}
		});
	});

	describe('fallback', () => {
		it('wraps a plain Error with code -1', () => {
			const result = serializeDiagnostic(new Error('Unexpected crash'));

			expect(result.code).toBe(-1);
			expect(result.message).toBe('Unexpected crash');
			expect(result.line).toEqual({
				lineNumber: 0,
			});
			expect(result.context).toEqual({});
		});

		it('wraps a string with code -1', () => {
			const result = serializeDiagnostic('something went wrong');

			expect(result.code).toBe(-1);
			expect(result.message).toBe('something went wrong');
			expect(result.line).toEqual({
				lineNumber: 0,
			});
			expect(result.context).toEqual({});
		});
	});
});
