import { applySemanticInstruction } from './applySemanticInstruction';
import { normalizeLayoutLine } from './normalizeLayoutLine';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

import type { AST } from '@8f4e/tokenizer';

export function applySemanticLine(line: AST[number], context: PublicMemoryLayoutContext) {
	if (!line.isSemanticOnly) {
		throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
	}
	applySemanticInstruction(normalizeLayoutLine(line, context), context);
}
