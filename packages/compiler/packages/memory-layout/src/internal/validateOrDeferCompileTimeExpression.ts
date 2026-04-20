import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';

export function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (
		argument.intermoduleIds.some(
			moduleId => !context.namespace.modules?.[moduleId] && context.namespace.discoveredModules?.[moduleId]
		)
	) {
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
