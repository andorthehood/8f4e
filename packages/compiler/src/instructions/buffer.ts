import { WORD_LENGTH } from '../consts';
import { ErrorCode, getError } from '../errors';
import { InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const buffer: InstructionHandler = function (line, namespace, stack, startingByteAddress) {
	if (!line.arguments[0] || !line.arguments[1] || !line.arguments[2]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line);
	}

	const memory = new Map(namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);
	const wordSize = line.arguments[1].value as number;

	memory.set(line.arguments[0].value.toString(), {
		type: MemoryTypes.ARRAY,
		relativeWordAddress: wordAddress,
		wordSize: wordSize,
		wordAddress: startingByteAddress / WORD_LENGTH + wordAddress,
		id: line.arguments[0].value.toString(),
		lineNumber: line.lineNumber,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		default: new Array(wordSize).fill(line.arguments[2].value),
		isInteger: true,
	});

	return { byteCode: [], namespace: { ...namespace, memory }, stack };
};

export default buffer;
