import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `shiftRightUnsigned`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const shiftRightUnsigned: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Pop operands (withValidation ensures they exist and are integers)
		context.stack.pop();
		context.stack.pop();

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_SHR_U]);
	}
);

export default shiftRightUnsigned;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('shiftRightUnsigned instruction compiler', () => {
		it('emits I32_SHR_U for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			shiftRightUnsigned({ lineNumber: 1, instruction: 'shiftRightUnsigned', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
