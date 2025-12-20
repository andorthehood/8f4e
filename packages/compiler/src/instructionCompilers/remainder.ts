import { ErrorCode, getError } from '../errors';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const remainder: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		context.stack.pop()!; // Pop second operand (not used since type is already validated)

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_REM_S]);
	}
);

export default remainder;
