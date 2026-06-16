import {
	ArgumentType,
	type CompilationContext,
	ErrorCode,
	getError,
	type MemoryCopyLine,
	type NormalizedMemoryCopyLine,
} from '@8f4e/compiler-spec';
import { normalizeAndValidateResolvableArgs } from './helpers';

/**
 * Normalizes and validates the byte-length argument for `memoryCopy`.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function normalizeMemoryCopy(
	line: MemoryCopyLine,
	context: CompilationContext
): NormalizedMemoryCopyLine | MemoryCopyLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);

	const argument = normalized.arguments[0];
	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return normalized as NormalizedMemoryCopyLine | MemoryCopyLine;
}
