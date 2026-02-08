import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `sqrt`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const sqrt: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: true });
		context.byteCode.push(...[WASMInstruction.F32_SQRT]);
		return context;
	}
);

export default sqrt;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('sqrt instruction compiler', () => {
		it('emits F32_SQRT for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			sqrt({ lineNumber: 1, instruction: 'sqrt', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
