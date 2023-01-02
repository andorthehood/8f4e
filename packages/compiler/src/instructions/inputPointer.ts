import { WORD_LENGTH } from '../consts';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const inputPointer: InstructionHandler = function (line, namespace, startingByteAddress) {
	const memory = new Map(namespace.memory);

	const wordAddress = calculateMemoryWordSize(memory);

	memory.set(line.arguments[0].value.toString(), {
		type: MemoryTypes.INPUT_POINTER,
		relativeWordAddress: wordAddress,
		wordSize: 1,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		default:
			line.arguments[1].type === ArgumentType.LITERAL
				? line.arguments[1].value
				: memory.get(line.arguments[1].value).byteAddress,
	});

	return { byteCode: [], namespace: { ...namespace, memory } };
};

export default inputPointer;
