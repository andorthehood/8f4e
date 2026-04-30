import { BLOCK_TYPE, type CompilationContext, type ConstantsEndLine } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../../compilerError';
import { isInstructionIsInsideBlock } from '../../utils/blockStack';

export default function semanticConstantsEnd(line: ConstantsEndLine, context: CompilationContext) {
	if (!isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.CONSTANTS) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
