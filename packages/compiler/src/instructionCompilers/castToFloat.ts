import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const castToFloat: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsFloats(operand)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });

	return saveByteCode(context, [WASMInstruction.F32_CONVERT_I32_S]);
};

export default castToFloat;
