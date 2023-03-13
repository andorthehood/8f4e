import { WORD_LENGTH } from '../consts';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const memory: InstructionHandler = function (line, namespace, stack, startingByteAddress) {
	const memory = new Map(namespace.memory);

	const wordAddress = calculateMemoryWordSize(memory);

	let defaultValue = 0;

	if (!line.arguments[1]) {
		defaultValue = 0;
	} else if (line.arguments[1].type === ArgumentType.LITERAL) {
		defaultValue = line.arguments[1].value;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '&') {
		const memoryItem = memory.get(line.arguments[1].value.substring(1));

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}

		defaultValue = memoryItem.byteAddress;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		const constant = namespace.consts[line.arguments[1].value];

		if (!constant) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}

		defaultValue = constant.value;
	}

	memory.set(line.arguments[0].value.toString(), {
		type: MemoryTypes.WORD,
		relativeWordAddress: wordAddress,
		wordAddress: startingByteAddress / WORD_LENGTH + wordAddress,
		wordSize: 1,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		lineNumber: line.lineNumber,
		id: line.arguments[0].value.toString(),
		default: defaultValue,
		isInteger: Number.isInteger(defaultValue),
	});

	return { byteCode: [], namespace: { ...namespace, memory }, stack };
};

export default memory;
