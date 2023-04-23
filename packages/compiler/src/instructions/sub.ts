import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const sub: InstructionHandler = function (line, context) {
	if (context.blockStack.length < 1) {
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
			byteCode: [WASMInstruction.I32_SUB],
			context,
		};
	} else if (areAllOperandsFloats(operand1, operand2)) {
		context.stack.push({ isInteger: false });
		return {
			byteCode: [WASMInstruction.F32_SUB],
			context,
		};
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, context);
	}
};

export default sub;
