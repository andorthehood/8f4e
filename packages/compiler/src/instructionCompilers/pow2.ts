import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `pow2`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const pow2: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		// Restore n's type for the segment so localSet can consume it.
		context.stack.push({ isInteger: true, isNonZero: false });

		const tempName = '__pow2Temp' + line.lineNumberAfterMacroExpansion;

		// Compute 2^n as (1 << n): save n, push 1, restore n, then shift left.
		// Using a single local avoids the doubly-nested compileSegment that `swap` would introduce.
		return compileSegment(
			[`local int ${tempName}`, `localSet ${tempName}`, 'push 1', `push ${tempName}`, 'shiftLeft'],
			context
		);
	}
);

export default pow2;
