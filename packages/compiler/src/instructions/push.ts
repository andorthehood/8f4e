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

const push: InstructionHandler = function (line, context) {
	const { locals, memory, consts } = context.namespace;

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	const argument = line.arguments[0];

	if (argument.type === ArgumentType.IDENTIFIER) {
		if (isMemoryIdentifier(memory, argument.value)) {
			const memoryItem = getMemoryItem(memory, argument.value);

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: memoryItem.isInteger });

			return {
				byteCode: [...i32const(memoryItem.byteAddress), ...(memoryItem.isInteger ? i32load() : f32load())],
				context,
			};
		} else if (isMemoryPointerIdentifier(memory, argument.value)) {
			const memoryItem = getMemoryItem(memory, argument.value.substring(1));

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: memoryItem.isPointingToInteger });

			return {
				byteCode: [
					...i32const(memoryItem.byteAddress),
					...i32load(),
					...(memoryItem.isPointingToInteger ? i32load() : f32load()),
				],
				context,
			};
		} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
			context.stack.push({ isInteger: true });
			if (argument.value.startsWith('&')) {
				return {
					byteCode: i32const(getMemoryItemByteAddress(memory, argument.value.substring(1))),
					context,
				};
			} else {
				return {
					byteCode: i32const(getMemoryStringLastAddress(memory, argument.value.slice(0, -1))),
					context,
				};
			}
		} else if (typeof consts[argument.value] !== 'undefined') {
			context.stack.push({ isInteger: consts[argument.value].isInteger });
			return { byteCode: i32const(consts[argument.value].value), context };
		} else if (isLocalIdentifier(locals, argument.value)) {
			// TODO: add support for float locals
			context.stack.push({ isInteger: true });
			return { byteCode: localGet(locals.indexOf(argument.value)), context };
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
	} else {
		context.stack.push({ isInteger: argument.isInteger });
		return { byteCode: getTypeAppropriateConstInstruction(argument), context };
	}
};

export default push;
