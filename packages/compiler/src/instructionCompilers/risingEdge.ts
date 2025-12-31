import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `risingEdge`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const risingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation with minOperands: 1 guarantees at least 1 operand exists on the stack
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		const currentValueName = '__risingEdgeDetector_currentValue' + line.lineNumber;
		const previousValueName = '__risingEdgeDetector_previousValue' + line.lineNumber;

		return compileSegment(
			[
				`int ${previousValueName} 0`,
				`local int ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				'load',
				'greaterThan',
				'if int',
				'push 1',
				'else',
				'push 0',
				'ifEnd',
				`push &${previousValueName}`,
				`localGet ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default risingEdge;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('risingEdge instruction compiler', () => {
		it('compiles the rising edge segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			risingEdge({ lineNumber: 4, instruction: 'risingEdge', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				memory: context.namespace.memory,
				locals: context.namespace.locals,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
