import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const group: InstructionHandler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		isModuleBlock: false,
		isGroupBlock: true,
		isLoop: false,
	});

	return {
		byteCode: [],
		context,
	};
};

export default group;
