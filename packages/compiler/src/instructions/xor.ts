import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers } from '../utils';

const xor: InstructionHandler = function (line, context) {
	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true });
		return {
			byteCode: [WASMInstruction.I32_XOR],
			context,
		};
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default xor;
