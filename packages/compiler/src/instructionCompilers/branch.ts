import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { br } from '../wasmUtils/instructionHelpers';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branch`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branch: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		} else {
			return saveByteCode(context, br(line.arguments[0].value));
		}
	}
);

export default branch;
