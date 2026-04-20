import { combineSplitHexBytes } from './combineSplitHexBytes';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';

import type { CompileErrorContext } from '@8f4e/compiler-errors';
import type { AST, SplitByteToken } from '@8f4e/tokenizer';

export function resolveSplitByteTokens(
	tokens: SplitByteToken[],
	maxBytes: number,
	lineForError: AST[number],
	context: Pick<PublicMemoryLayoutContext, 'namespace'> & CompileErrorContext
): number {
	if (tokens.length > maxBytes) {
		throw getError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, lineForError, context);
	}
	const bytes: number[] = [];
	for (const token of tokens) {
		if (token.type === 'literal') {
			bytes.push(token.value);
		} else {
			const constant = context.namespace.consts[token.value];
			if (!constant) {
				throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
			}
			if (!constant.isInteger || constant.value < 0 || constant.value > 255) {
				throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
			}
			bytes.push(constant.value);
		}
	}
	return combineSplitHexBytes(bytes, maxBytes);
}
