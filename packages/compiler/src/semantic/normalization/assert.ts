import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';

import { normalizeAndValidateResolvableArgs } from './helpers';

import { getError } from '../../compilerError';

import type { AssertLine, CompilationContext, NormalizedAssertLine } from '@8f4e/compiler-spec';

/**
 * Normalizes the expected value argument for the `assert` instruction.
 */
export default function normalizeAssert(
	line: AssertLine,
	context: CompilationContext
): NormalizedAssertLine | AssertLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);
	const expected = normalized.arguments[0];

	if (expected?.type === ArgumentType.LITERAL && !expected.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}

	return normalized as NormalizedAssertLine | AssertLine;
}
