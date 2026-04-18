import { isInstructionIsInsideBlock } from './isInstructionIsInsideBlock';

import { getError } from '../getError';
import { BLOCK_TYPE, ErrorCode, type PublicMemoryLayoutContext } from '../types';

import type { ModuleEndLine } from '@8f4e/tokenizer';

export function semanticModuleEnd(line: ModuleEndLine, context: PublicMemoryLayoutContext) {
	if (!isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.MODULE)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();
	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
