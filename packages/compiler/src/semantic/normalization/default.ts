import {
	ArgumentType,
	type CompilationContext,
	type DefaultLine,
	type NormalizedDefaultLine,
} from '@8f4e/compiler-types';

import {
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

/**
 * Normalizes compile-time arguments for the `default` instruction.
 * The value argument (index 0) is normalized.
 * Throws UNDECLARED_IDENTIFIER if it remains as an unresolved identifier after normalization.
 */
export default function normalizeDefault(
	line: DefaultLine,
	context: CompilationContext
): NormalizedDefaultLine | DefaultLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized as DefaultLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			return normalized as DefaultLine;
		}
	}

	return normalized as NormalizedDefaultLine | DefaultLine;
}
