import { ArgumentType, SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS } from '@8f4e/compiler-types';

import {
	normalizeArgumentsAtIndexes,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
} from './helpers';

import { ErrorCode, getError } from '../../compilerError';

import type { AST, CompilationContext } from '@8f4e/compiler-types';

export default function normalizeClampAddress(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);
	const argument = normalized.arguments[0];

	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			return normalized;
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			return normalized;
		}
	}
	if (
		argument?.type === ArgumentType.LITERAL &&
		(!Number.isInteger(argument.value) || !SUPPORTED_MEMORY_ACCESS_BYTE_WIDTHS.includes(argument.value))
	) {
		throw getError(ErrorCode.INVALID_ACCESS_WIDTH, line, context);
	}

	return normalized;
}
