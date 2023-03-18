import { localSet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const _localSet: InstructionHandler = function (line, namespace, stack, blockStack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, namespace, stack, blockStack);
	}

	if (!areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, namespace, stack, blockStack);
	}

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack, blockStack);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (namespace.locals.indexOf(line.arguments[0].value) === -1) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, namespace, stack, blockStack);
		}

		return { byteCode: localSet(namespace.locals.indexOf(line.arguments[0].value)), namespace, stack, blockStack };
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, namespace, stack, blockStack);
	}
};

export default _localSet;
