import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToFloat64`.
 * Casts int32 and float32 values to float64. Float64 input is a no-op.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat64: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({
			isInteger: false,
			isFloat64: true,
			isNonZero: operand.isNonZero,
		});

		if (operand.isInteger) {
			return saveByteCode(context, [WASMInstruction.F64_CONVERT_I32_S]);
		}

		// Float64 input needs no opcode conversion.
		if (operand.isFloat64) {
			return context;
		}

		return saveByteCode(context, [WASMInstruction.F64_PROMOTE_F32]);
	}
);

export default castToFloat64;
