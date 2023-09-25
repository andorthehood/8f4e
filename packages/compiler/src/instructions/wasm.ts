import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const wasm: InstructionHandler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	return {
		byteCode: [line.arguments[0].value],
		context,
	};
};

export default wasm;
