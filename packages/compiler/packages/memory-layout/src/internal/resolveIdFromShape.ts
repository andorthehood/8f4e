import { parseMemoryInstructionArgumentsShape, type AST } from '@8f4e/tokenizer';

import { getError, type PublicMemoryLayoutErrorContext } from '../getError';
import { ErrorCode } from '../types';

export function resolveIdFromShape(
	firstArg: ReturnType<typeof parseMemoryInstructionArgumentsShape>['firstArg'],
	lineNumberAfterMacroExpansion: number,
	lineForError: AST[number],
	context: PublicMemoryLayoutErrorContext
): string {
	switch (firstArg.type) {
		case 'literal':
		case 'split-byte-tokens':
			return '__anonymous__' + lineNumberAfterMacroExpansion;
		case 'constant-identifier':
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		case 'identifier':
			if (firstArg.value === 'this') {
				throw getError(ErrorCode.RESERVED_MEMORY_IDENTIFIER, lineForError, context, { identifier: firstArg.value });
			}
			return firstArg.value;
		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}
}
