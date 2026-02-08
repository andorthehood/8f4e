import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils/compilation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `clearStack`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const clearStack: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const length = context.stack.length;
		context.stack = [];

		return saveByteCode(context, new Array(length).fill(WASMInstruction.DROP));
	}
);

export default clearStack;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('clearStack instruction compiler', () => {
		it('drops all stack values', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: false, isNonZero: true });

			clearStack({ lineNumber: 1, instruction: 'clearStack', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
