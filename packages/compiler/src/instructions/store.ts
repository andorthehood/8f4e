import { i32store, f32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers } from '../utils';

const store: InstructionHandler = function (line, namespace, stack) {
	const operand1Value = stack.pop();
	const operand2Address = stack.pop();

	if (!operand1Value || !operand2Address) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack);
	}

	if (!areAllOperandsIntegers(operand2Address)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, namespace, stack);
	}

	if (areAllOperandsIntegers(operand1Value)) {
		return { byteCode: i32store(), namespace, stack };
	} else {
		return { byteCode: f32store(), namespace, stack };
	}
};

export default store;
