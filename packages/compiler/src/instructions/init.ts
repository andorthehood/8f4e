import { ArgumentType, InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideAModule } from '../utils';

const memory: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	const memory = new Map(context.namespace.memory);

	let defaultValue = 0;

	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (line.arguments[1].type === ArgumentType.LITERAL) {
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

	if (/(\S+)\[(\d+)\]/.test(line.arguments[0].value)) {
		const [, memoryIdentifier, offset] = line.arguments[0].value.match(/(\S+)\[(\d+)\]/) as [never, string, string];
		const memoryItem = memory.get(memoryIdentifier);
		if (memoryItem && memoryItem.default instanceof Map) {
			memoryItem.default.set(parseInt(offset, 10), defaultValue);
		}
	} else {
		const memoryItem = memory.get(line.arguments[0].value);

		if (memoryItem) {
			memoryItem.default;
			memoryItem.default = defaultValue;
		}
	}

	return { byteCode: [], context: { ...context, namespace: { ...context.namespace, memory } } };
};

export default memory;
