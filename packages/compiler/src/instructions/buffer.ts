import { WORD_LENGTH } from '../consts';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { calculateMemoryWordSize } from '../utils';

const buffer: InstructionHandler = function (line, namespace, stack, startingByteAddress) {
	if (!line.arguments[0] || !line.arguments[1] || !line.arguments[2]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line);
	}

	if (
		line.arguments[0].value !== 'int' &&
		line.arguments[0].value !== 'float' &&
		line.arguments[0].value !== 'float*' &&
		line.arguments[0].value !== 'int*'
	) {
		throw getError(ErrorCode.UNKNOWN_ERROR, line);
	}

	if (line.arguments[1].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line);
	}

	if (line.arguments[2].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line);
	}

	if (line.arguments[3] && line.arguments[3].type === ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_VALUE, line);
	}

	const memory = new Map(namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);
	const wordSize = line.arguments[2].value;

	memory.set(line.arguments[1].value, {
		relativeWordAddress: wordAddress,
		wordSize: wordSize,
		wordAddress: startingByteAddress / WORD_LENGTH + wordAddress,
		id: line.arguments[1].value,
		lineNumber: line.lineNumber,
		byteAddress: startingByteAddress + wordAddress * WORD_LENGTH,
		default: new Array(wordSize).fill(line.arguments[3]?.value || 0),
		isInteger:
			line.arguments[0].value === 'int' || line.arguments[0].value === 'int*' || line.arguments[0].value === 'float*',
		isPointer: line.arguments[0].value === 'int*' || line.arguments[0].value === 'float*',
		isPointingToInteger: line.arguments[0].value === 'int*',
		type: line.arguments[0].value as unknown as MemoryTypes,
	});

	return { byteCode: [], namespace: { ...namespace, memory }, stack };
};

export default buffer;
