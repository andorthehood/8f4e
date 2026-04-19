import {
	type PublicMemoryLayoutContext,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from '@8f4e/compiler-memory-layout';

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
	const publicMemoryContext = context as unknown as PublicMemoryLayoutContext;
	const { line: normalized } = normalizeArgumentsAtIndexes(line, publicMemoryContext, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, publicMemoryContext);
		if (deferred) {
			return normalized as DefaultLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, publicMemoryContext);
		if (deferred) {
			return normalized as DefaultLine;
		}
	}

	return normalized as NormalizedDefaultLine | DefaultLine;
}
