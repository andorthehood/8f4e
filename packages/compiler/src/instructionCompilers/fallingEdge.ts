import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `fallingEdge`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const fallingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation with minOperands: 1 guarantees at least 1 operand exists on the stack
		const operand = context.stack.pop()!;

		const currentValueName = '__fallingEdgeDetector_currentValue' + line.lineNumber;
		const previousValueName = '__fallingEdgeDetector_previousValue' + line.lineNumber;
		const memoryType = operand.isInteger ? 'int' : 'float';
		const loadInstruction = operand.isInteger ? 'load' : 'loadFloat';

		// Restore the operand for the segment so type checks apply to the original value.
		context.stack.push(operand);

		return compileSegment(
			[
				`${memoryType} ${previousValueName} 0`,
				`local ${memoryType} ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				loadInstruction,
				'lessThan',
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

export default fallingEdge;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('fallingEdge instruction compiler', () => {
		it('compiles the falling edge segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			fallingEdge({ lineNumber: 5, instruction: 'fallingEdge', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				memory: context.namespace.memory,
				locals: context.namespace.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
