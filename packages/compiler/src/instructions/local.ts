import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler } from '../types';

const local: InstructionHandler = function (line, context) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.namespace.locals.set(line.arguments[1].value, {
		isInteger: line.arguments[0].value === 'int',
		index: context.namespace.locals.size,
	});

	return {
		byteCode: [],
		context,
	};
};

export default local;
