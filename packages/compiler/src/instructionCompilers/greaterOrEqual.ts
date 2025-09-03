import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, areAllOperandsIntegers, isInstructionIsInsideAModule, saveByteCode } from '../utils';
import type { InstructionCompiler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';

const greaterOrEqual: InstructionCompiler = function (line, context) {
	if (!isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_GE_S]);
	} else if (areAllOperandsFloats(operand1, operand2)) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.F32_GE]);
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, context);
	}
};

export default greaterOrEqual;
