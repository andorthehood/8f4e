import {
	ArgumentType,
	type CompilationContext,
	type MemoryCopyLine,
	type NormalizedMemoryCopyLine,
} from '@8f4e/compiler-types';

import {
	normalizeArgumentsAtIndexes,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
} from './helpers';

export default function normalizeMemoryCopy(
	line: MemoryCopyLine,
	context: CompilationContext
): NormalizedMemoryCopyLine | MemoryCopyLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized as MemoryCopyLine;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			return normalized as MemoryCopyLine;
		}
	}

	return normalized as NormalizedMemoryCopyLine | MemoryCopyLine;
}
