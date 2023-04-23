import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler } from '../types';

const _module: InstructionHandler = function (line, context) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({ hasExpectedResult: false, expectedResultIsInteger: false, isModuleBlock: true });

	return {
		byteCode: [],
		context: { ...context, namespace: { ...context.namespace, moduleName: line.arguments[0].value } },
	};
};

export default _module;
