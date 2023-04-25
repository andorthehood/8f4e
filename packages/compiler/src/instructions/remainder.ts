import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { ErrorCode, getError } from '../errors';

const remainder: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_REM_S],
			context,
		};
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default remainder;
