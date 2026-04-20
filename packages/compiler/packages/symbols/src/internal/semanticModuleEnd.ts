import { isInstructionInsideBlock } from './isInstructionInsideBlock';

import { getError } from '../getError';
import { BLOCK_TYPE, SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

import type { ModuleEndLine } from '@8f4e/tokenizer';

export function semanticModuleEnd(line: ModuleEndLine, context: SymbolResolutionContext) {
	if (!isInstructionInsideBlock(context.blockStack, BLOCK_TYPE.MODULE)) {
		throw getError(SymbolResolutionErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();
	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(SymbolResolutionErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
