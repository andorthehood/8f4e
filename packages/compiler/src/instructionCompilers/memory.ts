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

		let defaultValue = 0;

		if (line.arguments[0]?.type === ArgumentType.LITERAL) {
			// If the first argument is a literal, use its value as the default value.
			// E.g.: int 42
			defaultValue = line.arguments[0].value;
		} else if (line.arguments[0]?.type === ArgumentType.IDENTIFIER) {
			// If the first argument is a reference to a constant, get its value.
			// If it's not a constant, then we assume it's a memory identifier and handle it later.
			// E.g.: int CONSTANT_NAME
			const constant = context.namespace.consts[line.arguments[0].value];

			if (constant) {
				defaultValue = constant.value;
			}
		}

		if (line.arguments[1]?.type === ArgumentType.LITERAL) {
			// If the second argument is a literal, use its value.
			// E.g.: int foo 42
			defaultValue = line.arguments[1].value;
		} else if (line.arguments[1]?.type === ArgumentType.IDENTIFIER && /&(\S+)\.(\S+)/.test(line.arguments[1].value)) {
			// If the second argument is a reference to another module's memory item, do nothing.
			// Intermodular references are resolved later.
			// E.g.: int foo &moduleName.memoryItem
		} else if (line.arguments[1]?.type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '&') {
			// If the second argument is a reference to another memory item's address in the same module, get its byte address.
			// E.g.: int foo &memoryItem
			const memoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = memoryItem.byteAddress;
		} else if (line.arguments[1]?.type === ArgumentType.IDENTIFIER && line.arguments[1].value[0] === '$') {
			// If the second argument is a reference to another memory item's word-aligned size in the same module, get its word-aligned size.
			// E.g.: int foo $memoryItem
			const memoryItem = context.namespace.memory[line.arguments[1].value.substring(1)];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (line.arguments[1]?.type === ArgumentType.IDENTIFIER) {
			// If the second argument is a reference to a constant, get its value.
			// E.g.: int foo CONSTANT_NAME
			const constant = context.namespace.consts[line.arguments[1].value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			defaultValue = constant.value;
		}

		const id =
			line.arguments[0]?.type === ArgumentType.IDENTIFIER ? line.arguments[0].value : '__anonymous__' + line.lineNumber;

		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			id,
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
