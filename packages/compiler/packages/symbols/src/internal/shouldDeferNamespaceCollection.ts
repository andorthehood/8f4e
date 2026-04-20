import { getDeferredNamespaceIds } from './getDeferredNamespaceIds';

import { SymbolResolutionErrorCode, type Namespaces } from '../types';

import type { AST } from '@8f4e/tokenizer';

export function shouldDeferNamespaceCollection(
	error: { code: number; line: AST[number] },
	namespaces: Namespaces
): boolean {
	if (error.code !== SymbolResolutionErrorCode.UNDECLARED_IDENTIFIER) {
		return false;
	}

	const referencedNamespaceIds = getDeferredNamespaceIds(error.line);
	return referencedNamespaceIds.some(namespaceId => !namespaces[namespaceId]);
}
