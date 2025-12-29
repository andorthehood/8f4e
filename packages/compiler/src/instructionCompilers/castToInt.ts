import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToInt`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToInt: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });

		return saveByteCode(context, [WASMInstruction.I32_TUNC_F32_S]);
	}
);

export default castToInt;
