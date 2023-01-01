import { i32const } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { getMemoryStringEndAddress, isMemoryIdentifier } from '../utils';

const endAddress: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	const argument = line.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER || !isMemoryIdentifier(namespace.memory, argument.value)) {
		throw '1006: Expected memory item, got something else';
	}

	return { byteCode: [...i32const(getMemoryStringEndAddress(namespace.memory, argument.value))], namespace };
};

export default endAddress;
