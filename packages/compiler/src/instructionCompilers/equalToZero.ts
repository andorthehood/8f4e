import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `equalToZero`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equalToZero: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.I32_EQZ]);
		} else {
			context.stack.push(operand);
			return compileSegment(['push 0.0', 'equal'], context);
		}
	}
);

export default equalToZero;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('equalToZero instruction compiler', () => {
		it('emits I32_EQZ for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			equalToZero({ lineNumber: 1, instruction: 'equalToZero', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits float comparison segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false });

			equalToZero({ lineNumber: 1, instruction: 'equalToZero', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
