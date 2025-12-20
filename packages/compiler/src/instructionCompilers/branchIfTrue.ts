import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { br_if } from '../wasmUtils/instructionHelpers';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const branchIfTrue: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		}

		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		return saveByteCode(context, br_if(line.arguments[0].value));
	}
);

export default branchIfTrue;
