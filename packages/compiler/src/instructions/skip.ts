import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { ErrorCode, getError } from '../errors';
import { br, i32const, i32load, i32store } from '../wasmUtils/instructionHelpers';
import { calculateMemoryWordSize, isInstructionIsInsideAModule } from '../utils';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { WORD_LENGTH } from '../consts';

const skip: InstructionHandler = function (line, context) {
	const { consts } = context.namespace;

	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	let timesToSkip = 0;

	if (!line.arguments[0]) {
		return { byteCode: [WASMInstruction.RETURN], context };
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		timesToSkip = line.arguments[0].value;
	} else {
		if (typeof consts[line.arguments[0].value] !== 'undefined') {
			timesToSkip = consts[line.arguments[0].value].value;
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}
	}

	const memory = context.namespace.memory;
	const wordAddress = calculateMemoryWordSize(memory);
	const byteAddress = context.startingByteAddress + wordAddress * WORD_LENGTH;

	memory.set('__sleeper' + wordAddress, {
		wordAddress: context.startingByteAddress / WORD_LENGTH + wordAddress,
		wordSpan: 1,
		byteAddress,
		id: '__sleeper' + wordAddress,
		default: 0,
		type: MemoryTypes.int,
		isPointer: false,
		isPointingToInteger: false,
		isPointingToPointer: false,
		isInteger: true,
	});

	context.blockStack.push({
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		isModuleBlock: false,
		isGroupBlock: false,
		isLoop: false,
		isConditionBlock: false,
	});

	return {
		byteCode: [
			WASMInstruction.BLOCK,
			Type.VOID,
			// Increment counter
			...i32const(byteAddress),
			...i32const(byteAddress),
			...i32load(),
			...i32const(1),
			WASMInstruction.I32_ADD,
			...i32store(),
			// Return if the value of the counter is smaller than
			// the number specified in the argument
			...i32const(byteAddress),
			...i32load(),
			...i32const(timesToSkip),
			WASMInstruction.I32_LT_S,
			WASMInstruction.IF,
			Type.VOID,
			// WASMInstruction.RETURN,
			...br(1),
			WASMInstruction.ELSE,
			...i32const(byteAddress),
			...i32const(0),
			...i32store(),
			WASMInstruction.END,
		],
		context,
	};
};

export default skip;
