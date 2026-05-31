import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode, SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { normalizeAndValidateResolvableArgs } from './helpers';

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
