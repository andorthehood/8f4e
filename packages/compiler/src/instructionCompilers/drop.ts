import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `drop`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const drop: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		context.stack.pop();

		context.byteCode.push(...[WASMInstruction.DROP]);
		return context;
	}
);

export default drop;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('drop instruction compiler', () => {
		it('drops the top stack value', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: true });

			drop({ lineNumber: 1, instruction: 'drop', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
