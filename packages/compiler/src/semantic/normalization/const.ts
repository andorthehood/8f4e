import {
	normalizeArgumentsAtIndexes,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
} from './helpers';

import { ArgumentType, type CompilationContext, type ConstLine, type NormalizedConstLine } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `const` instruction.
 * Folds the value argument (index 1) if it resolves to a compile-time constant.
 */
export default function normalizeConst(line: ConstLine, context: CompilationContext): NormalizedConstLine | ConstLine {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);

	const valueArg = result.arguments[1];
	if (valueArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(valueArg, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${valueArg.lhs.value}${valueArg.operator}${valueArg.rhs.value}`,
			});
		}
	}
	if (valueArg?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(valueArg, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: valueArg.value });
		}
	}

	return result as NormalizedConstLine;
}
