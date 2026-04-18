import { ArgumentType, type AST, type Argument } from '@8f4e/tokenizer';

import { hasCollectedNamespaces } from './hasCollectedNamespaces';
import { isIntermoduleReferenceKind } from './isIntermoduleReferenceKind';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';

import { ErrorCode, type PublicMemoryLayoutContext } from '../types';
import { getError } from '../getError';

export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
	context: PublicMemoryLayoutContext
): boolean {
	if (!hasCollectedNamespaces(context) && isIntermoduleReferenceKind(argument.referenceKind)) {
		return true;
	}
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}
