import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { isIntermoduleReferenceKind } from './isIntermoduleReferenceKind';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';

import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';
import { getError } from '../getError';

export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (isIntermoduleReferenceKind(argument.referenceKind)) {
		const targetModuleId = 'targetModuleId' in argument ? argument.targetModuleId : undefined;
		if (
			targetModuleId &&
			!context.namespace.modules?.[targetModuleId] &&
			context.namespace.discoveredModules?.[targetModuleId]
		) {
			return true;
		}
	}
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}
