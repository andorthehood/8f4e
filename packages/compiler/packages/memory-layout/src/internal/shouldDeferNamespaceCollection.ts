import { getDeferredNamespaceIds } from './getDeferredNamespaceIds';

import { ErrorCode, type Namespaces } from '../types';

import type { AST } from '@8f4e/tokenizer';

export function shouldDeferNamespaceCollection(
	error: unknown,
	line: AST[number] | undefined,
	namespaces: Namespaces
): boolean {
	if (!line || typeof error !== 'object' || error === null || !('code' in error)) {
		return false;
	}

	if (error.code !== ErrorCode.UNDECLARED_IDENTIFIER) {
		return false;
	}

	const referencedNamespaceIds = getDeferredNamespaceIds(line);
	return referencedNamespaceIds.some(namespaceId => !namespaces[namespaceId]);
}
