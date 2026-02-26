import { ArgumentType, type CompilationContext, type InstructionCompiler } from '../types';
import { ErrorCode, getError } from '../errors';

import type { ArgumentRule } from './types';

export function validateArgumentByRule(
	argument: Parameters<InstructionCompiler>[0]['arguments'][number],
	rule: ArgumentRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext
): void {
	switch (rule) {
		case 'literal':
			if (argument.type !== ArgumentType.LITERAL) {
				throw getError(ErrorCode.EXPECTED_VALUE, line, context);
			}
			break;
		case 'identifier':
			if (argument.type !== ArgumentType.IDENTIFIER) {
				throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
			}
			break;
		case 'integerLiteral':
			if (argument.type !== ArgumentType.LITERAL) {
				throw getError(ErrorCode.EXPECTED_VALUE, line, context);
			}
			if (!argument.isInteger) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
			break;
		case 'nonNegativeIntegerLiteral':
			if (argument.type !== ArgumentType.LITERAL) {
				throw getError(ErrorCode.EXPECTED_VALUE, line, context);
			}
			if (!argument.isInteger) {
				throw getError(ErrorCode.TYPE_MISMATCH, line, context);
			}
			if (argument.value < 0) {
				throw getError(ErrorCode.EXPECTED_VALUE, line, context);
			}
			break;
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const line: Parameters<InstructionCompiler>[0] = {
		lineNumber: 1,
		instruction: 'test' as never,
		arguments: [],
	};
	const context = { stack: [] } as unknown as CompilationContext;

	describe('validateArgumentByRule', () => {
		it('accepts matching literal and identifier rules', () => {
			expect(() =>
				validateArgumentByRule({ type: ArgumentType.LITERAL, value: 1, isInteger: true }, 'literal', line, context)
			).not.toThrow();
			expect(() =>
				validateArgumentByRule({ type: ArgumentType.IDENTIFIER, value: 'x' }, 'identifier', line, context)
			).not.toThrow();
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
	});
}
