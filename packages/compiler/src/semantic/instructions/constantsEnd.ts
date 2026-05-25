import { BlockType, type CompilationContext, type ConstantsEndLine } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';
import { popExpectedBlock } from '../../utils/blockStack';

export default function semanticConstantsEnd(line: ConstantsEndLine, context: CompilationContext) {
	if (!context.insideConstantsBlock) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	popExpectedBlock(line, context, BlockType.CONSTANTS);
}
