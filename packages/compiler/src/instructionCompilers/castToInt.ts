import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const castToInt: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });

	return saveByteCode(context, [WASMInstruction.I32_TUNC_F32_S]);
};

export default castToInt;
