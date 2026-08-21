import type { CompilationContext, CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode, getError, SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS } from '@8f4e/language-spec';
import { resolveAndValidateValueArguments } from './helpers';

/**
 * Resolves and validates optional access-width arguments for clamp-address instructions.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function resolveClampAddressReferences(
	line: CompilerASTLine,
	context: CompilationContext
): CompilerASTLine {
	const resolved = resolveAndValidateValueArguments(line, context, [0]);
	const argument = resolved.arguments[0];

	if (
		argument?.type === ArgumentType.LITERAL &&
		(!Number.isInteger(argument.value) || !SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS.includes(argument.value))
	) {
		throw getError(ErrorCode.INVALID_ACCESS_WIDTH, line, context);
	}

	return resolved;
}
