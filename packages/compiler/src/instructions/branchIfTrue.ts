import { br_if } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const branchIfTrue: InstructionHandler = function (line, namespace, stack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, namespace, stack);
	} else {
		return { byteCode: br_if(line.arguments[0].value), namespace, stack };
	}
};

export default branchIfTrue;
