import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `shiftRight`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const shiftRight: InstructionCompiler = withValidation(
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
		return saveByteCode(context, [WASMInstruction.I32_SHR_S]);
	}
);

export default shiftRight;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('shiftRight instruction compiler', () => {
		it('emits I32_SHR_S for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			shiftRight({ lineNumber: 1, instruction: 'shiftRight', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
