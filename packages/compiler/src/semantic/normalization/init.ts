import {
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type CompilationContext, type InitLine, type NormalizedInitLine } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for the `init` instruction.
 * The default value argument (index 1) is normalized.
 * Validates intermodule references in the default value if present.
 */
export default function normalizeInit(line: InitLine, context: CompilationContext): NormalizedInitLine | InitLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [1]);

	const argument = normalized.arguments[1];
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${argument.lhs.value}${argument.operator}${argument.rhs.value}`,
			});
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument, line, context);
	}

	return normalized as NormalizedInitLine;
}
