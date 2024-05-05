import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import { i32load, i32load8s, i32load8u, i32load16s, i32load16u } from '../wasmUtils/instructionHelpers';

const instructionToByteCodeMap = {
	load: i32load(),
	load8s: i32load8s(),
	load8u: i32load8u(),
	load16s: i32load16s(),
	load16u: i32load16u(),
};

const load: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		context.stack.push({ isInteger: true });
		return { byteCode: instructionToByteCodeMap[line.instruction], context };
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default load;
