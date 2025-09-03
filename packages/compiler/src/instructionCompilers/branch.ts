import type { InstructionCompiler } from '../types';
import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { br } from '../wasmUtils/instructionHelpers';
import { isInstructionIsInsideAModule, saveByteCode } from '../utils';

const branch: InstructionCompiler = function branch(line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	} else {
		return saveByteCode(context, br(line.arguments[0].value));
	}
};

export default branch;
