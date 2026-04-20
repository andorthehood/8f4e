import { getError } from '../getError';
import { SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

import type { UseLine } from '@8f4e/tokenizer';

export function semanticUse(line: UseLine, context: SymbolResolutionContext) {
	const namespaceId = line.arguments[0].value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(SymbolResolutionErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}
