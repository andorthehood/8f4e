import { ArgumentType, type CompilationContext, type InitLine, type NormalizedInitLine } from '@8f4e/compiler-types';

import {
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	normalizeArgumentsAtIndexes,
} from './helpers';

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
				identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
			});
		}
	}
	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument, line, context);
	}

	return normalized as NormalizedInitLine;
}
