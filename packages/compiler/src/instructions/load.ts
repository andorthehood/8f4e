import { i32const, i32load } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import { getMemoryItemByteAddress, isMemoryIdentifier } from '../utils';

const load: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0]) {
		return { byteCode: i32load(), namespace };
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		if (!isMemoryIdentifier(namespace.memory, line.arguments[0].value)) {
			throw `1003: Undeclared identifier: '${line.arguments[0].value}`;
		}

		return {
			byteCode: [...i32const(getMemoryItemByteAddress(namespace.memory, line.arguments[0].value)), ...i32load()],
			namespace,
		};
	} else {
		throw `1005: Expected identifier, got a value: '${line.arguments[0].value}'`;
	}
};

export default load;
