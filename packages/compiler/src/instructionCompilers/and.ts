import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `and`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const and: InstructionCompiler = withValidation(
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
		context.byteCode.push(...[WASMInstruction.I32_AND]);
		return context;
	}
);

export default and;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('and instruction compiler', () => {
		it('emits I32_AND for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			and({ lineNumber: 1, instruction: 'and', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('rejects non-integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

			expect(() => {
				and({ lineNumber: 1, instruction: 'and', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
