import { ArgumentType, type InitLine } from '@8f4e/tokenizer';

import { normalizeArgumentsAtIndexes } from './normalizeArgumentsAtIndexes';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';
import { validateOrDeferCompileTimeExpression } from './validateOrDeferCompileTimeExpression';

import { ErrorCode, type PublicMemoryLayoutContext } from '../types';
import { getError } from '../getError';

export function normalizeInit(line: InitLine, context: PublicMemoryLayoutContext): InitLine {
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
	return normalized as InitLine;
}
