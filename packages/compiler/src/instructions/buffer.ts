import { WORD_LENGTH } from '../consts';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const buffer: InstructionHandler = function (line, context) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	if (line.arguments[2] && line.arguments[2].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	const memory = new Map(context.namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);
	const wordSize = line.arguments[1].value;

	memory.set(line.arguments[0].value, {
		relativeWordAddress: wordAddress,
		wordSize: wordSize,
		wordAddress: context.startingByteAddress / WORD_LENGTH + wordAddress,
		id: line.arguments[0].value,
		lineNumber: line.lineNumber,
		byteAddress: context.startingByteAddress + wordAddress * WORD_LENGTH,
		default: new Array(wordSize).fill(line.arguments[2]?.value || 0),
		isInteger: line.instruction === 'int[]' || line.instruction === 'int*[]' || line.instruction === 'float*[]',
		isPointer: line.instruction === 'int*[]' || line.instruction === 'float*[]',
		isPointingToInteger: line.instruction === 'int*',
		type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
	});

	return { byteCode: [], context: { ...context, namespace: { ...context.namespace, memory } } };
};

export default buffer;
