import { i32load } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const load: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (areAllOperandsIntegers(operand)) {
		stack.push({ isInteger: true });
		return { byteCode: i32load(), namespace, stack, blockStack };
	} else {
		throw getError(ErrorCode.ONLY_INTEGERS, line, namespace, stack, blockStack);
	}
};

export default load;
