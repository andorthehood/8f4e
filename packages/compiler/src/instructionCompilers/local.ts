import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		context.namespace.locals[line.arguments[1].value] = {
			isInteger: line.arguments[0].value === 'int',
			index: Object.keys(context.namespace.locals).length,
		};

		return context;
	}
);

export default local;
