import { ArgumentType, type CompilationContext, type MapLine, type NormalizedMapLine } from '@8f4e/compiler-types';

import {
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

/**
 * Normalizes compile-time arguments for the `map` instruction.
 * Both the key argument (index 0) and value argument (index 1) are normalized.
 * Throws UNDECLARED_IDENTIFIER if either remains as an unresolved identifier after normalization.
 */
export default function normalizeMap(line: MapLine, context: CompilationContext): NormalizedMapLine | MapLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	for (const index of [0, 1]) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				continue;
			}
		}
		if (argument?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
			if (deferred) {
				continue;
			}
		}
	}

	return normalized as NormalizedMapLine | MapLine;
}
