import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloats, areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';

const add: InstructionHandler = function (line, context) {
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
		return {
			byteCode: [WASMInstruction.I32_ADD],
			context,
		};
	} else if (areAllOperandsFloats(operand1, operand2)) {
		context.stack.push({ isInteger: false, isNonZero: false });
		return {
			byteCode: [WASMInstruction.F32_ADD],
			context,
		};
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, context);
	}
};

export default add;
