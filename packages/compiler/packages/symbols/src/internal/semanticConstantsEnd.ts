import { isInstructionInsideBlock } from './isInstructionInsideBlock';

import { getError } from '../getError';
import { BLOCK_TYPE, SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

import type { ConstantsEndLine } from '@8f4e/tokenizer';

export function semanticConstantsEnd(line: ConstantsEndLine, context: SymbolResolutionContext) {
	if (!isInstructionInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS)) {
		throw getError(SymbolResolutionErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();
	if (!block || block.blockType !== BLOCK_TYPE.CONSTANTS) {
		throw getError(SymbolResolutionErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
