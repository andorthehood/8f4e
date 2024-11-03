import { ArgumentType, BLOCK_TYPE, InstructionCompiler } from '../types';
import { ErrorCode, getError } from '../errors';

const _module: InstructionCompiler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = line.arguments[0].value;

	return context;
};

export default _module;
