import createDeclarationCompiler from './createDeclarationCompiler';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST, InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `float`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float: InstructionCompiler = createDeclarationCompiler({
	baseType: 'float',
	truncate: false,
	nonPointerElementWordSize: 4,
});

export default float;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('float instruction compiler', () => {
		it('creates a float memory entry', () => {
			const context = createInstructionCompilerTestContext();

			float(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float',
					arguments: [classifyIdentifier('temperature')],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});
	});
}
