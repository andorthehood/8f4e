import { areAllOperandsFloats, areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';
import { ErrorCode } from '../errors';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { getError } from '../errors';

const div: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand1 = context.stack.pop();
	const operand2 = context.stack.pop();

	if (!operand1 || !operand2) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!operand1.isNonZero) {
		throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
	}

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true, isNonZero: true });
		return { byteCode: [WASMInstruction.I32_DIV_S], context };
	} else if (areAllOperandsFloats(operand1, operand2)) {
		context.stack.push({ isInteger: false, isNonZero: true });
		return { byteCode: [WASMInstruction.F32_DIV], context };
	} else {
		throw getError(ErrorCode.UNMATCHING_OPERANDS, line, context);
	}
};

export default div;
