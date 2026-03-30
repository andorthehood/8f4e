import { ErrorCode } from '../compilerError';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, LocalDeclarationLine } from '../types';

/**
 * Instruction compiler for `local`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const local: InstructionCompiler<LocalDeclarationLine> = withValidation<LocalDeclarationLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: LocalDeclarationLine, context) => {
		const typeArg = line.arguments[0];
		const nameArg = line.arguments[1];

		context.locals[nameArg.value] = {
			isInteger: typeArg.value === 'int',
			...(typeArg.value === 'float64' ? { isFloat64: true } : {}),
			index: Object.keys(context.locals).length,
		};

		return context;
	}
);

export default local;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('local instruction compiler', () => {
		it('adds a local variable', () => {
			const context = createInstructionCompilerTestContext();

			local(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'local',
					arguments: [classifyIdentifier('int'), classifyIdentifier('count')],
				} as AST[number],
				context
			);

			expect(context.locals).toMatchSnapshot();
		});
	});
}
