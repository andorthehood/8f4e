import { ArgumentType, type CompilationContext, type InstructionCompiler } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';

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
