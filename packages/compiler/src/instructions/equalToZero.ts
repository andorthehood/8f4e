import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';
import { parseSegment } from '../compiler';

const equalToZero: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (operand.isInteger) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return { byteCode: [WASMInstruction.I32_EQZ], context };
	} else {
		context.stack.push(operand);
		return parseSegment(['push 0.0', 'equal'], context);
	}
};

export default equalToZero;
