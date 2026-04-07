import createDeclarationCompiler from './createDeclarationCompiler';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST, InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `int`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('int instruction compiler', () => {
		it('creates an int memory entry', () => {
			const context = createInstructionCompilerTestContext();

			int(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int',
					arguments: [classifyIdentifier('counter')],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});
	});
}
