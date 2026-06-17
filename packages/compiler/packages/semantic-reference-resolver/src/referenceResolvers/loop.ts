import type { CompilationContext, LoopLine, ResolvedLoopLine } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode, getError } from '@8f4e/language-spec';
import { resolveAndValidateValueArguments } from './helpers';

/**
 * Resolves the optional loop cap argument. Resolved caps must be non-negative integers.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Loop line with resolved cap metadata.
 */
export default function resolveLoopReferences(
	line: LoopLine,
	context: CompilationContext
): ResolvedLoopLine | LoopLine {
	if (line.arguments.length === 0) {
		return line;
	}

	const resolved = resolveAndValidateValueArguments(line, context, [0]);
	const argument = resolved.arguments[0];

	if (argument?.type === ArgumentType.LITERAL && !argument.isInteger) {
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}
	if (argument?.type === ArgumentType.LITERAL && argument.value < 0) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return resolved as ResolvedLoopLine | LoopLine;
}
