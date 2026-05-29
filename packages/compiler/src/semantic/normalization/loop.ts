import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';

import { normalizeAndValidateResolvableArgs } from './helpers';

import { getError } from '../../compilerError';

import type { CompilationContext, LoopLine, NormalizedLoopLine } from '@8f4e/compiler-spec';

/**
 * Normalizes the optional loop cap argument. Resolved caps must be non-negative integers.
 */
export default function normalizeLoop(line: LoopLine, context: CompilationContext): NormalizedLoopLine | LoopLine {
	if (line.arguments.length === 0) {
		return line;
	}

	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);
	const argument = normalized.arguments[0];

	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return normalized as NormalizedLoopLine | LoopLine;
}
