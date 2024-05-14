import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import { f32load } from '../wasmUtils/instructionHelpers';

const loadFloat: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		context.stack.push({ isInteger: false, isNonZero: false });
		return { byteCode: f32load(), context };
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default loadFloat;
