import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { f32const, f32load, i32const, i32load, localGet } from '../wasmUtils/instructionHelpers';
import {
	getDataStructure,
	getDataStructureByteAddress,
	getMemoryStringLastByteAddress,
	isInstructionInsideModuleOrFunction,
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
	isElementCountIdentifier,
	isElementWordSizeIdentifier,
	getElementWordSize,
	getElementCount,
	saveByteCode,
} from '../utils';

import type { ArgumentLiteral, InstructionCompiler } from '../types';

function getTypeAppropriateConstInstruction(argument: ArgumentLiteral) {
	if (argument.isInteger) {
		return i32const(argument.value);
	} else {
		return f32const(argument.value);
	}
}

const push: InstructionCompiler = function (line, context) {
	if (!isInstructionInsideModuleOrFunction(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const { locals, memory, consts } = context.namespace;

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	const argument = line.arguments[0];

	if (argument.type === ArgumentType.IDENTIFIER) {
		if (isMemoryIdentifier(memory, argument.value)) {
			const memoryItem = getDataStructure(memory, argument.value);

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: memoryItem.isInteger, isNonZero: false });

			return saveByteCode(context, [
				...i32const(memoryItem.byteAddress),
				...(memoryItem.isInteger ? i32load() : f32load()),
			]);
		} else if (isMemoryPointerIdentifier(memory, argument.value)) {
			const memoryItem = getDataStructure(memory, argument.value.substring(1));

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: memoryItem.isPointingToInteger, isNonZero: false });

			return saveByteCode(context, [
				...i32const(memoryItem.byteAddress),
				...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
				...(memoryItem.isPointingToInteger ? i32load() : f32load()),
			]);
		} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
			let value = 0;
			if (argument.value.startsWith('&')) {
				value = getDataStructureByteAddress(memory, argument.value.substring(1));
			} else {
				value = getMemoryStringLastByteAddress(memory, argument.value.slice(0, -1));
			}
			context.stack.push({ isInteger: true, isNonZero: value !== 0, isSafeMemoryAddress: true });
			return saveByteCode(context, i32const(value));
		} else if (isElementCountIdentifier(memory, argument.value)) {
			context.stack.push({ isInteger: true, isNonZero: true });
			return saveByteCode(context, i32const(getElementCount(memory, argument.value.substring(1))));
		} else if (isElementWordSizeIdentifier(memory, argument.value)) {
			context.stack.push({ isInteger: true, isNonZero: true });
			return saveByteCode(context, i32const(getElementWordSize(memory, argument.value.substring(1))));
		} else if (typeof consts[argument.value] !== 'undefined') {
			context.stack.push({
				isInteger: consts[argument.value].isInteger,
				isNonZero: consts[argument.value].value !== 0,
			});
			return saveByteCode(
				context,
				consts[argument.value].isInteger
					? i32const(consts[argument.value].value)
					: f32const(consts[argument.value].value)
			);
		} else {
			const local = locals[argument.value];

			if (!local) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: local.isInteger, isNonZero: false });

			return saveByteCode(context, localGet(local.index));
		}
	} else {
		context.stack.push({ isInteger: argument.isInteger, isNonZero: argument.value !== 0 });

		return saveByteCode(context, getTypeAppropriateConstInstruction(argument));
	}
};

export default push;
