import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateWordAlignedSizeOfMemory } from '../utils';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { InstructionCompiler, MemoryTypes } from '../types';

const memory: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);

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
			const memoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = memoryItem.byteAddress;
		} else if (line.arguments[1].type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '$') {
			const memoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
			const constant = context.namespace.consts[line.arguments[1].value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = constant.value;
		}

		context.namespace.memory[line.arguments[0].value] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
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
		};

		return context;
	}
);

export default memory;
