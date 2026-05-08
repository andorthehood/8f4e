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

import { ErrorCode, getError } from '../../compilerError';

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
	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return normalized as NormalizedMemoryCopyLine | MemoryCopyLine;
}
