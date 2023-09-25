import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const use: InstructionHandler = function (line, context) {
	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	const namespaceToUse = context.namespace.namespaces.get(line.arguments[0].value);

	if (!namespaceToUse) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
	}

	context.namespace.consts = { ...context.namespace.consts, ...namespaceToUse.consts };

	return {
		byteCode: [],
		context,
	};
};

export default use;
