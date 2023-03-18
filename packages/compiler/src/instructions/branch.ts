import { br } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';

const branch: InstructionHandler = function branch(line, namespace, stack, blockStack) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack, blockStack);
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, namespace, stack, blockStack);
	} else {
		return { byteCode: br(line.arguments[0].value), namespace, stack, blockStack };
	}
};

export default branch;
