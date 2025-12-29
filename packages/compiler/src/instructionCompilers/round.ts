import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `round`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const round: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: false });

		return saveByteCode(context, [WASMInstruction.F32_NEAREST]);
	}
);

export default round;
