import { describe, expect, it } from 'vitest';
import { ArgumentType, type CompilationContext, type InstructionCompiler } from '@8f4e/compiler-types';

import { validateArgumentByRule } from './validateArgumentByRule';

import { ErrorCode } from '../compilerError';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
const context = { stack: [] } as unknown as CompilationContext;

describe('validateArgumentByRule', () => {
	it('accepts matching literal and identifier rules', () => {
		expect(() =>
			validateArgumentByRule({ type: ArgumentType.LITERAL, value: 1, isInteger: true }, 'literal', line, context)
		).not.toThrow();
		expect(() => validateArgumentByRule(classifyIdentifier('x'), 'identifier', line, context)).not.toThrow();
	});

	it('rejects a float for integerLiteral', () => {
		expect(() =>
			validateArgumentByRule(
				{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false },
				'integerLiteral',
				line,
				context
			)
		).toThrow(`${ErrorCode.TYPE_MISMATCH}`);
	});

	it('rejects a negative value for nonNegativeIntegerLiteral', () => {
		expect(() =>
			validateArgumentByRule(
				{ type: ArgumentType.LITERAL, value: -1, isInteger: true },
				'nonNegativeIntegerLiteral',
				line,
				context
			)
		).toThrow(`${ErrorCode.EXPECTED_VALUE}`);
	});

	it('accepts supported memory access widths', () => {
		expect(() =>
			validateArgumentByRule(
				{ type: ArgumentType.LITERAL, value: 8, isInteger: true },
				'memoryAccessWidthLiteral',
				line,
				context
			)
		).not.toThrow();
	});

	it('rejects unsupported memory access widths', () => {
		expect(() =>
			validateArgumentByRule(
				{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
				'memoryAccessWidthLiteral',
				line,
				context
			)
		).toThrow(`${ErrorCode.INVALID_ACCESS_WIDTH}`);
	});
});
