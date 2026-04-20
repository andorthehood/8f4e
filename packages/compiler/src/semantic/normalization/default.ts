import { validateOrDeferCompileTimeExpression, validateOrDeferUnresolvedIdentifier } from './helpers';

import { ArgumentType, type CompilationContext, type DefaultLine, type NormalizedDefaultLine } from '../../types';

/**
 * Normalizes compile-time arguments for the `default` instruction.
 * The value argument (index 0) is normalized.
 * Throws UNDECLARED_IDENTIFIER if it remains as an unresolved identifier after normalization.
 */
export default function normalizeDefault(
	line: DefaultLine,
	context: CompilationContext
): NormalizedDefaultLine | DefaultLine {
	const argument = line.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return line;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			return line;
		}
	}

	return line as NormalizedDefaultLine | DefaultLine;
}
