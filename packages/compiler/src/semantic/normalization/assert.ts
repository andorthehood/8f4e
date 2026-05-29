import { normalizeAndValidateResolvableArgs } from './helpers';

import type { AssertLine, CompilationContext, NormalizedAssertLine } from '@8f4e/compiler-spec';

/**
 * Normalizes the expected value argument for the `assert` instruction.
 */
export default function normalizeAssert(
	line: AssertLine,
	context: CompilationContext
): NormalizedAssertLine | AssertLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

	return normalized as NormalizedAssertLine | AssertLine;
}
