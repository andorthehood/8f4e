import { WORD_LENGTH } from '../consts';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const memory: InstructionHandler = function (line, namespace, stack, blockStack, startingByteAddress) {
	const memory = new Map(namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, namespace, stack, blockStack);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, namespace, stack, blockStack);
	}

	if (
		line.arguments[0].value !== 'int' &&
		line.arguments[0].value !== 'float' &&
		line.arguments[0].value !== 'float*' &&
		line.arguments[0].value !== 'int*'
	) {
		throw getError(ErrorCode.UNKNOWN_ERROR, line, namespace, stack, blockStack);
	}

	if (line.arguments[1].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, namespace, stack, blockStack);
	}

	let defaultValue = 0;

	if (!line.arguments[2]) {
		defaultValue = 0;
	} else if (line.arguments[2].type === ArgumentType.LITERAL) {
		defaultValue = line.arguments[2].value;
	} else if (line.arguments[2].type === ArgumentType.IDENTIFIER && line.arguments[2].value[0] === '&') {
		const memoryItem = memory.get(line.arguments[2].value.substring(1));

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, namespace, stack, blockStack);
		}

		defaultValue = memoryItem.byteAddress;
	} else if (line.arguments[2].type === ArgumentType.IDENTIFIER) {
		const constant = namespace.consts[line.arguments[2].value];

		if (!constant) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, namespace, stack, blockStack);
		}

		defaultValue = constant.value;
	}

	memory.set(line.arguments[1].value, {
		relativeWordAddress: wordAddress,
		wordAddress: startingByteAddress / WORD_LENGTH + wordAddress,
		wordSize: 1,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		lineNumber: line.lineNumber,
		id: line.arguments[1].value,
		default: defaultValue,
		type: line.arguments[0].value as unknown as MemoryTypes,
		isPointer: line.arguments[0].value === 'int*' || line.arguments[0].value === 'float*',
		isPointingToInteger: line.arguments[0].value === 'int*',
		isInteger:
			line.arguments[0].value === 'int' || line.arguments[0].value === 'int*' || line.arguments[0].value === 'float*',
	});

	return { byteCode: [], namespace: { ...namespace, memory }, stack, blockStack };
};

export default memory;
