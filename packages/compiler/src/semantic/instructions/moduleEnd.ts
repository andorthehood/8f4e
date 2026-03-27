import { ErrorCode, getError } from '../../compilerError';
import { isInstructionIsInsideAModule } from '../../utils/blockStack';
import { BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticModuleEnd(line: AST[number], context: CompilationContext) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const block = context.blockStack.pop();

	if (!block || block.blockType !== BLOCK_TYPE.MODULE) {
		throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
	}
}
