import createInstructionCompilerTestContext from '../utils/testUtils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToFloat`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToFloat: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });

		context.byteCode.push(...[WASMInstruction.F32_CONVERT_I32_S]);
		return context;
	}
);

export default castToFloat;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('castToFloat instruction compiler', () => {
		it('converts int operand to float', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			castToFloat({ lineNumber: 1, instruction: 'castToFloat', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
