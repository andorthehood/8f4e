import { ArgumentType } from '../types';
import { br_if } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, BranchIfTrueLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branchIfTrue`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfTrue: InstructionCompiler<BranchIfTrueLine> = withValidation<BranchIfTrueLine>(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line: BranchIfTrueLine, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;
		return saveByteCode(context, br_if(line.arguments[0].value));
	}
);

export default branchIfTrue;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branchIfTrue instruction compiler', () => {
		it('emits br_if bytecode', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			branchIfTrue(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'branchIfTrue',
					arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
