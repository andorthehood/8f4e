import { localGet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const _localGet: InstructionHandler = function (line, namespace, stack, blockStack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack, blockStack);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (namespace.locals.indexOf(line.arguments[0].value) === -1) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, namespace, stack, blockStack);
		}
		// TODO: add support for float locals
		stack.push({ isInteger: true });
		return { byteCode: localGet(namespace.locals.indexOf(line.arguments[0].value)), namespace, stack, blockStack };
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, namespace, stack, blockStack);
	}
};

export default _localGet;
