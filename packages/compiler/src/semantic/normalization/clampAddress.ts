import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode, SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { normalizeAndValidateResolvableArgs } from './helpers';

/**
 * Normalizes and validates optional access-width arguments for clamp-address instructions.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function normalizeClampAddress(line: CompilerASTLine, context: CompilationContext): CompilerASTLine {
	const normalized = normalizeAndValidateResolvableArgs(line, context, [0]);
	const argument = normalized.arguments[0];

	if (
		argument?.type === ArgumentType.LITERAL &&
		(!Number.isInteger(argument.value) || !SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS.includes(argument.value))
	) {
		throw getError(ErrorCode.INVALID_ACCESS_WIDTH, line, context);
	}

	return normalized;
}
