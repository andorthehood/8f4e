import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import { createInstructionCompilerTestContext } from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `dup`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const dup: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		const tempName = '__dupTemp' + line.lineNumber;

		context.stack.push(operand);

		return compileSegment(
			[
				`local ${operand.isInteger ? 'int' : 'float'} ${tempName}`,
				`localSet ${tempName}`,
				`localGet ${tempName}`,
				`localGet ${tempName}`,
			],
			context
		);
	}
);

export default dup;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('dup instruction compiler', () => {
		it('duplicates the top stack value', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			dup({ lineNumber: 3, instruction: 'dup', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				locals: context.namespace.locals,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
