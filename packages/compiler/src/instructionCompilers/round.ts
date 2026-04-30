import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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
