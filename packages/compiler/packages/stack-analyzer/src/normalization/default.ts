import type { CompilationContext, DefaultLine, NormalizedDefaultLine } from '@8f4e/compiler-spec';
import { normalizeAndValidateResolvableArgs } from './helpers';

/**
 * Normalizes value arguments for the `default` instruction.
 * The value argument (index 0) is normalized.
 * Throws UNDECLARED_IDENTIFIER if it remains as an unresolved identifier after normalization.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized default line.
 */
export default function normalizeDefault(
	line: DefaultLine,
	context: CompilationContext
): NormalizedDefaultLine | DefaultLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

	return normalized as NormalizedDefaultLine | DefaultLine;
}
