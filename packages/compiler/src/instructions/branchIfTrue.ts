import { br_if } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const branchIfTrue: InstructionHandler = function (line, namespace, stack, blockStack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack, blockStack);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, namespace, stack, blockStack);
	}

	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (!operand.isInteger) {
		throw getError(ErrorCode.EXPECTED_INTEGER_OPERAND, line, namespace, stack, blockStack);
	}

	return { byteCode: br_if(line.arguments[0].value), namespace, stack, blockStack };
};

export default branchIfTrue;
