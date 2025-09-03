import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule, saveByteCode } from '../utils';
import type { InstructionCompiler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';

const castToInt: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.EXPECTED_FLOAT_OPERAND, line, context);
	}

	context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });

	return saveByteCode(context, [WASMInstruction.I32_TUNC_F32_S]);
};

export default castToInt;
