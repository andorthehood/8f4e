import type { CompilationContext, LoopLine, NormalizedLoopLine } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode, getError } from '@8f4e/language-spec';
import { normalizeAndValidateResolvableArgs } from './helpers';

/**
 * Normalizes the optional loop cap argument. Resolved caps must be non-negative integers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized loop line.
 */
export default function normalizeLoop(line: LoopLine, context: CompilationContext): NormalizedLoopLine | LoopLine {
	if (line.arguments.length === 0) {
		return line;
	}

	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);
	const argument = normalized.arguments[0];

	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return normalized as NormalizedLoopLine | LoopLine;
}
