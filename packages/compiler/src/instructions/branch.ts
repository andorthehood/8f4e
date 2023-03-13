import { br } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const branch: InstructionHandler = function branch(line, namespace, stack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line);
	} else {
		return { byteCode: br(line.arguments[0].value), namespace, stack };
	}
};

export default branch;
