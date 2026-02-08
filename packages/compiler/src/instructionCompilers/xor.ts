import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `xor`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const xor: InstructionCompiler = withValidation(
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
		context.byteCode.push(...[WASMInstruction.I32_XOR]);
		return context;
	}
);

export default xor;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('xor instruction compiler', () => {
		it('emits I32_XOR for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			xor({ lineNumber: 1, instruction: 'xor', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
