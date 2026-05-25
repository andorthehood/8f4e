import { BlockType, type CompilationContext, type ConstantsEndLine } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { popBlock } from '../../utils/blockStack';

export default function semanticConstantsEnd(line: ConstantsEndLine, context: CompilationContext) {
	if (!context.insideConstantsBlock) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = popBlock(context);

	if (!block || block.blockType !== BlockType.CONSTANTS) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
