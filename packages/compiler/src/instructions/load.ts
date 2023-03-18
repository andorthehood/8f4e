import { i32load } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const load: InstructionHandler = function (line, namespace, stack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack);
	}

	if (areAllOperandsIntegers(operand)) {
		stack.push({ isInteger: true });
		return { byteCode: i32load(), namespace, stack };
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, namespace, stack);
	}
};

export default load;
