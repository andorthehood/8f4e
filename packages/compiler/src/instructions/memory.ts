import { ArgumentType, InstructionHandler, MemoryTypes } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateMemoryWordSize, isInstructionIsInsideAModule } from '../utils';
import { WORD_LENGTH } from '../consts';

const memory: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const memory = new Map(context.namespace.memory);
	const wordAddress = calculateMemoryWordSize(memory);

	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	let defaultValue = 0;

	if (!line.arguments[1]) {
		defaultValue = 0;
	} else if (line.arguments[1].type === ArgumentType.LITERAL) {
		defaultValue = line.arguments[1].value;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && /&(\S+)\.(\S+)/.test(line.arguments[1].value)) {
		// Do nothing
		// Intermodular references are resolved later
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '&') {
		const memoryItem = memory.get(line.arguments[1].value.substring(1));

		if (!memoryItem) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		defaultValue = memoryItem.byteAddress;
	} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		const constant = context.namespace.consts[line.arguments[1].value];

		if (!constant) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
		}

		defaultValue = constant.value;
	}

	memory.set(line.arguments[0].value, {
		wordAddress: context.startingByteAddress / WORD_LENGTH + wordAddress,
		wordSpan: 1,
		byteAddress: context.startingByteAddress + wordAddress * WORD_LENGTH,
		id: line.arguments[0].value,
		default: defaultValue,
		type: line.instruction as unknown as MemoryTypes,
		isPointer:
			line.instruction === 'int*' ||
			line.instruction === 'float*' ||
			line.instruction === 'int**' ||
			line.instruction === 'float**',
		isPointingToInteger: line.instruction === 'int*' || line.instruction === 'int**',
		isPointingToPointer: line.instruction === 'int**' || line.instruction === 'float**',
		isInteger:
			line.instruction === 'int' ||
			line.instruction === 'int*' ||
			line.instruction === 'float*' ||
			line.instruction === 'int**' ||
			line.instruction === 'float**',
	});

	return { byteCode: [], context: { ...context, namespace: { ...context.namespace, memory } } };
};

export default memory;
