import { ArgumentType, SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { normalizeAndValidateResolvableArgs } from './helpers';

import { getError } from '../../compilerError';

import type { AST, CompilationContext } from '@8f4e/compiler-spec';

export default function normalizeClampAddress(line: AST[number], context: CompilationContext): AST[number] {
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
