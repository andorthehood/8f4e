import { ArgumentType } from '../types';
import { br } from '@8f4e/compiler-wasm-utils';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, BranchLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branch`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branch: InstructionCompiler<BranchLine> = withValidation<BranchLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: BranchLine, context) => {
		return saveByteCode(context, br(line.arguments[0].value));
	}
);

export default branch;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branch instruction compiler', () => {
		it('emits br bytecode', () => {
			const context = createInstructionCompilerTestContext();

			branch(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'branch',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
