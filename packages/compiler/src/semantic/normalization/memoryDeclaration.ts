import {
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Both the name argument (index 0) and the default value argument (index 1) are normalized.
 * Validates intermodule references in the default value if present.
 */
export default function normalizeMemoryDeclaration(line: AST[number], context: CompilationContext): AST[number] {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	for (const index of [0, 1]) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				continue;
			}
		}
		if (index === 1 && argument?.type === ArgumentType.IDENTIFIER) {
			validateIntermoduleAddressReference(argument.value, line, context);
		}
	}

	if (line.instruction.endsWith('[]')) {
		const elementCountArg = normalized.arguments[1];
		if (elementCountArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: `${elementCountArg.lhs}${elementCountArg.operator}${elementCountArg.rhs}`,
				});
			}
		}
		if (elementCountArg?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: elementCountArg.value });
			}
		}
	}

	return normalized;
}
