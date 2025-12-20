import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionInsideModuleOrFunction, saveByteCode } from '../utils';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const round: InstructionCompiler = function (line, context) {
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

	context.stack.push({ isInteger: false, isNonZero: false });

	return saveByteCode(context, [WASMInstruction.F32_NEAREST]);
};

export default round;
