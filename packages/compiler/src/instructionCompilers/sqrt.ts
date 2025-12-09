import { ErrorCode, getError } from '../errors';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';

import type { InstructionCompiler } from '../types';

const sqrt: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();

	if (!operand1) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operand1.isInteger) {
		throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line, context);
	}

	context.stack.push({ isInteger: false, isNonZero: true });
	return saveByteCode(context, [WASMInstruction.F32_SQRT]);
};

export default sqrt;
