import { getError, type PublicMemoryLayoutErrorContext } from '../getError';
import { ErrorCode, type DataStructure, type PublicMemoryLayoutContext } from '../types';

import type { AST } from '@8f4e/tokenizer';

export function getMemoryItemOrThrow(
	memoryId: string,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace'> & PublicMemoryLayoutErrorContext
): DataStructure {
	const memoryItem = context.namespace.memory[memoryId];
	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: memoryId });
	}
	return memoryItem;
}
