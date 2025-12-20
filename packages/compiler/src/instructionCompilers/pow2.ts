import { ErrorCode } from '../errors';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const pow2: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
		onInvalidTypes: ErrorCode.EXPECTED_INTEGER_OPERAND,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		return compileSegment(['push 2', 'push 1', 'sub', 'swap', 'shiftLeft'], context);
	}
);

export default pow2;
