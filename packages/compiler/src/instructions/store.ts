import { i32store, f32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers } from '../utils';

const store: InstructionHandler = function (line, context) {
	const operand1Value = context.stack.pop();
	const operand2Address = context.stack.pop();

	if (!operand1Value || !operand2Address) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!areAllOperandsIntegers(operand2Address)) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, context);
	}

	if (areAllOperandsIntegers(operand1Value)) {
		return { byteCode: i32store(), context };
	} else {
		return { byteCode: f32store(), context };
	}
};

export default store;
