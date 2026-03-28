import { ArgumentType } from '../types';
import br from '../wasmUtils/controlFlow/br';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branch`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branch: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const depth = line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.LITERAL }>;
		return saveByteCode(context, br(depth.value));
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
