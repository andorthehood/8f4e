import { prefixedInstruction, WASMInstruction, WASMMiscInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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

		// Use the non-trapping saturating conversion so NaN and out-of-range floats do not stop the runtime.
		return saveByteCode(
			context,
			prefixedInstruction(
				WASMInstruction.MISC,
				operand.isFloat64 ? WASMMiscInstruction.I32_TRUNC_SAT_F64_S : WASMMiscInstruction.I32_TRUNC_SAT_F32_S
			)
		);
	}
);

export default castToInt;
