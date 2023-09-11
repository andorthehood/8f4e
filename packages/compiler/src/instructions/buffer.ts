import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateMemoryWordSize, isInstructionIsInsideAModule } from '../utils';
import { WORD_LENGTH } from '../consts';

const buffer: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (line.arguments[2] && line.arguments[2].type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_VALUE, line, context);
	}

	const memory = new Map(context.namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);

	let wordSize = 1;

	if (line.arguments[1].type === ArgumentType.LITERAL) {
		wordSize = line.arguments[1].value;
	} else {
		const constant = context.namespace.consts[line.arguments[1].value];

		if (!constant) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		wordSize = constant.value;
	}

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
		isPointingToInteger: line.instruction === 'int*[]' || line.instruction === 'int**[]',
		isPointingToPointer: line.instruction === 'int**[]' || line.instruction === 'float**[]',
		type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
	});

	return { byteCode: [], context: { ...context, namespace: { ...context.namespace, memory } } };
};

export default buffer;
