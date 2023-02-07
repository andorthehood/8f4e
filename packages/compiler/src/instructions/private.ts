import { WORD_LENGTH } from '../consts';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const _private: InstructionHandler = function (line, namespace, startingByteAddress) {
	const memory = new Map(namespace.memory);

	const wordAddress = calculateMemoryWordSize(memory);

	let defaultValue = 0;

	if (line.arguments[1].type === ArgumentType.LITERAL) {
		defaultValue = line.arguments[1].value;
	} else {
		const memoryItem = memory.get(line.arguments[1].value);
		if (!memoryItem) {
			throw `'1003: Undeclared identifier: '${line.arguments[1].value}'`;
		}
		defaultValue = memoryItem.byteAddress;
	}

	memory.set(line.arguments[0].value.toString(), {
		type: MemoryTypes.PRIVATE,
		relativeWordAddress: wordAddress,
		wordSize: 1,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		lineNumber: line.lineNumber,
		id: line.arguments[0].value.toString(),
		default: defaultValue,
	});

	return { byteCode: [], namespace: { ...namespace, memory } };
};

export default _private;
