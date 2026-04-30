import { BLOCK_TYPE, type CompilationContext, type ModuleEndLine } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../../compilerError';
import { isInstructionIsInsideAModule } from '../../utils/blockStack';

export default function semanticModuleEnd(line: ModuleEndLine, context: CompilationContext) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
