import { WORD_LENGTH } from '../consts';
import { InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const buffer: InstructionHandler = function (line, namespace, startingByteAddress) {
	if (!line.arguments[0] || !line.arguments[1] || !line.arguments[2]) {
		throw '1002: Missing argument';
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
	});

	return { byteCode: [], namespace: { ...namespace, memory } };
};

export default buffer;
