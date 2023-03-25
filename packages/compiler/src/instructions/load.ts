import { i32load } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const load: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (areAllOperandsIntegers(operand)) {
		context.stack.push({ isInteger: true });
		return { byteCode: i32load(), context };
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}
};

export default load;
