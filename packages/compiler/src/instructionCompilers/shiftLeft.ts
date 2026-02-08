import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

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
		context.byteCode.push(...[WASMInstruction.I32_SHL]);
		return context;
	}
);

export default shiftLeft;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('shiftLeft instruction compiler', () => {
		it('emits I32_SHL for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			shiftLeft({ lineNumber: 1, instruction: 'shiftLeft', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
