import { localSet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const _localSet: InstructionHandler = function (line, namespace, stack) {
	const operand = stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line);
	}

	if (!areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.ONLY_INTEGERS, line);
	}

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (namespace.locals.indexOf(line.arguments[0].value) === -1) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}

		return { byteCode: localSet(namespace.locals.indexOf(line.arguments[0].value)), namespace, stack };
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line);
	}
};

export default _localSet;
