import { ErrorCode, getError } from '../compilerError';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, LocalDeclarationLine } from '../types';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler<LocalDeclarationLine> = withValidation<LocalDeclarationLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: LocalDeclarationLine, context) => {
		const typeArg = line.arguments[0];
		const nameArg = line.arguments[1];

		if (Object.prototype.hasOwnProperty.call(context.namespace.memory, nameArg.value)) {
			throw getError(ErrorCode.LOCAL_NAME_COLLISION_WITH_MEMORY, line, context, { identifier: nameArg.value });
		}

		context.locals[nameArg.value] = {
			isInteger: typeArg.value === 'int',
			...(typeArg.value === 'float64' ? { isFloat64: true } : {}),
			index: Object.keys(context.locals).length,
		};

		return context;
	}
);

export default local;
