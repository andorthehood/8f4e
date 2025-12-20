import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { saveByteCode } from '../utils';
import { localSet } from '../wasmUtils/instructionHelpers';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const _localSet: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
		onInsufficientOperands: ErrorCode.INSUFFICIENT_OPERANDS,
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			const operand = context.stack.pop()!;
			const local = context.namespace.locals[line.arguments[0].value];

			if (!local) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			if (local.isInteger && !operand.isInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}

			if (!local.isInteger && operand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}

			return saveByteCode(context, localSet(local.index));
		} else {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}
	}
);

export default _localSet;
