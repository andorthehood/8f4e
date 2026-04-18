import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { hasCollectedNamespaces } from './hasCollectedNamespaces';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

export function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (!hasCollectedNamespaces(context) && argument.intermoduleIds.length > 0) {
		return true;
	}
	if (argument.left.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.left, line, context);
	}
	if (argument.right.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.right, line, context);
	}
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
		identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
	});
}
