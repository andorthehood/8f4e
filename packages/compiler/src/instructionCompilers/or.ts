import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `or`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const or: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		// We need to access operand values to track isNonZero for the OR operation
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: operand1.isNonZero || operand2.isNonZero });
		return saveByteCode(context, [WASMInstruction.I32_OR]);
	}
);

export default or;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('or instruction compiler', () => {
		it('emits I32_OR and tracks non-zero state', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: true });

			or({ lineNumber: 1, instruction: 'or', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
