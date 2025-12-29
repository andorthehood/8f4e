import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `shiftLeft`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const shiftLeft: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		context.stack.pop()!;
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_SHL]);
	}
);

export default shiftLeft;
