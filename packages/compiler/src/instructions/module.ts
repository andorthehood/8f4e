import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler } from '../types';

const _module: InstructionHandler = function (line, namespace, stack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, namespace, stack);
	}

	return { byteCode: [], namespace: { ...namespace, moduleName: line.arguments[0].value }, stack };
};

export default _module;
