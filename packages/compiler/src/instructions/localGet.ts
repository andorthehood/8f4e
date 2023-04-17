import { localGet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const _localGet: InstructionHandler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		const local = context.namespace.locals.get(line.arguments[0].value);

		if (!local) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		context.stack.push({ isInteger: local.isInteger });
		return { byteCode: localGet(local.index), context };
	} else {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}
};

export default _localGet;
