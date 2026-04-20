import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { hasResolvedModuleLayouts } from './hasResolvedModuleLayouts';
import { isIntermoduleReferenceKind } from './isIntermoduleReferenceKind';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';

import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';
import { getError } from '../getError';

export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (!hasResolvedModuleLayouts(context) && isIntermoduleReferenceKind(argument.referenceKind)) {
		return true;
	}
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}
