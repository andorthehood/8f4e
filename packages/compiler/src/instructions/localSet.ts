import { localSet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { areAllOperandsIntegers } from '../utils';
import { ErrorCode, getError } from '../errors';

const _localSet: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	if (!areAllOperandsIntegers(operand)) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		const local = context.namespace.locals.get(line.arguments[0].value);

		if (!local) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		return { byteCode: localSet(local.index), context };
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}
};

export default _localSet;
