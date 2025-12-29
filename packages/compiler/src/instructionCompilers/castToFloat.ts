import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToFloat`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });

		return saveByteCode(context, [WASMInstruction.F32_CONVERT_I32_S]);
	}
);

export default castToFloat;
