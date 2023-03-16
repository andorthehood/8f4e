import { f32const, f32load, i32const, i32load, localGet } from '../wasmUtils/instructionHelpers';
import { Argument, ArgumentLiteral, ArgumentType, InstructionHandler } from '../types';
import {
	getMemoryItem,
	getMemoryItemByteAddress,
	getMemoryStringLastAddress,
	isLocalIdentifier,
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
} from '../utils';
import { ErrorCode, getError } from '../errors';

function getTypeAppropriateConstInstruction(argument: ArgumentLiteral) {
	if (argument.isInteger) {
		return i32const(argument.value);
	} else {
		return f32const(argument.value);
	}
}

const push: InstructionHandler = function (line, namespace, stack) {
	const { locals, memory, consts } = namespace;

	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	const argument = line.arguments[0];

	if (argument.type === ArgumentType.IDENTIFIER) {
		if (isMemoryIdentifier(memory, argument.value)) {
			const memoryItem = getMemoryItem(memory, argument.value);

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
			}

			stack.push({ isInteger: memoryItem.isInteger });

			return {
				byteCode: [...i32const(memoryItem.byteAddress), ...(memoryItem.isInteger ? i32load() : f32load())],
				namespace,
				stack,
			};
		} else if (isMemoryPointerIdentifier(memory, argument.value)) {
			const memoryItem = getMemoryItem(memory, argument.value.substring(1));

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
			}

			stack.push({ isInteger: memoryItem.isPointingToInteger });

			return {
				byteCode: [
					...i32const(memoryItem.byteAddress),
					...i32load(),
					...(memoryItem.isPointingToInteger ? i32load() : f32load()),
				],
				namespace,
				stack,
			};
		} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
			stack.push({ isInteger: true });
			if (argument.value.startsWith('&')) {
				return {
					byteCode: i32const(getMemoryItemByteAddress(memory, argument.value.substring(1))),
					namespace,
					stack,
				};
			} else {
				return {
					byteCode: i32const(getMemoryStringLastAddress(memory, argument.value.slice(0, -1))),
					namespace,
					stack,
				};
			}
		} else if (typeof consts[argument.value] !== 'undefined') {
			stack.push({ isInteger: consts[argument.value].isInteger });
			return { byteCode: i32const(consts[argument.value].value), namespace, stack };
		} else if (isLocalIdentifier(locals, argument.value)) {
			// TODO: add support for float locals
			stack.push({ isInteger: true });
			return { byteCode: localGet(locals.indexOf(argument.value)), namespace, stack };
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}
	} else {
		stack.push({ isInteger: argument.isInteger });
		return { byteCode: getTypeAppropriateConstInstruction(argument), namespace, stack };
	}
};

export default push;
