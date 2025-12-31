import { ErrorCode, getError } from '../errors';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `remainder`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const remainder: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		context.stack.pop()!; // Pop second operand (not used since type is already validated)

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_REM_S]);
	}
);

export default remainder;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('remainder instruction compiler', () => {
		it('emits I32_REM_S for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: true });

			remainder({ lineNumber: 1, instruction: 'remainder', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws on division by zero', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: false });

			expect(() => {
				remainder({ lineNumber: 1, instruction: 'remainder', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
