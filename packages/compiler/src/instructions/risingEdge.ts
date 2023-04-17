import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';
import { WORD_LENGTH } from '../consts';
import { f32load, f32store, i32const, i32load, i32store, localGet, localSet } from '../wasmUtils/instructionHelpers';
import Type from '../wasmUtils/type';
import { ErrorCode, getError } from '../errors';

const risingEdge: InstructionHandler = function (line, context) {
	const operand = context.stack.pop();

	if (!operand) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const local = {
		index: context.namespace.locals.size,
		isInteger: operand.isInteger,
	};
	context.namespace.locals.set('__risingEdgeDetector_currentValue' + line.lineNumber, local);

	const memory = context.namespace.memory;
	const wordAddress = calculateMemoryWordSize(memory);
	const byteAddress = context.startingByteAddress + wordAddress * WORD_LENGTH;
	const memoryItemId = '__risingEdgeDetector_previousValue' + line.lineNumber;

	memory.set(memoryItemId, {
		relativeWordAddress: wordAddress,
		wordAddress: context.startingByteAddress / WORD_LENGTH + wordAddress,
		wordSize: 1,
		byteAddress,
		lineNumber: line.lineNumber,
		id: memoryItemId,
		default: 0,
		type: MemoryTypes.int,
		isPointer: false,
		isPointingToInteger: false,
		isInteger: operand.isInteger,
	});

	context.stack.push({ isInteger: true });

	return {
		byteCode: [
			...localSet(local.index),
			...localGet(local.index),
			// Load previous value
			...i32const(byteAddress),
			...(operand.isInteger ? i32load() : f32load()),
			operand.isInteger ? WASMInstruction.I32_GT_S : WASMInstruction.F32_GT,
			WASMInstruction.IF,
			Type.I32,
			...i32const(1),
			WASMInstruction.ELSE,
			...i32const(0),
			WASMInstruction.END,

			// Save previous value
			...i32const(byteAddress),
			...localGet(local.index),
			...(operand.isInteger ? i32store() : f32store()),
		],
		context,
	};
};

export default risingEdge;
