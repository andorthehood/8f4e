import {
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';

/**
 * Normalizes compile-time arguments for the `default` instruction.
 * The value argument (index 0) is normalized.
 * Throws UNDECLARED_IDENTIFIER if it remains as an unresolved identifier after normalization.
 */
export default function normalizeDefault(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			return normalized;
		}
	}

	return normalized;
}
