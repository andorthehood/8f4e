import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `swap`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const swap: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
	},
	(line, context) => {
		// Non-null assertions are safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		const tempAName = '__swapTempA' + line.lineNumber;
		const tempBName = '__swapTempB' + line.lineNumber;

		context.stack.push(operand2);
		context.stack.push(operand1);

		return compileSegment(
			[
				`local ${operand1.isInteger ? 'int' : 'float'} ${tempAName}`,
				`local ${operand2.isInteger ? 'int' : 'float'} ${tempBName}`,
				`localSet ${tempAName}`,
				`localSet ${tempBName}`,
				`localGet ${tempAName}`,
				`localGet ${tempBName}`,
			],
			context
		);
	}
);

export default swap;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('swap instruction compiler', () => {
		it('swaps the top two stack values', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: true });

			swap({ lineNumber: 3, instruction: 'swap', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				locals: context.namespace.locals,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
