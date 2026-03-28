import { ArgumentType } from '../types';
import { saveByteCode } from '../utils/compilation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `wasm`.
 * @see [Instruction docs](../../docs/instructions/low-level.md)
 */
const wasm: InstructionCompiler = function (line, context) {
	const opcode = line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.LITERAL }>;
	return saveByteCode(context, [opcode.value]);
};

export default wasm;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('wasm instruction compiler', () => {
		it('emits the provided wasm opcode', () => {
			const context = createInstructionCompilerTestContext();

			wasm(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'wasm',
					arguments: [{ type: ArgumentType.LITERAL, value: 42, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
