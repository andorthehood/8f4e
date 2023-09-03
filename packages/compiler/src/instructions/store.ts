import { f32store, i32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, isInstructionIsInsideAModule } from '../utils';

const store: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

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
