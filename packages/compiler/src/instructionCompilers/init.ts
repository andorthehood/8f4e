import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `init`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const init: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const memory = { ...context.namespace.memory };

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
			const memoryItem = memory[line.arguments[1].value.substring(1)];

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
			const memoryItem = memory[memoryIdentifier];
			if (memoryItem && typeof memoryItem.default === 'object') {
				memoryItem.default[offset] = defaultValue;
			}
		} else {
			const memoryItem = memory[line.arguments[0].value];

			if (memoryItem) {
				memoryItem.default = defaultValue;
			}
		}

		return context;
	}
);

export default init;
