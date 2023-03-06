import { i32const, i32load, localGet } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';
import {
	getMemoryItemByteAddress,
	getMemoryStringLastAddress,
	isLocalIdentifier,
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
} from '../utils';

const push: InstructionHandler = function (line, namespace) {
	const { locals, memory, consts } = namespace;

	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	const argument = line.arguments[0];

	if (argument.type === ArgumentType.IDENTIFIER) {
		if (isMemoryIdentifier(memory, argument.value)) {
			return {
				byteCode: [...i32const(getMemoryItemByteAddress(memory, argument.value)), ...i32load()],
				namespace,
			};
		} else if (isMemoryPointerIdentifier(memory, argument.value)) {
			return {
				byteCode: [
					...i32const(getMemoryItemByteAddress(memory, argument.value.substring(1))),
					...i32load(),
					...i32load(),
				],
				namespace,
			};
		} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
			if (argument.value.startsWith('&')) {
				return { byteCode: i32const(getMemoryItemByteAddress(memory, argument.value.substring(1))), namespace };
			} else {
				return { byteCode: i32const(getMemoryStringLastAddress(memory, argument.value.slice(0, -1))), namespace };
			}
		} else if (typeof consts[argument.value] !== 'undefined') {
			return { byteCode: i32const(consts[argument.value]), namespace };
		} else if (isLocalIdentifier(locals, argument.value)) {
			return { byteCode: localGet(locals.indexOf(argument.value)), namespace };
		} else {
			throw `1003: Undeclared identifier: '${argument.value}`;
		}
	} else {
		return { byteCode: i32const(argument.value), namespace };
	}
};

export default push;
