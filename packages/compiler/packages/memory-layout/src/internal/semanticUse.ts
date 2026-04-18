import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

import type { UseLine } from '@8f4e/tokenizer';

export function semanticUse(line: UseLine, context: PublicMemoryLayoutContext) {
	const namespaceId = line.arguments[0].value;
	const namespaceToUse = context.namespace.namespaces[namespaceId];

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: namespaceId });
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };
}
