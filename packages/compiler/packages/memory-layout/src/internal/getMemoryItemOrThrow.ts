import { getError } from '../getError';
import { ErrorCode, type DataStructure, type PublicMemoryLayoutContext } from '../internalTypes';

import type { CompileErrorContext } from '@8f4e/compiler-errors';
import type { AST } from '@8f4e/tokenizer';

export function getMemoryItemOrThrow(
	memoryId: string,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace'> & CompileErrorContext
): DataStructure {
	const memoryItem = context.namespace.memory[memoryId];
	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: memoryId });
	}
	return memoryItem;
}
